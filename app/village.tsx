import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Screen } from "../src/components/Screen";
import { Building, buildingName, VillageScene } from "../src/components/VillageArt";
import { CoinPill, TopBar, useColors } from "../src/components/ui";
import { useProgress } from "../src/context/ProgressContext";
import {
  currentBuild,
  ownedLevel,
  villageDetails,
  villageLevel,
  villageLevels,
  VILLAGE_ORDER,
  wishCategory,
  wishDoneToday,
} from "../src/game/village";
import { he } from "../src/i18n/he";
import { CATEGORY_COLORS, font } from "../src/theme/colors";

export default function VillageScreen() {
  const router = useRouter();
  const { active } = useProgress();
  const c = useColors();
  const [width, setWidth] = useState(0);
  const levels = villageLevels(active);
  const wishCat = wishCategory(active.id);
  const wished = wishDoneToday(active);
  const build = currentBuild(active);

  return (
    <Screen>
      <TopBar
        onBack={() => router.replace("/")}
        backLabel={he.backLabel}
        center={
          <Text style={[styles.title, { color: c.ink }]} numberOfLines={1}>
            {he.villageTitle(active.displayName)}
          </Text>
        }
        trailing={<CoinPill coins={active.coins} />}
      />

      <View style={styles.sceneWrap} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        {width > 0 ? (
          <VillageScene
            levels={levels}
            details={villageDetails(active)}
            blooms={active.villageBlooms ?? 0}
            litCategory={build?.category ?? null}
            width={width}
          />
        ) : null}
      </View>
      <Text style={[styles.level, { color: c.ink }]}>{he.villageLevelLabel(villageLevel(active))}</Text>

      {VILLAGE_ORDER.map((cat) => {
        const level = ownedLevel(active, cat);
        const stepName = he.buildingLevels[level] ?? he.buildingLevels[0];
        const sw = CATEGORY_COLORS[cat];
        return (
          <View
            key={cat}
            style={[styles.row, { backgroundColor: c.surface, borderBottomColor: c.line, borderBottomWidth: 5 }]}
          >
            <View style={[styles.art, { backgroundColor: sw.tint }]}>
              <Building category={cat} level={level} detail={0} lit={wished && cat === wishCat} size={78} />
            </View>
            <View style={styles.copy}>
              <Text style={[styles.name, { color: c.ink }]}>{buildingName(cat)}</Text>
              <View style={[styles.levelChip, { backgroundColor: sw.tint }]}>
                <Text style={[styles.levelChipText, { color: sw.deep }]}>{stepName}</Text>
              </View>
            </View>
          </View>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: font.heavy, fontSize: 19, textAlign: "center" },
  sceneWrap: { width: "100%", marginTop: 4 },
  level: { fontFamily: font.black, fontSize: 28, textAlign: "center", marginTop: 12, marginBottom: 16 },
  row: {
    width: "100%",
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 14,
    borderRadius: 24,
    padding: 12,
    marginBottom: 12,
  },
  art: { width: 90, height: 90, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  copy: { flex: 1, alignItems: "flex-end", gap: 6 },
  name: { fontFamily: font.heavy, fontSize: 19, textAlign: "right" },
  levelChip: { borderRadius: 999, paddingVertical: 3, paddingHorizontal: 10 },
  levelChipText: { fontFamily: font.bold, fontSize: 12 },
});
