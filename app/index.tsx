import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Screen } from "../src/components/Screen";
import { useAuth } from "../src/context/AuthContext";
import { useProgress } from "../src/context/ProgressContext";
import { he } from "../src/i18n/he";
import { CATEGORY_COLORS, DIFFICULTY_COLORS, GOLD, OK, font } from "../src/theme/colors";
import { AvatarPreview } from "../src/components/AvatarPreview";
import { LeaderboardBoard } from "./leaderboard";
import { CategoryTile, Coin, DifficultyTile, Icon, Star } from "../src/components/Art";
import { PrimaryButton } from "../src/components/PrimaryButton";
import { Buddy, Card, CoinPill, ProgressBar, TopBar, useColors } from "../src/components/ui";
import { Building, buildingName, VillageScene } from "../src/components/VillageArt";
import { guideSteps, type GuideId, type GuideState } from "../src/game/path";
import type { ProfileDoc } from "../src/types/models";
import {
  LEVEL_STARS,
  currentBuild,
  clearPay,
  entryCost,
  isLessonUnlocked,
  lessonUnlockLevel,
  LESSON_PACKS,
  nextGoal,
  villageLevel,
  villageDetails,
  villageLevels,
} from "../src/game/village";
import { defaultAvatar } from "../src/game/avatar";
import {
  CONFIG,
  clearedStages,
  isStagePerfectClear,
  isStageUnlocked,
  parseCategory,
  parseDifficulty,
  type Category,
  type Difficulty,
} from "../src/game/config";

const DIFFICULTIES: Difficulty[] = ["easy", "mid", "hard"];
const HOME_TABS = ["village", "avatar", "scores"] as const;
type DockTab = (typeof HOME_TABS)[number];
type HomeTab = DockTab | "questions";
const TAB_UNLOCK: Partial<Record<DockTab, number>> = { avatar: 5, scores: 10 };

const GUIDE_COPY: Record<GuideId, { title: string; body: string }> = {
  learn: { title: he.startLearn, body: he.startLearnBody },
  reward: { title: he.startReward, body: he.startRewardBody },
  build: { title: he.startBuild, body: he.startBuildBody },
};

function GuideCard({ profile, onPlay }: { profile: ProfileDoc; onPlay: (category: Category) => void }) {
  const c = useColors();
  const steps = guideSteps(profile);
  const current = steps.find((step) => step.state === "now");
  const goal = nextGoal(profile);

  if (!current) {
    return (
      <View style={[styles.homeCard, { backgroundColor: c.surface, borderBottomColor: c.line }]}>
        <Text style={[styles.guideTitle, { color: c.ink }]}>{he.objectiveTitle}</Text>
        {goal ? (
          <>
            <Text style={[styles.guideBody, { color: c.ink }]}>{he.homeGoalTitle(buildingName(goal.category))}</Text>
            <Text style={[styles.guideBody, { color: CATEGORY_COLORS[goal.category].deep }]}>
              {he.homeGoal(goal.need, he.milestoneName[goal.id])}
            </Text>
            <Text style={[styles.guideHint, { color: c.soft }]}>{he.milestoneBonus[goal.id]}</Text>
            <PrimaryButton
              label={he.homeBuildCta}
              color={CATEGORY_COLORS[goal.category].base}
              onPress={() => onPlay(goal.category)}
              style={styles.goalBtn}
            />
          </>
        ) : (
          <Text style={[styles.guideBody, { color: c.ink }]}>{he.homeGoalDone}</Text>
        )}
      </View>
    );
  }

  const playCategory = current.id === "build" && goal ? goal.category : "language";
  return (
    <View style={[styles.homeCard, { backgroundColor: c.surface, borderBottomColor: c.line }]}>
      <Text style={[styles.guideTitle, { color: c.ink }]}>{he.startTitle}</Text>
      <Text style={[styles.guideHint, { color: c.soft }]}>{he.startLead}</Text>
      {steps.map((step) => (
        <GuideRow key={step.id} n={step.n} state={step.state} title={GUIDE_COPY[step.id].title} body={GUIDE_COPY[step.id].body} />
      ))}
      <PrimaryButton
        label={current.id === "learn" ? he.startCta : he.homeBuildCta}
        onPress={() => onPlay(playCategory)}
        style={styles.goalBtn}
      />
    </View>
  );
}

