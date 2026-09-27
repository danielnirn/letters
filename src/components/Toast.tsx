import { useEffect, useState } from "react";
import { Animated, StyleSheet, Text } from "react-native";
import { colorsFor } from "../theme/colors";
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
  const opacity = useState(new Animated.Value(0))[0];
  useEffect(() => {
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.delay(1600),
      Animated.timing(opacity, { toValue: 0, duration: 280, useNativeDriver: true }),
    ]).start(() => onDone());
  }, [opacity, onDone]);
  return (
    <Animated.View style={[styles.toast, { backgroundColor: c.toast, opacity }]}>
      <Text style={styles.text}>{text}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    bottom: 36,
    alignSelf: "center",
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 16,
    zIndex: 50,
  },
  text: { color: "#fff", fontWeight: "800", fontSize: 15, textAlign: "center", fontFamily: "Heebo_700Bold" },
});
