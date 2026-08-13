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
  lastWheelTarget = undefined; // in case this follows a reset, next game's spin should always play
}

// ---------- TEAMS REVEAL ----------
async function playTeamsReveal() {
  const players = state.players || {};
  const teams = state.teams || {};
  const manual = !!state.manual; // host hand-picked teams - nothing to "reveal", so skip the wheel

  app.innerHTML = `
    ${manual ? "" : `<div class="wheel-wrap"><div class="wheel-pointer"></div><canvas id="wheel" width="340" height="340"></canvas></div>`}
    <div class="team-grid" id="teamGrid"></div>
  `;
  const teamIdxs = Object.keys(teams);
  $("#teamGrid").innerHTML = teamIdxs.map((idx) => `
    <div class="team-card"><h3>${teams[idx].name}</h3><div id="team-${idx}"></div></div>
  `).join("");

  const order = [];
  teamIdxs.forEach((idx) => teams[idx].members.forEach((name) => order.push({ name, idx })));

  let remaining = Object.keys(players);
  const canvas = manual ? null : $("#wheel");
  for (const step of order) {
    if (!manual) {
      const target = remaining.indexOf(step.name);
      // With 2 (or 1) names left there's nothing left to "reveal" - spinning
      // a wheel with only one or two slices is pointless and looks broken,
      // so just place the rest without animating.
      if (remaining.length > 2) {
        await spinWheelAsync(canvas, remaining, target);
      }
      remaining.splice(target, 1);
    }
    const slot = document.createElement("div");
    slot.className = "member";
    slot.textContent = step.name;
    $(`#team-${step.idx}`).appendChild(slot);
    await new Promise((r) => setTimeout(r, manual ? 250 : 400));
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
    <div class="wheel-wrap large"><div class="wheel-pointer"></div><canvas id="wheel" width="560" height="560"></canvas></div>
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
  // Once the wheel has landed on a real category, don't spoil it here below
  // the wheel - the host sees it on their phone, and it's revealed to
  // everyone at the top of the question screen once confirmed.
  return "";
}

// ---------- QUESTION LOOP (question / answer / bonus_question / bonus_answer) ----------
function renderQuestionLoop() {
  const q = currentQuestion(state);
  if (!q) return;
  const isBonus = state.step === "bonus_question" || state.step === "bonus_answer";
  const content = isBonus ? q.bonus : q;
  const showAnswer = state.step === "answer" || state.step === "bonus_answer";
  // Buzzers only show up (and the countdown only runs) while it's still up
  // for grabs. Expired buzzes drop off the list entirely.
  const buzzableStep = state.step === "question" || state.step === "bonus_question";
  const buzzes = gameClient.activeBuzzArray(state);
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
        <p id="buzzWrongMsg" style="color:#ff5a5a; font-weight:800; min-height:1.3em; margin:2px 0 8px;"></p>
        ${buzzableStep && !state.buzzesOpen
          ? `<p style="color:var(--muted); font-size:0.95rem;">🔔 Waiting for host...</p>`
          : `<ol class="buzz-list">${buzzes.map((b, i) => `
              <li><span>#${i + 1} ${b.name}</span><span>${buzzableStep && b.pid === state.buzzTopPid ? `<span id="buzzCountdown">10s</span> · ` : ""}${b.team}</span></li>
            `).join("")}</ol>`
        }
      </div>
    </div>
  `;

}

// ---------- SOUND EFFECTS ----------
// Synthesized with the Web Audio API so no external sound files are needed.
// Browsers block audio until a user gesture happens somewhere on the page,
// so the AudioContext is created/resumed lazily on first click/tap/keypress.
let audioCtx = null;
function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}
["click", "touchstart", "keydown"].forEach((evt) =>
  document.addEventListener(evt, () => getAudioCtx(), { once: true })
);

// Short high beep on every second of the countdown ticking down.
function playTickBeep() {
  const ctx = getAudioCtx();
  const t0 = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = 880;
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(0.3, t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.12);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + 0.13);
}

// Big descending "wrong buzzer" sound when the 10s runs out. Its length
// MUST match BUZZ_WRONG_SOUND_MS in gameClient.js/server.js, since the host
// holds off the next buzzer's timer for exactly this long.
const BUZZ_WRONG_SOUND_MS = 1500;
function playBuzzerWrong() {
  const ctx = getAudioCtx();
  const t0 = ctx.currentTime;
  const dur = BUZZ_WRONG_SOUND_MS / 1000;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.4, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  gain.connect(ctx.destination);

  const osc1 = ctx.createOscillator();
  osc1.type = "sawtooth";
  osc1.frequency.setValueAtTime(180, t0);
  osc1.frequency.exponentialRampToValueAtTime(70, t0 + dur);

  const osc2 = ctx.createOscillator();
  osc2.type = "square";
  osc2.frequency.setValueAtTime(150, t0);
  osc2.frequency.exponentialRampToValueAtTime(55, t0 + dur);

  osc1.connect(gain);
  osc2.connect(gain);
  osc1.start(t0); osc2.start(t0);
  osc1.stop(t0 + dur); osc2.stop(t0 + dur);
}

// Ticks the "#buzzCountdown" text every 250ms. Started ONCE below, at file
// scope, rather than restarted from inside renderQuestionLoop() - state
// updates unrelated to the buzz (score, buzzesOpen toggles, a new buzzer
// taking the lead, etc.) call renderQuestionLoop() and rebuild app.innerHTML
// far more often than the countdown itself changes. Restarting the interval
// on every one of those rebuilds meant the display didn't tick again until
// up to 250ms after the latest render, which showed up as visible lag/stutter
// right when someone buzzed in. A single continuous interval - mirroring how
// host.js already does this - just polls whatever #buzzCountdown element
// currently exists in the DOM, so it keeps ticking smoothly across renders.
let lastBuzzTopPid = null;
let lastTickSecond = null;
let wrongSoundPlayedFor = null; // tracks which buzzDelayUntil value we've already played the sound for
setInterval(() => {
  // A buzzer's turn just ended (buzzTopPid went from set to null) and the
  // host set a fresh buzzDelayUntil for it - play the big wrong-buzzer sound
  // exactly once for this expiry.
  if (lastBuzzTopPid && !state.buzzTopPid && state.buzzDelayUntil && wrongSoundPlayedFor !== state.buzzDelayUntil) {
    wrongSoundPlayedFor = state.buzzDelayUntil;
    playBuzzerWrong();
  }
  lastBuzzTopPid = state.buzzTopPid;

  const msgEl = document.getElementById("buzzWrongMsg");
  if (msgEl) {
    msgEl.textContent = (state.buzzDelayUntil && gameClient.serverNow() < state.buzzDelayUntil) ? "❌ Wrong! Next buzzer..." : "";
  }

  const el = document.getElementById("buzzCountdown");
  if (!el) { lastTickSecond = null; return; }
  if (!state.buzzExpireAt || !state.buzzTopPid) { el.textContent = "10s"; lastTickSecond = null; return; }

  const remaining = Math.max(0, Math.ceil((state.buzzExpireAt - gameClient.serverNow()) / 1000));
  el.textContent = `${remaining}s`;

  if (remaining !== lastTickSecond) {
    lastTickSecond = remaining;
    if (remaining > 0) playTickBeep();
  }
}, 250);

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
