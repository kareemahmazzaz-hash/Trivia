// Edit this file before game night.
// TEAM_SIZE * number of teams should equal the number of names below.
const TEAM_SIZE = 2;

const DEFAULT_PLAYER_NAMES = [
  "Mohamed", "Yahya", "Tante", "Amo", "Mama",
  "Amto", "Samia", "Hayat", "Baba", "Zahra"
];

// ============================================================================
// QUESTIONS, BY CATEGORY
// ----------------------------------------------------------------------------
// Each question has:
//   franko - shown ONLY on the host's phone (Franco-Arabic). Optional.
//   arabic - shown ONLY on the TV (Arabic script). Optional.
//   text   - English. Used on the host screen whenever `franko` isn't set,
//            and on the TV whenever `arabic` isn't set. This is how newly
//            English-only questions automatically show up in English on the
//            host screen while older franko/arabic questions keep working
//            exactly as before.
//   note   - shown ONLY on the host's phone (hints/context, for your eyes only)
//   answer - shown ONLY on the host's phone until you reveal it on the TV
//   image  - optional path to an image (e.g. a flag) shown on both screens
//   bonus  - optional. Same shape (franko/arabic/text/answer). If present,
//            after revealing the main answer the host gets a "Show Bonus"
//            option before moving on, with its own fresh buzz-in round.
// ============================================================================

