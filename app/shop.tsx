import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Screen } from "../src/components/Screen";
import { GhostButton } from "../src/components/LeaderboardTable";
import { useToast } from "../src/components/Toast";
import { useAuth } from "../src/context/AuthContext";
import { useProgress } from "../src/context/ProgressContext";
import { SHOP_ITEMS, type ShopItem } from "../src/game/shop";
import { CONFIG } from "../src/game/config";
import { he } from "../src/i18n/he";
import { colorsFor } from "../src/theme/colors";

export default function ShopScreen() {
  const router = useRouter();
  const { isLocal } = useAuth();
  const progress = useProgress();
  const { show, node } = useToast();
  const c = colorsFor(progress.active.theme);

  const onBuy = async (item: ShopItem) => {
    const result = await progress.buyItem(item);
    if (result === "funds") {
      show(he.notEnoughCoins(item.cost));
      return;
    }
    if (result === "fail") {
      show(he.cloudError);
      return;
    }
    const extra = isLocal ? he.coinsLocalOnly : he.savedToCloud;
    if (item.consumable) show(`${he.addedToBag(item.name)}\n${extra}`);
    else if (item.type === "theme") show(`${he.themeOn(item.name)}\n${extra}`);
    else show(`${he.purchased(item.name)}\n${extra}`);
  };

  const renderGrid = (category: ShopItem["category"]) => {
    const items = SHOP_ITEMS.filter((it) => it.category === category);
    return (
      <View style={styles.grid}>
        {items.map((item) => {
          const owned = progress.active.purchases.includes(item.id);
          const locked = item.category === "coming";
          const isActiveTheme = item.type === "theme" && progress.active.theme === item.id;
          const canAfford = progress.active.coins >= item.cost;
          return (
            <View
              key={item.id}
              style={[styles.card, isActiveTheme && { borderColor: c.accent, borderWidth: 2 }]}
            >
              <Text style={styles.emoji}>{item.emoji}</Text>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.desc}>{item.desc}</Text>
              {locked ? (
                <Text style={styles.badge}>{he.comingSoon}</Text>
              ) : owned && item.type === "theme" ? (
                isActiveTheme ? (
                  <Text style={styles.badge}>{he.active}</Text>
                ) : (
                  <>
                    <Text style={styles.badge}>{he.owned}</Text>
                    <Pressable style={styles.buy} onPress={() => progress.activateTheme(item.id)}>
                      <Text style={styles.buyText}>{he.activate}</Text>
                    </Pressable>
                  </>
                )
              ) : owned && !item.consumable ? (
                <Text style={styles.badge}>{he.owned}</Text>
              ) : (
                <>
                  <Text style={styles.cost}>🪙 {item.cost}</Text>
                  <Pressable
                    disabled={!canAfford && !owned}
                    style={[styles.buy, !canAfford && !owned && { opacity: 0.4 }]}
                    onPress={() => onBuy(item)}
                  >
                    <Text style={styles.buyText}>{owned && item.consumable ? he.buyAgain : he.buy}</Text>
                  </Pressable>
                </>
              )}
            </View>
          );
        })}
      </View>
    );
  };

  const consumables = SHOP_ITEMS.filter((it) => it.consumable);
  const invItems = consumables.filter((it) => (progress.active.inventory[it.id] || 0) > 0);

  return (
    <Screen>
      {node}
      <Text style={[styles.title, { color: c.title }]}>{he.shopTitle}</Text>
      <Text style={[styles.balance, { color: c.coin }]}>🪙 {progress.active.coins}</Text>

      <Text style={styles.section}>{he.tools}</Text>
      {renderGrid("tools")}
      <Text style={styles.section}>{he.cosmetics}</Text>
      {renderGrid("cosmetics")}
      {progress.active.theme ? (
        <Pressable
          onPress={async () => {
            await progress.activateTheme(null);
            show(he.themeReset);
          }}
        >
          <Text style={{ color: c.accent, fontFamily: "Heebo_700Bold", marginBottom: 12 }}>
            {he.resetTheme}
          </Text>
        </Pressable>
      ) : null}
      <Text style={styles.section}>{he.coming}</Text>
      {renderGrid("coming")}
      <Text style={styles.section}>{he.myInventory}</Text>
      {invItems.length === 0 ? (
        <Text style={styles.empty}>{he.emptyInventory}</Text>
      ) : (
        invItems.map((it) => (
          <View key={it.id} style={styles.invRow}>
            <Text style={styles.emoji}>{it.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{it.name}</Text>
              <Text style={styles.desc}>{it.desc}</Text>
            </View>
            <Text style={styles.cost}>×{progress.active.inventory[it.id]}</Text>
          </View>
        ))
      )}
      <Text style={styles.notice}>{he.shopNotice(CONFIG.coinsCorrect, CONFIG.coinsBonus)}</Text>
      <GhostButton label={he.back} onPress={() => router.back()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontFamily: "Heebo_900Black" },
  balance: { fontSize: 22, fontFamily: "Heebo_800ExtraBold", marginBottom: 8 },
  section: { color: "#fff", fontFamily: "Heebo_800ExtraBold", alignSelf: "flex-start", marginTop: 16, marginBottom: 8 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "center" },
  card: {
    width: "47%",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
  },
  emoji: { fontSize: 32 },
  name: { color: "#fff", fontFamily: "Heebo_800ExtraBold", textAlign: "center" },
  desc: { color: "rgba(255,255,255,0.7)", fontFamily: "Heebo_400Regular", fontSize: 12, textAlign: "center" },
  badge: { color: "#6bcb77", fontFamily: "Heebo_700Bold", marginTop: 6 },
  cost: { color: "#ffd93d", fontFamily: "Heebo_800ExtraBold", marginTop: 6 },
  buy: { marginTop: 8, backgroundColor: "#6bcb77", paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20 },
  buyText: { color: "#fff", fontFamily: "Heebo_800ExtraBold" },
  empty: { color: "rgba(255,255,255,0.7)", textAlign: "center", fontFamily: "Heebo_400Regular" },
  invRow: { flexDirection: "row", alignItems: "center", gap: 10, width: "100%", marginBottom: 8 },
  notice: { color: "rgba(255,255,255,0.6)", textAlign: "center", marginVertical: 16, fontFamily: "Heebo_400Regular" },
});
