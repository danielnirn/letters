import { StyleSheet, Text, View } from "react-native";
import { AVATAR_SLOTS, equippedId } from "../game/avatar";
import { shopItemById } from "../game/shop";
import type { AvatarLoadout } from "../types/models";

export function AvatarPreview({
  loadout,
  size = 88,
}: {
  loadout: AvatarLoadout;
  size?: number;
}) {
  const base = shopItemById(loadout.base);
  const extras = AVATAR_SLOTS.filter((s) => s !== "base")
    .map((slot) => {
      const id = equippedId(loadout, slot);
      return id ? shopItemById(id) : null;
    })
    .filter(Boolean);

  return (
    <View style={styles.wrap}>
      <View style={[styles.stage, { width: size, height: size, borderRadius: size / 2 }]}>
        <Text style={{ fontSize: size * 0.52 }}>{base?.emoji ?? "🧒"}</Text>
      </View>
      {extras.length > 0 ? (
        <View style={styles.gear}>
          {extras.map((it) => (
            <Text key={it!.id} style={styles.gearEmoji}>
              {it!.emoji}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center" },
  stage: {
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.22)",
  },
  gear: { flexDirection: "row", gap: 6, marginTop: 6 },
  gearEmoji: { fontSize: 22 },
});
