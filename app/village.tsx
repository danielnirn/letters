import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { ForestScreen, WOOD, WOOD_LIP, WoodSign } from "../src/components/Forest";
import { Building, buildingName, VillageScene } from "../src/components/VillageArt";
import { CoinPill, TopBar, useColors } from "../src/components/ui";
import { useProgress } from "../src/context/ProgressContext";
import { VILLAGE_ORDER } from "../src/game/village";
import { nextElement, sceneLevels } from "../src/game/economy";
import { he } from "../src/i18n/he";
import { CATEGORY_COLORS, font } from "../src/theme/colors";

export default function VillageScreen() {
  const router = useRouter();
  const { active } = useProgress();
  const c = useColors();
  const [width, setWidth] = useState(0);
  const levels = sceneLevels(active);
  const next = nextElement(active);

  return (
    <ForestScreen>
      <TopBar
        onBack={() => router.replace("/")}
        backLabel={he.backLabel}
        center={<WoodSign text={he.villageTitle(active.displayName)} />}
        trailing={<CoinPill coins={active.coins} />}
      />

      <View style={styles.sceneFrame}>
        <View style={styles.sceneWrap} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
          {width > 0 ? (
          <VillageScene
            levels={levels}
            litCategory={next.category}
            width={width}
          />
          ) : null}
        </View>
      </View>
      <View style={styles.levelSign}>
        <WoodSign text={he.sceneLabel(active.sceneIndex + 1)} big />
      </View>

      {VILLAGE_ORDER.map((cat) => {
        const level = levels[cat];
        const stepName = he.buildingLevels[level] ?? he.buildingLevels[0];
        const sw = CATEGORY_COLORS[cat];
        return (
          <View
            key={cat}
            style={[styles.row, { backgroundColor: c.surface, borderColor: sw.tint, borderBottomColor: sw.lip }]}
          >
            <View style={[styles.art, { backgroundColor: sw.tint }]}>
              <Building category={cat} level={level} detail={0} size={78} />
            </View>
            <View style={styles.copy}>
              <Text style={[styles.name, { color: c.ink }]}>{buildingName(cat)}</Text>
              <View style={styles.chipRow}>
                <View style={[styles.levelChip, { backgroundColor: sw.tint }]}>
                  <Text style={[styles.levelChipText, { color: sw.deep }]}>{stepName}</Text>
                </View>
              </View>
            </View>
          </View>
        );
      })}
    </ForestScreen>
  );
}

const styles = StyleSheet.create({
  sceneFrame: {
    width: "100%",
    backgroundColor: WOOD,
    borderBottomWidth: 7,
    borderBottomColor: WOOD_LIP,
    borderRadius: 30,
    padding: 7,
    marginTop: 10,
  },
  sceneWrap: { width: "100%", borderRadius: 24, overflow: "hidden" },
  levelSign: { marginTop: -22, marginBottom: 16 },
  row: {
    width: "100%",
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 14,
    borderRadius: 24,
    borderWidth: 3,
    borderBottomWidth: 6,
    padding: 12,
    marginBottom: 12,
  },
  art: { width: 90, height: 90, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  copy: { flex: 1, alignItems: "flex-end", gap: 6 },
  name: { fontFamily: font.heavy, fontSize: 19, textAlign: "right" },
  chipRow: { flexDirection: "row-reverse", alignItems: "center", gap: 6 },
  levelChip: { borderRadius: 999, paddingVertical: 3, paddingHorizontal: 10 },
  levelChipText: { fontFamily: font.bold, fontSize: 12 },
});
