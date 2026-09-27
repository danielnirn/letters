import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { Screen } from "../src/components/Screen";
import { GhostButton } from "../src/components/LeaderboardTable";
import { useProgress } from "../src/context/ProgressContext";
import { SHOP_ITEMS } from "../src/game/shop";
import { he } from "../src/i18n/he";
import { colorsFor } from "../src/theme/colors";

export default function InventoryScreen() {
  const router = useRouter();
  const { active } = useProgress();
  const c = colorsFor(active.theme);
  const items = SHOP_ITEMS.filter((it) => it.consumable).filter(
    (it) => (active.inventory[it.id] || 0) > 0,
  );

  return (
    <Screen>
      <Text style={[styles.title, { color: c.title }]}>{he.gearOf(active.displayName)}</Text>
      <Text style={[styles.coins, { color: c.coin }]}>{he.coinsCount(active.coins)}</Text>
      {items.length === 0 ? (
        <Text style={styles.empty}>{he.emptyInventory}</Text>
      ) : (
        items.map((it) => (
          <View key={it.id} style={styles.row}>
            <Text style={{ fontSize: 32 }}>{it.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{it.name}</Text>
              <Text style={styles.desc}>
                {it.desc} · {he.forGame}
              </Text>
            </View>
            <Text style={styles.count}>×{active.inventory[it.id]}</Text>
          </View>
        ))
      )}
      <GhostButton label={he.back} onPress={() => router.back()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 26, fontFamily: "Heebo_900Black", textAlign: "center" },
  coins: { fontFamily: "Heebo_800ExtraBold", marginBottom: 16 },
  empty: { color: "rgba(255,255,255,0.7)", textAlign: "center", fontFamily: "Heebo_400Regular", marginBottom: 16 },
  row: { flexDirection: "row", alignItems: "center", gap: 10, width: "100%", marginBottom: 10 },
  name: { color: "#fff", fontFamily: "Heebo_800ExtraBold" },
  desc: { color: "rgba(255,255,255,0.65)", fontFamily: "Heebo_400Regular" },
  count: { color: "#ffd93d", fontFamily: "Heebo_800ExtraBold" },
});
