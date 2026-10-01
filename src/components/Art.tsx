import { Text, View } from "react-native";
import Svg, { Circle, Ellipse, Path, Rect } from "react-native-svg";
import type { Category, Difficulty } from "../game/config";
import { CATEGORY_COLORS, DIFFICULTY_COLORS, font } from "../theme/colors";

const INK = "#1F2A44";

/** The gnome mascot (גמדה / גמד). `body` tints the shirt; `kind` picks girl (braids) or boy. */
export function Mascot({
  size = 110,
  body = "#2F6FEB",
  kind = "girl",
}: {
  size?: number;
  body?: string;
  kind?: "girl" | "boy";
}) {
  const boy = kind === "boy";
  const hat = boy ? "#2FBF71" : "#FF5C6C";
  const band = boy ? "#1E9457" : "#E04455";
  return (
    <Svg width={size} height={(size * 140) / 120} viewBox="0 0 120 140">
      <Path d="M36 140 Q38 116 60 116 Q82 116 84 140 Z" fill={body} />
      <Path d="M46 122 L60 132 L74 122" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      {boy ? (
        <>
          <Circle cx={31} cy={94} r={6.5} fill="#F4C49E" />
          <Circle cx={89} cy={94} r={6.5} fill="#F4C49E" />
        </>
      ) : (
        <>
          <Circle cx={27} cy={100} r={9} fill="#C86B2E" />
          <Circle cx={93} cy={100} r={9} fill="#C86B2E" />
          <Circle cx={24} cy={112} r={4} fill="#FF5C6C" />
          <Circle cx={96} cy={112} r={4} fill="#FF5C6C" />
        </>
      )}
      <Circle cx={60} cy={92} r={30} fill="#FFD9B8" />
      {boy ? (
        <Path d="M31 84 Q36 70 50 72 Q46 78 52 80 Q58 72 66 78 Q70 72 78 76 Q86 74 89 84 Q88 68 60 66 Q32 68 31 84Z" fill="#8A4A1F" />
      ) : (
        <Path d="M30 82 Q60 64 90 82 Q88 70 60 66 Q32 70 30 82Z" fill="#C86B2E" />
      )}
      <Path d="M24 66 C34 42 50 18 80 6 C72 24 76 44 96 66 Z" fill={hat} />
      <Rect x={20} y={60} width={80} height={13} rx={6.5} fill={band} />
      <Circle cx={80} cy={7} r={7} fill="#FFC23D" />
      <Circle cx={49} cy={92} r={4.2} fill={INK} />
      <Circle cx={71} cy={92} r={4.2} fill={INK} />
      <Circle cx={50.6} cy={90.4} r={1.4} fill="#fff" />
      <Circle cx={72.6} cy={90.4} r={1.4} fill="#fff" />
      <Ellipse cx={42} cy={102} rx={5} ry={3.4} fill={boy ? "#FFB59A" : "#FF9AA2"} />
      <Ellipse cx={78} cy={102} rx={5} ry={3.4} fill={boy ? "#FFB59A" : "#FF9AA2"} />
      {boy ? (
        <Path d="M50 103 Q60 113 70 103 Z" fill={INK} />
      ) : (
        <Path d="M52 104 Q60 111 68 104" stroke={INK} strokeWidth={3} fill="none" strokeLinecap="round" />
      )}
    </Svg>
  );
}

export function Coin({ size = 22 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Circle cx={16} cy={17.5} r={13} fill="#E09A00" />
      <Circle cx={16} cy={15} r={13} fill="#FFC23D" />
      <Circle cx={16} cy={15} r={9} fill="none" stroke="#E09A00" strokeWidth={2} />
      <Path d="M16 9.6l1.7 3.4 3.7.5-2.7 2.6.6 3.7-3.3-1.8-3.3 1.8.6-3.7-2.7-2.6 3.7-.5z" fill="#FFF3C4" />
    </Svg>
  );
}

