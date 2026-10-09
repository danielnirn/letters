import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { GOLD, OK, colorsFor, font } from "../theme/colors";
import { Coin, Icon, type IconName } from "./Art";

/** Darken a #rrggbb color by `amount` (0–1). */
export function shade(hex: string, amount = 0.22) {
  const n = parseInt(hex.replace("#", ""), 16);
  const f = (v: number) => Math.max(0, Math.round(v * (1 - amount)));
  const r = f((n >> 16) & 255);
  const g = f((n >> 8) & 255);
  const b = f(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

/**
 * Chunky "toy" button with a darker lip underneath that squashes when pressed.
 * `variant="soft"` is the white secondary style.
 */
export function PrimaryButton({
  label,
  onPress,
  disabled,
  color,
  variant = "solid",
  icon,
  coins,
  levelPlus,
  style,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  color?: string;
  variant?: "solid" | "soft";
  icon?: IconName;
  /** `pay` is a price. `earn` is coins the player receives. */
  coins?: { amount?: number; mode: "pay" | "earn" };
  /** Shown when this action raises the village level. */
  levelPlus?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const c = colorsFor();
  const soft = variant === "soft";
  const bg = soft ? c.surface : color ?? c.primary;
  const lip = soft ? c.line : color ? shade(color) : c.primaryLip;
  const fg = soft ? c.ink : "#fff";
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        {
          backgroundColor: bg,
          borderBottomColor: lip,
          borderBottomWidth: pressed ? 2 : 5,
          marginTop: pressed ? 3 : 0,
          opacity: disabled ? 0.45 : 1,
        },
        style,
      ]}
    >
      <View style={styles.row}>
        {icon ? <Icon name={icon} size={20} color={fg} /> : null}
        <Text style={[styles.label, { color: fg }]}>{label}</Text>
        {levelPlus ? (
          <View style={[styles.levelChip, { backgroundColor: soft ? c.primaryTint : "#fff" }]}>
            <Text style={[styles.coinText, { color: c.primary }]}>{levelPlus}</Text>
          </View>
        ) : null}
        {coins ? (
          <View style={[styles.coinChip, { backgroundColor: soft ? GOLD.tint : "#fff" }]}>
            <Coin size={18} />
            <Text style={[styles.coinText, { color: coins.mode === "pay" ? GOLD.deep : OK.deep }]}>
              {coins.mode === "pay" ? `−${coins.amount ?? 0}` : coins.amount != null ? `+${coins.amount}` : "+"}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    minHeight: 52,
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  row: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "center", flexWrap: "wrap", gap: 8 },
  label: { fontSize: 17, fontFamily: font.heavy, textAlign: "center" },
  coinChip: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 4,
    borderRadius: 999,
    paddingVertical: 3,
    paddingLeft: 8,
    paddingRight: 4,
  },
  coinText: { fontFamily: font.black, fontSize: 15 },
  levelChip: { borderRadius: 999, paddingVertical: 4, paddingHorizontal: 8 },
});
