import { useState, type ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Defs, Ellipse, LinearGradient, Path, Rect, Stop } from "react-native-svg";
import { KIT, font } from "../theme/colors";
import { Coin, Icon, Star, type IconName } from "./Art";
import { Chest } from "./HomeArt";

/**
 * Game kit: the home-screen pieces (counters, chest bar, side badges, hero button, dock, island, sea).
 * RTL: things that "start" sit on the right. Preview all of them on the /atlas screen.
 */

/** Chunky white text with a dark drop outline. */
export function OutlinedText({
  children,
  size = 18,
  color = "#fff",
  outline = KIT.outline,
  style,
}: {
  children: ReactNode;
  size?: number;
  color?: string;
  outline?: string;
  style?: StyleProp<TextStyle>;
}) {
  return (
    <Text
      style={[
        {
          fontFamily: font.black,
          fontSize: size,
          color,
          textAlign: "center",
          textShadowColor: outline,
          textShadowOffset: { width: 0, height: Math.max(1.5, size / 12) },
          textShadowRadius: 0,
        },
        style,
      ]}
      numberOfLines={1}
    >
      {children}
    </Text>
  );
}

/** Carved wood frame with a thick bottom lip. */
export function WoodFrame({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.wood, style]}>
      <View style={styles.woodInner}>{children}</View>
    </View>
  );
}

/** Cream counter pill with a big coin or star overlapping its right edge. */
export function ResourceCounter({
  kind,
  value,
  onPress,
}: {
  kind: "coin" | "star";
  value: number;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? "button" : undefined}
      style={({ pressed }) => [styles.counter, pressed && { transform: [{ scale: 0.96 }] }]}
    >
      <View style={styles.counterPill}>
        <Text style={styles.counterText} numberOfLines={1}>
          {value}
        </Text>
      </View>
      <View style={styles.counterIcon}>{kind === "coin" ? <Coin size={44} /> : <Star size={44} />}</View>
    </Pressable>
  );
}

/** Wood-framed progress bar: star at the start (right), chest at the end (left), prize tag underneath. */
export function ChestProgress({
  value,
  total,
  prize,
  milestoneAt,
  milestoneDone,
  label,
}: {
  value: number;
  total: number;
  prize: number;
  /** Position (in elements) of the halfway coin. */
  milestoneAt?: number;
  milestoneDone?: boolean;
  label?: string;
}) {
  const pct = total > 0 ? Math.max(0, Math.min(100, (value / total) * 100)) : 0;
  return (
    <View style={styles.chestWrap} accessibilityLabel={label ?? `${value}/${total}`}>
      <WoodFrame style={styles.chestFrame}>
        <View style={styles.chestTrack}>
          <View style={[styles.chestFill, { width: `${pct}%` }]}>
            <View style={styles.chestGloss} />
          </View>
          <View style={StyleSheet.absoluteFill}>
            <View style={styles.chestCount}>
              <OutlinedText size={17}>{label ?? `${value}/${total}`}</OutlinedText>
            </View>
          </View>
        </View>
      </WoodFrame>
      {milestoneAt != null && total > 0 ? (
        <View pointerEvents="none" style={styles.milestoneLane}>
          <View style={[styles.milestone, { right: `${(milestoneAt / total) * 100}%` }, milestoneDone && { opacity: 0.4 }]}>
            <Coin size={24} />
          </View>
        </View>
      ) : null}
      <View style={styles.chestStart}>
        <Star size={48} />
      </View>
      <View style={styles.chestEnd}>
        <Chest size={62} />
      </View>
      <View style={styles.prizeTag}>
        <Coin size={20} />
        <Text style={styles.prizeText}>+{prize}</Text>
      </View>
    </View>
  );
}

export type BadgeTone = "purple" | "green" | "red" | "orange";

const TONE: Record<BadgeTone, { base: string; lip: string }> = {
  purple: { base: KIT.purple, lip: KIT.purpleLip },
  green: { base: KIT.green, lip: KIT.greenLip },
  red: { base: KIT.red, lip: KIT.redLip },
  orange: { base: KIT.orange, lip: KIT.orangeLip },
};

