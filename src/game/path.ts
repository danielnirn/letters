import type { ProfileDoc } from "../types/models";
import { CATEGORIES, clearedStages, type Difficulty } from "./config";
import { categoryStars } from "./village";

const DIFFICULTIES: Difficulty[] = ["easy", "mid", "hard"];

/** First picture in a subject: the tent. */
const FIRST_PIECE_STARS = 3;

export type GuideId = "learn" | "reward" | "build";
export type GuideState = "done" | "now" | "next";

export type GuideStep = { id: GuideId; n: number; state: GuideState };

function playedOnce(p: ProfileDoc): boolean {
  return CATEGORIES.some((cat) => DIFFICULTIES.some((d) => clearedStages(p.stageClears, cat, d) > 0));
}

function builtOnce(p: ProfileDoc): boolean {
  return CATEGORIES.some((cat) => categoryStars(p, cat) >= FIRST_PIECE_STARS);
}

/** Ordered path: learn, then stars and coins, then the village. */
export function guideSteps(p: ProfileDoc): GuideStep[] {
  const played = playedOnce(p);
  const done = [played, played, builtOnce(p)];
  const ids: GuideId[] = ["learn", "reward", "build"];
  let opened = false;
  return ids.map((id, i) => {
    let state: GuideState;
    if (done[i] && done.slice(0, i).every(Boolean)) state = "done";
    else if (!opened) {
      state = "now";
      opened = true;
    } else state = "next";
    return { id, n: i + 1, state };
  });
}
