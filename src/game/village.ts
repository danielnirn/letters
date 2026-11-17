import type { ProfileDoc } from "../types/models";
import {
  CATEGORIES,
  CONFIG,
  clearedStages,
  isStagePerfectClear,
  stageCoinsKey,
  type Category,
  type Difficulty,
} from "./config";
import { SCENE_ORDER } from "./economy";
import type { GameState } from "./session";

const DIFFICULTIES: Difficulty[] = ["easy", "mid", "hard"];

/** Each subject has one building in the village picture. */
export const VILLAGE_ORDER: Category[] = SCENE_ORDER;

/** Stage map rating: 3 = perfect, 2 = at least 70% right, 1 = finished. Not the star wallet. */
export function runStars(state: GameState): number {
  const total = state.questionMarks.length;
  const ok = state.questionMarks.filter((m) => m === "ok").length;
  if (total > 0 && ok === total) return 3;
  if (total > 0 && ok / total >= 0.7) return 2;
  return 1;
}

/** Best rating for one stage. Stages cleared before ratings existed count as 3 (perfect) or 1. */
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
