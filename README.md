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
- `CATEGORIES` - an object keyed by category (`geography`, `history`,
  `science`, `sports`, `math`, `general`, `politics`), each with a `label`
  and 10 `questions`. Each question has:
  - `franko` - shown only on the host's phone (Franco-Arabic). Optional.
  - `arabic` - shown only on the TV (Arabic script). Optional.
  - `text` - English. Shown on the host screen whenever `franko` isn't set,
    and on the TV whenever `arabic` isn't set - so English-only questions
    just work, no need to fill in every field.
  - `note` - shown only on the host's phone (context/hints, for your eyes only)
  - `answer` - shown only on the host's phone until you reveal it on the TV
  - `image` *(optional)* - path to an image (e.g. a flag) shown on both screens
  - `bonus` *(optional)* - same shape (`franko`/`arabic`/`text`/`answer`). If
    present, after the main answer the host gets a "Show Bonus Question"
    option with its own fresh buzz-in round, before moving on.

## The category wheel

Instead of going through questions in order, each round starts with a
**7-slot wheel**: the 6 regular categories above plus a **🃏 Joker** slot.

- **Politics is not on the wheel.** It's held back as a tie-breaker - see below.
- **Joker**: if the wheel lands here, the host picks any of the 6 regular
  categories manually on their phone.
- Within a category, questions are drawn in a random order (no repeats until
  that category is exhausted), and the shuffle is built to make it unlikely
  (but not impossible) that two bonus questions land back-to-back.
- The wheel automatically skips categories that have run out of questions,
  and drops the Joker slot too once every regular category is exhausted.

## Tie-breaker (Politics)

At any point on the category screen, the host can tap **🏆 Tie-breaker
(Politics)**. This switches into the Politics question pool (never touched
by the regular wheel) for exactly that purpose. After each Politics
question, the host can pull another one or tap **🏁 Finish Game**.

## Running the game

1. **TV**: open the app.
2. **Host**: review/edit the 10 names, tap **Assign Teams** - the TV plays the
   team-picking wheel.
3. Tap **Next: Show Join QR Code**. Players scan it and tap their own name.
4. Tap **Start Questions**.
5. Each round: tap **Spin the Category Wheel** (the TV animates it), then
   **Continue** to draw a question from that category (or pick a category
   first, if it landed on Joker). The host sees the question/note/answer,
   taps **Lock & Reveal Answer** when ready, awards points with ➕/➖ whenever
   it makes sense, and taps **Next** to move on (or into a bonus question, if
   that question has one) - which returns to the wheel for the next round.
6. Whenever you're ready to stop - after a natural tie, or once every
   category is used up - tap **🏆 Tie-breaker (Politics)** if needed, then
   **🏁 Finish Game** to show the final leaderboard.

A **🔄 Reset Game** button sits at the top of the host screen at all times -
tap it (any point in the game) to wipe players, teams, and scores and jump
everyone back to name entry for a new game. Player phones detect the reset
automatically and bounce back to the join screen.

After a player claims their name, they're asked to name their team before
the buzzer shows up - any teammate can set it, and everyone on that team
moves on automatically once it's saved.

## Tech notes

- No build step - plain HTML/CSS/JS. LAN mode uses Express + Socket.IO;
  Firebase mode uses the Firebase Realtime Database, loaded via CDN.
- All game logic (what "Next" does, whose turn to buzz) lives in one shared
  function (`computeNextStep` in `questions.js`) used by both the LAN server
  and the Firebase client, so both modes behave identically.
- `public/js/gameClient.js` is the only file that knows about LAN vs Firebase;
  `host.js`, `tv.js`, and `player.js` just call `gameClient.*` and don't care
  which mode is active.
