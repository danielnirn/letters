import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MathErrorCard, FadeIn } from "../src/components/MathErrorCard";
import { NIGHT, WOOD_LIP } from "../src/components/Forest";
import { Pic, PicText } from "../src/components/Pic";
import { useProgress } from "../src/context/ProgressContext";
import { CONFIG, parseCategory, parseDifficulty, parseStage, type Category, type Difficulty } from "../src/game/config";
import {
  afterTimeout,
  answerChoice,
  clearShake,
  deleteLast,
  nextWord,
  placeTile,
  skipWord,
  startGame,
  stageIsPerfect,
  submitTyped,
  typeDigit,
  useHint,
  type GameState,
} from "../src/game/session";
import { he } from "../src/i18n/he";
import { BAD, CATEGORY_COLORS, GOLD, KIT, OK, TILE_SWATCHES, font } from "../src/theme/colors";
import { Coin, Icon, Star } from "../src/components/Art";
import { Buddy, Card, useColors } from "../src/components/ui";
import { runStars } from "../src/game/village";
import { coinsFor, nextElement, starsFor } from "../src/game/economy";
import {
  Island,
  KitBack,
  KitButton,
  KitCard,
  KitChip,
  KitMeter,
  KitTitle,
  OutlinedText,
  ResourceCounter,
  SeaScreen,
  StarRating,
} from "../src/components/GameKit";
import { buildingName } from "../src/components/VillageArt";

const LEVEL_LABEL: Record<Difficulty, string> = {
  easy: he.easy,
  mid: he.mid,
  hard: he.hard,
};

export default function GameScreen() {
  const { level, category, stage } = useLocalSearchParams<{ level: string; category: string; stage: string }>();
  // Remount per stage so "next stage" starts fresh state.
  return <GameRun key={`${category}:${level}:${stage}`} />;
}

