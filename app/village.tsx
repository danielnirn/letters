import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Screen } from "../src/components/Screen";
import { Star } from "../src/components/Art";
import { Building, buildingName, VillageScene } from "../src/components/VillageArt";
import { ProgressBar, StarPill, TopBar, useColors } from "../src/components/ui";
import { useProgress } from "../src/context/ProgressContext";
import type { Category } from "../src/game/config";
import {
  buildingLevel,
  categoryStars,
  LEVEL_STARS,
  nextLevelStars,
  totalStars,
  VILLAGE_ORDER,
  villageLevels,
} from "../src/game/village";
import { he } from "../src/i18n/he";
import { CATEGORY_COLORS, GOLD, OK, font } from "../src/theme/colors";

export default function VillageScreen() {
  const router = useRouter();
  const { active } = useProgress();
  const c = useColors();
  const [width, setWidth] = useState(0);
  const levels = villageLevels(active);

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
        trailing={<StarPill stars={totalStars(active)} />}
      />

      <View style={styles.sceneWrap} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        {width > 0 ? <VillageScene levels={levels} width={width} /> : null}
      </View>
      <Text style={[styles.hint, { color: c.soft }]}>{he.villageHint}</Text>

      {VILLAGE_ORDER.map((cat) => {
        const stars = categoryStars(active, cat);
        const level = buildingLevel(stars);
        const next = nextLevelStars(stars);
        const from = level === 0 ? 0 : LEVEL_STARS[level - 1];
        const pct = next == null ? 100 : ((stars - from) / (next - from)) * 100;
        const sw = CATEGORY_COLORS[cat];
        return (
          <Pressable
            key={cat}
            onPress={() => router.push({ pathname: "/", params: { category: cat } })}
            style={({ pressed }) => [
              styles.row,
              {
                backgroundColor: c.surface,
                borderBottomColor: c.line,
                borderBottomWidth: pressed ? 2 : 5,
                marginTop: pressed ? 3 : 0,
              },
            ]}
          >
            <View style={[styles.art, { backgroundColor: sw.tint }]}>
              <Building category={cat} level={level} size={78} />
            </View>
            <View style={styles.copy}>
              <View style={styles.nameRow}>
                <Text style={[styles.name, { color: c.ink }]}>{buildingName(cat)}</Text>
                <View style={[styles.levelChip, { backgroundColor: sw.tint }]}>
                  <Text style={[styles.levelChipText, { color: sw.deep }]}>{he.buildingLevels[level]}</Text>
                </View>
              </View>
              <View style={styles.barRow}>
                <View style={styles.starCount}>
                  <Star size={14} />
                  <Text style={[styles.starCountText, { color: c.soft }]}>
                    {next == null ? stars : `${stars}/${next}`}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <ProgressBar pct={pct} color={next == null ? OK.base : GOLD.base} height={10} />
                </View>
              </View>
              <Text style={[styles.next, { color: next == null ? OK.deep : sw.deep }]}>
                {next == null ? he.buildingDone : `${he.starsToNext(next - stars)} · ${he.playToBuild}`}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: font.heavy, fontSize: 19, textAlign: "center" },
  sceneWrap: { width: "100%", marginTop: 4 },
  hint: { fontFamily: font.medium, fontSize: 14, lineHeight: 21, textAlign: "center", marginVertical: 14 },
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
  nameRow: { flexDirection: "row-reverse", alignItems: "center", gap: 8 },
  name: { fontFamily: font.heavy, fontSize: 19, textAlign: "right" },
  levelChip: { borderRadius: 999, paddingVertical: 3, paddingHorizontal: 10 },
  levelChipText: { fontFamily: font.bold, fontSize: 12 },
  barRow: { alignSelf: "stretch", flexDirection: "row-reverse", alignItems: "center", gap: 8 },
  starCount: { flexDirection: "row-reverse", alignItems: "center", gap: 3 },
  starCountText: { fontFamily: font.bold, fontSize: 13 },
  next: { fontFamily: font.bold, fontSize: 13, textAlign: "right" },
});
