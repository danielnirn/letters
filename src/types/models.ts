import type { ThemeId } from "../game/config";

export type Plan = "free" | "plus";

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
  coins: number;
  purchases: string[];
  inventory: Record<string, number>;
  theme: ThemeId | null;
  avatar: AvatarLoadout;
  /** Highest mini-level cleared per `${category}:${difficulty}`. */
  stageClears: Record<string, number>;
  /** Best coins earned per `${category}:${difficulty}:${stage}`. */
  stageCoins: Record<string, number>;
  /** Perfect clears per `${category}:${difficulty}:${stage}`. */
  stagePerfect: Record<string, boolean>;
  updatedAt: number;
};

export type ScoreEntry = {
  id: string;
  name: string;
  score: number;
  level: string;
  ts: number;
};

export type CachedProgress = {
  user: UserDoc;
  profiles: ProfileDoc[];
  scores: ScoreEntry[];
};
