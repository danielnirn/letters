import { useState, type ReactNode } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  BadgeButton,
  ChestProgress,
  HeroButton,
  Island,
  OutlinedText,
  ResourceCounter,
  SeaBackdrop,
  WoodDock,
  WoodFrame,
} from "../src/components/GameKit";
import { CoinStack, Hammer } from "../src/components/HomeArt";
import { Building } from "../src/components/VillageArt";
import { Buddy } from "../src/components/ui";
import { KIT, font } from "../src/theme/colors";

/** Dev preview of every game-kit piece. Open /atlas in the browser. */
export default function AtlasScreen() {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [tab, setTab] = useState("home");
  return (
    <View style={styles.fill} onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      {size.w > 0 ? (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <SeaBackdrop width={size.w} height={size.h} />
        </View>
      ) : null}
      <SafeAreaView style={styles.fill}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Item name="ResourceCounter">
            <View style={styles.row}>
              <ResourceCounter kind="coin" value={431} />
              <ResourceCounter kind="star" value={12} />
            </View>
          </Item>
          <Item name="ChestProgress">
            <ChestProgress value={2} total={6} prize={150} milestoneAt={3} />
          </Item>
          <Item name="BadgeButton">
            <View style={styles.row}>
              <BadgeButton label="5 ⭐" tone="orange" ribbon="green" notify="!" glow onPress={() => {}}>
                <Hammer size={56} />
              </BadgeButton>
              <BadgeButton label="12:04:33" tone="purple" onPress={() => {}}>
                <CoinStack size={60} />
              </BadgeButton>
              <BadgeButton label="פתוח" tone="red" notify={1} onPress={() => {}}>
                <Buddy size={46} />
              </BadgeButton>
            </View>
          </Item>
          <Item name="Island + Building">
            <Island width={280}>
              <Building category="math" level={2} size={150} />
            </Island>
          </Item>
          <Item name="HeroButton">
            <HeroButton label="לשחק!" onPress={() => {}} style={{ alignSelf: "stretch" }} />
          </Item>
          <Item name="WoodFrame + OutlinedText">
            <WoodFrame>
              <View style={styles.framePad}>
                <OutlinedText size={22}>כפר 1</OutlinedText>
              </View>
            </WoodFrame>
          </Item>
          <Item name="WoodDock">
            <WoodDock
              active={tab}
              onPress={setTab}
              items={[
                { id: "map", label: "הכפר", art: <Building category="reading" level={1} size={40} /> },
                { id: "avatar", label: "הדמות", art: <Buddy size={34} /> },
                { id: "home", label: "בית", art: <Building category="math" level={4} size={46} /> },
                { id: "scores", label: "שיאים", art: <CoinStack size={42} /> },
              ]}
            />
          </Item>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function Item({ name, children }: { name: string; children: ReactNode }) {
  return (
    <View style={styles.item}>
      <Text style={styles.name}>{name}</Text>
      <View style={styles.stage}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: KIT.sea },
  scroll: { padding: 16, gap: 18, maxWidth: 520, width: "100%", alignSelf: "center" },
  item: { gap: 8 },
  name: { fontFamily: font.heavy, fontSize: 14, color: "#fff", textAlign: "right", opacity: 0.85 },
  stage: { alignItems: "center", paddingTop: 10 },
  row: { flexDirection: "row-reverse", flexWrap: "wrap", justifyContent: "center", gap: 14 },
  framePad: { paddingVertical: 6, paddingHorizontal: 28, backgroundColor: KIT.woodDark },
});
