const app = $("#app");
let session = JSON.parse(localStorage.getItem("triviaSession") || "null");
let state = { phase: "setup" };
let ready = false;

function render() {
  if (!ready) return;
  if (!session) return renderJoinFlow();
  if (needsTeamName()) return renderTeamNameFlow();
  renderBuzzerOnly();
}

function needsTeamName() {
  const t = (state.teams || {})[session.team];
  return !!t && !t.nameSet;
}

gameClient.onState((s) => {
  state = s;
  render();
});

gameClient.connect((status) => {
  if (status === "error") {
    app.innerHTML = card("⚠️ Can't reach the server - make sure you're connected properly.");
    return;
  }
  if (status === "connected" && !ready) {
    if (session) {
      gameClient.rejoin(session.name, session.pid, (res) => {
        if (!res || !res.ok) {
          localStorage.removeItem("triviaSession");
          session = null;
        }
        ready = true;
        render();
      });
    } else {
      ready = true;
      render();
    }
  }
});

function renderJoinFlow() {
  if (!state.phase || state.phase === "setup") {
    app.innerHTML = card("Waiting for the host to start the game...");
    return;
  }
  const players = state.players || {};
  const names = Object.keys(players);
  if (!names.length) {
    app.innerHTML = card("Teams haven't been set up yet...");
    return;
  }
  app.innerHTML = `
    <div class="card" style="text-align:center; max-width:400px;">
      <h2>Which name is yours?</h2>
      <select id="nameSelect">
        ${names.map((n) => `<option value="${n}" ${players[n].joined ? "disabled" : ""}>${n}${players[n].joined ? " (taken)" : ""}</option>`).join("")}
      </select>
      <br><br>
      <button id="joinBtn">That's me!</button>
    </div>
  `;
  $("#joinBtn").onclick = () => {
    const name = $("#nameSelect").value;
    gameClient.join(name, (res) => {
      if (!res || !res.ok) {
        alert("That name was just taken - pick another one.");
        return renderJoinFlow();
      }
      session = { name, pid: res.pid, team: res.team };
      localStorage.setItem("triviaSession", JSON.stringify(session));
      render();
    });
  };
}

// Shown once, right after a player joins - lets the team pick a name.
// Reactive: as soon as ANY teammate saves a name, everyone's screen moves on.
function renderTeamNameFlow() {
  const t = (state.teams || {})[session.team] || {};
  app.innerHTML = `
    <div class="card" style="text-align:center; max-width:400px;">
      <h2>🏷️ Name your team!</h2>
      <p style="color:var(--muted);">You're on ${t.name || "a team"} with: ${(t.members || []).filter((n) => n !== session.name).join(", ") || "..."}</p>
      <input id="teamNameInput" type="text" maxlength="24" placeholder="e.g. The Quiz Wizards" style="width:100%; margin-top:10px;">
      <br><br>
      <button id="teamNameBtn" style="width:100%;">Save Team Name</button>
      <button id="skipTeamNameBtn" class="secondary" style="width:100%; margin-top:10px;">Keep "${t.name || ""}"</button>
    </div>
  `;
  $("#teamNameBtn").onclick = () => {
    const name = $("#teamNameInput").value.trim();
    if (!name) { alert("Type a team name, or tap the button below to keep the default."); return; }
    gameClient.setTeamName(session.team, name);
  };
  $("#skipTeamNameBtn").onclick = () => {
    gameClient.setTeamName(session.team, t.name || "Team");
  };
}

// Nothing but the buzzer once you've joined and named your team.
function renderBuzzerOnly() {
  const canBuzz = state.phase === "question" && state.buzzesOpen;
  const buzzes = gameClient.buzzArray(state);
  const alreadyBuzzed = buzzes.some((b) => b.pid === session.pid);
  const active = canBuzz && !alreadyBuzzed;

  app.innerHTML = `
    <div class="player-screen">
      <button id="buzzBtn" class="buzz-button" ${active ? "" : "disabled"}>${alreadyBuzzed ? "✓" : "BUZZ"}</button>
    </div>
  `;
  if (active) {
    $("#buzzBtn").onclick = () => {
      $("#buzzBtn").disabled = true;
      $("#buzzBtn").textContent = "✓";
      gameClient.buzz(session.name, session.pid);
    };
  }
}

function card(msg) {
  return `<div class="card" style="text-align:center; max-width:400px;"><h2>${msg}</h2></div>`;
}
