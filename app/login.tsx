import { Platform, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../src/context/AuthContext";
import { he } from "../src/i18n/he";
import { useState } from "react";
import { Mascot, Star } from "../src/components/Art";
import { PrimaryButton } from "../src/components/PrimaryButton";
import { BAD, OK, defaultTheme as c, font } from "../src/theme/colors";

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
    <SafeAreaView style={[styles.fill, { backgroundColor: c.ground }]}>
      <View style={styles.box}>
        <View style={[styles.badge, { backgroundColor: c.primary, borderBottomColor: c.primaryLip }]}>
          <View style={[styles.blob, { backgroundColor: c.heroBlob }]} />
          <View style={styles.pair}>
            <Mascot size={104} kind="boy" />
            <Mascot size={104} />
          </View>
          <View style={styles.starA}>
            <Star size={22} fill="#FFC23D" stroke="#FFC23D" />
          </View>
          <View style={styles.starB}>
            <Star size={14} fill="#fff" stroke="#fff" />
          </View>
        </View>
        <Text style={[styles.title, { color: c.ink }]}>{he.appName}</Text>
        <Text style={[styles.sub, { color: c.primary }]}>{he.appSubtitle}</Text>
        <Text style={[styles.hint, { color: c.soft }]}>{he.parentLoginHint}</Text>
        {!firebaseReady ? <Text style={[styles.warn, { color: BAD.deep }]}>{he.firebaseMissing}</Text> : null}
        {error ? <Text style={[styles.warn, { color: BAD.deep }]}>{error}</Text> : null}

        <View style={styles.buttons}>
          {firebaseReady ? (
            <>
              <PrimaryButton label={he.loginGoogle} onPress={() => run(signInGoogle)} />
              {Platform.OS === "ios" ? (
                <PrimaryButton label={he.loginApple} color={c.ink} onPress={() => run(signInApple)} />
              ) : null}
            </>
          ) : null}
          <PrimaryButton
            label={he.loginLocal}
            variant={firebaseReady ? "soft" : "solid"}
            color={firebaseReady ? undefined : OK.base}
            onPress={() => signInLocal()}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  box: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  badge: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderBottomWidth: 7,
    alignItems: "center",
    justifyContent: "flex-end",
    overflow: "hidden",
    marginBottom: 22,
  },
  pair: { flexDirection: "row", alignItems: "flex-end", marginBottom: -4 },
  blob: { position: "absolute", top: -30, left: -30, width: 140, height: 140, borderRadius: 70 },
  starA: { position: "absolute", top: 30, right: 34 },
  starB: { position: "absolute", top: 62, left: 30 },
  title: { fontSize: 36, fontFamily: font.black, textAlign: "center" },
  sub: { fontSize: 18, fontFamily: font.bold, textAlign: "center", marginTop: 4 },
  hint: { marginTop: 12, marginBottom: 24, textAlign: "center", fontFamily: font.medium, fontSize: 15 },
  warn: { textAlign: "center", marginBottom: 16, fontFamily: font.bold },
  buttons: { width: "100%", maxWidth: 340, gap: 12 },
});
