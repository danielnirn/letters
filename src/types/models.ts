import type { Category } from "../game/config";

export type Plan = "free" | "plus";

export type Gender = "girl" | "boy";

export type AvatarSlot = "base" | "hat" | "top" | "bottom" | "shoes" | "extra";

/** Equipped Tamagotchi/avatar layers. `null` = nothing in that slot. */
export type AvatarLoadout = {
  base: string;
  hat: string | null;
  top: string | null;
  bottom: string | null;
  shoes: string | null;
  extra: string | null;
};

export type UserDoc = {
  email: string | null;
  createdAt: number;
  plan: Plan;
  activeProfileId: string;
};

export type ProfileDoc = {
  id: string;
  displayName: string;
  nameChosen: boolean;
  /** Which mascot the child plays as. `null` until chosen. */
  gender: Gender | null;
  coins: number;
  purchases: string[];
  inventory: Record<string, number>;
  avatar: AvatarLoadout;
  /** Highest mini-level cleared per `${category}:${difficulty}`. */
  stageClears: Record<string, number>;
  /** Best coins earned per `${category}:${difficulty}:${stage}`. */
  stageCoins: Record<string, number>;
  /** Perfect clears per `${category}:${difficulty}:${stage}`. */
  stagePerfect: Record<string, boolean>;
  /** Best stars (1–3) per `${category}:${difficulty}:${stage}` — they build the village. */
  stageStars: Record<string, number>;
  /** Flowers planted by finishing the daily building wish. */
  villageBlooms: number;
  /** `YYYY-MM-DD` of the last fulfilled wish. */
  wishDay: string | null;
  wishDone: boolean;
  updatedAt: number;
};

export type ScoreEntry = {
  id: string;
  name: string;
  score: number;
  level: string;
  ts: number;
  /** Dressed character at the time of the score. Missing on older rows. */
  avatar?: AvatarLoadout;
  gender?: Gender | null;
  /** Building level (0–4) per subject. Missing on older rows. */
  village?: Partial<Record<Category, number>>;
  /** Total village stars. */
  stars?: number;
};

/** What other players see on the leaderboard. */
export type LeaderboardLook = {
  name: string;
  avatar: AvatarLoadout;
  gender: Gender | null;
  village: Record<Category, number>;
  stars: number;
};

export type CachedProgress = {
  user: UserDoc;
  profiles: ProfileDoc[];
  scores: ScoreEntry[];
};
