import { useState } from "react";
import { StyleSheet, Text, TextInput } from "react-native";
import { Screen } from "../src/components/Screen";
import { PrimaryButton } from "../src/components/PrimaryButton";
import { useProgress } from "../src/context/ProgressContext";
import { he } from "../src/i18n/he";
import { colorsFor } from "../src/theme/colors";

export default function NameSetupScreen() {
  const { active, setActiveName } = useProgress();
  const [name, setName] = useState(active.displayName);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const c = colorsFor(active.theme);

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError(he.nameRequired);
      return;
    }
    setSaving(true);
    await setActiveName(trimmed);
    setSaving(false);
  };

  return (
    <Screen>
      <Text style={[styles.title, { color: c.title }]}>{he.setupNameTitle}</Text>
      <Text style={[styles.hint, { color: c.subtitle }]}>{he.setupNameHint}</Text>
      <TextInput
        value={name}
        onChangeText={(t) => {
          setName(t);
          setError("");
        }}
        placeholder={he.namePlaceholder}
        placeholderTextColor="rgba(255,255,255,0.35)"
        maxLength={20}
        style={styles.input}
        onSubmitEditing={() => void submit()}
      />
      {error ? <Text style={styles.err}>{error}</Text> : null}
      <PrimaryButton label={he.continuePlay} onPress={() => void submit()} disabled={saving} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 32, fontFamily: "Heebo_900Black", textAlign: "center", marginBottom: 8 },
  hint: { fontFamily: "Heebo_400Regular", textAlign: "center", marginBottom: 20, fontSize: 16 },
  input: {
    width: "100%",
    maxWidth: 340,
    padding: 14,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.25)",
    color: "#fff",
    textAlign: "center",
    fontSize: 18,
    fontFamily: "Heebo_700Bold",
    backgroundColor: "rgba(255,255,255,0.1)",
    marginBottom: 16,
  },
  err: { color: "#ff6b6b", marginBottom: 12, fontFamily: "Heebo_700Bold" },
});
