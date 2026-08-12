// Edit this file before game night.
// DEFAULT_NUM_TEAMS is just the number pre-filled on the setup screen -
// the host can change it to any number of teams before assigning players.
const DEFAULT_NUM_TEAMS = 2;

const DEFAULT_PLAYER_NAMES = [
  "Yehya", "Zahra", "Hayat", "Samia", "Mohammed",
  "Skeena", "Ramy", "Mayada", "Madeha", "Ahmed"
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
      { text: "What is the smallest country in the world?", franko: "As8ar dawla fel 3alam?", arabic: "أصغر دولة في العالم؟", answer: "Vatican City" },
      { text: "What is the capital of Morocco?", franko: "3asmet el maghrib?", arabic: "عاصمة المغرب؟", answer: "Rabat" },
      {
        text: "The Nile River begins from two countries — which two?",
        franko: "Nahr el nile beybda2 mn 2ny dwal?",
        arabic: "نهر النيل بيبدأ من دولتين، إيه هما؟",
        answer: "Ethiopia and Uganda",
        bonus: { text: "What are the two rivers called?", franko: "Asamy el anhar?", arabic: "إيه اسما النهرين؟", answer: "The White Nile (Uganda) and the Blue Nile (Ethiopia)" }
      },
      { text: "How many time zones does China have?", franko: "El Seen feha kam mate2a zamaneya?", arabic: "الصين فيها كام منطقة توقيت زمني؟", answer: "1" },
      {
        text: "Egypt ranks 13th in population — who ranks 14th?",
        franko: "Masr raqam 13 fel t3dad el sokany, meen raqam 14?",
        arabic: "مصر رقم 13 في التعداد السكاني، مين رقم 14؟",
        answer: "The Philippines",
        bonus: { text: "What is its capital?", franko: "Eh 3asemtha?", arabic: "إيه عاصمة الفلبين؟", answer: "Manila" }
      },
      { text: "Guess the country from its flag:", franko: "5amen esm el dawla mn 3elmha?", arabic: "خمّن اسم الدولة من علمها؟", answer: "Mozambique", image: "images/flags/flag-mozambique.jpg" },
      { text: "Guess the country from its flag:", franko: "5amen esm el dawla mn 3elmha?", arabic: "خمّن اسم الدولة من علمها؟", answer: "Nepal", image: "images/flags/flag-nepal.png" },
      { text: "Guess the country from its flag:", franko: "5amen esm el dawla mn 3elmha?", arabic: "خمّن اسم الدولة من علمها؟", answer: "Malta", image: "images/flags/flag-malta.png" },
      { text: "Guess the country from its flag:", franko: "5amen esm el dawla mn 3elmha?", arabic: "خمّن اسم الدولة من علمها؟", answer: "Rwanda", image: "images/flags/flag-rwanda.png" },
      { text: "Guess the country from its flag:", franko: "5amen esm el dawla mn 3elmha?", arabic: "خمّن اسم الدولة من علمها؟", answer: "Zambia", image: "images/flags/flag-zambia.png" }
    ]
  },

  history: {
    label: "History",
    questions: [
      { text: "In what year was Egypt conquered (opened to Islam)?", franko: "Masr eftote7at sanat kam?", arabic: "مصر اتفتحت سنة كام؟", answer: "20 AH, corresponding to 641 CE" },
      {
        text: "In what year did the Ottoman Empire begin?",
        franko: "El embratorya el 3othmaneya bada2t sanet kam?",
        arabic: "الإمبراطورية العثمانية بدأت سنة كام؟",
        answer: "1299",
        bonus: { text: "When did it occupy Egypt?", franko: "E7talo masr emta?", arabic: "احتلت مصر إمتى؟", answer: "1517" }
      },
      {
        text: "When did World War I begin?",
        franko: "WW1 bda2t emta?",
        arabic: "الحرب العالمية الأولى بدأت إمتى؟",
        answer: "1914",
        bonus: { text: "When did it end?", franko: "5lset emta?", arabic: "خلصت إمتى؟", answer: "1918" }
      },
      {
        text: "Who was the richest person in history?",
        franko: "Meen a8na wa7ed fel taree5?",
        arabic: "مين أغنى واحد في التاريخ؟",
        answer: "Mansa Musa",
        bonus: { text: "What empire did he rule?", franko: "Eh el embratorya el 7akmha?", arabic: "إيه الإمبراطورية اللي كان بيحكمها؟", answer: "Mali" }
      },
      { text: "Who invented the light bulb?", franko: "Meen e5tra3 el lamba?", arabic: "مين اخترع اللمبة؟", answer: "Ebenezer Kinnersley, James Lindsay, Alexander Just, and Franjo Hanaman" },
      { text: "Who was the first Arab to win a Nobel Prize, and in what year?", franko: "Meen awel 3araby ya5od gayzet nobel, w 5adha f sanat eh?", arabic: "مين أول عربي ياخد جايزة نوبل، وأخدها سنة كام؟", answer: "Ahmed Zewail, Chemistry, 1999" },
      { text: "What was the first pyramid built in Egypt?", franko: "Awel haram etbana f masr?", arabic: "أول هرم اتبنى في مصر؟", answer: "The Pyramid of Djoser / the Step Pyramid, at Saqqara" },
      {
        text: "In what year did the first computer appear?",
        franko: "Eh el sana el zahar feha awel computer?",
        arabic: "إيه السنة اللي ظهر فيها أول كمبيوتر؟",
        answer: "1946",
        bonus: { text: "Where?", franko: "Fen?", arabic: "فين؟", answer: "Philadelphia, USA" }
      },
      { text: "Who killed the most people?", franko: "Meen aktar wa7ed atal fel taree5?", arabic: "مين أكتر واحد قتل في التاريخ؟", answer: "Genghis Khan" },
      { text: "Which country had the highest number of deaths in World War II?", franko: "Eh el dawla el kan feha akbar 3adad amwat fe WW2?", arabic: "إيه الدولة اللي كان فيها أكبر عدد وفيات في الحرب العالمية الثانية؟", answer: "The Soviet Union, around 27 million, followed by China with 15-20 million" }
    ]
  },

  science: {
    label: "Science",
    questions: [
      {
        text: "What is the chemical symbol for Germanium?",
        franko: "Eh el chemical symbol le Germanium?",
        arabic: "إيه الرمز الكيميائي لعنصر الجرمانيوم؟",
        answer: "Ge",
        bonus: { text: "In which country was it discovered?", franko: "El ektshafo mn 2ny dawla?", arabic: "اتكتشف في أي دولة؟", answer: "Germany" }
      },
      { text: "What color is liquid oxygen?", franko: "Eh lon el oxygen el sa2el?", arabic: "إيه لون الأكسجين السائل؟", answer: "Blue" },
      { text: "Which element gives a flame a purple color when it burns?", franko: "Eh el element el beyde lon purple?", arabic: "إيه العنصر اللي بيدّي لون بنفسجي وهو بيحترق؟", answer: "Potassium" },
      { text: "What is the largest organ in the human body?", franko: "Eh akbar 3odw f gesm el ensan?", arabic: "إيه أكبر عضو في جسم الإنسان؟", answer: "The skin" },
      { text: "What is the only major organ in the human body that can regenerate itself?", franko: "Eh el 3odw el ra2sy el wa7eed fel ensan el beygaded nafso?", arabic: "إيه العضو الرئيسي الوحيد في جسم الإنسان اللي بيقدر يجدد نفسه؟", answer: "The liver" },
      {
        text: "By weight, what is the largest living organism on Earth?",
        franko: "Mn na7yet el wazn, eh akbar ka2en 3ayesh 3ala el ard?",
        arabic: "من ناحية الوزن، إيه أكبر كائن حي عايش على وجه الأرض؟",
        answer: "The quaking aspen (the \"Pando\" colony)",
        bonus: { text: "Where is it located?", franko: "Yaqa3 fen?", arabic: "بيقع فين؟", answer: "Utah, USA" }
      },
      { text: "What is the speed of light?", franko: "Eh sor3et el do2?", arabic: "إيه سرعة الضوء؟", answer: "299,705 km/s" },
      {
        text: "What is the diameter of the Earth?",
        franko: "Qotr el ard eh?",
        arabic: "قطر الأرض؟",
        answer: "12,756 km",
        bonus: { text: "What is the mass of the Earth?", franko: "Wazn el ard eh?", arabic: "وزن الأرض؟", answer: "5.97 × 10^24 kg" }
      },
      { text: "What is the Moon's gravity?", franko: "Gazbeyet el amar eh?", arabic: "جاذبية القمر؟", answer: "1.625 m/s²" },
      { text: "How old is the universe?", franko: "Eh 3omr el kon?", arabic: "عمر الكون؟", answer: "13.8 billion years" }
    ]
  },

  sports: {
    label: "Sports",
    questions: [
      { text: "What does NBA stand for?", franko: "NBA e5tsar eh?", arabic: "NBA اختصار لإيه؟", answer: "National Basketball Association" },
      { text: "Who won the Men's African Basketball Championship in 1962, 1964, 1970, 1975, and 1983?", franko: "Meen keseb el afrobasket lel regala fe 1962, 1964, 1970, 1975, 1983?", arabic: "مين كسب بطولة أفريقيا لكرة السلة للرجال سنة 1962 و1964 و1970 و1975 و1983؟", answer: "Egypt" },
      {
        text: "In which country was volleyball invented?",
        franko: "Volleyball e5tore3at f balad eh?",
        arabic: "الكرة الطائرة اتخترعت في أي بلد؟",
        answer: "The United States",
        bonus: { text: "In what year?", franko: "Sanat kam?", arabic: "سنة كام؟", answer: "1895" }
      },
      { text: "Which club holds 8 titles in the Arab Club Volleyball Championship?", franko: "Eh el fer2a el ta7mel 8 alqab fe el btoola el 3arabeya l ndeyet el volleyball?", arabic: "إيه الفريق اللي حامل 8 ألقاب في البطولة العربية للأندية للكرة الطائرة؟", answer: "Al Ahly" },
      {
        text: "How many gold medals did Michael Phelps win?",
        franko: "Michael Phelps 5ad kam madelya dahabeya?",
        arabic: "مايكل فيلبس خد كام ميدالية دهبية؟",
        answer: "23",
        bonus: { text: "How many medals in total?", franko: "Tb kam madelya 3amatan?", arabic: "طب كام ميدالية إجمالًا؟", answer: "28" }
      },
      { text: "Who won the gold medal in the 400m swim at Tokyo 2020?", franko: "Meen 5ad el madelya el dahabeya fel seba7a el 400m fe Tokyo 2020?", arabic: "مين خد الميدالية الدهبية في سباحة الـ400 متر في أولمبياد طوكيو 2020؟", answer: "Tunisia's Ahmed Hafnaoui, at age 18" },
      { text: "In handball, how many players are allowed on the court at the same time?", franko: "Fel handball, fe kam la3eb masmo7 yeb2a mawgood fel court f nafs el wa2t?", arabic: "في كرة اليد، كام لاعب مسموح يكونوا موجودين في الملعب في نفس الوقت؟", answer: "14" },
      {
        text: "In handball, Egypt made history at Tokyo 2020 by beating which team in the quarterfinals?",
        franko: "Fel handball, masr sana3at el taree5 lama kesbet 2ny faree2 f Tokyo 2020 fel rob3 el neha2y?",
        arabic: "في كرة اليد، مصر صنعت التاريخ لما هزمت أي فريق في طوكيو 2020 في ربع النهائي؟",
        answer: "Germany",
        bonus: { text: "Why did it make history?", franko: "Leh sana3et el taree5?", arabic: "ليه صنعت التاريخ؟", answer: "Egypt became the first African and non-European team to reach the semifinals" }
      },
      {
        text: "In which country was squash invented?",
        franko: "Squash o5tor3at f balad eh?",
        arabic: "الاسكواش اتخترعت في أي بلد؟",
        answer: "London, England",
        bonus: { text: "When?", franko: "Emta?", arabic: "إمتى؟", answer: "1830" }
      },
      { text: "Which player won the World Squash Championship for the eighth time in 2024?", franko: "Mn el la3ba el fazet blaqab btoolet el 3alam lel squash ll mara el tamna fe 2024?", arabic: "مين اللاعبة اللي فازت بلقب بطولة العالم للاسكواش للمرة الثامنة سنة 2024؟", answer: "Nour El Sherbini" }
    ]
  },

  // All 10 math problems now match the doc exactly (previously 5 were a
  // different problem set - Karem confirmed the doc's versions are the
  // intended ones, so they replace the old placeholders).
  math: {
    label: "Math",
    questions: [
      { text: "How many minutes are in a full week?", arabic: "كام دقيقة في الأسبوع الكامل؟", answer: "10,080" },
      { text: "What is 34% of 43?", arabic: "<span dir=\"ltr\">34%</span> من <span dir=\"ltr\">43</span>؟", answer: "14.62" },
      { text: "5 × 6 ÷ 3 + 45 ÷ 9 + 36 ÷ 2 = ?", arabic: "<span dir=\"ltr\">5 × 6 ÷ 3 + 45 ÷ 9 + 36 ÷ 2</span> =", answer: "33" },
      { text: "How old was I, in days, on this date: March 19, 2007?", franko: "Kan 3andy kam youm fel taree5 da 19/3/2007?", arabic: "كان عندي كام يوم في التاريخ ده: <span dir=\"ltr\">19/3/2007</span>؟", answer: "175" },
      { text: "(√121 × 3 + 72 ÷ 8 − 3 × 3 + 84 ÷ 42) ÷ 7 = ?", arabic: "<span dir=\"ltr\">(√121 × 3 + 72 ÷ 8 − 3 × 3 + 84 ÷ 42) ÷ 7</span> =", answer: "5" },
      { text: "1 + 2 + 3 + 4 + ... + 20 = ?", franko: "1+2+3+4......+20 b kam?", arabic: "<span dir=\"ltr\">1 + 2 + 3 + 4 + ... + 20</span> بكام؟", answer: "210" },
      {
        text: "A square plot of land has an area of 36 square meters. If you build a fence all the way around it, how long is the fence?",
        franko: "Ard moraba3a mesa7etha 36 meter moraba3 3aizen nebny 7awaleha soor, tool el soor kamel ad eh?",
        arabic: "أرض مربعة مساحتها <span dir=\"ltr\">36</span> متر مربع، عايزين نبني حواليها سور، طول السور كامل قد إيه؟",
        answer: "24 meters"
      },
      {
        text: "Five siblings want to split 1000 grams of meat among themselves, with each one getting 20 grams less than their older sibling. How much does the youngest get?",
        franko: "5 e5wat 3aizeen nwaza3 3alehom 1000 gram la7ma kol wa7ed haya5od 20g a2al mn a5oh el kbeer, fa el as8ar haya5od kam?",
        arabic: "5 إخوات عايزين نوزع عليهم 1000 جرام لحمة، كل واحد هياخد 20 جرام أقل من أخوه الأكبر، فالأصغر هياخد كام؟",
        answer: "160 grams"
      },
      { text: "What is 72% of 50?", arabic: "<span dir=\"ltr\">72%</span> من <span dir=\"ltr\">50</span>؟", answer: "36" },
      { text: "((5+3)/4 + 10)/12 + 54/6 − 10 = ?", arabic: "<span dir=\"ltr\">((5+3)/4 + 10)/12 + 54/6 − 10</span> =", answer: "0" }
    ]
  },

  general: {
    label: "General Knowledge",
    questions: [
      { text: "How do dogs perceive the color red?", franko: "El kelab beyshofo el lon el a7mar eh?", arabic: "الكلاب بتشوف اللون الأحمر إزاي؟", answer: "As dark brown / gray / black" },
      { text: "What is the rarest and most expensive spice in the world by weight?", franko: "Eh andar w a8la bohar fel 3alam bel wazn?", arabic: "إيه أندر وأغلى بهار في العالم بالوزن؟", answer: "Saffron" },
      {
        text: "Which fruit was once believed to be poisonous in Europe?",
        franko: "Eh el thamara el kano fakrenha qatela f oroba?",
        arabic: "إيه الثمرة اللي كانوا فاكرينها قاتلة في أوروبا؟",
        answer: "The tomato",
        bonus: { text: "Why?", franko: "Leh?", arabic: "ليه؟", answer: "It used to be served on pewter plates, and it reacted with the tomato's acid to form a toxic compound" }
      },
      { text: "Which planet has the most moons?", franko: "Eh el kawkab el 3ando akbar 3adad aqmar?", arabic: "إيه الكوكب اللي عنده أكبر عدد أقمار؟", answer: "Saturn" },
      // Doc's item in this slot was a Quran-language question, not "pool smell" - using the real doc content now.
      { text: "What does the word \"'as'as\" mean?", franko: "Ma3na kelmet \"3as3as\" eh?", arabic: "إيه معنى كلمة \"عسعس\"؟", answer: "It's an Arabic word with two opposite meanings: 'to approach' (come), or — as meant in this verse — 'to depart' (go away)", note: "Qur'an 81:17, Surah At-Takwir: \"By the night as it departs\"" },
      { text: "How many keys does a piano have?", franko: "El piano fe kam mofta7?", arabic: "البيانو فيه كام مفتاح؟", answer: "88" },
      {
        text: "How many hearts does an octopus have?",
        franko: "El o5tboot 3ando kam alb?",
        arabic: "الأخطبوط عنده كام قلب؟",
        answer: "3",
        bonus: { text: "What color is its blood?", franko: "Eh lon damo?", arabic: "إيه لون دمه؟", answer: "Blue" }
      },
      {
        text: "What is the largest ocean in the world?",
        franko: "Eh akbar mo7eet fel 3alam?",
        arabic: "إيه أكبر محيط في العالم؟",
        answer: "The Pacific Ocean",
        bonus: { text: "What is the smallest?", franko: "Eh as8ar wa7ed?", arabic: "إيه أصغر واحد؟", answer: "The Arctic Ocean" }
      },
      { text: "What is the most abundant element in the human body?", franko: "Eh aktar 3onsor motwage f gesm el ensan?", arabic: "إيه أكتر عنصر متواجد في جسم الإنسان؟", answer: "Oxygen" },
      // Doc's item in this slot was a Quran-language question, not "densest material" - using the real doc content now.
      { text: "What does the word \"ujaaj\" mean?", franko: "Ma3na kelmet \"ojaj\" eh?", arabic: "إيه معنى كلمة \"أُجاج\"؟", answer: "Extremely salty, bitter water", note: "Qur'an 25:53, Surah Al-Furqan, describing the two seas: one fresh and sweet, the other salty and bitter" }
    ]
  },

  // Politics used to be held back exclusively for the tie-breaker button.
  // Karem asked for it on the regular wheel too now - the tie-breaker button
  // still works (it draws from this same pool via the shared pointer), it
  // just means fewer Politics questions may be left over by the time a
  // tie-breaker is actually needed, since regular play can use them first.
  politics: {
    label: "Politics",
    questions: [
      { text: "How many presidents has Egypt had?", franko: "Masr leha kam ra2ees?", arabic: "مصر ليها كام رئيس؟", answer: "6" },
      {
        text: "Who was the Chief of Staff during the October War, before \"the Gap\" (the Israeli crossing)?",
        franko: "Meen kan ra2ees el arkan f 7arb october abl el sa8ra?",
        arabic: "مين كان رئيس الأركان في حرب أكتوبر قبل الثغرة؟",
        answer: "Saad El Shazly",
        bonus: { text: "Why did Sadat remove him?", franko: "El sadat masha leh?", arabic: "السادات مشّاه ليه؟", answer: "(host's call — no fixed answer recorded)" }
      },
      { text: "How many articles does the Egyptian constitution contain?", franko: "El dostoor el masry fe kam mada?", arabic: "الدستور المصري فيه كام مادة؟", answer: "254" },
      {
        text: "One of the organizers of the January 25 Revolution ran a page named after a martyr, called \"We Are All ______\" — what was the martyr's name?",
        franko: "A7ad monazmeen sawret 25 yanaya kan 3ala esm shaheed \"Kolena ____\" — eh esmo?",
        arabic: "أحد منظمي ثورة 25 يناير كان على اسم شهيد بعنوان \"كلنا ____\"، إيه اسمه؟",
        answer: "Khaled Said",
        bonus: { text: "Who were the other organizers?", franko: "Meen ba2y el monazmeen?", arabic: "مين باقي المنظمين؟", answer: "The April 6 Youth Movement, We Are All Khaled Said, the National Association for Change, the Kefaya Movement, and the January 25 Movement" }
      },
      {
        text: "How many people died in the January 25 Revolution?",
        franko: "Fe kam wa7ed mat f sawret 25 yanaya?",
        arabic: "كام واحد مات في ثورة 25 يناير؟",
        answer: "846",
        bonus: { text: "How many were injured?", franko: "Fe kam wa7ed etsab?", arabic: "كام واحد اتصاب؟", answer: "Fewer than 6,000" }
      },
      { text: "In what year was Sadat assassinated?", franko: "El sadat et2atal sanat kam?", arabic: "السادات اتقتل سنة كام؟", answer: "1981" },
      { text: "In what year(s) was Sinai liberated?", franko: "Sina et7araret sanat kam?", arabic: "سيناء اتحررت سنة كام؟", answer: "1982-1989" },
      {
        text: "Egypt didn't appoint a president right after King Farouk — a king briefly held the position before being removed. What was his name?",
        franko: "Masr ma3yantsh ra2ees ba3d el malek Farouk 3alatool — fe malek 5ad el manseb ba3deh w etshal ba3deha 3alatool, esmo eh?",
        arabic: "مصر لم تُعيّن رئيسًا بعد الملك فاروق مباشرة، وكان فيه ملك خد المنصب وتم تغييره على طول، إيه اسمه؟",
        answer: "King Fuad II",
        bonus: { text: "How old was he?", franko: "Kan 3omro kam?", arabic: "كان عمره كام؟", answer: "7 months old" }
      },
      { text: "One of the main causes of the 1952 Revolution was the taxes placed on agricultural land. What was the most important crop that was taxed more heavily at the time?", franko: "Mn aham azbab thawret 1952 el darayeb el kanet btet7at 3ala el arady el zera3eya. Eh aham ma7sool zadet 3aleh el darayeb sa3etha?", arabic: "من أهم أسباب ثورة 1952 الضرائب اللي كانت بتتحط على الأراضي الزراعية. إيه كان أهم محصول زادت عليه الضرائب وقتها؟", answer: "Cotton" },
      { text: "Who led the 1952 Revolution, and what was his rank?", franko: "Meen kan qa2ed thawret 1952, w eh kan mansebo?", arabic: "مين كان قائد ثورة 1952، وإيه كان منصبه؟", answer: "Major General Muhammad Naguib" }
    ]
  },

  // The doc's Adab section only had Arabic script, no franko romanization -
  // I transliterated these myself (mechanical phonetic transliteration of
  // your own text, not new content). Flag if any of these read oddly.
  adab: {
    label: "Adab (Literature)",
    questions: [
      { text: "Who is the only Egyptian and Arab novelist to win the Nobel Prize in Literature, in 1988?", franko: "Meen howa el rewa2y el masry wel 3araby el wa7eed elly naga7 yeksab gayzet nobel fel adab sanet 1988?", arabic: "من هو الروائي المصري والعربي الوحيد الذي نجح في الفوز بجائزة نوبل في الآداب عام 1988؟", answer: "Naguib Mahfouz" },
      {
        text: "Name two of the most prominent satirical writers in Egypt in recent decades.",
        franko: "Ozkor esm katbeen mn abraz a3lam el adab el sa5er f masr 5elal el 3o2ood el a5eera?",
        arabic: "اذكر اسم كاتبين من أبرز أعلام الأدب الساخر في مصر خلال العقود الأخيرة.",
        answer: "Mahmoud El-Saadany and Bilal Fadl",
        bonus: { text: "Two more?", franko: "Etneen kaman?", arabic: "اثنين كمان؟", answer: "Youssef Ouf / Ahmed Ragab" }
      },
      {
        text: "Which literary era does Egyptian poet Ahmed Shawqi, known as \"the Prince of Poets,\" belong to?",
        franko: "Eh el 3asr el adaby elly beyntamy leh el sha3er el masry Ahmed Shawqy, el mula2ab b \"Ameer el Shoara\"?",
        arabic: "ما هو العصر الأدبي الذي ينتمي إليه الشاعر المصري أحمد شوقي الملقب بـ \"أمير الشعراء\"؟",
        answer: "The modern era",
        bonus: { text: "Which poetic school?", franko: "W eh el madrasa el she3reya?", arabic: "وإيه المدرسة الشعرية؟", answer: "The Revival and Neo-Classical school" }
      },
      { text: "Who are the two brother writers famous for blending journalism with literature, who founded \"Akhbar El Yom\"?", franko: "Meen homa el katbeen el sha2ee2een elly eshtahro b damg el 3amal el sa7afy bel adab, w asaso mo2asset \"Akhbar El Yom\"?", arabic: "من هما الكاتبان الشقيقان اللذان اشتهرا بدمج العمل الصحفي بالأدب، وأسسا مؤسسة \"أخبار اليوم\"؟", answer: "Mostafa Amin and Ali Amin" },
      { text: "What prose genre does Taha Hussein's book \"Al-Ayyam\" (The Days) belong to?", franko: "Eh el fan el nas5ry elly beyendarej ta7to ketab \"El Ayyam\" le 3amid el adab el 3araby Taha Hussein?", arabic: "ما هو الفن النثري الذي يندرج تحته كتاب \"الأيام\" لعميد الأدب العربي طه حسين؟", answer: "Autobiography (memoir)" },
      { text: "Who is the Egyptian poet known as \"the Poet of the Nile,\" a contemporary of Ahmed Shawqi known for nationalist poems?", franko: "Meen howa el sha3er el masry el ma3roof b \"Sha3er El Nile\", elly 3aser Ahmed Shawqy w erteba2 esmo bel qasa2ed el wataneya?", arabic: "من هو الشاعر المصري المعروف بـ \"شاعر النيل\" والذي عاصر أحمد شوقي وارتبط اسمه بالقصائد الوطنية؟", answer: "Hafez Ibrahim" },
      { text: "What is the famous novel by Bahaa Taher that won the first International Prize for Arabic Fiction (the Booker) in 2008?", franko: "Eh esm el rewaya el shaheera lel katb Bahaa Taher elly fazet bel gayza el 3alameya lel rewaya el 3arabeya (el Booker) f dawretha el oula sanet 2008?", arabic: "ما اسم الرواية الشهيرة للكاتب بهاء طاهر والتي فازت بالجائزة العالمية للرواية العربية (البوكر) في دورتها الأولى عام 2008؟", answer: "Sunset Oasis (Wahat Al-Ghuroub)" },
      { text: "What is the most famous book by Anis Mansour, chronicling his long journeys around the world?", franko: "Eh esm el ketab el ashhar lel katb Anis Mansour, elly arra5 feeh l re7latoh el taweela 7awl belad el 3alam?", arabic: "ما اسم الكتاب الأشهر للكاتب أنيس منصور والذي أرّخ فيه لرحلاته الطويلة حول بلدان العالم؟", answer: "Around the World in 200 Days" },
      { text: "Who pioneered \"theater of the mind\" in Egyptian and Arab literature, and wrote the plays \"Ahl Al-Kahf\" and \"Shahrazad\"?", franko: "Meen howa ra2ed \"el masra7 el zehny\" fel adab el masry wel 3araby, w sa7eb masra7yeet \"Ahl El Kahf\" w \"Shahrazad\"?", arabic: "من هو رائد \"المسرح الذهني\" في الأدب المصري والعربي، وصاحب مسرحيتي \"أهل الكهف\" و\"شهرزاد\"؟", answer: "Tawfiq Al-Hakim" },
      {
        text: "Name a prominent Egyptian historian from the Mamluk era, known for writing about Egypt's plans, monuments, and geographic history.",
        franko: "Ozkor esm mo2arre5 masry barez mn el 3asr el mamlouky, eshtahar b ketabet el kho4a2 wel athar wel taree5 el gography le masr?",
        arabic: "اذكر اسم مؤرخ مصري بارز من العصر المملوكي، اشتهر بكتابة الخطط والآثار والتاريخ الجغرافي لمصر.",
        answer: "Taqi Al-Din Al-Maqrizi",
        bonus: { text: "What was his real name?", franko: "Esmo el 7a2ee2y eh?", arabic: "اسمه الحقيقي إيه؟", answer: "Ahmed ibn Ali" }
      }
    ]
  },

  // Same note as Adab - the doc's Quran section mixed plain Arabic with a
  // few franko phrases, so I transliterated the rest myself.
  quran: {
    label: "Quran",
    questions: [
      {
        text: "How many times is the verse \"Fa-bi-ayyi aalaa'i Rabbikumaa tukadhdhibaan\" repeated in Surah Ar-Rahman?",
        franko: "\"فبأي آلاء ربكما تكذبان\" etkrart kam mara f sooret الرحمان؟",
        arabic: "\"فبأي آلاء ربكما تكذبان\" اتكررت كام مرة في سورة الرحمن؟",
        answer: "31 times",
        bonus: { text: "What's the next most-repeated verse?", franko: "eh el aktar aya etkarart ba3dha?", arabic: "إيه أكتر آية اتكررت بعدها؟", answer: "\"Woe that Day to the deniers\" — repeated 11 times, in Surah Al-Mursalat" }
      },
      { text: "Which two surahs will shade the believer on the Day of Judgment?", franko: "Eh el soorten el beydalelo 3ala el mo2men youm el qeyama?", arabic: "إيه السورتان اللي بيظلله على المؤمن يوم القيامة؟", answer: "Al-Baqarah and Aal-Imran" },
      { text: "What is the one thing other than the soul described as \"breathing\" in the Quran?", franko: "Eh el she2 el bytnafs 8er el ro7 fel quran?", arabic: "إيه الشيء اللي بيتنفس غير الروح في القرآن؟", answer: "The dawn (Al-Subh)", note: "Qur'an 81:18, Surah At-Takwir" },
      { text: "In Surah 'Abasa, who was the blind man?", franko: "Fe sooret عبس meen kan el a3ma?", arabic: "في سورة عبس، مين كان الأعمى؟", answer: "Abdullah ibn Umm Maktum" },
      {
        text: "How many times, and in which surah, does the address \"O you who disbelieve\" appear?",
        franko: "El nda2 \"يَا أَيُّهَا الَّذِينَ كَفَرُوا\" zoker kam marra w f sooret eh?",
        arabic: "النداء \"يَا أَيُّهَا الَّذِينَ كَفَرُوا\" اتذكر كام مرة، وفي إيه سورة؟",
        answer: "Once, in Surah At-Tahrim (verse 7)",
        bonus: { text: "How many times does \"O you who believe\" appear?", franko: "يَا أَيُّهَا الَّذِينَ آمَنُوا kam mara?", arabic: "\"يَا أَيُّهَا الَّذِينَ آمَنُوا\" اتذكرت كام مرة؟", answer: "89 times" }
      },
      { text: "On what occasion was the verse about the setback after a previous double victory revealed (Aal-Imran 165)?", franko: "El aya de nzlet f 2ny monasba?", arabic: "متى نزلت آية \"أَوَلَمَّا أَصَابَتْكُم مُّصِيبَةٌ...\"؟", answer: "The Battle of Uhud (Aal-Imran 165)" },
      { text: "What are people called whose good and bad deeds are equal on Judgment Day?", franko: "El nas el 7asanatthom w say2athom beytsawo youm el qeyama beytsamo eh?", arabic: "الناس اللي حسناتهم وسيئاتهم بتتساوى يوم القيامة بيتسموا إيه؟", answer: "Ahl Al-A'raf (People of the Heights)" },
      {
        text: "Which are more numerous: Meccan or Medinan surahs?",
        franko: "2ny aktar el sowar el makeya wala el madeney?",
        arabic: "أيهما أكتر: السور المكية ولا المدنية؟",
        answer: "Meccan",
        bonus: { text: "How many of each?", franko: "De kam w de kam?", arabic: "دي كام ودي كام؟", answer: "86 Meccan, 28 Medinan" }
      },
      { text: "Which surah is referred to as \"the Surah of Dawud (David)\"?", franko: "Eh el soora el beyotlaq 3aleha sooret Dawood?", arabic: "إيه السورة اللي بيُطلق عليها سورة داوود؟", answer: "Surah Sad" },
      { text: "Which prophets are mentioned in Surah Al-Baqarah?", franko: "Meen el anbeya el etzakaro fe sooret el baqara?", arabic: "مين الأنبياء اللي اتذكروا في سورة البقرة؟", answer: "Adam, Sulaiman (Solomon), Ibrahim (Abraham), Ismail (Ishmael), Ya'qub (Jacob), Musa (Moses), Isa (Jesus), Harun (Aaron), and Dawud (David)" }
    ]
  },

  // Full franko for this whole category was in the doc, so this one's
  // straight from your source, no transliteration guesswork needed.
  seerah: {
    label: "Seerah Nabaweya",
    questions: [
      { text: "How old was the Prophet ﷺ at the time of the War of Fijar?", franko: "El rasool kan 3ando kam sana fe 7arb el fejar?", arabic: "الرسول ﷺ كان عنده كام سنة وقت حرب الفجار؟", answer: "14-15 years old" },
      {
        text: "Abu Jahl once swore that if he saw the Prophet ﷺ prostrating, he'd bring a large rock and smash his head with it. The next day, as the Prophet ﷺ prostrated, Abu Jahl went to throw the rock — but something stopped him. What was it?",
        franko: "Abo gahl wa3d qoriash f mara eno haystana el rasool yosgod w haygeeb 7agr kbeer w yf3as beh raso, tany youm lama el rasool sagad abo gahl ra7 34an yrmy 3ala raso el 7agar bs fe 7aga mana3eto, eh heya?",
        arabic: "أبو جهل وعد قريش مرة إنه هيستنى الرسول ﷺ يسجد وهيجيب حجر كبير يفضخ بيه راسه، وفي اليوم التالي لما الرسول ﷺ سجد راح أبو جهل عشان يرمي الحجر على راسه، لكن فيه حاجة منعته، إيه هي؟",
        answer: "He saw a huge camel and was afraid it would eat him",
        bonus: { text: "Who was taking the form of that camel?", franko: "Meen kan wa5ed hay2et el gamal da?", arabic: "مين كان واخد هيئة الجمل ده؟", answer: "The angel Jibril (Gabriel)" }
      },
      {
        text: "When Al-Tufayl ibn Amr Al-Dawsi came to Mecca with his people, Quraysh warned him against Muhammad ﷺ. He swore not to speak to or listen to him, and to make sure of it while walking near the mosque, he did something specific. What was it?",
        franko: "Tofayl bn 3amero el dawosy lama ga maka howa w qawmo qoraish a3do y7azaro mn Mohammad fa 7elf eno la haytkalem m3a wala haysma3o w 2al kaman eno 34an yt2aked eno w howa mashy gamb el masged hay3mel 7aga 34an yt2aked eno msh haysma3o. eh el 7aga de?",
        arabic: "الطفيل بن عمرو الدوسي لما جه مكة هو وقومه، قعدت قريش تحذّره من محمد ﷺ، فحلف إنه لن يتكلم معاه ولا يسمعه، وقال كمان إنه عشان يتأكد من كده وهو ماشي جنب المسجد هيعمل حاجة معينة. إيه هي؟",
        answer: "He stuffed cotton in his ears"
      },
      { text: "When Quraysh complained to Abu Talib to make the Prophet ﷺ stop preaching Islam, the Prophet ﷺ asked them to say and acknowledge just one phrase. What was it?", franko: "Lama qoraish ra7o yshteko 3ala el rasool l abe taleb 34an ywa2af do3a el nas lel islam, el rasool talab mnehom y2olo w ye3terfo b kelma wa7da, eh heya?", arabic: "لما قريش راحت تشتكي الرسول ﷺ لأبي طالب عشان يوقف دعوة الناس للإسلام، الرسول ﷺ طلب منهم يقولوا ويعترفوا بكلمة واحدة، إيه هي؟", answer: "\"La ilaha illallah\" (There is no god but Allah)" },
      { text: "What did people use to call for prayer before the adhan (call to prayer) was established?", franko: "Kano abyd3o lel salah b eh abl el adan?", arabic: "كانوا بيؤذّنوا للصلاة بإيه قبل الأذان؟", answer: "A bell / gong (an-naqus)" },
      {
        text: "How many Muslims were martyred at the Battle of Badr?",
        franko: "Kam wa7ed estoshhed mn el muslimeen yum badr?",
        arabic: "كام واحد استُشهد من المسلمين يوم بدر؟",
        answer: "14",
        bonus: { text: "And how many from Quraysh?", franko: "W mn qoraish?", arabic: "وكام واحد من قريش؟", answer: "70" }
      },
      { text: "After the killing of the Muslims at Bi'r Ma'una, what prayer did the Prophet ﷺ recite for 30 mornings?", franko: "Ba3d maqtal el muslimeen fe be2r ma3oona eh el do3a2 el rasool 2alo l modet 30 sob7?", arabic: "بعد مقتل المسلمين في بئر معونة، إيه الدعاء اللي كان الرسول ﷺ بيقوله لمدة 30 صباحًا؟", answer: "Qunut prayer (Dua Al-Qunut)" },
      { text: "Who suggested the idea of digging the trench (Al-Khandaq)?", franko: "Meen eqtra7 fekret 7afr el 5andaq?", arabic: "مين اقترح فكرة حفر الخندق؟", answer: "Salman Al-Farisi" },
      {
        text: "The 'Umrah performed after the Treaty of Hudaybiyyah had a few names — what were they?",
        franko: "3omret el qada2 el kanet ba3d sol7 el 7odaybeya kan leha kaza esm eh homa?",
        arabic: "عمرة القضاء اللي كانت بعد صلح الحديبية كان ليها كذا اسم، إيه هما؟",
        answer: "Umrat Al-Qada / Umrat Al-Sulh / Umrat Al-Qadiyyah",
        bonus: { text: "Why was it called \"Umrat Al-Qasas\" (retribution)?", franko: "Leh someyat 3omret el qesas?", arabic: "ليه سُمّيت عمرة القصاص؟", answer: "Because the Prophet ﷺ waited until the following year and performed the 'Umrah in the same month (Dhu Al-Qi'dah) he had been turned away in" }
      },
      { text: "Who took part in washing the Prophet's ﷺ body?", franko: "Meen sharek fe 8osl el rasool?", arabic: "مين شارك في غسل الرسول ﷺ؟", answer: "Ali ibn Abi Talib, Al-Abbas ibn Abd Al-Muttalib, Al-Fadl ibn Al-Abbas, Usama ibn Zayd, Qutham ibn Al-Abbas, and Shuqran" }
    ]
  }
};

