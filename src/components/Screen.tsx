import { type ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colorsFor } from "../theme/colors";

export function Screen({ children }: { children: ReactNode }) {
  const c = colorsFor();
  return (
    <View style={[styles.fill, { backgroundColor: c.ground }]}>
      <SafeAreaView style={styles.fill}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.inner}>{children}</View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 18, paddingTop: 18, paddingBottom: 40 },
  inner: { flexGrow: 1, width: "100%", maxWidth: 520, alignSelf: "center", alignItems: "center" },
});
