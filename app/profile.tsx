import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { ForestScreen, ForestStage, NIGHT, WOOD_LIP, WoodSign } from "../src/components/Forest";
import { PrimaryButton } from "../src/components/PrimaryButton";
import { useToast } from "../src/components/Toast";
import { useAuth } from "../src/context/AuthContext";
import { useProgress } from "../src/context/ProgressContext";
import { he } from "../src/i18n/he";
import { AvatarPreview } from "../src/components/AvatarPreview";
import { Coin, Icon } from "../src/components/Art";
import { Card, GenderPicker, TopBar, useColors } from "../src/components/ui";
import { defaultAvatar } from "../src/game/avatar";
import { BAD, OK, font } from "../src/theme/colors";

function SectionPill({ text }: { text: string }) {
  return (
    <View style={styles.sectionRow}>
      <View style={styles.sectionPill}>
        <Text style={styles.sectionText}>{text}</Text>
      </View>
    </View>
  );
}

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
    <ForestScreen overlay={node}>
      <TopBar
        onBack={() => router.back()}
        backLabel={he.backLabel}
        center={<WoodSign text={he.profileTitle} />}
      />
      <ForestStage>
        <View style={styles.lift}>
          <AvatarPreview loadout={active.avatar ?? defaultAvatar()} size={150} />
        </View>
        <View style={styles.coinPill}>
          <Coin size={30} />
          <Text style={[styles.coins, { color: c.ink }]}>{active.coins}</Text>
        </View>
      </ForestStage>
      <View style={styles.notePill}>
        <Text style={[styles.hint, { color: c.soft }]}>{isLocal ? he.coinsLocalOnly : he.coinsOnCloud}</Text>
        {cloudError ? <Text style={[styles.err, { color: BAD.deep }]}>{he.cloudError}</Text> : null}
      </View>

      <Card style={[styles.section, styles.woodCard]}>
        <SectionPill text={he.genderQuestion} />
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

      <Card style={[styles.section, styles.woodCard]}>
        <SectionPill text={he.childName} />
        <TextInput
          value={name}
          onChangeText={setName}
          maxLength={20}
          style={[styles.input, { backgroundColor: c.ground, borderColor: c.line, color: c.ink }]}
        />
        <PrimaryButton label={he.saveName} color={OK.base} onPress={() => void save()} />
      </Card>

      <Card style={[styles.section, styles.woodCard]}>
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

      <Pressable
        onPress={() => signOut()}
        style={({ pressed }) => [styles.logout, { borderBottomWidth: pressed ? 1 : 4, marginTop: pressed ? 23 : 20 }]}
      >
        <Icon name="logout" size={18} color={c.soft} />
        <Text style={[styles.logoutText, { color: c.soft }]}>{he.logout}</Text>
      </Pressable>
    </ForestScreen>
  );
}

const styles = StyleSheet.create({
  lift: { position: "relative", zIndex: 1 },
  coinPill: {
    position: "relative",
    zIndex: 1,
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fff",
    borderRadius: 999,
    borderBottomWidth: 4,
    borderBottomColor: "#C7D3E3",
    paddingVertical: 4,
    paddingHorizontal: 16,
    marginTop: 6,
  },
  coins: { fontSize: 28, fontFamily: font.black },
  notePill: { backgroundColor: "rgba(255,255,255,0.85)", borderRadius: 16, paddingHorizontal: 12, paddingBottom: 6, marginTop: 12 },
  hint: { textAlign: "center", marginTop: 6, fontFamily: font.medium, fontSize: 13 },
  err: { marginTop: 4, fontFamily: font.bold, textAlign: "center" },
  section: { marginTop: 14, width: "100%" },
  woodCard: { borderWidth: 3, borderColor: "#F1D9B3", borderBottomWidth: 6, borderBottomColor: WOOD_LIP },
  sectionRow: { flexDirection: "row-reverse", marginBottom: 10 },
  sectionPill: {
    backgroundColor: NIGHT,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "#fff",
    paddingVertical: 4,
    paddingHorizontal: 14,
  },
  sectionText: { fontFamily: font.heavy, fontSize: 14, color: "#fff", textAlign: "right" },
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
    marginBottom: 12,
  },
  logout: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fff",
    borderRadius: 999,
    borderBottomColor: "#C7D3E3",
    paddingVertical: 8,
    paddingHorizontal: 18,
  },
  logoutText: { fontFamily: font.bold, fontSize: 14 },
});