/** Round side badge: art in a colored disc, a label ribbon, and an optional count or "!" dot. */
export function BadgeButton({
  children,
  label,
  tone = "purple",
  ribbon,
  notify,
  glow,
  onPress,
  accessibilityLabel,
}: {
  children: ReactNode;
  label: string;
  tone?: BadgeTone;
  /** Ribbon color, when it differs from the disc. */
  ribbon?: BadgeTone;
  notify?: number | "!";
  glow?: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
}) {
  const disc = TONE[tone];
  const band = TONE[ribbon ?? tone];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={onPress}
      style={({ pressed }) => [styles.badge, pressed && { transform: [{ scale: 0.94 }] }]}
    >
      {glow ? <View style={styles.badgeGlow} /> : null}
      <View style={[styles.badgeDisc, { backgroundColor: disc.base, borderColor: KIT.woodEdge, borderBottomColor: disc.lip }]}>
        <View style={styles.badgeShine} />
        {children}
      </View>
      <View style={[styles.badgeRibbon, { backgroundColor: band.base, borderBottomColor: band.lip }]}>
        <OutlinedText size={14}>{label}</OutlinedText>
      </View>
      {notify != null ? (
        <View style={[styles.notify, { backgroundColor: notify === "!" ? KIT.red : KIT.notify }]}>
          <Text style={styles.notifyText}>{notify}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

/** The big glossy call to action. */
export function HeroButton({
  label,
  onPress,
  style,
}: {
  label: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.hero,
        { borderBottomWidth: pressed ? 3 : 9, marginTop: pressed ? 6 : 0 },
        style,
      ]}
    >
      <View style={styles.heroGloss} />
      <OutlinedText size={40} outline={KIT.greenLip}>
        {label}
      </OutlinedText>
    </Pressable>
  );
}

export type DockItem = { id: string; label: string; art: ReactNode };

/** Wooden tab bar. The active slot lifts up and shows its label. RTL: the first item sits on the right. */
export function WoodDock({
  items,
  active,
  onPress,
  bottomInset = 0,
}: {
  items: DockItem[];
  active: string;
  onPress: (id: string) => void;
  bottomInset?: number;
}) {
  return (
    <View style={[styles.dockWrap, { paddingBottom: bottomInset }]}>
      <View style={styles.dock}>
        {items.map((item) => {
          const on = item.id === active;
          return (
            <Pressable
              key={item.id}
              accessibilityRole="tab"
              accessibilityLabel={item.label}
              accessibilityState={{ selected: on }}
              onPress={() => onPress(item.id)}
              style={[styles.dockSlot, on && styles.dockSlotOn]}
            >
              <View style={on ? styles.dockArtOn : undefined}>{item.art}</View>
              {on ? <OutlinedText size={16}>{item.label}</OutlinedText> : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/** Floating grass island; `children` stand on its top. */
export function Island({ width, children }: { width: number; children?: ReactNode }) {
  const h = width * 0.62;
  return (
    <View style={{ width, height: h + width * 0.1, alignItems: "center", justifyContent: "flex-end" }}>
      <Svg width={width} height={h} viewBox="0 0 200 124" style={StyleSheet.absoluteFill}>
        <Ellipse cx={100} cy={112} rx={84} ry={10} fill={KIT.seaDeep} opacity={0.45} />
        <Path d="M18 58 Q20 96 60 108 Q100 122 140 108 Q180 96 182 58 Z" fill="#8A5A2B" />
        <Path d="M30 70 Q50 98 100 104 Q150 98 170 70" fill="none" stroke="#6E4520" strokeWidth={4} strokeLinecap="round" />
        <Ellipse cx={100} cy={56} rx={86} ry={34} fill="#5FB83B" />
        <Ellipse cx={100} cy={52} rx={80} ry={29} fill="#7FD154" />
        <Ellipse cx={74} cy={44} rx={30} ry={9} fill="#9BE070" opacity={0.7} />
        <Path d="M40 64 Q70 80 110 74" fill="none" stroke="#C98A4B" strokeWidth={5} strokeLinecap="round" />
        <Circle cx={36} cy={50} r={4} fill="#FF8FB5" />
        <Circle cx={160} cy={58} r={4} fill="#FFE07A" />
        <Circle cx={150} cy={44} r={3} fill="#FF8FB5" />
        <Rect x={160} y={42} width={10} height={8} rx={3} fill="#9AA7B8" />
      </Svg>
      <View style={{ marginBottom: h * 0.42, alignItems: "center" }}>{children}</View>
    </View>
  );
}

/** Calm blue sea with soft wave marks, behind the home screen. */
export function SeaBackdrop({ width, height }: { width: number; height: number }) {
  const rows = Math.ceil(height / 70);
  const waves: ReactNode[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < 4; c++) {
      const x = ((c * 0.27 + (r % 2) * 0.13) % 1) * width;
      const y = r * 70 + 30;
      waves.push(
        <Path
          key={`${r}-${c}`}
          d={`M${x} ${y} q8 -6 16 0 q8 6 16 0`}
          fill="none"
          stroke={KIT.seaFoam}
          strokeWidth={2.5}
          strokeLinecap="round"
          opacity={0.45}
        />,
      );
    }
  }
  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id="sea" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={KIT.sea} />
          <Stop offset="1" stopColor={KIT.seaDeep} />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={width} height={height} fill="url(#sea)" />
      {waves}
    </Svg>
  );
}

/** Full screen on the sea backdrop: safe area, scrolling column, optional overlay on top. */
export function SeaScreen({ children, overlay }: { children: ReactNode; overlay?: ReactNode }) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  return (
    <View style={kit.fill} onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      {size.w > 0 ? (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <SeaBackdrop width={size.w} height={size.h} />
        </View>
      ) : null}
      <SafeAreaView style={kit.fill}>
        <ScrollView contentContainerStyle={kit.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={kit.column}>{children}</View>
        </ScrollView>
      </SafeAreaView>
      {overlay}
    </View>
  );
}

/** Wood plank title. */
export function KitTitle({ text, big }: { text: string; big?: boolean }) {
  return (
    <View style={[kit.plank, big && kit.plankBig]}>
      <View style={kit.plankGrain} />
      <OutlinedText size={big ? 30 : 22}>{text}</OutlinedText>
    </View>
  );
}

/** Round wooden back button (sits on the right in RTL). */
export function KitBack({ onPress, label, icon = "back" }: { onPress: () => void; label: string; icon?: IconName }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [kit.back, { borderBottomWidth: pressed ? 2 : 6, marginTop: pressed ? 4 : 0 }]}
    >
      <Icon name={icon} size={26} color="#fff" weight={3.4} />
    </Pressable>
  );
}

/** Back on the right · title in the middle · trailing slot (a counter) on the left. */
export function KitTopBar({ onBack, backLabel, center, trailing }: { onBack: () => void; backLabel: string; center?: ReactNode; trailing?: ReactNode }) {
  return (
    <View style={kit.topBar}>
      <KitBack onPress={onBack} label={backLabel} />
      <View style={kit.topCenter}>{center}</View>
      <View style={kit.topTrail}>{trailing}</View>
    </View>
  );
}

/** Cream panel with a wood rim and lip. Pressable when `onPress` is set. */
export function KitCard({
  children,
  onPress,
  style,
  accessibilityLabel,
}: {
  children: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}) {
  if (!onPress) return <View style={[kit.card, style]}>{children}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [kit.card, { borderBottomWidth: pressed ? 3 : 7, marginTop: pressed ? 4 : 0 }, style]}
    >
      {children}
    </Pressable>
  );
}

/** Small pill: an icon and a short value, like "−10" coins or "+2" stars. */
export function KitChip({ icon, text, dark }: { icon?: ReactNode; text: string; dark?: boolean }) {
  return (
    <View style={[kit.chip, dark && kit.chipDark]}>
      {icon}
      <Text style={[kit.chipText, dark && { color: "#fff" }]}>{text}</Text>
    </View>
  );
}

/** Thin dark progress track with a green fill from the right and "n/m" on top. */
export function KitMeter({ value, total, color = KIT.green }: { value: number; total: number; color?: string }) {
  const pct = total > 0 ? Math.max(0, Math.min(100, (value / total) * 100)) : 0;
  return (
    <View style={kit.meter}>
      <View style={[kit.meterFill, { width: `${pct}%`, backgroundColor: color }]} />
      <View style={StyleSheet.absoluteFill}>
        <View style={kit.meterLabel}>
          <OutlinedText size={12}>{`${value}/${total}`}</OutlinedText>
        </View>
      </View>
    </View>
  );
}

/** Three stars in an arc, the middle one bigger. `value` of them are lit. */
export function StarRating({ value, size = 56 }: { value: number; size?: number }) {
  return (
    <View style={kit.rating}>
      {[1, 2, 3].map((n) => {
        const big = n === 2;
        const s = big ? size * 1.3 : size;
        return (
          <View key={n} style={big ? { marginBottom: size * 0.35 } : undefined}>
            {n <= value ? <Star size={s} /> : <Star size={s} fill="#2B4E86" stroke="#1C3766" />}
          </View>
        );
      })}
    </View>
  );
}

const BUTTON_TONE = {
  green: { base: KIT.green, lip: KIT.greenLip, gloss: KIT.greenGloss, fg: "#fff", outline: KIT.greenLip },
  orange: { base: KIT.orange, lip: KIT.orangeLip, gloss: "#FFC375", fg: "#fff", outline: KIT.orangeLip },
  cream: { base: KIT.cream, lip: KIT.creamLip, gloss: "#FFF6E3", fg: KIT.creamInk, outline: "transparent" },
} as const;

/** Medium toy button in the kit palette. */
export function KitButton({
  label,
  onPress,
  tone = "green",
  icon,
  trailing,
  style,
}: {
  label: string;
  onPress: () => void;
  tone?: keyof typeof BUTTON_TONE;
  icon?: IconName;
  /** Extra content after the label (a price chip). */
  trailing?: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const t = BUTTON_TONE[tone];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        kit.button,
        { backgroundColor: t.base, borderColor: t.lip, borderBottomColor: t.lip, borderBottomWidth: pressed ? 3 : 7, marginTop: pressed ? 4 : 0 },
        style,
      ]}
    >
      <View style={[kit.buttonGloss, { backgroundColor: t.gloss }]} />
      <View style={kit.buttonRow}>
        {icon ? <Icon name={icon} size={22} color={t.fg} weight={3} /> : null}
        <OutlinedText size={22} color={t.fg} outline={t.outline}>
          {label}
        </OutlinedText>
        {trailing}
      </View>
    </Pressable>
  );
}

