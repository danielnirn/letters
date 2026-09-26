/* ══════════════════════════════════════════════════
   TUNABLES
══════════════════════════════════════════════════ */
var CONFIG = {
  lives: 3,
  hintsPerWord: 3,
  wordsPerRun: 20,
  coinsCorrect: 10,
  coinsBonus: 20,
  streakEvery: 3,
  streakBonus: 15,
  bonusEveryN: 3,
  bonusSeconds: 20,
  lifeCost: 15,
};

var TILE_COLORS = [
  "#e84393","#FF6B6B","#FF9F43","#FFD93D",
  "#6BCB77","#4D96FF","#A29BFE","#00CEC9",
  "#fd7272","#badc58","#f9ca24","#6ab04c",
];

var WORDS = {
  easy: [
    {word:"כלב",  emoji:"🐶"}, {word:"שמש",  emoji:"☀️"},
    {word:"ירח",  emoji:"🌙"}, {word:"ספר",  emoji:"📚"},
    {word:"פרח",  emoji:"🌸"}, {word:"לחם",  emoji:"🍞"},
    {word:"בית",  emoji:"🏠"}, {word:"דוב",  emoji:"🐻"},
    {word:"קוף",  emoji:"🐒"}, {word:"נחש",  emoji:"🐍"},
    {word:"גשם",  emoji:"🌧️"}, {word:"גזר",  emoji:"🥕"},
    {word:"תות",  emoji:"🍓"}, {word:"חתול", emoji:"🐱"},
    {word:"אריה", emoji:"🦁"}, {word:"ארנב", emoji:"🐰"},
    {word:"כוכב", emoji:"⭐"}, {word:"כדור", emoji:"⚽"},
    {word:"ביצה", emoji:"🥚"}, {word:"מטוס", emoji:"✈️"},
    {word:"תפוח", emoji:"🍎"}, {word:"עוגה", emoji:"🎂"},
    {word:"כיסא", emoji:"🪑"}, {word:"שועל", emoji:"🦊"},
    {word:"פרפר", emoji:"🦋"}, {word:"כבשה", emoji:"🐑"},
    {word:"רכבת", emoji:"🚂"}, {word:"חלב",  emoji:"🥛"},
    {word:"פיל",  emoji:"🐘"}, {word:"סוס",  emoji:"🐴"},
    {word:"זאב",  emoji:"🐺"}, {word:"פרה",  emoji:"🐄"},
    {word:"גמל",  emoji:"🐪"}, {word:"שור",  emoji:"🐂"},
    {word:"ורד",  emoji:"🌹"}, {word:"שלג",  emoji:"❄️"},
    {word:"ענן",  emoji:"☁️"}, {word:"כוס",  emoji:"☕"},
    {word:"אגס",  emoji:"🍐"}, {word:"זית",  emoji:"🫒"},
    {word:"מים",  emoji:"💧"}, {word:"דבש",  emoji:"🍯"},
    {word:"ילד",  emoji:"👦"}, {word:"שיר",  emoji:"🎵"},
    {word:"חול",  emoji:"🏖️"}, {word:"זהב",  emoji:"🏅"},
    {word:"כרם",  emoji:"🍇"}, {word:"ספה",  emoji:"🛋️"},
    {word:"חזיר", emoji:"🐷"}, {word:"עכבר", emoji:"🐭"},
    {word:"חמור", emoji:"🫏"}, {word:"שעון", emoji:"⏰"},
    {word:"בלון", emoji:"🎈"}, {word:"פלפל", emoji:"🌶️"},
    {word:"אדום", emoji:"🔴"}, {word:"כחול", emoji:"🔵"},
    {word:"ירוק", emoji:"🟢"}, {word:"צהוב", emoji:"🟡"},
    {word:"צבע",  emoji:"🎨"}, {word:"צלחת", emoji:"🍽️"},
    {word:"אפון", emoji:"🫛"}, {word:"כנף",  emoji:"🪶"},
  ],
  mid: [
    {word:"ארנבת",  emoji:"🐰"}, {word:"ברווז",  emoji:"🦆"},
    {word:"צפרדע",  emoji:"🐸"}, {word:"קיפוד",  emoji:"🦔"},
    {word:"ינשוף",  emoji:"🦉"}, {word:"תמנון",  emoji:"🐙"},
    {word:"ברבור",  emoji:"🦢"}, {word:"ציפור",  emoji:"🐦"},
    {word:"כלבלב",  emoji:"🐶"}, {word:"גלידה",  emoji:"🍦"},
    {word:"לימון",  emoji:"🍋"}, {word:"אבטיח",  emoji:"🍉"},
    {word:"דולפין", emoji:"🐬"}, {word:"קנגורו", emoji:"🦘"},
    {word:"מכונית", emoji:"🚗"}, {word:"עוגייה", emoji:"🍪"},
    {word:"תרנגול", emoji:"🐓"}, {word:"כדורגל", emoji:"⚽"},
    {word:"שוקולד", emoji:"🍫"}, {word:"מלפפון", emoji:"🥒"},
    {word:"חמנייה", emoji:"🌻"}, {word:"טלפון",  emoji:"📱"},
    {word:"ספינה",  emoji:"🚢"}, {word:"מטריה",  emoji:"☂️"},
    {word:"ריקוד",  emoji:"💃"}, {word:"שולחן",  emoji:"🪑"},
    {word:"שמיים",  emoji:"🌤️"}, {word:"ירקות",  emoji:"🥗"},
    {word:"פירות",  emoji:"🍓"}, {word:"בגדים",  emoji:"👕"},
    {word:"ספרים",  emoji:"📖"}, {word:"ילדים",  emoji:"👧"},
    {word:"ביצים",  emoji:"🥚"}, {word:"נגינה",  emoji:"🎶"},
    {word:"ארמון",  emoji:"🏰"}, {word:"זיקית",  emoji:"🦎"},
    {word:"בקבוק",  emoji:"🍶"}, {word:"שחייה",  emoji:"🏊"},
    {word:"גשמים",  emoji:"🌧️"}, {word:"ורדים",  emoji:"🌹"},
    {word:"בננות",  emoji:"🍌"}, {word:"עכביש",  emoji:"🕷️"},
    {word:"נמרים",  emoji:"🐆"}, {word:"פילים",  emoji:"🐘"},
    {word:"כרובית", emoji:"🥦"}, {word:"חצילים", emoji:"🍆"},
    {word:"תפוזים", emoji:"🍊"}, {word:"כוכבים", emoji:"⭐"},
    {word:"מוסיקה", emoji:"🎵"}, {word:"ממתקים", emoji:"🍬"},
    {word:"בלונים", emoji:"🎈"}, {word:"גרביים", emoji:"🧦"},
    {word:"מסוקים", emoji:"🚁"}, {word:"כרישים", emoji:"🦈"},
  ],
  hard: [
    {word:"אוטובוס",  emoji:"🚌"}, {word:"פנגווין",  emoji:"🐧"},
    {word:"עגבנייה",  emoji:"🍅"}, {word:"אופניים",  emoji:"🚲"},
    {word:"אמבולנס",  emoji:"🚑"}, {word:"מכנסיים",  emoji:"👖"},
    {word:"משקפיים",  emoji:"👓"}, {word:"טלוויזיה",  emoji:"📺"},
    {word:"תמנונים",  emoji:"🐙"}, {word:"מיקרוגל",  emoji:"📡"},
    {word:"ציפורים",  emoji:"🐦"}, {word:"מכוניות",  emoji:"🚗"},
    {word:"תרנגולת",  emoji:"🐔"}, {word:"עכבישים",  emoji:"🕷️"},
    {word:"ינשופים",  emoji:"🦉"}, {word:"ברווזים",  emoji:"🦆"},
    {word:"כלבלבים",  emoji:"🐶"}, {word:"חנוכייה",  emoji:"🕎"},
    {word:"תמרורים",  emoji:"🚦"}, {word:"מיקרופון",  emoji:"🎤"},
    {word:"צבעונים",  emoji:"🖍️"}, {word:"לחמנייה",  emoji:"🥖"},
    {word:"שולחנות",  emoji:"🪑"}, {word:"חיפושית",  emoji:"🐞"},
    {word:"תמנונות",  emoji:"🐙"}, {word:"דינוזאור",  emoji:"🦕"},
    {word:"אוקיינוס", emoji:"🌊"}, {word:"מחשבונים", emoji:"🖩"},
    {word:"היפופוטם", emoji:"🦛"}, {word:"פסנתרים",  emoji:"🎹"},
    {word:"מנגינות",  emoji:"🎶"}, {word:"תלמידים",  emoji:"📖"},
  ],
};

