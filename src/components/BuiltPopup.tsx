import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Category } from "../game/config";
import { unlocksAt, type Unlock } from "../game/village";
import { he } from "../i18n/he";
import { CATEGORY_COLORS, GOLD, OK, font } from "../theme/colors";
import { CategoryTile, Coin, Icon, Star } from "./Art";
import { Buddy } from "./ui";
import { NIGHT, WOOD_LIP, WoodSign } from "./Forest";
import { FadeIn } from "./MathErrorCard";
import { PrimaryButton } from "./PrimaryButton";
import { Building, buildingName } from "./VillageArt";

/** "Built!" celebration popup (stage complete + home build). */
export function BuiltPopup({
  category,
  level,
  gift,
  villageLevel,
  onClose,
}: {
  category: Category;
  level: number;
  gift: number;
  /** Village level after this build; shows a "level up" step when it opens something. */
  villageLevel: number;
  onClose: () => void;
}) {
  const unlocks = unlocksAt(villageLevel);
  const [step, setStep] = useState<"built" | "unlocks">("built");
  const next = () => (step === "built" && unlocks.length > 0 ? setStep("unlocks") : onClose());
  if (step === "unlocks") {
    return (
      <View style={styles.popBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel={he.closeReport} />
        <FadeIn resetKey={`unlock-${villageLevel}`}>
          <View style={styles.popCard}>
            <View style={styles.popSign}>
              <WoodSign text={he.levelUpTitle(villageLevel)} big />
            </View>
            <View style={styles.popStars}>
              <Star size={26} />
              <View style={{ marginBottom: 18 }}>
                <Star size={34} />
              </View>
              <Star size={26} />
            </View>
            <Text style={styles.popBody}>{he.levelUpBody}</Text>
            <View style={styles.unlockList}>
              {unlocks.map((u) => (
                <UnlockRow key={u.kind === "lesson" ? u.category : u.feature} unlock={u} />
              ))}
            </View>
            <PrimaryButton label={he.builtOk} color={OK.base} onPress={onClose} style={{ alignSelf: "stretch" }} />
          </View>
        </FadeIn>
      </View>
    );
  }
  return (
    <View style={styles.popBackdrop}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel={he.closeReport} />
      <FadeIn resetKey={`${category}-${level}`}>
        <View style={styles.popCard}>
          <View style={styles.popSign}>
            <WoodSign text={he.builtTitle} big />
          </View>
          <View style={styles.popStars}>
            <Star size={26} />
            <View style={{ marginBottom: 18 }}>
              <Star size={34} />
            </View>
            <Star size={26} />
          </View>
          <View style={styles.popGlow}>
            <Building category={category} level={level} size={150} lit />
          </View>
          <Text style={styles.popName} numberOfLines={1}>
            {buildingName(category)}
          </Text>
          <View style={styles.popLevel}>
            <Text style={styles.popLevelText}>{he.builtLevel(level)}</Text>
          </View>
          <View style={styles.popPerks}>
            <View style={[styles.popPerk, { backgroundColor: OK.tint, borderBottomColor: OK.base + "66" }]}>
              <Icon name="check" size={18} color={OK.deep} weight={3.2} />
              <Text style={[styles.popPerkText, { color: OK.deep }]}>{he.builtVillageUp}</Text>
            </View>
            {gift > 0 ? (
              <View style={[styles.popPerk, { backgroundColor: GOLD.tint, borderBottomColor: GOLD.base + "66" }]}>
                <Coin size={20} />
                <Text style={[styles.popPerkText, { color: GOLD.deep }]}>{he.builtPerStage(gift)}</Text>
              </View>
            ) : null}
          </View>
          <PrimaryButton
            label={unlocks.length > 0 ? he.keepGoing : he.builtOk}
            color={OK.base}
            icon={unlocks.length > 0 ? "next" : undefined}
            onPress={next}
            style={{ alignSelf: "stretch" }}
          />
        </View>
      </FadeIn>
    </View>
  );
}

function UnlockRow({ unlock }: { unlock: Unlock }) {
  let art;
  let label: string;
  let tint: string;
  if (unlock.kind === "lesson") {
    art = <CategoryTile category={unlock.category} size={50} />;
    label = he.levelUpLesson(lessonName(unlock.category));
    tint = CATEGORY_COLORS[unlock.category].tint;
  } else if (unlock.feature === "avatar") {
    art = <Buddy size={44} />;
    label = he.homeAvatar;
    tint = CATEGORY_COLORS.english.tint;
  } else {
    const shop = unlock.feature === "shop";
    const sw = shop ? CATEGORY_COLORS.reading : GOLD;
    art = (
      <View style={[styles.unlockBadge, { backgroundColor: sw.base, borderBottomColor: sw.lip }]}>
        <Icon name={shop ? "bag" : "trophy"} size={30} color="#fff" weight={2.6} />
      </View>
    );
    label = shop ? he.navShop : he.navLeaderboard;
    tint = sw.tint;
  }
  return (
    <View style={[styles.unlockRow, { backgroundColor: tint }]}>
      <View style={styles.unlockArt}>{art}</View>
      <Text style={styles.unlockText} numberOfLines={2}>
        {label}
      </Text>
      <View style={styles.unlockNew}>
        <Icon name="check" size={16} color="#fff" weight={3.4} />
      </View>
    </View>
  );
}

function lessonName(cat: Category) {
  if (cat === "math") return he.categoryMath;
  if (cat === "english") return he.categoryEnglish;
  if (cat === "logic") return he.categoryLogic;
  if (cat === "science") return he.categoryScience;
  if (cat === "reading") return he.categoryReading;
  return he.categoryLanguage;
}

const styles = StyleSheet.create({
  popBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(31,42,68,0.6)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 22,
    zIndex: 50,
  },
  popCard: {
    width: 340,
    maxWidth: "100%",
    backgroundColor: "#fff",
    borderRadius: 30,
    borderBottomWidth: 8,
    borderBottomColor: WOOD_LIP,
    borderWidth: 4,
    borderColor: "#F1D9B3",
    paddingTop: 34,
    paddingHorizontal: 18,
    paddingBottom: 18,
    alignItems: "center",
  },
  popSign: { position: "absolute", top: -30, alignSelf: "center" },
  popStars: { flexDirection: "row-reverse", alignItems: "flex-end", gap: 10, marginTop: 8 },
  popGlow: {
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: GOLD.tint,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -6,
  },
  popName: { fontFamily: font.black, fontSize: 24, color: "#1F2A44", textAlign: "center", marginTop: 10 },
  popLevel: {
    backgroundColor: NIGHT,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "#fff",
    paddingVertical: 4,
    paddingHorizontal: 14,
    marginTop: 6,
  },
  popLevelText: { fontFamily: font.heavy, fontSize: 15, color: "#fff", textAlign: "center" },
  popPerks: { flexDirection: "row-reverse", flexWrap: "wrap", justifyContent: "center", gap: 8, marginVertical: 16 },
  popPerk: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    borderBottomWidth: 3,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  popPerkText: { fontFamily: font.heavy, fontSize: 15 },
  popBody: { fontFamily: font.heavy, fontSize: 18, color: "#1F2A44", textAlign: "center", marginTop: 10 },
  unlockList: { alignSelf: "stretch", gap: 10, marginVertical: 16 },
  unlockRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
    borderRadius: 20,
    padding: 10,
  },
  unlockArt: { width: 56, height: 56, alignItems: "center", justifyContent: "center" },
  unlockBadge: { width: 50, height: 50, borderRadius: 16, borderBottomWidth: 4, alignItems: "center", justifyContent: "center" },
  unlockText: { flex: 1, fontFamily: font.black, fontSize: 18, color: "#1F2A44", textAlign: "right" },
  unlockNew: { width: 28, height: 28, borderRadius: 14, backgroundColor: OK.base, alignItems: "center", justifyContent: "center" },
});
