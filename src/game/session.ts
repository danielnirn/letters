import { CONFIG, TILE_COLORS, isSpellingCategory, questionsInStage, type Category, type Difficulty } from "./config";
import { ENGLISH_WORDS } from "./english";
import { generateLogicList, LOGIC_WORDS } from "./logic";
import { generateMathList } from "./math";
import { generateReadingList } from "./reading";
import { SCIENCE_WORDS } from "./science";
import { shuffle, shuffleDistinct } from "./shuffle";
import { WORDS, type Word } from "./words";

export type Tile = {
  id: string;
  letter: string;
  color: string;
  used: boolean;
  fromHint: boolean;
};

export type Placed = { letter: string; fromHint: boolean };

export type Phase = "playing" | "win" | "timeout" | "complete";

export type Mistake = {
  index: number;
  prompt: string;
  hint: string;
  answer: string;
  guess: string;
  skipped: boolean;
  story?: string;
};

export type GameState = {
  category: Category;
  level: Difficulty;
  stage: number;
  wordList: Word[];
  wordIndex: number;
  currentWord: string;
  currentEmoji: string;
  tiles: Tile[];
  placed: Placed[];
  hints: number;
  score: number;
  wordsCompleted: number;
  isBonus: boolean;
  bonusTimeLeft: number;
  streak: number;
  questionType: "spell" | "choice" | "type";
  doubleCoins: boolean;
  phase: Phase;
  lastReward: number;
  lastStreakBonus: number;
  lastFirstTryBonus: number;
  missedThisWord: boolean;
  choiceWords: string[];
  shaking: boolean;
  currentHint: string;
  currentStory: string;
  typedAnswer: string;
  lastWrongPick: string;
  questionMarks: Array<"ok" | "bad" | null>;
  mistakes: Mistake[];
};

function wordBank(category: Category) {
  if (category === "english") return ENGLISH_WORDS;
  if (category === "science") return SCIENCE_WORDS;
  if (category === "logic") return LOGIC_WORDS;
  return WORDS;
}

function freshWordList(category: Category, level: Difficulty, count: number): Word[] {
  if (category === "math") return generateMathList(level, count);
  if (category === "logic") return generateLogicList(level, count);
  if (category === "reading") return generateReadingList(level, count);
  const bank = wordBank(category)[level] ?? [];
  const shuffled = shuffle(bank);
  if (shuffled.length >= count) return shuffled.slice(0, count);
  const out: Word[] = [];
  while (out.length < count) {
    out.push(...shuffle(bank));
  }
  return out.slice(0, count);
}

function numericDistractors(answer: string, count: number): string[] {
  const n = Number(answer);
  const pool = shuffle([
    n + 1,
    n - 1,
    n + 2,
    n - 2,
    n + 3,
    n - 3,
    n + 4,
    n + 5,
    n + 6,
    n + 10,
    n + 7,
    Math.max(0, n - 4),
    Math.max(0, n - 5),
    Math.abs(n - 10),
    n === 0 ? 1 : n * 2,
  ])
    .map((x) => String(Math.max(0, x)))
    .filter((x) => x !== answer);
  return [...new Set(pool)].slice(0, count);
}

function distractors(state: GameState, obj: Word, count: number): string[] {
  const seen = new Set<string>([obj.word]);
  const out: string[] = [];
  const push = (items: string[]) => {
    for (const x of items) {
      if (!x || seen.has(x)) continue;
      seen.add(x);
      out.push(x);
      if (out.length >= count) return;
    }
  };

  if (obj.choices?.length) push(shuffle(obj.choices));
  if (out.length >= count) return out.slice(0, count);

  if (state.category === "math" || /^\d+$/.test(obj.word)) {
    push(numericDistractors(obj.word, count * 4));
    return out.slice(0, count);
  }

  const bank = wordBank(state.category);
  push(shuffle((bank[state.level] ?? []).map((w) => w.word)));
  for (const lvl of ["easy", "mid", "hard"] as const) {
    if (out.length >= count) break;
    push(shuffle((bank[lvl] ?? []).map((w) => w.word)));
  }
  push(["מים", "בית", "שמש", "כלב", "עץ", "ים", "לב", "יד", "פרח", "גשם"]);
  return out.slice(0, count);
}

function pickQuestionType(category: Category, isBonus: boolean): GameState["questionType"] {
  if (!isSpellingCategory(category)) return "choice";
  if (isBonus) return "spell";
  return Math.random() < 0.5 ? "choice" : "spell";
}

function makeTiles(letters: string[]): Tile[] {
  return shuffleDistinct(letters).map((letter, idx) => ({
    id: `${idx}-${letter}`,
    letter,
    color: TILE_COLORS[idx % TILE_COLORS.length],
    used: false,
    fromHint: false,
  }));
}