function GameRun() {
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
  const c = useColors();
  const [state, setState] = useState<GameState>(() =>
    startGame(difficulty, cat, miniLevel),
  );
  const settled = useRef(false);
  const [advancePct, setAdvancePct] = useState(0);
  const skipAdvance = useRef(false);
  const [showReport, setShowReport] = useState(false);
  const [openMistake, setOpenMistake] = useState<number | null>(null);

  const backToStages = () => {
    router.replace({ pathname: "/", params: { category: cat, level: difficulty } });
  };

  const backToHome = () => {
    router.replace("/");
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
    const perfect = stageIsPerfect(state);
    const stars = starsFor(state.level, perfect);
    void (async () => {
      await completeStageRef.current(state.category, state.level, state.stage, perfect, runStars(state));
      await saveScoreRef.current(stars, `${state.category}:${state.level}:${state.stage}`);
    })();
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

  const crumb = `${categoryTitle(state.category)} · ${LEVEL_LABEL[state.level]} · ${he.stageLabel(state.stage)}`;

  if (state.phase === "timeout") {
    return (
      <SeaScreen>
        <Island width={220}>
          <Buddy size={96} body={c.primary} />
        </Island>
        <KitTitle text={he.timeout} big />
      </SeaScreen>
    );
  }

  if (state.phase === "complete") {
    if (showReport) {
      return (
        <SeaScreen>
          <View style={styles.signRow}>
            <KitTitle text={he.mistakeReportTitle} big />
          </View>
          <View style={styles.kitCrumb}>
            <KitChip text={crumb} dark />
          </View>
          {state.mistakes.map((m, i) => {
            const open = openMistake === i;
            return (
              <Pressable
                key={`${m.index}-${m.answer}-${i}`}
                onPress={() => setOpenMistake(open ? null : i)}
                style={styles.reportCard}
              >
                <View style={styles.reportHead}>
                  <View style={[styles.reportNum, { backgroundColor: BAD.tint }]}>
                    <Text style={[styles.reportNumText, { color: BAD.deep }]}>{m.index + 1}</Text>
                  </View>
                  <View style={{ flex: 1, alignItems: "flex-end" }}>
                    <Text style={[styles.reportQ, { color: c.soft }]}>{he.mistakeQuestion(m.index + 1)}</Text>
                    {m.story ? (
                      <Text style={[styles.reportHint, { color: c.ink, marginBottom: 0 }]}>{`${m.prompt} ${m.hint}`}</Text>
                    ) : m.prompt ? (
                      <Text style={[styles.reportPrompt, { color: c.ink }]}>{m.prompt}</Text>
                    ) : null}
                  </View>
                  <Icon name={open ? "close" : "next"} size={18} color={c.soft} />
                </View>
                <View style={styles.reportAnswers}>
                  <View style={[styles.answerTag, { backgroundColor: BAD.tint }]}>
                    <Text style={[styles.answerTagText, { color: BAD.deep }]}>
                      {m.skipped ? he.skippedThis : `${he.yourAnswer}: ${m.guess || "—"}`}
                    </Text>
                  </View>
                  <View style={[styles.answerTag, { backgroundColor: OK.tint }]}>
                    <Text style={[styles.answerTagText, { color: OK.deep }]}>
                      {he.correctAnswer}: {m.answer}
                    </Text>
                  </View>
                </View>
                {!open ? <Text style={[styles.reportTap, { color: KIT.orangeLip }]}>{he.tapForWhy}</Text> : null}
                {open ? (
                  state.category === "math" ? (
                    <View style={{ width: "100%", marginTop: 12 }}>
                      <MathErrorCard expr={m.prompt} guess={m.guess} answer={m.answer} title={false} />
                    </View>
                  ) : (
                    <View style={[styles.reportWhy, { backgroundColor: GOLD.tint }]}>
                      {m.story ? <Text style={[styles.reportStory, { color: c.ink }]}>{m.story}</Text> : null}
                      {m.hint ? <Text style={[styles.reportHint, { color: c.ink }]}>{m.hint}</Text> : null}
                      <Text style={[styles.reportWhyText, { color: GOLD.deep }]}>
                        {m.skipped || m.story
                          ? `${he.correctAnswer}: ${m.answer}`
                          : `${m.prompt || ""} זה לא ${m.guess || "—"} · ${m.answer}`}
                      </Text>
                    </View>
                  )
                ) : null}
              </Pressable>
            );
          })}
          <View style={styles.stackButtons}>
            <KitButton label={he.backToStages} icon="next" onPress={backToStages} />
            <KitButton
              label={he.closeReport}
              tone="cream"
              onPress={() => {
                setShowReport(false);
                setOpenMistake(null);
              }}
            />
            <KitButton label={he.backToHome} icon="home" tone="cream" onPress={backToHome} />
          </View>
        </SeaScreen>
      );
    }
    const perfect = stageIsPerfect(state);
    const okCount = state.questionMarks.filter((m) => m === "ok").length;
    const element = nextElement(progress.active);
    const starsNow = progress.active.stars;
    const canBuild = starsNow >= element.cost;
    const earnedStars = runStars(state);
    const winStars = starsFor(state.level, perfect);
    const winCoins = coinsFor(state.level, perfect);
    return (
      <SeaScreen>
        <Confetti />
        <View style={styles.kitRating}>
          <StarRating value={earnedStars} size={54} />
        </View>
        <KitTitle text={he.stageCompleteTitle} big />
        <View style={styles.kitCrumb}>
          <KitChip text={crumb} dark />
        </View>
        <Island width={220}>
          <Buddy size={96} body={perfect ? OK.base : GOLD.base} />
        </Island>

        <KitCard style={styles.kitResult}>
          <View style={styles.resultDots}>
            {state.wordList.map((_, i) => {
              const mark = state.questionMarks[i];
              const sw = mark === "ok" ? OK : BAD;
              return (
                <View key={i} style={[styles.resultDot, { backgroundColor: sw.base, borderBottomColor: sw.lip }]}>
                  <Icon name={mark === "ok" ? "check" : "x"} size={16} color="#fff" weight={3.2} />
                </View>
              );
            })}
          </View>
          <Text style={[styles.kitResultLine, { color: perfect ? OK.deep : KIT.creamInk }]}>
            {perfect ? he.stagePerfect : he.stageHadMistakes} · {he.correctOf(okCount, state.wordList.length)}
          </Text>
          <View style={styles.kitRewards}>
            <ResourceCounter kind="star" value={winStars} />
            {winCoins > 0 ? <ResourceCounter kind="coin" value={winCoins} /> : null}
          </View>
          {perfect ? <Text style={[styles.kitNote, { color: OK.deep }]}>{he.perfectRefund}</Text> : null}
          <View style={styles.kitBuild}>
            <Text style={styles.kitNote}>
              {canBuild ? `${he.buildNow} ${buildingName(element.category)}` : he.needStars(element.cost - starsNow)}
            </Text>
            <KitMeter value={Math.min(starsNow, element.cost)} total={element.cost} color={canBuild ? KIT.green : KIT.orange} />
          </View>
        </KitCard>

        <View style={styles.stackButtons}>
          {canBuild ? (
            <KitButton
              label={he.buildNow}
              tone="orange"
              onPress={backToHome}
              trailing={<KitChip icon={<Star size={16} />} text={`−${element.cost}`} />}
            />
          ) : null}
          <KitButton
            label={canBuild ? he.playMore : he.keepGoing}
            tone={canBuild ? "cream" : "green"}
            icon={canBuild ? undefined : "next"}
            onPress={backToStages}
          />
          {state.mistakes.length > 0 ? (
            <KitButton label={he.viewMistakes} tone="cream" onPress={() => setShowReport(true)} />
          ) : null}
        </View>
      </SeaScreen>
    );
  }

  const won = state.phase === "win";
  const wrong = state.shaking && !won;
  const hebrewRow = state.category === "english" ? "row" : "row-reverse";
  const cs = CATEGORY_COLORS[state.category];

  return (
    <SeaScreen>
      <View style={styles.header}>
        <KitBack icon="close" onPress={backToStages} label={he.exitLabel} />
        <View
          style={styles.segTrack}
          accessibilityLabel={he.questionProgress(state.wordIndex + 1, state.wordList.length)}
        >
          {state.wordList.map((_, i) => {
            const mark = state.questionMarks[i];
            const current = i === state.wordIndex && !mark;
            const bg = mark === "ok" ? KIT.green : mark === "bad" ? KIT.red : current ? GOLD.base : "rgba(255,255,255,0.16)";
            return <View key={i} style={[styles.segment, { backgroundColor: bg }, current && styles.segmentNow]} />;
          })}
        </View>
      </View>
      <View style={styles.signRow}>
        <KitTitle text={crumb} />
      </View>

      <View style={[styles.promptFrame, { backgroundColor: cs.base, borderBottomColor: cs.lip }]}>
      <Card style={[styles.promptCard, { backgroundColor: KIT.cream }]}>
        {state.category === "math" ? (
          <View style={styles.exprRow}>
            <Text style={[styles.exprText, { color: KIT.creamInk }]}>{state.currentEmoji} =</Text>
            <View
              style={[
                styles.exprBox,
                won
                  ? { backgroundColor: OK.tint, borderColor: OK.base, borderStyle: "solid" }
                  : { backgroundColor: "#fff", borderColor: KIT.orange },
              ]}
            >
              <Text style={[styles.exprText, { color: won ? OK.deep : KIT.orange }]}>
                {won ? state.currentWord : "?"}
              </Text>
            </View>
          </View>
        ) : state.category === "logic" ? (
          <PicText text={state.currentEmoji} size={48} textStyle={{ ...styles.logicPrompt, color: c.ink }} />
        ) : state.category === "reading" ? (
          <>
            <View style={styles.storyHead}>
              <Pic emoji={state.currentEmoji} size={40} />
              <Text style={[styles.prompt, { color: c.soft, marginTop: 0 }]}>{he.promptReading}</Text>
            </View>
            <View
              style={[
                styles.storyBox,
                { backgroundColor: c.ground, borderColor: c.line },
              ]}
            >
              <Text style={[styles.storyText, { color: c.ink }]}>{state.currentStory}</Text>
            </View>
          </>
        ) : (
          <View style={styles.pic}>
            {state.category === "science" ? (
              <PicText text={state.currentEmoji} size={112} textStyle={styles.sciencePrompt} />
            ) : (
              <Pic emoji={state.currentEmoji} size={112} />
            )}
          </View>
        )}
        {state.currentHint ? <Text style={[styles.hintHe, { color: KIT.creamInk }]}>{state.currentHint}</Text> : null}
        {state.questionType !== "spell" && state.category !== "math" && state.category !== "reading" ? (
          <Text style={[styles.prompt, { color: KIT.creamInk }]}>
            {state.questionType === "type" ? he.promptType : choicePrompt(state.category, state.currentWord)}
          </Text>
        ) : null}
      </Card>
      </View>

      {wrong && state.category === "math" ? (
        <MathErrorCard expr={state.currentEmoji} guess={state.lastWrongPick} answer={state.currentWord} />
      ) : wrong ? (
        <FadeIn resetKey={`${state.wordIndex}-${state.lastWrongPick}-${state.missedThisWord}`}>
          <View style={styles.feedback}>
            <View style={[styles.feedbackIcon, { backgroundColor: BAD.base }]}>
              <Icon name="x" size={22} color="#fff" weight={3.2} />
            </View>
            <View style={{ flex: 1, alignItems: "flex-end" }}>
              <Text style={[styles.feedbackTitle, { color: BAD.deep }]}>{he.wrongTitle}</Text>
              <Text style={[styles.feedbackSub, { color: c.soft }]}>{he.wrongNext}</Text>
            </View>
          </View>
        </FadeIn>
      ) : null}

      {state.questionType === "choice" ? (
        <>
        <View style={styles.choiceGrid}>
          {state.choiceWords.map((w, i) => {
            const isWrong = wrong && w === state.lastWrongPick;
            const isRight = won && w === state.currentWord;
            const sw = isWrong ? BAD : isRight ? OK : null;
            return (
              <Pressable
                key={`${w}-${i}`}
                onPress={() => setState((s) => answerChoice(s, w))}
                disabled={won || state.shaking}
                style={({ pressed }) => [
                  styles.choice,
                  state.choiceWords.length >= 4 ? styles.choiceHalf : styles.choiceFull,
                  {
                    backgroundColor: sw ? sw.tint : KIT.cream,
                    borderColor: sw ? sw.lip : KIT.woodEdge,
                    borderBottomColor: sw ? sw.lip : KIT.woodEdge,
                    borderBottomWidth: pressed ? 2 : 6,
                    marginTop: pressed ? 4 : 0,
                    opacity: (won || state.shaking) && !sw ? 0.55 : 1,
                  },
                ]}
              >
                {sw ? (
                  <View style={[styles.choiceMark, { backgroundColor: sw.base }]}>
                    <Icon name={isRight ? "check" : "x"} size={14} color="#fff" weight={3.4} />
                  </View>
                ) : null}
                <Text
                  style={[
                    styles.choiceText,
                    state.category === "reading" && styles.choiceTextSmall,
                    { color: sw ? sw.deep : KIT.creamInk },
                  ]}
                >
                  {w}
                </Text>
              </Pressable>
            );
          })}
        </View>
          {state.bonusHints > 0 && !won ? (
            <View style={styles.choiceHint}>
              <SoftAction
                icon="bulb"
                label={he.hintCount(state.hints)}
                disabled={state.hints <= 0}
                onPress={() => setState((s) => useHint(s))}
              />
            </View>
          ) : null}
        </>
      ) : state.questionType === "type" ? (
        <View style={styles.typeWrap}>
          <View
            style={[
              styles.typeBox,
              { backgroundColor: KIT.cream, borderColor: KIT.woodEdge },
              wrong && { borderColor: BAD.base, backgroundColor: BAD.tint },
              won && { borderColor: OK.base, backgroundColor: OK.tint },
            ]}
          >
            <Text style={[styles.typeValue, { color: c.ink }]}>{state.typedAnswer || state.currentWord || " "}</Text>
          </View>
          {won ? null : (
            <>
              <View style={styles.keypad}>
                {["1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0", "✓"].map((key) => {
                  const isDel = key === "⌫";
                  const isOk = key === "✓";
                  const disabled = isOk && !state.typedAnswer;
                  return (
                    <Pressable
                      key={key}
                      accessibilityLabel={isDel ? he.deleteLetter : isOk ? he.checkLabel : key}
                      disabled={disabled || state.shaking}
                      onPress={() =>
                        setState((s) => (isDel ? deleteLast(s) : isOk ? submitTyped(s) : typeDigit(s, key)))
                      }
                      style={({ pressed }) => [
                        styles.key,
                        {
                          backgroundColor: isOk ? KIT.green : KIT.cream,
                          borderColor: isOk ? KIT.greenLip : KIT.woodEdge,
                          borderBottomColor: isOk ? KIT.greenLip : KIT.woodEdge,
                          borderBottomWidth: pressed ? 2 : 5,
                          marginTop: pressed ? 7 : 4,
                          opacity: disabled ? 0.45 : 1,
                        },
                      ]}
                    >
                      {isDel ? (
                        <Icon name="erase" size={24} color={c.ink} />
                      ) : isOk ? (
                        <Icon name="check" size={26} color="#fff" weight={3.2} />
                      ) : (
                        <Text style={[styles.keyText, { color: c.ink }]}>{key}</Text>
                      )}
                    </Pressable>
                  );
                })}
              </View>
              <SoftAction
                icon="bulb"
                label={he.hintCount(state.hints)}
                disabled={state.hints <= 0}
                onPress={() => setState((s) => useHint(s))}
              />
            </>
          )}
        </View>
      ) : (
        <>
          <View style={[styles.blanks, { flexDirection: hebrewRow }]}>
            {state.currentWord.split("").map((_, i) => {
              const p = state.placed[i];
              const sw = won ? OK : wrong ? BAD : null;
              return (
                <View
                  key={i}
                  style={[
                    styles.blank,
                    {
                      backgroundColor: sw ? sw.tint : p ? KIT.cream : "rgba(255,255,255,0.25)",
                      borderColor: sw ? sw.base : p ? KIT.woodEdge : KIT.cream,
                      borderStyle: p || sw ? "solid" : "dashed",
                    },
                  ]}
                >
                  <Text style={[styles.blankLetter, { color: sw ? sw.deep : c.ink }]}>{p?.letter ?? ""}</Text>
                </View>
              );
            })}
          </View>
          {won ? null : (
            <>
              <View style={styles.actions}>
                <SoftAction
                  icon="bulb"
                  label={he.hintCount(state.hints)}
                  disabled={state.hints <= 0}
                  onPress={() => setState((s) => useHint(s))}
                />
                <SoftAction icon="erase" label={he.deleteLetter} onPress={() => setState((s) => deleteLast(s))} />
              </View>
              <View style={[styles.tiles, { flexDirection: hebrewRow }]}>
                {state.tiles.map((t, i) => {
                  const sw = TILE_SWATCHES[i % TILE_SWATCHES.length];
                  return (
                    <Pressable
                      key={t.id}
                      disabled={t.used || won || state.shaking}
                      onPress={() => setState((s) => placeTile(s, t.id))}
                      style={({ pressed }) => [
                        styles.tile,
                        {
                          backgroundColor: sw.base,
                          borderColor: KIT.woodEdge,
                          borderBottomColor: KIT.woodEdge,
                          borderBottomWidth: pressed ? 2 : 5,
                          marginTop: pressed ? 8 : 5,
                          opacity: t.used ? 0.25 : 1,
                        },
                      ]}
                    >
                      <OutlinedText size={30} outline={sw.lip}>
                        {t.letter}
                      </OutlinedText>
                    </Pressable>
                  );
                })}
              </View>
            </>
          )}
        </>
      )}

      {won ? (
        <View style={styles.correct}>
          <View style={styles.correctHead}>
            <View style={[styles.feedbackIcon, { backgroundColor: OK.base }]}>
              <Icon name="check" size={22} color="#fff" weight={3.2} />
            </View>
            <Text style={[styles.correctTitle, { color: OK.deep }]}>{he.correctTitle}</Text>
          </View>
          {state.lastFirstTryBonus > 0 || state.lastStreakBonus > 0 ? (
            <View style={styles.correctTags}>
              {state.lastFirstTryBonus > 0 ? (
                <View style={[styles.tag, { backgroundColor: GOLD.tint }]}>
                  <Text style={[styles.tagText, { color: GOLD.deep }]}>{he.firstTryBonus()}</Text>
                </View>
              ) : null}
              {state.lastStreakBonus > 0 ? (
                <View style={[styles.tag, { backgroundColor: BAD.tint }]}>
                  <Text style={[styles.tagText, { color: BAD.deep }]}>{he.streakTag(CONFIG.streakEvery)}</Text>
                </View>
              ) : null}
            </View>
          ) : null}
          <View style={styles.advanceTrack}>
            <View style={[styles.advanceFill, { width: `${advancePct}%` }]} />
          </View>
          <KitButton
            label={isQuiz(state.category) ? he.nextQuestion : he.nextWord}
            onPress={goNextNow}
            icon="next"
            style={{ alignSelf: "stretch" }}
          />
        </View>
      ) : null}

      {!won && !state.shaking ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={he.skipThis}
          onPress={() => setState((s) => skipWord(s))}
          style={({ pressed }) => [
            styles.skip,
            {
              borderBottomWidth: pressed ? 2 : 6,
              marginTop: pressed ? 21 : 18,
            },
          ]}
        >
          <View style={[styles.skipIcon, { backgroundColor: "rgba(255,255,255,0.18)" }]}>
            <Icon name="skip" size={18} color="#fff" weight={2.8} />
          </View>
          <Text style={[styles.skipText, { color: "#fff" }]}>{he.skipThis}</Text>
        </Pressable>
      ) : null}
    </SeaScreen>
  );
}