export function Star({
  size = 24,
  fill = "#FFC23D",
  stroke = "#E09A00",
}: {
  size?: number;
  fill?: string;
  stroke?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12 2.5l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.3l-5.8 3.1 1.1-6.5L2.6 9.3l6.5-.9z"
        fill={fill}
        stroke={stroke}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

const ICON_PATHS = {
  bag: ["M5 8h14l-1.2 12H6.2z", "M9 10V6.5a3 3 0 0 1 6 0V10"],
  backpack: ["M9 7h6a4 4 0 0 1 4 4v6a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4v-6a4 4 0 0 1 4-4z", "M9 7V5.5h6V7", "M9 14h6"],
  trophy: ["M8 4h8v5a4 4 0 0 1-8 0z", "M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4", "M12 13v4M8 20h8M10 17h4"],
  user: ["M12 4a4 4 0 1 1 0 8a4 4 0 1 1 0-8z", "M4 20c1.5-4 4.5-6 8-6s6.5 2 8 6"],
  back: ["M9 5l7 7-7 7"],
  close: ["M6 6l12 12M18 6L6 18"],
  bulb: ["M9 18h6M10 21h4", "M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"],
  erase: ["M20 6H9l-5 6 5 6h11z", "M12 10l4 4M16 10l-4 4"],
  skip: ["M15 6l-6 6 6 6", "M8 6v12"],
  lock: ["M8 11h8a3 3 0 0 1 3 3v4a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3v-4a3 3 0 0 1 3-3z", "M8 11V8a4 4 0 0 1 8 0v3"],
  check: ["M5 12.5l4.5 4.5L19 7.5"],
  x: ["M7 7l10 10M17 7L7 17"],
  replay: ["M4 12a8 8 0 1 0 2.4-5.7", "M4 4v4h4"],
  logout: ["M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3", "M10 8l-4 4 4 4", "M6 12h10"],
  next: ["M15 5l-7 7 7 7"],
  home: ["M4 12l8-8 8 8", "M6 10.5V20h12v-9.5"],
} as const;

export type IconName = keyof typeof ICON_PATHS;

export function Icon({
  name,
  size = 22,
  color = INK,
  weight = 2.2,
}: {
  name: IconName;
  size?: number;
  color?: string;
  weight?: number;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {ICON_PATHS[name].map((d) => (
        <Path key={d} d={d} stroke={color} strokeWidth={weight} strokeLinecap="round" strokeLinejoin="round" />
      ))}
    </Svg>
  );
}

function CategoryGlyph({ category, size }: { category: Category; size: number }) {
  const lip = CATEGORY_COLORS[category].lip;
  if (category === "language" || category === "english") {
    return (
      <Text style={{ color: "#fff", fontFamily: font.black, fontSize: size * 0.9, lineHeight: size * 1.05 }}>
        {category === "language" ? "אב" : "Ab"}
      </Text>
    );
  }
  const s = size * 1.2;
  if (category === "math") {
    return (
      <Svg width={s} height={s} viewBox="0 0 48 48" fill="none">
        {["M15 9v14M8 16h14", "M29 10l11 11M40 10L29 21", "M8 34h14", "M28 30h13M28 38h13"].map((d) => (
          <Path key={d} d={d} stroke="#fff" strokeWidth={4.5} strokeLinecap="round" />
        ))}
      </Svg>
    );
  }
  if (category === "logic") {
    return (
      <Svg width={s} height={s} viewBox="0 0 48 48">
        <Path d="M9 14H18A5 5 0 1 1 28 14H37V22A5 5 0 1 1 37 32V40H9V32A5 5 0 1 0 9 22Z" fill="#fff" />
      </Svg>
    );
  }
  return (
    <Svg width={s} height={s} viewBox="0 0 48 48">
      <Path d="M39 8C18 8 9 20 11 37C27 39 39 30 39 8Z" fill="#fff" />
      <Path d="M11 37L27 21" stroke={lip} strokeWidth={3.5} strokeLinecap="round" />
    </Svg>
  );
}

/** Colored rounded tile with the subject's glyph. */
export function CategoryTile({ category, size = 56 }: { category: Category; size?: number }) {
  const c = CATEGORY_COLORS[category];
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.3,
        backgroundColor: c.base,
        borderBottomWidth: Math.max(3, Math.round(size / 12)),
        borderBottomColor: c.lip,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <CategoryGlyph category={category} size={size * 0.5} />
    </View>
  );
}

function DifficultyGlyph({ difficulty, size }: { difficulty: Difficulty; size: number }) {
  if (difficulty === "mid") return <Star size={size} fill="#fff" stroke="#fff" />;
  const d =
    difficulty === "easy"
      ? ["M12 21V12", "M12 13C12 8 8 6 4 6c0 5 3 7 8 7z", "M12 11c0-4 3-6 8-6 0 4-3 6-8 6z"]
      : ["M12 2c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 2-5 3-6 0 2 1 3 2 3 0-3-1-6 1-9z"];
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {d.map((p, i) => (
        <Path
          key={p}
          d={p}
          fill={difficulty === "easy" && i === 0 ? "none" : "#fff"}
          stroke="#fff"
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </Svg>
  );
}

export function DifficultyTile({ difficulty, size = 56 }: { difficulty: Difficulty; size?: number }) {
  const c = DIFFICULTY_COLORS[difficulty];
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.3,
        backgroundColor: c.base,
        borderBottomWidth: Math.max(3, Math.round(size / 12)),
        borderBottomColor: c.lip,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <DifficultyGlyph difficulty={difficulty} size={size * 0.55} />
    </View>
  );
}
