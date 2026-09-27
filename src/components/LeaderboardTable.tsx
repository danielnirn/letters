import { Pressable, StyleSheet, Text, View } from "react-native";
import { he } from "../i18n/he";
import { colorsFor } from "../theme/colors";
import type { ScoreEntry } from "../types/models";
import { useProgress } from "../context/ProgressContext";

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
};
const RANK = ["🥇", "🥈", "🥉"];

export function LeaderboardTable({
  scores,
  highlightName,
  highlightScore,
}: {
  scores: ScoreEntry[];
  highlightName?: string;
  highlightScore?: number;
}) {
  const { active } = useProgress();
  const c = colorsFor(active.theme);
  if (scores.length === 0) {
    return <Text style={[styles.empty, { color: c.subtitle }]}>{he.noScores}</Text>;
  }
  return (
    <View style={styles.table}>
      <View style={styles.head}>
        <Text style={styles.th}>{he.colRank}</Text>
        <Text style={[styles.th, styles.name]}>{he.colName}</Text>
        <Text style={styles.th}>{he.colScore}</Text>
        <Text style={styles.th}>{he.colLevel}</Text>
      </View>
      {scores.map((entry, i) => {
        const mine = entry.name === highlightName && entry.score === highlightScore;
        return (
          <View key={entry.id} style={[styles.row, mine && styles.mine]}>
            <Text style={styles.td}>{i < 3 ? RANK[i] : String(i + 1)}</Text>
            <Text style={[styles.td, styles.name]}>{entry.name}</Text>
            <Text style={styles.td}>{entry.score} ⭐</Text>
            <Text style={styles.td}>{LEVEL[entry.level] ?? entry.level}</Text>
          </View>
        );
      })}
    </View>
  );
}

export function GhostButton({ label, onPress }: { label: string; onPress: () => void }) {
  const { active } = useProgress();
  const c = colorsFor(active.theme);
  return (
    <Pressable onPress={onPress} style={[styles.ghost, { borderColor: c.accent }]}>
      <Text style={[styles.ghostText, { color: c.accent }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  empty: { textAlign: "center", fontSize: 16, fontFamily: "Heebo_700Bold", marginVertical: 16 },
  table: { width: "100%", marginTop: 12 },
  head: { flexDirection: "row", paddingVertical: 8, opacity: 0.7 },
  row: { flexDirection: "row", paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.12)" },
  mine: { backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 8 },
  th: { flex: 1, color: "#fff", fontWeight: "800", textAlign: "center", fontFamily: "Heebo_800ExtraBold" },
  td: { flex: 1, color: "#fff", textAlign: "center", fontFamily: "Heebo_400Regular" },
  name: { flex: 1.4 },
  ghost: { borderWidth: 2, borderRadius: 28, paddingVertical: 10, paddingHorizontal: 18 },
  ghostText: { fontWeight: "800", fontSize: 16, fontFamily: "Heebo_800ExtraBold" },
});
