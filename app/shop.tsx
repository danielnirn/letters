import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Screen } from "../src/components/Screen";
import { AvatarPreview } from "../src/components/AvatarPreview";
import { useToast } from "../src/components/Toast";
import { useAuth } from "../src/context/AuthContext";
import { useProgress } from "../src/context/ProgressContext";
import { defaultAvatar, equippedId } from "../src/game/avatar";
import { SHOP_ITEMS, type ShopItem, type ShopSection } from "../src/game/shop";
import { CONFIG } from "../src/game/config";
import { he } from "../src/i18n/he";
import { GOLD, OK, font } from "../src/theme/colors";
import { Coin } from "../src/components/Art";
import { CoinPill, TopBar, useColors } from "../src/components/ui";
import type { AvatarSlot } from "../src/types/models";

const SLOT_LABEL: Record<AvatarSlot, string> = {
  base: he.slotBase,
  hat: he.slotHat,
  top: he.slotTop,
  bottom: he.slotBottom,
  shoes: he.slotShoes,
  extra: he.slotExtra,
};

function isOwned(purchases: string[], item: ShopItem) {
  if (item.id === "avatar_base_kid") return true;
  return purchases.includes(item.id);
}

export default function ShopScreen() {
  const router = useRouter();
  const { isLocal } = useAuth();
  const progress = useProgress();
  const { show, node } = useToast();
  const c = useColors();
  const [section, setSection] = useState<ShopSection>("enhance");
  const avatar = progress.active.avatar ?? defaultAvatar();

  const onBuy = async (item: ShopItem) => {
    if (item.locked) return;
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

  const renderGrid = (items: ShopItem[]) => (
    <View style={styles.grid}>
      {items.map((item) => {
        const owned = isOwned(progress.active.purchases, item);
        const locked = Boolean(item.locked);
        const isActiveTheme = item.type === "theme" && progress.active.theme === item.id;
        const equipped =
          item.section === "avatar" && item.slot
            ? equippedId(avatar, item.slot) === item.id
            : false;
        const canAfford = progress.active.coins >= item.cost;
        const highlight = isActiveTheme || equipped;
        return (
          <View
            key={item.id}
            style={[
              styles.card,
              {
                backgroundColor: c.surface,
                borderColor: highlight ? c.primary : "transparent",
                borderBottomColor: highlight ? c.primaryLip : c.line,
                opacity: locked ? 0.6 : 1,
              },
            ]}
          >
            <View style={[styles.emojiWrap, { backgroundColor: highlight ? c.primaryTint : c.ground }]}>
              <Text style={styles.emoji}>{item.emoji}</Text>
            </View>
            {item.slot ? <Text style={[styles.slot, { color: c.soft }]}>{SLOT_LABEL[item.slot]}</Text> : null}
            <Text style={[styles.name, { color: c.ink }]}>{item.name}</Text>
            <Text style={[styles.desc, { color: c.soft }]}>{item.desc}</Text>
            <View style={styles.cardFoot}>
              {locked ? (
                <Tag label={he.comingSoonPlain} bg={c.ground} fg={c.soft} />
              ) : owned && item.type === "theme" ? (
                isActiveTheme ? (
                  <Tag label={he.activePlain} bg={c.primaryTint} fg={c.primary} />
                ) : (
                  <SmallButton label={he.activate} color={c.primary} lip={c.primaryLip} onPress={() => progress.activateTheme(item.id)} />
                )
              ) : owned && item.section === "avatar" && item.slot ? (
                equipped ? (
                  <>
                    <Tag label={he.equipped} bg={c.primaryTint} fg={c.primary} />
                    {item.slot !== "base" ? (
                      <SmallButton label={he.avatarUnequip} soft onPress={() => progress.equipAvatar(item.slot!, null)} />
                    ) : null}
                  </>
                ) : (
                  <SmallButton label={he.activate} color={c.primary} lip={c.primaryLip} onPress={() => progress.equipAvatar(item.slot!, item.id)} />
                )
              ) : owned && !item.consumable ? (
                <Tag label={he.ownedPlain} bg={OK.tint} fg={OK.deep} />
              ) : (
                <SmallButton
                  label={String(item.cost)}
                  coin
                  color={OK.base}
                  lip={OK.lip}
                  disabled={!canAfford && !owned}
                  onPress={() => onBuy(item)}
                  accessibilityLabel={`${owned && item.consumable ? he.buyAgain : he.buy} · ${item.cost}`}
                />
              )}
            </View>
          </View>
        );
      })}
    </View>
  );

  const consumables = SHOP_ITEMS.filter((it) => it.section === "enhance" && it.consumable);
  const invItems = consumables.filter((it) => (progress.active.inventory[it.id] || 0) > 0);

  return (
    <Screen>
      {node}
      <TopBar
        onBack={() => router.back()}
        backLabel={he.backLabel}
        center={<Text style={[styles.title, { color: c.ink }]}>{he.navShop}</Text>}
        trailing={<CoinPill coins={progress.active.coins} />}
      />

      <View style={[styles.tabs, { backgroundColor: c.line }]}>
        {(["enhance", "avatar"] as ShopSection[]).map((s) => {
          const on = section === s;
          return (
            <Pressable
              key={s}
              onPress={() => setSection(s)}
              style={[styles.tab, on && { backgroundColor: c.surface }]}
            >
              <Text style={[styles.tabText, { color: on ? c.ink : c.soft }]}>
                {s === "enhance" ? he.tabEnhance : he.tabAvatar}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {section === "enhance" ? (
        <>
          <Text style={[styles.section, { color: c.ink }]}>{he.shopTools}</Text>
          {renderGrid(SHOP_ITEMS.filter((it) => it.section === "enhance" && it.category === "tools"))}
          <Text style={[styles.section, { color: c.ink }]}>{he.shopThemes}</Text>
          {renderGrid(SHOP_ITEMS.filter((it) => it.section === "enhance" && it.category === "cosmetics"))}
          {progress.active.theme ? (
            <Pressable
              style={styles.reset}
              onPress={async () => {
                await progress.activateTheme(null);
                show(he.themeReset);
              }}
            >
              <Text style={[styles.resetText, { color: c.primary }]}>{he.resetThemePlain}</Text>
            </Pressable>
          ) : null}
          <Text style={[styles.section, { color: c.ink }]}>{he.navGear}</Text>
          {invItems.length === 0 ? (
            <Text style={[styles.empty, { color: c.soft }]}>{he.emptyBag}</Text>
          ) : (
            invItems.map((it) => (
              <View key={it.id} style={[styles.invRow, { backgroundColor: c.surface, borderBottomColor: c.line }]}>
                <Text style={styles.invEmoji}>{it.emoji}</Text>
                <View style={{ flex: 1, alignItems: "flex-end" }}>
                  <Text style={[styles.name, { color: c.ink }]}>{it.name}</Text>
                  <Text style={[styles.desc, { color: c.soft }]}>{it.desc}</Text>
                </View>
                <Tag label={`×${progress.active.inventory[it.id]}`} bg={GOLD.tint} fg={GOLD.deep} />
              </View>
            ))
          )}
          <Text style={[styles.notice, { color: c.soft }]}>{he.shopNotice(CONFIG.coinsCorrect)}</Text>
        </>
      ) : (
        <>
          <View style={[styles.avatarStage, { backgroundColor: c.surface, borderBottomColor: c.line }]}>
            <AvatarPreview loadout={avatar} size={120} />
            <Text style={[styles.notice, { color: c.soft, marginBottom: 0 }]}>{he.avatarHint}</Text>
          </View>
          {(["base", "hat", "top", "bottom", "shoes", "extra"] as AvatarSlot[]).map((slot) => (
            <View key={slot} style={{ width: "100%" }}>
              <Text style={[styles.section, { color: c.ink }]}>{SLOT_LABEL[slot]}</Text>
              {renderGrid(
                SHOP_ITEMS.filter((it) => it.section === "avatar" && it.slot === slot),
              )}
            </View>
          ))}
        </>
      )}
    </Screen>
  );
}

function Tag({ label, bg, fg }: { label: string; bg: string; fg: string }) {
  return (
    <View style={[styles.tag, { backgroundColor: bg }]}>
      <Text style={[styles.tagText, { color: fg }]}>{label}</Text>
    </View>
  );
}

function SmallButton({
  label,
  onPress,
  color,
  lip,
  soft,
  coin,
  disabled,
  accessibilityLabel,
}: {
  label: string;
  onPress: () => void;
  color?: string;
  lip?: string;
  soft?: boolean;
  coin?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
}) {
  const c = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.small,
        {
          backgroundColor: soft ? c.ground : color,
          borderBottomColor: soft ? c.line : lip,
          borderBottomWidth: pressed ? 1 : 4,
          marginTop: pressed ? 3 : 0,
          opacity: disabled ? 0.45 : 1,
        },
      ]}
    >
      {coin ? <Coin size={20} /> : null}
      <Text style={[styles.smallText, { color: soft ? c.ink : "#fff" }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontFamily: font.black },
  tabs: { flexDirection: "row-reverse", width: "100%", borderRadius: 999, padding: 4, marginBottom: 4 },
  tab: { flex: 1, minHeight: 44, borderRadius: 999, alignItems: "center", justifyContent: "center" },
  tabText: { fontFamily: font.heavy, fontSize: 15, textAlign: "center" },
  section: { alignSelf: "stretch", fontFamily: font.heavy, fontSize: 18, textAlign: "right", marginTop: 18, marginBottom: 10 },
  grid: { width: "100%", flexDirection: "row-reverse", flexWrap: "wrap", justifyContent: "space-between" },
  card: {
    width: "48%",
    borderRadius: 22,
    borderWidth: 2,
    borderBottomWidth: 5,
    padding: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  emojiWrap: { width: 64, height: 64, borderRadius: 20, alignItems: "center", justifyContent: "center", marginBottom: 6 },
  emoji: { fontSize: 34 },
  slot: { fontFamily: font.medium, fontSize: 11 },
  name: { fontFamily: font.heavy, fontSize: 15, textAlign: "center" },
  desc: { fontFamily: font.regular, fontSize: 12, textAlign: "center", marginTop: 2, lineHeight: 16 },
  cardFoot: { marginTop: "auto", paddingTop: 10, alignItems: "center", gap: 6 },
  tag: { borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12 },
  tagText: { fontFamily: font.heavy, fontSize: 13 },
  small: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 5,
    minHeight: 40,
    paddingHorizontal: 16,
    borderRadius: 999,
    justifyContent: "center",
  },
  smallText: { fontFamily: font.heavy, fontSize: 15 },
  reset: { alignSelf: "center", padding: 10 },
  resetText: { fontFamily: font.bold, fontSize: 14 },
  empty: { fontFamily: font.medium, textAlign: "center" },
  invRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
    width: "100%",
    borderRadius: 18,
    borderBottomWidth: 4,
    padding: 12,
    marginBottom: 8,
  },
  invEmoji: { fontSize: 30 },
  notice: { textAlign: "center", marginVertical: 16, fontFamily: font.medium, fontSize: 13 },
  avatarStage: { width: "100%", borderRadius: 24, borderBottomWidth: 5, padding: 16, alignItems: "center", marginTop: 12 },
});
