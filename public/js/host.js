const app = $("#app");
let state = { phase: "setup" };

gameClient.onState((s) => { state = s; render(); });
gameClient.connect((status) => {
  if (status === "error") {
    app.innerHTML = `<h2>⚠️ Can't reach the server</h2><p style="color:var(--muted)">${TRANSPORT === "firebase" ? "Check your internet connection and firebase-config.js." : "Make sure your phone is on the same WiFi as the computer running the server."}</p>`;
  }
});

function render() {
  switch (state.phase) {
    case "setup": return renderSetup();
    case "teams": return renderTeams();
    case "lobby": return renderLobby();
    case "question": return renderQuestionLoop();
    case "gameover": return renderGameOver();
    default: return renderSetup();
  }
}

// ---------- SETUP ----------
function renderSetup() {
  app.innerHTML = `
    <h2>Set up players</h2>
    <p style="color:var(--muted)">One name per line. Need a multiple of ${TEAM_SIZE} for even teams.</p>
    <textarea id="names" rows="10" style="width:100%;">${DEFAULT_PLAYER_NAMES.join("\n")}</textarea>
    <button id="startBtn" style="width:100%; margin-top:14px;">🎡 Assign Teams</button>
  `;
  $("#startBtn").onclick = () => {
    const names = $("#names").value.split("\n").map((n) => n.trim()).filter(Boolean);
    if (names.length % TEAM_SIZE !== 0) {
      alert(`Number of players (${names.length}) isn't a multiple of team size (${TEAM_SIZE}).`);
      return;
    }
    gameClient.startGame(names);
  };
}

// ---------- TEAMS (TV is animating) ----------
function renderTeams() {
  app.innerHTML = `
    <h2>🎡 Teams assigned!</h2>
    <p style="color:var(--muted)">Watch the TV for the reveal animation.</p>
    <button id="nextBtn" style="width:100%">Next: Show Join QR Code →</button>
  `;
  $("#nextBtn").onclick = () => gameClient.openLobby();
}

// ---------- LOBBY ----------
function renderLobby() {
  const players = state.players || {};
  const list = Object.entries(players)
    .map(([name, p]) => `<div class="status-pill">${p.joined ? "✅" : "⏳"} ${name}</div>`)
    .join("");
  app.innerHTML = `
    <h2>📱 Waiting for players to join</h2>
    <div style="display:flex; flex-wrap:wrap; gap:8px;">${list}</div>
    <button id="nextBtn" style="width:100%; margin-top:14px;">Start Questions →</button>
    <div class="score-panel" id="scorePanel" style="margin-top:20px;"></div>
  `;
  $("#nextBtn").onclick = () => gameClient.startQuestions();
  renderScorePanel();
}

// ---------- QUESTION LOOP (question / answer / bonus_question / bonus_answer) ----------
function renderQuestionLoop() {
  const q = QUESTIONS[state.questionIndex];
  const isBonus = state.step === "bonus_question" || state.step === "bonus_answer";
  const content = isBonus ? q.bonus : q;
  const isLastQuestion = state.questionIndex >= QUESTIONS.length - 1;

  let nextLabel;
  if (state.step === "question") nextLabel = "🔒 Lock & Reveal Answer";
  else if (state.step === "answer") nextLabel = q.bonus ? "🎁 Show Bonus Question" : (isLastQuestion ? "🏁 Finish Game" : "Next Question ▶");
  else if (state.step === "bonus_question") nextLabel = "🔒 Reveal Bonus Answer";
  else nextLabel = isLastQuestion ? "🏁 Finish Game" : "Next Question ▶"; // bonus_answer

  app.innerHTML = `
    ${isBonus ? `<div class="tv-category" style="color:var(--accent2)">🎁 BONUS</div>` : `<div class="tv-category">Question ${state.questionIndex + 1} of ${QUESTIONS.length}</div>`}
    <p style="font-size:1.3rem; font-weight:700;">${content.franko}</p>
    ${content.note ? `<p style="color:var(--muted); font-style:italic;">📝 ${content.note}</p>` : ""}
    <p style="color:var(--accent2); font-size:1.15rem;"><strong>Answer:</strong> ${content.answer}</p>
    <button id="nextBtn" style="width:100%; margin-top:6px;">${nextLabel}</button>
    <div class="score-panel" id="scorePanel" style="margin-top:20px;"></div>
  `;
  $("#nextBtn").onclick = () => gameClient.next();
  renderScorePanel();
}

// ---------- SCORE PANEL (used on lobby, question loop, gameover) ----------
function renderScorePanel() {
  const teams = state.teams || {};
  const scores = state.scores || {};
  const el = $("#scorePanel");
  if (!el) return;
  el.innerHTML = Object.entries(teams).map(([idx, t]) => `
    <div class="score-card">
      <button data-idx="${idx}" data-delta="1">＋</button>
      <div class="score-name">${t.name}</div>
      <div class="score-value" data-idx="${idx}" title="Tap to set exact score">${scores[idx] || 0}</div>
      <button data-idx="${idx}" data-delta="-1">－</button>
    </div>
  `).join("");
  el.querySelectorAll("button").forEach((btn) => {
    btn.onclick = () => gameClient.score(btn.dataset.idx, Number(btn.dataset.delta));
  });
  el.querySelectorAll(".score-value").forEach((val) => {
    val.onclick = () => {
      const current = scores[val.dataset.idx] || 0;
      const next = prompt("Set exact score:", current);
      if (next !== null && !isNaN(Number(next))) gameClient.setScore(val.dataset.idx, Number(next));
    };
  });
}

// ---------- GAME OVER ----------
function renderGameOver() {
  app.innerHTML = `<h2>🏁 Game Over!</h2><div class="score-panel" id="scorePanel"></div>
    <button id="resetBtn" class="danger" style="width:100%; margin-top:16px;">Reset Game</button>`;
  $("#resetBtn").onclick = () => {
    if (confirm("Reset the whole game? This clears players, teams, and scores.")) gameClient.reset();
  };
  renderScorePanel();
}
