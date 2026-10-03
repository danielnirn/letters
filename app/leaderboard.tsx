import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Screen } from "../src/components/Screen";
import { LeaderboardTable } from "../src/components/LeaderboardTable";
import { Icon } from "../src/components/Art";
import { VillageScene } from "../src/components/VillageArt";
import { AvatarFigure } from "../src/components/AvatarArt";
import { PrimaryButton } from "../src/components/PrimaryButton";
import { TopBar, useColors } from "../src/components/ui";
import { useProgress } from "../src/context/ProgressContext";
import { defaultAvatar } from "../src/game/avatar";
import { CATEGORIES, type Category } from "../src/game/config";
import { he } from "../src/i18n/he";
import { BAD, GOLD, font } from "../src/theme/colors";
import type { ScoreEntry } from "../src/types/models";

export function LeaderboardBoard() {
  const { topScores, active, cloudError } = useProgress();
  const c = useColors();
  const [picked, setPicked] = useState<ScoreEntry | null>(null);
  const [sceneWidth, setSceneWidth] = useState(0);
  const levels = Object.fromEntries(CATEGORIES.map((cat) => [cat, picked?.village?.[cat] ?? 0])) as Record<Category, number>;
  const built = CATEGORIES.filter((cat) => levels[cat] > 0).length;

  return (
    <>
      {cloudError ? <Text style={[styles.err, { color: BAD.deep }]}>{he.cloudError}</Text> : null}
      <LeaderboardTable scores={topScores} highlightName={active.displayName} onSelect={setPicked} />
      <Modal visible={picked != null} transparent animationType="fade" onRequestClose={() => setPicked(null)}>
        <View style={styles.backdrop}>
          <Pressable accessibilityLabel={he.closeReport} style={StyleSheet.absoluteFill} onPress={() => setPicked(null)} />
          {picked ? (
            <View style={[styles.sheet, { backgroundColor: c.surface, borderBottomColor: c.line }]}>
              <AvatarFigure
                loadout={picked.avatar ?? defaultAvatar()}
                gender={picked.gender === "boy" ? "boy" : "girl"}
                height={170}
              />
              <Text style={[styles.sheetName, { color: c.ink }]}>{he.villageTitle(picked.name)}</Text>
              <View style={styles.scene} onLayout={(e) => setSceneWidth(e.nativeEvent.layout.width)}>
                {sceneWidth > 0 ? <VillageScene levels={levels} width={sceneWidth} aspect={0.55} /> : null}
              </View>
              <Text style={[styles.sheetScore, { color: c.soft }]}>
                {picked.village ? he.leaderboardVillageStats(picked.stars ?? 0, built) : he.leaderboardNoVillage}
              </Text>
              <PrimaryButton label={he.closeReport} variant="soft" onPress={() => setPicked(null)} />
            </View>
          ) : null}
        </View>
      </Modal>
    </>
  );
}

export default function LeaderboardScreen() {
  const router = useRouter();
  const c = useColors();

  return (
    <Screen>
      <TopBar onBack={() => router.back()} backLabel={he.backLabel} />
      <View style={[styles.trophy, { backgroundColor: GOLD.base, borderBottomColor: GOLD.lip }]}>
        <Icon name="trophy" size={44} color="#fff" weight={2.4} />
      </View>
      <Text style={[styles.title, { color: c.ink }]}>{he.leaderboardPlain}</Text>
      <Text style={[styles.sub, { color: c.soft }]}>{he.leaderboardSub}</Text>
      <LeaderboardBoard />
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
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(31,42,68,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  sheet: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 28,
    borderBottomWidth: 6,
    padding: 20,
    alignItems: "center",
    gap: 8,
  },
  sheetName: { fontFamily: font.black, fontSize: 22, textAlign: "center", marginTop: 4 },
  sheetScore: { fontFamily: font.heavy, fontSize: 15, textAlign: "center", marginBottom: 8 },
  scene: { alignSelf: "stretch" },
});