// The wheel now spins for all 10 categories (Politics included, per your
// call), plus an 11th "Joker" slot.
const WHEEL_KEYS = ["geography", "history", "science", "sports", "math", "general", "politics", "adab", "quran", "seerah", "joker"];
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

// Which of the WHEEL_KEYS.length wheel slots (by index into WHEEL_KEYS/WHEEL_LABELS) are
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

// Picking uniformly at random from ALL available slots every single time is
// "correctly" random, but true independent randomness produces visible
// streaks fairly often (e.g. the same category 2-3 spins in a row), which
// reads as broken/rigged to players even though it isn't. To make spins
// *feel* fair while staying random, we bias 85% of spins away from
// whichever slot was landed on last time (tracked in state.lastWheelTarget)
// - the other 15% of the time a true repeat is still allowed through, so
// repeats can still happen, just less often than pure chance would give.
function pickWheelTarget(state) {
  const slots = availableWheelSlots(state);
  if (!slots.length) return null;

  const last = state.lastWheelTarget;
  const nonRepeats = slots.filter((i) => i !== last);
  if (last != null && nonRepeats.length && Math.random() < 0.85) {
    return nonRepeats[Math.floor(Math.random() * nonRepeats.length)];
  }
  return slots[Math.floor(Math.random() * slots.length)];
}

