const app = $("#app");
let state = { phase: "setup" };

// Local-only UI state for the manual "host places each player" step. This
// never touches gameClient/Firebase/Socket - it's just scratch state while
// the host is deciding, until they hit "Confirm Teams" and it turns into a
// groups array passed to gameClient.startGame().
let manualDraft = null; // { names, numTeams, teamOf: { [name]: teamIdx }, fakeSpin }

// Keeps whatever the host typed/picked on the setup screen, so re-renders
// (or toggling the mode) don't wipe out their in-progress input. Declared
// up here - not down by renderSetup() - because gameClient.onState() below
// calls render() synchronously the moment it's registered, so this needs to
// already be initialized before that first render happens.
let setupDraft = { names: null, numTeams: DEFAULT_NUM_TEAMS, mode: "random" };

// Always available, regardless of game phase - resets everyone back to the
// name-entry screen (players' stale sessions auto-clear themselves via
// player.js's rejoin check once players/teams are wiped).
$("#resetAllBtn").onclick = () => {
  if (confirm("Reset the whole game? This clears players, teams, and scores, and sends everyone back to name entry.")) {
    gameClient.reset();
  }
};

gameClient.onState((s) => { state = s; render(); });

// ---------- BUZZ ELIMINATION TIMER ----------
// Runs continuously on the host (the single source of truth for game flow).
// While buzzers are open on a question/bonus step, the first name in line
// gets BUZZ_TIMEOUT_MS to be judged. If the host hasn't moved on by then,
// that buzz is marked expired - it drops off the list and can't buzz again
// - and the next name in line becomes first, with a fresh countdown.
let pendingBuzzAction = null; // guards against re-sending a call while waiting for state to confirm it
setInterval(() => {
  const inBuzzableStep = state.phase === "question" && (state.step === "question" || state.step === "bonus_question");
  if (!inBuzzableStep || !state.buzzesOpen) { pendingBuzzAction = null; return; }

  const active = gameClient.activeBuzzArray(state);
  if (!active.length) { pendingBuzzAction = null; return; }

  const top = active[0];
  if (state.buzzTopPid !== top.pid) {
    const tag = `start:${top.pid}`;
    if (pendingBuzzAction !== tag) {
      pendingBuzzAction = tag;
      gameClient.startBuzzTimer(top.pid);
    }
    return;
  }
  pendingBuzzAction = null;
  if (state.buzzExpireAt && Date.now() >= state.buzzExpireAt) {
    const tag = `expire:${top.pid}`;
    if (pendingBuzzAction !== tag) {
      pendingBuzzAction = tag;
      gameClient.expireBuzz(top.pid);
    }
  }
}, 300);

gameClient.connect((status) => {
  if (status === "error") {
    app.innerHTML = `<h2>⚠️ Can't reach the server</h2><p style="color:var(--muted)">${TRANSPORT === "firebase" ? "Check your internet connection and firebase-config.js." : "Make sure your phone is on the same WiFi as the computer running the server."}</p>`;
  }
});

function render() {
  if (state.phase !== "setup") manualDraft = null; // leaving setup clears any in-progress manual draft
  switch (state.phase) {
    case "setup": return manualDraft ? renderManualAssign() : renderSetup();
    case "teams": return renderTeams();
    case "lobby": return renderLobby();
    case "question": return renderQuestionPhase();
    case "gameover": return renderGameOver();
    default: return renderSetup();
  }
}

