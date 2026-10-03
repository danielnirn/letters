import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Screen } from "../src/components/Screen";
import { useAuth } from "../src/context/AuthContext";
import { useProgress } from "../src/context/ProgressContext";
import { he } from "../src/i18n/he";
import { CATEGORY_COLORS, DIFFICULTY_COLORS, GOLD, OK, font } from "../src/theme/colors";
import { AvatarPreview } from "../src/components/AvatarPreview";
import { LeaderboardBoard } from "./leaderboard";
import { CategoryTile, DifficultyTile, Icon, Star } from "../src/components/Art";
import { PrimaryButton } from "../src/components/PrimaryButton";
import { Buddy, Card, CoinPill, ProgressBar, StarPill, TopBar, useColors } from "../src/components/ui";
import { Building, buildingName, VillageScene } from "../src/components/VillageArt";
import {
  categoryStars,
  lookFor,
  nextGoal,
  totalStars,
  villageDetails,
  villageLevels,
  wishCategory,
  wishDoneToday,
} from "../src/game/village";
import { defaultAvatar } from "../src/game/avatar";
import {
  CONFIG,
  CATEGORIES,
  clearedStages,
  isStagePerfectClear,
  isStageUnlocked,
  parseCategory,
  parseDifficulty,
  type Category,
  type Difficulty,
} from "../src/game/config";

const DIFFICULTIES: Difficulty[] = ["easy", "mid", "hard"];
const HOME_TABS = ["questions", "village", "scores", "avatar"] as const;
type HomeTab = (typeof HOME_TABS)[number];