// Draws the next question index for a category, advancing its pointer.
function drawNextQuestionIndex(state, categoryKey) {
  const order = state.categoryOrders[categoryKey];
  const ptr = (state.categoryPointers && state.categoryPointers[categoryKey]) || 0;
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
    if (q && q.bonus) return { step: "bonus_question", buzzesOpen: false, clearBuzz: true };
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

// ============================================================================
// TEAM ASSIGNMENT HELPERS
// ----------------------------------------------------------------------------
// Shared by both the random ("wheel") and manual assignment modes, and by
// both transports (Firebase writes teams directly; the LAN server calls
// these too), so team-building logic only lives in one place.

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Splits `names` into `numTeams` groups as evenly as possible (round-robin),
// with no fixed team size - any leftover players just land on different
// teams one at a time instead of piling onto a single last team.
function distributeEvenly(names, numTeams) {
  const n = Math.max(1, Math.min(numTeams, names.length));
  const groups = Array.from({ length: n }, () => []);
  names.forEach((name, i) => groups[i % n].push(name));
  return groups;
}

// Turns an array of member-name arrays (already decided, whether by random
// shuffle or by the host manually assigning each player) into the
// teams/players/scores shape the rest of the app expects. Empty groups are
// dropped so a team nobody was assigned to doesn't show up on the TV.
function buildTeamsFromGroups(groups) {
  const teams = {};
  const players = {};
  groups.filter((g) => g && g.length).forEach((members, idx) => {
    teams[idx] = { name: `Team ${idx + 1}`, members: [...members], nameSet: false };
    members.forEach((n) => (players[n] = { team: idx, joined: false, pid: null }));
  });
  const scores = {};
  Object.keys(teams).forEach((idx) => (scores[idx] = 0));
  return { teams, players, scores };
}

// This file is loaded two ways: as a <script> tag in the browser (where it
// just needs to define the globals above) and via require() in server.js
// (where it needs to export them). This line makes both work.
if (typeof module !== "undefined") {
  module.exports = {
    DEFAULT_NUM_TEAMS, DEFAULT_PLAYER_NAMES,
    CATEGORIES, WHEEL_KEYS, WHEEL_LABELS, JOKER_PICKABLE_KEYS,
    hostText, tvText,
    buildAllDrawOrders, categoryHasQuestionsLeft, availableWheelSlots,
    pickWheelTarget, drawNextQuestionIndex, currentQuestion,
    buzzKey, computeNextStep, afterQuestion,
    shuffle, distributeEvenly, buildTeamsFromGroups
  };
}
