import { useEffect, useState, type ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { he } from "../i18n/he";
import { font } from "../theme/colors";
import { Star } from "./Art";
import { Chest, CoinStack, CurvyArrow, Hammer } from "./HomeArt";
import { Buddy } from "./ui";
import { Building } from "./VillageArt";

const TITLE_SHADOW = "#7A3E12";

/** Full-screen "how to play" coach overlay. Tap anywhere to close. */
export function HowToPlay({ onClose }: { onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const [opacity, setOpacity] = useState(0);
  const [blink, setBlink] = useState(1);

  useEffect(() => {
    let frame = 0;
    const started = performance.now();
    const tick = (now: number) => {
      const t = now - started;
      setOpacity(Math.min(1, t / 260));
      setBlink(0.55 + 0.45 * Math.abs(Math.cos(t / 520)));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={he.howToContinue}
      onPress={onClose}
      style={[StyleSheet.absoluteFill, styles.scrim, { opacity }]}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 18, paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={onClose} style={styles.inner}>
          <Text style={styles.title}>{he.howToTitle}</Text>

          <Step
            side="right"
            art={<CoinStack size={118} />}
            title={he.howToLearnTitle}
            body={he.howToLearnBody}
          />
          <View style={[styles.arrow, { alignSelf: "flex-start" }]}>
            <CurvyArrow width={74} flip />
          </View>
          <Step
            side="left"
            art={
              <View style={styles.buildArt}>
                <Building category="math" level={2} size={118} />
                <View style={styles.hammer}>
                  <Hammer size={58} />
                </View>
              </View>
            }
            title={he.howToBuildTitle}
            body={he.howToBuildBody}
          />
          <View style={[styles.arrow, { alignSelf: "flex-end" }]}>
            <CurvyArrow width={74} />
          </View>
          <Step
            side="right"
            art={
              <View style={styles.prizeArt}>
                <View style={styles.glow} />
                <Chest size={112} open />
                <View style={styles.prizeBuddy}>
                  <Buddy size={52} />
                </View>
                <View style={styles.prizeStar}>
                  <Star size={30} />
                </View>
              </View>
            }
            title={he.howToPrizeTitle}
            body={he.howToPrizeBody}
          />

          <Text style={[styles.tap, { opacity: blink }]}>{he.howToContinue}</Text>
        </Pressable>
      </ScrollView>
    </Pressable>
  );
}

function Step({
  side,
  art,
  title,
  body,
}: {
  side: "left" | "right";
  art: ReactNode;
  title: string;
  body: string;
}) {
  // RTL: "right" puts the picture at the start (right) and the words beside it.
  return (
    <View style={[styles.step, { flexDirection: side === "right" ? "row-reverse" : "row" }]}>
      <View style={styles.art}>{art}</View>
      <View style={styles.copy}>
        <Text style={styles.stepTitle}>{title}</Text>
        <Text style={styles.stepBody}>{body}</Text>
      </View>
    </View>
  );
}

const outline = {
  textShadowColor: TITLE_SHADOW,
  textShadowOffset: { width: 0, height: 3 },
  textShadowRadius: 0,
};

const styles = StyleSheet.create({
  scrim: { backgroundColor: "rgba(20, 28, 54, 0.86)", zIndex: 50 },
  content: { flexGrow: 1, paddingHorizontal: 18 },
  inner: { width: "100%", maxWidth: 480, alignSelf: "center", alignItems: "center" },
  title: {
    fontFamily: font.black,
    fontSize: 40,
    color: "#FFE04A",
    textAlign: "center",
    marginBottom: 18,
    ...outline,
  },
  step: { width: "100%", alignItems: "center", gap: 10 },
  art: { width: 130, alignItems: "center", justifyContent: "center" },
  copy: { flex: 1, alignItems: "center" },
  stepTitle: { fontFamily: font.black, fontSize: 26, color: "#fff", textAlign: "center", ...outline },
  stepBody: {
    fontFamily: font.bold,
    fontSize: 16,
    lineHeight: 22,
    color: "#fff",
    textAlign: "center",
    marginTop: 6,
  },
  arrow: { marginVertical: -6, marginHorizontal: 40 },
  buildArt: { width: 130, height: 120, alignItems: "center", justifyContent: "center" },
  hammer: { position: "absolute", right: -6, bottom: 4 },
  prizeArt: { width: 130, height: 130, alignItems: "center", justifyContent: "center" },
  glow: {
    position: "absolute",
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: "rgba(255, 224, 74, 0.28)",
  },
  prizeBuddy: { position: "absolute", top: -14, left: 2 },
  prizeStar: { position: "absolute", top: 6, right: 6 },
  tap: { fontFamily: font.black, fontSize: 24, color: "#FFE04A", marginTop: 26, textAlign: "center", ...outline },
});
