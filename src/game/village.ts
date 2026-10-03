import type { ProfileDoc } from "../types/models";
import { CONFIG, CATEGORIES, clearedStages, isStagePerfectClear, stageCoinsKey, type Category, type Difficulty } from "./config";
import type { GameState } from "./session";

const DIFFICULTIES: Difficulty[] = ["easy", "mid", "hard"];

/** Each subject builds one house in the village. */
export const VILLAGE_ORDER: Category[] = ["reading", "science", "math", "language", "logic", "english"];

/** Stars for the four buildings (tent, hut, house, fancy). Max per subject is 90. */
export const LEVEL_STARS = [3, 15, 35, 65] as const;
export const MAX_BUILDING_LEVEL = LEVEL_STARS.length;
export const STARS_PER_STAGE = 3;

export type MilestoneId =
  | "tent"
  | "lantern"
  | "fence"
  | "hut"
  | "flowers"
  | "chimney"
  | "house"
  | "tree"
  | "path"
  | "fancy";

/** A small help in that subject's stages. Coins and stars stay capped and tiny. */
export type MilestoneBonus = "coins2" | "coins4" | "hint" | "star" | "easier";

/** A visible change. `level` is the building; `detail` adds a small piece on it. */
export type Milestone = {
  stars: number;
  level: number;
  detail: number;
  id: MilestoneId;
  bonus: MilestoneBonus;
};

export const MILESTONES: readonly Milestone[] = [
  { stars: 3, level: 1, detail: 0, id: "tent", bonus: "coins2" },
  { stars: 6, level: 1, detail: 1, id: "lantern", bonus: "hint" },
  { stars: 10, level: 1, detail: 2, id: "fence", bonus: "easier" },
  { stars: 15, level: 2, detail: 0, id: "hut", bonus: "star" },
  { stars: 21, level: 2, detail: 1, id: "flowers", bonus: "coins2" },
  { stars: 28, level: 2, detail: 2, id: "chimney", bonus: "hint" },
  { stars: 35, level: 3, detail: 0, id: "house", bonus: "easier" },
  { stars: 44, level: 3, detail: 1, id: "tree", bonus: "coins2" },
  { stars: 54, level: 3, detail: 2, id: "path", bonus: "coins2" },
  { stars: 65, level: 4, detail: 0, id: "fancy", bonus: "coins4" },
];

/** Help from the pieces already built in one subject. */
export type SubjectPerks = {
  hints: number;
  stars: number;
  coins: number;
  /** Share of correct answers that earns 2 stars. Starts at 0.7. */
  twoStarAt: number;
};

export function perksFor(stars: number): SubjectPerks {
  let hints = 0;
  let starBonus = 0;
  let coins = 0;
  let easier = 0;
  for (const m of MILESTONES) {
    if (stars < m.stars) break;
    if (m.bonus === "hint") hints += 1;
    else if (m.bonus === "star") starBonus += 1;
    else if (m.bonus === "coins2") coins += 2;
    else if (m.bonus === "coins4") coins += 4;
    else easier += 1;
  }
  return {
    hints,
    stars: starBonus,
    coins,
    twoStarAt: Math.max(0.5, 0.7 - easier * 0.1),
  };
}

export type BuildingLook = { level: number; detail: number };

export function lookFor(stars: number): BuildingLook {
  let look: BuildingLook = { level: 0, detail: 0 };
  for (const m of MILESTONES) {
    if (stars < m.stars) break;
    look = { level: m.level, detail: m.detail };
  }
  return look;
}

export function milestoneIndex(stars: number): number {
  let i = -1;
  for (let n = 0; n < MILESTONES.length; n++) {
    if (stars >= MILESTONES[n].stars) i = n;
  }
  return i;
}

export function nextMilestone(stars: number): Milestone | null {
  return MILESTONES.find((m) => stars < m.stars) ?? null;
}

export function prevMilestoneStars(stars: number): number {
  const i = milestoneIndex(stars);
  return i < 0 ? 0 : MILESTONES[i].stars;
}

export function todayKey(now = new Date()): string {
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${m}-${d}`;
}

/** Same building all day for this child. A missed day simply asks again tomorrow. */
export function wishCategory(profileId: string, day = todayKey()): Category {
  let n = 0;
  const s = `${profileId}:${day}`;
  for (let i = 0; i < s.length; i++) n = (n * 33 + s.charCodeAt(i)) >>> 0;
  return VILLAGE_ORDER[n % VILLAGE_ORDER.length];
}

export function wishDoneToday(p: ProfileDoc, day = todayKey()): boolean {
  return p.wishDay === day && p.wishDone === true;
}

/** 3 = perfect, 2 = at least `twoStarAt` right (0.7 until the building helps), 1 = finished. */
export function runStars(state: GameState, twoStarAt = 0.7): number {
  const total = state.questionMarks.length;
  const ok = state.questionMarks.filter((m) => m === "ok").length;
  if (total > 0 && ok === total) return 3;
  if (total > 0 && ok / total >= twoStarAt) return 2;
  return 1;
}

/** Stars for this finish, including a building's extra star, never above 3. */
export function awardedStars(state: GameState, perks: SubjectPerks): number {
  return Math.min(STARS_PER_STAGE, runStars(state, perks.twoStarAt) + perks.stars);
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

export function villageDetails(p: ProfileDoc): Record<Category, number> {
  const out = {} as Record<Category, number>;
  for (const cat of CATEGORIES) out[cat] = lookFor(categoryStars(p, cat)).detail;
  return out;
}

/** The closest next picture change — a building or a small piece on it. */
export function nextGoal(p: ProfileDoc): { category: Category; need: number; look: BuildingLook; id: MilestoneId } | null {
  let best: { category: Category; need: number; look: BuildingLook; id: MilestoneId } | null = null;
  for (const cat of VILLAGE_ORDER) {
    const stars = categoryStars(p, cat);
    const next = nextMilestone(stars);
    if (next == null) continue;
    const need = next.stars - stars;
    if (!best || need < best.need) best = { category: cat, need, look: { level: next.level, detail: next.detail }, id: next.id };
  }
  return best;
}
