import type { ProfileDoc } from "../types/models";
import type { Category, Difficulty } from "./config";

/**
 * Core loop: coins pay to enter a level, a win pays stars, stars build scene
 * elements, and the end of each scene pays a big coin prize. See PRD.md.
 */
export type SceneConfig = {
  /** Star price of each element, built in order. */
  elementCosts: number[];
  /** The milestone pays after this many elements. */
  milestoneAfter: number;
  milestoneCoins: number;
  grandPrizeCoins: number;
};

export const ECONOMY = {
  startingPack: { coins: 100, stars: 0 },
  entryCost: { easy: 10, mid: 20, hard: 30 } as Record<Difficulty, number>,
  starsWin: { easy: 1, mid: 2, hard: 3 } as Record<Difficulty, number>,
  starsPerfect: { easy: 2, mid: 4, hard: 6 } as Record<Difficulty, number>,
  perfectRefund: true,
  perfectBonusCoins: 5,
  dailyGiftCoins: 20,
  /** Scenes after the last one repeat it. */
  scenes: [
    { elementCosts: [3, 5, 7, 9, 11, 15], milestoneAfter: 3, milestoneCoins: 30, grandPrizeCoins: 150 },
    { elementCosts: [5, 7, 9, 11, 13, 15], milestoneAfter: 3, milestoneCoins: 30, grandPrizeCoins: 200 },
    { elementCosts: [6, 8, 10, 12, 14, 20], milestoneAfter: 3, milestoneCoins: 30, grandPrizeCoins: 250 },
    { elementCosts: [8, 10, 12, 14, 16, 20], milestoneAfter: 3, milestoneCoins: 30, grandPrizeCoins: 300 },
  ] as SceneConfig[],
} as const;

/** Each scene element is one subject's building. Scene n raises every building to level n + 1. */
export const SCENE_ORDER: Category[] = ["reading", "science", "math", "language", "logic", "english"];
export const MAX_BUILDING_LEVEL = 4;

export function entryCost(difficulty: Difficulty): number {
  return ECONOMY.entryCost[difficulty];
}

export function canAfford(p: ProfileDoc, difficulty: Difficulty): boolean {
  return p.coins >= entryCost(difficulty);
}

export function starsFor(difficulty: Difficulty, perfect: boolean): number {
  return perfect ? ECONOMY.starsPerfect[difficulty] : ECONOMY.starsWin[difficulty];
}

/** Coins paid back at the end of a level. Only a perfect win pays. */
export function coinsFor(difficulty: Difficulty, perfect: boolean): number {
  if (!perfect) return 0;
  return (ECONOMY.perfectRefund ? entryCost(difficulty) : 0) + ECONOMY.perfectBonusCoins;
}

export function sceneConfig(index: number): SceneConfig {
  const scenes = ECONOMY.scenes;
  return scenes[Math.min(Math.max(0, index), scenes.length - 1)];
}

export type SceneElement = { index: number; category: Category; level: number; cost: number };

/** The next element to build in the current scene. */
export function nextElement(p: ProfileDoc): SceneElement {
  const scene = sceneConfig(p.sceneIndex);
  const index = Math.min(p.sceneBuilt, scene.elementCosts.length - 1);
  return {
    index,
    category: SCENE_ORDER[index % SCENE_ORDER.length],
    level: Math.min(MAX_BUILDING_LEVEL, p.sceneIndex + 1),
    cost: scene.elementCosts[index],
  };
}

export type SceneProgress = {
  built: number;
  total: number;
  milestoneAfter: number;
  milestonePaid: boolean;
  grandPrizeCoins: number;
};

export function sceneProgress(p: ProfileDoc): SceneProgress {
  const scene = sceneConfig(p.sceneIndex);
  return {
    built: p.sceneBuilt,
    total: scene.elementCosts.length,
    milestoneAfter: scene.milestoneAfter,
    milestonePaid: p.milestonePaid,
    grandPrizeCoins: scene.grandPrizeCoins,
  };
}

/** Building level of each subject in the picture: past scenes plus what is built in this one. */
export function sceneLevels(p: ProfileDoc): Record<Category, number> {
  const out = {} as Record<Category, number>;
  SCENE_ORDER.forEach((cat, i) => {
    const level = p.sceneIndex + (i < p.sceneBuilt ? 1 : 0);
    out[cat] = Math.min(MAX_BUILDING_LEVEL, level);
  });
  return out;
}

export type StageResult = { profile: ProfileDoc; stars: number; coins: number };

/** Pay the rewards for a finished level. */
export function applyStageWin(p: ProfileDoc, difficulty: Difficulty, perfect: boolean): StageResult {
  const stars = starsFor(difficulty, perfect);
  const coins = coinsFor(difficulty, perfect);
  return { profile: { ...p, stars: p.stars + stars, coins: p.coins + coins }, stars, coins };
}

/** Take the entry fee. `null` when the player cannot pay. */
export function applyEntry(p: ProfileDoc, difficulty: Difficulty): ProfileDoc | null {
  const cost = entryCost(difficulty);
  if (p.coins < cost) return null;
  return { ...p, coins: p.coins - cost };
}

export type BuildResult = {
  profile: ProfileDoc;
  element: SceneElement;
  /** Milestone coins paid by this build, or 0. */
  milestoneCoins: number;
  /** Grand prize coins paid by this build, or 0. */
  grandPrizeCoins: number;
};

/** Build the next element with stars. `null` when the player cannot pay. */
export function applyBuild(p: ProfileDoc): BuildResult | null {
  const element = nextElement(p);
  if (p.stars < element.cost) return null;
  const scene = sceneConfig(p.sceneIndex);
  const built = p.sceneBuilt + 1;
  let next: ProfileDoc = { ...p, stars: p.stars - element.cost, sceneBuilt: built };
  let milestoneCoins = 0;
  let grandPrizeCoins = 0;
  if (!p.milestonePaid && built >= scene.milestoneAfter) {
    milestoneCoins = scene.milestoneCoins;
    next = { ...next, coins: next.coins + milestoneCoins, milestonePaid: true };
  }
  if (built >= scene.elementCosts.length) {
    grandPrizeCoins = scene.grandPrizeCoins;
    next = {
      ...next,
      coins: next.coins + grandPrizeCoins,
      sceneIndex: p.sceneIndex + 1,
      sceneBuilt: 0,
      milestonePaid: false,
    };
  }
  return { profile: next, element, milestoneCoins, grandPrizeCoins };
}

export function todayKey(now = new Date()): string {
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${m}-${d}`;
}

/** Pay the daily gift once per calendar day. `null` when it was already paid today. */
export function applyDailyGift(p: ProfileDoc, day = todayKey()): ProfileDoc | null {
  if (p.lastDailyGift === day) return null;
  return { ...p, coins: p.coins + ECONOMY.dailyGiftCoins, lastDailyGift: day };
}

/** Name and gender are asked once the first scene's progress bar is complete. */
export function needsNameSetup(p: ProfileDoc): boolean {
  return p.sceneIndex >= 1 && (!p.nameChosen || !p.gender);
}
