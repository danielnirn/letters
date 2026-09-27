import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Screen } from "../src/components/Screen";
import { GhostButton } from "../src/components/LeaderboardTable";
import { useAuth } from "../src/context/AuthContext";
import { useProgress } from "../src/context/ProgressContext";
import { he } from "../src/i18n/he";
import { colorsFor } from "../src/theme/colors";
import type { Category, Difficulty } from "../src/game/config";

export default function HomeScreen() {
  const router = useRouter();
  const { signOut, isLocal } = useAuth();
  const { active, loading } = useProgress();
  const [category, setCategory] = useState<Category | null>(null);
  const c = colorsFor(active.theme);

  const start = (level: Difficulty) => {
    if (!category) return;
    router.push({ pathname: "/game", params: { level, category } });
  };

  if (loading) {
    return (
      <Screen>
        <Text style={[styles.title, { color: c.title }]}>{he.appTitle}</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <Text style={[styles.title, { color: c.title }]}>{he.appTitle}</Text>
      <Text style={[styles.sub, { color: c.subtitle }]}>{he.appSubtitle}</Text>
      <Text style={[styles.hello, { color: c.accent }]}>{he.helloName(active.displayName)}</Text>
      {isLocal ? <Text style={styles.localHint}>{he.coinsLocalOnly}</Text> : null}

      {!category ? (
        <>
          <View style={styles.info}>
            <Pressable onPress={() => router.push("/profile")}>
              <Text style={styles.coins}>🪙 {active.coins}</Text>
            </Pressable>
            <Pressable onPress={() => router.push("/profile")} style={styles.invBtn}>
              <Text style={styles.invText}>{he.profile}</Text>
            </Pressable>
            <Pressable onPress={() => router.push("/shop")} style={styles.invBtn}>
              <Text style={styles.invText}>{he.shop}</Text>
            </Pressable>
            <Pressable onPress={() => router.push("/inventory")} style={styles.invBtn}>
              <Text style={styles.invText}>{he.myGear}</Text>
            </Pressable>
          </View>

          <Text style={[styles.section, { color: c.subtitle }]}>{he.pickCategory}</Text>
          <View style={styles.categories}>
            <LevelCard
              emoji="🔤"
              title={he.categoryLanguage}
              desc={he.categoryLanguageDesc}
              color="#4D96FF"
              onPress={() => setCategory("language")}
            />
            <LevelCard
              emoji="🔢"
              title={he.categoryMath}
              desc={he.categoryMathDesc}
              color="#f9ca24"
              onPress={() => setCategory("math")}
            />
            <LevelCard
              emoji="🇬🇧"
              title={he.categoryEnglish}
              desc={he.categoryEnglishDesc}
              color="#6bcb77"
              onPress={() => setCategory("english")}
            />
            <LevelCard
              emoji="🧠"
              title={he.categoryLogic}
              desc={he.categoryLogicDesc}
              color="#a29bfe"
              onPress={() => setCategory("logic")}
            />
            <LevelCard
              emoji="🌿"
              title={he.categoryScience}
              desc={he.categoryScienceDesc}
              color="#00cec9"
              onPress={() => setCategory("science")}
            />
          </View>

          <View style={styles.actions}>
            <GhostButton label={he.leaderboard} onPress={() => router.push("/leaderboard")} />
          </View>
          <Pressable onPress={() => signOut()} style={{ marginTop: 24 }}>
            <Text style={{ color: "rgba(255,255,255,0.5)", fontFamily: "Heebo_700Bold" }}>{he.logout}</Text>
          </Pressable>
        </>
      ) : (
        <>
          <Text style={[styles.section, { color: c.subtitle }]}>
            {categoryLabel(category)} — {he.pickDifficulty}
          </Text>
          <View style={styles.levels}>
            <LevelCard
              emoji="🌱"
              title={he.easy}
              desc={levelDesc(category, "easy")}
              color="#6bcb77"
              stacked
              onPress={() => start("easy")}
            />
            <LevelCard
              emoji="⭐"
              title={he.mid}
              desc={levelDesc(category, "mid")}
              color="#f9ca24"
              stacked
              onPress={() => start("mid")}
            />
            <LevelCard
              emoji="🔥"
              title={he.hard}
              desc={levelDesc(category, "hard")}
              color="#ff6b6b"
              stacked
              onPress={() => start("hard")}
            />
          </View>
          <View style={{ marginTop: 16 }}>
            <GhostButton label={he.back} onPress={() => setCategory(null)} />
          </View>
        </>
      )}
    </Screen>
  );
}

function categoryLabel(category: Category) {
  if (category === "math") return he.categoryMath;
  if (category === "english") return he.categoryEnglish;
  if (category === "logic") return he.categoryLogic;
  if (category === "science") return he.categoryScience;
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
  if (level === "easy") return he.easyDesc;
  if (level === "mid") return he.midDesc;
  return he.hardDesc;
}

function LevelCard({
  emoji,
  title,
  desc,
  color,
  onPress,
  stacked,
}: {
  emoji: string;
  title: string;
  desc: string;
  color: string;
  onPress: () => void;
  stacked?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, stacked && styles.cardStacked, { borderColor: color }]}
    >
      <Text style={styles.emoji}>{emoji}</Text>
      <View style={stacked ? styles.cardCopy : undefined}>
        <Text style={[styles.cardTitle, stacked && styles.cardTitleStacked]}>{title}</Text>
        <Text style={[styles.cardDesc, stacked && styles.cardDescStacked]}>{desc}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 34, fontFamily: "Heebo_900Black", textAlign: "center" },
  sub: { fontSize: 16, fontFamily: "Heebo_700Bold", marginBottom: 8, textAlign: "center" },
  hello: { fontSize: 22, fontFamily: "Heebo_800ExtraBold", marginBottom: 12, textAlign: "center" },
  localHint: { color: "#ffd93d", textAlign: "center", marginBottom: 12, fontFamily: "Heebo_400Regular" },
  info: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: 12, marginVertical: 16 },
  coins: { color: "#ffd93d", fontSize: 20, fontFamily: "Heebo_800ExtraBold" },
  invBtn: { backgroundColor: "rgba(255,255,255,0.12)", paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20 },
  invText: { color: "#fff", fontFamily: "Heebo_700Bold" },
  section: { fontFamily: "Heebo_800ExtraBold", fontSize: 18, marginBottom: 12, textAlign: "center" },
  categories: { flexDirection: "row", flexWrap: "wrap", gap: 12, width: "100%", justifyContent: "center" },
  levels: { flexDirection: "column", gap: 12, width: "100%", maxWidth: 420, alignSelf: "center" },
  card: {
    flexGrow: 1,
    flexBasis: "42%",
    minWidth: 140,
    maxWidth: "100%",
    borderWidth: 2,
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  cardStacked: {
    flexGrow: 0,
    flexBasis: "auto",
    minWidth: 0,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  cardCopy: { flex: 1, minWidth: 0, alignItems: "flex-start" },
  cardTitleStacked: { marginTop: 0, textAlign: "right" },
  cardDescStacked: { textAlign: "right" },
  emoji: { fontSize: 32 },
  cardTitle: { color: "#fff", fontFamily: "Heebo_800ExtraBold", fontSize: 18, marginTop: 6, textAlign: "center" },
  cardDesc: { color: "rgba(255,255,255,0.7)", fontFamily: "Heebo_400Regular", fontSize: 12, textAlign: "center" },
  actions: { flexDirection: "row", gap: 12, marginTop: 24 },
});
