import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { Screen } from "../src/components/Screen";
import { PrimaryButton } from "../src/components/PrimaryButton";
import { Buddy, Card, CoinPill, TopBar, useColors } from "../src/components/ui";
import { useProgress } from "../src/context/ProgressContext";
import { SHOP_ITEMS } from "../src/game/shop";
import { he } from "../src/i18n/he";
import { GOLD, font } from "../src/theme/colors";

export default function InventoryScreen() {
  const router = useRouter();
  const { active } = useProgress();
  const c = useColors();
  const items = SHOP_ITEMS.filter((it) => it.consumable).filter(
    (it) => (active.inventory[it.id] || 0) > 0,
  );

  return (
    <Screen>
      <TopBar
        onBack={() => router.back()}
        backLabel={he.backLabel}
        center={
          <Text style={[styles.title, { color: c.ink }]} numberOfLines={1}>
            {he.gearTitle(active.displayName)}
          </Text>
        }
        trailing={<CoinPill coins={active.coins} />}
      />
      {items.length === 0 ? (
        <Card style={styles.empty}>
          <Buddy size={110} body={c.primary} />
          <Text style={[styles.emptyTitle, { color: c.ink }]}>{he.emptyBag}</Text>
          <Text style={[styles.emptyHint, { color: c.soft }]}>{he.emptyBagHint}</Text>
          <PrimaryButton label={he.toShop} icon="bag" onPress={() => router.push("/shop")} style={{ marginTop: 16 }} />
        </Card>
      ) : (
        items.map((it) => (
          <View key={it.id} style={[styles.row, { backgroundColor: c.surface, borderBottomColor: c.line }]}>
            <View style={[styles.emojiWrap, { backgroundColor: c.ground }]}>
              <Text style={styles.emoji}>{it.emoji}</Text>
            </View>
            <View style={{ flex: 1, alignItems: "flex-end" }}>
              <Text style={[styles.name, { color: c.ink }]}>{it.name}</Text>
              <Text style={[styles.desc, { color: c.soft }]}>
                {it.desc} · {he.forGame}
              </Text>
            </View>
            <View style={[styles.count, { backgroundColor: GOLD.tint }]}>
              <Text style={[styles.countText, { color: GOLD.deep }]}>×{active.inventory[it.id]}</Text>
            </View>
          </View>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 20, fontFamily: font.black },
  empty: { alignItems: "center", paddingVertical: 24, marginTop: 12 },
  emptyTitle: { fontFamily: font.black, fontSize: 22, marginTop: 12 },
  emptyHint: { fontFamily: font.medium, fontSize: 15, marginTop: 4, textAlign: "center" },
  row: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
    width: "100%",
    borderRadius: 22,
    borderBottomWidth: 5,
    padding: 14,
    marginBottom: 12,
  },
  emojiWrap: { width: 56, height: 56, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  emoji: { fontSize: 30 },
  name: { fontFamily: font.heavy, fontSize: 17 },
  desc: { fontFamily: font.medium, fontSize: 13, textAlign: "right", marginTop: 2 },
  count: { borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12 },
  countText: { fontFamily: font.black, fontSize: 16 },
});