function SoftAction({
  icon,
  label,
  onPress,
  disabled,
}: {
  icon: "bulb" | "erase";
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const c = useColors();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.softAction,
        {
          borderBottomWidth: pressed ? 2 : 5,
          marginTop: pressed ? 3 : 0,
          opacity: disabled ? 0.45 : 1,
        },
      ]}
    >
      <Icon name={icon} size={20} color={icon === "bulb" ? GOLD.lip : KIT.creamInk} />
      <Text style={[styles.softActionText, { color: KIT.creamInk }]}>{label}</Text>
    </Pressable>
  );
}

const CONFETTI = [
  { left: "8%", top: 10, color: CATEGORY_COLORS.language.base, rotate: "20deg" },
  { left: "22%", top: 54, color: CATEGORY_COLORS.math.base, rotate: "-30deg" },
  { left: "36%", top: 4, color: CATEGORY_COLORS.logic.base, rotate: "45deg" },
  { left: "62%", top: 30, color: CATEGORY_COLORS.english.base, rotate: "-15deg" },
  { left: "76%", top: 2, color: CATEGORY_COLORS.science.base, rotate: "60deg" },
  { left: "90%", top: 48, color: CATEGORY_COLORS.language.base, rotate: "-50deg" },
  { left: "14%", top: 120, color: CATEGORY_COLORS.science.base, rotate: "10deg" },
  { left: "84%", top: 128, color: CATEGORY_COLORS.math.base, rotate: "35deg" },
] as const;

