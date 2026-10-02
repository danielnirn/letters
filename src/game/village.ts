import type { ProfileDoc } from "../types/models";
import { CONFIG, CATEGORIES, clearedStages, isStagePerfectClear, stageCoinsKey, type Category, type Difficulty } from "./config";
import type { GameState } from "./session";

const DIFFICULTIES: Difficulty[] = ["easy", "mid", "hard"];

/** Each subject builds one house in the village. */
export const VILLAGE_ORDER: Category[] = ["reading", "science", "math", "language", "logic", "english"];

/** Stars needed for building levels 1–4 (0 = empty plot). Max per subject is 90. */
export const LEVEL_STARS = [3, 15, 35, 65] as const;
export const MAX_BUILDING_LEVEL = LEVEL_STARS.length;
export const STARS_PER_STAGE = 3;

/** 3 = perfect, 2 = at least 70% right, 1 = finished. */
export function runStars(state: GameState): number {
  const total = state.questionMarks.length;
  const ok = state.questionMarks.filter((m) => m === "ok").length;
  if (total > 0 && ok === total) return 3;
  if (total > 0 && ok / total >= 0.7) return 2;
  return 1;
}

/** Best stars for one stage. Stages cleared before stars existed count as 3 (perfect) or 1. */
export function stageStars(p: ProfileDoc, category: Category, difficulty: Difficulty, stage: number): number {
  const saved = p.stageStars?.[stageCoinsKey(category, difficulty, stage)];
  if (saved) return saved;
  if (stage > clearedStages(p.stageClears, category, difficulty)) return 0;
  return isStagePerfectClear(p.stagePerfect, p.stageCoins, category, difficulty, stage) ? 3 : 1;
}

export function categoryStars(p: ProfileDoc, category: Category): number {
  let sum = 0;
  for (const d of DIFFICULTIES) {
    for (let s = 1; s <= CONFIG.miniLevels; s++) sum += stageStars(p, category, d, s);
  }
  return sum;
}

export function totalStars(p: ProfileDoc): number {
  return CATEGORIES.reduce((sum, cat) => sum + categoryStars(p, cat), 0);
}

export function buildingLevel(stars: number): number {
  return LEVEL_STARS.filter((need) => stars >= need).length;
}

/** Stars needed for the next level, or null when the building is complete. */
export function nextLevelStars(stars: number): number | null {
  return LEVEL_STARS.find((need) => stars < need) ?? null;
}

export function villageLevels(p: ProfileDoc): Record<Category, number> {
  const out = {} as Record<Category, number>;
  for (const cat of CATEGORIES) out[cat] = buildingLevel(categoryStars(p, cat));
  return out;
}

/** The building closest to its next level — what the home screen suggests playing. */
export function nextGoal(p: ProfileDoc): { category: Category; need: number; level: number } | null {
  let best: { category: Category; need: number; level: number } | null = null;
  for (const cat of VILLAGE_ORDER) {
    const stars = categoryStars(p, cat);
    const next = nextLevelStars(stars);
    if (next == null) continue;
    const need = next - stars;
    if (!best || need < best.need) best = { category: cat, need, level: buildingLevel(stars) + 1 };
  }
  return best;
}
