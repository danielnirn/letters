import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { useProgress } from "../context/ProgressContext";
import { colorsFor, font } from "../theme/colors";
import { Icon, type IconName } from "./Art";

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
  style,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  color?: string;
  variant?: "solid" | "soft";
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
}) {
  const { active } = useProgress();
  const c = colorsFor(active.theme);
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
  row: { flexDirection: "row-reverse", alignItems: "center", gap: 8 },
  label: { fontSize: 17, fontFamily: font.heavy, textAlign: "center" },
});
