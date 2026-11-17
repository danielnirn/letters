# PRD — Core Loop & Economy

**Product:** אותיות וגמדות (Hebrew learning game for kids)
**Status:** Draft for review
**Date:** 2026-11-14

---

## 1. Goal

Replace the current economy (village levels, shop, feature unlocks, per-subject buildings) with one simple core loop that kids understand at a glance: **play → earn stars → build → win coins → play more.**

## 2. Core loop

```
 🪙 Coins ──pay──▶ Play a level ──win──▶ ⭐ Stars ──pay──▶ Build an element
    ▲                                                          │
    │                                                          ▼
    └──────── Grand prize (big coin reward) ◀── Progress bar fills
```

1. **Enter a level** — pay coins.
2. **Win the level** — earn stars.
3. **Build** — spend stars on elements in the current scene. Each element moves the progress bar forward.
4. **Grand prize** — the end of the bar pays a large coin reward, then the next scene opens.

## 3. Currencies

| Currency | Earned from | Spent on |
| --- | --- | --- |
| 🪙 Coins | Starting pack, perfect wins, daily gift, milestone, grand prize | Entering levels |
| ⭐ Stars | Winning levels | Building scene elements |

A **win** is finishing the level. A level finished with mistakes or skips is still a win, with fewer stars. A **perfect** win has no mistakes and no skips.

## 4. Coin sources

| Source | When | Purpose |
| --- | --- | --- |
| Starting pack | Once, when a new profile is created | Lets a new player start right away |
| Perfect win | Every perfect level | Refunds the entry plus a small bonus, so skill keeps you playing |
| Daily gift | First app open each calendar day | Brings players back; guarantees at least one easy level |
| Midway milestone | Once per scene, partway along the bar | A reward before the grand prize |
| Grand prize | End of each scene | Restocks coins for the next scene |

There is no free play. A player with too few coins for any level waits for the daily gift.

## 5. Scenes & progress bar

- A scene has 6 elements: one building per subject. Scene 1 builds tents, scene 2 huts, scene 3 houses, scene 4 fancy houses.
- Elements are built in order. Each costs more stars than the previous one.
- The progress bar is always visible on the main screen and shows: elements built / total, the milestone marker, and the grand prize at the end.
- After the grand prize, the next scene starts with an empty bar.

## 6. Economy configuration

All values live in one config object, `ECONOMY` in `src/game/economy.ts`, so they can be tuned in one place.

| Key | Default | Description |
| --- | --- | --- |
| `startingPack.coins` | `100` | Coins given to a new profile |
| `startingPack.stars` | `0` | Stars given to a new profile |
| `entryCost.easy` | `10` | Coins to enter an easy level |
| `entryCost.mid` | `20` | Coins to enter a mid level |
| `entryCost.hard` | `30` | Coins to enter a hard level |
| `starsWin.easy` / `mid` / `hard` | `1` / `2` / `3` | Stars for a win with mistakes or skips |
| `starsPerfect.easy` / `mid` / `hard` | `2` / `4` / `6` | Stars for a perfect win |
| `perfectRefund` | `true` | A perfect win refunds the entry cost |
| `perfectBonusCoins` | `5` | Extra coins on a perfect win, on top of the refund |
| `dailyGiftCoins` | `20` | Daily gift (must be ≥ `entryCost.easy`) |
| `scenes[n].elementCosts` | scene 1: `[3, 5, 7, 9, 11, 15]` (50 ⭐) … scene 4: `[8, 10, 12, 14, 16, 20]` (80 ⭐) | Star cost of each element. Scenes after the last repeat it |
| `scenes[n].milestoneAfter` | `3` | Milestone pays after this many elements |
| `scenes[n].milestoneCoins` | `30` | Milestone coin reward |
| `scenes[n].grandPrizeCoins` | `150` / `200` / `250` / `300` | Grand prize per scene |

```ts
export const ECONOMY = {
  startingPack: { coins: 100, stars: 0 },
  entryCost: { easy: 10, mid: 20, hard: 30 },
  starsWin: { easy: 1, mid: 2, hard: 3 },
  starsPerfect: { easy: 2, mid: 4, hard: 6 },
  perfectRefund: true,
  perfectBonusCoins: 5,
  dailyGiftCoins: 20,
  scenes: [
    { elementCosts: [3, 5, 7, 9, 11, 15], milestoneAfter: 3, milestoneCoins: 30, grandPrizeCoins: 150 },
    { elementCosts: [5, 7, 9, 11, 13, 15], milestoneAfter: 3, milestoneCoins: 30, grandPrizeCoins: 200 },
    { elementCosts: [6, 8, 10, 12, 14, 20], milestoneAfter: 3, milestoneCoins: 30, grandPrizeCoins: 250 },
    { elementCosts: [8, 10, 12, 14, 16, 20], milestoneAfter: 3, milestoneCoins: 30, grandPrizeCoins: 300 },
  ],
};
```

## 7. Balance check — scene 1, easy, half the wins perfect

| Item | Value |
| --- | --- |
| Avg stars per level | 1.5 ⭐ |
| Levels to build 50 ⭐ | ~33 |
| Coins spent on entries | 33 × 10 = 330 🪙 |
| Coins back from perfect wins | ~16 × 15 = 240 🪙 |
| Milestone | +30 🪙 |
| **Net** | **−60 🪙** (out of 100 starting coins, before daily gifts) |
| Grand prize | +150 🪙 for scene 2 |

A player never runs out in scene 1 without daily gifts, and enters scene 2 with ~190 🪙.

## 8. Removed

Not part of the core loop, so removed:

- Village levels and feature unlocks at levels 5 / 10
- Shop and avatar items bought with coins
- Per-subject building bonuses (`BUILDING_COIN_BONUS`, `UPGRADE_COST`)
- Lesson pack choice every 5 levels — all subjects are open from the start
- Coins paid at level complete (replaced by stars)

## 9. Kept as-is

- Subjects, difficulties, 10 stages per subject+difficulty, sequential unlock
- 6 / 7 questions per stage, no lives, skip counts as a mistake
- Mistake report (**🤔 איפה טעיתי?**)
- Login, child profiles, guest mode (memory only)

## 10. Data (logged-in profiles)

`users/{uid}/profiles/{id}` gets:

| Field | Type | Notes |
| --- | --- | --- |
| `coins` | number | Existing field |
| `stars` | number | New |
| `sceneIndex` | number | Current scene, starts at 0 |
| `sceneBuilt` | number | Elements built in the current scene |
| `milestonePaid` | boolean | Milestone paid for the current scene |
| `lastDailyGift` | string | `YYYY-MM-DD` of the last gift |

Removed: `purchases`, `inventory`, `stageCoins`, village level fields.

## 11. Decisions

- Existing profiles keep their coins; they start at scene 1 with 0 stars.
- The leaderboard and avatar tabs are open from the start. The avatar is the fixed mascot.
- New profiles get the starting pack; the daily gift starts the next day.
