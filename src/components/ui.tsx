import { type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { useProgress } from "../context/ProgressContext";
import { colorsFor, font } from "../theme/colors";
import type { Gender } from "../types/models";
import { Coin, Icon, Mascot, Star, type IconName } from "./Art";

export function useColors() {
  return colorsFor();
}

/** White rounded surface with a soft lip. */
export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const c = useColors();
  return (
    <View style={[styles.card, { backgroundColor: c.surface, borderBottomColor: c.line }, style]}>{children}</View>
  );
}

export function CoinPill({ coins, onPress }: { coins: number; onPress?: () => void }) {
  const c = useColors();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={[styles.pill, { backgroundColor: c.surface, borderBottomColor: c.line }]}
    >
      <Coin size={24} />
      <Text style={[styles.pillText, { color: c.ink }]}>{coins}</Text>
    </Pressable>
  );
}

/** Village stars, same chip as CoinPill. */
export function StarPill({ stars, onPress }: { stars: number; onPress?: () => void }) {
  const c = useColors();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={[styles.pill, { backgroundColor: c.surface, borderBottomColor: c.line }]}
    >
      <Star size={22} />
      <Text style={[styles.pillText, { color: c.ink }]}>{stars}</Text>
    </Pressable>
  );
}

export function RoundButton({
  icon,
  onPress,
  label,
}: {
  icon: IconName;
  onPress: () => void;
  label: string;
}) {
  const c = useColors();
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.round,
        {
          backgroundColor: c.surface,
          borderBottomColor: c.line,
          borderBottomWidth: pressed ? 1 : 4,
          marginTop: pressed ? 3 : 0,
        },
      ]}
    >
      <Icon name={icon} size={22} color={c.ink} />
    </Pressable>
  );
}

/** Back button (right side in RTL) · center · trailing slot. */
export function TopBar({
  onBack,
  backLabel,
  backIcon = "back",
  center,
  trailing,
}: {
  onBack: () => void;
  backLabel: string;
  backIcon?: IconName;
  center?: ReactNode;
  trailing?: ReactNode;
}) {
  return (
    <View style={styles.topBar}>
      <RoundButton icon={backIcon} onPress={onBack} label={backLabel} />
      <View style={styles.topCenter}>{center}</View>
      <View style={styles.topTrailing}>{trailing}</View>
    </View>
  );
}

export function ProgressBar({
  pct,
  color,
  height = 8,
  track,
}: {
  pct: number;
  color: string;
  height?: number;
  track?: string;
}) {
  const c = useColors();
  return (
    <View
      style={{
        height,
        borderRadius: height,
        backgroundColor: track ?? c.ground,
        overflow: "hidden",
        flexDirection: "row-reverse",
      }}
    >
      <View
        style={{
          width: `${Math.max(0, Math.min(100, pct))}%`,
          height,
          borderRadius: height,
          backgroundColor: color,
        }}
      />
    </View>
  );
}

export function ScreenTitle({ children }: { children: ReactNode }) {
  const c = useColors();
  return <Text style={[styles.title, { color: c.ink }]}>{children}</Text>;
}

/** The mascot that matches the player's chosen gender (girl until chosen). */
export function Buddy({ size, body }: { size?: number; body?: string }) {
  const { active } = useProgress();
  return <Mascot size={size} body={body} kind={active.gender ?? "girl"} />;
}

/** Two big cards: girl / boy. */
export function GenderPicker({
  value,
  onChange,
  labels,
}: {
  value: Gender | null;
  onChange: (g: Gender) => void;
  labels: Record<Gender, string>;
}) {
  const c = useColors();
  return (
    <View style={styles.genderRow}>
      {(["girl", "boy"] as Gender[]).map((g) => {
        const on = value === g;
        return (
          <Pressable
            key={g}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            accessibilityLabel={labels[g]}
            onPress={() => onChange(g)}
            style={({ pressed }) => [
              styles.genderCard,
              {
                backgroundColor: on ? c.primaryTint : c.surface,
                borderColor: on ? c.primary : "transparent",
                borderBottomColor: on ? c.primaryLip : c.line,
                borderBottomWidth: pressed ? 2 : 5,
                marginTop: pressed ? 3 : 0,
              },
            ]}
          >
            <Mascot size={78} kind={g} body={on ? c.primary : "#9AA8C2"} />
            <Text style={[styles.genderText, { color: on ? c.primary : c.ink }]}>{labels[g]}</Text>
            {on ? (
              <View style={[styles.genderCheck, { backgroundColor: c.primary }]}>
                <Icon name="check" size={14} color="#fff" weight={3.4} />
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  genderRow: { width: "100%", flexDirection: "row-reverse", justifyContent: "space-between" },
  genderCard: {
    width: "48%",
    borderRadius: 24,
    borderWidth: 2,
    paddingTop: 12,
    paddingBottom: 10,
    alignItems: "center",
  },
  genderText: { fontFamily: font.black, fontSize: 20, marginTop: 4 },
  genderCheck: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    width: "100%",
    borderRadius: 24,
    borderBottomWidth: 5,
    padding: 16,
  },
  pill: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    borderBottomWidth: 3,
    paddingVertical: 8,
    paddingLeft: 14,
    paddingRight: 10,
    minHeight: 44,
  },
  pillText: { fontFamily: font.heavy, fontSize: 18 },
  round: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },
  topBar: {
    width: "100%",
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
    gap: 10,
  },
  topCenter: { flex: 1, alignItems: "center" },
  topTrailing: { minWidth: 46, alignItems: "flex-start" },
  title: { fontSize: 28, fontFamily: font.black, textAlign: "center", marginBottom: 12 },
});
