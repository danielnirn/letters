import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from "react-native";

export function PrimaryButton({
  label,
  onPress,
  disabled,
  color = "#6bcb77",
  style,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  color?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: color, opacity: disabled ? 0.45 : pressed ? 0.85 : 1 },
        style,
      ]}
    >
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  label: { color: "#fff", fontWeight: "800", fontSize: 16, fontFamily: "Heebo_800ExtraBold" },
});