export default function HomeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string; level?: string }>();
  const { signOut, isLocal } = useAuth();
  const { active, loading } = useProgress();
  const [category, setCategory] = useState<Category | null>(
    params.category ? parseCategory(params.category) : null,
  );
  const [difficulty, setDifficulty] = useState<Difficulty | null>(
    params.level ? parseDifficulty(params.level) : null,
  );
  const c = useColors();
  const [sceneWidth, setSceneWidth] = useState(0);
  const [tab, setTab] = useState<HomeTab>("questions");

  useEffect(() => {
    setCategory(params.category ? parseCategory(params.category) : null);
    setDifficulty(params.level ? parseDifficulty(params.level) : null);
  }, [params.category, params.level]);

  const start = (stage: number) => {
    if (!category || !difficulty) return;
    router.push({ pathname: "/game", params: { level: difficulty, category, stage: String(stage) } });
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
    const goal = nextGoal(active);
    const wishCat = wishCategory(active.id);
    const wished = wishDoneToday(active);
    const wishLook = lookFor(categoryStars(active, wishCat));
    const tabLabel: Record<HomeTab, string> = {
      questions: he.homeQuestions,
      village: he.homeVillage,
      scores: he.navLeaderboard,
      avatar: he.homeAvatar,
    };
    return (
      <Screen>
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
            {tab === "village" ? <StarPill stars={totalStars(active)} onPress={() => router.push("/village")} /> : null}
            <View style={styles.helloWho}>
              <Text style={[styles.helloSmall, { color: c.soft }]}>{he.hello}</Text>
              <Text style={[styles.helloName, { color: c.ink }]} numberOfLines={1}>
                {active.displayName}
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.tabs, { backgroundColor: c.line }]}>
          {HOME_TABS.map((id) => {
            const on = tab === id;
            return (
              <Pressable
                key={id}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
                onPress={() => setTab(id)}
                style={[styles.tab, on && { backgroundColor: c.surface }]}
              >
                <Text style={[styles.tabText, { color: on ? c.ink : c.soft }]}>{tabLabel[id]}</Text>
              </Pressable>
            );
          })}
        </View>

        {tab === "questions" ? (
          <>
            <Text style={[styles.section, { color: c.ink }]}>{he.pickCategory}</Text>
            <View style={styles.grid}>
              {CATEGORIES.map((cat) => {
                const done = DIFFICULTIES.reduce((sum, d) => sum + clearedStages(active.stageClears, cat, d), 0);
                return (
                  <SubjectCard
                    key={cat}
                    category={cat}
                    done={done}
                    total={CONFIG.miniLevels * DIFFICULTIES.length}
                    onPress={() => setCategory(cat)}
                  />
                );
              })}
            </View>
          </>
        ) : null}

        {tab === "village" ? (
          <View style={[styles.homeCard, { backgroundColor: c.surface, borderBottomColor: c.line }]}>
            <Pressable
              onPress={() => {
                if (!wished) setCategory(wishCat);
              }}
              style={[styles.wish, { backgroundColor: wished ? OK.tint : CATEGORY_COLORS[wishCat].tint }]}
            >
              <Building category={wishCat} level={wishLook.level} detail={wishLook.detail} lit={wished} size={52} />
              <View style={{ flex: 1, alignItems: "flex-end" }}>
                <Text style={[styles.wishText, { color: c.ink }]}>
                  {wished ? he.wishDone : he.wishAsk(buildingName(wishCat))}
                </Text>
                {wished ? null : (
                  <Text style={[styles.wishCta, { color: CATEGORY_COLORS[wishCat].deep }]}>{he.wishCta}</Text>
                )}
              </View>
            </Pressable>
            <View style={[styles.bubble, { backgroundColor: c.ground }]}>
              {goal ? (
                <>
                  <View style={styles.goalHead}>
                    <Building category={goal.category} level={goal.look.level} detail={goal.look.detail} size={44} />
                    <Text style={[styles.goalTitle, { color: c.ink }]}>{he.homeGoalTitle(buildingName(goal.category))}</Text>
                  </View>
                  <Text style={[styles.goalText, { color: CATEGORY_COLORS[goal.category].deep }]}>
                    {he.homeGoal(goal.need, he.milestoneName[goal.id])}
                  </Text>
                  <Text style={[styles.goalText, { color: c.soft }]}>{he.milestoneBonus[goal.id]}</Text>
                  <PrimaryButton
                    label={he.homeBuildCta}
                    color={CATEGORY_COLORS[goal.category].base}
                    onPress={() => setCategory(goal.category)}
                    style={styles.goalBtn}
                  />
                </>
              ) : (
                <Text style={[styles.goalTitle, { color: c.ink }]}>{he.homeGoalDone}</Text>
              )}
            </View>
            <Pressable
              onPress={() => router.push("/village")}
              onLayout={(e) => setSceneWidth(e.nativeEvent.layout.width)}
              style={({ pressed }) => [styles.scene, pressed && { opacity: 0.85 }]}
            >
              {sceneWidth > 0 ? (
                <VillageScene
                  levels={villageLevels(active)}
                  details={villageDetails(active)}
                  blooms={active.villageBlooms ?? 0}
                  litCategory={wished ? wishCat : null}
                  width={sceneWidth}
                  aspect={0.5}
                />
              ) : null}
              <View style={[styles.sceneChip, { backgroundColor: c.surface, borderBottomColor: c.line }]}>
                <Text style={[styles.sceneChipText, { color: c.ink }]}>{he.villageMine} ←</Text>
              </View>
            </Pressable>
          </View>
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
  onPress,
}: {
  category: Category;
  done: number;
  total: number;
  onPress: () => void;
}) {
  const sw = CATEGORY_COLORS[category];
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.subject,
        {
          backgroundColor: sw.tint,
          borderBottomColor: sw.lip,
          borderBottomWidth: pressed ? 2 : 5,
          marginTop: pressed ? 3 : 0,
        },
      ]}
    >
      <CategoryTile category={category} size={52} />
      <Text style={[styles.cardTitle, { color: sw.deep, textAlign: "center" }]} numberOfLines={1}>
        {categoryLabel(category)}
      </Text>
      <Text style={[styles.fraction, { color: sw.deep, textAlign: "center" }]}>{he.stagesDone(done, total)}</Text>
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
  tabs: { flexDirection: "row-reverse", width: "100%", borderRadius: 999, padding: 4, marginBottom: 8 },
  tab: { flex: 1, minHeight: 44, borderRadius: 999, alignItems: "center", justifyContent: "center" },
  tabText: { fontFamily: font.heavy, fontSize: 14, textAlign: "center" },
  homeCard: { width: "100%", borderRadius: 28, borderBottomWidth: 6, padding: 14, gap: 12 },
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
  goalHead: { flexDirection: "row-reverse", alignItems: "center", gap: 6 },
  goalTitle: { fontFamily: font.heavy, fontSize: 16, textAlign: "right", flexShrink: 1 },
  goalText: { fontFamily: font.bold, fontSize: 14, textAlign: "right" },
  goalBtn: { alignSelf: "stretch", marginTop: 6 },
  scene: { width: "100%" },
  sceneChip: {
    position: "absolute",
    right: 10,
    top: 10,
    borderRadius: 999,
    borderBottomWidth: 3,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  sceneChipText: { fontFamily: font.heavy, fontSize: 14 },
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