/* ══════════════════════════════════════════════════
   SHOP CATALOGUE
   category: 'tools' | 'cosmetics' | 'coming'
   effect: handler key in ITEM_EFFECTS (game.js)
══════════════════════════════════════════════════ */
var SHOP_ITEMS = [
  {
    id: "extra_hints",
    emoji: "💡", name: "רמזים נוספים", category: "tools",
    cost: 30, desc: "+" + CONFIG.hintsPerWord + " רמזים למשחק הנוכחי",
    type: "powerup", effect: "extra_hints", consumable: true,
  },
  {
    id: "skip_word",
    emoji: "⏭️", name: "דלג מילה", category: "tools",
    cost: 20, desc: "דלג על מילה אחת ב-20 מטבעות",
    type: "powerup", effect: "skip_word", consumable: true,
  },
  {
    id: "double_coins",
    emoji: "💰", name: "מטבעות כפולים", category: "tools",
    cost: 50, desc: "X2 מטבעות עד סוף הסיבוב",
    type: "powerup", effect: "double_coins", consumable: true,
  },

  {
    id: "theme_space",
    emoji: "🚀", name: "ערכת חלל", category: "cosmetics",
    cost: 350, desc: "עיצוב חלל כהה עם כוכבים",
    type: "theme", effect: "theme",
  },
  {
    id: "theme_jungle",
    emoji: "🌴", name: "ערכת ג׳ונגל", category: "cosmetics",
    cost: 350, desc: "עיצוב ג׳ונגל ירוק",
    type: "theme", effect: "theme",
  },
  {
    id: "theme_unicorn",
    emoji: "🦄", name: "ערכת חד-קרן", category: "cosmetics",
    cost: 350, desc: "עיצוב קשת ורוד-סגול נוצץ",
    type: "theme", effect: "theme",
  },

  {id:"coming_1", emoji:"🎭", name:"???", category:"coming", cost:999, desc:"בקרוב...", type:"tbd", effect:"none"},
  {id:"coming_2", emoji:"🌈", name:"???", category:"coming", cost:999, desc:"בקרוב...", type:"tbd", effect:"none"},
];
