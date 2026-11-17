export const CONFIG = {
  hintsPerWord: 3,
  miniLevels: 10,
  coinsCorrect: 10,
  firstTryBonus: 5,
  streakEvery: 3,
  streakBonus: 15,
  correctHoldMs: 2500,
  stageCompleteHoldMs: 4000,
} as const;

export const TILE_COLORS = [
  "#e84393",
  "#FF6B6B",
  "#FF9F43",
  "#FFD93D",
  "#6BCB77",
  "#4D96FF",
  "#A29BFE",
  "#00CEC9",
  "#fd7272",
  "#badc58",
  "#f9ca24",
  "#6ab04c",
];

export type Difficulty = "easy" | "mid" | "hard";
export type Category = "language" | "math" | "english" | "logic" | "science" | "reading";

export const CATEGORIES: Category[] = ["language", "math", "english", "logic", "science", "reading"];

export function isSpellingCategory(category: Category) {
  return category === "language" || category === "english";
}

export function parseCategory(value: string | undefined): Category {
  return CATEGORIES.includes(value as Category) ? (value as Category) : "language";
}

export function parseDifficulty(value: string | undefined): Difficulty {
  return value === "mid" || value === "hard" ? value : "easy";
}

export function parseStage(value: string | undefined): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(CONFIG.miniLevels, Math.floor(n));
}

export function questionsInStage(stage: number): number {
  return stage % 2 === 0 ? 7 : 6;
}

export function stageProgressKey(category: Category, difficulty: Difficulty): string {
  return `${category}:${difficulty}`;
}

export function stageCoinsKey(category: Category, difficulty: Difficulty, stage: number): string {
  return `${category}:${difficulty}:${stage}`;
}

export function coinsForStage(
  coins: Record<string, number> | undefined,
  category: Category,
  difficulty: Difficulty,
  stage: number,
): number {
  return coins?.[stageCoinsKey(category, difficulty, stage)] ?? 0;
}

export function isStagePerfectClear(
  perfects: Record<string, boolean> | undefined,
  coins: Record<string, number> | undefined,
  category: Category,
  difficulty: Difficulty,
  stage: number,
): boolean {
  const key = stageCoinsKey(category, difficulty, stage);
  if (perfects?.[key]) return true;
  const earned = coinsForStage(coins, category, difficulty, stage);
  const full = questionsInStage(stage) * CONFIG.coinsCorrect;
  return earned > 0 && earned >= full;
}

export function clearedStages(
  clears: Record<string, number> | undefined,
  category: Category,
  difficulty: Difficulty,
): number {
  const n = clears?.[stageProgressKey(category, difficulty)] ?? 0;
  return Math.min(CONFIG.miniLevels, Math.max(0, n));
}

export function isStageUnlocked(
  clears: Record<string, number> | undefined,
  category: Category,
  difficulty: Difficulty,
  stage: number,
): boolean {
  return stage <= clearedStages(clears, category, difficulty) + 1;
}
