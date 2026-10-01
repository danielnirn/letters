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
- Fonts: `@expo-google-fonts/heebo`
- Entry: `expo-router/entry`, screens in `app/`

## Layout

```
app/                 Expo Router screens
  _layout.tsx        fonts, Auth+Progress providers, Gate
  index.tsx          category → difficulty → 10 mini-levels
  game.tsx           play + stage complete + mistake report
  login.tsx, name.tsx, shop.tsx, inventory.tsx, profile.tsx, leaderboard.tsx
src/game/            engine + banks
  config.ts          CONFIG, Category, Difficulty, stage helpers
  session.ts         GameState, startGame, answers, mistakes, coins
  words.ts, english.ts, math.ts, logic.ts, science.ts, shop.ts, avatar.ts
src/context/         AuthContext, ProgressContext
src/firebase/        app, repository, googleNative
src/i18n/he.ts       ALL user-visible strings
src/components/      Screen, PrimaryButton, MathErrorCard, Toast, …
src/types/models.ts  ProfileDoc, AvatarLoadout, scores
firestore.rules
```

Legacy static site: `index.html`, `js/`, `css/` — do not treat as source of truth for new features.

## Game rules (implement here, not only in GAME.md)

- Categories: `language | math | english | logic | science`
- Difficulties: `easy | mid | hard`
- After category + difficulty: **10 mini-levels**. Unlock sequential (`stageClears`).
- Questions per stage: odd stages **6**, even **7** (`questionsInStage`).
- No lives/hearts. Wrong answer → mark bad (red dot) → short feedback → **next question** (no retry on that item). Skip also marks bad.
- Coins **only at stage complete**, not per question:
  - Perfect (every mark `ok`): `questions * CONFIG.coinsCorrect` (10)
  - Any miss/skip: **half** (floor)
- Mini-level list: green = perfect (`הכל נכון`), yellow = partial (`יש טעויות` + `נסו שוב`). No coin amounts on that list.
- Question screen: no 🔥 / 🪙 / score in the header. Show them on **stage complete** only.
- Math: show `{expr} = ?`, never the “כמה זה?” prompt. Non-spelling cats are always 4-choice.
- Hebrew tiles/blanks: `flexDirection: "row-reverse"`. English spelling: `"row"`.
- Mistake report title/button: `🤔 איפה טעיתי?`. Tap a row to expand the same explanation as in-play (`MathErrorCard` for math).
- Perfect complete may auto-return to stage picker; with mistakes stay so the player can open the report.

## Persistence (logged-in only)

`ProfileDoc` on `users/{uid}/profiles/{id}`:

- `coins`, `purchases`, `inventory`, `theme`, `avatar`
- `stageClears`: `{ "math:easy": 3 }` highest cleared stage
- `stageCoins`: `{ "math:easy:2": 30 }` best coins for that stage
- `stagePerfect`: `{ "math:easy:2": true }` ever-perfect flag

`completeStage(category, difficulty, stage, coins, perfect)` in `ProgressContext` writes these + adds coins. Guests: `isLocal` → `persist` skips Firestore.

## Web / RN pitfalls (do not regress)

- **Never** put CSS `direction` in `StyleSheet.create` (RN-web throws `Invalid style property of "direction"`). Use `row-reverse` / `textAlign` instead. Avoid `writingDirection` on web.
- **Always import** `{ Screen }` from `src/components/Screen`. On web, an undeclared `<Screen>` binds to the browser `Screen` API → `Illegal constructor`.
- Prefer no `Animated` + `useNativeDriver: true` on web (Illegal constructor). MathErrorCard uses opacity rAF fade, not Animated.
- `Screen` on web is a plain `View` background, not `LinearGradient` (gradient CSS Typed OM issues historically).
- Do not name a React component `Screen` without importing the local one.

## Conventions

- User-facing copy: add/change in `src/i18n/he.ts` only.
- Game math/flow: `src/game/session.ts` + `config.ts`.
- New words: the matching bank file; math/logic can generate.
- Do not use `gap` if you hit RN-web style errors; use `margin` (home still has some `gap`).
- Do not commit `.env`.
- Match existing style; no drive-by refactors or extra docs unless asked.

## Run

```bash
npx expo start
```

Web: `http://localhost:8081`. LAN: `http://<mac-lan-ip>:8081` (Safari on same Wi‑Fi). iOS Expo Go requires the **same Expo account** as the CLI for local Metro — siblings should use the LAN web URL.