function loadCurrentWord(state: GameState, keepBonus: boolean): GameState {
  const obj = state.wordList[state.wordIndex % state.wordList.length];
  const letters = obj.word.split("");
  const isBonus = keepBonus ? state.isBonus : false;
  const questionType = pickQuestionType(state.category, isBonus);
  const extraChoices = 3;
  const choiceWords =
    questionType === "choice" ? shuffle([obj.word, ...distractors(state, obj, extraChoices)]) : [];

  return {
    ...state,
    currentWord: obj.word,
    currentEmoji: obj.emoji,
    currentHint: obj.hint ?? "",
    currentStory: obj.story ?? "",
    tiles: questionType === "spell" ? makeTiles(letters) : [],
    placed: [],
    typedAnswer: "",
    hints: state.hints,
    isBonus,
    bonusTimeLeft: 0,
    questionType,
    choiceWords,
    phase: "playing",
    shaking: false,
    lastReward: 0,
    lastStreakBonus: 0,
    lastFirstTryBonus: 0,
    lastWrongPick: "",
    missedThisWord: false,
  };
}

export function startGame(level: Difficulty, category: Category = "language", stage = 1): GameState {
  const safeStage = Math.min(CONFIG.miniLevels, Math.max(1, stage));
  const count = questionsInStage(safeStage);
  const wordList = freshWordList(category, level, count);
  return loadCurrentWord(
    {
      category,
      level,
      stage: safeStage,
      wordList,
      wordIndex: 0,
      currentWord: "",
      currentEmoji: "",
      currentHint: "",
      currentStory: "",
      tiles: [],
      placed: [],
      hints: CONFIG.hintsPerWord,
      score: 0,
      wordsCompleted: 0,
      isBonus: false,
      bonusTimeLeft: 0,
      streak: 0,
      questionType: "spell",
      doubleCoins: false,
      phase: "playing",
      lastReward: 0,
      lastStreakBonus: 0,
      lastFirstTryBonus: 0,
      missedThisWord: false,
      choiceWords: [],
      shaking: false,
      typedAnswer: "",
      lastWrongPick: "",
      questionMarks: wordList.map(() => null),
      mistakes: [],
    },
    false,
  );
}

export function placeTile(state: GameState, tileId: string): GameState {
  if (state.phase !== "playing" || state.questionType !== "spell") return state;
  const tile = state.tiles.find((t) => t.id === tileId);
  if (!tile || tile.used) return state;
  const letters = state.currentWord.split("");
  if (state.placed.length >= letters.length) return state;
  const tiles = state.tiles.map((t) => (t.id === tileId ? { ...t, used: true } : t));
  const placed = [...state.placed, { letter: tile.letter, fromHint: false }];
  const next = { ...state, tiles, placed, shaking: false };
  if (placed.length === letters.length) return evaluateSpell(next);
  return next;
}

export function deleteLast(state: GameState): GameState {
  if (state.questionType === "type") {
    if (!state.typedAnswer) return state;
    return { ...state, typedAnswer: state.typedAnswer.slice(0, -1), shaking: false };
  }
  if (state.placed.length === 0) return state;
  const last = state.placed[state.placed.length - 1];
  if (last.fromHint) return state;
  const placed = state.placed.slice(0, -1);
  const tiles = [...state.tiles];
  for (let i = tiles.length - 1; i >= 0; i--) {
    const t = tiles[i];
    if (t.used && !t.fromHint && t.letter === last.letter) {
      tiles[i] = { ...t, used: false };
      break;
    }
  }
  return { ...state, placed, tiles };
}

export function useHint(state: GameState): GameState {
  if (state.hints <= 0) return state;
  if (state.questionType === "type") {
    const next = state.currentWord.slice(0, state.typedAnswer.length + 1);
    return { ...state, typedAnswer: next, hints: state.hints - 1, shaking: false };
  }
  if (state.questionType !== "spell") return state;
  const idx = state.placed.length;
  const letters = state.currentWord.split("");
  if (idx >= letters.length) return state;
  const correct = letters[idx];
  const tiles = state.tiles.map((t) => ({ ...t }));
  const match = tiles.find((t) => !t.used && t.letter === correct);
  if (match) {
    match.used = true;
    match.fromHint = true;
  }
  const placed = [...state.placed, { letter: correct, fromHint: true }];
  const next = { ...state, tiles, placed, hints: state.hints - 1 };
  if (placed.length === letters.length) return evaluateSpell(next);
  return next;
}

function evaluateSpell(state: GameState): GameState {
  const guess = state.placed.map((p) => p.letter).join("");
  if (guess === state.currentWord) return markCorrect(state);
  return markWrong(state);
}

