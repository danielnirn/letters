import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { Screen } from "../src/components/Screen";
import { LeaderboardTable } from "../src/components/LeaderboardTable";
import { Icon } from "../src/components/Art";
import { TopBar, useColors } from "../src/components/ui";
import { useProgress } from "../src/context/ProgressContext";
import { he } from "../src/i18n/he";
import { BAD, GOLD, font } from "../src/theme/colors";

export default function LeaderboardScreen() {
  const router = useRouter();
  const { topScores, active, cloudError } = useProgress();
  const c = useColors();

  return (
    <Screen>
      <TopBar onBack={() => router.back()} backLabel={he.backLabel} />
      <View style={[styles.trophy, { backgroundColor: GOLD.base, borderBottomColor: GOLD.lip }]}>
        <Icon name="trophy" size={44} color="#fff" weight={2.4} />
      </View>
      <Text style={[styles.title, { color: c.ink }]}>{he.leaderboardPlain}</Text>
      <Text style={[styles.sub, { color: c.soft }]}>{he.leaderboardSub}</Text>
      {cloudError ? <Text style={[styles.err, { color: BAD.deep }]}>{he.cloudError}</Text> : null}
      <LeaderboardTable scores={topScores} highlightName={active.displayName} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  trophy: {
    width: 84,
    height: 84,
    borderRadius: 28,
    borderBottomWidth: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 28, fontFamily: font.black, textAlign: "center", marginTop: 12 },
  sub: { fontFamily: font.medium, marginBottom: 14, textAlign: "center" },
  err: { fontFamily: font.bold, textAlign: "center", marginBottom: 8 },
});
