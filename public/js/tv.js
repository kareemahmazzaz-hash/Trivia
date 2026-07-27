const app = $("#app");
let state = { phase: "setup" };
let lastPhase = null;

gameClient.onState((s) => {
  const changed = s.phase !== lastPhase;
  lastPhase = s.phase;
  state = s;

  switch (state.phase) {
    case "teams": return changed ? playTeamsReveal() : null;
    case "lobby": return renderLobby();
    case "question": return renderQuestionLoop();
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

// ---------- QUESTION LOOP ----------
function renderQuestionLoop() {
  const q = QUESTIONS[state.questionIndex];
  const isBonus = state.step === "bonus_question" || state.step === "bonus_answer";
  const content = isBonus ? q.bonus : q;
  const showAnswer = state.step === "answer" || state.step === "bonus_answer";
  const key = gameClient.buzzKey(state);
  const buzzes = (state.buzzes && state.buzzes[key]) || [];

  app.innerHTML = `
    ${scoreTopbar()}
    <div class="tv-main">
      <div class="tv-question-col">
        ${isBonus
          ? `<div class="tv-category" style="color:var(--accent2)">🎁 بونص</div>`
          : `<div class="tv-category">سؤال ${state.questionIndex + 1} من ${QUESTIONS.length}</div>`}
        <div class="tv-question">${content.arabic}</div>
        ${showAnswer ? `<div class="tv-answer">✅ ${content.answer}</div>` : ""}
      </div>
      <div class="tv-buzz-col">
        <h3>Buzz Order</h3>
        <ol class="buzz-list">${buzzes.map((b, i) => `<li><span>#${i + 1} ${b.name}</span><span>${b.team}</span></li>`).join("")}</ol>
      </div>
    </div>
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
