import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Screen } from "../src/components/Screen";
import { AvatarFigure, ItemThumb } from "../src/components/AvatarArt";
import { useToast } from "../src/components/Toast";
import { useAuth } from "../src/context/AuthContext";
import { useProgress } from "../src/context/ProgressContext";
import { AVATAR_SLOTS, defaultAvatar, equippedId, withEquipped } from "../src/game/avatar";
import { SHOP_ITEMS, type ShopItem, type ShopSection } from "../src/game/shop";
import { CONFIG } from "../src/game/config";
import { he } from "../src/i18n/he";
import { GOLD, OK, font } from "../src/theme/colors";
import { Coin, Icon } from "../src/components/Art";
import { CoinPill, TopBar, useColors } from "../src/components/ui";
import type { AvatarSlot, Gender } from "../src/types/models";

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

function itemName(item: ShopItem, gender: Gender) {
  if (item.id === "avatar_base_kid") return gender === "boy" ? he.gnomeBoy : he.gnomeGirl;
  return item.name;
}

export default function ShopScreen() {
  const router = useRouter();
  const { isLocal } = useAuth();
  const progress = useProgress();
  const { show, node } = useToast();
  const c = useColors();
  const params = useLocalSearchParams<{ section?: string }>();
  const [section, setSection] = useState<ShopSection>(params.section === "avatar" ? "avatar" : "enhance");
  const avatar = progress.active.avatar ?? defaultAvatar();

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

  const renderGrid = (items: ShopItem[]) => (
    <View style={styles.grid}>
      {items.map((item) => {
        const owned = isOwned(progress.active.purchases, item);
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
              {owned && item.type === "theme" ? (
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
          <Text style={[styles.notice, { color: c.soft }]}>{he.shopNotice(CONFIG.coinsCorrect)}</Text>
        </>
      ) : (
        <DressingRoom onBuy={onBuy} />
      )}
    </Screen>
  );
}

/** Avatar tab: a stage with the dressed character, slot tabs, and try-on cards. */
function DressingRoom({ onBuy }: { onBuy: (item: ShopItem) => Promise<void> }) {
  const progress = useProgress();
  const c = useColors();
  const [slot, setSlot] = useState<AvatarSlot>("base");
  const [trying, setTrying] = useState<ShopItem | null>(null);
  const { purchases, coins } = progress.active;
  const gender = progress.active.gender ?? "girl";
  const avatar = progress.active.avatar ?? defaultAvatar();
  const shown = trying?.slot ? withEquipped(avatar, trying.slot, trying.id) : avatar;
  const items = SHOP_ITEMS.filter((it) => it.section === "avatar" && it.slot === slot);
  const tryingOwned = trying ? isOwned(purchases, trying) : true;
  const missing = trying ? Math.max(0, trying.cost - coins) : 0;

  const onCard = (item: ShopItem) => {
    if (!isOwned(purchases, item)) {
      setTrying(trying?.id === item.id ? null : item);
      return;
    }
    setTrying(null);
    const on = equippedId(avatar, item.slot!) === item.id;
    if (on && item.slot !== "base") progress.equipAvatar(item.slot!, null);
    else if (!on) progress.equipAvatar(item.slot!, item.id);
  };

  const buyTrying = async () => {
    if (!trying) return;
    await onBuy(trying);
    setTrying(null);
  };

  return (
    <>
      <View style={[styles.stage, { backgroundColor: c.primaryTint, borderBottomColor: c.line }]}>
        <View style={[styles.spot, { backgroundColor: c.surface }]} />
        <View>
          <AvatarFigure loadout={shown} gender={gender} height={250} />
        </View>
        {trying && !tryingOwned ? (
          <View style={[styles.tryBar, { backgroundColor: c.surface, borderBottomColor: c.line }]}>
            <Text style={[styles.tryText, { color: c.ink }]}>{he.tryingOn(itemName(trying, gender))}</Text>
            <View style={styles.tryRow}>
              <SmallButton
                label={String(trying.cost)}
                coin
                color={OK.base}
                lip={OK.lip}
                disabled={missing > 0}
                onPress={buyTrying}
                accessibilityLabel={`${he.buy} · ${trying.cost}`}
              />
              <SmallButton label={he.tryOnCancel} soft onPress={() => setTrying(null)} />
            </View>
            {missing > 0 ? <Text style={[styles.tryMissing, { color: c.soft }]}>{he.needMoreCoins(missing)}</Text> : null}
          </View>
        ) : (
          <Text style={[styles.stageHint, { color: c.soft }]}>{he.avatarHint}</Text>
        )}
      </View>

      <View style={styles.slotGrid}>
        {AVATAR_SLOTS.map((sl) => {
          const on = sl === slot;
          const sample = equippedId(avatar, sl) ?? SHOP_ITEMS.find((it) => it.slot === sl)!.id;
          return (
            <Pressable
              key={sl}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              onPress={() => setSlot(sl)}
              style={({ pressed }) => [
                styles.slotChip,
                {
                  backgroundColor: on ? c.primary : c.surface,
                  borderBottomColor: on ? c.primaryLip : c.line,
                  borderBottomWidth: pressed ? 1 : 4,
                  marginTop: pressed ? 3 : 0,
                },
              ]}
            >
              <View style={[styles.slotIcon, { backgroundColor: on ? "#fff" : c.ground }]}>
                <ItemThumb id={sample} slot={sl} gender={gender} size={30} />
              </View>
              <Text style={[styles.slotText, { color: on ? "#fff" : c.ink }]}>{SLOT_LABEL[sl]}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={[styles.section, { color: c.ink }]}>
        {slot === "base" ? he.avatarStepCharacter : he.avatarStepDress}
      </Text>
      <View style={styles.grid}>
        {items.map((item) => {
          const owned = isOwned(purchases, item);
          const on = equippedId(avatar, item.slot!) === item.id;
          const isTrying = trying?.id === item.id;
          const border = isTrying ? GOLD.base : on ? c.primary : "transparent";
          return (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityLabel={itemName(item, gender)}
              onPress={() => onCard(item)}
              style={({ pressed }) => [
                styles.wearCard,
                {
                  backgroundColor: c.surface,
                  borderColor: border,
                  borderBottomColor: isTrying ? GOLD.lip : on ? c.primaryLip : c.line,
                  borderBottomWidth: pressed ? 2 : 5,
                  marginTop: pressed ? 3 : 0,
                },
              ]}
            >
              <View style={[styles.wearThumb, { backgroundColor: on ? c.primaryTint : isTrying ? GOLD.tint : c.ground }]}>
                <ItemThumb id={item.id} slot={item.slot!} gender={gender} size={84} />
              </View>
              <Text style={[styles.wearName, { color: c.ink }]} numberOfLines={1}>
                {itemName(item, gender)}
              </Text>
              {on ? (
                <Tag label={he.wearing} bg={c.primaryTint} fg={c.primary} />
              ) : owned ? (
                <Tag label={he.ownedPlain} bg={OK.tint} fg={OK.deep} />
              ) : (
                <View style={styles.price}>
                  <Coin size={18} />
                  <Text style={[styles.priceText, { color: coins >= item.cost ? c.ink : c.soft }]}>{item.cost}</Text>
                </View>
              )}
              {on ? (
                <View style={[styles.wearCheck, { backgroundColor: c.primary }]}>
                  <Icon name="check" size={12} color="#fff" weight={3.4} />
                </View>
              ) : !owned ? (
                <View style={[styles.wearCheck, { backgroundColor: c.ground }]}>
                  <Icon name="lock" size={12} color={c.soft} />
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </>
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
  notice: { textAlign: "center", marginVertical: 16, fontFamily: font.medium, fontSize: 13 },
  stage: {
    width: "100%",
    borderRadius: 28,
    borderBottomWidth: 5,
    paddingTop: 18,
    paddingBottom: 14,
    paddingHorizontal: 14,
    alignItems: "center",
    marginTop: 12,
    overflow: "hidden",
  },
  spot: { position: "absolute", top: 26, width: 230, height: 230, borderRadius: 115 },
  stageHint: { textAlign: "center", marginTop: 10, fontFamily: font.medium, fontSize: 13 },
  tryBar: { width: "100%", borderRadius: 20, borderBottomWidth: 4, padding: 12, marginTop: 10, alignItems: "center" },
  tryText: { fontFamily: font.heavy, fontSize: 16, textAlign: "center", marginBottom: 8 },
  tryRow: { flexDirection: "row-reverse", justifyContent: "center", gap: 10 },
  tryMissing: { fontFamily: font.medium, fontSize: 12, textAlign: "center", marginTop: 8 },
  slotGrid: { width: "100%", flexDirection: "row-reverse", flexWrap: "wrap", justifyContent: "space-between", marginTop: 14 },
  slotChip: {
    width: "31.5%",
    flexDirection: "row-reverse",
    alignItems: "center",
    borderRadius: 18,
    padding: 6,
    paddingLeft: 8,
    marginBottom: 8,
    minHeight: 50,
  },
  slotIcon: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center", marginLeft: 6 },
  slotText: { flex: 1, fontFamily: font.heavy, fontSize: 14, textAlign: "right" },
  wearCard: {
    width: "31.5%",
    borderRadius: 20,
    borderWidth: 2,
    padding: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  wearThumb: { width: "100%", aspectRatio: 1, borderRadius: 14, alignItems: "center", justifyContent: "center", marginBottom: 6 },
  wearName: { fontFamily: font.heavy, fontSize: 13, textAlign: "center", marginBottom: 6 },
  wearCheck: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  price: { flexDirection: "row-reverse", alignItems: "center", gap: 4, paddingVertical: 4 },
  priceText: { fontFamily: font.heavy, fontSize: 15 },
});
