const app = $("#app");
let state = { phase: "setup" };

// Always available, regardless of game phase - resets everyone back to the
// name-entry screen (players' stale sessions auto-clear themselves via
// player.js's rejoin check once players/teams are wiped).
$("#resetAllBtn").onclick = () => {
  if (confirm("Reset the whole game? This clears players, teams, and scores, and sends everyone back to name entry.")) {
    gameClient.reset();
  }
};

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
    case "question": return renderQuestionPhase();
    case "gameover": return renderGameOver();
    default: return renderSetup();
  }
}

// ---------- SETUP ----------
function renderSetup() {
  app.innerHTML = `
    <h2>Set up players</h2>
    <p style="color:var(--muted)">One name per line. Teams of ${TEAM_SIZE} — any leftover players join the last team.</p>
    <textarea id="names" rows="10" style="width:100%;">${DEFAULT_PLAYER_NAMES.join("\n")}</textarea>
    <button id="startBtn" style="width:100%; margin-top:14px;">🎡 Assign Teams</button>
  `;
  $("#startBtn").onclick = () => {
    const names = $("#names").value.split("\n").map((n) => n.trim()).filter(Boolean);
    if (names.length < TEAM_SIZE) {
      alert(`Need at least ${TEAM_SIZE} players.`);
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

// ---------- QUESTION PHASE ROUTER ----------
function renderQuestionPhase() {
  if (state.step === "category") return renderCategoryStep();
  if (state.step === "tiebreak_done") return renderTiebreakDone();
  return renderQuestionLoop();
}

// ---------- CATEGORY WHEEL STEP ----------
function renderCategoryStep() {
  const politicsLeft = categoryHasQuestionsLeft(state, "politics");
  const wheelExhausted = availableWheelSlots(state).length === 0;

  let body;
  if (state.pendingJoker) {
    // Landed on Joker - host picks the real category.
    const options = JOKER_PICKABLE_KEYS.filter((k) => categoryHasQuestionsLeft(state, k));
    body = `
      <h2>🃏 Joker!</h2>
      <p style="color:var(--muted)">Pick a category:</p>
      <div style="display:flex; flex-wrap:wrap; gap:10px; justify-content:center;">
        ${options.map((k) => `<button data-key="${k}" class="jokerPick">${CATEGORIES[k].label}</button>`).join("")}
      </div>
    `;
  } else if (state.category) {
    // Category chosen (either directly, or after a Joker pick) - confirm to draw a question.
    body = `
      <h2 class="tv-category">${CATEGORIES[state.category].label}</h2>
      <button id="confirmBtn" style="width:100%;">Continue ▶</button>
    `;
  } else if (wheelExhausted) {
    body = `
      <h2>🎉 All categories complete!</h2>
      <p style="color:var(--muted)">Every category on the wheel has been used up.</p>
    `;
  } else {
    body = `
      <h2>🎡 Spin the Category Wheel</h2>
      <button id="spinBtn" style="width:100%;">Spin!</button>
    `;
  }

  app.innerHTML = `
    ${body}
    <div style="display:flex; gap:10px; margin-top:16px; width:100%;">
      <button id="tiebreakBtn" class="secondary" style="flex:1;" ${politicsLeft ? "" : "disabled"}>🏆 Tie-breaker (Politics)</button>
      <button id="finishBtn" class="danger" style="flex:1;">🏁 Finish Game</button>
    </div>
    <div class="score-panel" id="scorePanel" style="margin-top:20px;"></div>
  `;

  const spinBtn = $("#spinBtn");
  if (spinBtn) spinBtn.onclick = () => gameClient.spinCategory();

  const confirmBtn = $("#confirmBtn");
  if (confirmBtn) confirmBtn.onclick = () => gameClient.confirmCategory();

  app.querySelectorAll(".jokerPick").forEach((btn) => {
    btn.onclick = () => gameClient.chooseJokerCategory(btn.dataset.key);
  });

  $("#tiebreakBtn").onclick = () => {
    if (confirm("Start the tie-breaker? This switches to Politics questions.")) gameClient.startTiebreaker();
  };
  $("#finishBtn").onclick = () => {
    if (confirm("Finish the game now?")) gameClient.finishGame();
  };

  renderScorePanel();
}

// ---------- QUESTION LOOP (question / answer / bonus_question / bonus_answer) ----------
function renderQuestionLoop() {
  const q = currentQuestion(state);
  if (!q) return renderCategoryStep();
  const isBonus = state.step === "bonus_question" || state.step === "bonus_answer";
  const content = isBonus ? q.bonus : q;
  const categoryLabel = state.tiebreaker ? "🏆 Tie-breaker: Politics" : CATEGORIES[state.category].label;

  let nextLabel;
  if (state.step === "question") nextLabel = "🔒 Lock & Reveal Answer";
  else if (state.step === "answer") nextLabel = q.bonus ? "🎁 Show Bonus Question" : "Next ▶";
  else if (state.step === "bonus_question") nextLabel = "🔒 Reveal Bonus Answer";
  else nextLabel = "Next ▶"; // bonus_answer

  app.innerHTML = `
    <div class="tv-category" ${isBonus ? `style="color:var(--accent2)"` : ""}>${isBonus ? "🎁 BONUS — " : ""}${categoryLabel}</div>
    ${q.image && !isBonus ? `<img src="${q.image}" alt="" style="max-width:100%; max-height:220px; display:block; margin:10px auto; border-radius:10px;">` : ""}
    <p style="font-size:1.3rem; font-weight:700;">${hostText(content)}</p>
    ${content.note ? `<p style="color:var(--muted); font-style:italic;">📝 ${content.note}</p>` : ""}
    <p style="color:var(--accent2); font-size:1.15rem;"><strong>Answer:</strong> ${content.answer}</p>
    <button id="nextBtn" style="width:100%; margin-top:6px;">${nextLabel}</button>
    <div class="score-panel" id="scorePanel" style="margin-top:20px;"></div>
  `;
  $("#nextBtn").onclick = () => gameClient.next();
  renderScorePanel();
}

// ---------- TIE-BREAKER "what next" STEP ----------
function renderTiebreakDone() {
  app.innerHTML = `
    <h2>🏆 Tie-breaker question done</h2>
    <div style="display:flex; flex-direction:column; gap:10px; width:100%;">
      ${state.hasMorePolitics ? `<button id="anotherBtn">Another Politics Question ▶</button>` : `<p style="color:var(--muted)">No more Politics questions left.</p>`}
      <button id="finishBtn" class="danger">🏁 Finish Game</button>
    </div>
    <div class="score-panel" id="scorePanel" style="margin-top:20px;"></div>
  `;
  const anotherBtn = $("#anotherBtn");
  if (anotherBtn) anotherBtn.onclick = () => gameClient.nextTiebreakQuestion();
  $("#finishBtn").onclick = () => {
    if (confirm("Finish the game now?")) gameClient.finishGame();
  };
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
  app.innerHTML = `<h2>🏁 Game Over!</h2><p style="color:var(--muted); text-align:center;">Tap 🔄 Reset Game up top to start a new game.</p><div class="score-panel" id="scorePanel"></div>`;
  renderScorePanel();
}
