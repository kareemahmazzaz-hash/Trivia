const app = $("#app");
let state = { phase: "setup" };
let lastPhase = null;
let lastWheelTarget = undefined; // undefined = never rendered yet, so first spin always plays

gameClient.onState((s) => {
  const changed = s.phase !== lastPhase;
  lastPhase = s.phase;
  state = s;

  switch (state.phase) {
    case "teams": return changed ? playTeamsReveal() : null;
    case "lobby": return renderLobby();
    case "question": return renderQuestionPhase();
    case "gameover": return renderGameOver();
    default: return renderWaiting();
  }
});

gameClient.connect((status) => {
  if (status === "error") {
    app.innerHTML = `<div class="card" style="text-align:center;"><h2>⚠️ Can't reach the server</h2><p style="color:var(--muted)">${TRANSPORT === "firebase" ? "Check your internet connection and firebase-config.js." : "Make sure this device is on the same WiFi as the computer running the server."}</p></div>`;
  }
});

function renderWaiting() {
  app.innerHTML = `<div class="card" style="text-align:center;"><h2>Waiting for the host to start the game...</h2></div>`;
}

// ---------- TEAMS REVEAL ----------
async function playTeamsReveal() {
  const players = state.players || {};
  const teams = state.teams || {};

  app.innerHTML = `
    <div class="wheel-wrap"><div class="wheel-pointer"></div><canvas id="wheel" width="340" height="340"></canvas></div>
    <div class="team-grid" id="teamGrid"></div>
  `;
  const teamIdxs = Object.keys(teams);
  $("#teamGrid").innerHTML = teamIdxs.map((idx) => `
    <div class="team-card"><h3>${teams[idx].name}</h3><div id="team-${idx}"></div></div>
  `).join("");

  const order = [];
  teamIdxs.forEach((idx) => teams[idx].members.forEach((name) => order.push({ name, idx })));

  let remaining = Object.keys(players);
  const canvas = $("#wheel");
  for (const step of order) {
    const target = remaining.indexOf(step.name);
    await spinWheelAsync(canvas, remaining, target);
    const slot = document.createElement("div");
    slot.className = "member";
    slot.textContent = step.name;
    $(`#team-${step.idx}`).appendChild(slot);
    remaining.splice(target, 1);
    await new Promise((r) => setTimeout(r, 400));
  }
}

// ---------- LOBBY / QR ----------
function renderLobby() {
  const joinUrl = location.href.replace("tv.html", "player.html");
  app.innerHTML = `
    <div class="card" style="text-align:center; max-width:500px;">
      <h2>Scan to join!</h2>
      <div id="qrcode" style="display:inline-block;"></div>
      <p style="color:var(--muted); margin-top:10px; word-break:break-all;">${joinUrl}</p>
    </div>
    <div class="team-grid" id="teamGrid"></div>
  `;
  if (typeof QRCode !== "undefined") {
    new QRCode($("#qrcode"), { text: joinUrl, width: 220, height: 220 });
  } else {
    $("#qrcode").innerHTML = `<p style="color:#333;">(No internet for QR code - players can type the URL above)</p>`;
  }

  const teams = state.teams || {};
  const players = state.players || {};
  $("#teamGrid").innerHTML = Object.entries(teams).map(([idx, t]) => `
    <div class="team-card"><h3>${t.name}</h3>
      ${t.members.map((n) => `<div class="member" style="opacity:1;">${players[n]?.joined ? "✅" : "⏳"} ${n}</div>`).join("")}
    </div>
  `).join("");
}

// ---------- QUESTION PHASE ROUTER ----------
function renderQuestionPhase() {
  if (state.step === "category") return renderCategoryStep();
  if (state.step === "tiebreak_done") return renderTiebreakDone();
  lastWheelTarget = undefined; // reset so the next round's spin always plays
  return renderQuestionLoop();
}

