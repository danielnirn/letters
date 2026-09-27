import { CONFIG, TILE_COLORS, type Category, type Difficulty } from "./config";
import { ENGLISH_WORDS } from "./english";
import { generateMathList } from "./math";
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
  questionType: "spell" | "choice";
  lives: number;
  doubleCoins: boolean;
  phase: Phase;
  lastReward: number;
  lastStreakBonus: number;
  choiceWords: string[];
  shaking: boolean;
  currentHint: string;
};

function wordBank(category: Category) {
  return category === "english" ? ENGLISH_WORDS : WORDS;
}

function freshWordList(category: Category, level: Difficulty): Word[] {
  if (category === "math") return generateMathList(level);
  return shuffle(wordBank(category)[level]).slice(0, CONFIG.wordsPerRun);
}

function distractors(state: GameState, answer: string): string[] {
  if (state.category === "math") {
    const n = Number(answer);
    const pool = shuffle([n + 1, n - 1, n + 2, n - 2, n + 3, n + 10, Math.max(0, n - 3)])
      .map((x) => String(Math.max(0, x)))
      .filter((x) => x !== answer);
    const unique = [...new Set(pool)];
    return unique.slice(0, 2);
  }
  const pool = wordBank(state.category)[state.level].filter((w) => w.word !== answer);
  return shuffle(pool)
    .slice(0, 2)
    .map((w) => w.word);
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
  const questionType: "spell" | "choice" =
    !isBonus && Math.random() < 0.5 ? "choice" : "spell";
  const choiceWords = shuffle([obj.word, ...distractors(state, obj.word)]);

  return {
    ...state,
    currentWord: obj.word,
    currentEmoji: obj.emoji,
    currentHint: obj.hint ?? "",
    tiles: makeTiles(letters),
    placed: [],
    hints: state.hints,
    isBonus,
    bonusTimeLeft: isBonus ? CONFIG.bonusSeconds : CONFIG.bonusSeconds,
    questionType,
    choiceWords,
    phase: "playing",
    shaking: false,
    lastReward: 0,
    lastStreakBonus: 0,
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
  if (state.hints <= 0 || state.questionType !== "spell") return state;
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
    return { ...state, lives: 0, streak: 0, phase: "gameover", shaking: true };
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

export function answerChoice(state: GameState, word: string): GameState {
  if (state.phase !== "playing" || state.questionType !== "choice") return state;
  if (word === state.currentWord) return markCorrect(state);
  const lives = state.lives - 1;
  if (lives <= 0) {
    return { ...state, lives: 0, streak: 0, phase: "gameover" };
  }
  return { ...state, lives, streak: 0 };
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
