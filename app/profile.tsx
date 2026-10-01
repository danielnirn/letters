import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { Screen } from "../src/components/Screen";
import { PrimaryButton } from "../src/components/PrimaryButton";
import { useToast } from "../src/components/Toast";
import { useAuth } from "../src/context/AuthContext";
import { useProgress } from "../src/context/ProgressContext";
import { he } from "../src/i18n/he";
import { AvatarPreview } from "../src/components/AvatarPreview";
import { Coin, Icon } from "../src/components/Art";
import { Card, GenderPicker, TopBar, useColors } from "../src/components/ui";
import { defaultAvatar } from "../src/game/avatar";
import { BAD, font } from "../src/theme/colors";

export default function ProfileScreen() {
  const router = useRouter();
  const { email, signOut, isLocal } = useAuth();
  const { active, setActiveName, setGender, cloudError } = useProgress();
  const { show, node } = useToast();
  const [name, setName] = useState(active.displayName);
  const c = useColors();

  const save = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    await setActiveName(trimmed);
    show(he.nameSaved);
  };

  return (
    <Screen>
      {node}
      <TopBar
        onBack={() => router.back()}
        backLabel={he.backLabel}
        center={<Text style={[styles.title, { color: c.ink }]}>{he.profileTitle}</Text>}
      />
      <AvatarPreview loadout={active.avatar ?? defaultAvatar()} size={110} />

      <Card style={styles.coinCard}>
        <View style={styles.coinRow}>
          <Coin size={36} />
          <Text style={[styles.coins, { color: c.ink }]}>{active.coins}</Text>
        </View>
        <Text style={[styles.hint, { color: c.soft }]}>{isLocal ? he.coinsLocalOnly : he.coinsOnCloud}</Text>
        {cloudError ? <Text style={[styles.err, { color: BAD.deep }]}>{he.cloudError}</Text> : null}
      </Card>

      <Card style={styles.section}>
        <Text style={[styles.label, { color: c.soft, marginBottom: 10 }]}>{he.genderQuestion}</Text>
        <GenderPicker
          value={active.gender}
          onChange={async (g) => {
            if (g === active.gender) return;
            await setGender(g);
            show(he.genderSaved);
          }}
          labels={{ girl: he.genderGirl, boy: he.genderBoy }}
        />
      </Card>

      <Card style={styles.section}>
        <Text style={[styles.label, { color: c.soft }]}>{he.childName}</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          maxLength={20}
          style={[styles.input, { backgroundColor: c.ground, borderColor: c.line, color: c.ink }]}
        />
        <PrimaryButton label={he.saveName} onPress={() => void save()} />
      </Card>

      <Card style={styles.section}>
        <View style={styles.infoRow}>
          <Text style={[styles.label, { color: c.soft }]}>{he.parentAccount}</Text>
          <Text style={[styles.value, { color: c.ink }]} numberOfLines={1}>
            {email ?? (isLocal ? "מכשיר מקומי" : "—")}
          </Text>
        </View>
        <View style={[styles.infoRow, { borderTopWidth: 2, borderTopColor: c.ground, paddingTop: 12, marginTop: 12 }]}>
          <Text style={[styles.label, { color: c.soft }]}>{he.planLabel}</Text>
          <Text style={[styles.value, { color: c.ink }]}>{he.planFree}</Text>
        </View>
      </Card>

      <Pressable onPress={() => signOut()} style={styles.logout}>
        <Icon name="logout" size={18} color={c.soft} />
        <Text style={[styles.logoutText, { color: c.soft }]}>{he.logout}</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontFamily: font.black },
  coinCard: { alignItems: "center", marginTop: 16 },
  coinRow: { flexDirection: "row-reverse", alignItems: "center", gap: 10 },
  coins: { fontSize: 36, fontFamily: font.black },
  hint: { textAlign: "center", marginTop: 6, fontFamily: font.medium, fontSize: 13 },
  err: { marginTop: 8, fontFamily: font.bold, textAlign: "center" },
  section: { marginTop: 14 },
  label: { fontFamily: font.bold, fontSize: 13, textAlign: "right" },
  value: { fontFamily: font.heavy, fontSize: 16, flexShrink: 1 },
  infoRow: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", gap: 12 },
  input: {
    width: "100%",
    minHeight: 54,
    padding: 12,
    borderRadius: 18,
    borderWidth: 2,
    textAlign: "center",
    fontFamily: font.heavy,
    fontSize: 20,
    marginTop: 8,
    marginBottom: 12,
  },
  logout: { flexDirection: "row-reverse", alignItems: "center", gap: 6, marginTop: 20, padding: 10 },
  logoutText: { fontFamily: font.bold, fontSize: 14 },
});
