// Edit this file before game night.
// TEAM_SIZE * number of teams should equal the number of names below (2 x 5 = 10).
const TEAM_SIZE = 2;

const DEFAULT_PLAYER_NAMES = [
  "Alex", "Sam", "Jordan", "Taylor", "Morgan",
  "Casey", "Riley", "Jamie", "Drew", "Skyler"
];

// Each question has:
//   franko - shown ONLY on the host's phone (Franco-Arabic)
//   arabic - shown ONLY on the TV (Arabic script)
//   note   - shown ONLY on the host's phone (hints/context, for your eyes only)
//   answer - shown ONLY on the host's phone until you reveal it on the TV
//   bonus  - optional. Same shape (franko/arabic/answer). If present, after
//            revealing the main answer the host gets a "Show Bonus" option
//            before moving to the next question, with its own fresh buzz-in round.
//
// This file auto-generates 100 placeholders for you to fill in - replace the
// bracketed text. A bonus sub-question is pre-added every 7th question as an
// example; add/remove `bonus` blocks on any question you like.
const QUESTIONS = [];
for (let i = 1; i <= 100; i++) {
  const q = {
    franko: `Soal ${i}: [7ot el so2al hena bel franko]`,
    arabic: `السؤال ${i}: [اكتب السؤال هنا بالعربي]`,
    note: "",
    answer: `[el egaba hena]`
  };
  if (i % 7 === 0) {
    q.bonus = {
      franko: `Bonus so2al ${i}: [so2al edafy bel franko]`,
      arabic: `سؤال بونص ${i}: [اكتب السؤال الإضافي هنا]`,
      answer: `[egabet el bonus]`
    };
  }
  QUESTIONS.push(q);
}

// Pure function deciding what the host's single "Next" button does, given
// the current state. Used by both the LAN server and the Firebase client so
// they behave identically. Returns null if not currently in the question loop.
function computeNextStep(state, questions) {
  const qLen = questions.length;
  const qIdx = state.questionIndex;
  const hasBonus = !!(questions[qIdx] && questions[qIdx].bonus);

  if (state.step === "question") {
    return { step: "answer", buzzesOpen: false };
  }
  if (state.step === "answer") {
    if (hasBonus) return { step: "bonus_question", buzzesOpen: true, clearBuzz: true };
    return qIdx + 1 < qLen
      ? { step: "question", questionIndex: qIdx + 1, buzzesOpen: true, clearBuzz: true }
      : { gameover: true };
  }
  if (state.step === "bonus_question") {
    return { step: "bonus_answer", buzzesOpen: false };
  }
  if (state.step === "bonus_answer") {
    return qIdx + 1 < qLen
      ? { step: "question", questionIndex: qIdx + 1, buzzesOpen: true, clearBuzz: true }
      : { gameover: true };
  }
  return null;
}

// This file is loaded two ways: as a <script> tag in the browser (where it
// just needs to define the globals above) and via require() in server.js
// (where it needs to export them). This line makes both work.
if (typeof module !== "undefined") {
  module.exports = { TEAM_SIZE, DEFAULT_PLAYER_NAMES, QUESTIONS, computeNextStep };
}