const CATEGORIES = {
  geography: {
    label: "Geography",
    questions: [
      { text: "What is the smallest country in the world?", answer: "Vatican City" },
      { text: "What is the capital of Morocco?", answer: "Rabat" },
      {
        text: "The Nile River begins from two countries — which two?",
        answer: "Ethiopia and Uganda",
        bonus: { text: "What are the two rivers called?", answer: "The White Nile (Uganda) and the Blue Nile (Ethiopia)" }
      },
      { text: "How many time zones does China have?", answer: "1" },
      {
        text: "Egypt ranks 13th in population — who ranks 14th?",
        answer: "The Philippines",
        bonus: { text: "What is its capital?", answer: "Manila" }
      },
      { text: "Guess the country from its flag:", answer: "Mozambique", image: "images/flags/flag-mozambique.jpg" },
      { text: "Guess the country from its flag:", answer: "Nepal", image: "images/flags/flag-nepal.png" },
      { text: "Guess the country from its flag:", answer: "Malta", image: "images/flags/flag-malta.png" },
      { text: "Guess the country from its flag:", answer: "Rwanda", image: "images/flags/flag-rwanda.png" },
      { text: "Guess the country from its flag:", answer: "Zambia", image: "images/flags/flag-zambia.png" }
    ]
  },

  history: {
    label: "History",
    questions: [
      { text: "In what year was Egypt conquered (opened to Islam)?", answer: "20 AH, corresponding to 641 CE" },
      {
        text: "In what year did the Ottoman Empire begin?",
        answer: "1299",
        bonus: { text: "When did it occupy Egypt?", answer: "1517" }
      },
      {
        text: "When did World War I begin?",
        answer: "1914",
        bonus: { text: "When did it end?", answer: "1918" }
      },
      {
        text: "Who was the richest person in history?",
        answer: "Mansa Musa",
        bonus: { text: "What empire did he rule?", answer: "Mali" }
      },
      { text: "Who invented the light bulb?", answer: "Ebenezer Kinnersley, James Lindsay, Alexander de Lodyguine, and Franjo Hanaman" },
      { text: "Who was the first Arab to win a Nobel Prize, and in what year?", answer: "Ahmed Zewail, Chemistry, 1999" },
      { text: "What was the first pyramid built in Egypt?", answer: "The Pyramid of Djoser / the Step Pyramid, at Saqqara" },
      {
        text: "In what year did the first computer appear?",
        answer: "1946",
        bonus: { text: "Where?", answer: "Philadelphia, USA" }
      },
      { text: "Who killed the most people?", answer: "Genghis Khan" },
      { text: "Which country had the highest number of deaths in World War II?", answer: "The Soviet Union, around 27 million, followed by China with 15-20 million" }
    ]
  },

  science: {
    label: "Science",
    questions: [
      {
        text: "What is the chemical symbol for Germanium?",
        answer: "Ge",
        bonus: { text: "In which country was it discovered?", answer: "Germany" }
      },
      { text: "What color is liquid oxygen?", answer: "Blue" },
      { text: "Which element gives a flame a purple color when it burns?", answer: "Potassium" },
      { text: "What is the largest organ in the human body?", answer: "The skin" },
      { text: "What is the only major organ in the human body that can regenerate itself?", answer: "The liver" },
      {
        text: "By weight, what is the largest living organism on Earth?",
        answer: "The quaking aspen (the \"Pando\" colony)",
        bonus: { text: "Where is it located?", answer: "Utah, USA" }
      },
      { text: "What is the speed of light?", answer: "299,705 km/s" },
      {
        text: "What is the diameter of the Earth?",
        answer: "12,756 km",
        bonus: { text: "What is the mass of the Earth?", answer: "5.97 × 10^24 kg" }
      },
      { text: "What is the Moon's gravity?", answer: "1.625 m/s²" },
      { text: "How old is the universe?", answer: "13.8 billion years" }
    ]
  },

  sports: {
    label: "Sports",
    questions: [
      { text: "What does NBA stand for?", answer: "National Basketball Association" },
      { text: "Who won the Men's African Basketball Championship in 1962, 1964, 1970, 1975, and 1983?", answer: "Egypt" },
      {
        text: "In which country was volleyball invented?",
        answer: "The United States",
        bonus: { text: "In what year?", answer: "1895" }
      },
      { text: "Which club holds 8 titles in the Arab Club Volleyball Championship?", answer: "Al Ahly" },
      {
        text: "How many gold medals did Michael Phelps win?",
        answer: "23",
        bonus: { text: "How many medals in total?", answer: "28" }
      },
      { text: "Who won the gold medal in the 400m swim at Tokyo 2020?", answer: "Tunisia's Ahmed Hafnaoui, at age 18" },
      { text: "In handball, how many players are allowed on the court at the same time?", answer: "14" },
      {
        text: "In handball, Egypt made history at Tokyo 2020 by beating which team in the quarterfinals?",
        answer: "Germany",
        bonus: { text: "Why did it make history?", answer: "Egypt became the first African and non-European team to reach the semifinals" }
      },
      {
        text: "In which country was squash invented?",
        answer: "London, England",
        bonus: { text: "When?", answer: "1830" }
      },
      { text: "Which player won the World Squash Championship for the eighth time in 2024?", answer: "Nour El Sherbini" }
    ]
  },

  math: {
    label: "Math",
    questions: [
      { text: "How many minutes are in a full week?", answer: "10,080" },
      { text: "What is 34% of 43?", answer: "14.62" },
      { text: "51×16÷30+48÷16+432÷36−29÷145", answer: "42.0" },
      { text: "How old was I, in days, on this date: 3/19/2007?", answer: "175" },
      { text: "(√121 × 32 + 72 ÷ 18 - 3^3 − 965 ÷ 5) − (804 ÷ 12)", answer: "69" },
      { text: "1 + 2 + 3 + 4 + ... + 20 = ?", answer: "210" },
      { text: "14^2 ÷ 4 + 855 ÷ 95 + 23 ÷ 2875", answer: "58.008" },
      { text: "Five siblings want to split 1000 grams of meat among themselves, with each one getting 20 grams less than their older sibling. How much does the youngest get?", answer: "160 grams" },
      { text: "What is 42% of 69?", answer: "36" },
      { text: "√256 × 38 − 21^2 + 91 ÷ 13 + 28 − 27 × 5", answer: "67" }
    ]
  },

  general: {
    label: "General Knowledge",
    questions: [
      { text: "How do dogs perceive the color red?", answer: "As dark brown / gray / black" },
      { text: "What is the rarest and most expensive spice in the world by weight?", answer: "Saffron" },
      {
        text: "Which fruit was once believed to be poisonous in Europe?",
        answer: "The tomato",
        bonus: { text: "Why?", answer: "It used to be served on pewter plates, and it reacted with the tomato's acid to form a toxic compound" }
      },
      { text: "Which planet has the most moons?", answer: "Saturn" },
      { text: "What causes the \"pool\" smell?", answer: "Urea" },
      { text: "How many keys does a piano have?", answer: "88" },
      {
        text: "How many hearts does an octopus have?",
        answer: "3",
        bonus: { text: "What color is its blood?", answer: "Blue" }
      },
      {
        text: "What is the largest ocean in the world?",
        answer: "The Pacific Ocean",
        bonus: { text: "What is the smallest?", answer: "The Arctic Ocean" }
      },
      { text: "What is the most abundant element in the human body?", answer: "Oxygen" },
      { text: "What is the densest material in the world?", answer: "Osmium" }
    ]
  },

  // Politics is deliberately NOT on the wheel. It's held back for the
  // tie-breaker button on the host screen, in case one is needed at the end.
  politics: {
    label: "Politics",
    questions: [
      { text: "How many presidents has Egypt had?", answer: "6" },
      {
        text: "Who was the Chief of Staff during the October War, before \"the Gap\" (the Israeli crossing)?",
        answer: "Saad El Shazly",
        bonus: { text: "Why did Sadat remove him?", answer: "(host's call — no fixed answer recorded)" }
      },
      { text: "How many articles does the Egyptian constitution contain?", answer: "254" },
      {
        text: "One of the organizers of the January 25 Revolution ran a page named after a martyr, called \"We Are All ______\" — what was the martyr's name?",
        answer: "Khaled Said",
        bonus: { text: "Who were the other organizers?", answer: "The April 6 Youth Movement, We Are All Khaled Said, the National Association for Change, the Kefaya Movement, and the January 25 Movement" }
      },
      {
        text: "How many people died in the January 25 Revolution?",
        answer: "846",
        bonus: { text: "How many were injured?", answer: "Fewer than 6,000" }
      },
      { text: "In what year was Sadat assassinated?", answer: "1981" },
      { text: "In what year(s) was Sinai liberated?", answer: "1982-1989" },
      {
        text: "Egypt didn't appoint a president right after King Farouk — a king briefly held the position before being removed. What was his name?",
        answer: "King Fuad II",
        bonus: { text: "How old was he?", answer: "7 months old" }
      },
      { text: "One of the main causes of the 1952 Revolution was the taxes placed on agricultural land. What was the most important crop that was taxed more heavily at the time?", answer: "Cotton" },
      { text: "Who led the 1952 Revolution, and what was his rank?", answer: "Major General Muhammad Naguib" }
    ]
  }
};

