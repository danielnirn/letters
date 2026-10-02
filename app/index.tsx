import { useEffect, useState, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Screen } from "../src/components/Screen";
import { useAuth } from "../src/context/AuthContext";
import { useProgress } from "../src/context/ProgressContext";
import { he } from "../src/i18n/he";
import { CATEGORY_COLORS, DIFFICULTY_COLORS, GOLD, OK, font } from "../src/theme/colors";
import { AvatarPreview } from "../src/components/AvatarPreview";
import { CategoryTile, Coin, DifficultyTile, Icon, Star, type IconName } from "../src/components/Art";
import { PrimaryButton } from "../src/components/PrimaryButton";
import { Buddy, Card, CoinPill, ProgressBar, StarPill, TopBar, useColors } from "../src/components/ui";
import { Building, buildingName, VillageScene } from "../src/components/VillageArt";
import {
  buildingLevel,
  categoryStars,
  LEVEL_STARS,
  nextGoal,
  nextLevelStars,
  totalStars,
  villageLevels,
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
    return (
      <Screen>
        <View style={styles.helloBar}>
          <Pressable onPress={() => router.push("/profile")} style={styles.helloWho}>
            <Text style={[styles.helloSmall, { color: c.soft }]}>{he.hello}</Text>
            <Text style={[styles.helloName, { color: c.ink }]} numberOfLines={1}>
              {active.displayName}
            </Text>
          </Pressable>
          <View style={styles.pills}>
            <StarPill stars={totalStars(active)} onPress={() => router.push("/village")} />
            {coinPill}
          </View>
        </View>

        <View style={[styles.homeCard, { backgroundColor: c.surface, borderBottomColor: c.line }]}>
          <View style={styles.meRow}>
            <Pressable
              onPress={() => router.push({ pathname: "/shop", params: { section: "avatar" } })}
              style={({ pressed }) => [styles.meAvatar, pressed && { opacity: 0.8 }]}
            >
              <AvatarPreview loadout={active.avatar ?? defaultAvatar()} size={62} />
              <View style={[styles.dressPill, { backgroundColor: c.primaryTint }]}>
                <Icon name="bag" size={14} color={c.primary} />
                <Text style={[styles.dressText, { color: c.primary }]}>{he.homeDress}</Text>
              </View>
            </Pressable>
            <View style={[styles.bubble, { backgroundColor: c.ground }]}>
              <View style={[styles.bubbleTail, { borderLeftColor: c.ground }]} />
              {goal ? (
                <>
                  <View style={styles.goalHead}>
                    <Building category={goal.category} level={goal.level} size={44} />
                    <Text style={[styles.goalTitle, { color: c.ink }]}>{he.homeGoalTitle(buildingName(goal.category))}</Text>
                  </View>
                  <Text style={[styles.goalText, { color: CATEGORY_COLORS[goal.category].deep }]}>
                    {he.homeGoal(goal.need, he.buildingLevels[goal.level])}
                  </Text>
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
          </View>

          <Pressable
            onPress={() => router.push("/village")}
            onLayout={(e) => setSceneWidth(e.nativeEvent.layout.width)}
            style={({ pressed }) => [styles.scene, pressed && { opacity: 0.85 }]}
          >
            {sceneWidth > 0 ? <VillageScene levels={villageLevels(active)} width={sceneWidth} aspect={0.5} /> : null}
            <View style={[styles.sceneChip, { backgroundColor: c.surface, borderBottomColor: c.line }]}>
              <Text style={[styles.sceneChipText, { color: c.ink }]}>{he.villageMine} ←</Text>
            </View>
          </Pressable>

          <View style={styles.loop}>
            <LoopStep icon={<CategoryTile category="reading" size={26} />} label={he.loopLearn} />
            <Text style={[styles.loopArrow, { color: c.soft }]}>←</Text>
            <LoopStep icon={<Star size={24} />} label={he.loopBuild} />
            <Text style={[styles.loopArrow, { color: c.soft }]}>←</Text>
            <LoopStep icon={<Coin size={24} />} label={he.loopDress} />
          </View>
        </View>
        {isLocal ? <Text style={[styles.localHint, { color: c.soft }]}>{he.coinsLocalOnly}</Text> : null}

        <Text style={[styles.section, { color: c.ink }]}>{he.pickBuild}</Text>
        <View style={styles.grid}>
          {CATEGORIES.map((cat) => (
            <SubjectCard key={cat} category={cat} stars={categoryStars(active, cat)} onPress={() => setCategory(cat)} />
          ))}
        </View>

        <View style={[styles.dock, { backgroundColor: c.surface, borderBottomColor: c.line }]}>
          <DockItem icon="bag" label={he.navShop} tint={CATEGORY_COLORS.language.tint} onPress={() => router.push("/shop")} />
          <DockItem icon="backpack" label={he.navGear} tint={CATEGORY_COLORS.english.tint} onPress={() => router.push("/inventory")} />
          <DockItem icon="trophy" label={he.navLeaderboard} tint={GOLD.tint} onPress={() => router.push("/leaderboard")} />
          <DockItem icon="user" label={he.navProfile} tint={CATEGORY_COLORS.logic.tint} onPress={() => router.push("/profile")} />
        </View>

        <Pressable onPress={() => signOut()} style={styles.logout}>
          <Icon name="logout" size={18} color={c.soft} />
          <Text style={[styles.logoutText, { color: c.soft }]}>{he.logout}</Text>
        </Pressable>
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

function SubjectCard({ category, stars, onPress }: { category: Category; stars: number; onPress: () => void }) {
  const c = useColors();
  const sw = CATEGORY_COLORS[category];
  const level = buildingLevel(stars);
  const next = nextLevelStars(stars);
  const from = level === 0 ? 0 : LEVEL_STARS[level - 1];
  const pct = next == null ? 100 : ((stars - from) / (next - from)) * 100;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.subject,
        {
          backgroundColor: c.surface,
          borderBottomColor: c.line,
          borderBottomWidth: pressed ? 2 : 5,
          marginTop: pressed ? 3 : 0,
        },
      ]}
    >
      <View style={styles.subjectHead}>
        <CategoryTile category={category} size={40} />
        <Text style={[styles.cardTitle, { color: c.ink }]} numberOfLines={1}>
          {categoryLabel(category)}
        </Text>
      </View>
      <View style={[styles.subjectArt, { backgroundColor: sw.tint }]}>
        <Building category={category} level={level} size={68} />
      </View>
      <Text style={[styles.subjectBuilding, { color: sw.deep }]} numberOfLines={1}>
        {buildingName(category)} · {he.buildingLevels[level]}
      </Text>
      <View style={styles.subjectBar}>
        <Star size={14} />
        <Text style={[styles.fraction, { color: c.soft }]}>{next == null ? stars : `${stars}/${next}`}</Text>
        <View style={{ flex: 1 }}>
          <ProgressBar pct={pct} color={next == null ? OK.base : GOLD.base} />
        </View>
      </View>
    </Pressable>
  );
}

function LoopStep({ icon, label }: { icon: ReactNode; label: string }) {
  const c = useColors();
  return (
    <View style={styles.loopStep}>
      {icon}
      <Text style={[styles.loopText, { color: c.soft }]}>{label}</Text>
    </View>
  );
}

function DockItem({
  icon,
  label,
  tint,
  onPress,
}: {
  icon: IconName;
  label: string;
  tint: string;
  onPress: () => void;
}) {
  const c = useColors();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.dockItem, pressed && { opacity: 0.7 }]}>
      <View style={[styles.dockIcon, { backgroundColor: tint }]}>
        <Icon name={icon} size={22} color={c.ink} />
      </View>
      <Text style={[styles.dockLabel, { color: c.ink }]}>{label}</Text>
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
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  helloWho: { alignItems: "flex-end", flexShrink: 1 },
  helloSmall: { fontSize: 13, fontFamily: font.medium },
  helloName: { fontSize: 22, fontFamily: font.heavy, maxWidth: 160, textAlign: "right" },
  pills: { flexDirection: "row-reverse", alignItems: "center", gap: 8 },
  homeCard: { width: "100%", borderRadius: 28, borderBottomWidth: 6, padding: 14, gap: 12 },
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
  loop: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between" },
  loopStep: { flex: 1, alignItems: "center", gap: 4 },
  loopText: { fontFamily: font.bold, fontSize: 12, textAlign: "center" },
  loopArrow: { fontFamily: font.heavy, fontSize: 16 },
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
  subject: { width: "48%", borderRadius: 24, padding: 12, marginBottom: 14, alignItems: "flex-end", gap: 8 },
  subjectHead: { alignSelf: "stretch", flexDirection: "row-reverse", alignItems: "center", gap: 8 },
  subjectArt: { alignSelf: "stretch", borderRadius: 18, alignItems: "center", paddingVertical: 4 },
  subjectBuilding: { fontFamily: font.bold, fontSize: 13, textAlign: "right" },
  subjectBar: { alignSelf: "stretch", flexDirection: "row-reverse", alignItems: "center", gap: 5 },
  cardTitle: { fontSize: 19, fontFamily: font.heavy, textAlign: "right" },
  cardDesc: { fontSize: 13, fontFamily: font.medium, textAlign: "right", lineHeight: 18 },
  fraction: { fontSize: 12, fontFamily: font.bold },
  dock: {
    width: "100%",
    flexDirection: "row-reverse",
    borderRadius: 24,
    borderBottomWidth: 5,
    paddingVertical: 8,
    paddingHorizontal: 6,
    marginTop: 6,
  },
  dockItem: { flex: 1, alignItems: "center", gap: 5, paddingVertical: 6, minHeight: 44 },
  dockIcon: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  dockLabel: { fontSize: 12, fontFamily: font.bold, textAlign: "center" },
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
