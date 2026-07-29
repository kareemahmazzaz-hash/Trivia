const express = require("express");
const http = require("http");
const os = require("os");
const path = require("path");
const { Server } = require("socket.io");
const {
  TEAM_SIZE, WHEEL_KEYS, buzzKey, computeNextStep,
  buildAllDrawOrders, drawNextQuestionIndex, pickWheelTarget
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
    category: null,         // current wheel category key ("geography", ... or "politics" for tie-breaker)
    questionIndex: -1,      // index into CATEGORIES[category].questions
    wheelTarget: null,      // wheel slot index (0-6) the TV should spin to
    pendingJoker: false,    // true once wheel lands on Joker, until host picks a category
    tiebreaker: false,
    categoryOrders: {},     // categoryKey -> shuffled draw order (built once at startQuestions)
    categoryPointers: {},   // categoryKey -> how many questions already drawn from it
    buzzesOpen: false,
    buzzes: {}              // buzzKey -> [{ name, team, pid, ts }]
  };
}

let state = freshState();

function broadcast() {
  io.emit("state:update", state);
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

io.on("connection", (socket) => {
  socket.emit("state:update", state);

  socket.on("host:startGame", (names) => {
    if (!Array.isArray(names) || !names.length || names.length % TEAM_SIZE !== 0) return;
    const shuffled = shuffle(names);
    const teams = {};
    const players = {};
    for (let i = 0; i < shuffled.length; i += TEAM_SIZE) {
      const idx = i / TEAM_SIZE;
      const members = shuffled.slice(i, i + TEAM_SIZE);
      teams[idx] = { name: `Team ${idx + 1}`, members, nameSet: false };
      members.forEach((n) => (players[n] = { team: idx, joined: false, pid: null }));
    }
    const scores = {};
    Object.keys(teams).forEach((idx) => (scores[idx] = 0));
    state = { ...freshState(), phase: "teams", players, teams, scores };
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
    broadcast();
  });

  // Host spins the wheel: pick a random available slot and broadcast it so
  // the TV can animate toward it.
  socket.on("host:spinCategory", () => {
    const target = pickWheelTarget(state);
    if (target == null) return;
    const key = WHEEL_KEYS[target];
    state.wheelTarget = target;
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
  socket.on("host:confirmCategory", () => {
    if (!state.category) return;
    const { questionIndex, nextPointer } = drawNextQuestionIndex(state, state.category);
    state.questionIndex = questionIndex;
    state.categoryPointers[state.category] = nextPointer;
    state.step = "question";
    state.buzzesOpen = true;
    state.buzzes[buzzKey(state)] = [];
    broadcast();
  });

  socket.on("host:next", () => {
    const result = computeNextStep(state);
    if (!result) return;
    state.step = result.step;
    state.buzzesOpen = result.buzzesOpen;
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
    state.buzzesOpen = true;
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
    state.buzzesOpen = true;
    state.buzzes[buzzKey(state)] = [];
    broadcast();
  });

  socket.on("host:finishGame", () => {
    state.phase = "gameover";
    state.buzzesOpen = false;
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
