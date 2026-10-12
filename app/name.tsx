import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { ForestScreen, ForestStage, NIGHT, WOOD_LIP, WoodSign } from "../src/components/Forest";
import { PrimaryButton } from "../src/components/PrimaryButton";
import { Mascot } from "../src/components/Art";
import { GenderPicker, useColors } from "../src/components/ui";
import type { Gender } from "../src/types/models";
import { useProgress } from "../src/context/ProgressContext";
import { he } from "../src/i18n/he";
import { BAD, OK, font } from "../src/theme/colors";

export default function NameSetupScreen() {
  const { active, setActiveName, setGender } = useProgress();
  const [name, setName] = useState(active.displayName);
  const [gender, setGenderPick] = useState<Gender | null>(active.gender);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const c = useColors();

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError(he.nameRequired);
      return;
    }
    if (!gender) {
      setError(he.genderRequired);
      return;
    }
    setSaving(true);
    // Gender first: the gate leaves this screen once the name is marked chosen.
    await setGender(gender);
    await setActiveName(trimmed);
    setSaving(false);
  };

  return (
    <ForestScreen>
      <WoodSign text={he.setupNameTitle} big />
      <ForestStage>
        <View style={styles.lift}>
          <Mascot size={140} body={c.primary} kind={gender ?? "girl"} />
        </View>
        <View style={styles.hintPill}>
          <Text style={styles.hint}>{he.setupNameHint}</Text>
        </View>
      </ForestStage>
      <TextInput
        value={name}
        onChangeText={(t) => {
          setName(t);
          setError("");
        }}
        placeholder={he.namePlaceholder}
        placeholderTextColor={c.soft}
        maxLength={20}
        style={[styles.input, { color: c.ink }]}
        onSubmitEditing={() => void submit()}
      />
      <View style={styles.questionRow}>
        <View style={styles.questionPill}>
          <Text style={styles.question}>{he.genderQuestion}</Text>
        </View>
      </View>
      <GenderPicker
        value={gender}
        onChange={(g) => {
          setGenderPick(g);
          setError("");
        }}
        labels={{ girl: he.genderGirl, boy: he.genderBoy }}
      />
      <View style={{ height: 18 }} />
      {error ? (
        <View style={styles.errPill}>
          <Text style={[styles.err, { color: BAD.deep }]}>{error}</Text>
        </View>
      ) : null}
      <PrimaryButton
        label={he.continuePlay}
        onPress={() => void submit()}
        disabled={saving}
        color={OK.base}
        style={{ alignSelf: "stretch" }}
      />
    </ForestScreen>
  );
}

const styles = StyleSheet.create({
  lift: { position: "relative", zIndex: 1 },
  hintPill: {
    position: "relative",
    zIndex: 1,
    backgroundColor: NIGHT,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "#fff",
    paddingVertical: 5,
    paddingHorizontal: 16,
    marginTop: 6,
  },
  hint: { fontFamily: font.bold, textAlign: "center", fontSize: 15, color: "#fff" },
  input: {
    width: "100%",
    minHeight: 62,
    padding: 14,
    borderRadius: 22,
    backgroundColor: "#fff",
    borderWidth: 3,
    borderColor: "#F1D9B3",
    borderBottomWidth: 6,
    borderBottomColor: WOOD_LIP,
    textAlign: "center",
    fontSize: 22,
    fontFamily: font.heavy,
    marginTop: 16,
    marginBottom: 16,
  },
  questionRow: { alignSelf: "stretch", flexDirection: "row-reverse", marginBottom: 10 },
  questionPill: {
    backgroundColor: NIGHT,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "#fff",
    paddingVertical: 4,
    paddingHorizontal: 14,
  },
  question: { fontFamily: font.heavy, fontSize: 16, color: "#fff", textAlign: "right" },
  errPill: { backgroundColor: "#fff", borderRadius: 999, paddingVertical: 4, paddingHorizontal: 14, marginBottom: 12 },
  err: { fontFamily: font.bold, textAlign: "center" },
});