function Confetti() {
  return (
    <View pointerEvents="none" style={styles.confetti}>
      {CONFETTI.map((p, i) => (
        <View
          key={i}
          style={[
            styles.confettiBit,
            { left: p.left, top: p.top, backgroundColor: p.color, transform: [{ rotate: p.rotate }] },
            i % 2 === 1 && styles.confettiDot,
          ]}
        />
      ))}
    </View>
  );
}

function categoryTitle(cat: Category) {
  if (cat === "math") return he.categoryMath;
  if (cat === "english") return he.categoryEnglish;
  if (cat === "logic") return he.categoryLogic;
  if (cat === "science") return he.categoryScience;
  if (cat === "reading") return he.categoryReading;
  return he.categoryLanguage;
}

const COLOR_WORDS = new Set(["אדום", "כחול", "ירוק", "צהוב", "כתום", "סגול", "ורוד", "שחור", "לבן", "חום", "אפור"]);

function choicePrompt(cat: Category, word: string) {
  if (cat === "english") return he.promptEnglish;
  if (cat === "logic") return he.promptLogic;
  if (cat === "science") return he.promptScience;
  if (cat === "reading") return he.promptReading;
  if (COLOR_WORDS.has(word)) return he.promptColor;
  return he.promptWhat;
}

function isQuiz(cat: Category) {
  return cat === "math" || cat === "logic" || cat === "science" || cat === "reading";
}

