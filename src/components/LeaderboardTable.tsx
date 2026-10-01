import { Pressable, StyleSheet, Text, View } from "react-native";
import { he } from "../i18n/he";
import { BAD, GOLD, OK, font } from "../theme/colors";
import type { ScoreEntry } from "../types/models";
import { Star } from "./Art";
import { useColors } from "./ui";

const LEVEL: Record<string, string> = {
  easy: he.easy,
  mid: he.mid,
  hard: he.hard,
  "language:easy": `${he.categoryLanguage} · ${he.easy}`,
  "language:mid": `${he.categoryLanguage} · ${he.mid}`,
  "language:hard": `${he.categoryLanguage} · ${he.hard}`,
  "math:easy": `${he.categoryMath} · ${he.easy}`,
  "math:mid": `${he.categoryMath} · ${he.mid}`,
  "math:hard": `${he.categoryMath} · ${he.hard}`,
  "english:easy": `${he.categoryEnglish} · ${he.easy}`,
  "english:mid": `${he.categoryEnglish} · ${he.mid}`,
  "english:hard": `${he.categoryEnglish} · ${he.hard}`,
  "logic:easy": `${he.categoryLogic} · ${he.easy}`,
  "logic:mid": `${he.categoryLogic} · ${he.mid}`,
  "logic:hard": `${he.categoryLogic} · ${he.hard}`,
  "science:easy": `${he.categoryScience} · ${he.easy}`,
  "science:mid": `${he.categoryScience} · ${he.mid}`,
  "science:hard": `${he.categoryScience} · ${he.hard}`,
  "reading:easy": `${he.categoryReading} · ${he.easy}`,
  "reading:mid": `${he.categoryReading} · ${he.mid}`,
  "reading:hard": `${he.categoryReading} · ${he.hard}`,
};
const MEDAL = [GOLD, { ...OK, base: "#A9B6CC", lip: "#8392AD" }, { ...BAD, base: "#E0925A", lip: "#B96F3B" }];

function levelLabel(level: string) {
  if (LEVEL[level]) return LEVEL[level];
  const [cat, diff] = level.split(":");
  return LEVEL[`${cat}:${diff}`] ?? level;
}

export function LeaderboardTable({
  scores,
  highlightName,
  highlightScore,
}: {
  scores: ScoreEntry[];
  highlightName?: string;
  highlightScore?: number;
}) {
  const c = useColors();
  if (scores.length === 0) {
    return <Text style={[styles.empty, { color: c.soft }]}>{he.noScores}</Text>;
  }
  return (
    <View style={styles.table}>
      {scores.map((entry, i) => {
        const mine = entry.name === highlightName && (highlightScore == null || entry.score === highlightScore);
        const medal = MEDAL[i];
        return (
          <View
            key={entry.id}
            style={[
              styles.row,
              { backgroundColor: mine ? c.primaryTint : c.surface, borderBottomColor: c.line },
            ]}
          >
            <View
              style={[
                styles.rank,
                medal
                  ? { backgroundColor: medal.base, borderBottomColor: medal.lip, borderBottomWidth: 3 }
                  : { backgroundColor: c.ground },
              ]}
            >
              <Text style={[styles.rankText, { color: medal ? "#fff" : c.soft }]}>{i + 1}</Text>
            </View>
            <View style={styles.who}>
              <Text style={[styles.name, { color: c.ink }]} numberOfLines={1}>
                {entry.name}
              </Text>
              <Text style={[styles.level, { color: c.soft }]} numberOfLines={1}>
                {levelLabel(entry.level)}
              </Text>
            </View>
            <View style={styles.score}>
              <Star size={18} />
              <Text style={[styles.scoreText, { color: c.ink }]}>{entry.score}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

export function GhostButton({ label, onPress }: { label: string; onPress: () => void }) {
  const c = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.ghost,
        {
          backgroundColor: c.surface,
          borderBottomColor: c.line,
          borderBottomWidth: pressed ? 1 : 4,
          marginTop: pressed ? 3 : 0,
        },
      ]}
    >
      <Text style={[styles.ghostText, { color: c.ink }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  empty: { textAlign: "center", fontSize: 16, fontFamily: font.bold, marginVertical: 24 },
  table: { width: "100%", marginTop: 4, marginBottom: 20 },
  row: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
    borderRadius: 20,
    borderBottomWidth: 4,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  rank: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  rankText: { fontFamily: font.black, fontSize: 16 },
  who: { flex: 1, alignItems: "flex-end" },
  name: { fontFamily: font.heavy, fontSize: 17, textAlign: "right" },
  level: { fontFamily: font.medium, fontSize: 12, textAlign: "right" },
  score: { flexDirection: "row-reverse", alignItems: "center", gap: 4 },
  scoreText: { fontFamily: font.black, fontSize: 18 },
  ghost: {
    minHeight: 48,
    borderRadius: 22,
    paddingVertical: 11,
    paddingHorizontal: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  ghostText: { fontSize: 16, fontFamily: font.heavy },
});
