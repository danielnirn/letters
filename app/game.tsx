import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Screen } from "../src/components/Screen";
import { GhostButton, LeaderboardTable } from "../src/components/LeaderboardTable";
import { PrimaryButton } from "../src/components/PrimaryButton";
import { useToast } from "../src/components/Toast";
import { useProgress } from "../src/context/ProgressContext";
import { CONFIG, parseCategory, type Category, type Difficulty } from "../src/game/config";
import {
  afterTimeout,
  answerChoice,
  clearShake,
  deleteLast,
  enableDoubleCoins,
  extraHints,
  nextWord,
  placeTile,
  revive,
  skipWord,
  startGame,
  tickBonus,
  useHint,
  type GameState,
} from "../src/game/session";
import { SHOP_ITEMS } from "../src/game/shop";
import { he } from "../src/i18n/he";
import { colorsFor } from "../src/theme/colors";

const LEVEL_LABEL: Record<Difficulty, string> = {
  easy: `🌱 ${he.easy}`,
  mid: `⭐ ${he.mid}`,
  hard: `🔥 ${he.hard}`,
};

export default function GameScreen() {
  const { level, category } = useLocalSearchParams<{ level: Difficulty; category: Category }>();
  const cat = parseCategory(category);
  const router = useRouter();
  const progress = useProgress();
  const addCoinsRef = useRef(progress.addCoins);
  const saveScoreRef = useRef(progress.saveScore);
  addCoinsRef.current = progress.addCoins;
  saveScoreRef.current = progress.saveScore;
  const { show, node } = useToast();
  const c = colorsFor(progress.active.theme);
  const [state, setState] = useState<GameState>(() => startGame(level || "easy", cat));
  const rewarded = useRef<string | null>(null);

  useEffect(() => {
    if (!state.isBonus || state.phase !== "playing") return;
    const id = setInterval(() => setState((s) => tickBonus(s)), 1000);
    return () => clearInterval(id);
  }, [state.isBonus, state.phase, state.wordIndex]);

  useEffect(() => {
    if (state.phase !== "timeout") return;
    const t = setTimeout(() => setState((s) => afterTimeout(s)), 1500);
    return () => clearTimeout(t);
  }, [state.phase]);

  useEffect(() => {
    if (!state.shaking) return;
    const t = setTimeout(() => setState((s) => clearShake(s)), 650);
    return () => clearTimeout(t);
  }, [state.shaking]);

  useEffect(() => {
    if (state.phase !== "win") return;
    const key = `${state.wordIndex}-${state.wordsCompleted}`;
    if (rewarded.current === key) return;
    rewarded.current = key;
    void (async () => {
      await addCoinsRef.current(state.lastReward);
      if (state.lastStreakBonus) await addCoinsRef.current(state.lastStreakBonus);
      await saveScoreRef.current(state.score, `${state.category}:${state.level}`);
    })();
  }, [state.phase, state.wordIndex, state.wordsCompleted, state.lastReward, state.lastStreakBonus, state.score, state.level]);

  const hearts = Array.from({ length: CONFIG.lives }, (_, i) => (i < state.lives ? "❤️" : "🖤")).join("");

  const useTool = async (itemId: string) => {
    const item = SHOP_ITEMS.find((it) => it.id === itemId);
    if (!item) return;
    if (item.effect === "double_coins" && state.doubleCoins) {
      show(he.doubleAlready);
      return;
    }
    const ok = await progress.useInventory(itemId);
    if (!ok) return;
    if (item.effect === "extra_hints") {
      setState((s) => extraHints(s));
      show(he.extraHintsToast(CONFIG.hintsPerWord));
    } else if (item.effect === "skip_word") {
      show(he.skipped);
      setState((s) => skipWord(s));
    } else if (item.effect === "double_coins") {
      setState((s) => enableDoubleCoins(s));
      show(he.doubleOn);
    }
  };

  const buyLife = async () => {
    const ok = await progress.spendCoins(CONFIG.lifeCost);
    if (!ok) {
      show(he.notEnoughCoins(CONFIG.lifeCost));
      return;
    }
    setState((s) => revive(s));
  };

  if (state.phase === "timeout") {
    return (
      <Screen>
        <Text style={styles.timeout}>{he.timeout}</Text>
      </Screen>
    );
  }

  if (state.phase === "win") {
    const parts = [];
    if (state.lastReward && (state.doubleCoins || state.lastReward === CONFIG.coinsBonus * (state.doubleCoins ? 2 : 1))) {
      if (state.lastReward >= CONFIG.coinsBonus) parts.push(he.bonusTag);
      if (state.doubleCoins) parts.push(he.doubleCoinsTag);
    }
    return (
      <Screen>
        {node}
        <Text style={styles.bigEmoji}>{winEmoji(state)}</Text>
        <Text style={[styles.winTitle, { color: c.score }]}>{he.wellDone}</Text>
        <Text
          style={[styles.winWord, usesLtr(state) && styles.ltr]}
        >
          {answerLine(state)}
        </Text>
        {state.currentHint ? <Text style={styles.hintHe}>{state.currentHint}</Text> : null}
        <Text style={styles.meta}>
          {he.scoreLabel}: {state.score} ⭐
        </Text>
        <Text style={styles.meta}>
          {he.coinsBalance}: {progress.active.coins} 🪙
        </Text>
        {state.lastStreakBonus > 0 ? (
          <Text style={styles.streak}>{he.streakTag(CONFIG.streakEvery, state.lastStreakBonus)}</Text>
        ) : null}
        <PrimaryButton
          label={isQuiz(state.category) ? he.nextQuestion : he.nextWord}
          onPress={() => setState((s) => nextWord(s))}
        />
        <Text style={styles.lbTitle}>{he.leaderboard}</Text>
        <LeaderboardTable
          scores={progress.topScores}
          highlightName={progress.active.displayName}
          highlightScore={state.score}
        />
        <GhostButton label={he.backHome} onPress={() => router.replace("/")} />
      </Screen>
    );
  }

  if (state.phase === "gameover") {
    const canBuy = progress.active.coins >= CONFIG.lifeCost;
    return (
      <Screen>
        {node}
        <Text style={styles.bigEmoji}>💔</Text>
        <Text style={styles.winTitle}>{he.gameOverTitle}</Text>
        <Text style={styles.meta}>
          {(isQuiz(state.category) ? he.theAnswerWas : he.theWordWas)}: {answerLine(state)}
        </Text>
        <Text style={styles.meta}>
          ⭐ {state.score}   📝 {state.wordsCompleted}
        </Text>
        <Text style={styles.want}>{he.wantToContinue}</Text>
        <Text style={styles.meta}>{he.buyLifeSub}</Text>
        <Text style={styles.meta}>
          {he.balance}: {progress.active.coins} 🪙
        </Text>
        <PrimaryButton
          label={he.buyLife(CONFIG.lifeCost)}
          onPress={buyLife}
          disabled={!canBuy}
          color="#ff6b6b"
        />
        <GhostButton label={he.backHome} onPress={() => router.replace("/")} />
        <LeaderboardTable scores={progress.topScores} highlightName={progress.active.displayName} />
      </Screen>
    );
  }

  const consumables = SHOP_ITEMS.filter((it) => it.consumable).filter(
    (it) => (progress.active.inventory[it.id] || 0) > 0,
  );
  const pct = (state.bonusTimeLeft / CONFIG.bonusSeconds) * 100;

  return (
    <Screen>
      {node}
      <View style={styles.header}>
        <GhostButton label={he.back} onPress={() => router.replace("/")} />
        <View style={{ alignItems: "center", flex: 1 }}>
          <Text style={[styles.badge, { color: c.accent }]}>
            {categoryTitle(state.category)} · {LEVEL_LABEL[state.level]}
          </Text>
          <Text style={styles.progress}>
            {he.questionProgress(state.wordIndex + 1, state.wordList.length)}
          </Text>
          <Text style={styles.player}>👤 {progress.active.displayName}</Text>
        </View>
        <View>
          <Text style={{ color: c.score, fontFamily: "Heebo_800ExtraBold" }}>⭐ {state.score}</Text>
          <Text style={{ color: c.coin, fontFamily: "Heebo_800ExtraBold" }}>🪙 {progress.active.coins}</Text>
          <Text style={styles.streakLine}>
            🔥 {state.streak}/{CONFIG.streakEvery}
          </Text>
          <Text style={{ fontSize: 16 }}>{hearts}</Text>
        </View>
      </View>

      {state.isBonus ? (
        <View style={styles.bonus}>
          <Text style={styles.bonusTitle}>{he.bonusBanner}</Text>
          <Text style={styles.bonusSub}>{he.bonusSublabel(CONFIG.bonusSeconds)}</Text>
          <Text style={[styles.timer, state.bonusTimeLeft <= 5 && { color: "#ff6b6b" }]}>
            {state.bonusTimeLeft}
          </Text>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${pct}%` }]} />
          </View>
        </View>
      ) : null}

      <Text
        style={
          state.category === "math" || state.category === "logic"
            ? styles.mathPrompt
            : styles.emoji
        }
      >
        {state.currentEmoji}
      </Text>
      {state.currentHint ? <Text style={styles.hintHe}>{state.currentHint}</Text> : null}

      {state.questionType === "choice" ? (
        <View style={{ width: "100%", alignItems: "center" }}>
          <Text style={styles.prompt}>{choicePrompt(state.category)}</Text>
          {state.choiceWords.map((w, i) => (
            <Pressable key={`${w}-${i}`} onPress={() => setState((s) => answerChoice(s, w))} style={styles.choice}>
              <Text
                style={[
                  styles.choiceText,
                  usesLtr(state) && styles.ltr,
                ]}
              >
                {w}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : (
        <>
          <View
            style={[
              styles.blanks,
              usesLtr(state) && styles.ltrRow,
              state.shaking && styles.shake,
            ]}
          >
            {state.currentWord.split("").map((_, i) => {
              const p = state.placed[i];
              return (
                <View
                  key={i}
                  style={[
                    styles.blank,
                    p && { borderColor: c.filledBorder, backgroundColor: c.filledBg },
                  ]}
                >
                  <Text
                    style={[
                      styles.blankLetter,
                      usesLtr(state) && styles.ltr,
                    ]}
                  >
                    {p?.letter ?? ""}
                  </Text>
                </View>
              );
            })}
          </View>
          <View style={styles.actions}>
            <PrimaryButton
              label={`${he.hint} (${state.hints})`}
              onPress={() => setState((s) => useHint(s))}
              disabled={state.hints <= 0}
              color="#4D96FF"
            />
            <PrimaryButton label={he.delete} onPress={() => setState((s) => deleteLast(s))} color="#636e72" />
          </View>
          <View style={[styles.tiles, usesLtr(state) && styles.ltrRow]}>
            {state.tiles.map((t) => (
              <Pressable
                key={t.id}
                disabled={t.used}
                onPress={() => setState((s) => placeTile(s, t.id))}
                style={[
                  styles.tile,
                  {
                    backgroundColor: progress.active.theme === "theme_unicorn" ? "#a855f7" : t.color,
                    opacity: t.used ? 0.25 : 1,
                  },
                ]}
              >
                <Text
                  style={[styles.tileText, usesLtr(state) && styles.ltr]}
                >
                  {t.letter}
                </Text>
              </Pressable>
            ))}
          </View>
        </>
      )}

      {consumables.length > 0 ? (
        <View style={styles.tools}>
          {consumables.map((item) => {
            const count = progress.active.inventory[item.id] || 0;
            const activeDouble = item.effect === "double_coins" && state.doubleCoins;
            return (
              <Pressable
                key={item.id}
                disabled={activeDouble}
                onPress={() => useTool(item.id)}
                style={styles.tool}
              >
                <Text style={styles.toolText}>
                  {item.emoji} {item.name} {activeDouble ? he.itemActive : `×${count}`}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </Screen>
  );
}

function categoryTitle(cat: Category) {
  if (cat === "math") return he.categoryMath;
  if (cat === "english") return he.categoryEnglish;
  if (cat === "logic") return he.categoryLogic;
  if (cat === "science") return he.categoryScience;
  return he.categoryLanguage;
}

function choicePrompt(cat: Category) {
  if (cat === "math") return he.howMuch;
  if (cat === "english") return he.spellEnglish;
  if (cat === "logic") return he.logicPrompt;
  if (cat === "science") return he.sciencePrompt;
  return he.whatIsThis;
}

function isQuiz(cat: Category) {
  return cat === "math" || cat === "logic" || cat === "science";
}

function usesLtr(state: GameState) {
  return state.category === "english" || /^\d+$/.test(state.currentWord);
}

function winEmoji(state: GameState) {
  if (state.category === "math") return "🔢";
  if (state.category === "logic") return "🧠";
  if (state.category === "science") return "🌿";
  return state.currentEmoji;
}

function answerLine(state: GameState) {
  if (state.category === "math") return `${state.currentEmoji} = ${state.currentWord}`;
  return state.currentWord;
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", width: "100%", alignItems: "center", marginBottom: 8 },
  badge: { fontFamily: "Heebo_800ExtraBold" },
  progress: { color: "#fff", fontFamily: "Heebo_400Regular", fontSize: 13 },
  player: { color: "#fff", fontFamily: "Heebo_700Bold" },
  streakLine: { color: "#ff6b6b", fontFamily: "Heebo_700Bold" },
  bonus: { width: "100%", alignItems: "center", marginBottom: 8 },
  bonusTitle: { color: "#f9ca24", fontFamily: "Heebo_900Black", fontSize: 20 },
  bonusSub: { color: "#fff", fontFamily: "Heebo_400Regular" },
  timer: { color: "#fff", fontSize: 28, fontFamily: "Heebo_900Black" },
  track: { width: "80%", height: 8, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 8, overflow: "hidden" },
  fill: { height: 8, backgroundColor: "#f9ca24" },
  ltr: { writingDirection: "ltr", textAlign: "left" },
  ltrRow: { writingDirection: "ltr", flexDirection: "row" },
  emoji: { fontSize: 72, marginVertical: 12 },
  hintHe: {
    fontSize: 22,
    fontFamily: "Heebo_800ExtraBold",
    color: "#fff",
    marginBottom: 8,
    textAlign: "center",
  },
  mathPrompt: {
    fontSize: 32,
    color: "#fff",
    fontFamily: "Heebo_900Black",
    marginVertical: 16,
    textAlign: "center",
  },
  bigEmoji: { fontSize: 72 },
  prompt: { color: "#fff", fontFamily: "Heebo_800ExtraBold", marginBottom: 12, fontSize: 20 },
  choice: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: "rgba(255,255,255,0.12)",
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
    alignItems: "center",
  },
  choiceText: { color: "#fff", fontSize: 22, fontFamily: "Heebo_800ExtraBold" },
  blanks: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 8 },
  shake: { opacity: 0.7 },
  blank: {
    width: 44,
    height: 52,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.25)",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  blankLetter: { color: "#fff", fontSize: 24, fontFamily: "Heebo_900Black" },
  actions: { flexDirection: "row", gap: 10, marginVertical: 14 },
  tiles: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 8 },
  tile: { width: 52, height: 56, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  tileText: { color: "#fff", fontSize: 24, fontFamily: "Heebo_900Black" },
  tools: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 16, justifyContent: "center" },
  tool: { backgroundColor: "rgba(255,255,255,0.12)", padding: 10, borderRadius: 14 },
  toolText: { color: "#fff", fontFamily: "Heebo_700Bold" },
  timeout: { color: "#fff", fontSize: 32, fontFamily: "Heebo_900Black", marginTop: 80 },
  winTitle: { fontSize: 28, fontFamily: "Heebo_900Black", color: "#fff", textAlign: "center" },
  winWord: { fontSize: 32, color: "#fff", fontFamily: "Heebo_900Black", marginVertical: 8 },
  meta: { color: "#fff", fontFamily: "Heebo_700Bold", marginBottom: 6 },
  streak: { color: "#ff6b6b", fontFamily: "Heebo_800ExtraBold", marginBottom: 8 },
  lbTitle: { color: "#fff", fontFamily: "Heebo_800ExtraBold", marginTop: 20, marginBottom: 4 },
  want: { color: "#fff", fontFamily: "Heebo_800ExtraBold", marginTop: 12 },
});
