import { LinearGradient } from "expo-linear-gradient";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../src/context/AuthContext";
import { he } from "../src/i18n/he";
import { useState } from "react";

export default function LoginScreen() {
  const { signInGoogle, signInApple, signInLocal, firebaseReady } = useAuth();
  const [error, setError] = useState("");

  const run = async (fn: () => Promise<void> | void) => {
    setError("");
    try {
      await fn();
    } catch {
      setError(he.loginError);
    }
  };

  return (
    <LinearGradient colors={["#1a1a2e", "#16213e", "#0f3460"]} style={styles.fill}>
      <SafeAreaView style={styles.fill}>
        <View style={styles.box}>
          <Text style={styles.title}>{he.appTitle}</Text>
          <Text style={styles.sub}>{he.appSubtitle}</Text>
          <Text style={styles.hint}>{he.parentLoginHint}</Text>
          {!firebaseReady ? <Text style={styles.warn}>{he.firebaseMissing}</Text> : null}
          {error ? <Text style={styles.warn}>{error}</Text> : null}

          {firebaseReady ? (
            <>
              <Pressable style={[styles.btn, styles.google]} onPress={() => run(signInGoogle)}>
                <Text style={styles.btnText}>{he.loginGoogle}</Text>
              </Pressable>
              {Platform.OS === "ios" ? (
                <Pressable style={[styles.btn, styles.apple]} onPress={() => run(signInApple)}>
                  <Text style={styles.btnText}>{he.loginApple}</Text>
                </Pressable>
              ) : null}
              <Pressable style={[styles.btn, styles.local]} onPress={() => signInLocal()}>
                <Text style={styles.btnText}>{he.loginLocal}</Text>
              </Pressable>
            </>
          ) : (
            <Pressable style={[styles.btn, styles.local]} onPress={() => signInLocal()}>
              <Text style={styles.btnText}>{he.loginLocal}</Text>
            </Pressable>
          )}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  box: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  title: {
    color: "#fff",
    fontSize: 36,
    fontFamily: "Heebo_900Black",
    textAlign: "center",
    marginBottom: 8,
  },
  sub: { color: "#a0c4ff", fontSize: 18, fontFamily: "Heebo_700Bold", textAlign: "center" },
  hint: {
    color: "rgba(255,255,255,0.7)",
    marginTop: 12,
    marginBottom: 24,
    textAlign: "center",
    fontFamily: "Heebo_400Regular",
  },
  warn: { color: "#ffd93d", textAlign: "center", marginBottom: 16, fontFamily: "Heebo_700Bold" },
  btn: {
    width: "100%",
    maxWidth: 340,
    paddingVertical: 14,
    borderRadius: 28,
    alignItems: "center",
    marginBottom: 12,
  },
  google: { backgroundColor: "#4285F4" },
  apple: { backgroundColor: "#000" },
  local: { backgroundColor: "#6bcb77" },
  btnText: { color: "#fff", fontSize: 18, fontFamily: "Heebo_800ExtraBold" },
  debug: {
    marginTop: 16,
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
    textAlign: "center",
    fontFamily: "Heebo_400Regular",
  },
});
