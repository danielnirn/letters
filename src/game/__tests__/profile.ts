import type { ProfileDoc } from "../../types/models";

export function defaultProfileForTest(patch: Partial<ProfileDoc> = {}): ProfileDoc {
  return {
    id: "p",
    displayName: "",
    nameChosen: true,
    gender: null,
    coins: 100,
    stars: 0,
    sceneIndex: 0,
    sceneBuilt: 0,
    milestonePaid: false,
    lastDailyGift: null,
    avatar: { base: "avatar_base_kid", hat: null, top: null, bottom: null, shoes: null, extra: null },
    stageClears: {},
    stageCoins: {},
    stagePerfect: {},
    stageStars: {},
    updatedAt: 0,
    ...patch,
  };
}
