import { describe, expect, it } from "@jest/globals";
import { defaultProfileForTest } from "./profile";
import {
  ECONOMY,
  applyBuild,
  applyDailyGift,
  applyEntry,
  applyStageWin,
  coinsFor,
  needsNameSetup,
  nextElement,
  sceneLevels,
  starsFor,
} from "../economy";

describe("economy", () => {
  it("charges the entry fee and refuses when coins are short", () => {
    const p = defaultProfileForTest({ coins: 25 });
    expect(applyEntry(p, "mid")?.coins).toBe(5);
    expect(applyEntry(p, "hard")).toBeNull();
  });

  it("pays stars on a win and refunds the entry plus a bonus only when perfect", () => {
    expect(starsFor("easy", false)).toBe(ECONOMY.starsWin.easy);
    expect(starsFor("hard", true)).toBe(ECONOMY.starsPerfect.hard);
    expect(coinsFor("mid", false)).toBe(0);
    expect(coinsFor("mid", true)).toBe(ECONOMY.entryCost.mid + ECONOMY.perfectBonusCoins);

    const win = applyStageWin(defaultProfileForTest({ coins: 0, stars: 1 }), "easy", true);
    expect(win.profile.stars).toBe(1 + ECONOMY.starsPerfect.easy);
    expect(win.profile.coins).toBe(ECONOMY.entryCost.easy + ECONOMY.perfectBonusCoins);
  });

  it("builds elements with stars and refuses when stars are short", () => {
    const cost = ECONOMY.scenes[0].elementCosts[0];
    expect(applyBuild(defaultProfileForTest({ stars: cost - 1 }))).toBeNull();
    const result = applyBuild(defaultProfileForTest({ stars: cost }));
    expect(result?.profile.stars).toBe(0);
    expect(result?.profile.sceneBuilt).toBe(1);
    expect(result?.milestoneCoins).toBe(0);
  });

  it("pays the milestone once", () => {
    const scene = ECONOMY.scenes[0];
    const p = defaultProfileForTest({ coins: 0, stars: 999, sceneBuilt: scene.milestoneAfter - 1 });
    const hit = applyBuild(p)!;
    expect(hit.milestoneCoins).toBe(scene.milestoneCoins);
    expect(hit.profile.coins).toBe(scene.milestoneCoins);
    expect(applyBuild(hit.profile)!.milestoneCoins).toBe(0);
  });

  it("pays the grand prize and starts the next scene", () => {
    const scene = ECONOMY.scenes[0];
    const last = scene.elementCosts.length - 1;
    const p = defaultProfileForTest({ coins: 0, stars: 999, sceneBuilt: last, milestonePaid: true });
    const done = applyBuild(p)!;
    expect(done.grandPrizeCoins).toBe(scene.grandPrizeCoins);
    expect(done.profile.coins).toBe(scene.grandPrizeCoins);
    expect(done.profile.sceneIndex).toBe(1);
    expect(done.profile.sceneBuilt).toBe(0);
    expect(done.profile.milestonePaid).toBe(false);
    expect(nextElement(done.profile).cost).toBe(ECONOMY.scenes[1].elementCosts[0]);
  });

  it("raises one building per element in the picture", () => {
    const levels = sceneLevels(defaultProfileForTest({ sceneIndex: 1, sceneBuilt: 2 }));
    expect(levels.reading).toBe(2);
    expect(levels.science).toBe(2);
    expect(levels.math).toBe(1);
  });

  it("pays the daily gift once per day", () => {
    const p = defaultProfileForTest({ coins: 0, lastDailyGift: "2026-01-01" });
    const gifted = applyDailyGift(p, "2026-01-02")!;
    expect(gifted.coins).toBe(ECONOMY.dailyGiftCoins);
    expect(applyDailyGift(gifted, "2026-01-02")).toBeNull();
  });
});

describe("needsNameSetup", () => {
  it("asks for name and gender only after the first scene", () => {
    const fresh = defaultProfileForTest({ nameChosen: false, gender: null });
    expect(needsNameSetup(fresh)).toBe(false);
    expect(needsNameSetup({ ...fresh, sceneIndex: 1 })).toBe(true);
    expect(needsNameSetup({ ...fresh, sceneIndex: 1, nameChosen: true, gender: "girl" })).toBe(false);
  });
});
