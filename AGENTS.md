# AGENTS.md — אותיות וגמדות

Context file for **other LLMs / coding agents** working in this repo. Player-facing overview: `GAME.md`. Setup: `README.md`.

## Product

Hebrew kids learning game (ליבי ואגם). Expo Router app + Firebase Auth/Firestore. Parent logs in; child is a **profile**, not a separate auth user. Guest mode (`שחק במכשיר זה בלבד`) is memory-only — do not persist guest progress.

UI language is **Hebrew**. Spelling Hebrew is **RTL**; English spelling is **LTR**; math expressions are `3 + 4 = ?`.

Owner: Daniel (software engineer). Prefer small, direct code changes. Do not commit unless asked. Do not push unless asked.

## Stack

- Expo SDK ~57, Expo Router, React Native + `react-native-web`
- TypeScript
- Firebase Auth (Google + Apple) + Firestore
- Fonts: **Rubik** (`@expo-google-fonts/rubik`) — `font` in `src/theme/colors.ts` (not Heebo)
- SVG: `react-native-svg` (mascot, icons, coins, stars, subject tiles)
- Entry: `expo-router/entry`, screens in `app/`
- `userInterfaceStyle`: **light** (`app.json`)

## Layout

```
app/
  _layout.tsx        Rubik, Auth+Progress, Gate, light ground
  index.tsx          hero + category grid + dock → difficulty → 10 stages
  game.tsx           play + complete + mistake report
  login / name / shop / inventory / profile / leaderboard
src/theme/colors.ts  ThemeColors, CATEGORY_COLORS, DIFFICULTY_COLORS, OK/BAD/GOLD, font
src/components/ui.tsx     Card, CoinPill, RoundButton, TopBar, ProgressBar, ScreenTitle, useColors
src/components/Art.tsx    Mascot (גמדה), Coin, Star, Icon, CategoryTile, DifficultyTile
src/components/Screen.tsx light c.ground + SafeArea + ScrollView
src/components/PrimaryButton.tsx  toy button solid|soft + lip squash
src/game/            engine + word banks
src/i18n/he.ts       ALL user-visible strings
```

Legacy static site: `index.html`, `js/`, `css/` — not the source of truth.

## UI system (current — do not revert to dark/Heebo)

Toy-box look: **light ground**, **white cards**, **chunky 3D lip** (`borderBottomWidth` 4–6 + darker lip). Pressed = thinner lip + extra `marginTop` (squish).

Tokens (`src/theme/colors.ts`):

- Theme: `ground`, `surface`, `ink`, `soft`, `line`, `primary`, `primaryLip`, `primaryTint`, `heroBlob`, `toast`
- Shop themes (`theme_space` / `jungle` / `unicorn`) retint the whole app
- Fixed: `CATEGORY_COLORS`, `DIFFICULTY_COLORS`, `OK` green, `BAD` coral, `GOLD` amber
- Type: `font.regular | medium | bold | heavy | black` → Rubik

Building blocks:

- `useColors()` — always theme-aware
- `Card`, `CoinPill` (SVG coin, not 🪙), `TopBar` (RTL: back on the **right**, `row-reverse`), `RoundButton`, `ProgressBar` (fill from the right)
- `PrimaryButton` `variant="solid" | "soft"` + optional `icon`
- `Mascot` = gnome girl; shirt color `body` (default / theme primary). Default avatar `avatar_base_kid` **is** this mascot
- `Icon` names: `bag`, `backpack`, `trophy`, `user`, `back`, `skip`, `lock`, `check`, `x`, `replay`, `logout`, …
- New chrome copy is often **plain Hebrew**; icons carry the meaning (`navShop`, `backLabel`, …)
- No GhostButton — use TopBar / RoundButton / `variant="soft"`

Screens:

- **Login**: mascot in a primary circle + stars; own SafeArea (not `Screen`)
- **Home**: hello (avatar + name + CoinPill) → colored **hero** + mascot → 2×2 subjects + science wide → **dock** (shop, gear, leaderboard, profile)
- **Difficulty / stages**: TopBar + category chip + CoinPill; stages green = `הכל נכון`, yellow = `יש טעויות` + retry
- **Play**: no coins/streak in the header; math `{expr} = ?`; skip icon; progress under answers
- **Complete**: mascot + result dots + `Coin +N` + streak; **🤔 איפה טעיתי?** report; tap row → `MathErrorCard` (math)

Do **not** restore dark navy, Heebo, LinearGradient shells, or emoji-only nav as the main chrome.

## Game rules

- Categories: `language | math | english | logic | science`
- Difficulties: `easy | mid | hard`
- **10 mini-levels** per category+difficulty; unlock sequential (`stageClears`)
- Odd stages **6** questions, even **7**
- No lives. Wrong → red mark → short feedback → next question. Skip = bad
- Coins **only at stage complete**: perfect = `n * 10`; any miss/skip = half
- Question screen: no 🔥 / coins / running score in the chrome
- Hebrew tiles: `row-reverse`; English spelling: `row`
- Perfect complete may auto-return; with mistakes stay for the report

## Persistence (logged-in only)

`users/{uid}/profiles/{id}`: `coins`, `purchases`, `inventory`, `theme`, `avatar`, `stageClears`, `stageCoins`, `stagePerfect`.

`completeStage(category, difficulty, stage, coins, perfect)` adds coins and updates maps. Guests (`isLocal`) skip Firestore.

## Web / RN pitfalls (do not regress)

- Never CSS `direction` in StyleSheet. Use `row-reverse` / `textAlign`. Avoid `writingDirection` on web.
- Always `import { Screen } from "../src/components/Screen"`. Bare `<Screen>` on web = browser API → `Illegal constructor`.
- No `Animated` + `useNativeDriver: true` on web. MathErrorCard uses rAF fade.
- Screen is solid `c.ground`, not LinearGradient.
- UI uses `gap` in places; if RN-web rejects a style, that instance → `margin`.

## Conventions

- Copy only in `src/i18n/he.ts`. Prefer toy-box keys for new UI (`appName`, `navShop`, `wrongTitle`, `tabEnhance`, …).
- New UI: compose `ui.tsx` + `Art.tsx` + `colors.ts`. Do not invent a second palette.
- Engine: `session.ts` + `config.ts`. Banks: `words.ts` / `english.ts` / `math.ts` / `logic.ts` / `science.ts`.
- Do not commit `.env`. Do not commit unless asked.

## Run

```bash
npx expo start
```

Web: `http://localhost:8081`. LAN Safari: `http://<mac-lan-ip>:8081`. iOS Expo Go needs the **same Expo account** as the CLI for local Metro.
