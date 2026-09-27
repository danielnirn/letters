import { useRouter } from "expo-router";
import { StyleSheet, Text } from "react-native";
import { Screen } from "../src/components/Screen";
import { GhostButton, LeaderboardTable } from "../src/components/LeaderboardTable";
import { useProgress } from "../src/context/ProgressContext";
import { he } from "../src/i18n/he";
import { colorsFor } from "../src/theme/colors";

export default function LeaderboardScreen() {
  const router = useRouter();
  const { topScores, active, cloudError } = useProgress();
  const c = colorsFor(active.theme);

  return (
    <Screen>
      <Text style={[styles.title, { color: c.title }]}>{he.leaderboardTitle}</Text>
      <Text style={[styles.sub, { color: c.subtitle }]}>{he.leaderboardSub}</Text>
      {cloudError ? <Text style={styles.err}>{he.cloudError}</Text> : null}
      <LeaderboardTable scores={topScores} highlightName={active.displayName} />
      <GhostButton label={he.back} onPress={() => router.back()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontFamily: "Heebo_900Black", textAlign: "center" },
  sub: { fontFamily: "Heebo_400Regular", marginBottom: 8, textAlign: "center" },
  err: { color: "#ff6b6b", fontFamily: "Heebo_700Bold", textAlign: "center", marginBottom: 8 },
});
