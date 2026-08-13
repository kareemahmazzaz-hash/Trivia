// Exposes one consistent API (gameClient.*) to host.js / tv.js / player.js so
// those files never need to know whether we're on LAN (Socket.IO) or online
// (Firebase). Which one is used is decided by TRANSPORT in js/config.js.
const gameClient = (function () {
  let listeners = [];
  let state = { phase: "setup" };

  // Firebase clock skew fix: buzzExpireAt is written by whichever device
  // called startBuzzTimer/expireBuzz (the host), then read back and diffed
  // against Date.now() on OTHER devices (TV, host itself) to render the
  // countdown. If a device's own clock is off from the others' by even a
  // couple seconds, the countdown shows a wrong starting number (e.g. "12s"
  // instead of "10s") purely from clock drift, not any real delay. Firebase
  // exposes ".info/serverTimeOffset" - the gap between this device's clock
  // and Firebase's server clock - specifically to correct for this. serverNow()
  // below is Date.now() adjusted by that offset, and every write/read of
  // buzzExpireAt uses it instead of raw Date.now(), so all devices agree on
  // "now" regardless of how their own system clocks are set. On LAN
  // (Socket.IO) there's no such offset concept - all devices talk to the same
  // local server directly - so serverTimeOffset just stays 0 there.
  let serverTimeOffset = 0;
  function serverNow() {
    return Date.now() + serverTimeOffset;
  }

  function notify() {
    listeners.forEach((fn) => fn(state));
  }

  // How long (ms) the current top buzzer has to be judged before their buzz
  // auto-expires and the next-in-line becomes the new top buzzer.
  const BUZZ_TIMEOUT_MS = 10000;

  // How long (ms) the TV's "big buzzer" wrong-answer sound effect takes to
  // play out. When a buzzer's 10s runs out, the next-in-line's countdown is
  // held off for this same duration, so nobody's fresh 10s starts ticking
  // underneath the buzzer sound. Keep this in sync with the matching
  // constant in server.js (LAN path) and tv.js (where the sound is played).
  const BUZZ_WRONG_SOUND_MS = 1500;

  function freshState() {
    return {
      phase: "setup", step: null, players: {}, teams: {}, scores: {}, manual: false,
      category: null, questionIndex: -1, wheelTarget: null, lastWheelTarget: null, pendingJoker: false,
      tiebreaker: false, categoryOrders: {}, categoryPointers: {},
      buzzesOpen: false, buzzes: {},
      // Buzzers stay closed after a question is shown until the host taps
      // "🔔 Buzzers". buzzExpireAt/buzzTopPid track the 10s elimination
      // countdown for whichever buzz is currently first in line. buzzDelayUntil
      // is set for BUZZ_WRONG_SOUND_MS after a buzz expires, so the host's
      // loop holds off starting the next buzzer's timer until the "wrong"
      // sound effect has finished playing on the TV.
      buzzExpireAt: null, buzzTopPid: null, buzzDelayUntil: null
    };
  }

  function genId() {
    return Math.random().toString(36).slice(2, 10);
  }

  // ---------------- LAN (Socket.IO) ----------------
  function initLan(onStatus) {
    const socket = io();
    socket.on("connect", () => onStatus && onStatus("connected"));
    socket.on("connect_error", () => onStatus && onStatus("error"));
    socket.on("state:update", (s) => { state = s; notify(); });

    return {
      startGame: (groups, manual) => socket.emit("host:startGame", { groups, manual: !!manual }),
      openLobby: () => socket.emit("host:openLobby"),
      startQuestions: () => socket.emit("host:startQuestions"),
      spinCategory: () => socket.emit("host:spinCategory"),
      chooseJokerCategory: (key) => socket.emit("host:chooseJokerCategory", key),
      confirmCategory: () => socket.emit("host:confirmCategory"),
      next: () => socket.emit("host:next"),
      startTiebreaker: () => socket.emit("host:startTiebreaker"),
      nextTiebreakQuestion: () => socket.emit("host:nextTiebreakQuestion"),
      finishGame: () => socket.emit("host:finishGame"),
      score: (teamIdx, delta) => socket.emit("host:score", { teamIdx, delta }),
      setScore: (teamIdx, value) => socket.emit("host:setScore", { teamIdx, value }),
      reset: () => socket.emit("host:reset"),
      setTeamName: (teamIdx, name) => socket.emit("player:setTeamName", { teamIdx, name }),
      join: (name, cb) => socket.emit("player:join", { name }, cb),
      rejoin: (name, pid, cb) => socket.emit("player:rejoin", { name, pid }, cb),
      buzz: (name, pid) => socket.emit("player:buzz", { name, pid }),
      openBuzzers: () => socket.emit("host:openBuzzers"),
      startBuzzTimer: (pid) => socket.emit("host:startBuzzTimer", { pid }),
      expireBuzz: (pid) => socket.emit("host:expireBuzz", { pid })
    };
  }

  // ---------------- Firebase ----------------
  function initFirebase(onStatus) {
    firebase.initializeApp(firebaseConfig);
    const db = firebase.database();
    const ROOT = "trivia";
    const r = (p) => db.ref(p ? `${ROOT}/${p}` : ROOT);

    let connectedOnce = false;
    db.ref(".info/connected").on("value", (snap) => {
      if (snap.val() === true) { connectedOnce = true; onStatus && onStatus("connected"); }
      else if (connectedOnce) onStatus && onStatus("error");
    });

    // Keep serverTimeOffset in sync with Firebase's clock for as long as
    // we're connected, so serverNow() stays accurate on this device.
    db.ref(".info/serverTimeOffset").on("value", (snap) => {
      serverTimeOffset = snap.val() || 0;
    });

    // Every write triggers multiple "value" listeners (state/players/teams/
    // scores/buzzes), each of which calls recompute(). Those calls can
    // resolve out of order. This counter makes sure only the most recently
    // *started* recompute is ever allowed to actually apply its result, so a
    // slow/stale read can never clobber a newer one.
    let recomputeGen = 0;
    async function recompute() {
      const myGen = ++recomputeGen;
      let s, players, teams, scores, buzzes;
      try {
        [s, players, teams, scores, buzzes] = await Promise.all([
          r("state").once("value"), r("players").once("value"),
          r("teams").once("value"), r("scores").once("value"), r("buzzes").once("value")
        ]);
      } catch (err) {
        console.error("[gameClient] failed to read state:", err);
        return;
      }
      if (myGen !== recomputeGen) return; // superseded by a newer read
      state = {
        ...(s.val() || { phase: "setup" }),
        players: players.val() || {},
        teams: teams.val() || {},
        scores: scores.val() || {},
        buzzes: buzzes.val() || {}
      };
      notify();
    }
    ["state", "players", "teams", "scores", "buzzes"].forEach((path) => r(path).on("value", recompute));

    async function clearBuzzFor(nextState) {
      const key = buzzKey(nextState);
      await r(`buzzes/${key}`).remove();
    }

    return {
      startGame: async (groups, manual) => {
        const { teams, players, scores } = buildTeamsFromGroups(groups);
        await r().set({
          state: { ...freshState(), phase: "teams", manual: !!manual },
          players, teams, scores, buzzes: null
        });
      },

      openLobby: () => r("state").update({ phase: "lobby" }),

      startQuestions: async () => {
        const categoryOrders = buildAllDrawOrders();
        await r("state").update({
          phase: "question", step: "category",
          category: null, questionIndex: -1, wheelTarget: null, pendingJoker: false,
          tiebreaker: false, categoryOrders, categoryPointers: {},
          buzzesOpen: false, buzzExpireAt: null, buzzTopPid: null, buzzDelayUntil: null
        });
      },

      // Host spins the wheel: pick a random available slot and broadcast it
      // so the TV can animate toward it.
      spinCategory: async () => {
        const target = pickWheelTarget(state);
        if (target == null) return;
        const key = WHEEL_KEYS[target];
        await r("state").update({
          wheelTarget: target,
          lastWheelTarget: target,
          pendingJoker: key === "joker",
          category: key === "joker" ? null : key
        });
      },

      // Host picks a category after landing on Joker.
      chooseJokerCategory: async (key) => {
        await r("state").update({ category: key, pendingJoker: false });
      },

      // Host confirms the chosen category: draws the next question from it.
      // Buzzers stay CLOSED here - the host has to tap "🔔 Buzzers" once
      // they've finished reading the question aloud.
      confirmCategory: async () => {
        if (!state.category) return;
        const { questionIndex, nextPointer } = drawNextQuestionIndex(state, state.category);
        const updates = {
          step: "question", questionIndex, buzzesOpen: false, buzzExpireAt: null, buzzTopPid: null, buzzDelayUntil: null,
          [`categoryPointers/${state.category}`]: nextPointer
        };
        await r("state").update(updates);
        await clearBuzzFor({ ...state, category: state.category, questionIndex, step: "question" });
      },

      next: async () => {
        const result = computeNextStep(state);
        if (!result) return;
        const updates = { step: result.step, buzzesOpen: result.buzzesOpen, buzzExpireAt: null, buzzTopPid: null, buzzDelayUntil: null };
        if (result.resetCategory) {
          updates.category = null;
          updates.questionIndex = -1;
          updates.wheelTarget = null;
          updates.pendingJoker = false;
        }
        if (result.hasMorePolitics !== undefined) updates.hasMorePolitics = result.hasMorePolitics;
        await r("state").update(updates);
        if (result.clearBuzz) await clearBuzzFor({ ...state, ...updates });
      },

      startTiebreaker: async () => {
        const { questionIndex, nextPointer } = drawNextQuestionIndex(state, "politics");
        const updates = {
          tiebreaker: true, category: "politics", questionIndex,
          step: "question", buzzesOpen: false, buzzExpireAt: null, buzzTopPid: null, buzzDelayUntil: null,
          wheelTarget: null, pendingJoker: false,
          "categoryPointers/politics": nextPointer
        };
        await r("state").update(updates);
        await clearBuzzFor({ ...state, category: "politics", questionIndex, step: "question" });
      },

      nextTiebreakQuestion: async () => {
        const { questionIndex, nextPointer } = drawNextQuestionIndex(state, "politics");
        const updates = {
          questionIndex, step: "question", buzzesOpen: false, buzzExpireAt: null, buzzTopPid: null, buzzDelayUntil: null,
          "categoryPointers/politics": nextPointer
        };
        await r("state").update(updates);
        await clearBuzzFor({ ...state, category: "politics", questionIndex, step: "question" });
      },

      // Host taps "🔔 Buzzers" once ready - only THEN can players buzz in.
      openBuzzers: async () => {
        await r("state").update({ buzzesOpen: true, buzzExpireAt: null, buzzTopPid: null, buzzDelayUntil: null });
      },

      // Starts (or restarts) the 10s elimination countdown for whichever
      // buzz is now first in line. Also clears buzzDelayUntil - we're past
      // the post-expiry delay now that a fresh timer is starting.
      startBuzzTimer: async (pid) => {
        await r("state").update({ buzzExpireAt: serverNow() + BUZZ_TIMEOUT_MS, buzzTopPid: pid, buzzDelayUntil: null });
      },

      // The current top buzzer ran out of time: mark their buzz as expired
      // (so their name drops off the list and they can't buzz again - the
      // record itself stays so a re-buzz is still blocked), clear the timer,
      // and set buzzDelayUntil so the host's loop waits out the TV's "wrong
      // buzzer" sound effect before starting the next buzzer's fresh 10s -
      // see BUZZ_WRONG_SOUND_MS above. The loop (host.js) is what actually
      // hands the timer to the next buzzer once that delay passes.
      expireBuzz: async (pid) => {
        const key = buzzKey(state);
        await r().update({
          [`buzzes/${key}/${pid}/expired`]: true,
          "state/buzzExpireAt": null,
          "state/buzzTopPid": null,
          "state/buzzDelayUntil": serverNow() + BUZZ_WRONG_SOUND_MS
        });
      },

      finishGame: async () => {
        await r("state").update({ phase: "gameover", buzzesOpen: false, buzzExpireAt: null, buzzTopPid: null, buzzDelayUntil: null });
      },

      score: (teamIdx, delta) => r(`scores/${teamIdx}`).transaction((v) => (v || 0) + delta),
      setScore: (teamIdx, value) => r(`scores/${teamIdx}`).set(Number(value) || 0),
      reset: () => r().set({ state: freshState() }),
      setTeamName: async (teamIdx, name) => {
        const clean = (name || "").toString().trim().slice(0, 40);
        await r(`teams/${teamIdx}`).update({ name: clean || `Team ${Number(teamIdx) + 1}`, nameSet: true });
      },
      join: async (name, cb) => {
        const result = await r(`players/${name}`).transaction((p) => {
          if (!p || p.joined) return; // abort
          p.joined = true;
          p.pid = genId();
          return p;
        });
        if (!result.committed || !result.snapshot.val()) return cb({ ok: false });
        const p = result.snapshot.val();
        cb({ ok: true, pid: p.pid, team: p.team });
      },
      rejoin: async (name, pid, cb) => {
        const snap = await r(`players/${name}`).once("value");
        const p = snap.val();
        if (!p || p.pid !== pid) return cb({ ok: false });
        cb({ ok: true, team: p.team });
      },
      buzz: async (name, pid) => {
        if (!state.buzzesOpen) return;
        const key = buzzKey(state);
        const existing = await r(`buzzes/${key}/${pid}`).once("value");
        if (existing.exists()) return;
        const p = state.players[name];
        const teamName = (state.teams[p.team] || {}).name || "";
        await r(`buzzes/${key}/${pid}`).set({ name, team: teamName, pid, ts: firebase.database.ServerValue.TIMESTAMP });
      }
    };
  }

  let impl = null;

  // Firebase stores buzzes/{key} as an object keyed by player id (since it's
  // written via per-player transactions); LAN stores it as a plain array.
  // This normalizes either shape into one array, sorted by timestamp, so TV
  // and player screens never have to care which transport is active.
  function buzzArray(s) {
    const key = buzzKey(s);
    const raw = s && s.buzzes && s.buzzes[key];
    if (!raw) return [];
    const arr = Array.isArray(raw) ? raw : Object.values(raw);
    return arr.slice().sort((a, b) => (a.ts || 0) - (b.ts || 0));
  }

  // Same as buzzArray, but drops anyone whose 10s window already ran out -
  // this is what the TV/host "who's up" list should render, since expired
  // buzzers disappear from the queue (though they still can't re-buzz).
  function activeBuzzArray(s) {
    return buzzArray(s).filter((b) => !b.expired);
  }

  // Any action that fails (Firebase permission error, dropped connection,
  // bad write, etc.) used to just do nothing visible. This wraps every
  // state-changing call so a failure surfaces as a console error + alert
  // instead of silently going nowhere.
  function wrapAsync(fn, label) {
    return (...args) => {
      let result;
      try {
        result = fn(...args);
      } catch (err) {
        console.error(`[gameClient] ${label} failed:`, err);
        alert(`⚠️ ${label} failed: ${(err && err.message) || err}`);
        return;
      }
      if (result && typeof result.catch === "function") {
        result.catch((err) => {
          console.error(`[gameClient] ${label} failed:`, err);
          alert(`⚠️ ${label} failed: ${(err && err.message) || err}`);
        });
      }
      return result;
    };
  }

  // Same idea, but for callback-style calls (join/rejoin) - if the promise
  // rejects before the callback fires, the caller's UI would otherwise hang
  // forever waiting on a callback that never comes. This guarantees the
  // callback always fires.
  function wrapCb(fn, label) {
    return (...args) => {
      const cb = args[args.length - 1];
      let result;
      try {
        result = fn(...args);
      } catch (err) {
        console.error(`[gameClient] ${label} failed:`, err);
        if (typeof cb === "function") cb({ ok: false, error: String(err) });
        return;
      }
      if (result && typeof result.catch === "function") {
        result.catch((err) => {
          console.error(`[gameClient] ${label} failed:`, err);
          if (typeof cb === "function") cb({ ok: false, error: String(err) });
        });
      }
      return result;
    };
  }

  return {
    connect(onStatus) {
      impl = TRANSPORT === "firebase" ? initFirebase(onStatus) : initLan(onStatus);
    },
    onState(fn) {
      listeners.push(fn);
      fn(state);
    },
    buzzKey,
    buzzArray: (...a) => buzzArray(...a),
    activeBuzzArray: (...a) => activeBuzzArray(...a),
    BUZZ_TIMEOUT_MS,
    BUZZ_WRONG_SOUND_MS,
    serverNow,
    startGame: (...a) => wrapAsync((...b) => impl.startGame(...b), "Assign teams")(...a),
    openLobby: (...a) => wrapAsync((...b) => impl.openLobby(...b), "Show join code")(...a),
    startQuestions: (...a) => wrapAsync((...b) => impl.startQuestions(...b), "Start questions")(...a),
    spinCategory: (...a) => wrapAsync((...b) => impl.spinCategory(...b), "Spin wheel")(...a),
    chooseJokerCategory: (...a) => wrapAsync((...b) => impl.chooseJokerCategory(...b), "Pick category")(...a),
    confirmCategory: (...a) => wrapAsync((...b) => impl.confirmCategory(...b), "Continue")(...a),
    next: (...a) => wrapAsync((...b) => impl.next(...b), "Next")(...a),
    startTiebreaker: (...a) => wrapAsync((...b) => impl.startTiebreaker(...b), "Start tie-breaker")(...a),
    nextTiebreakQuestion: (...a) => wrapAsync((...b) => impl.nextTiebreakQuestion(...b), "Next tie-breaker question")(...a),
    finishGame: (...a) => wrapAsync((...b) => impl.finishGame(...b), "Finish game")(...a),
    openBuzzers: (...a) => wrapAsync((...b) => impl.openBuzzers(...b), "Open buzzers")(...a),
    startBuzzTimer: (...a) => wrapAsync((...b) => impl.startBuzzTimer(...b), "Start buzz timer")(...a),
    expireBuzz: (...a) => wrapAsync((...b) => impl.expireBuzz(...b), "Expire buzz")(...a),
    score: (...a) => wrapAsync((...b) => impl.score(...b), "Score update")(...a),
    setScore: (...a) => wrapAsync((...b) => impl.setScore(...b), "Score update")(...a),
    reset: (...a) => wrapAsync((...b) => impl.reset(...b), "Reset")(...a),
    setTeamName: (...a) => wrapAsync((...b) => impl.setTeamName(...b), "Save team name")(...a),
    join: (...a) => wrapCb((...b) => impl.join(...b), "Join")(...a),
    rejoin: (...a) => wrapCb((...b) => impl.rejoin(...b), "Rejoin")(...a),
    buzz: (...a) => {
      try {
        const result = impl.buzz(...a);
        if (result && typeof result.catch === "function") {
          result.catch((err) => console.error("[gameClient] Buzz failed:", err));
        }
      } catch (err) {
        console.error("[gameClient] Buzz failed:", err);
      }
    }
  };
})();
