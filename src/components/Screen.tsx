import { type ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colorsFor } from "../theme/colors";

export function Screen({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  const c = colorsFor();
  return (
    <View style={[styles.fill, { backgroundColor: c.ground }]}>
      <SafeAreaView style={styles.fill}>
        <ScrollView
          contentContainerStyle={[styles.content, footer ? styles.contentWithFooter : null]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.inner}>{children}</View>
        </ScrollView>
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 18, paddingTop: 18, paddingBottom: 40 },
  contentWithFooter: { paddingBottom: 16 },
  inner: { flexGrow: 1, width: "100%", maxWidth: 520, alignSelf: "center", alignItems: "center" },
  footer: { width: "100%", maxWidth: 520, alignSelf: "center", paddingHorizontal: 18, paddingBottom: 8 },
});
