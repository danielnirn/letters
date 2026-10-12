import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { ForestScreen, ForestStage, NIGHT, WOOD, WOOD_LIP, WoodSign } from "../src/components/Forest";
import { AvatarFigure, ItemThumb } from "../src/components/AvatarArt";
import { useToast } from "../src/components/Toast";
import { useAuth } from "../src/context/AuthContext";
import { useProgress } from "../src/context/ProgressContext";
import { AVATAR_SLOTS, defaultAvatar, equippedId, withEquipped } from "../src/game/avatar";
import { SHOP_ITEMS, type ShopItem } from "../src/game/shop";
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
    show(`${he.purchased(item.name)}\n${extra}`);
  };

  return (
    <ForestScreen>
      {node}
      <TopBar
        onBack={() => router.back()}
        backLabel={he.backLabel}
        center={<WoodSign text={he.navShop} />}
        trailing={<CoinPill coins={progress.active.coins} />}
      />
      <DressingRoom onBuy={onBuy} />
    </ForestScreen>
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
  const items = SHOP_ITEMS.filter((it) => it.slot === slot);
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
      <ForestStage>
        <View style={styles.lift}>
          <AvatarFigure loadout={shown} gender={gender} height={250} />
        </View>
        {trying && !tryingOwned ? (
          <View style={styles.tryBar}>
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
          <View style={styles.stageHintPill}>
            <Text style={styles.stageHint}>{he.avatarHint}</Text>
          </View>
        )}
      </ForestStage>

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
                  backgroundColor: on ? WOOD : c.surface,
                  borderBottomColor: on ? WOOD_LIP : "#C7D3E3",
                  borderBottomWidth: pressed ? 1 : 5,
                  marginTop: pressed ? 3 : 0,
                },
              ]}
            >
              <View style={[styles.slotIcon, { backgroundColor: on ? "#FFF6E6" : c.ground }]}>
                <ItemThumb id={sample} slot={sl} gender={gender} size={30} />
              </View>
              <Text style={[styles.slotText, { color: on ? "#fff" : c.ink }]}>{SLOT_LABEL[sl]}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.sectionRow}>
        <View style={styles.sectionPill}>
          <Text style={styles.sectionText}>{slot === "base" ? he.avatarStepCharacter : he.avatarStepDress}</Text>
        </View>
      </View>
      <View style={styles.grid}>
        {items.map((item) => {
          const owned = isOwned(purchases, item);
          const on = equippedId(avatar, item.slot!) === item.id;
          const isTrying = trying?.id === item.id;
          const border = isTrying ? GOLD.base : on ? OK.base : "transparent";
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
                  borderBottomColor: isTrying ? GOLD.lip : on ? OK.lip : "#C7D3E3",
                  borderBottomWidth: pressed ? 2 : 6,
                  marginTop: pressed ? 3 : 0,
                },
              ]}
            >
              <View style={[styles.wearThumb, { backgroundColor: on ? OK.tint : isTrying ? GOLD.tint : "#E4F4FF" }]}>
                <View style={styles.thumbGrass} />
                <View style={styles.lift}>
                  <ItemThumb id={item.id} slot={item.slot!} gender={gender} size={84} />
                </View>
              </View>
              <Text style={[styles.wearName, { color: c.ink }]} numberOfLines={1}>
                {itemName(item, gender)}
              </Text>
              {on ? (
                <Tag label={he.wearing} bg={OK.base} fg="#fff" />
              ) : owned ? (
                <Tag label={he.ownedPlain} bg={OK.tint} fg={OK.deep} />
              ) : (
                <View style={[styles.price, coins < item.cost && { opacity: 0.6 }]}>
                  <Coin size={18} />
                  <Text style={styles.priceText}>{item.cost}</Text>
                </View>
              )}
              {on ? (
                <View style={[styles.wearCheck, { backgroundColor: OK.base }]}>
                  <Icon name="check" size={12} color="#fff" weight={3.4} />
                </View>
              ) : !owned ? (
                <View style={[styles.wearCheck, { backgroundColor: NIGHT }]}>
                  <Icon name="lock" size={12} color="#fff" weight={2.8} />
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
  sectionRow: { alignSelf: "stretch", alignItems: "flex-end", marginTop: 14, marginBottom: 10 },
  sectionPill: {
    backgroundColor: NIGHT,
    borderWidth: 2,
    borderColor: "#fff",
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 14,
  },
  sectionText: { fontFamily: font.heavy, fontSize: 16, color: "#fff", textAlign: "right" },
  grid: { width: "100%", flexDirection: "row-reverse", flexWrap: "wrap", justifyContent: "space-between" },
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
  lift: { position: "relative", zIndex: 1 },
  stageHintPill: {
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginTop: 10,
  },
  stageHint: { textAlign: "center", fontFamily: font.bold, fontSize: 13, color: "#3F4C66" },
  tryBar: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 20,
    borderBottomWidth: 5,
    borderBottomColor: GOLD.lip,
    borderWidth: 3,
    borderColor: GOLD.tint,
    padding: 12,
    marginTop: 10,
    alignItems: "center",
  },
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
  wearThumb: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
    overflow: "hidden",
  },
  thumbGrass: {
    position: "absolute",
    bottom: -34,
    left: -10,
    right: -10,
    height: 56,
    borderRadius: 60,
    backgroundColor: "#B9E7A0",
  },
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
  price: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 4,
    backgroundColor: GOLD.tint,
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  priceText: { fontFamily: font.heavy, fontSize: 15, color: GOLD.deep },
});