const kit = StyleSheet.create({
  fill: { flex: 1, backgroundColor: KIT.sea },
  scroll: { flexGrow: 1, paddingTop: 8, paddingBottom: 28 },
  column: { width: "100%", maxWidth: 520, alignSelf: "center", paddingHorizontal: 16, alignItems: "center" },
  plank: {
    backgroundColor: KIT.wood,
    borderWidth: 3,
    borderColor: KIT.woodEdge,
    borderBottomWidth: 7,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 22,
    maxWidth: "100%",
    overflow: "hidden",
  },
  plankBig: { paddingVertical: 8, paddingHorizontal: 30 },
  plankGrain: { position: "absolute", left: 10, right: 10, top: "52%", height: 2, borderRadius: 1, backgroundColor: KIT.woodDark, opacity: 0.45 },
  back: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: KIT.orange,
    borderWidth: 3,
    borderColor: KIT.woodEdge,
    borderBottomColor: KIT.woodEdge,
    alignItems: "center",
    justifyContent: "center",
  },
  topBar: { width: "100%", flexDirection: "row-reverse", alignItems: "center", gap: 8, paddingVertical: 6 },
  topCenter: { flex: 1, alignItems: "center" },
  topTrail: { minWidth: 52, alignItems: "flex-start" },
  card: {
    backgroundColor: KIT.cream,
    borderWidth: 3,
    borderColor: KIT.woodEdge,
    borderBottomColor: KIT.woodEdge,
    borderBottomWidth: 7,
    borderRadius: 24,
    padding: 10,
  },
  chip: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: KIT.creamLip,
    borderRadius: 999,
    paddingVertical: 2,
    paddingLeft: 10,
    paddingRight: 4,
  },
  chipDark: { backgroundColor: KIT.track, borderColor: KIT.woodEdge },
  chipText: { fontFamily: font.black, fontSize: 14, color: KIT.creamInk },
  meter: {
    alignSelf: "stretch",
    height: 20,
    borderRadius: 999,
    backgroundColor: KIT.track,
    borderWidth: 2,
    borderColor: KIT.woodEdge,
    overflow: "hidden",
    flexDirection: "row-reverse",
  },
  meterFill: { height: "100%", borderRadius: 999 },
  meterLabel: { flex: 1, alignItems: "center", justifyContent: "center" },
  rating: { flexDirection: "row-reverse", alignItems: "flex-end", justifyContent: "center", gap: 4 },
  button: { minHeight: 60, borderRadius: 20, borderWidth: 3, alignItems: "center", justifyContent: "center", paddingHorizontal: 18, overflow: "hidden" },
  buttonGloss: { position: "absolute", top: 5, left: 12, right: 12, height: 14, borderRadius: 7, opacity: 0.55 },
  buttonRow: { flexDirection: "row-reverse", alignItems: "center", gap: 8 },
});

