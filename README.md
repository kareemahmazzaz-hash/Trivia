# 🎉 Trivia Night

A live, phone-buzzer trivia game for one TV/laptop screen + a host phone + player
phones. Works two ways - pick one in `public/js/config.js`:

- **`"lan"`** (default) - run a small server on your laptop, everyone connects
  over the same WiFi. No internet, no accounts, nothing to deploy.
- **`"firebase"`** - no server to run; deploy the `public/` folder anywhere
  (e.g. GitHub Pages) and everyone connects over the internet via a free
  Firebase project.

Both modes use the exact same pages and behave identically - only how devices
talk to each other changes.

## The three screens

- **`tv.html`** - the shared screen. Shows the team wheel, the join QR code,
  the score of every team along the top, the question in **Arabic** in the
  middle, the live buzz-in order on the side, and the answer underneath the
  question once you reveal it.
- **`host.html`** - your phone, the remote control. Shows the question in
  **Franco-Arabic**, your private note about it, the answer, one **Next**
  button that advances the TV through the flow, and a scoreboard where you
  tap ➕/➖ per team (or tap the number to type an exact score) - scoring is
  entirely up to you.
- **`player.html`** - each player's phone. After picking their name, it shows
  **nothing but the buzzer**.

## Option A: LAN mode (no internet needed)

1. Install [Node.js](https://nodejs.org) on the laptop that will run the game.
2. In this folder, run:
   ```bash
   npm install
   npm start
   ```
3. The terminal prints two addresses, e.g.:
   ```
   On this computer:  http://localhost:3000
   On your WiFi:      http://192.168.1.42:3000
   ```
4. Open the **"On your WiFi"** address on the laptop (`tv.html`) and on your
   phone (`host.html`). Everyone's phones must be on the same WiFi network.
5. Leave `js/config.js` as `TRANSPORT = "lan"`.

## Option B: Online mode (Firebase)

1. Go to https://console.firebase.google.com → create a free project.
2. **Build → Realtime Database → Create Database** → start in **test mode**.
3. ⚙️ **Project settings** → "Your apps" → click **`</>`** (Web) → register an
   app → copy the config object into `public/js/firebase-config.js`.
4. In `public/js/config.js`, set `TRANSPORT = "firebase"`.
5. Deploy the `public/` folder as a static site (GitHub Pages, Netlify, etc.),
   or just open the files locally for testing. Everyone needs internet, not
   the same WiFi.
6. Firebase test-mode rules open the database to anyone with the URL for 30
   days - fine for one game night; tighten the rules or delete the project
   afterward if you're concerned.

## Customize your questions

Edit `public/js/questions.js`:
- `DEFAULT_PLAYER_NAMES` - your 10 players (or type them into the host screen
  on the night). `TEAM_SIZE` controls players per team.
- `QUESTIONS` - 100 placeholders are generated for you. Each one has:
  - `franko` - shown only on the host's phone (Franco-Arabic)
  - `arabic` - shown only on the TV (Arabic script)
  - `note` - shown only on the host's phone (context/hints, for your eyes only)
  - `answer` - shown only on the host's phone until you reveal it on the TV
  - `bonus` *(optional)* - same shape (`franko`/`arabic`/`answer`). If present,
    after the main answer the host gets a "Show Bonus Question" option with
    its own fresh buzz-in round, before moving to the next question.
  A bonus is pre-added to every 7th question as an example - add or remove
  `bonus` blocks on whichever questions you like.

## Running the game

1. **TV**: open the app.
2. **Host**: review/edit the 10 names, tap **Assign Teams** - the TV plays the
   team-picking wheel.
3. Tap **Next: Show Join QR Code**. Players scan it and tap their own name.
4. Tap **Start Questions**.
5. For each question: the host sees the question/note/answer, taps **Lock &
   Reveal Answer** when ready, awards points with ➕/➖ whenever it makes sense,
   and taps **Next** again to move on (or into a bonus question, if that
   question has one, or straight to the next question).
6. After the last question, **Finish Game** shows the final leaderboard.

To start over, use **Reset Game** on the host's game-over screen.

## Tech notes

- No build step - plain HTML/CSS/JS. LAN mode uses Express + Socket.IO;
  Firebase mode uses the Firebase Realtime Database, loaded via CDN.
- All game logic (what "Next" does, whose turn to buzz) lives in one shared
  function (`computeNextStep` in `questions.js`) used by both the LAN server
  and the Firebase client, so both modes behave identically.
- `public/js/gameClient.js` is the only file that knows about LAN vs Firebase;
  `host.js`, `tv.js`, and `player.js` just call `gameClient.*` and don't care
  which mode is active.
