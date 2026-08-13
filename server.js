const express = require("express");
const http = require("http");
const os = require("os");
const path = require("path");
const { Server } = require("socket.io");
const {
  WHEEL_KEYS, buzzKey, computeNextStep,
  buildAllDrawOrders, drawNextQuestionIndex, pickWheelTarget,
  buildTeamsFromGroups
} = require("./public/js/questions.js");

const app = express();
app.use(express.static(path.join(__dirname, "public")));

const server = http.createServer(app);
const io = new Server(server);

function freshState() {
  return {
    phase: "setup",      // setup -> teams -> lobby -> question -> gameover
    step: null,            // category -> question -> answer -> [bonus_question -> bonus_answer] -> (category again, or tiebreak_done)
    players: {},           // name -> { team, joined, pid }
    teams: {},              // idx -> { name, members: [] }
    scores: {},             // idx -> number
    manual: false,          // true if the host hand-picked teams instead of the random wheel
    category: null,         // current wheel category key ("geography", ... or "politics" for tie-breaker)
    questionIndex: -1,      // index into CATEGORIES[category].questions
    wheelTarget: null,      // wheel slot index (0-6) the TV should spin to
    lastWheelTarget: null,  // slot index the wheel landed on last spin (persists across rounds, used to bias against repeats)
    pendingJoker: false,    // true once wheel lands on Joker, until host picks a category
    tiebreaker: false,
    categoryOrders: {},     // categoryKey -> shuffled draw order (built once at startQuestions)
    categoryPointers: {},   // categoryKey -> how many questions already drawn from it
    buzzesOpen: false,
    buzzes: {},              // buzzKey -> [{ name, team, pid, ts, expired }]
    buzzExpireAt: null,      // epoch ms - when the current top buzzer's 10s window ends
    buzzTopPid: null,        // pid the countdown above belongs to
    buzzDelayUntil: null     // epoch ms - holds off the next buzzer's timer until the TV's "wrong buzzer" sound finishes
  };
}

const BUZZ_TIMEOUT_MS = 10000;

// How long (ms) the TV's "big buzzer" wrong-answer sound effect takes to
// play out. Keep in sync with the matching constant in public/js/gameClient.js
// and public/js/tv.js.
const BUZZ_WRONG_SOUND_MS = 1500;

let state = freshState();

function broadcast() {
  io.emit("state:update", state);
}

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

