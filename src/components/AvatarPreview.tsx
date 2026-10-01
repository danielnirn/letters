import { StyleSheet, Text, View } from "react-native";
import { AVATAR_SLOTS, equippedId } from "../game/avatar";
import { shopItemById } from "../game/shop";
import type { AvatarLoadout } from "../types/models";
import { Buddy, useColors } from "./ui";

export function AvatarPreview({
  loadout,
  size = 88,
  showGear = true,
}: {
  loadout: AvatarLoadout;
  size?: number;
  showGear?: boolean;
}) {
  const c = useColors();
  const base = shopItemById(loadout.base);
  const extras = AVATAR_SLOTS.filter((s) => s !== "base")
    .map((slot) => {
      const id = equippedId(loadout, slot);
      return id ? shopItemById(id) : null;
    })
    .filter(Boolean);
  const isGnome = !base || base.id === "avatar_base_kid";

  return (
    <View style={styles.wrap}>
      <View
        style={[
          styles.stage,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: c.surface,
            borderBottomColor: c.line,
            borderBottomWidth: Math.max(3, size / 22),
            justifyContent: isGnome ? "flex-end" : "center",
          },
        ]}
      >
        {isGnome ? (
          <Buddy size={size * 0.8} body={c.primary} />
        ) : (
          <Text style={{ fontSize: size * 0.52 }}>{base?.emoji}</Text>
        )}
      </View>
      {showGear && extras.length > 0 ? (
        <View style={styles.gear}>
          {extras.map((it) => (
            <View key={it!.id} style={[styles.gearChip, { backgroundColor: c.surface, borderBottomColor: c.line }]}>
              <Text style={styles.gearEmoji}>{it!.emoji}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center" },
  stage: { alignItems: "center", overflow: "hidden" },
  gear: { flexDirection: "row-reverse", gap: 6, marginTop: 8 },
  gearChip: { width: 34, height: 34, borderRadius: 12, borderBottomWidth: 3, alignItems: "center", justifyContent: "center" },
  gearEmoji: { fontSize: 18 },
});
