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
import { CATEGORY_COLORS, DIFFICULTY_COLORS, GOLD, KIT, OK, font } from "../src/theme/colors";
import { AvatarPreview } from "../src/components/AvatarPreview";
import { LeaderboardBoard } from "./leaderboard";
import { CategoryTile, Coin, DifficultyTile, Icon, Star } from "../src/components/Art";
import { PrimaryButton } from "../src/components/PrimaryButton";
import { Buddy, CoinPill, StarPill, TopBar, useColors } from "../src/components/ui";
import { useToast } from "../src/components/Toast";
import { CoinStack, Hammer, MushroomG, SkyScene } from "../src/components/HomeArt";
import {
  BadgeButton,
  ChestProgress,
  HeroButton,
  Island,
  KitCard,
  KitChip,
  KitMeter,
  KitTitle,
  KitTopBar,
  OutlinedText,
  ResourceCounter,
  SeaBackdrop,
  SeaScreen,
  WoodDock,
} from "../src/components/GameKit";
import { HowToPlay } from "../src/components/HowToPlay";
import { StageMap, type StageNodeState } from "../src/components/StageMap";
import { Building, buildingName } from "../src/components/VillageArt";
import { categoryStars, stageStars } from "../src/game/village";
import {
  ECONOMY,
  entryCost,
  needsNameSetup,
  nextElement,
  sceneLevels,
  sceneProgress,
  type SceneProgress,
} from "../src/game/economy";
import { defaultAvatar } from "../src/game/avatar";
import {
  CATEGORIES,
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

export default function HomeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string; level?: string }>();
  const { signOut, isLocal } = useAuth();
  const { active, loading, enterStage, buildNext, dailyGift, clearDailyGift } = useProgress();
  const toast = useToast();
  const giftCountdown = useCountdownToMidnight();
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
  const homeLevel = active.sceneIndex + 1;
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
  const [built, setBuilt] = useState<{
    category: Category;
    level: number;
    milestoneCoins: number;
    grandPrizeCoins: number;
  } | null>(null);

  useEffect(() => {
    if (dailyGift == null) return;
    toast.show(he.dailyGift(dailyGift));
    clearDailyGift();
  }, [dailyGift]);

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
    if (loading || howToSeen) return;
    const played = Object.values(active.stageClears ?? {}).some((n) => n > 0);
    if (!played) setHowTo(true);
    else howToSeen = true;
  }, [loading, active.stageClears]);

  const start = (stage: number, level: Difficulty | null = difficulty) => {
    if (!category || !level) return;
    const cost = entryCost(level);
    void (async () => {
      if (!(await enterStage(level))) {
        showLockHint(he.needCoins(cost), SHOW_STAGE_MAP ? "stages" : "top");
        return;
      }
      router.push({ pathname: "/game", params: { level, category, stage: String(stage) } });
    })();
  };

  const coinPill = <CoinPill coins={active.coins} />;

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
    const element = nextElement(active);
    const scene = sceneProgress(active);
    const canBuild = active.stars >= element.cost;
    const openSlot = (id: DockSlot) => {
      cancelAnimationFrame(hintFrame.current);
      setLockHint(null);
      if (id === "map") router.push("/village");
      else setTab(id === "home" ? "village" : id);
    };
    const doBuild = () => {
      if (!canBuild) {
        showLockHint(he.needStars(element.cost - active.stars), "top");
        return;
      }
      void (async () => {
        const result = await buildNext();
        if (!result) return;
        setBuilt({
          category: result.element.category,
          level: result.element.level,
          milestoneCoins: result.milestoneCoins,
          grandPrizeCoins: result.grandPrizeCoins,
        });
      })();
    };
    const islandW = Math.min(shellWidth * 0.86, 340, winH * 0.42);

    const hud = (
      <View style={styles.hud}>
        <ResourceCounter kind="coin" value={active.coins} onPress={() => router.push("/village")} />
        <ResourceCounter kind="star" value={active.stars} />
      </View>
    );

    const dockActive = tab === "village" || tab === "questions" ? "home" : tab;
    const dock = (
      <WoodDock
        items={DOCK.map((id) => ({ id, label: DOCK_LABEL[id], art: <DockArt id={id} big={false} /> }))}
        active={dockActive}
        onPress={(id) => openSlot(id as DockSlot)}
        bottomInset={insets.bottom}
      />
    );

    const sky = tab === "village" || tab === "questions" || tab === "avatar" || tab === "scores";
    let body: ReactNode = null;
    if (tab === "village") {
      body = (
        <View style={styles.heroArea}>
          <ChestProgress
            value={scene.built}
            total={scene.total}
            prize={scene.grandPrizeCoins}
            milestoneAt={scene.milestoneAfter}
            milestoneDone={scene.milestonePaid}
          />
          <View style={styles.playfield}>
            <View style={styles.sideCol}>
              <BadgeButton
                label={he.buildCost(element.cost)}
                tone="orange"
                ribbon={canBuild ? "green" : "orange"}
                notify={canBuild ? "!" : undefined}
                glow={canBuild}
                onPress={doBuild}
                accessibilityLabel={he.buildNow}
              >
                <Hammer size={56} />
              </BadgeButton>
            </View>
            <View style={styles.sideColLeft}>
              <BadgeButton
                label={giftCountdown}
                tone="purple"
                onPress={() => toast.show(he.nextGift(giftCountdown))}
                accessibilityLabel={he.nextGift(giftCountdown)}
              >
                <CoinStack size={60} />
              </BadgeButton>
            </View>
            <View style={[styles.heroCenter, levelPop && { transform: [{ scale: 1.06 }] }]}>
              <OutlinedText size={24} style={styles.sceneTitle}>
                {`${he.sceneLabel(homeLevel)} · ${buildingName(element.category)}`}
              </OutlinedText>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={he.buildNow}
                onPress={doBuild}
                style={({ pressed }) => [pressed && { transform: [{ scale: 0.97 }] }]}
              >
                <Island width={islandW}>
                  <View style={!canBuild ? styles.ghost : undefined}>
                    <Building category={element.category} level={element.level} size={islandW * 0.55} />
                  </View>
                </Island>
              </Pressable>
            </View>
          </View>
          <HeroButton label={he.homePlay} onPress={() => setTab("questions")} style={styles.playBtn} />
        </View>
      );
    } else {
      body = (
        <ScrollView contentContainerStyle={styles.tabScroll} showsVerticalScrollIndicator={false}>
          {tab === "questions" ? (
            <>
              <KitTopBar
                onBack={() => setTab("village")}
                backLabel={he.pickSubjectBack}
                center={<KitTitle text={he.pickCategory} />}
              />
              <View style={styles.grid}>
                {CATEGORIES.map((cat) => {
                  const done = DIFFICULTIES.reduce((sum, d) => sum + clearedStages(active.stageClears, cat, d), 0);
                  return (
                    <SubjectCard
                      key={cat}
                      category={cat}
                      done={done}
                      total={CONFIG.miniLevels * DIFFICULTIES.length}
                      stars={categoryStars(active, cat)}
                      onPress={() => {
                        cancelAnimationFrame(hintFrame.current);
                        setLockHint(null);
                        setCategory(cat);
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
        style={[styles.fill, { backgroundColor: sky ? KIT.sea : c.ground }]}
        onLayout={(e) => setRootSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
      >
        {sky && rootSize.w > 0 ? (
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            <SeaBackdrop width={rootSize.w} height={rootSize.h} />
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
            milestoneCoins={built.milestoneCoins}
            grandPrizeCoins={built.grandPrizeCoins}
            onClose={() => {
              setBuilt(null);
              if (needsNameSetup(active)) router.replace("/name");
            }}
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
        {toast.node}
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

  if (!difficulty || !SHOW_STAGE_MAP) {
    return (
      <SeaScreen>
        <KitTopBar
          onBack={() => {
            setCategory(null);
            router.replace("/");
          }}
          backLabel={he.backLabel}
          center={<KitTitle text={categoryLabel(category)} />}
          trailing={<ResourceCounter kind="coin" value={active.coins} />}
        />
        <View style={styles.kitSub}>
          <OutlinedText size={20}>{he.pickDifficulty}</OutlinedText>
        </View>
        {lockHint ? <LockBanner text={lockHint} opacity={hintOpacity} /> : null}
        {DIFFICULTIES.map((d) => (
          <DifficultyCard
            key={d}
            difficulty={d}
            desc={levelDesc(category, d)}
            cleared={clearedStages(active.stageClears, category, d)}
            onPress={() => {
              if (SHOW_STAGE_MAP) {
                setDifficulty(d);
                return;
              }
              // No stage map for now: jump straight into the next stage.
              const next = Math.min(CONFIG.miniLevels, clearedStages(active.stageClears, category, d) + 1);
              start(next, d);
            }}
          />
        ))}
      </SeaScreen>
    );
  }

  const cleared = clearedStages(active.stageClears, category, difficulty);
  const stages: StageNodeState[] = Array.from({ length: CONFIG.miniLevels }, (_, i) => {
    const stage = i + 1;
    const unlocked = isStageUnlocked(active.stageClears, category, difficulty, stage);
    return {
      stars: stageStars(active, category, difficulty, stage),
      state: !unlocked ? "locked" : cleared >= stage ? "done" : "current",
      cost: entryCost(difficulty),
    };
  });
  return (
    <StageMap
      category={category}
      goalLevel={Math.max(1, sceneLevels(active)[category])}
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

type DockSlot = "map" | "avatar" | "home" | "scores";
/** RTL: first slot is on the right. Home sits in the middle. */
const DOCK: DockSlot[] = ["map", "avatar", "home", "scores"];
const DOCK_LABEL: Record<DockSlot, string> = {
  map: he.navVillage,
  avatar: he.homeAvatar,
  home: he.homeTab,
  scores: he.navLeaderboard,
};

/** Shown once per app run for a brand-new player; the "?" widget reopens it. */
let howToSeen = false;

/** The winding stage map between difficulty and play. Hidden for now. */
const SHOW_STAGE_MAP = false;

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
  return (
    <View style={[styles.dockBadge, { width: s, height: s, backgroundColor: GOLD.base, borderBottomColor: GOLD.lip }]}>
      <Icon name="trophy" size={s * 0.62} color="#fff" weight={2.6} />
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
  onPress,
}: {
  category: Category;
  done: number;
  total: number;
  stars: number;
  onPress: () => void;
}) {
  const sw = CATEGORY_COLORS[category];
  return (
    <KitCard onPress={onPress} accessibilityLabel={categoryLabel(category)} style={styles.subject}>
      <View style={[styles.subjectWindow, { backgroundColor: sw.base, borderBottomColor: sw.lip }]}>
        <View style={styles.subjectShine} />
        <CategoryTile category={category} size={96} />
        <View style={styles.subjectStars}>
          <KitChip icon={<Star size={16} />} text={String(stars)} />
        </View>
      </View>
      <Text style={styles.subjectTitle} numberOfLines={1}>
        {categoryLabel(category)}
      </Text>
      <KitMeter value={done} total={total} />
    </KitCard>
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
  const pips = difficulty === "easy" ? 1 : difficulty === "mid" ? 2 : 3;
  return (
    <KitCard onPress={onPress} accessibilityLabel={`${difficultyLabel(difficulty)} · ${desc}`} style={styles.diffCard}>
      <View style={[styles.diffBadge, { backgroundColor: sw.base, borderBottomColor: sw.lip }]}>
        <View style={styles.subjectShine} />
        <DifficultyTile difficulty={difficulty} size={58} />
        <View style={styles.diffPips}>
          {[1, 2, 3].map((i) => (
            <Star key={i} size={16} fill={i <= pips ? "#FFC23D" : "#ffffff55"} stroke={i <= pips ? "#E09A00" : "#ffffff88"} />
          ))}
        </View>
      </View>
      <View style={styles.diffCopy}>
        <Text style={[styles.diffTitle, { color: sw.deep }]}>{difficultyLabel(difficulty)}</Text>
        <Text style={styles.cardDesc} numberOfLines={2}>
          {desc}
        </Text>
        <KitMeter value={cleared} total={CONFIG.miniLevels} />
        <View style={styles.diffMeta}>
          <KitChip icon={<Coin size={18} />} text={`−${entryCost(difficulty)}`} />
          <KitChip
            icon={<Star size={18} />}
            text={`+${ECONOMY.starsWin[difficulty]}–${ECONOMY.starsPerfect[difficulty]}`}
          />
        </View>
      </View>
      <View style={styles.diffGo}>
        <Icon name="next" size={26} color="#fff" weight={3.6} />
      </View>
    </KitCard>
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

/** "hh:mm:ss" until local midnight, when the next daily gift is ready. Ticks every second. */
function useCountdownToMidnight(): string {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const left = Math.max(0, Math.floor((midnight.getTime() - now) / 1000));
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(Math.floor(left / 3600))}:${pad(Math.floor((left % 3600) / 60))}:${pad(left % 60)}`;
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
    justifyContent: "center",
    gap: 18,
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
  playfield: { flex: 1 },
  sceneTitle: { marginBottom: 4 },
  ghost: { opacity: 0.55 },
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
  playBtn: { alignSelf: "stretch", marginHorizontal: 24, marginBottom: 30 },
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
  sceneBar: { flexDirection: "row-reverse", alignItems: "center", gap: 8, marginBottom: 6, zIndex: 4 },
  sceneTrackWrap: { flex: 1, height: 26, justifyContent: "center" },
  sceneTrack: {
    height: 18,
    borderRadius: 999,
    backgroundColor: "#2B3A5C",
    borderWidth: 2,
    borderColor: "#fff",
    overflow: "hidden",
    flexDirection: "row-reverse",
  },
  sceneFill: { height: "100%", backgroundColor: OK.base },
  sceneMilestone: { position: "absolute", top: 3, marginRight: -10 },
  sceneCount: {
    position: "absolute",
    alignSelf: "center",
    fontFamily: font.black,
    fontSize: 12,
    color: "#fff",
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 0,
  },
  scenePrize: { alignItems: "center" },
  scenePrizeText: { marginTop: -6, fontFamily: font.black, fontSize: 13, color: GOLD.deep, backgroundColor: "#fff", borderRadius: 999, paddingHorizontal: 6, overflow: "hidden" },
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
  subject: { width: "48%", marginBottom: 14, alignItems: "center", gap: 8, paddingBottom: 12 },
  subjectWindow: { alignSelf: "stretch", height: 120, borderRadius: 18, borderBottomWidth: 5, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  subjectShine: { position: "absolute", top: 6, left: 10, right: 10, height: 22, borderRadius: 11, backgroundColor: "#fff", opacity: 0.2 },
  kitSub: { marginTop: 6, marginBottom: 14 },
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
  subjectStars: { position: "absolute", top: 6, left: 6 },
  subjectStarsText: { fontFamily: font.heavy, fontSize: 11 },
  subjectTitle: { fontFamily: font.black, fontSize: 26, lineHeight: 32, textAlign: "center", color: KIT.creamInk },
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
  diffCard: { width: "100%", flexDirection: "row-reverse", alignItems: "center", gap: 12, marginBottom: 16 },
  diffBadge: { width: 92, height: 112, borderRadius: 20, borderBottomWidth: 5, alignItems: "center", justifyContent: "center", gap: 6, overflow: "hidden" },
  diffPips: { flexDirection: "row-reverse", gap: 1 },
  diffCopy: { flex: 1, alignItems: "flex-end", gap: 6 },
  diffTitle: { fontFamily: font.black, fontSize: 26, textAlign: "right" },
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
  diffGo: { width: 48, height: 48, borderRadius: 24, backgroundColor: KIT.green, borderWidth: 3, borderColor: KIT.greenLip, borderBottomWidth: 6, alignItems: "center", justifyContent: "center" },
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
  cardDesc: { fontSize: 14, fontFamily: font.bold, textAlign: "right", lineHeight: 19, color: KIT.creamInk },
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
