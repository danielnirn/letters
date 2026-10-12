import { useEffect, useRef, useState, type ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Svg from "react-native-svg";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ForestScreen, ForestStage, NIGHT, WoodSign } from "../src/components/Forest";
import { BuiltPopup } from "../src/components/BuiltPopup";
import { useAuth } from "../src/context/AuthContext";
import { useProgress } from "../src/context/ProgressContext";
import { he } from "../src/i18n/he";
import { CATEGORY_COLORS, DIFFICULTY_COLORS, GOLD, OK, font } from "../src/theme/colors";
import { AvatarPreview } from "../src/components/AvatarPreview";
import { LeaderboardBoard } from "./leaderboard";
import { CategoryTile, Coin, DifficultyTile, Icon, Star } from "../src/components/Art";
import { PrimaryButton } from "../src/components/PrimaryButton";
import { Buddy, CoinPill, ProgressBar, StarPill, TopBar, useColors } from "../src/components/ui";
import { CoinPot, Chest, MushroomG, SkyScene } from "../src/components/HomeArt";
import { HowToPlay } from "../src/components/HowToPlay";
import { StageMap, type StageNodeState } from "../src/components/StageMap";
import { Building, buildingName, buildingThe } from "../src/components/VillageArt";
import { guideSteps, type GuideId, type GuideState } from "../src/game/path";
import type { ProfileDoc } from "../src/types/models";
import {
  LEVEL_STARS,
  buildingCoinBonus,
  currentBuild,
  clearPay,
  ownedLevel,
  entryCost,
  isLessonUnlocked,
  nextLessonPickLevel,
  openedLessons,
  pendingLessonPick,
  FEATURE_UNLOCK,
  LESSON_PACKS,
  nextGoal,
  stageStars,
  categoryStars,
  totalStars,
  VILLAGE_ORDER,
  villageLevel,
  villageDetails,
  villageLevels,
} from "../src/game/village";
import { defaultAvatar } from "../src/game/avatar";
import {
  CONFIG,
  clearedStages,
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
  const { active, loading, spendCoins, upgradeVillage, openLesson } = useProgress();
  const [category, setCategory] = useState<Category | null>(
    params.category ? parseCategory(params.category) : null,
  );
  const [difficulty, setDifficulty] = useState<Difficulty | null>(
    params.level ? parseDifficulty(params.level) : null,
  );
  const c = useColors();
  const [tab, setTab] = useState<HomeTab>("village");
  const insets = useSafeAreaInsets();
  const { height: winH } = useWindowDimensions();
  const [shellWidth, setShellWidth] = useState(360);
  const [rootSize, setRootSize] = useState({ w: 0, h: 0 });
  const [howTo, setHowTo] = useState(false);
  const [lockHint, setLockHint] = useState<string | null>(null);
  const [hintPlace, setHintPlace] = useState<"top" | "stages">("top");
  const homeLevel = villageLevel(active);
  const prevHomeLevel = useRef(homeLevel);
  const [levelPop, setLevelPop] = useState(false);

  useEffect(() => {
    if (homeLevel > prevHomeLevel.current) {
      setLevelPop(true);
      const t = setTimeout(() => setLevelPop(false), 900);
      prevHomeLevel.current = homeLevel;
      return () => clearTimeout(t);
    }
    prevHomeLevel.current = homeLevel;
  }, [homeLevel]);
  const [hintOpacity, setHintOpacity] = useState(0);
  const hintFrame = useRef(0);
  const [built, setBuilt] = useState<{ category: Category; level: number; gift: number; village: number } | null>(null);

  useEffect(
    () => () => {
      cancelAnimationFrame(hintFrame.current);
    },
    [],
  );

  const showLockHint = (label: string, place: "top" | "stages" = "top") => {
    cancelAnimationFrame(hintFrame.current);
    setHintPlace(place);
    setLockHint(label);
    setHintOpacity(1);
    const started = performance.now();
    const hold = 2400;
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
    if (category && !isLessonUnlocked(active, category)) {
      setCategory(null);
      setDifficulty(null);
      setTab("questions");
    }
  }, [category, active]);

  useEffect(() => {
    if (loading || howToSeen) return;
    const played = Object.values(active.stageClears ?? {}).some((n) => n > 0);
    if (!played) setHowTo(true);
    else howToSeen = true;
  }, [loading, active.stageClears]);

  const start = (stage: number) => {
    if (!category || !difficulty) return;
    if (!isLessonUnlocked(active, category)) return;
    const cost = entryCost(active, category, difficulty, stage);
    void (async () => {
      if (cost > 0 && !(await spendCoins(cost))) return;
      router.push({ pathname: "/game", params: { level: difficulty, category, stage: String(stage) } });
    })();
  };

  const coinPill = <CoinPill coins={active.coins} onPress={() => router.push("/shop")} />;

  if (loading) {
    return (
      <ForestScreen>
        <View style={styles.loadingBox}>
          <Buddy size={120} body={c.primary} />
          <WoodSign text={he.appName} big />
        </View>
      </ForestScreen>
    );
  }

  if (!category) {
    const build = currentBuild(active);
    const level = villageLevel(active);
    const heroCat = build?.category ?? VILLAGE_ORDER[0];
    const heroLevel = ownedLevel(active, heroCat);
    const unlock = nextUnlock(active, level);
    const canBuild = !!build && active.coins >= build.cost;
    const isLocked = (id: DockSlot) => {
      const need = DOCK_UNLOCK[id];
      return need != null && level < need;
    };
    const openSlot = (id: DockSlot) => {
      if (isLocked(id)) {
        showLockHint(id === "scores" ? he.unlockScores(DOCK_UNLOCK[id] ?? 0) : he.unlockAvatar(DOCK_UNLOCK[id] ?? 0));
        return;
      }
      cancelAnimationFrame(hintFrame.current);
      setLockHint(null);
      if (id === "shop") router.push("/shop");
      else if (id === "map") router.push("/village");
      else setTab(id === "home" ? "village" : id);
    };
    const doBuild = () => {
      if (!build) return;
      if (!canBuild) {
        showLockHint(he.upgradeShort(build.cost - active.coins), "top");
        return;
      }
      const cat = build.category;
      const lvl = ownedLevel(active, cat) + 1;
      const gift = buildingCoinBonus(lvl);
      void (async () => {
        if (await upgradeVillage()) setBuilt({ category: cat, level: lvl, gift, village: villageLevel(active) + 1 });
      })();
    };
    const heroSize = Math.min(shellWidth * 0.78, 300, winH * 0.36);

    const hud = (
      <View style={styles.hud}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={he.navProfile}
          onPress={() => router.push("/profile")}
          style={({ pressed }) => [styles.hudAvatar, pressed && { opacity: 0.85 }]}
        >
          <AvatarPreview loadout={active.avatar ?? defaultAvatar()} size={50} showGear={false} />
        </Pressable>
        <View style={styles.hudPills}>
          <CoinPill coins={active.coins} onPress={() => router.push("/village")} />
          {SHOW_STAR_PILL ? <StarPill stars={totalStars(active)} /> : null}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={he.navProfile}
          onPress={() => router.push("/profile")}
          style={({ pressed }) => [
            styles.gear,
            { borderBottomWidth: pressed ? 2 : 5, marginTop: pressed ? 3 : 0 },
          ]}
        >
          <Icon name="user" size={26} color="#fff" weight={2.6} />
        </Pressable>
      </View>
    );

    const dock = (
      <View style={[styles.dockWrap, { paddingBottom: insets.bottom }]}>
        <View style={styles.dock}>
          {DOCK.map((id) => {
            const on = id === "home" ? tab === "village" || tab === "questions" : tab === id;
            const locked = isLocked(id);
            return (
              <Pressable
                key={id}
                accessibilityRole="tab"
                accessibilityLabel={DOCK_LABEL[id]}
                accessibilityState={{ selected: on, disabled: locked }}
                onPress={() => openSlot(id)}
                style={[styles.dockSlot, on && styles.dockSlotOn]}
              >
                <View style={[styles.dockArt, on && styles.dockArtOn, locked && { opacity: 0.5 }]}>
                  <DockArt id={id} big={on} />
                </View>
                {locked ? (
                  <View style={styles.dockLock}>
                    <Icon name="lock" size={12} color={c.ink} weight={2.8} />
                  </View>
                ) : null}
                {on ? <Text style={styles.dockLabel}>{DOCK_LABEL[id]}</Text> : null}
              </Pressable>
            );
          })}
        </View>
      </View>
    );

    const sky = tab === "village" || tab === "questions" || tab === "avatar" || tab === "scores";
    let body: ReactNode = null;
    if (tab === "village") {
      body = (
        <View style={styles.heroArea}>
          <View style={styles.sideCol}>
            {build ? (
              <SideWidget
                label={he.buildFund(active.coins, build.cost)}
                pct={(active.coins / build.cost) * 100}
                accessibilityLabel={he.upgradeName(buildingThe(build.category))}
                onPress={doBuild}
                glow={canBuild}
              >
                <CoinPot size={58} />
              </SideWidget>
            ) : null}
            <SideWidget label={he.helpLabel} onPress={() => setHowTo(true)} accessibilityLabel={he.howToButton}>
              <View style={styles.helpBall}>
                <Icon name="help" size={34} color="#fff" weight={3.2} />
              </View>
            </SideWidget>
          </View>
          <View style={styles.sideColLeft}>
            {unlock ? (
              <SideWidget
                label={unlock.ready ? he.openLesson : he.nextUnlockShort(unlock.level)}
                locked={!unlock.ready}
                glow={unlock.ready}
                accessibilityLabel={unlock.text}
                onPress={() => {
                  if (unlock.ready) {
                    setTab("questions");
                    return;
                  }
                  showLockHint(unlock.text, "top");
                }}
              >
                {unlock.art}
              </SideWidget>
            ) : null}
            <SideWidget label={he.navVillage} onPress={() => router.push("/village")} accessibilityLabel={he.villageMine}>
              <Chest size={58} />
            </SideWidget>
          </View>

          <View style={styles.heroCenter}>
            <View
              style={[
                styles.levelRibbon,
                levelPop && { transform: [{ scale: 1.14 }] },
              ]}
            >
              <Star size={26} />
              <Text style={styles.levelRibbonText}>{he.villageLevelLabel(level)}</Text>
              <Star size={26} />
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${he.villageMine} · ${he.villageLevelLabel(level)}`}
              onPress={() => router.push("/village")}
              style={({ pressed }) => [pressed && { opacity: 0.9 }]}
            >
              <Building category={heroCat} level={heroLevel} size={heroSize} />
            </Pressable>
            <View style={styles.heroSign}>
              <Text style={styles.heroSignText} numberOfLines={1}>
                {buildingName(heroCat)}
              </Text>
            </View>
            {build ? (
              <PrimaryButton
                label={he.buildNow}
                variant={canBuild ? "solid" : "soft"}
                color={canBuild ? GOLD.base : undefined}
                coins={{ amount: build.cost, mode: "pay" }}
                onPress={doBuild}
                style={styles.buildBtn}
              />
            ) : null}
          </View>

          <PrimaryButton
            big
            label={he.homePlay}
            color={OK.base}
            onPress={() => setTab("questions")}
            style={styles.playBtn}
          />
        </View>
      );
    } else {
      body = (
        <ScrollView contentContainerStyle={styles.tabScroll} showsVerticalScrollIndicator={false}>
          {tab === "questions" ? (
            <>
              <TopBar
                onBack={() => setTab("village")}
                backLabel={he.pickSubjectBack}
                center={
                  <WoodSign
                    text={
                      openedLessons(active).length === 0
                        ? he.pickStartLesson
                        : pendingLessonPick(active, level)
                          ? he.pickOpenLesson
                          : he.pickCategory
                    }
                  />
                }
              />
              {pendingLessonPick(active, level) ? (
                <View style={styles.scoresSub}>
                  <Text style={styles.scoresSubText}>
                    {openedLessons(active).length === 0 ? he.pickStartHint : he.pickOpenHint}
                  </Text>
                </View>
              ) : null}
              <View style={styles.grid}>
                {LESSON_PACKS.map((cat) => {
                  const picking = pendingLessonPick(active, level);
                  const done = DIFFICULTIES.reduce((sum, d) => sum + clearedStages(active.stageClears, cat, d), 0);
                  const open = isLessonUnlocked(active, cat);
                  const need = nextLessonPickLevel(active);
                  return (
                    <SubjectCard
                      key={cat}
                      category={cat}
                      done={done}
                      total={CONFIG.miniLevels * DIFFICULTIES.length}
                      stars={categoryStars(active, cat)}
                      locked={!open}
                      choose={picking && !open}
                      unlockLevel={need ?? undefined}
                      onPress={() => {
                        if (open) {
                          cancelAnimationFrame(hintFrame.current);
                          setLockHint(null);
                          setCategory(cat);
                          return;
                        }
                        if (picking) {
                          void openLesson(cat).then(() => setCategory(cat));
                          return;
                        }
                        if (need) showLockHint(he.lockedUntilLevel(need));
                      }}
                    />
                  );
                })}
              </View>
            </>
          ) : null}

          {tab === "scores" ? (
            <>
              <WoodSign text={he.navLeaderboard} />
              <View style={styles.scoresSub}>
                <Text style={styles.scoresSubText}>{he.leaderboardSub}</Text>
              </View>
              <LeaderboardBoard />
            </>
          ) : null}

          {tab === "avatar" ? (
            <>
              <WoodSign text={he.homeAvatar} />
              <ForestStage>
                <View style={styles.avatarLift}>
                  <AvatarPreview loadout={active.avatar ?? defaultAvatar()} size={200} />
                </View>
                <View style={styles.avatarNamePill}>
                  <Text style={styles.avatarName} numberOfLines={1}>
                    {active.displayName}
                  </Text>
                </View>
              </ForestStage>
              <PrimaryButton
                label={he.homeDress}
                icon="bag"
                color={GOLD.base}
                onPress={() => router.push("/shop")}
                style={styles.avatarDress}
              />
              {isLocal ? (
                <View style={styles.avatarNote}>
                  <Text style={[styles.localHint, { color: c.soft }]}>{he.coinsLocalOnly}</Text>
                </View>
              ) : null}
              <Pressable
                onPress={() => signOut()}
                style={({ pressed }) => [styles.logout, { borderBottomWidth: pressed ? 1 : 4, marginTop: pressed ? 21 : 18 }]}
              >
                <Icon name="logout" size={18} color={c.soft} />
                <Text style={[styles.logoutText, { color: c.soft }]}>{he.logout}</Text>
              </Pressable>
            </>
          ) : null}
        </ScrollView>
      );
    }

    return (
      <View
        style={[styles.fill, { backgroundColor: sky ? "#B5E4FF" : c.ground }]}
        onLayout={(e) => setRootSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
      >
        {sky && rootSize.w > 0 ? (
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            <SkyScene width={rootSize.w} height={rootSize.h} />
          </View>
        ) : null}
        <SafeAreaView edges={["top"]} style={styles.fill}>
          <View style={styles.shell} onLayout={(e) => setShellWidth(e.nativeEvent.layout.width)}>
            {hud}
            {body}
          </View>
        </SafeAreaView>
        {dock}
        {lockHint && hintPlace === "top" ? (
          <View pointerEvents="none" style={[styles.topHint, { top: insets.top + 74 }]}>
            <LockBanner text={lockHint} opacity={hintOpacity} />
          </View>
        ) : null}
        {built ? (
          <BuiltPopup
            category={built.category}
            level={built.level}
            gift={built.gift}
            villageLevel={built.village}
            lessonPick={pendingLessonPick(active, built.village)}
            onClose={() => setBuilt(null)}
          />
        ) : null}
        {howTo ? (
          <HowToPlay
            onClose={() => {
              howToSeen = true;
              setHowTo(false);
            }}
          />
        ) : null}
      </View>
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
      <View
        style={[styles.fill, { backgroundColor: "#B5E4FF" }]}
        onLayout={(e) => setRootSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
      >
        {rootSize.w > 0 ? (
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            <SkyScene width={rootSize.w} height={rootSize.h} />
          </View>
        ) : null}
        <SafeAreaView edges={["top", "bottom"]} style={styles.fill}>
          <ScrollView contentContainerStyle={styles.diffScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.shell}>
              <TopBar
                onBack={() => {
                  setCategory(null);
                  router.replace("/");
                }}
                backLabel={he.backLabel}
                center={chip}
                trailing={coinPill}
              />
              <View style={styles.diffSign}>
                <WoodSign text={he.pickDifficulty} />
              </View>
              {DIFFICULTIES.map((d) => (
                <DifficultyCard
                  key={d}
                  difficulty={d}
                  desc={levelDesc(category, d)}
                  cleared={clearedStages(active.stageClears, category, d)}
                  onPress={() => setDifficulty(d)}
                />
              ))}
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  const cleared = clearedStages(active.stageClears, category, difficulty);
  const stages: StageNodeState[] = Array.from({ length: CONFIG.miniLevels }, (_, i) => {
    const stage = i + 1;
    const unlocked = isStageUnlocked(active.stageClears, category, difficulty, stage);
    return {
      stars: stageStars(active, category, difficulty, stage),
      state: !unlocked ? "locked" : cleared >= stage ? "done" : "current",
      cost: entryCost(active, category, difficulty, stage),
    };
  });
  return (
    <StageMap
      category={category}
      goalLevel={ownedLevel(active, category)}
      stages={stages}
      onPressStage={(stage) => {
        if (stages[stage - 1].state === "locked") {
          showLockHint(he.lockedUntilStage(stage - 1), "stages");
          return;
        }
        start(stage);
      }}
      header={
        <TopBar
          onBack={() => {
            setDifficulty(null);
            router.replace({ pathname: "/", params: { category } });
          }}
          backLabel={he.backLabel}
          center={chip}
          trailing={coinPill}
        />
      }
      hint={lockHint && hintPlace === "stages" ? <LockBanner text={lockHint} opacity={hintOpacity} /> : null}
    />
  );
}

type DockSlot = "map" | "avatar" | "home" | "scores" | "shop";
/** RTL: first slot is on the right. Home sits in the middle. */
const DOCK: DockSlot[] = ["map", "avatar", "home", "scores", "shop"];
const DOCK_UNLOCK: Partial<Record<DockSlot, number>> = FEATURE_UNLOCK;
const DOCK_LABEL: Record<DockSlot, string> = {
  map: he.navVillage,
  avatar: he.homeAvatar,
  home: he.homeTab,
  scores: he.navLeaderboard,
  shop: he.navShop,
};

/** Star total in the HUD. Hidden until stars get a job (unlocks / chests / leaderboard). */
const SHOW_STAR_PILL = false;

/** Shown once per app run for a brand-new player; the "?" widget reopens it. */
let howToSeen = false;

function DockArt({ id, big }: { id: DockSlot; big: boolean }) {
  const s = big ? 46 : 36;
  if (id === "home") return <Building category="math" level={4} size={s + 6} />;
  if (id === "map") {
    return (
      <Svg width={s} height={s} viewBox="-12 -24 24 26">
        <MushroomG x={0} y={0} s={1.5} />
      </Svg>
    );
  }
  if (id === "avatar") return <Buddy size={s * 0.82} />;
  if (id === "scores") {
    return (
      <View style={[styles.dockBadge, { width: s, height: s, backgroundColor: GOLD.base, borderBottomColor: GOLD.lip }]}>
        <Icon name="trophy" size={s * 0.62} color="#fff" weight={2.6} />
      </View>
    );
  }
  return (
    <View
      style={[
        styles.dockBadge,
        { width: s, height: s, backgroundColor: CATEGORY_COLORS.reading.base, borderBottomColor: CATEGORY_COLORS.reading.lip },
      ]}
    >
      <Icon name="bag" size={s * 0.62} color="#fff" weight={2.6} />
    </View>
  );
}

/** Floating home widget: picture on top, label pill (or progress bar) underneath. */
function SideWidget({
  children,
  label,
  pct,
  locked,
  glow,
  onPress,
  accessibilityLabel,
}: {
  children: ReactNode;
  label?: string;
  pct?: number;
  locked?: boolean;
  glow?: boolean;
  onPress: () => void;
  accessibilityLabel: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [styles.widget, pressed && { transform: [{ scale: 0.95 }] }]}
    >
      {glow ? <View style={styles.widgetGlow} /> : null}
      <View style={locked ? { opacity: 0.6 } : undefined}>{children}</View>
      {locked ? (
        <View style={styles.widgetLock}>
          <Icon name="lock" size={14} color="#fff" weight={2.8} />
        </View>
      ) : null}
      {label ? <View style={[styles.widgetPill, pct != null && styles.widgetPillBar]}>
        {pct != null ? (
          <View style={StyleSheet.absoluteFill}>
            <View style={styles.widgetTrack}>
              <View style={[styles.widgetFill, { width: `${Math.max(6, Math.min(100, pct))}%` }]} />
            </View>
          </View>
        ) : null}
        <Text style={styles.widgetText} numberOfLines={1}>
          {label}
        </Text>
      </View> : null}
    </Pressable>
  );
}

/** The next gate: a lesson the player still has to choose, or a locked home feature. */
function nextUnlock(
  profile: ProfileDoc,
  level: number,
): { level: number; ready: boolean; text: string; art: ReactNode } | null {
  if (pendingLessonPick(profile, level) && openedLessons(profile).length > 0) {
    return { level, ready: true, text: he.pickOpenLesson, art: <Star size={40} /> };
  }
  const options: { level: number; text: string; art: ReactNode }[] = [];
  const lessonAt = nextLessonPickLevel(profile);
  if (lessonAt != null && lessonAt > level) {
    options.push({ level: lessonAt, text: he.nextUnlockPick(lessonAt), art: <Star size={40} /> });
  }
  for (const id of ["avatar", "scores"] as const) {
    const need = DOCK_UNLOCK[id] ?? 0;
    if (need > level) {
      options.push({
        level: need,
        text: id === "avatar" ? he.unlockAvatar(need) : he.unlockScores(need),
        art: id === "avatar" ? <Buddy size={46} /> : <DockArt id="scores" big={false} />,
      });
    }
  }
  options.sort((a, b) => a.level - b.level);
  const first = options[0];
  return first ? { ...first, ready: false } : null;
}

function LockBanner({ text, opacity }: { text: string; opacity: number }) {
  const c = useColors();
  return (
    <View style={[styles.lockBanner, { backgroundColor: "#EEF2F7", borderBottomColor: "#C5D0DE", opacity }]}>
      <Icon name="lock" size={20} color={c.soft} weight={2.6} />
      <Text style={[styles.lockBannerText, { color: c.soft }]}>{text}</Text>
    </View>
  );
}

/** Wooden plank title, same as the home building sign. */
/** Dark pill with a colored fill from the right and "n/m" on top. */
function ProgressPill({ pct, label, color }: { pct: number; label: string; color: string }) {
  return (
    <View style={styles.progPill}>
      <View style={[StyleSheet.absoluteFill, styles.widgetTrack]}>
        <View style={{ height: "100%", width: `${Math.max(0, Math.min(100, pct))}%`, backgroundColor: color }} />
      </View>
      <Text style={styles.widgetText}>{label}</Text>
    </View>
  );
}

function SubjectCard({
  category,
  done,
  total,
  stars,
  locked,
  choose,
  unlockLevel,
  onPress,
}: {
  category: Category;
  done: number;
  total: number;
  stars: number;
  locked?: boolean;
  /** A free slot is open, so this locked pack can be chosen. */
  choose?: boolean;
  unlockLevel?: number;
  onPress: () => void;
}) {
  const sw = CATEGORY_COLORS[category];
  const c = useColors();
  const need = locked && !choose && unlockLevel ? he.lockedUntilLevel(unlockLevel) : null;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={need ? `${categoryLabel(category)} · ${need}` : categoryLabel(category)}
      onPress={onPress}
      style={({ pressed }) => [
        styles.subject,
        {
          borderBottomColor: locked ? "#DCE3EC" : sw.base + "66",
          borderBottomWidth: pressed ? 2 : 4,
          marginTop: pressed ? 2 : 0,
        },
      ]}
    >
      <View style={[styles.subjectWindow, { backgroundColor: locked ? "#EEF2F7" : sw.tint }]}>
        <View style={[styles.subjectHalo, { backgroundColor: "#fff" }]} />
        <View>
          <View style={locked ? styles.subjectDim : undefined}>
            <CategoryTile category={category} size={100} />
          </View>
          {locked ? (
            <View style={styles.subjectLock}>
              <Icon name="lock" size={13} color="#fff" weight={3} />
            </View>
          ) : null}
        </View>
        {!locked ? (
          <View style={styles.subjectStars}>
            <Star size={13} />
            <Text style={[styles.subjectStarsText, { color: GOLD.deep }]}>{stars}</Text>
          </View>
        ) : null}
      </View>
      <Text style={[styles.subjectTitle, { color: locked ? c.soft : c.ink }]} numberOfLines={2}>
        {categoryLabel(category)}
      </Text>
      {locked && choose ? null : locked && unlockLevel ? (
        <View style={styles.subjectNeed}>
          <Icon name="lock" size={12} color={c.soft} weight={2.6} />
          <Text style={[styles.subjectNeedText, { color: c.soft }]}>{he.nextUnlockShort(unlockLevel)}</Text>
        </View>
      ) : (
        <View style={styles.subjectProg}>
          <View style={[styles.subjectTrack, { backgroundColor: sw.tint }]}>
            <View style={{ height: "100%", width: `${Math.max(4, Math.min(100, (done / total) * 100))}%`, borderRadius: 999, backgroundColor: sw.base }} />
          </View>
          <Text style={[styles.subjectProgText, { color: sw.deep }]}>{he.fraction(done, total)}</Text>
        </View>
      )}
    </Pressable>
  );
}

function DifficultyCard({
  difficulty,
  desc,
  cleared,
  onPress,
}: {
  difficulty: Difficulty;
  desc: string;
  cleared: number;
  onPress: () => void;
}) {
  const sw = DIFFICULTY_COLORS[difficulty];
  const c = useColors();
  const pips = difficulty === "easy" ? 1 : difficulty === "mid" ? 2 : 3;
  const total = CONFIG.miniLevels;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${difficultyLabel(difficulty)} · ${desc}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.diffCard,
        { borderBottomColor: sw.lip, borderBottomWidth: pressed ? 3 : 7, marginTop: pressed ? 4 : 0 },
      ]}
    >
      <View style={[styles.diffBadge, { backgroundColor: sw.tint }]}>
        <DifficultyTile difficulty={difficulty} size={62} />
        <View style={styles.diffPips}>
          {[1, 2, 3].map((i) => (
            <Star key={i} size={15} fill={i <= pips ? sw.base : "#D5DCE6"} stroke={i <= pips ? sw.lip : "#B9C4D3"} />
          ))}
        </View>
      </View>
      <View style={styles.diffCopy}>
        <Text style={[styles.diffTitle, { color: sw.deep }]}>{difficultyLabel(difficulty)}</Text>
        <Text style={[styles.cardDesc, { color: c.soft }]} numberOfLines={2}>
          {desc}
        </Text>
        <View style={styles.diffMeta}>
          <ProgressPill pct={(cleared / total) * 100} label={he.fraction(cleared, total)} color={sw.base} />
          <View style={styles.diffChip}>
            <Coin size={16} />
            <Text style={[styles.diffChipText, { color: GOLD.deep }]}>+{clearPay(difficulty)}</Text>
          </View>
        </View>
      </View>
      <View style={[styles.diffGo, { backgroundColor: sw.base, borderBottomColor: sw.lip }]}>
        <Icon name="next" size={24} color="#fff" weight={3.4} />
      </View>
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

const WOOD = "#D9A066";
const WOOD_LIP = "#A8723A";
const DOCK_BLUE = "#2F6FEB";

const styles = StyleSheet.create({
  fill: { flex: 1 },
  shell: { flex: 1, width: "100%", maxWidth: 520, alignSelf: "center", paddingHorizontal: 14 },
  hud: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    paddingTop: 8,
    paddingBottom: 6,
  },
  hudAvatar: { borderRadius: 30, borderWidth: 3, borderColor: "#fff" },
  hudPills: { flex: 1, flexDirection: "row-reverse", alignItems: "center", gap: 6, flexWrap: "wrap" },
  gear: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: GOLD.base,
    borderBottomColor: GOLD.lip,
    alignItems: "center",
    justifyContent: "center",
  },
  heroArea: { flex: 1, paddingBottom: 10 },
  sideCol: { position: "absolute", top: 6, right: 0, zIndex: 3, gap: 12, alignItems: "center" },
  sideColLeft: { position: "absolute", top: 6, left: 0, zIndex: 3, gap: 12, alignItems: "center" },
  heroCenter: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 8 },
  levelRibbon: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fff",
    borderBottomWidth: 5,
    borderBottomColor: "#CFE0F2",
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginBottom: -10,
    zIndex: 2,
  },
  levelRibbonText: { fontFamily: font.black, fontSize: 22, color: GOLD.deep },
  heroSign: {
    marginTop: -14,
    backgroundColor: WOOD,
    borderBottomWidth: 5,
    borderBottomColor: WOOD_LIP,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 22,
  },
  heroSignText: {
    fontFamily: font.black,
    fontSize: 22,
    color: "#fff",
    textShadowColor: WOOD_LIP,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 0,
  },
  buildBtn: { marginTop: 12, minWidth: 200 },
  upgradeNote: {
    fontFamily: font.heavy,
    fontSize: 15,
    textAlign: "center",
    marginTop: 12,
    color: OK.deep,
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    overflow: "hidden",
  },
  playBtn: { alignSelf: "stretch", marginHorizontal: 20, marginBottom: 34 },
  helpBall: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: CATEGORY_COLORS.logic.base,
    borderBottomWidth: 5,
    borderBottomColor: CATEGORY_COLORS.logic.lip,
    alignItems: "center",
    justifyContent: "center",
  },
  widget: { width: 80, alignItems: "center" },
  widgetGlow: {
    position: "absolute",
    top: -6,
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "rgba(255, 224, 74, 0.55)",
  },
  widgetLock: {
    position: "absolute",
    top: 28,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#6E7C92",
    borderWidth: 2,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  widgetPill: {
    marginTop: -4,
    minWidth: 72,
    borderRadius: 999,
    backgroundColor: "#1F2A44",
    borderWidth: 2,
    borderColor: "#fff",
    paddingVertical: 2,
    paddingHorizontal: 8,
    alignItems: "center",
    overflow: "hidden",
  },
  widgetPillBar: { backgroundColor: "#2B3A5C" },
  widgetTrack: { flex: 1, flexDirection: "row-reverse" },
  widgetFill: { height: "100%", backgroundColor: OK.base },
  widgetText: {
    fontFamily: font.black,
    fontSize: 13,
    color: "#fff",
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 0,
  },
  tabScroll: { paddingTop: 8, paddingBottom: 30, alignItems: "center" },
  tabTitle: { fontFamily: font.heavy, fontSize: 20, textAlign: "center" },
  topHint: { position: "absolute", left: 16, right: 16, zIndex: 40, alignItems: "center" },
  dockWrap: {
    zIndex: 20,
    backgroundColor: DOCK_BLUE,
    borderTopWidth: 4,
    borderTopColor: "#6E9CF7",
  },
  dock: {
    flexDirection: "row-reverse",
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
    height: 70,
  },
  dockSlot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderLeftColor: "#1F4FB8",
    borderRightColor: "#4C86F5",
  },
  dockSlotOn: {
    flex: 1.45,
    marginTop: -16,
    backgroundColor: "#4C86F5",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderTopWidth: 4,
    borderTopColor: "#8DB3FF",
    borderLeftColor: "#8DB3FF",
    borderRightColor: "#8DB3FF",
    justifyContent: "flex-end",
    paddingBottom: 4,
  },
  dockArt: { alignItems: "center", justifyContent: "center" },
  dockArtOn: { marginTop: -16 },
  dockLock: {
    position: "absolute",
    bottom: 10,
    left: "56%",
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  dockLabel: {
    fontFamily: font.black,
    fontSize: 15,
    color: "#fff",
    textShadowColor: "#1F4FB8",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 0,
  },
  dockBadge: { borderRadius: 12, borderBottomWidth: 4, alignItems: "center", justifyContent: "center" },
  loadingBox: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  scoresSub: { backgroundColor: NIGHT, borderRadius: 999, borderWidth: 2, borderColor: "#fff", paddingVertical: 4, paddingHorizontal: 14, marginTop: 12, marginBottom: 14 },
  scoresSubText: { fontFamily: font.bold, fontSize: 14, color: "#fff", textAlign: "center" },
  lockBanner: {
    alignSelf: "stretch",
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 18,
    borderBottomWidth: 4,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  lockBannerText: { fontFamily: font.heavy, fontSize: 16, textAlign: "center", flexShrink: 1 },
  homeCard: { width: "100%", borderRadius: 28, borderBottomWidth: 6, padding: 14, gap: 12 },
  guideTitle: { fontFamily: font.heavy, fontSize: 20, textAlign: "right" },
  guideBody: { fontFamily: font.medium, fontSize: 15, textAlign: "right" },
  guideHint: { fontFamily: font.medium, fontSize: 13, textAlign: "right" },
  guideStep: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 16, paddingVertical: 6, paddingHorizontal: 8 },
  guideStepTitle: { fontFamily: font.heavy, fontSize: 16, textAlign: "right" },
  guideDot: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  guideNum: { fontFamily: font.heavy, fontSize: 14 },
  avatarCard: { width: "100%", borderRadius: 28, borderBottomWidth: 6, padding: 18, alignItems: "center", marginTop: 8 },
  avatarLift: { position: "relative", zIndex: 1 },
  avatarNamePill: {
    position: "relative",
    zIndex: 1,
    backgroundColor: "#2B3A5C",
    borderWidth: 2,
    borderColor: "#fff",
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 18,
    marginTop: 8,
    maxWidth: "90%",
  },
  avatarName: { fontFamily: font.black, fontSize: 22, color: "#fff", textAlign: "center" },
  avatarDress: { alignSelf: "stretch", marginTop: 16 },
  avatarNote: { backgroundColor: "rgba(255,255,255,0.85)", borderRadius: 16, paddingHorizontal: 12, paddingBottom: 8, marginTop: 12 },
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
    borderRadius: 22,
    backgroundColor: "#fff",
    padding: 8,
    paddingBottom: 12,
    marginBottom: 12,
    alignItems: "center",
    gap: 8,
  },
  subjectWindow: {
    alignSelf: "stretch",
    height: 118,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  subjectHalo: { position: "absolute", width: 68, height: 68, borderRadius: 34, opacity: 0.6 },
  subjectDim: { opacity: 0.45 },
  subjectLock: {
    position: "absolute",
    bottom: -4,
    left: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#8A97AC",
    borderWidth: 2,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  subjectStars: {
    position: "absolute",
    top: 6,
    left: 6,
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 2,
    backgroundColor: "rgba(255,255,255,0.85)",
    borderRadius: 999,
    paddingVertical: 1,
    paddingHorizontal: 6,
  },
  subjectStarsText: { fontFamily: font.heavy, fontSize: 11 },
  subjectTitle: { fontFamily: font.black, fontSize: 28, lineHeight: 34, textAlign: "center" },
  subjectNeed: { flexDirection: "row-reverse", alignItems: "center", gap: 4, height: 22 },
  subjectNeedText: { fontFamily: font.bold, fontSize: 16 },
  subjectProg: { alignSelf: "stretch", flexDirection: "row-reverse", alignItems: "center", gap: 6, paddingHorizontal: 8, height: 16 },
  subjectTrack: { flex: 1, height: 7, borderRadius: 999, overflow: "hidden", flexDirection: "row-reverse" },
  subjectProgText: { fontFamily: font.bold, fontSize: 11 },
  progPill: {
    minWidth: 92,
    borderRadius: 999,
    backgroundColor: "#2B3A5C",
    borderWidth: 2,
    borderColor: "#fff",
    paddingVertical: 2,
    paddingHorizontal: 10,
    alignItems: "center",
    overflow: "hidden",
  },
  woodSign: {
    backgroundColor: WOOD,
    borderBottomWidth: 5,
    borderBottomColor: WOOD_LIP,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 18,
    maxWidth: "100%",
  },
  woodSignText: {
    fontFamily: font.black,
    fontSize: 20,
    color: "#fff",
    textAlign: "center",
    textShadowColor: WOOD_LIP,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 0,
  },
  diffScroll: { flexGrow: 1, paddingTop: 10, paddingBottom: 24 },
  diffSign: { alignItems: "center", marginTop: 14, marginBottom: 16 },
  diffCard: {
    width: "100%",
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    borderRadius: 26,
    padding: 10,
    marginBottom: 16,
  },
  diffBadge: { width: 92, height: 108, borderRadius: 20, alignItems: "center", justifyContent: "center", gap: 6 },
  diffPips: { flexDirection: "row-reverse", gap: 1 },
  diffCopy: { flex: 1, alignItems: "flex-end", gap: 4 },
  diffTitle: { fontFamily: font.black, fontSize: 24, textAlign: "right" },
  diffMeta: { flexDirection: "row-reverse", alignItems: "center", flexWrap: "wrap", gap: 6, marginTop: 4 },
  diffChip: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 3,
    backgroundColor: GOLD.tint,
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  diffChipText: { fontFamily: font.black, fontSize: 13 },
  diffGo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderBottomWidth: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  lockLine: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 4,
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  lockLineText: { fontFamily: font.heavy, fontSize: 13, textAlign: "center" },
  cardTitle: { fontSize: 19, fontFamily: font.heavy, textAlign: "right" },
  cardDesc: { fontSize: 13, fontFamily: font.medium, textAlign: "right", lineHeight: 18 },
  fraction: { fontSize: 12, fontFamily: font.bold },
  logout: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fff",
    borderBottomColor: "#C7D3E3",
    borderRadius: 999,
    paddingVertical: 9,
    paddingHorizontal: 18,
  },
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
});
