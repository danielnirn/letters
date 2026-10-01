import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colorsFor, font } from "../theme/colors";
import { useProgress } from "../context/ProgressContext";

export function useToast() {
  const [msg, setMsg] = useState<string | null>(null);
  const show = (text: string) => setMsg(text);
  const node = msg ? <Toast text={msg} onDone={() => setMsg(null)} /> : null;
  return { show, node };
}

function Toast({ text, onDone }: { text: string; onDone: () => void }) {
  const { active } = useProgress();
  const c = colorsFor(active.theme);
  useEffect(() => {
    const t = setTimeout(onDone, 1800);
    return () => clearTimeout(t);
  }, [onDone, text]);
  return (
    <View style={[styles.toast, { backgroundColor: c.toast }]}>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    bottom: 36,
    alignSelf: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 20,
    zIndex: 50,
    maxWidth: 360,
  },
  text: { color: "#fff", fontSize: 15, textAlign: "center", fontFamily: font.bold },
});
