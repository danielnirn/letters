import { CONFIG, TILE_COLORS, isSpellingCategory, type Category, type Difficulty } from "./config";
import { ENGLISH_WORDS } from "./english";
import { generateLogicList, LOGIC_WORDS } from "./logic";
import { generateMathList } from "./math";
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

export type Phase = "playing" | "win" | "gameover" | "timeout";

export type GameState = {
  category: Category;
  level: Difficulty;
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
  lives: number;
  doubleCoins: boolean;
  phase: Phase;
  lastReward: number;
  lastStreakBonus: number;
  choiceWords: string[];
  shaking: boolean;
  currentHint: string;
  typedAnswer: string;
  lastWrongPick: string;
};

function wordBank(category: Category) {
  if (category === "english") return ENGLISH_WORDS;
  if (category === "science") return SCIENCE_WORDS;
  if (category === "logic") return LOGIC_WORDS;
  return WORDS;
}

function freshWordList(category: Category, level: Difficulty): Word[] {
  if (category === "math") return generateMathList(level);
  if (category === "logic") return generateLogicList(level);
  return shuffle(wordBank(category)[level]).slice(0, CONFIG.wordsPerRun);
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
    tiles: questionType === "spell" ? makeTiles(letters) : [],
    placed: [],
    typedAnswer: "",
    hints: state.hints,
    isBonus,
    bonusTimeLeft: isBonus ? CONFIG.bonusSeconds : CONFIG.bonusSeconds,
    questionType,
    choiceWords,
    phase: "playing",
    shaking: false,
    lastReward: 0,
    lastStreakBonus: 0,
    lastWrongPick: "",
  };
}

export function startGame(level: Difficulty, category: Category = "language"): GameState {
  return loadCurrentWord(
    {
      category,
      level,
      wordList: freshWordList(category, level),
      wordIndex: 0,
      currentWord: "",
      currentEmoji: "",
      currentHint: "",
      tiles: [],
      placed: [],
      hints: CONFIG.hintsPerWord,
      score: 0,
      wordsCompleted: 0,
      isBonus: false,
      bonusTimeLeft: CONFIG.bonusSeconds,
      streak: 0,
      questionType: "spell",
      lives: CONFIG.lives,
      doubleCoins: false,
      phase: "playing",
      lastReward: 0,
      lastStreakBonus: 0,
      choiceWords: [],
      shaking: false,
      typedAnswer: "",
      lastWrongPick: "",
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

function markCorrect(state: GameState): GameState {
  const base = state.isBonus ? CONFIG.coinsBonus : CONFIG.coinsCorrect;
  const reward = state.doubleCoins ? base * 2 : base;
  let streak = state.streak + 1;
  let lastStreakBonus = 0;
  if (streak >= CONFIG.streakEvery) {
    lastStreakBonus = CONFIG.streakBonus;
    streak = 0;
  }
  return {
    ...state,
    score: state.score + reward,
    wordsCompleted: state.wordsCompleted + 1,
    streak,
    lastReward: reward,
    lastStreakBonus,
    phase: "win",
    isBonus: false,
  };
}

function markWrong(state: GameState): GameState {
  const lives = state.lives - 1;
  if (lives <= 0) {
    return { ...state, lives: 0, streak: 0, phase: "gameover", shaking: true, typedAnswer: "" };
  }
  if (state.questionType === "type") {
    return { ...state, lives, streak: 0, typedAnswer: "", shaking: true };
  }
  if (state.questionType === "choice") {
    return { ...state, lives, streak: 0, shaking: true };
  }
  const letters = state.currentWord.split("");
  const hintCount = state.placed.filter((p) => p.fromHint).length;
  const placed: Placed[] = letters.slice(0, hintCount).map((letter) => ({
    letter,
    fromHint: true,
  }));
  const tiles = state.tiles.map((t) => ({
    ...t,
    used: t.fromHint,
  }));
  return { ...state, lives, streak: 0, placed, tiles, shaking: true };
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
  return markWrong(state);
}

export function answerChoice(state: GameState, word: string): GameState {
  if (state.phase !== "playing" || state.questionType !== "choice") return state;
  if (word === state.currentWord) return markCorrect(state);
  return markWrong({ ...state, lastWrongPick: word });
}

export function nextWord(state: GameState): GameState {
  let wordIndex = state.wordIndex + 1;
  let wordList = state.wordList;
  if (wordIndex >= wordList.length) {
    wordList = freshWordList(state.category, state.level);
    wordIndex = 0;
  }
  const isBonus =
    state.wordsCompleted > 0 && state.wordsCompleted % CONFIG.bonusEveryN === 0;
  return loadCurrentWord(
    {
      ...state,
      wordList,
      wordIndex,
      hints: CONFIG.hintsPerWord,
      doubleCoins: false,
      isBonus,
    },
    true,
  );
}

export function skipWord(state: GameState): GameState {
  let wordIndex = state.wordIndex + 1;
  let wordList = state.wordList;
  if (wordIndex >= wordList.length) {
    wordList = freshWordList(state.category, state.level);
    wordIndex = 0;
  }
  return loadCurrentWord(
    {
      ...state,
      wordList,
      wordIndex,
      hints: CONFIG.hintsPerWord,
      isBonus: false,
      streak: 0,
    },
    false,
  );
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
  return nextWord({ ...state, wordsCompleted: state.wordsCompleted + 1, isBonus: false });
}

export function extraHints(state: GameState): GameState {
  return { ...state, hints: state.hints + CONFIG.hintsPerWord };
}

export function enableDoubleCoins(state: GameState): GameState {
  return { ...state, doubleCoins: true };
}

export function revive(state: GameState): GameState {
  return loadCurrentWord({ ...state, lives: 1, phase: "playing" }, true);
}

export function clearShake(state: GameState): GameState {
  return { ...state, shaking: false };
}
