import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { Screen } from "../src/components/Screen";
import { PrimaryButton } from "../src/components/PrimaryButton";
import { Mascot } from "../src/components/Art";
import { GenderPicker, useColors } from "../src/components/ui";
import type { Gender } from "../src/types/models";
import { useProgress } from "../src/context/ProgressContext";
import { he } from "../src/i18n/he";
import { BAD, font } from "../src/theme/colors";

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
    <Screen>
      <Mascot size={130} body={c.primary} kind={gender ?? "girl"} />
      <Text style={[styles.title, { color: c.ink }]}>{he.setupNameTitle}</Text>
      <Text style={[styles.hint, { color: c.soft }]}>{he.setupNameHint}</Text>
      <TextInput
        value={name}
        onChangeText={(t) => {
          setName(t);
          setError("");
        }}
        placeholder={he.namePlaceholder}
        placeholderTextColor={c.soft}
        maxLength={20}
        style={[styles.input, { backgroundColor: c.surface, borderColor: c.line, color: c.ink }]}
        onSubmitEditing={() => void submit()}
      />
      <Text style={[styles.question, { color: c.ink }]}>{he.genderQuestion}</Text>
      <GenderPicker
        value={gender}
        onChange={(g) => {
          setGenderPick(g);
          setError("");
        }}
        labels={{ girl: he.genderGirl, boy: he.genderBoy }}
      />
      <View style={{ height: 18 }} />
      {error ? <Text style={[styles.err, { color: BAD.deep }]}>{error}</Text> : null}
      <PrimaryButton
        label={he.continuePlay}
        onPress={() => void submit()}
        disabled={saving}
        style={{ alignSelf: "stretch" }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 30, fontFamily: font.black, textAlign: "center", marginTop: 16, marginBottom: 6 },
  hint: { fontFamily: font.medium, textAlign: "center", marginBottom: 20, fontSize: 16 },
  input: {
    width: "100%",
    minHeight: 60,
    padding: 14,
    borderRadius: 22,
    borderWidth: 2,
    borderBottomWidth: 5,
    textAlign: "center",
    fontSize: 22,
    fontFamily: font.heavy,
    marginBottom: 16,
  },
  question: { alignSelf: "stretch", fontFamily: font.heavy, fontSize: 18, textAlign: "right", marginTop: 4, marginBottom: 10 },
  err: { marginBottom: 12, fontFamily: font.bold },
});