const styles = StyleSheet.create({
  wood: {
    backgroundColor: KIT.wood,
    borderWidth: 3,
    borderColor: KIT.woodEdge,
    borderBottomWidth: 7,
    borderRadius: 20,
    padding: 5,
  },
  woodInner: { borderRadius: 14, overflow: "hidden" },

  counter: { height: 50, justifyContent: "center", paddingRight: 26 },
  counterPill: {
    minWidth: 104,
    height: 36,
    borderRadius: 999,
    backgroundColor: KIT.cream,
    borderWidth: 2,
    borderColor: KIT.creamLip,
    borderBottomWidth: 4,
    justifyContent: "center",
    paddingLeft: 14,
    paddingRight: 26,
  },
  counterText: { fontFamily: font.black, fontSize: 20, color: KIT.creamInk, textAlign: "center" },
  counterIcon: { position: "absolute", right: 0, top: 3 },

  chestWrap: { width: "100%", paddingHorizontal: 26, paddingBottom: 14, marginTop: 6 },
  chestFrame: { width: "100%" },
  chestTrack: { height: 30, backgroundColor: KIT.track, flexDirection: "row-reverse" },
  chestFill: { height: "100%", backgroundColor: KIT.green, borderRadius: 10, overflow: "hidden" },
  chestGloss: { height: "40%", marginTop: 3, marginHorizontal: 6, borderRadius: 6, backgroundColor: KIT.greenGloss, opacity: 0.7 },
  chestCount: { flex: 1, alignItems: "center", justifyContent: "center" },
  milestoneLane: { position: "absolute", top: -14, left: 34, right: 34, height: 24 },
  milestone: { position: "absolute", top: 0, marginRight: -12 },
  chestStart: { position: "absolute", right: 2, top: -4 },
  chestEnd: { position: "absolute", left: -4, top: -14 },
  prizeTag: {
    position: "absolute",
    bottom: -4,
    alignSelf: "center",
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 4,
    backgroundColor: KIT.cream,
    borderWidth: 2,
    borderColor: KIT.woodEdge,
    borderRadius: 999,
    paddingVertical: 1,
    paddingLeft: 10,
    paddingRight: 4,
  },
  prizeText: { fontFamily: font.black, fontSize: 15, color: KIT.creamInk },

  badge: { width: 92, alignItems: "center" },
  badgeGlow: {
    position: "absolute",
    top: -8,
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: "rgba(255, 228, 90, 0.6)",
  },
  badgeDisc: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 3,
    borderBottomWidth: 6,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  badgeShine: {
    position: "absolute",
    top: 4,
    width: 50,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#fff",
    opacity: 0.22,
  },
  badgeRibbon: {
    marginTop: -14,
    minWidth: 86,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: KIT.woodEdge,
    borderBottomWidth: 4,
    paddingVertical: 2,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  notify: {
    position: "absolute",
    top: -2,
    right: 0,
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2.5,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  notifyText: { fontFamily: font.black, fontSize: 15, color: "#fff" },

  hero: {
    height: 84,
    borderRadius: 26,
    backgroundColor: KIT.green,
    borderWidth: 3,
    borderColor: KIT.greenLip,
    borderBottomColor: KIT.greenLip,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  heroGloss: {
    position: "absolute",
    top: 6,
    left: 14,
    right: 14,
    height: 22,
    borderRadius: 11,
    backgroundColor: KIT.greenGloss,
    opacity: 0.55,
  },

  dockWrap: { backgroundColor: KIT.wood, borderTopWidth: 4, borderTopColor: KIT.woodLight, zIndex: 20 },
  dock: { flexDirection: "row-reverse", width: "100%", maxWidth: 520, alignSelf: "center", height: 72 },
  dockSlot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderLeftColor: KIT.woodDark,
    borderRightColor: KIT.woodLight,
  },
  dockSlotOn: {
    flex: 1.5,
    backgroundColor: KIT.woodDark,
    borderLeftColor: KIT.woodLight,
    borderRightColor: KIT.woodLight,
    justifyContent: "flex-end",
    paddingBottom: 6,
  },
  dockArtOn: { marginTop: -40, marginBottom: 2, transform: [{ scale: 1.2 }] },
});