function setMark(state: GameState, mark: "ok" | "bad"): GameState {
  const questionMarks = state.questionMarks.slice();
  if (!questionMarks.length) {
    return { ...state, questionMarks: state.wordList.map((_, i) => (i === state.wordIndex ? mark : null)) };
  }
  questionMarks[state.wordIndex] = mark;
  return { ...state, questionMarks };
}

function markCorrect(state: GameState): GameState {
  const base = CONFIG.coinsCorrect;
  const firstTryBonus = !state.missedThisWord
    ? state.doubleCoins
      ? CONFIG.firstTryBonus * 2
      : CONFIG.firstTryBonus
    : 0;
  const reward = (state.doubleCoins ? base * 2 : base) + firstTryBonus;
  let streak = state.streak + 1;
  let lastStreakBonus = 0;
  if (streak >= CONFIG.streakEvery) {
    lastStreakBonus = CONFIG.streakBonus;
    streak = 0;
  }
  return {
    ...setMark(state, "ok"),
    score: state.score + reward + lastStreakBonus,
    wordsCompleted: state.wordsCompleted + 1,
    streak,
    lastReward: reward,
    lastStreakBonus,
    lastFirstTryBonus: firstTryBonus,
    phase: "win",
    isBonus: false,
  };
}

function addMistake(state: GameState, guess: string, skipped: boolean): GameState {
  return {
    ...state,
    mistakes: [
      ...state.mistakes,
      {
        index: state.wordIndex,
        prompt: state.currentEmoji,
        hint: state.currentHint,
        answer: state.currentWord,
        guess,
        skipped,
        story: state.currentStory || undefined,
      },
    ],
  };
}

function markWrong(state: GameState): GameState {
  const guess =
    state.lastWrongPick ||
    (state.questionType === "spell" ? state.placed.map((p) => p.letter).join("") : state.typedAnswer);
  return {
    ...setMark(addMistake(state, guess, false), "bad"),
    missedThisWord: true,
    streak: 0,
    shaking: true,
  };
}

export function typeDigit(state: GameState, digit: string): GameState {
  if (state.phase !== "playing" || state.questionType !== "type") return state;
  if (!/^\d$/.test(digit)) return state;
  if (state.typedAnswer.length >= 4) return state;
  return { ...state, typedAnswer: state.typedAnswer + digit, shaking: false };
}

export function submitTyped(state: GameState): GameState {
  if (state.phase !== "playing" || state.questionType !== "type") return state;
  if (!state.typedAnswer) return state;
  if (state.typedAnswer === state.currentWord) return markCorrect(state);
  return markWrong({ ...state, lastWrongPick: state.typedAnswer });
}

export function answerChoice(state: GameState, word: string): GameState {
  if (state.phase !== "playing" || state.questionType !== "choice" || state.shaking) return state;
  if (word === state.currentWord) return markCorrect(state);
  return markWrong({ ...state, lastWrongPick: word });
}

function advanceQuestion(state: GameState, extra: Partial<GameState>): GameState {
  const wordIndex = state.wordIndex + 1;
  if (wordIndex >= state.wordList.length) {
    return {
      ...state,
      ...extra,
      phase: "complete",
      shaking: false,
      isBonus: false,
    };
  }
  return loadCurrentWord(
    {
      ...state,
      ...extra,
      wordList: state.wordList,
      wordIndex,
      hints: CONFIG.hintsPerWord,
      doubleCoins: extra.doubleCoins ?? false,
      isBonus: false,
    },
    false,
  );
}

export function nextWord(state: GameState): GameState {
  return advanceQuestion(state, {});
}

export function stageIsPerfect(state: GameState): boolean {
  return state.questionMarks.length > 0 && state.questionMarks.every((m) => m === "ok");
}

export function stageCoinReward(state: GameState): number {
  const n = Math.max(1, state.wordList.length);
  const full = n * CONFIG.coinsCorrect;
  const base = stageIsPerfect(state) ? full : Math.floor(full / 2);
  return state.doubleCoins ? base * 2 : base;
}

export function skipWord(state: GameState): GameState {
  if (state.phase !== "playing" || state.shaking) return state;
  return advanceQuestion(setMark(addMistake(state, "", true), "bad"), {
    streak: 0,
    isBonus: false,
    shaking: false,
  });
}

export function tickBonus(state: GameState): GameState {
  if (!state.isBonus || state.phase !== "playing") return state;
  const left = state.bonusTimeLeft - 1;
  if (left <= 0) {
    return { ...state, bonusTimeLeft: 0, phase: "timeout", isBonus: false, streak: 0 };
  }
  return { ...state, bonusTimeLeft: left };
}

export function afterTimeout(state: GameState): GameState {
  return advanceQuestion(
    { ...state, wordsCompleted: state.wordsCompleted + 1 },
    { isBonus: false, streak: 0 },
  );
}

export function clearShake(state: GameState): GameState {
  return { ...state, shaking: false };
}
