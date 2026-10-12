import { useState, type ReactNode } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { font } from "../theme/colors";
import Svg from "react-native-svg";
import { Star } from "./Art";
import { FlowerG, MushroomG, SkyScene } from "./HomeArt";

export const WOOD = "#D9A066";
export const WOOD_LIP = "#A8723A";
export const NIGHT = "#2B3A5C";

/** Scrolling screen on the gnome-forest sky backdrop (game, complete, report). */
export function ForestScreen({ children, overlay }: { children: ReactNode; overlay?: ReactNode }) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  return (
    <View
      style={styles.fill}
      onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
    >
      {size.w > 0 ? (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <SkyScene width={size.w} height={size.h} />
        </View>
      ) : null}
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.inner}>{children}</View>
        </ScrollView>
      </SafeAreaView>
      {overlay}
    </View>
  );
}

/** Wooden-framed sky window with a grassy hill: the avatar's little stage. */
export function ForestStage({ children }: { children: ReactNode }) {
  return (
    <View style={styles.stageFrame}>
      <View style={styles.stage}>
        <View style={styles.spot} />
        <View style={styles.grass} />
        <View pointerEvents="none" style={styles.stageDeco}>
          <Svg width="100%" height={60} viewBox="0 0 100 24" preserveAspectRatio="xMidYMax meet">
            <MushroomG x={12} y={22} s={0.9} />
            <FlowerG x={24} y={20} color="#FF9AC4" />
            <FlowerG x={78} y={21} />
            <MushroomG x={89} y={22} s={0.7} />
          </Svg>
        </View>
        <View style={[styles.sparkle, { top: 30, right: 26 }]}>
          <Star size={22} />
        </View>
        <View style={[styles.sparkle, { top: 90, left: 22 }]}>
          <Star size={16} />
        </View>
        {children}
      </View>
    </View>
  );
}

/** Wooden plank sign with white chunky text. */
export function WoodSign({ text, big }: { text: string; big?: boolean }) {
  return (
    <View style={[styles.sign, big && styles.signBig]}>
      <Text style={[styles.signText, big && styles.signTextBig]} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: "#B5E4FF" },
  safe: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 18, paddingTop: 14, paddingBottom: 40 },
  inner: { flexGrow: 1, width: "100%", maxWidth: 520, alignSelf: "center", alignItems: "center" },
  stageFrame: {
    width: "100%",
    backgroundColor: WOOD,
    borderBottomWidth: 7,
    borderBottomColor: WOOD_LIP,
    borderRadius: 32,
    padding: 7,
    marginTop: 12,
  },
  stage: {
    width: "100%",
    backgroundColor: "#CDEEFF",
    borderRadius: 26,
    paddingTop: 18,
    paddingBottom: 14,
    paddingHorizontal: 14,
    alignItems: "center",
    overflow: "hidden",
  },
  spot: {
    position: "absolute",
    top: 26,
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: "rgba(255,255,255,0.75)",
  },
  grass: {
    position: "absolute",
    bottom: -120,
    left: -40,
    right: -40,
    height: 230,
    borderRadius: 200,
    backgroundColor: "#9BDB7C",
    borderTopWidth: 6,
    borderTopColor: "#B9E7A0",
  },
  stageDeco: { position: "absolute", left: 0, right: 0, bottom: 58 },
  sparkle: { position: "absolute" },
  sign: {
    backgroundColor: WOOD,
    borderBottomWidth: 5,
    borderBottomColor: WOOD_LIP,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 18,
    maxWidth: "100%",
  },
  signBig: { borderBottomWidth: 7, borderRadius: 20, paddingVertical: 10, paddingHorizontal: 26 },
  signText: {
    fontFamily: font.black,
    fontSize: 20,
    color: "#fff",
    textAlign: "center",
    textShadowColor: WOOD_LIP,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 0,
  },
  signTextBig: { fontSize: 28 },
});
