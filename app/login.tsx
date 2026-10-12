import { StyleSheet, Text, View } from "react-native";
import { useAuth } from "../src/context/AuthContext";
import { he } from "../src/i18n/he";
import { useState } from "react";
import { Mascot, Star } from "../src/components/Art";
import { ForestScreen, WOOD, WOOD_LIP, WoodSign } from "../src/components/Forest";
import { PrimaryButton } from "../src/components/PrimaryButton";
import { BAD, OK, defaultTheme as c, font } from "../src/theme/colors";

export default function LoginScreen() {
  const { signInGoogle, signInApple, signInLocal, firebaseReady, appleAvailable } = useAuth();
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
    <ForestScreen>
      <View style={styles.box}>
        <View style={styles.badge}>
          <View style={styles.glow} />
          <View style={styles.hill} />
          <View style={styles.pair}>
            <Mascot size={104} kind="boy" />
            <Mascot size={104} />
          </View>
          <View style={styles.starA}>
            <Star size={24} />
          </View>
          <View style={styles.starB}>
            <Star size={16} />
          </View>
        </View>
        <View style={styles.sign}>
          <WoodSign text={he.appName} big />
        </View>
        <View style={styles.card}>
          <Text style={[styles.hint, { color: c.soft }]}>{he.parentLoginHint}</Text>
          {!firebaseReady ? <Text style={[styles.warn, { color: BAD.deep }]}>{he.firebaseMissing}</Text> : null}
          {error ? <Text style={[styles.warn, { color: BAD.deep }]}>{error}</Text> : null}

          <View style={styles.buttons}>
            {firebaseReady ? (
              <>
                <PrimaryButton label={he.loginGoogle} onPress={() => run(signInGoogle)} />
                {appleAvailable ? (
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
      </View>
    </ForestScreen>
  );
}

const styles = StyleSheet.create({
  box: { flex: 1, width: "100%", alignItems: "center", justifyContent: "center", paddingVertical: 12 },
  badge: {
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: "#CDEEFF",
    borderWidth: 7,
    borderColor: WOOD,
    borderBottomWidth: 11,
    borderBottomColor: WOOD_LIP,
    alignItems: "center",
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  glow: { position: "absolute", top: 18, width: 150, height: 150, borderRadius: 75, backgroundColor: "rgba(255,255,255,0.8)" },
  hill: {
    position: "absolute",
    bottom: -70,
    left: -30,
    right: -30,
    height: 120,
    borderRadius: 100,
    backgroundColor: "#9BDB7C",
    borderTopWidth: 5,
    borderTopColor: "#B9E7A0",
  },
  pair: { flexDirection: "row", alignItems: "flex-end", marginBottom: -4 },
  starA: { position: "absolute", top: 28, right: 30 },
  starB: { position: "absolute", top: 60, left: 28 },
  sign: { marginTop: -22 },
  card: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#fff",
    borderRadius: 28,
    borderWidth: 3,
    borderColor: "#F1D9B3",
    borderBottomWidth: 7,
    borderBottomColor: WOOD_LIP,
    padding: 18,
    marginTop: 18,
    alignItems: "center",
  },
  hint: { marginBottom: 16, textAlign: "center", fontFamily: font.medium, fontSize: 15 },
  warn: { textAlign: "center", marginBottom: 16, fontFamily: font.bold },
  buttons: { width: "100%", gap: 12 },
});
