import type { ThemeId } from "../game/config";

export type Plan = "free" | "plus";

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