// The wheel has 7 slots: the 6 regular categories, in this fixed order, plus
// a 7th "Joker" slot. Politics is excluded on purpose — see above.
const WHEEL_KEYS = ["geography", "history", "science", "sports", "math", "general", "joker"];
const WHEEL_LABELS = WHEEL_KEYS.map((k) => (k === "joker" ? "🃏 Joker" : CATEGORIES[k].label));
const JOKER_PICKABLE_KEYS = WHEEL_KEYS.filter((k) => k !== "joker");

// ---------------- display helpers ----------------
function hostText(q) { return q.franko || q.text || ""; }
function tvText(q) { return q.arabic || q.text || ""; }

// ---------------- shuffling ----------------
function shuffleArr(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Random draw order for one category's questions. 92% of the time this keeps
// reshuffling until no two bonus questions land back-to-back. The other ~8%
// of the time it just accepts whatever random order comes out (which may or
// may not have an adjacent pair) - so back-to-back bonuses can still happen,
// just rarely, instead of never.
function buildDrawOrder(questions) {
  const idxs = questions.map((_, i) => i);
  const hasAdjacentBonus = (order) =>
    order.some((qi, i) => i > 0 && questions[qi].bonus && questions[order[i - 1]].bonus);

  if (Math.random() < 0.08) return shuffleArr(idxs);

  let order = shuffleArr(idxs);
  let attempts = 0;
  while (hasAdjacentBonus(order) && attempts < 500) {
    order = shuffleArr(idxs);
    attempts++;
  }
  return order;
}

// Called once, when the host starts questions: builds a randomized draw
// order for every category (including politics, for the tie-breaker).
function buildAllDrawOrders() {
  const orders = {};
  Object.keys(CATEGORIES).forEach((key) => {
    orders[key] = buildDrawOrder(CATEGORIES[key].questions);
  });
  return orders;
}

// ---------------- category/wheel state helpers ----------------
function categoryHasQuestionsLeft(state, key) {
  const order = state.categoryOrders && state.categoryOrders[key];
  if (!order) return false;
  const ptr = (state.categoryPointers && state.categoryPointers[key]) || 0;
  return ptr < order.length;
}

// Which of the 7 wheel slots (by index into WHEEL_KEYS/WHEEL_LABELS) are
// still spinnable. The Joker slot stays available as long as ANY regular
// category still has questions left.
function availableWheelSlots(state) {
  return WHEEL_KEYS.reduce((acc, key, i) => {
    const ok = key === "joker"
      ? JOKER_PICKABLE_KEYS.some((k) => categoryHasQuestionsLeft(state, k))
      : categoryHasQuestionsLeft(state, key);
    if (ok) acc.push(i);
    return acc;
  }, []);
}

function pickWheelTarget(state) {
  const slots = availableWheelSlots(state);
  if (!slots.length) return null;
  return slots[Math.floor(Math.random() * slots.length)];
}

// Draws the next question index for a category, advancing its pointer.
function drawNextQuestionIndex(state, categoryKey) {
  const order = state.categoryOrders[categoryKey];
  const ptr = state.categoryPointers[categoryKey] || 0;
  return { questionIndex: order[ptr], nextPointer: ptr + 1 };
}

function currentQuestion(state) {
  if (!state.category || state.questionIndex == null || state.questionIndex < 0) return null;
  return CATEGORIES[state.category].questions[state.questionIndex];
}

// buzz key: unique per drawn question (category + index within category),
// with a "-bonus" suffix during the bonus round so buzz-ins reset cleanly.
function buzzKey(s) {
  const base = `${s.category}-${s.questionIndex}`;
  return (s.step === "bonus_question" || s.step === "bonus_answer") ? `${base}-bonus` : base;
}

// Pure function deciding what the host's single "Next" button does during
// the question/answer/bonus loop, given the current state. Used by both the
// LAN server and the Firebase client so they behave identically.
function computeNextStep(state) {
  if (state.step === "question") return { step: "answer", buzzesOpen: false };

  if (state.step === "answer") {
    const q = currentQuestion(state);
    if (q && q.bonus) return { step: "bonus_question", buzzesOpen: true, clearBuzz: true };
    return afterQuestion(state);
  }

  if (state.step === "bonus_question") return { step: "bonus_answer", buzzesOpen: false };

  if (state.step === "bonus_answer") return afterQuestion(state);

  return null;
}

// After a question (or its bonus) is fully resolved: normal rounds go back
// to the category wheel; a tie-breaker round goes to a small "another
// politics question, or finish?" prompt instead.
function afterQuestion(state) {
  if (state.tiebreaker) {
    return { step: "tiebreak_done", buzzesOpen: false, hasMorePolitics: categoryHasQuestionsLeft(state, "politics") };
  }
  return { step: "category", buzzesOpen: false, resetCategory: true };
}

// This file is loaded two ways: as a <script> tag in the browser (where it
// just needs to define the globals above) and via require() in server.js
// (where it needs to export them). This line makes both work.
if (typeof module !== "undefined") {
  module.exports = {
    TEAM_SIZE, DEFAULT_PLAYER_NAMES,
    CATEGORIES, WHEEL_KEYS, WHEEL_LABELS, JOKER_PICKABLE_KEYS,
    hostText, tvText,
    buildAllDrawOrders, categoryHasQuestionsLeft, availableWheelSlots,
    pickWheelTarget, drawNextQuestionIndex, currentQuestion,
    buzzKey, computeNextStep, afterQuestion
  };
}
