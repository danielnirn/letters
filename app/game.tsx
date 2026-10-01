import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MathErrorCard, FadeIn } from "../src/components/MathErrorCard";
import { GhostButton } from "../src/components/LeaderboardTable";
import { PrimaryButton } from "../src/components/PrimaryButton";
import { Screen } from "../src/components/Screen";
import { useToast } from "../src/components/Toast";
import { useProgress } from "../src/context/ProgressContext";
import { CONFIG, parseCategory, parseDifficulty, parseStage, type Category, type Difficulty } from "../src/game/config";
import {
  afterTimeout,
  answerChoice,
  clearShake,
  deleteLast,
  enableDoubleCoins,
  extraHints,
  nextWord,
  placeTile,
  skipWord,
  startGame,
  stageCoinReward,
  stageIsPerfect,
  submitTyped,
  typeDigit,
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
  const { level, category, stage } = useLocalSearchParams<{
    level: Difficulty;
    category: Category;
    stage: string;
  }>();
  const cat = parseCategory(category);
  const difficulty = parseDifficulty(level);
  const miniLevel = parseStage(stage);
  const router = useRouter();
  const progress = useProgress();
  const completeStageRef = useRef(progress.completeStage);
  const saveScoreRef = useRef(progress.saveScore);
  completeStageRef.current = progress.completeStage;
  saveScoreRef.current = progress.saveScore;
  const { show, node } = useToast();
  const c = colorsFor(progress.active.theme);
  const [state, setState] = useState<GameState>(() => startGame(difficulty, cat, miniLevel));
  const settled = useRef(false);
  const [advancePct, setAdvancePct] = useState(0);
  const skipAdvance = useRef(false);
  const [showReport, setShowReport] = useState(false);
  const [openMistake, setOpenMistake] = useState<number | null>(null);

  const backToStages = () => {
    router.replace({ pathname: "/", params: { category: cat, level: difficulty } });
  };

  useEffect(() => {
    if (state.phase !== "timeout") return;
    const t = setTimeout(() => setState((s) => afterTimeout(s)), 1500);
    return () => clearTimeout(t);
  }, [state.phase]);

  useEffect(() => {
    if (!state.shaking) return;
    const wait = state.category === "math" ? 2800 : 1100;
    const t = setTimeout(() => {
      setState((s) => {
        if (!s.shaking) return s;
        if (s.questionMarks[s.wordIndex] === "bad") return nextWord({ ...s, shaking: false });
        return clearShake(s);
      });
    }, wait);
    return () => clearTimeout(t);
  }, [state.shaking, state.category]);

  useEffect(() => {
    if (state.phase !== "complete") return;
    if (settled.current) return;
    settled.current = true;
    const coins = stageCoinReward(state);
    void (async () => {
      await completeStageRef.current(
        state.category,
        state.level,
        state.stage,
        coins,
        stageIsPerfect(state),
      );
      await saveScoreRef.current(coins, `${state.category}:${state.level}:${state.stage}`);
    })();
    if (stageIsPerfect(state)) {
      const t = setTimeout(backToStages, CONFIG.stageCompleteHoldMs);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [state.phase, state.score, state.lastStreakBonus, state.category, state.level, state.stage]);

  useEffect(() => {
    if (state.phase !== "win") {
      skipAdvance.current = false;
      setAdvancePct(0);
      return;
    }
    const started = Date.now();
    setAdvancePct(0);
    const id = setInterval(() => {
      if (skipAdvance.current) return;
      const elapsed = Date.now() - started;
      setAdvancePct(Math.min(100, (elapsed / CONFIG.correctHoldMs) * 100));
      if (elapsed >= CONFIG.correctHoldMs) {
        clearInterval(id);
        setState((s) => (s.phase === "win" ? nextWord(s) : s));
      }
    }, 40);
    return () => clearInterval(id);
  }, [state.phase, state.wordIndex, state.wordsCompleted]);

  const goNextNow = () => {
    skipAdvance.current = true;
    setState((s) => (s.phase === "win" ? nextWord(s) : s));
  };

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

  if (state.phase === "timeout") {
    return (
      <Screen>
        <Text style={styles.timeout}>{he.timeout}</Text>
      </Screen>
    );
  }

  if (state.phase === "complete") {
    if (showReport) {
      return (
        <Screen>
          <Text style={styles.winTitle}>{he.mistakeReportTitle}</Text>
          {state.mistakes.map((m, i) => {
            const open = openMistake === i;
            return (
              <Pressable
                key={`${m.index}-${m.answer}-${i}`}
                onPress={() => setOpenMistake(open ? null : i)}
                style={styles.reportCard}
              >
                <Text style={styles.reportQ}>{he.mistakeQuestion(m.index + 1)}</Text>
                {m.prompt ? <Text style={styles.reportPrompt}>{m.prompt}</Text> : null}
                <Text style={styles.reportWrong}>
                  {m.skipped ? he.skippedThis : `${he.yourAnswer}: ${m.guess || "—"}`}
                </Text>
                <Text style={styles.reportRight}>
                  {he.correctAnswer}: {m.answer}
                </Text>
                {!open ? <Text style={styles.reportTap}>{he.tapForWhy}</Text> : null}
                {open ? (
                  state.category === "math" ? (
                    <View style={{ width: "100%", marginTop: 10 }}>
                      <MathErrorCard expr={m.prompt} guess={m.guess} answer={m.answer} />
                    </View>
                  ) : (
                    <View style={styles.reportWhy}>
                      {m.hint ? <Text style={styles.reportHint}>{m.hint}</Text> : null}
                      <Text style={styles.reportWhyText}>
                        {m.skipped
                          ? `${he.correctAnswer}: ${m.answer}`
                          : `${m.prompt || ""} זה לא ${m.guess || "—"} · ${m.answer}`}
                      </Text>
                    </View>
                  )
                ) : null}
              </Pressable>
            );
          })}
          <PrimaryButton
            label={he.closeReport}
            onPress={() => {
              setShowReport(false);
              setOpenMistake(null);
            }}
          />
          <View style={{ marginTop: 12 }}>
            <GhostButton label={he.backToStages} onPress={backToStages} />
          </View>
        </Screen>
      );
    }
    return (
      <Screen>
        <Text style={styles.bigEmoji}>🎉</Text>
        <Text style={styles.winTitle}>{he.stageCompleteTitle}</Text>
        <Text style={styles.meta}>{he.stageLabel(state.stage)}</Text>
        <Text style={styles.meta}>
          {stageIsPerfect(state) ? he.stagePerfect : he.stageHadMistakes}
        </Text>
        <Text style={styles.meta}>🪙 {stageCoinReward(state)}</Text>
        <Text style={styles.meta}>
          🔥 {state.streak}/{CONFIG.streakEvery}
        </Text>
        {state.mistakes.length > 0 ? (
          <PrimaryButton label={he.viewMistakes} onPress={() => setShowReport(true)} />
        ) : null}
        <View style={{ marginTop: 12 }}>
          <PrimaryButton label={he.backToStages} onPress={backToStages} />
        </View>
      </Screen>
    );
  }

  const won = state.phase === "win";
  const consumables = SHOP_ITEMS.filter((it) => it.consumable).filter(
    (it) => (progress.active.inventory[it.id] || 0) > 0,
  );

  return (
    <Screen>
      {node}
      <View style={styles.header}>
        <GhostButton label={he.back} onPress={backToStages} />
        <View style={{ alignItems: "center", flex: 1 }}>
          <Text style={[styles.badge, { color: c.accent }]}>
            {categoryTitle(state.category)} · {LEVEL_LABEL[state.level]}
          </Text>
          <Text style={styles.progress}>{he.miniLevelProgress(state.stage, CONFIG.miniLevels)}</Text>
          <Text style={styles.player}>👤 {progress.active.displayName}</Text>
        </View>
      </View>

      <Text
        style={
          state.category === "math" || state.category === "logic"
            ? styles.mathPrompt
            : styles.emoji
        }
      >
        {state.category === "math"
          ? `${state.currentEmoji} = ${won ? state.currentWord : "?"}`
          : state.currentEmoji}
      </Text>
      {state.currentHint ? <Text style={styles.hintHe}>{state.currentHint}</Text> : null}

      {state.shaking && !won && state.category === "math" ? (
        <MathErrorCard
          expr={state.currentEmoji}
          guess={state.lastWrongPick}
          answer={state.currentWord}
        />
      ) : state.shaking && !won ? (
        <FadeIn resetKey={`${state.wordIndex}-${state.lastWrongPick}-${state.missedThisWord}`}>
          <View style={styles.wrongBanner}>
            <Text style={styles.wrongBannerText}>{he.wrongTryAgain}</Text>
          </View>
        </FadeIn>
      ) : null}

      {state.questionType === "choice" ? (
        <View style={{ width: "100%", alignItems: "center" }}>
          {state.category === "math" ? null : (
            <Text style={styles.prompt}>{choicePrompt(state.category)}</Text>
          )}
          <View style={state.choiceWords.length >= 4 ? styles.choiceGrid : { width: "100%", alignItems: "center" }}>
            {state.choiceWords.map((w, i) => (
              <Pressable
                key={`${w}-${i}`}
                onPress={() => setState((s) => answerChoice(s, w))}
                disabled={won || state.shaking}
                style={[
                  styles.choice,
                  state.choiceWords.length >= 4 && styles.choiceHalf,
                  !won && state.shaking && w === state.lastWrongPick && styles.choiceWrong,
                  won && w === state.currentWord && styles.choiceCorrect,
                ]}
              >
                <Text style={styles.choiceText}>{w}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : state.questionType === "type" ? (
        <View style={styles.typeWrap}>
          <Text style={styles.prompt}>{he.typeTheAnswer}</Text>
          <View style={[styles.typeBox, state.shaking && !won && styles.typeBoxWrong, won && styles.typeBoxCorrect]}>
            <Text style={styles.typeValue}>{state.typedAnswer || state.currentWord || " "}</Text>
          </View>
          {won ? null : (
            <>
          <View style={styles.actions}>
            <PrimaryButton
              label={`${he.hint} (${state.hints})`}
              onPress={() => setState((s) => useHint(s))}
              disabled={state.hints <= 0}
              color="#4D96FF"
            />
            <PrimaryButton
              label={he.checkAnswer}
              onPress={() => setState((s) => submitTyped(s))}
              disabled={!state.typedAnswer}
            />
          </View>
          <View style={styles.keypad}>
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0", " "].map((key) => {
              if (key === " ") {
                return <View key="pad" style={styles.keyGhost} />;
              }
              if (key === "⌫") {
                return (
                  <Pressable
                    key="del"
                    onPress={() => setState((s) => deleteLast(s))}
                    style={[styles.key, styles.keyDel]}
                  >
                    <Text style={styles.keyText}>⌫</Text>
                  </Pressable>
                );
              }
              return (
                <Pressable
                  key={key}
                  onPress={() => setState((s) => typeDigit(s, key))}
                  style={styles.key}
                >
                  <Text style={styles.keyText}>{key}</Text>
                </Pressable>
              );
            })}
          </View>
            </>
          )}
        </View>
      ) : (
        <>
          <View
            style={[
              styles.blanks,
              { flexDirection: state.category === "english" ? "row" : "row-reverse" },
              state.shaking && !won && styles.shake,
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
                    won && styles.blankCorrect,
                  ]}
                >
                  <Text style={styles.blankLetter}>{p?.letter ?? ""}</Text>
                </View>
              );
            })}
          </View>
          {won ? null : (
            <>
          <View style={styles.actions}>
            <PrimaryButton
              label={`${he.hint} (${state.hints})`}
              onPress={() => setState((s) => useHint(s))}
              disabled={state.hints <= 0}
              color="#4D96FF"
            />
            <PrimaryButton label={he.delete} onPress={() => setState((s) => deleteLast(s))} color="#636e72" />
          </View>
          <View
            style={[
              styles.tiles,
              { flexDirection: state.category === "english" ? "row" : "row-reverse" },
            ]}
          >
            {state.tiles.map((t) => (
              <Pressable
                key={t.id}
                disabled={t.used || won || state.shaking}
                onPress={() => setState((s) => placeTile(s, t.id))}
                style={[
                  styles.tile,
                  {
                    backgroundColor: progress.active.theme === "theme_unicorn" ? "#a855f7" : t.color,
                    opacity: t.used ? 0.25 : 1,
                  },
                ]}
              >
                <Text style={styles.tileText}>{t.letter}</Text>
              </Pressable>
            ))}
          </View>
            </>
          )}
        </>
      )}

      <View style={styles.qProgress}>
        <View style={styles.qTrack}>
          <View
            style={[
              styles.qFill,
              {
                width: `${Math.round(
                  (state.questionMarks.filter((m) => m).length / Math.max(1, state.wordList.length)) * 100,
                )}%`,
                backgroundColor: c.accent,
              },
            ]}
          />
        </View>
        <View style={styles.qDots}>
          {state.wordList.map((_, i) => {
            const mark = state.questionMarks[i];
            const current = i === state.wordIndex && !mark && !won;
            return (
              <View
                key={i}
                style={[
                  styles.qDot,
                  mark === "ok" && styles.qDotDone,
                  mark === "bad" && styles.qDotBad,
                  current && [styles.qDotNow, { borderColor: c.accent, backgroundColor: c.accent }],
                ]}
              />
            );
          })}
        </View>
        <Text style={styles.qProgressLabel}>
          {he.questionProgress(state.wordIndex + 1, state.wordList.length)}
        </Text>
      </View>

      {!won && !state.shaking ? (
        <View style={styles.skipWrap}>
          <PrimaryButton
            label={he.skipQuestion}
            onPress={() => setState((s) => skipWord(s))}
            color="#636e72"
          />
        </View>
      ) : null}

      {won ? (
        <View style={styles.correctWrap}>
          <View style={styles.correctBanner}>
            <Text style={styles.correctBannerText}>{he.correctFlash()}</Text>
          </View>
          {state.lastFirstTryBonus > 0 ? (
            <View style={styles.correctExtra}>
              <Text style={styles.correctStreak}>{he.firstTryBonus()}</Text>
            </View>
          ) : null}
          {state.lastStreakBonus > 0 ? (
            <View style={styles.correctExtra}>
              <Text style={styles.correctStreak}>{he.streakTag(CONFIG.streakEvery)}</Text>
            </View>
          ) : null}
          <View style={styles.advanceTrack}>
            <View style={[styles.advanceFill, { width: `${advancePct}%` }]} />
          </View>
          <PrimaryButton
            label={isQuiz(state.category) ? he.nextQuestion : he.nextWord}
            onPress={goNextNow}
          />
        </View>
      ) : null}

      {consumables.length > 0 && !won ? (
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
  track: { width: "80%", height: 8, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 8 },
  fill: { height: 8, backgroundColor: "#f9ca24" },
  emoji: { fontSize: 72, marginVertical: 12 },
  hintHe: {
    fontSize: 22,
    fontFamily: "Heebo_800ExtraBold",
    color: "#fff",
    marginBottom: 8,
    textAlign: "center",
  },
  qProgress: {
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
    marginTop: 22,
    marginBottom: 14,
  },
  qTrack: {
    width: "100%",
    height: 10,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 8,
    alignItems: "flex-end",
  },
  qFill: {
    height: 10,
    borderRadius: 8,
  },
  qDots: {
    flexDirection: "row-reverse",
    marginTop: 8,
  },
  qDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginHorizontal: 4,
    backgroundColor: "rgba(255,255,255,0.22)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.22)",
  },
  qDotDone: {
    backgroundColor: "#6bcb77",
    borderColor: "#6bcb77",
  },
  qDotBad: {
    backgroundColor: "#e57373",
    borderColor: "#e57373",
  },
  qDotNow: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  qProgressLabel: {
    color: "#fff",
    fontFamily: "Heebo_700Bold",
    fontSize: 13,
    marginTop: 6,
    textAlign: "center",
  },
  skipWrap: {
    width: "100%",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 16,
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
  choiceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    width: "100%",
    maxWidth: 340,
  },
  choiceHalf: {
    width: "48%",
    maxWidth: 160,
    marginBottom: 8,
    marginHorizontal: 4,
  },
  typeWrap: { width: "100%", alignItems: "center" },
  typeBox: {
    minWidth: 160,
    minHeight: 64,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.35)",
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  typeValue: {
    color: "#fff",
    fontSize: 36,
    fontFamily: "Heebo_900Black",
    textAlign: "center",
  },
  keypad: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: 252,
    justifyContent: "center",
    marginTop: 8,
  },
  key: {
    width: 76,
    height: 56,
    borderRadius: 14,
    backgroundColor: "#4D96FF",
    alignItems: "center",
    justifyContent: "center",
    margin: 4,
  },
  keyDel: { backgroundColor: "#636e72" },
  keyGhost: { width: 76, height: 56 },
  keyText: { color: "#fff", fontSize: 22, fontFamily: "Heebo_900Black" },
  choiceText: { color: "#fff", fontSize: 22, fontFamily: "Heebo_800ExtraBold" },
  blanks: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center" },
  shake: {
    backgroundColor: "rgba(243,180,180,0.28)",
  },
  wrongBanner: {
    width: "100%",
    backgroundColor: "#f3b4b4",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 12,
    alignItems: "center",
  },
  wrongBannerText: {
    color: "#5c2b2b",
    fontSize: 18,
    fontFamily: "Heebo_800ExtraBold",
    textAlign: "center",
  },
  choiceWrong: {
    backgroundColor: "#f3b4b4",
    borderWidth: 2,
    borderColor: "#e08a8a",
  },
  typeBoxWrong: {
    borderColor: "#e08a8a",
    backgroundColor: "rgba(243,180,180,0.35)",
  },
  typeBoxCorrect: {
    borderColor: "#6bcb77",
    backgroundColor: "rgba(107,203,119,0.35)",
  },
  choiceCorrect: {
    backgroundColor: "#6bcb77",
    borderWidth: 2,
    borderColor: "#fff",
  },
  blankCorrect: {
    borderColor: "#6bcb77",
    backgroundColor: "rgba(107,203,119,0.4)",
  },
  correctWrap: {
    width: "100%",
    alignItems: "center",
    marginTop: 16,
  },
  correctBanner: {
    width: "100%",
    backgroundColor: "#6bcb77",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  correctExtra: {
    width: "100%",
    backgroundColor: "rgba(107,203,119,0.55)",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  correctBannerText: {
    color: "#fff",
    fontSize: 22,
    fontFamily: "Heebo_900Black",
    textAlign: "center",
  },
  correctStreak: {
    color: "#fff",
    fontFamily: "Heebo_700Bold",
    textAlign: "center",
  },
  advanceTrack: {
    width: "100%",
    height: 10,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 8,
    marginBottom: 12,
  },
  advanceFill: {
    height: 10,
    backgroundColor: "#6bcb77",
    borderRadius: 8,
  },
  blank: {
    width: 44,
    height: 52,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.25)",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    margin: 4,
  },
  blankLetter: { color: "#fff", fontSize: 24, fontFamily: "Heebo_900Black" },
  actions: { flexDirection: "row", marginVertical: 14 },
  tiles: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center" },
  tile: { width: 52, height: 56, borderRadius: 12, alignItems: "center", justifyContent: "center", margin: 4 },
  tileText: { color: "#fff", fontSize: 24, fontFamily: "Heebo_900Black" },
  tools: { flexDirection: "row", flexWrap: "wrap", marginTop: 16, justifyContent: "center" },
  tool: { backgroundColor: "rgba(255,255,255,0.12)", padding: 10, borderRadius: 14 },
  toolText: { color: "#fff", fontFamily: "Heebo_700Bold" },
  timeout: { color: "#fff", fontSize: 32, fontFamily: "Heebo_900Black", marginTop: 80 },
  winTitle: { fontSize: 28, fontFamily: "Heebo_900Black", color: "#fff", textAlign: "center" },
  winWord: { fontSize: 32, color: "#fff", fontFamily: "Heebo_900Black", marginVertical: 8 },
  meta: { color: "#fff", fontFamily: "Heebo_700Bold", marginBottom: 6 },
  streak: { color: "#ff6b6b", fontFamily: "Heebo_800ExtraBold", marginBottom: 8 },
  lbTitle: { color: "#fff", fontFamily: "Heebo_800ExtraBold", marginTop: 20, marginBottom: 4 },
  want: { color: "#fff", fontFamily: "Heebo_800ExtraBold", marginTop: 12 },
  reportCard: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 12,
    alignItems: "flex-end",
  },
  reportQ: { color: "#ffd93d", fontFamily: "Heebo_800ExtraBold", marginBottom: 4 },
  reportPrompt: { color: "#fff", fontSize: 22, fontFamily: "Heebo_900Black", textAlign: "right", marginBottom: 4 },
  reportHint: { color: "rgba(255,255,255,0.85)", fontFamily: "Heebo_700Bold", textAlign: "right", marginBottom: 6 },
  reportWrong: { color: "#f3b4b4", fontFamily: "Heebo_700Bold", textAlign: "right" },
  reportRight: { color: "#6bcb77", fontFamily: "Heebo_800ExtraBold", textAlign: "right", marginTop: 4 },
  reportTap: {
    color: "rgba(255,255,255,0.65)",
    fontFamily: "Heebo_400Regular",
    fontSize: 13,
    marginTop: 8,
    textAlign: "right",
  },
  reportWhy: {
    width: "100%",
    marginTop: 10,
    backgroundColor: "#f3b4b4",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: "center",
  },
  reportWhyText: {
    color: "#5c2b2b",
    fontFamily: "Heebo_700Bold",
    textAlign: "center",
    fontSize: 15,
  },
});