// ---------- CATEGORY WHEEL ----------
async function renderCategoryStep() {
  const targetChanged = state.wheelTarget !== lastWheelTarget;

  app.innerHTML = `
    ${scoreTopbar()}
    <div class="wheel-wrap"><div class="wheel-pointer"></div><canvas id="wheel" width="360" height="360"></canvas></div>
    <div class="tv-category" id="categoryLabel" style="font-size:1.6rem;">${categoryStepMessage()}</div>
  `;
  const canvas = $("#wheel");

  if (state.wheelTarget == null) {
    drawWheel(canvas, WHEEL_LABELS, 0);
    return;
  }

  if (targetChanged) {
    lastWheelTarget = state.wheelTarget;
    await spinWheelAsync(canvas, WHEEL_LABELS, state.wheelTarget);
    const label = $("#categoryLabel");
    if (label) label.textContent = categoryStepMessage();
  } else {
    drawWheel(canvas, WHEEL_LABELS, wheelRestRotation(state.wheelTarget));
  }
}

function wheelRestRotation(targetIndex) {
  const n = WHEEL_LABELS.length;
  const arc = (2 * Math.PI) / n;
  return -(targetIndex * arc + arc / 2) - Math.PI / 2;
}

function categoryStepMessage() {
  if (state.wheelTarget == null) return "🎡 Waiting for the host to spin...";
  if (state.pendingJoker) return "🃏 Joker! Host is picking a category...";
  if (state.category) return CATEGORIES[state.category].label;
  return "";
}

// ---------- QUESTION LOOP (question / answer / bonus_question / bonus_answer) ----------
function renderQuestionLoop() {
  const q = currentQuestion(state);
  if (!q) return;
  const isBonus = state.step === "bonus_question" || state.step === "bonus_answer";
  const content = isBonus ? q.bonus : q;
  const showAnswer = state.step === "answer" || state.step === "bonus_answer";
  const key = gameClient.buzzKey(state);
  const buzzes = (state.buzzes && state.buzzes[key]) || [];
  const categoryLabel = state.tiebreaker ? "🏆 Tie-breaker: Politics" : CATEGORIES[state.category].label;
  const isArabic = !!content.arabic;

  app.innerHTML = `
    ${scoreTopbar()}
    <div class="tv-main">
      <div class="tv-question-col">
        <div class="tv-category" ${isBonus ? `style="color:var(--accent2)"` : ""}>${isBonus ? "🎁 BONUS — " : ""}${categoryLabel}</div>
        ${q.image && !isBonus ? `<img src="${q.image}" alt="" style="max-width:100%; max-height:280px; display:block; margin:10px auto; border-radius:14px;">` : ""}
        <div class="tv-question ${isArabic ? "" : "ltr"}">${tvText(content)}</div>
        ${showAnswer ? `<div class="tv-answer ${isArabic ? "" : "ltr"}">✅ ${content.answer}</div>` : ""}
      </div>
      <div class="tv-buzz-col">
        <h3>Buzz Order</h3>
        <ol class="buzz-list">${buzzes.map((b, i) => `<li><span>#${i + 1} ${b.name}</span><span>${b.team}</span></li>`).join("")}</ol>
      </div>
    </div>
  `;
}

// ---------- TIE-BREAKER "what next" STEP ----------
function renderTiebreakDone() {
  app.innerHTML = `
    ${scoreTopbar()}
    <div class="card" style="text-align:center;"><h2>🏆 Tie-breaker!</h2><p style="color:var(--muted)">Waiting for the host...</p></div>
  `;
}

function scoreTopbar() {
  const teams = state.teams || {};
  const scores = state.scores || {};
  return `<div class="tv-topbar">${Object.entries(teams).map(([idx, t]) => `<div class="tv-score-pill">${t.name}<span class="n">${scores[idx] || 0}</span></div>`).join("")}</div>`;
}

// ---------- GAME OVER ----------
function renderGameOver() {
  const teams = state.teams || {};
  const scores = state.scores || {};
  const ranked = Object.entries(teams).sort((a, b) => (scores[b[0]] || 0) - (scores[a[0]] || 0));
  app.innerHTML = `
    <h2>🏆 Final Results</h2>
    <div class="tv-topbar">${ranked.map(([idx, t], i) =>
      `<div class="tv-score-pill">${i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "🎗️"} ${t.name}<span class="n">${scores[idx] || 0}</span></div>`).join("")}</div>
  `;
}