function GuideRow({ n, state, title, body }: { n: number; state: GuideState; title: string; body: string }) {
  const c = useColors();
  const done = state === "done";
  const now = state === "now";
  const dot = done ? OK.base : now ? c.primary : c.line;
  const fg = done || now ? "#fff" : c.soft;
  return (
    <View style={[styles.guideStep, now && { backgroundColor: c.primaryTint }]}>
      <View style={{ flex: 1, alignItems: "flex-end" }}>
        <Text style={[styles.guideStepTitle, { color: now || done ? c.ink : c.soft }]}>{title}</Text>
        <Text style={[styles.guideHint, { color: c.soft }]}>{body}</Text>
      </View>
      <View style={[styles.guideDot, { backgroundColor: dot }]}>
        {done ? <Icon name="check" size={16} color={fg} /> : <Text style={[styles.guideNum, { color: fg }]}>{n}</Text>}
      </View>
    </View>
  );
}

const HOUSE_STEPS = [
  { level: 1, id: "tent" },
  { level: 2, id: "hut" },
  { level: 3, id: "house" },
  { level: 4, id: "fancy" },
] as const;

function VillageGrow({
  category,
  selected,
  onSelect,
}: {
  category: Category;
  selected: number;
  onSelect: (level: number) => void;
}) {
  const c = useColors();
  return (
    <View style={[styles.grow, { backgroundColor: c.ground }]}>
      <Text style={[styles.growTitle, { color: c.ink }]}>{he.villageGrowTitle}</Text>
      <View style={styles.growRow}>
        {HOUSE_STEPS.map((step) => {
          const on = step.level === selected;
          return (
            <Pressable
              key={step.id}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              accessibilityLabel={he.milestoneName[step.id]}
              onPress={() => onSelect(step.level)}
              style={({ pressed }) => [
                styles.growStep,
                on && { backgroundColor: c.primaryTint },
                pressed && { opacity: 0.75 },
              ]}
            >
              <Building category={category} level={step.level} size={44} />
              <Text style={[styles.growName, { color: on ? c.ink : c.soft }]} numberOfLines={2}>
                {he.milestoneName[step.id]}
              </Text>
              <View style={styles.growStars}>
                <Star size={12} />
                <Text style={[styles.growStarText, { color: c.ink }]}>{LEVEL_STARS[step.level - 1]}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string; level?: string }>();
  const { signOut, isLocal } = useAuth();
  const { active, loading, spendCoins, upgradeVillage } = useProgress();
  const [category, setCategory] = useState<Category | null>(
    params.category ? parseCategory(params.category) : null,
  );
  const [difficulty, setDifficulty] = useState<Difficulty | null>(
    params.level ? parseDifficulty(params.level) : null,
  );
  const c = useColors();
  const [sceneWidth, setSceneWidth] = useState(0);
  const [tab, setTab] = useState<HomeTab>("village");
  const [lockHint, setLockHint] = useState<string | null>(null);
  const [hintOpacity, setHintOpacity] = useState(0);
  const hintFrame = useRef(0);

  useEffect(() => () => cancelAnimationFrame(hintFrame.current), []);

  const showLockHint = (label: string) => {
    cancelAnimationFrame(hintFrame.current);
    setLockHint(label);
    setHintOpacity(1);
    const started = performance.now();
    const hold = 1200;
    const fade = 600;
    const tick = (now: number) => {
      const elapsed = now - started;
      if (elapsed < hold) {
        hintFrame.current = requestAnimationFrame(tick);
        return;
      }
      const t = Math.min(1, (elapsed - hold) / fade);
      setHintOpacity(1 - t);
      if (t < 1) hintFrame.current = requestAnimationFrame(tick);
      else {
        setLockHint(null);
        setHintOpacity(0);
      }
    };
    hintFrame.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    setCategory(params.category ? parseCategory(params.category) : null);
    setDifficulty(params.level ? parseDifficulty(params.level) : null);
  }, [params.category, params.level]);

  useEffect(() => {
    if (category && !isLessonUnlocked(villageLevel(active), category)) {
      setCategory(null);
      setDifficulty(null);
      setTab("questions");
    }
  }, [category, active]);

  const start = (stage: number) => {
    if (!category || !difficulty) return;
    if (!isLessonUnlocked(villageLevel(active), category)) return;
    const cost = entryCost(active, category, difficulty, stage);
    void (async () => {
      if (cost > 0 && !(await spendCoins(cost))) return;
      router.push({ pathname: "/game", params: { level: difficulty, category, stage: String(stage) } });
    })();
  };

  const coinPill = <CoinPill coins={active.coins} onPress={() => router.push("/shop")} />;

  if (loading) {
    return (
      <Screen>
        <Buddy size={120} body={c.primary} />
        <Text style={[styles.loading, { color: c.ink }]}>{he.appName}</Text>
      </Screen>
    );
  }

  if (!category) {
    const build = currentBuild(active);
    const level = villageLevel(active);
    const tabLabel: Record<DockTab, string> = {
      village: he.homeVillage,
      scores: he.navLeaderboard,
      avatar: he.homeAvatar,
    };
    const tabIcon: Record<DockTab, "home" | "trophy" | "user"> = {
      village: "home",
      scores: "trophy",
      avatar: "user",
    };
    const dock = (
      <View>
        {lockHint ? (
          <Text style={[styles.lockHint, { color: c.soft, opacity: hintOpacity }]}>{lockHint}</Text>
        ) : null}
        <View style={[styles.dock, { backgroundColor: c.surface, borderBottomColor: c.line }]}>
          {HOME_TABS.map((id) => {
            const need = TAB_UNLOCK[id];
            const locked = need != null && level < need;
            const on = tab === id;
            const lockedLabel = id === "avatar" ? he.unlockAvatar(need ?? 0) : he.unlockScores(need ?? 0);
            return (
              <Pressable
                key={id}
                accessibilityRole="tab"
                accessibilityLabel={locked ? lockedLabel : tabLabel[id]}
                accessibilityState={{ selected: on, disabled: locked }}
                onPress={() => {
                  if (locked) {
                    showLockHint(lockedLabel);
                    return;
                  }
                  cancelAnimationFrame(hintFrame.current);
                  setLockHint(null);
                  setTab(id);
                }}
                style={[styles.dockTab, on && { backgroundColor: c.primaryTint }]}
              >
                <View style={styles.dockIcon}>
                  <View style={locked ? { opacity: 0.45 } : undefined}>
                    <Icon name={tabIcon[id]} size={26} color={on ? c.primary : c.soft} />
                  </View>
                  {locked ? (
                    <View style={[styles.lockBadge, { backgroundColor: c.surface, borderColor: c.line }]}>
                      <Icon name="lock" size={11} color={c.ink} weight={2.6} />
                    </View>
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
    return (
      <Screen footer={dock}>
        <View style={styles.helloBar}>
          <View style={styles.helloLeft}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={he.navProfile}
              onPress={() => router.push("/profile")}
              style={({ pressed }) => [pressed && { opacity: 0.8 }]}
            >
              <AvatarPreview loadout={active.avatar ?? defaultAvatar()} size={52} showGear={false} />
            </Pressable>
            {tab === "avatar" ? coinPill : null}
          </View>
          <View style={styles.helloRight}>
            {tab === "village" ? <CoinPill coins={active.coins} onPress={() => router.push("/village")} /> : null}
            <View style={styles.helloWho}>
              <Text style={[styles.helloSmall, { color: c.soft }]}>{he.hello}</Text>
              <Text style={[styles.helloName, { color: c.ink }]} numberOfLines={1}>
                {active.displayName}
              </Text>
            </View>
          </View>
        </View>

        {tab === "questions" ? (
          <>
            <Text style={[styles.section, { color: c.ink }]}>{he.pickCategory}</Text>
            <View style={styles.grid}>
              {LESSON_PACKS.map((cat) => {
                const done = DIFFICULTIES.reduce((sum, d) => sum + clearedStages(active.stageClears, cat, d), 0);
                const open = isLessonUnlocked(level, cat);
                return (
                  <SubjectCard
                    key={cat}
                    category={cat}
                    done={done}
                    total={CONFIG.miniLevels * DIFFICULTIES.length}
                    locked={!open}
                    unlockLevel={lessonUnlockLevel(cat)}
                    onPress={() => {
                      if (open) setCategory(cat);
                    }}
                  />
                );
              })}
            </View>
          </>
        ) : null}

        {tab === "village" ? (
          <>
          <View style={[styles.homeCard, { backgroundColor: c.surface, borderBottomColor: c.line }]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${he.villageMine} · ${he.villageLevelLabel(level)}`}
              onPress={() => router.push("/village")}
              onLayout={(e) => setSceneWidth(e.nativeEvent.layout.width)}
              style={({ pressed }) => [styles.scene, pressed && { opacity: 0.85 }]}
            >
              {sceneWidth > 0 ? (
                <VillageScene
                  levels={villageLevels(active)}
                  details={villageDetails(active)}
                  blooms={active.villageBlooms ?? 0}
                  litCategory={build?.category ?? null}
                  width={sceneWidth}
                  aspect={0.66}
                />
              ) : null}
              <View pointerEvents="none" style={[styles.levelSign, { backgroundColor: GOLD.tint, borderBottomColor: GOLD.lip }]}>
                <Text style={[styles.levelWord, { color: GOLD.deep }]}>{he.villageLevelWord}</Text>
                <View style={[styles.levelMark, { backgroundColor: GOLD.base, borderBottomColor: GOLD.lip }]}>
                  <Text style={styles.levelNum}>{level}</Text>
                </View>
              </View>
            </Pressable>
          </View>
          {build ? (
            <>
              <PrimaryButton
                label={he.upgradeFor(buildingName(build.category), build.cost)}
                variant="soft"
                disabled={active.coins < build.cost}
                onPress={() => {
                  void upgradeVillage();
                }}
                style={styles.upgradeBtn}
              />
            </>
          ) : null}
          <PrimaryButton label={he.homePlay} onPress={() => setTab("questions")} style={styles.playBtn} />
          </>
        ) : null}

        {tab === "scores" ? <LeaderboardBoard /> : null}

        {tab === "avatar" ? (
          <>
            <View style={[styles.avatarCard, { backgroundColor: c.surface, borderBottomColor: c.line }]}>
              <AvatarPreview loadout={active.avatar ?? defaultAvatar()} size={170} />
              <Text style={[styles.avatarName, { color: c.ink }]}>{active.displayName}</Text>
              <PrimaryButton label={he.homeDress} icon="bag" onPress={() => router.push("/shop")} style={styles.goalBtn} />
            </View>
            {isLocal ? <Text style={[styles.localHint, { color: c.soft }]}>{he.coinsLocalOnly}</Text> : null}
            <Pressable onPress={() => signOut()} style={styles.logout}>
              <Icon name="logout" size={18} color={c.soft} />
              <Text style={[styles.logoutText, { color: c.soft }]}>{he.logout}</Text>
            </Pressable>
          </>
        ) : null}
      </Screen>
    );
  }

  const chip = (
    <View style={[styles.chip, { backgroundColor: c.surface, borderBottomColor: c.line }]}>
      <CategoryTile category={category} size={32} />
      <Text style={[styles.chipText, { color: c.ink }]} numberOfLines={1}>
        {difficulty ? `${categoryLabel(category)} · ${difficultyLabel(difficulty)}` : categoryLabel(category)}
      </Text>
    </View>
  );

  if (!difficulty) {
    return (
      <Screen>
        <TopBar
          onBack={() => {
            setCategory(null);
            router.replace("/");
          }}
          backLabel={he.backLabel}
          center={chip}
          trailing={coinPill}
        />
        <Text style={[styles.section, styles.sectionCenter, { color: c.ink }]}>{he.pickDifficulty}</Text>
        <View style={styles.levels}>
          {DIFFICULTIES.map((d) => {
            const cleared = clearedStages(active.stageClears, category, d);
            const sw = DIFFICULTY_COLORS[d];
            return (
              <Pressable
                key={d}
                onPress={() => setDifficulty(d)}
                style={({ pressed }) => [
                  styles.levelCard,
                  {
                    backgroundColor: c.surface,
                    borderBottomColor: c.line,
                    borderBottomWidth: pressed ? 2 : 5,
                    marginTop: pressed ? 3 : 0,
                  },
                ]}
              >
                <DifficultyTile difficulty={d} size={58} />
                <View style={styles.levelCopy}>
                  <Text style={[styles.cardTitle, { color: c.ink }]}>{difficultyLabel(d)}</Text>
                  <Text style={[styles.cardDesc, { color: c.soft }]}>{levelDesc(category, d)}</Text>
                  <View style={styles.payRow}>
                    <Coin size={18} />
                    <Text style={[styles.payText, { color: GOLD.deep }]}>{he.difficultyPay(clearPay(d))}</Text>
                  </View>
                  <View style={styles.levelProgress}>
                    <Text style={[styles.fraction, { color: c.soft }]}>{he.fraction(cleared, CONFIG.miniLevels)}</Text>
                    <View style={{ flex: 1 }}>
                      <ProgressBar pct={(cleared / CONFIG.miniLevels) * 100} color={sw.base} />
                    </View>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      </Screen>
    );
  }

  const cleared = clearedStages(active.stageClears, category, difficulty);
  return (
    <Screen>
      <TopBar
        onBack={() => {
          setDifficulty(null);
          router.replace({ pathname: "/", params: { category } });
        }}
        backLabel={he.backLabel}
        center={chip}
        trailing={coinPill}
      />
      <Card style={styles.progressCard}>
        <View style={styles.progressHead}>
          <Text style={[styles.progressTitle, { color: c.ink }]}>{he.yourProgress}</Text>
          <Text style={[styles.progressSub, { color: c.soft }]}>{he.stagesDone(cleared, CONFIG.miniLevels)}</Text>
        </View>
        <ProgressBar pct={(cleared / CONFIG.miniLevels) * 100} color={CATEGORY_COLORS[category].base} height={10} />
      </Card>

      <View style={styles.map}>
        {Array.from({ length: CONFIG.miniLevels }, (_, i) => i + 1).map((stage) => {
          const unlocked = isStageUnlocked(active.stageClears, category, difficulty, stage);
          const done = cleared >= stage;
          const perfect =
            done && isStagePerfectClear(active.stagePerfect, active.stageCoins, category, difficulty, stage);
          return (
            <StageNode
              key={stage}
              stage={stage}
              state={!unlocked ? "locked" : perfect ? "perfect" : done ? "partial" : "current"}
              onPress={() => start(stage)}
            />
          );
        })}
      </View>
    </Screen>
  );
}

const ZIGZAG = [0, -72, -104, -72, 0, 72, 104, 72, 0, -72];

function StageNode({
  stage,
  state,
  onPress,
}: {
  stage: number;
  state: "locked" | "perfect" | "partial" | "current";
  onPress: () => void;
}) {
  const c = useColors();
  const offset = ZIGZAG[(stage - 1) % ZIGZAG.length];
  const size = state === "current" ? 70 : state === "locked" ? 52 : 58;
  const fill =
    state === "perfect"
      ? OK
      : state === "partial"
        ? GOLD
        : state === "current"
          ? { base: c.primary, lip: c.primaryLip }
          : { base: "#DCE6F2", lip: "#C3D1E3" };
  // Side labels go toward the screen center so they never clip.
  const side = offset <= 0 ? { left: size + 12 } : { right: size + 12 };
  const align = offset <= 0 ? "flex-start" : "flex-end";
  const otherSide = offset <= 0 ? { right: size + 6 } : { left: size + 6 };

  return (
    <View style={styles.mapRow}>
      <View style={{ width: size, height: size, transform: [{ translateX: offset }] }}>
        {state === "current" ? (
          <View style={[styles.halo, { backgroundColor: c.primaryTint, top: -11, left: -11, width: size + 22, height: size + 22, borderRadius: (size + 22) / 2 }]} />
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={state === "locked" ? `${he.stageLabel(stage)} · ${he.stageLocked}` : he.stageLabel(stage)}
          disabled={state === "locked"}
          onPress={onPress}
          style={({ pressed }) => [
            styles.node,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: fill.base,
              borderBottomColor: fill.lip,
              borderBottomWidth: pressed ? 2 : 5,
              marginTop: pressed ? 3 : 0,
            },
          ]}
        >
          {state === "perfect" ? (
            <Star size={28} fill="#fff" stroke="#fff" />
          ) : state === "partial" ? (
            <Icon name="check" size={28} color="#fff" weight={3.4} />
          ) : state === "current" ? (
            <Text style={styles.nodeNum}>{stage}</Text>
          ) : (
            <View style={{ alignItems: "center" }}>
              <Icon name="lock" size={18} color="#8C9BB5" weight={2.4} />
              <Text style={styles.nodeLockedNum}>{stage}</Text>
            </View>
          )}
        </Pressable>

        {state === "perfect" ? (
          <View style={[styles.sideLabel, side, { alignItems: align, top: size / 2 - 11 }]}>
            <Text style={[styles.sideText, { color: OK.deep }]}>{he.stagePerfectBadge}</Text>
          </View>
        ) : null}
        {state === "partial" ? (
          <View style={[styles.sideLabel, side, { alignItems: align, top: size / 2 - 18 }]}>
            <Pressable
              onPress={onPress}
              style={[styles.retryPill, { backgroundColor: c.surface, borderBottomColor: c.line }]}
            >
              <Icon name="replay" size={14} color={GOLD.deep} weight={2.6} />
              <Text style={[styles.sideText, { color: GOLD.deep }]}>
                {he.stagePartialBadge} · {he.stageRetry}
              </Text>
            </Pressable>
          </View>
        ) : null}
        {state === "current" ? (
          <>
            <View style={[styles.sideLabel, side, { alignItems: align, top: size / 2 - 12 }]}>
              <Text style={[styles.startText, { color: c.primary }]}>{he.stageStart}</Text>
            </View>
            <View style={[styles.mascotPeek, otherSide]}>
              <Buddy size={54} body={c.primary} />
            </View>
          </>
        ) : null}
      </View>
    </View>
  );
}

function SubjectCard({
  category,
  done,
  total,
  locked,
  unlockLevel,
  onPress,
}: {
  category: Category;
  done: number;
  total: number;
  locked?: boolean;
  unlockLevel?: number;
  onPress: () => void;
}) {
  const sw = CATEGORY_COLORS[category];
  const c = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: locked }}
      accessibilityLabel={locked && unlockLevel ? `${categoryLabel(category)} · ${he.unlockAt(unlockLevel)}` : categoryLabel(category)}
      onPress={locked ? undefined : onPress}
      style={({ pressed }) => [
        styles.subject,
        {
          backgroundColor: sw.tint,
          borderBottomColor: sw.lip,
          borderBottomWidth: pressed && !locked ? 2 : 5,
          marginTop: pressed && !locked ? 3 : 0,
          opacity: locked ? 0.55 : 1,
        },
      ]}
    >
      <View>
        <CategoryTile category={category} size={52} />
        {locked ? (
          <View style={[styles.subjectLock, { backgroundColor: c.surface, borderColor: c.line }]}>
            <Icon name="lock" size={12} color={c.ink} weight={2.6} />
          </View>
        ) : null}
      </View>
      <Text style={[styles.cardTitle, { color: sw.deep, textAlign: "center" }]} numberOfLines={1}>
        {categoryLabel(category)}
      </Text>
      <Text style={[styles.fraction, { color: sw.deep, textAlign: "center" }]}>
        {locked && unlockLevel ? he.unlockAt(unlockLevel) : he.stagesDone(done, total)}
      </Text>
    </Pressable>
  );
}

function difficultyLabel(d: Difficulty) {
  if (d === "mid") return he.mid;
  if (d === "hard") return he.hard;
  return he.easy;
}

function categoryLabel(category: Category) {
  if (category === "math") return he.categoryMath;
  if (category === "english") return he.categoryEnglish;
  if (category === "logic") return he.categoryLogic;
  if (category === "science") return he.categoryScience;
  if (category === "reading") return he.categoryReading;
  return he.categoryLanguage;
}

function levelDesc(category: Category, level: Difficulty) {
  if (category === "math") {
    if (level === "easy") return he.mathEasyDesc;
    if (level === "mid") return he.mathMidDesc;
    return he.mathHardDesc;
  }
  if (category === "english") {
    if (level === "easy") return he.englishEasyDesc;
    if (level === "mid") return he.englishMidDesc;
    return he.englishHardDesc;
  }
  if (category === "logic") {
    if (level === "easy") return he.logicEasyDesc;
    if (level === "mid") return he.logicMidDesc;
    return he.logicHardDesc;
  }
  if (category === "science") {
    if (level === "easy") return he.scienceEasyDesc;
    if (level === "mid") return he.scienceMidDesc;
    return he.scienceHardDesc;
  }
  if (category === "reading") {
    if (level === "easy") return he.readingEasyDesc;
    if (level === "mid") return he.readingMidDesc;
    return he.readingHardDesc;
  }
  if (level === "easy") return he.easyDesc;
  if (level === "mid") return he.midDesc;
  return he.hardDesc;
}

const styles = StyleSheet.create({
  loading: { fontSize: 28, fontFamily: font.black, marginTop: 16 },
  helloBar: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  helloLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  helloRight: { marginLeft: "auto", flexDirection: "row", alignItems: "center", gap: 10 },
  helloWho: { alignItems: "flex-end", flexShrink: 1 },
  helloSmall: { fontSize: 13, fontFamily: font.medium },
  helloName: { fontSize: 22, fontFamily: font.heavy, maxWidth: 180, textAlign: "right" },
  dock: {
    flexDirection: "row-reverse",
    width: "100%",
    borderRadius: 28,
    borderBottomWidth: 5,
    padding: 6,
    gap: 6,
  },
  dockTab: { flex: 1, minHeight: 52, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  dockIcon: { width: 34, height: 34, alignItems: "center", justifyContent: "center" },
  lockBadge: {
    position: "absolute",
    left: -1,
    bottom: -1,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  lockHint: { fontFamily: font.heavy, fontSize: 14, textAlign: "center", marginBottom: 8 },
  playBtn: { alignSelf: "stretch", marginTop: 8, minHeight: 64 },
  upgradeBtn: { alignSelf: "stretch", marginTop: 12, minHeight: 56 },
  homeCard: { width: "100%", borderRadius: 28, borderBottomWidth: 6, padding: 14, gap: 12 },
  levelSign: {
    position: "absolute",
    top: 10,
    alignSelf: "center",
    zIndex: 2,
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    borderRadius: 999,
    borderBottomWidth: 4,
    paddingVertical: 4,
    paddingLeft: 6,
    paddingRight: 14,
  },
  levelWord: { fontFamily: font.heavy, fontSize: 15 },
  levelMark: {
    minWidth: 32,
    height: 32,
    borderRadius: 16,
    borderBottomWidth: 3,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  levelNum: { fontFamily: font.black, fontSize: 18, color: "#fff", lineHeight: 22 },
  guideTitle: { fontFamily: font.heavy, fontSize: 20, textAlign: "right" },
  guideBody: { fontFamily: font.medium, fontSize: 15, textAlign: "right" },
  guideHint: { fontFamily: font.medium, fontSize: 13, textAlign: "right" },
  guideStep: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 16, paddingVertical: 6, paddingHorizontal: 8 },
  guideStepTitle: { fontFamily: font.heavy, fontSize: 16, textAlign: "right" },
  guideDot: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  guideNum: { fontFamily: font.heavy, fontSize: 14 },
  avatarCard: { width: "100%", borderRadius: 28, borderBottomWidth: 6, padding: 18, alignItems: "center", marginTop: 8 },
  avatarName: { fontFamily: font.black, fontSize: 26, marginTop: 8, marginBottom: 12, textAlign: "center" },
  wish: { flexDirection: "row-reverse", alignItems: "center", gap: 10, borderRadius: 18, padding: 8 },
  wishText: { fontFamily: font.heavy, fontSize: 15, textAlign: "right" },
  wishCta: { fontFamily: font.bold, fontSize: 13, textAlign: "right", marginTop: 2 },
  meRow: { flexDirection: "row-reverse", alignItems: "center", gap: 12 },
  meAvatar: { alignItems: "center", gap: 4 },
  dressPill: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 4,
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  dressText: { fontFamily: font.heavy, fontSize: 13 },
  bubble: { flex: 1, borderRadius: 20, padding: 12, alignItems: "flex-end", gap: 4 },
  bubbleTail: {
    position: "absolute",
    right: -10,
    top: 30,
    width: 0,
    height: 0,
    borderTopWidth: 10,
    borderBottomWidth: 10,
    borderLeftWidth: 12,
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
  },
  grow: { width: "100%", borderRadius: 18, padding: 12, gap: 8, overflow: "hidden" },
  growTitle: { fontFamily: font.heavy, fontSize: 16, textAlign: "right" },
  growRow: { width: "100%", flexDirection: "row-reverse", justifyContent: "space-between", minWidth: 0 },
  growStep: { flex: 1, minWidth: 0, alignItems: "center", borderRadius: 16, paddingVertical: 4, paddingHorizontal: 2, overflow: "hidden" },
  growName: { width: "100%", fontFamily: font.heavy, fontSize: 11, textAlign: "center", marginTop: 2 },
  growStars: { flexDirection: "row", alignItems: "center", gap: 2 },
  growStarText: { fontFamily: font.bold, fontSize: 12 },
  ownedGroup: { alignSelf: "stretch", alignItems: "flex-end", gap: 2 },
  goalHead: { flexDirection: "row-reverse", alignItems: "center", gap: 6 },
  goalTitle: { fontFamily: font.heavy, fontSize: 16, textAlign: "right", flexShrink: 1 },
  goalText: { fontFamily: font.bold, fontSize: 14, textAlign: "right" },
  goalBtn: { alignSelf: "stretch", marginTop: 6 },
  scene: { width: "100%" },
  localHint: { fontFamily: font.medium, fontSize: 13, textAlign: "center", marginTop: 10 },
  section: {
    alignSelf: "stretch",
    fontSize: 20,
    fontFamily: font.heavy,
    textAlign: "right",
    marginTop: 20,
    marginBottom: 12,
  },
  sectionCenter: { textAlign: "center", marginTop: 6 },
  grid: { width: "100%", flexDirection: "row-reverse", flexWrap: "wrap", justifyContent: "space-between" },
  subject: {
    width: "48%",
    borderRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginBottom: 14,
    alignItems: "center",
    gap: 8,
  },
  subjectLock: {
    position: "absolute",
    left: -4,
    bottom: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: { fontSize: 19, fontFamily: font.heavy, textAlign: "right" },
  cardDesc: { fontSize: 13, fontFamily: font.medium, textAlign: "right", lineHeight: 18 },
  fraction: { fontSize: 12, fontFamily: font.bold },
  logout: { flexDirection: "row-reverse", alignItems: "center", gap: 6, marginTop: 22, padding: 10 },
  logoutText: { fontFamily: font.bold, fontSize: 14 },
  chip: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    borderRadius: 999,
    borderBottomWidth: 3,
    paddingVertical: 5,
    paddingLeft: 14,
    paddingRight: 6,
    maxWidth: "100%",
  },
  chipText: { fontFamily: font.heavy, fontSize: 16, flexShrink: 1 },
  levels: { width: "100%" },
  levelCard: {
    width: "100%",
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 14,
    borderRadius: 24,
    padding: 16,
    marginBottom: 14,
  },
  levelCopy: { flex: 1, alignItems: "flex-end", gap: 3 },
  payRow: { flexDirection: "row-reverse", alignItems: "center", gap: 6, marginTop: 2 },
  payText: { fontFamily: font.heavy, fontSize: 14 },
  levelProgress: { alignSelf: "stretch", flexDirection: "row-reverse", alignItems: "center", gap: 8, marginTop: 8 },
  progressCard: { gap: 8, paddingVertical: 12 },
  progressHead: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center" },
  progressTitle: { fontFamily: font.bold, fontSize: 15 },
  progressSub: { fontFamily: font.bold, fontSize: 14 },
  map: { width: "100%", marginTop: 18, paddingBottom: 10 },
  mapRow: { height: 84, width: "100%", alignItems: "center", justifyContent: "center" },
  halo: { position: "absolute" },
  node: { alignItems: "center", justifyContent: "center" },
  nodeNum: { color: "#fff", fontFamily: font.black, fontSize: 28 },
  nodeLockedNum: { color: "#8C9BB5", fontFamily: font.heavy, fontSize: 11 },
  sideLabel: { position: "absolute", width: 170 },
  sideText: { fontFamily: font.heavy, fontSize: 13 },
  startText: { fontFamily: font.black, fontSize: 17 },
  retryPill: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 5,
    borderRadius: 999,
    borderBottomWidth: 3,
    paddingVertical: 7,
    paddingHorizontal: 11,
  },
  mascotPeek: { position: "absolute", top: -6 },
});
