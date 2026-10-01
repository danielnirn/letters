import { StyleSheet, View } from "react-native";
import { useProgress } from "../context/ProgressContext";
import type { AvatarLoadout } from "../types/models";
import { AvatarFigure } from "./AvatarArt";
import { useColors } from "./ui";

/** The player's dressed character. `showGear={false}` = round face badge. */
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
  const { active } = useProgress();
  const gender = active.gender ?? "girl";

  if (!showGear) {
    return (
      <View
        style={[
          styles.badge,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: c.surface,
            borderBottomColor: c.line,
            borderBottomWidth: Math.max(3, size / 22),
          },
        ]}
      >
        <AvatarFigure loadout={loadout} gender={gender} height={size * 0.96} head />
      </View>
    );
  }
  return (
    <View style={styles.wrap}>
      <AvatarFigure loadout={loadout} gender={gender} height={size * 1.6} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center" },
  badge: { alignItems: "center", justifyContent: "flex-end", overflow: "hidden" },
});