// ---------- SETUP ----------
function renderSetup() {
  const namesValue = setupDraft.names ?? DEFAULT_PLAYER_NAMES.join("\n");
  app.innerHTML = `
    <h2>Set up players</h2>
    <p style="color:var(--muted)">One name per line. Any number of players and teams.</p>
    <textarea id="names" rows="10" style="width:100%;">${namesValue}</textarea>

    <label style="display:block; margin-top:14px; color:var(--muted);">Number of teams</label>
    <input id="numTeams" type="number" min="1" value="${setupDraft.numTeams}" style="width:100%;">

    <label style="display:block; margin-top:14px; color:var(--muted);">Team assignment</label>
    <div style="display:flex; flex-direction:column; gap:10px;">
      <button id="modeRandom" class="${setupDraft.mode === "random" ? "" : "secondary"}" style="width:100%;">🎡 Random (wheel)</button>
      <button id="modeManual" class="${setupDraft.mode === "manual" ? "" : "secondary"}" style="width:100%;">✋ Manual</button>
      <button id="modeManualFake" class="${setupDraft.mode === "manualFake" ? "" : "secondary"}" style="width:100%;">🎭 Manual + Fake Spin</button>
    </div>
    ${setupDraft.mode === "manualFake" ? `<p style="color:var(--muted); font-size:0.9em;">You pick the teams, but the TV still plays the full randomized wheel reveal - the audience can't tell it was rigged.</p>` : ""}

    <button id="startBtn" style="width:100%; margin-top:14px;">
      ${setupDraft.mode === "random" ? "🎡 Assign Teams" : "Next: Place Players →"}
    </button>
  `;

  $("#modeRandom").onclick = () => { syncSetupDraft(); setupDraft.mode = "random"; renderSetup(); };
  $("#modeManual").onclick = () => { syncSetupDraft(); setupDraft.mode = "manual"; renderSetup(); };
  $("#modeManualFake").onclick = () => { syncSetupDraft(); setupDraft.mode = "manualFake"; renderSetup(); };

  $("#startBtn").onclick = () => {
    syncSetupDraft();
    const names = setupDraft.names.split("\n").map((n) => n.trim()).filter(Boolean);
    const numTeams = Math.max(1, Math.floor(Number(setupDraft.numTeams)) || 1);
    if (!names.length) {
      alert("Add at least one player.");
      return;
    }
    if (names.length < numTeams) {
      alert(`You have ${numTeams} teams but only ${names.length} player(s). Add more players or lower the team count.`);
      return;
    }

    if (setupDraft.mode === "manual" || setupDraft.mode === "manualFake") {
      // Pre-fill with the same even split as random mode, so the host is
      // just nudging people between teams rather than starting from blank.
      const groups = distributeEvenly(names, numTeams);
      const teamOf = {};
      groups.forEach((members, idx) => members.forEach((n) => (teamOf[n] = idx)));
      manualDraft = { names, numTeams, teamOf, fakeSpin: setupDraft.mode === "manualFake" };
      renderManualAssign();
    } else {
      const groups = distributeEvenly(shuffle(names), numTeams);
      gameClient.startGame(groups, false);
    }
  };
}

function syncSetupDraft() {
  const namesEl = $("#names");
  const numTeamsEl = $("#numTeams");
  if (namesEl) setupDraft.names = namesEl.value;
  if (numTeamsEl) setupDraft.numTeams = numTeamsEl.value;
}

// ---------- MANUAL TEAM ASSIGNMENT ----------
function renderManualAssign() {
  const { names, numTeams, teamOf, fakeSpin } = manualDraft;
  const teamOptions = Array.from({ length: numTeams }, (_, i) => i);

  app.innerHTML = `
    <h2>${fakeSpin ? "🎭 Place each player" : "✋ Place each player"}</h2>
    <p style="color:var(--muted)">${fakeSpin ? "Pick a team for everyone. The TV will still \"spin\" to reveal them - nobody will know it's rigged." : "Pick a team for everyone, then confirm."}</p>
    <div style="display:flex; flex-direction:column; gap:8px;">
      ${names.map((name) => `
        <div style="display:flex; align-items:center; gap:10px;">
          <div style="flex:1;">${name}</div>
          <select data-name="${name}" style="flex:1;">
            ${teamOptions.map((idx) => `<option value="${idx}" ${teamOf[name] === idx ? "selected" : ""}>Team ${idx + 1}</option>`).join("")}
          </select>
        </div>
      `).join("")}
    </div>
    <div style="display:flex; gap:10px; margin-top:16px;">
      <button id="backBtn" class="secondary" style="flex:1;">← Back</button>
      <button id="confirmBtn" style="flex:1;">🎉 Confirm Teams</button>
    </div>
  `;

  app.querySelectorAll("select[data-name]").forEach((sel) => {
    sel.onchange = () => { manualDraft.teamOf[sel.dataset.name] = Number(sel.value); };
  });

  $("#backBtn").onclick = () => { manualDraft = null; render(); };
  $("#confirmBtn").onclick = () => {
    const groups = Array.from({ length: numTeams }, () => []);
    names.forEach((name) => groups[manualDraft.teamOf[name]].push(name));
    // fakeSpin: pass manual=false so tv.js plays the full randomized wheel
    // reveal even though the groups were actually hand-picked by the host.
    gameClient.startGame(groups, !manualDraft.fakeSpin);
    manualDraft = null;
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
  // Buzzers only matter while the question is up for grabs, before the
  // answer's revealed.
  const buzzableStep = state.step === "question" || state.step === "bonus_question";

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
    ${buzzableStep ? renderBuzzControls() : ""}
    <button id="nextBtn" style="width:100%; margin-top:6px;">${nextLabel}</button>
    <div class="score-panel" id="scorePanel" style="margin-top:20px;"></div>
  `;
  $("#nextBtn").onclick = () => gameClient.next();

  if (buzzableStep) {
    const buzzersBtn = $("#buzzersBtn");
    if (buzzersBtn) buzzersBtn.onclick = () => gameClient.openBuzzers();
    startBuzzCountdownDisplay();
  }

  renderScorePanel();
}

// ---------- BUZZ PANEL (host view) ----------
function renderBuzzControls() {
  if (!state.buzzesOpen) {
    return `<button id="buzzersBtn" style="width:100%; margin-top:10px;">🔔 Buzzers</button>`;
  }
  const active = gameClient.activeBuzzArray(state);
  if (!active.length) {
    return `<div class="buzz-host-panel"><p style="color:var(--muted); text-align:center; margin:10px 0;">🔔 Buzzers open - waiting for the first buzz...</p></div>`;
  }
  return `
    <div class="buzz-host-panel">
      <ol class="buzz-list">
        ${active.map((b, i) => `
          <li>
            <span>#${i + 1} ${b.name} <span style="opacity:0.7">(${b.team})</span></span>
            ${i === 0 ? `<span id="buzzCountdown">10s</span>` : ""}
          </li>
        `).join("")}
      </ol>
    </div>
  `;
}

// Ticks the "#buzzCountdown" text every 250ms without a full re-render, so
// the host sees the 10s window counting down live on the top buzzer.
let buzzCountdownInterval = null;
function startBuzzCountdownDisplay() {
  if (buzzCountdownInterval) clearInterval(buzzCountdownInterval);
  buzzCountdownInterval = setInterval(() => {
    const el = document.getElementById("buzzCountdown");
    if (!el) return;
    if (!state.buzzExpireAt) { el.textContent = "10s"; return; }
    const remaining = Math.max(0, Math.ceil((state.buzzExpireAt - Date.now()) / 1000));
    el.textContent = `${remaining}s`;
  }, 250);
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