const styles = StyleSheet.create({
  kitRating: { marginTop: 6, marginBottom: 6 },
  kitCrumb: { marginTop: 10, marginBottom: 18 },
  kitResult: { width: "100%", alignItems: "center", gap: 10, marginTop: 4 },
  kitResultLine: { fontFamily: font.black, fontSize: 18, textAlign: "center" },
  kitRewards: { flexDirection: "row-reverse", justifyContent: "center", gap: 14 },
  kitNote: { fontFamily: font.heavy, fontSize: 15, textAlign: "center", color: KIT.creamInk },
  kitBuild: { alignSelf: "stretch", gap: 6, marginTop: 2 },
  header: { flexDirection: "row-reverse", width: "100%", alignItems: "center", gap: 12 },
  segTrack: { flex: 1, flexDirection: "row-reverse", alignItems: "center", gap: 4, backgroundColor: KIT.track, borderWidth: 3, borderColor: KIT.woodEdge, borderBottomWidth: 5, borderRadius: 999, paddingHorizontal: 6, height: 32 },
  segment: { flex: 1, height: 12, borderRadius: 6 },
  segmentNow: { height: 16, borderRadius: 8 },
  signRow: { alignItems: "center", marginTop: 12, marginBottom: 14, maxWidth: "100%" },
  crumbPill: {
    backgroundColor: NIGHT,
    borderWidth: 2,
    borderColor: "#fff",
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  crumbPillText: { fontFamily: font.bold, fontSize: 14, color: "#fff", textAlign: "center" },
  promptFrame: { width: "100%", borderRadius: 30, borderWidth: 3, borderColor: KIT.woodEdge, borderBottomWidth: 8, padding: 7, marginBottom: 16 },
  crumb: { fontFamily: font.bold, fontSize: 14, textAlign: "center", marginTop: 10, marginBottom: 12 },
  promptCard: { alignItems: "center", paddingVertical: 22, borderRadius: 24, borderBottomWidth: 0 },
  pic: { marginVertical: 2 },
  storyHead: { flexDirection: "row-reverse", alignItems: "center", gap: 10, alignSelf: "stretch", justifyContent: "center" },
  storyBox: {
    alignSelf: "stretch",
    borderRadius: 18,
    borderWidth: 2,
    borderBottomWidth: 5,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginTop: 10,
  },
  storyText: { fontSize: 20, lineHeight: 32, fontFamily: font.medium, textAlign: "right" },
  exprRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  exprText: { fontFamily: font.black, fontSize: 44 },
  exprBox: {
    minWidth: 76,
    height: 70,
    paddingHorizontal: 10,
    borderRadius: 18,
    borderWidth: 3,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  sciencePrompt: { fontSize: 92, lineHeight: 112 },
  logicPrompt: { fontFamily: font.black, fontSize: 34, textAlign: "center", lineHeight: 46 },
  hintHe: { fontSize: 22, fontFamily: font.heavy, marginTop: 8, textAlign: "center" },
  prompt: { fontFamily: font.bold, fontSize: 16, marginTop: 8, textAlign: "center" },
  feedback: { width: "100%", flexDirection: "row-reverse", alignItems: "center", gap: 12, borderRadius: 22, borderWidth: 3, borderColor: KIT.woodEdge, borderBottomWidth: 7, backgroundColor: KIT.cream, padding: 14, marginBottom: 14 },
  feedbackIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  feedbackTitle: { fontFamily: font.black, fontSize: 19 },
  feedbackSub: { fontFamily: font.medium, fontSize: 14, marginTop: 2 },
  choiceHint: { alignSelf: "center", marginTop: 8 },
  choiceGrid: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    justifyContent: "space-between",
    width: "100%",
  },
  choice: { minHeight: 76, paddingVertical: 14, paddingHorizontal: 10, borderRadius: 22, borderWidth: 3, marginBottom: 12, alignItems: "center", justifyContent: "center" },
  choiceHalf: { width: "48%" },
  choiceFull: { width: "100%" },
  choiceMark: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  choiceText: { fontSize: 26, fontFamily: font.heavy, textAlign: "center" },
  choiceTextSmall: { fontSize: 18, lineHeight: 24 },
  typeWrap: { width: "100%", alignItems: "center" },
  typeBox: {
    minWidth: 180,
    minHeight: 72,
    borderWidth: 3,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  typeValue: { fontSize: 40, fontFamily: font.black, textAlign: "center" },
  keypad: { flexDirection: "row", flexWrap: "wrap", width: 270, justifyContent: "center", marginBottom: 12 },
  key: { width: 80, height: 60, borderRadius: 18, borderWidth: 3, alignItems: "center", justifyContent: "center", marginHorizontal: 5, marginBottom: 4 },
  keyText: { fontSize: 26, fontFamily: font.black, color: KIT.creamInk },
  blanks: { flexWrap: "wrap", justifyContent: "center", marginBottom: 4 },
  blank: {
    width: 50,
    height: 58,
    borderWidth: 3,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    margin: 4,
  },
  blankLetter: { fontSize: 28, fontFamily: font.black },
  actions: { flexDirection: "row-reverse", justifyContent: "center", gap: 10, marginVertical: 14 },
  softAction: { flexDirection: "row-reverse", alignItems: "center", gap: 6, minHeight: 44, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 999, backgroundColor: KIT.cream, borderWidth: 2.5, borderColor: KIT.woodEdge, borderBottomColor: KIT.woodEdge },
  softActionText: { fontFamily: font.bold, fontSize: 15 },
  tiles: { flexWrap: "wrap", justifyContent: "center" },
  tile: { width: 58, height: 62, borderRadius: 16, borderWidth: 3, alignItems: "center", justifyContent: "center", marginHorizontal: 5, marginBottom: 5 },
  tileText: { fontSize: 30, fontFamily: font.black },
  correct: { width: "100%", alignItems: "center", borderRadius: 24, borderWidth: 3, borderColor: KIT.woodEdge, borderBottomWidth: 7, backgroundColor: KIT.cream, padding: 16, marginTop: 14 },
  correctHead: { flexDirection: "row-reverse", alignItems: "center", gap: 10 },
  correctTitle: { fontFamily: font.black, fontSize: 26 },
  correctTags: { flexDirection: "row-reverse", flexWrap: "wrap", justifyContent: "center", gap: 8, marginTop: 10 },
  tag: { borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12 },
  tagText: { fontFamily: font.bold, fontSize: 14 },
  advanceTrack: { alignSelf: "stretch", height: 12, borderRadius: 999, marginVertical: 14, overflow: "hidden", flexDirection: "row-reverse", backgroundColor: KIT.track },
  advanceFill: { height: 12, borderRadius: 999, backgroundColor: KIT.green },
  skip: { flexDirection: "row-reverse", alignItems: "center", gap: 10, minHeight: 52, paddingVertical: 8, paddingRight: 8, paddingLeft: 20, borderRadius: 999, backgroundColor: KIT.wood, borderWidth: 3, borderColor: KIT.woodEdge, borderBottomColor: KIT.woodEdge },
  skipIcon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  skipText: { fontFamily: font.heavy, fontSize: 16 },
  timeout: { fontSize: 30, fontFamily: font.black, marginTop: 20, textAlign: "center" },
  confetti: { position: "absolute", top: 0, left: 0, right: 0, height: 180 },
  confettiBit: { position: "absolute", width: 10, height: 18, borderRadius: 3 },
  confettiDot: { width: 12, height: 12, borderRadius: 6 },
  completeBadge: {
    width: 170,
    height: 170,
    borderRadius: 85,
    alignItems: "center",
    justifyContent: "flex-end",
    overflow: "hidden",
    marginTop: 10,
    backgroundColor: "rgba(255,255,255,0.7)",
    borderWidth: 5,
    borderColor: "#fff",
  },
  completeSign: { marginTop: -10, marginBottom: 10, maxWidth: "100%" },
  completeTitle: { fontFamily: font.black, fontSize: 32, textAlign: "center", marginTop: 16 },
  resultCard: { alignItems: "center", marginTop: 4 },
  resultDots: { flexDirection: "row-reverse", flexWrap: "wrap", justifyContent: "center", gap: 8 },
  resultDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderBottomWidth: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  resultLine: { fontFamily: font.heavy, fontSize: 17, marginTop: 12, textAlign: "center" },
  runStars: { flexDirection: "row-reverse", alignItems: "flex-end", gap: 6, marginTop: 8 },
  runStarMid: { marginBottom: 14 },
  starsLine: { fontFamily: font.heavy, fontSize: 15, marginTop: 6, textAlign: "center" },
  upgradeHint: {
    alignSelf: "stretch",
    backgroundColor: "#FFF6E6",
    borderBottomColor: WOOD_LIP,
    borderWidth: 3,
    borderColor: "#F1D9B3",
    borderRadius: 22,
    borderBottomWidth: 6,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: 14,
    alignItems: "center",
    gap: 4,
  },
  upgradeTrack: {
    alignSelf: "stretch",
    height: 10,
    borderRadius: 5,
    backgroundColor: "#F1D9B3",
    overflow: "hidden",
    flexDirection: "row-reverse",
    marginTop: 4,
  },
  upgradeFill: { height: 10, borderRadius: 5, backgroundColor: GOLD.base },
  upgradeHintTitle: { fontFamily: font.heavy, fontSize: 17, textAlign: "center" },
  upgradeHintBody: { fontFamily: font.bold, fontSize: 15, textAlign: "center" },
  upgradeHintNeed: { fontFamily: font.heavy, fontSize: 14, textAlign: "center" },
  upgrade: {
    width: "100%",
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 14,
    borderRadius: 24,
    borderWidth: 3,
    borderBottomWidth: 6,
    padding: 12,
    marginTop: 14,
  },
  upgradeArt: { width: 96, height: 96, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  upgradeTitle: { fontFamily: font.black, fontSize: 20, textAlign: "right" },
  upgradeSub: { fontFamily: font.heavy, fontSize: 16, textAlign: "right" },
  upgradeLink: { fontFamily: font.heavy, fontSize: 14, textAlign: "right" },
  statsRow: {
    alignSelf: "stretch",
    flexDirection: "row-reverse",
    alignItems: "center",
    borderTopWidth: 2,
    marginTop: 14,
    paddingTop: 14,
  },
  stat: { flex: 1, alignItems: "center" },
  statValueRow: { flexDirection: "row-reverse", alignItems: "center", gap: 6 },
  statValue: { fontFamily: font.black, fontSize: 26 },
  statLabel: { fontFamily: font.bold, fontSize: 13, marginTop: 2 },
  statDivider: { width: 2, height: 44, borderRadius: 1 },
  stackButtons: { width: "100%", gap: 12, marginTop: 18 },
  reportTitle: { fontFamily: font.black, fontSize: 28, textAlign: "center", marginTop: 8 },
  reportCard: { width: "100%", borderRadius: 22, borderWidth: 3, borderColor: KIT.woodEdge, borderBottomWidth: 7, backgroundColor: KIT.cream, padding: 14, marginBottom: 12 },
  reportHead: { flexDirection: "row-reverse", alignItems: "center", gap: 10 },
  reportNum: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  reportNumText: { fontFamily: font.black, fontSize: 16 },
  reportQ: { fontFamily: font.bold, fontSize: 13 },
  reportPrompt: { fontSize: 22, fontFamily: font.black, textAlign: "right", marginTop: 2 },
  reportAnswers: { flexDirection: "row-reverse", flexWrap: "wrap", gap: 8, marginTop: 10 },
  answerTag: { borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12 },
  answerTagText: { fontFamily: font.bold, fontSize: 14 },
  reportTap: { fontFamily: font.bold, fontSize: 13, marginTop: 10, textAlign: "right" },
  reportHint: { fontFamily: font.bold, textAlign: "center", marginBottom: 6 },
  reportStory: { fontFamily: font.medium, fontSize: 15, lineHeight: 24, textAlign: "right", marginBottom: 8 },
  reportWhy: { width: "100%", marginTop: 12, borderRadius: 16, padding: 14, alignItems: "center" },
  reportWhyText: { fontFamily: font.bold, textAlign: "center", fontSize: 15 },
});
