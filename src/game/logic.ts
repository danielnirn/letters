import { CONFIG, type Difficulty } from "./config";
import { shuffle } from "./shuffle";
import type { Word } from "./words";

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function seq(start: number, step: number, op: "+" | "×" = "+"): Word {
  const n1 = start;
  const n2 = op === "×" ? start * step : start + step;
  const n3 = op === "×" ? n2 * step : n2 + step;
  const n4 = op === "×" ? n3 * step : n3 + step;
  return {
    word: String(n4),
    emoji: `${n1}   ${n2}   ${n3}   ❓`,
    hint: "מה המספר הבא בסדרה?",
  };
}

function sequenceProblem(level: Difficulty): Word {
  if (level === "easy") return seq(rand(1, 6), 1);
  if (level === "mid") {
    if (Math.random() < 0.5) return seq(rand(1, 8), 2);
    return seq(rand(2, 10), 1);
  }
  if (Math.random() < 0.45) return seq(rand(2, 4), 2, "×");
  return seq(rand(1, 12), 3);
}

/** Static riddles, patterns, mazes, mini-sudoku — answers are short Hebrew or a digit. */
export const LOGIC_WORDS: Record<Difficulty, Word[]> = {
  easy: [
    { word: "אדום", emoji: "🔴🟢🔴🟢❓", hint: "מה הצבע הבא?", choices: ["ירוק", "כחול", "צהוב"] },
    { word: "ירח", emoji: "⭐⭐🌙⭐⭐🌙⭐⭐❓", hint: "מה בא אחרי?", choices: ["כוכב", "שמש", "ענן"] },
    { word: "כלב", emoji: "🐱🐶🐱🐶❓", hint: "מי בא אחרי?", choices: ["חתול", "דג", "ציפור"] },
    { word: "עיגול", emoji: "▲ ● ▲ ● ❓", hint: "איזו צורה באה אחרי?", choices: ["משולש", "ריבוע", "לב"] },
    { word: "גדול", emoji: "🔹🔸🔶❓", hint: "מה קורה לצורה?", choices: ["קטן", "נעלם", "נסתר"] },
    { word: "ימין", emoji: "🐭⬜⬜🧀", hint: "באיזה כיוון הגבינה?", choices: ["שמאל", "למעלה", "למטה"] },
    { word: "למעלה", emoji: "🧀\n⬜\n🐭", hint: "באיזה כיוון הגבינה?", choices: ["למטה", "ימין", "שמאל"] },
    { word: "שמאל", emoji: "🧀⬜⬜🐭", hint: "באיזה כיוון הגבינה?", choices: ["ימין", "למעלה", "למטה"] },
    { word: "3", emoji: "🍎🍎🍎  +  🍎🍎  =  ❓", hint: "כמה תפוחים ביחד?" },
    { word: "2", emoji: "1  2  3\n2  3  1\n3  1  ❓", hint: "איזה מספר חסר בריבוע?" },
    { word: "שמש", emoji: "🤔", hint: "צהובה, חמה, בשמיים ביום. מה זה?", choices: ["ירח", "כוכב", "ענן"] },
    { word: "גשם", emoji: "🤔", hint: "נופל מהשמיים ומרטיב. מה זה?", choices: ["שלג", "רוח", "ברד"] },
    { word: "יד", emoji: "🤔", hint: "יש לי חמש אצבעות. מה אני?", choices: ["רגל", "אוזן", "עין"] },
    { word: "כדור", emoji: "🤔", hint: "עגול, מגלגלים אותי במשחק. מה אני?", choices: ["קוביה", "ספר", "עפרון"] },
    { word: "לילה", emoji: "☀️➡️🌙", hint: "אחרי היום מגיע…", choices: ["בוקר", "צהריים", "חורף"] },
    { word: "4", emoji: "⬜⬜\n⬜⬜", hint: "כמה ריבועים יש?" },
  ],
  mid: [
    { word: "כחול", emoji: "🔴🔴🔵🔴🔴🔵🔴🔴❓", hint: "מה הצבע הבא?", choices: ["אדום", "ירוק", "צהוב"] },
    { word: "פרח", emoji: "🌱🌿🌸🌱🌿🌸🌱🌿❓", hint: "מה בא אחרי?", choices: ["עץ", "עלה", "פרי"] },
    { word: "למטה", emoji: "🐭\n⬜\n⬜\n🧀", hint: "באיזה כיוון הגבינה?", choices: ["למעלה", "ימין", "שמאל"] },
    { word: "ימין", emoji: "🐭⬛🧀\n⬜⬛⬜\n⬜⬜⬜", hint: "הקיר שחור חוסם. לאן קודם?", choices: ["שמאל", "למעלה", "למטה"] },
    { word: "1", emoji: "3  1  2\n2  3  1\n1  2  ❓", hint: "השלם את הריבוע (1–2–3 בכל שורה)" },
    { word: "3", emoji: "1  2  3\n3  1  2\n2  ❓  1", hint: "השלם את הריבוע (1–2–3 בכל שורה)" },
    { word: "שעון", emoji: "🤔", hint: "יש לי ידים, אבל לא ידיים של אדם. מה אני?", choices: ["דלת", "חלון", "ספר"] },
    { word: "מפתח", emoji: "🤔", hint: "פותחים איתי דלת, אבל אני לא יד. מה אני?", choices: ["מנעול", "חלון", "פעמון"] },
    { word: "צל", emoji: "🤔", hint: "הולך איתך ביום, ונעלם בלילה. מה זה?", choices: ["רוח", "גשם", "קשת"] },
    { word: "ביצה", emoji: "🤔", hint: "יש לי קליפה, ומתוכי יוצאת אפרוח. מה אני?", choices: ["קן", "תרנגולת", "לחם"] },
    { word: "ספר", emoji: "🤔", hint: "יש לי דפים, אבל אני לא עץ. מה אני?", choices: ["מחברת", "עיתון", "תיק"] },
    { word: "קרח", emoji: "💧❄️❓", hint: "מה קורה למים בקור?", choices: ["אדים", "גשם", "חול"] },
    { word: "שמונה", emoji: "🐙", hint: "לתמנון יש כמה זרועות? כתבו במילה", choices: ["שש", "ארבע", "עשר"] },
    { word: "משולש", emoji: "▲▲▲", hint: "לצורה הזו יש 3 צלעות. איך קוראים לה?", choices: ["עיגול", "ריבוע", "מלבן"] },
    { word: "זוגי", emoji: "2  4  6  ❓", hint: "איזה סוג מספרים זו הסדרה?", choices: ["אי-זוגי", "ראשוני", "שלילי"] },
  ],
  hard: [
    { word: "2", emoji: "1  3  2\n3  2  1\n2  1  ❓", hint: "השלם את הריבוע (כל מספר פעם אחת בשורה)" },
    { word: "1", emoji: "2  3  1\n1  2  3\n3  ❓  2", hint: "השלם את הריבוע" },
    { word: "3", emoji: "1  2  ?\n2  3  1\n3  1  2", hint: "השלם את הריבוע" },
    { word: "שמאל", emoji: "⬛🧀⬛\n⬜⬛⬜\n🐭⬜⬜", hint: "אי אפשר לעבור בשחור. לאן קודם?", choices: ["ימין", "למעלה", "למטה"] },
    { word: "למעלה", emoji: "⬜🧀⬜\n⬛⬜⬛\n⬛🐭⬛", hint: "רק המשבצת הלבנה פתוחה. לאן?", choices: ["למטה", "ימין", "שמאל"] },
    { word: "קשת", emoji: "🤔", hint: "מופיעה אחרי גשם, עם הרבה צבעים. מה זה?", choices: ["ברק", "ענן", "ירח"] },
    { word: "כוכב", emoji: "🤔", hint: "נראה קטן בשמיים בלילה, אבל הוא רחוק מאוד. מה זה?", choices: ["שמש", "עפיפון", "מטוס"] },
    { word: "דלת", emoji: "🤔", hint: "בלי רגליים אני עומדת, ובלי ידיים אני נפתחת. מה אני?", choices: ["חלון", "קיר", "גג"] },
    { word: "נהר", emoji: "🤔", hint: "אני זורם ולא הולך, ויש בי דגים. מה אני?", choices: ["כביש", "גשר", "באר"] },
    { word: "אוזן", emoji: "🤔", hint: "שומעים איתי, אבל אני לא רמקול. מה אני?", choices: ["עין", "אף", "פה"] },
    { word: "16", emoji: "2  4  8  ❓", hint: "כל מספר הוא כפול מהקודם. מה הבא?", choices: ["10", "12", "6"] },
    { word: "16", emoji: "1  4  9  ❓", hint: "1×1, 2×2, 3×3… מה הבא?" },
    { word: "חורף", emoji: "🌸☀️🍂❓", hint: "אביב, קיץ, סתיו… מה העונה הבאה?", choices: ["אביב", "קיץ", "סתיו"] },
    { word: "שינה", emoji: "🤔", hint: "עושים אותה בלילה עם עיניים עצומות. מה זה?", choices: ["ריצה", "אכילה", "משחק"] },
    { word: "גשר", emoji: "🤔", hint: "עוברים עליי מעל מים, אבל אני לא סירה. מה אני?", choices: ["סולם", "מנהרה", "רציף"] },
  ],
};

export function generateLogicList(level: Difficulty): Word[] {
  const n = CONFIG.wordsPerRun;
  const generated: Word[] = [];
  const seen = new Set<string>();
  let guard = 0;
  while (generated.length < 8 && guard < 80) {
    guard++;
    const p = sequenceProblem(level);
    const key = `${p.emoji}=${p.word}`;
    if (seen.has(key)) continue;
    seen.add(key);
    generated.push(p);
  }
  return shuffle([...LOGIC_WORDS[level], ...generated]).slice(0, n);
}
