import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { ForestScreen, NIGHT, WOOD, WOOD_LIP, WoodSign } from "../src/components/Forest";
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
import { BAD, GOLD, OK, font } from "../src/theme/colors";
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
            <View style={styles.sheet}>
              <View style={styles.sheetSign}>
                <WoodSign text={he.villageTitle(picked.name)} />
              </View>
              <AvatarFigure
                loadout={picked.avatar ?? defaultAvatar()}
                gender={picked.gender === "boy" ? "boy" : "girl"}
                height={170}
              />
              <View style={styles.sceneFrame}>
                <View style={styles.scene} onLayout={(e) => setSceneWidth(e.nativeEvent.layout.width)}>
                  {sceneWidth > 0 ? <VillageScene levels={levels} width={sceneWidth} aspect={0.55} /> : null}
                </View>
              </View>
              <Text style={[styles.sheetScore, { color: c.soft }]}>
                {picked.village ? he.leaderboardVillageStats(picked.stars ?? 0, built) : he.leaderboardNoVillage}
              </Text>
              <PrimaryButton label={he.closeReport} color={OK.base} onPress={() => setPicked(null)} style={{ alignSelf: "stretch" }} />
            </View>
          ) : null}
        </View>
      </Modal>
    </>
  );
}

export default function LeaderboardScreen() {
  const router = useRouter();

  return (
    <ForestScreen>
      <TopBar onBack={() => router.back()} backLabel={he.backLabel} center={<WoodSign text={he.leaderboardPlain} />} />
      <View style={[styles.trophy, { backgroundColor: GOLD.base, borderBottomColor: GOLD.lip }]}>
        <Icon name="trophy" size={44} color="#fff" weight={2.4} />
      </View>
      <View style={styles.subPill}>
        <Text style={styles.sub}>{he.leaderboardSub}</Text>
      </View>
      <LeaderboardBoard />
    </ForestScreen>
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
  subPill: { ...{
      backgroundColor: NIGHT,
      borderRadius: 999,
      borderWidth: 2,
      borderColor: "#fff",
      paddingVertical: 4,
      paddingHorizontal: 14,
    }, marginTop: 12, marginBottom: 14 },
  sub: { fontFamily: font.bold, fontSize: 14, color: "#fff", textAlign: "center" },
  err: { fontFamily: font.bold, textAlign: "center", marginBottom: 8, backgroundColor: "#fff", borderRadius: 12, padding: 6 },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(31,42,68,0.6)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  sheet: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#fff",
    borderRadius: 30,
    borderWidth: 3,
    borderColor: "#F1D9B3",
    borderBottomWidth: 8,
    borderBottomColor: WOOD_LIP,
    paddingTop: 34,
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: "center",
    gap: 8,
  },
  sheetSign: { position: "absolute", top: -24, left: 0, right: 0, alignItems: "center", zIndex: 2 },
  sceneFrame: {
    alignSelf: "stretch",
    backgroundColor: WOOD,
    borderBottomWidth: 6,
    borderBottomColor: WOOD_LIP,
    borderRadius: 22,
    padding: 5,
  },
  sheetScore: { fontFamily: font.heavy, fontSize: 15, textAlign: "center", marginBottom: 8 },
  scene: { alignSelf: "stretch", borderRadius: 17, overflow: "hidden" },
});
