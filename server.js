const express = require("express");
const http = require("http");
const os = require("os");
const path = require("path");
const { Server } = require("socket.io");
const { TEAM_SIZE, QUESTIONS, computeNextStep } = require("./public/js/questions.js");

const app = express();
app.use(express.static(path.join(__dirname, "public")));

const server = http.createServer(app);
const io = new Server(server);

function freshState() {
  return {
    phase: "setup",      // setup -> teams -> lobby -> question -> gameover
    step: null,            // question -> answer -> [bonus_question -> bonus_answer] -> (next question)
    players: {},           // name -> { team, joined, pid }
    teams: {},              // idx -> { name, members: [] }
    scores: {},             // idx -> number
    questionIndex: -1,
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

function buzzKey(s) {
  return s.step === "bonus_question" || s.step === "bonus_answer" ? `${s.questionIndex}-bonus` : `${s.questionIndex}`;
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
      teams[idx] = { name: `Team ${idx + 1}`, members };
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
    state.questionIndex = 0;
    state.step = "question";
    state.buzzesOpen = true;
    state.buzzes[buzzKey(state)] = [];
    broadcast();
  });

  socket.on("host:next", () => {
    const result = computeNextStep(state, QUESTIONS);
    if (!result) return;
    if (result.gameover) {
      state.phase = "gameover";
      state.buzzesOpen = false;
    } else {
      if (result.questionIndex !== undefined) state.questionIndex = result.questionIndex;
      state.step = result.step;
      state.buzzesOpen = result.buzzesOpen;
      if (result.clearBuzz) state.buzzes[buzzKey(state)] = [];
    }
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
  console.log(`\n   Open the "On your WiFi" address on the TV/laptop and on your host phone.`);
  console.log(`   ${QUESTIONS.length} questions loaded.\n`);
});
