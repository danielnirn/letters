import { LinearGradient } from "expo-linear-gradient";
import { type ReactNode } from "react";
import { Platform, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colorsFor } from "../theme/colors";
import { useProgress } from "../context/ProgressContext";

export function Screen({ children }: { children: ReactNode }) {
  const { active } = useProgress();
  const c = colorsFor(active.theme);
  const inner = (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.inner}>{children}</View>
    </ScrollView>
  );

  if (Platform.OS === "web") {
    return <View style={[styles.fill, { backgroundColor: c.bg[0] }]}>{inner}</View>;
  }

  return (
    <LinearGradient colors={c.bg} style={styles.fill}>
      <SafeAreaView style={styles.fill}>{inner}</SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { flexGrow: 1, padding: 20, paddingBottom: 40 },
  inner: { width: "100%", maxWidth: 700, alignSelf: "center", alignItems: "center" },
});
