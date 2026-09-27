export const CONFIG = {
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

export const THEME_IDS = ["theme_space", "theme_jungle", "theme_unicorn"] as const;
export type ThemeId = (typeof THEME_IDS)[number];
export type Difficulty = "easy" | "mid" | "hard";
export type Category = "language" | "math" | "english" | "logic" | "science";

export const CATEGORIES: Category[] = ["language", "math", "english", "logic", "science"];

export function parseCategory(value: string | undefined): Category {
  return CATEGORIES.includes(value as Category) ? (value as Category) : "language";
}
