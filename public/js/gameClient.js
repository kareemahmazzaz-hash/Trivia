// Exposes one consistent API (gameClient.*) to host.js / tv.js / player.js so
// those files never need to know whether we're on LAN (Socket.IO) or online
// (Firebase). Which one is used is decided by TRANSPORT in js/config.js.
const gameClient = (function () {
  let listeners = [];
  let state = { phase: "setup" };

  function notify() {
    listeners.forEach((fn) => fn(state));
  }

  function freshState() {
    return {
      phase: "setup", step: null, players: {}, teams: {}, scores: {},
      category: null, questionIndex: -1, wheelTarget: null, pendingJoker: false,
      tiebreaker: false, categoryOrders: {}, categoryPointers: {},
      buzzesOpen: false, buzzes: {}
    };
  }

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
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
      startGame: (names) => socket.emit("host:startGame", names),
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
      join: (name, cb) => socket.emit("player:join", { name }, cb),
      rejoin: (name, pid, cb) => socket.emit("player:rejoin", { name, pid }, cb),
      buzz: (name, pid) => socket.emit("player:buzz", { name, pid })
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

    async function recompute() {
      const [s, players, teams, scores, buzzes] = await Promise.all([
        r("state").once("value"), r("players").once("value"),
        r("teams").once("value"), r("scores").once("value"), r("buzzes").once("value")
      ]);
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
      startGame: async (names) => {
        const shuffled = shuffle(names);
        const teams = {};
        const players = {};
        let lastIdx = -1;
        for (let i = 0; i < shuffled.length; i += TEAM_SIZE) {
          const remaining = shuffled.length - i;
          // If what's left won't make a full team on its own, fold it into
          // the last team we already created instead of leaving a lonely
          // partial team behind.
          if (remaining < TEAM_SIZE && lastIdx >= 0) {
            const leftovers = shuffled.slice(i);
            teams[lastIdx].members.push(...leftovers);
            leftovers.forEach((n) => (players[n] = { team: lastIdx, joined: false, pid: null }));
            break;
          }
          const idx = i / TEAM_SIZE;
          const members = shuffled.slice(i, i + TEAM_SIZE);
          teams[idx] = { name: `Team ${idx + 1}`, members };
          members.forEach((n) => (players[n] = { team: idx, joined: false, pid: null }));
          lastIdx = idx;
        }
        const scores = {};
        Object.keys(teams).forEach((idx) => (scores[idx] = 0));
        await r().set({
          state: { ...freshState(), phase: "teams" },
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
          buzzesOpen: false
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
          pendingJoker: key === "joker",
          category: key === "joker" ? null : key
        });
      },

      // Host picks a category after landing on Joker.
      chooseJokerCategory: async (key) => {
        await r("state").update({ category: key, pendingJoker: false });
      },

      // Host confirms the chosen category: draws the next question from it.
      confirmCategory: async () => {
        if (!state.category) return;
        const { questionIndex, nextPointer } = drawNextQuestionIndex(state, state.category);
        const updates = {
          step: "question", questionIndex, buzzesOpen: true,
          [`categoryPointers/${state.category}`]: nextPointer
        };
        await r("state").update(updates);
        await clearBuzzFor({ ...state, category: state.category, questionIndex, step: "question" });
      },

      next: async () => {
        const result = computeNextStep(state);
        if (!result) return;
        const updates = { step: result.step, buzzesOpen: result.buzzesOpen };
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
          step: "question", buzzesOpen: true, wheelTarget: null, pendingJoker: false,
          "categoryPointers/politics": nextPointer
        };
        await r("state").update(updates);
        await clearBuzzFor({ ...state, category: "politics", questionIndex, step: "question" });
      },

      nextTiebreakQuestion: async () => {
        const { questionIndex, nextPointer } = drawNextQuestionIndex(state, "politics");
        const updates = {
          questionIndex, step: "question", buzzesOpen: true,
          "categoryPointers/politics": nextPointer
        };
        await r("state").update(updates);
        await clearBuzzFor({ ...state, category: "politics", questionIndex, step: "question" });
      },

      finishGame: async () => {
        await r("state").update({ phase: "gameover", buzzesOpen: false });
      },

      score: (teamIdx, delta) => r(`scores/${teamIdx}`).transaction((v) => (v || 0) + delta),
      setScore: (teamIdx, value) => r(`scores/${teamIdx}`).set(Number(value) || 0),
      reset: () => r().set({ state: freshState() }),
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

  return {
    connect(onStatus) {
      impl = TRANSPORT === "firebase" ? initFirebase(onStatus) : initLan(onStatus);
    },
    onState(fn) {
      listeners.push(fn);
      fn(state);
    },
    buzzKey,
    startGame: (...a) => impl.startGame(...a),
    openLobby: (...a) => impl.openLobby(...a),
    startQuestions: (...a) => impl.startQuestions(...a),
    spinCategory: (...a) => impl.spinCategory(...a),
    chooseJokerCategory: (...a) => impl.chooseJokerCategory(...a),
    confirmCategory: (...a) => impl.confirmCategory(...a),
    next: (...a) => impl.next(...a),
    startTiebreaker: (...a) => impl.startTiebreaker(...a),
    nextTiebreakQuestion: (...a) => impl.nextTiebreakQuestion(...a),
    finishGame: (...a) => impl.finishGame(...a),
    score: (...a) => impl.score(...a),
    setScore: (...a) => impl.setScore(...a),
    reset: (...a) => impl.reset(...a),
    join: (...a) => impl.join(...a),
    rejoin: (...a) => impl.rejoin(...a),
    buzz: (...a) => impl.buzz(...a)
  };
})();