io.on("connection", (socket) => {
  socket.emit("state:update", state);

  socket.on("host:startGame", ({ groups, manual } = {}) => {
    if (!Array.isArray(groups) || !groups.length) return;
    const cleanGroups = groups
      .map((g) => (Array.isArray(g) ? g.map((n) => String(n || "").trim()).filter(Boolean) : []))
      .filter((g) => g.length);
    if (!cleanGroups.length) return;
    const { teams, players, scores } = buildTeamsFromGroups(cleanGroups);
    state = { ...freshState(), phase: "teams", manual: !!manual, players, teams, scores };
    broadcast();
  });

  socket.on("host:openLobby", () => {
    state.phase = "lobby";
    broadcast();
  });

  socket.on("host:startQuestions", () => {
    state.phase = "question";
    state.step = "category";
    state.category = null;
    state.questionIndex = -1;
    state.wheelTarget = null;
    state.pendingJoker = false;
    state.tiebreaker = false;
    state.categoryOrders = buildAllDrawOrders();
    state.categoryPointers = {};
    state.buzzesOpen = false;
    state.buzzExpireAt = null;
    state.buzzTopPid = null;
    state.buzzDelayUntil = null;
    broadcast();
  });

  // Host spins the wheel: pick a random available slot and broadcast it so
  // the TV can animate toward it.
  socket.on("host:spinCategory", () => {
    const target = pickWheelTarget(state);
    if (target == null) return;
    const key = WHEEL_KEYS[target];
    state.wheelTarget = target;
    state.lastWheelTarget = target;
    state.pendingJoker = key === "joker";
    state.category = key === "joker" ? null : key;
    broadcast();
  });

  // Host picks a category after landing on Joker.
  socket.on("host:chooseJokerCategory", (key) => {
    if (!state.pendingJoker) return;
    state.category = key;
    state.pendingJoker = false;
    broadcast();
  });

  // Host confirms the chosen category: draws the next question from it.
  // Buzzers stay CLOSED here - the host has to tap "🔔 Buzzers" once
  // they've finished reading the question aloud.
  socket.on("host:confirmCategory", () => {
    if (!state.category) return;
    const { questionIndex, nextPointer } = drawNextQuestionIndex(state, state.category);
    state.questionIndex = questionIndex;
    state.categoryPointers[state.category] = nextPointer;
    state.step = "question";
    state.buzzesOpen = false;
    state.buzzExpireAt = null;
    state.buzzTopPid = null;
    state.buzzDelayUntil = null;
    state.buzzes[buzzKey(state)] = [];
    broadcast();
  });

  socket.on("host:next", () => {
    const result = computeNextStep(state);
    if (!result) return;
    state.step = result.step;
    state.buzzesOpen = result.buzzesOpen;
    state.buzzExpireAt = null;
    state.buzzTopPid = null;
    state.buzzDelayUntil = null;
    if (result.resetCategory) {
      state.category = null;
      state.questionIndex = -1;
      state.wheelTarget = null;
      state.pendingJoker = false;
    }
    if (result.hasMorePolitics !== undefined) state.hasMorePolitics = result.hasMorePolitics;
    if (result.clearBuzz) state.buzzes[buzzKey(state)] = [];
    broadcast();
  });

  // Tie-breaker: switches to the Politics pool, which is never on the wheel.
  socket.on("host:startTiebreaker", () => {
    const { questionIndex, nextPointer } = drawNextQuestionIndex(state, "politics");
    state.tiebreaker = true;
    state.category = "politics";
    state.questionIndex = questionIndex;
    state.categoryPointers.politics = nextPointer;
    state.step = "question";
    state.buzzesOpen = false;
    state.buzzExpireAt = null;
    state.buzzTopPid = null;
    state.buzzDelayUntil = null;
    state.wheelTarget = null;
    state.pendingJoker = false;
    state.buzzes[buzzKey(state)] = [];
    broadcast();
  });

  socket.on("host:nextTiebreakQuestion", () => {
    const { questionIndex, nextPointer } = drawNextQuestionIndex(state, "politics");
    state.questionIndex = questionIndex;
    state.categoryPointers.politics = nextPointer;
    state.step = "question";
    state.buzzesOpen = false;
    state.buzzExpireAt = null;
    state.buzzTopPid = null;
    state.buzzDelayUntil = null;
    state.buzzes[buzzKey(state)] = [];
    broadcast();
  });

  // Host taps "🔔 Buzzers" once ready - only THEN can players buzz in.
  socket.on("host:openBuzzers", () => {
    state.buzzesOpen = true;
    state.buzzExpireAt = null;
    state.buzzTopPid = null;
    state.buzzDelayUntil = null;
    broadcast();
  });

  // Starts (or restarts) the 10s elimination countdown for whichever buzz
  // is now first in line. Clears buzzDelayUntil - we're past the post-expiry
  // delay now that a fresh timer is starting.
  socket.on("host:startBuzzTimer", ({ pid } = {}) => {
    if (!pid) return;
    state.buzzExpireAt = Date.now() + BUZZ_TIMEOUT_MS;
    state.buzzTopPid = pid;
    state.buzzDelayUntil = null;
    broadcast();
  });

  // The current top buzzer ran out of time: mark their buzz expired (drops
  // off the list, but the record stays so they can't re-buzz), clear the
  // timer, and set buzzDelayUntil so the host's loop waits out the TV's
  // "wrong buzzer" sound effect before starting the next buzzer's fresh 10s.
  socket.on("host:expireBuzz", ({ pid } = {}) => {
    if (!pid) return;
    const key = buzzKey(state);
    const list = state.buzzes[key];
    const entry = list && list.find((b) => b.pid === pid);
    if (entry) entry.expired = true;
    state.buzzExpireAt = null;
    state.buzzTopPid = null;
    state.buzzDelayUntil = Date.now() + BUZZ_WRONG_SOUND_MS;
    broadcast();
  });

  socket.on("host:finishGame", () => {
    state.phase = "gameover";
    state.buzzesOpen = false;
    state.buzzExpireAt = null;
    state.buzzTopPid = null;
    state.buzzDelayUntil = null;
    broadcast();
  });

  socket.on("host:score", ({ teamIdx, delta }) => {
    if (!(teamIdx in state.scores)) return;
    state.scores[teamIdx] = (state.scores[teamIdx] || 0) + delta;
    broadcast();
  });

  socket.on("host:setScore", ({ teamIdx, value }) => {
    if (!(teamIdx in state.scores)) return;
    state.scores[teamIdx] = Number(value) || 0;
    broadcast();
  });

  socket.on("host:reset", () => {
    state = freshState();
    broadcast();
  });

  socket.on("player:setTeamName", ({ teamIdx, name }) => {
    const t = state.teams[teamIdx];
    if (!t) return;
    const clean = (name || "").toString().trim().slice(0, 40);
    t.name = clean || t.name;
    t.nameSet = true;
    broadcast();
  });

  socket.on("player:join", ({ name }, ack) => {
    const p = state.players[name];
    if (!p || p.joined) return ack && ack({ ok: false });
    p.joined = true;
    p.pid = genId();
    broadcast();
    ack && ack({ ok: true, pid: p.pid, team: p.team });
  });

  socket.on("player:rejoin", ({ name, pid }, ack) => {
    const p = state.players[name];
    if (!p || p.pid !== pid) return ack && ack({ ok: false });
    ack && ack({ ok: true, team: p.team });
  });

  socket.on("player:buzz", ({ name, pid }) => {
    if (!state.buzzesOpen) return;
    const p = state.players[name];
    if (!p || p.pid !== pid) return;
    const key = buzzKey(state);
    const list = state.buzzes[key] || (state.buzzes[key] = []);
    if (list.some((b) => b.pid === pid)) return;
    const teamName = (state.teams[p.team] || {}).name || "";
    list.push({ name, team: teamName, pid, ts: Date.now() });
    broadcast();
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`\n🎉 Trivia Night server is running!`);
  console.log(`   On this computer:  http://localhost:${PORT}`);
  const nets = os.networkInterfaces();
  Object.values(nets).flat().forEach((net) => {
    if (net && net.family === "IPv4" && !net.internal) {
      console.log(`   On your WiFi:      http://${net.address}:${PORT}`);
    }
  });
  console.log(`\n   Open the "On your WiFi" address on the TV/laptop and on your host phone.\n`);
});
