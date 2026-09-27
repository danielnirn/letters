import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { Screen } from "../src/components/Screen";
import { GhostButton } from "../src/components/LeaderboardTable";
import { PrimaryButton } from "../src/components/PrimaryButton";
import { useToast } from "../src/components/Toast";
import { useAuth } from "../src/context/AuthContext";
import { useProgress } from "../src/context/ProgressContext";
import { he } from "../src/i18n/he";
import { AvatarPreview } from "../src/components/AvatarPreview";
import { defaultAvatar } from "../src/game/avatar";
import { colorsFor } from "../src/theme/colors";

export default function ProfileScreen() {
  const router = useRouter();
  const { email, signOut, isLocal } = useAuth();
  const { active, setActiveName, cloudError } = useProgress();
  const { show, node } = useToast();
  const [name, setName] = useState(active.displayName);
  const c = colorsFor(active.theme);

  const save = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    await setActiveName(trimmed);
    show(he.nameSaved);
  };

  return (
    <Screen>
      {node}
      <Text style={[styles.title, { color: c.title }]}>{he.profileTitle}</Text>
      <AvatarPreview loadout={active.avatar ?? defaultAvatar()} size={100} />
      <Text style={[styles.label, { color: c.subtitle }]}>{he.parentAccount}</Text>
      <Text style={styles.value}>{email ?? (isLocal ? "מכשיר מקומי" : "—")}</Text>

      <Text style={[styles.label, { color: c.subtitle }]}>{he.childName}</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        maxLength={20}
        style={styles.input}
      />
      <PrimaryButton label={he.saveName} onPress={() => void save()} />

      <View style={styles.coinBox}>
        <Text style={[styles.coins, { color: c.coin }]}>{he.coinsCount(active.coins)}</Text>
        <Text style={styles.hint}>{isLocal ? he.coinsLocalOnly : he.coinsOnCloud}</Text>
        {cloudError ? <Text style={styles.err}>{he.cloudError}</Text> : null}
      </View>

      <Text style={[styles.label, { color: c.subtitle }]}>{he.planLabel}</Text>
      <Text style={styles.value}>{he.planFree}</Text>

      <View style={{ height: 20 }} />
      <GhostButton label={he.back} onPress={() => router.back()} />
      <Pressable onPress={() => signOut()} style={{ marginTop: 16 }}>
        <Text style={styles.logout}>{he.logout}</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontFamily: "Heebo_900Black", marginBottom: 16, textAlign: "center" },
  label: { alignSelf: "stretch", fontFamily: "Heebo_700Bold", marginTop: 12, marginBottom: 4 },
  value: { alignSelf: "stretch", color: "#fff", fontFamily: "Heebo_400Regular", fontSize: 16 },
  input: {
    width: "100%",
    padding: 12,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.25)",
    color: "#fff",
    textAlign: "center",
    fontFamily: "Heebo_700Bold",
    fontSize: 18,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginBottom: 10,
  },
  coinBox: {
    width: "100%",
    marginTop: 20,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
  },
  coins: { fontSize: 28, fontFamily: "Heebo_900Black" },
  hint: { color: "rgba(255,255,255,0.7)", textAlign: "center", marginTop: 8, fontFamily: "Heebo_400Regular" },
  err: { color: "#ff6b6b", marginTop: 8, fontFamily: "Heebo_700Bold", textAlign: "center" },
  logout: { color: "rgba(255,255,255,0.5)", fontFamily: "Heebo_700Bold" },
});
