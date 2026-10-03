import type { ReactNode } from "react";
import { View } from "react-native";
import Svg, { Circle, Ellipse, G, Path, Rect } from "react-native-svg";
import type { Category } from "../game/config";
import { VILLAGE_ORDER } from "../game/village";
import { he } from "../i18n/he";
import { CATEGORY_COLORS, GOLD, type Swatch } from "../theme/colors";

const WOOD = "#D9A066";
const WOOD_LIP = "#A8723A";
const STRAW = "#F4C74F";
const STRAW_LIP = "#C99A1E";
const GRASS = "#8ED46B";
const GRASS_LIP = "#5FAE45";
const DIRT = "#E2C29C";
const DIRT_LIP = "#B98E62";
const GLASS = "#CDEBFF";
const GHOST = "#AFC0DA";

export function buildingName(cat: Category) {
  if (cat === "reading") return he.buildingReading;
  if (cat === "science") return he.buildingScience;
  if (cat === "math") return he.buildingMath;
  if (cat === "logic") return he.buildingLogic;
  if (cat === "english") return he.buildingEnglish;
  return he.buildingLanguage;
}

/** Subject sign, drawn in a 20×20 box around (0,0). */
function Emblem({ category, color }: { category: Category; color: string }) {
  if (category === "reading") {
    return (
      <>
        <Path d="M-8 -5C-5 -7 -2 -7 0 -5C2 -7 5 -7 8 -5V6C5 4 2 4 0 6C-2 4 -5 4 -8 6Z" fill={color} />
        <Path d="M0 -4.5V5.5" stroke="#fff" strokeWidth={1.4} />
      </>
    );
  }
  if (category === "science") return <Path d="M-2.5 -8H2.5V-2L7.5 7H-7.5L-2.5 -2Z" fill={color} />;
  if (category === "math") {
    return <Path d="M0 -7V7M-7 0H7" stroke={color} strokeWidth={3.6} strokeLinecap="round" />;
  }
  if (category === "language") return <Path d="M-7 7L-6 2L4 -8L8 -4L-2 6Z" fill={color} />;
  if (category === "logic") {
    return (
      <G transform="translate(-10 -9.6) scale(0.4)">
        <Path d="M9 14H18A5 5 0 1 1 28 14H37V22A5 5 0 1 1 37 32V40H9V32A5 5 0 1 0 9 22Z" fill={color} />
      </G>
    );
  }
  return (
    <>
      <Path d="M0 -8C1.5 -8 1.5 -6 1.5 -5V7H-1.5V-5C-1.5 -6 -1.5 -8 0 -8Z" fill={color} />
      <Path d="M-8 1L0 -3L8 1V3L0 0L-8 3Z" fill={color} />
      <Path d="M-4 8L0 5L4 8Z" fill={color} />
    </>
  );
}

function Sign({ category, sw, x, y, r = 9 }: { category: Category; sw: Swatch; x: number; y: number; r?: number }) {
  return (
    <G>
      <Circle cx={x} cy={y} r={r} fill="#fff" stroke={sw.lip} strokeWidth={2} />
      <G transform={`translate(${x} ${y}) scale(${r / 13})`}>
        <Emblem category={category} color={sw.base} />
      </G>
    </G>
  );
}

function GrassBase() {
  return <Ellipse cx={60} cy={98} rx={52} ry={9} fill={GRASS} stroke={GRASS_LIP} strokeWidth={2} />;
}

function House({ category, sw }: { category: Category; sw: Swatch }) {
  return (
    <>
      <Rect x={76} y={28} width={9} height={20} rx={2} fill={sw.deep} />
      <Rect x={26} y={54} width={68} height={43} rx={4} fill={sw.tint} stroke={sw.lip} strokeWidth={3} />
      <Path d="M16 58L60 24L104 58Z" fill={sw.base} stroke={sw.lip} strokeWidth={3} strokeLinejoin="round" />
      <Path d="M52 97V79A8 8 0 0 1 68 79V97Z" fill={sw.deep} />
      <Circle cx={64.5} cy={88} r={1.6} fill={GOLD.base} />
      {[32, 74].map((x) => (
        <G key={x}>
          <Rect x={x} y={64} width={14} height={13} rx={3} fill={GLASS} stroke={sw.lip} strokeWidth={2} />
          <Path d={`M${x + 7} 64V77M${x} 70.5H${x + 14}`} stroke={sw.lip} strokeWidth={1.4} />
        </G>
      ))}
      <Sign category={category} sw={sw} x={60} y={44} />
    </>
  );
}

function Ornaments({ level, detail }: { level: number; detail: number }) {
  if (detail <= 0 || level <= 0 || level >= 4) return null;
  return (
    <>
      {level === 1 && detail >= 1 ? (
        <>
          <Rect x={8} y={78} width={3} height={20} rx={1} fill={WOOD_LIP} />
          <Circle cx={9.5} cy={74} r={5} fill={GOLD.base} stroke={STRAW_LIP} strokeWidth={1.5} />
        </>
      ) : null}
      {level === 1 && detail >= 2 ? (
        <>
          <Rect x={18} y={96} width={3} height={8} rx={1} fill={WOOD_LIP} />
          <Rect x={100} y={96} width={3} height={8} rx={1} fill={WOOD_LIP} />
          <Path d="M20 98H100" stroke={WOOD} strokeWidth={2} strokeLinecap="round" />
        </>
      ) : null}
      {level === 2 && detail >= 1 ? (
        <>
          <Circle cx={22} cy={100} r={3} fill="#FF6FB0" />
          <Circle cx={30} cy={102} r={2.4} fill={GOLD.base} />
          <Circle cx={96} cy={101} r={3} fill="#FF6FB0" />
        </>
      ) : null}
      {level === 2 && detail >= 2 ? (
        <>
          <Rect x={78} y={40} width={8} height={14} rx={2} fill="#8C9BB5" />
          <Circle cx={82} cy={36} r={3.5} fill="#E7EEF8" />
          <Circle cx={86} cy={33} r={2.5} fill="#E7EEF8" />
        </>
      ) : null}
      {level === 3 && detail >= 1 ? (
        <>
          <Rect x={8} y={78} width={4} height={20} rx={2} fill={WOOD_LIP} />
          <Circle cx={10} cy={72} r={9} fill={GRASS} stroke={GRASS_LIP} strokeWidth={2} />
        </>
      ) : null}
      {level === 3 && detail >= 2 ? (
        <Path d="M28 104Q60 96 92 104" stroke={DIRT} strokeWidth={5} strokeLinecap="round" />
      ) : null}
    </>
  );
}

/** One subject's building. Level 0 = empty plot … 4 = fancy house with a tower. `detail` adds a small piece. */
export function Building({
  category,
  level,
  size,
  detail = 0,
  lit = false,
}: {
  category: Category;
  level: number;
  size: number;
  detail?: number;
  lit?: boolean;
}) {
  const sw = CATEGORY_COLORS[category];
  let body: ReactNode;
  if (level <= 0) {
    body = (
      <>
        <Ellipse cx={60} cy={98} rx={46} ry={8} fill={DIRT} stroke={DIRT_LIP} strokeWidth={2} />
        <Path
          d="M30 96V60L60 34L90 60V96"
          fill="none"
          stroke={GHOST}
          strokeWidth={3}
          strokeDasharray="6 6"
          strokeLinecap="round"
        />
        <Rect x={57} y={72} width={6} height={25} rx={2} fill={WOOD_LIP} />
        <Rect x={44} y={60} width={32} height={20} rx={5} fill={WOOD} stroke={WOOD_LIP} strokeWidth={2} />
        <G transform="translate(60 70) scale(0.62)">
          <Emblem category={category} color="#fff" />
        </G>
      </>
    );
  } else if (level === 1) {
    body = (
      <>
        <GrassBase />
        <Path d="M30 97L62 34L94 97Z" fill={sw.base} stroke={sw.lip} strokeWidth={3} strokeLinejoin="round" />
        <Path d="M51 97L62 66L73 97Z" fill={sw.deep} />
        <Path d="M62 34V18" stroke={WOOD_LIP} strokeWidth={3} strokeLinecap="round" />
        <Path d="M62 18L76 22.5L62 27Z" fill={GOLD.base} />
        <Rect x={17} y={80} width={5} height={18} rx={2} fill={WOOD_LIP} />
        <Sign category={category} sw={sw} x={19.5} y={74} r={9} />
      </>
    );
  } else if (level === 2) {
    body = (
      <>
        <GrassBase />
        <Rect x={30} y={60} width={60} height={37} rx={3} fill={WOOD} stroke={WOOD_LIP} strokeWidth={3} />
        <Path d="M30 72H90M30 84H90" stroke={WOOD_LIP} strokeWidth={1.5} opacity={0.5} />
        <Path d="M22 64L60 32L98 64Z" fill={STRAW} stroke={STRAW_LIP} strokeWidth={3} strokeLinejoin="round" />
        <Path d="M42 50L38 62M78 50L82 62" stroke={STRAW_LIP} strokeWidth={1.5} strokeLinecap="round" />
        <Rect x={52} y={75} width={16} height={22} rx={3} fill={sw.base} stroke={sw.lip} strokeWidth={2} />
        <Circle cx={79} cy={73} r={5} fill={GLASS} stroke={WOOD_LIP} strokeWidth={2} />
        <Sign category={category} sw={sw} x={60} y={51} r={8} />
      </>
    );
  } else if (level === 3) {
    body = (
      <>
        <GrassBase />
        <House category={category} sw={sw} />
      </>
    );
  } else {
    body = (
      <>
        <GrassBase />
        <Rect x={82} y={28} width={24} height={69} rx={3} fill={sw.tint} stroke={sw.lip} strokeWidth={3} />
        <Path d="M78 30L94 4L110 30Z" fill={sw.base} stroke={sw.lip} strokeWidth={3} strokeLinejoin="round" />
        <Path d="M94 4V-7" stroke={WOOD_LIP} strokeWidth={2.5} strokeLinecap="round" />
        <Path d="M94 -7L106 -3L94 1Z" fill={GOLD.base} />
        <Rect x={89} y={38} width={10} height={13} rx={5} fill={GLASS} stroke={sw.lip} strokeWidth={2} />
        <G transform="translate(-8 0)">
          <House category={category} sw={sw} />
        </G>
        <Circle cx={12} cy={92} r={8} fill={GRASS} stroke={GRASS_LIP} strokeWidth={2} />
        <Circle cx={110} cy={94} r={7} fill={GRASS} stroke={GRASS_LIP} strokeWidth={2} />
        {[
          [26, 101, "#FF6FB0"],
          [36, 103, GOLD.base],
          [76, 102, "#FF6FB0"],
          [86, 101, GOLD.base],
        ].map(([x, y, f]) => (
          <Circle key={`${x}`} cx={x as number} cy={y as number} r={2.6} fill={f as string} />
        ))}
      </>
    );
  }
  return (
    <Svg width={size} height={size} viewBox="0 -10 120 120">
      {body}
      <Ornaments level={level} detail={detail} />
      {lit ? <Circle cx={60} cy={108} r={4} fill={GOLD.base} /> : null}
    </Svg>
  );
}

/** All six buildings on two grassy hills. Height = width × `aspect` (0.66 default; home uses a shorter strip). */
export function VillageScene({
  levels,
  width,
  aspect = 0.66,
  details,
  blooms = 0,
  litCategory = null,
}: {
  levels: Record<Category, number>;
  width: number;
  aspect?: number;
  details?: Record<Category, number>;
  blooms?: number;
  litCategory?: Category | null;
}) {
  const height = width * aspect;
  const back = height * 0.45;
  const front = height * 0.52;
  // RTL: first subject on the right.
  const backCenter = [0.82, 0.5, 0.18];
  const frontCenter = [0.815, 0.5, 0.185];
  return (
    <View style={{ width, height, borderRadius: 22, overflow: "hidden", backgroundColor: "#DFF1FF" }}>
      <Svg width={width} height={height} viewBox="0 0 100 66" preserveAspectRatio="none" style={{ position: "absolute" }}>
        <Ellipse cx={18} cy={9} rx={9} ry={3.2} fill="#fff" />
        <Ellipse cx={80} cy={6} rx={7} ry={2.6} fill="#fff" />
        <Path d="M0 30Q25 18 50 26T100 24V66H0Z" fill="#CDEFB8" />
        <Path d="M0 50Q30 40 60 46T100 43V66H0Z" fill="#B4E39A" />
        {Array.from({ length: Math.min(8, blooms) }, (_, i) => (
          <Circle key={i} cx={8 + (i % 8) * 11} cy={60 + (i % 2)} r={1.3} fill={i % 2 ? "#FF6FB0" : GOLD.base} />
        ))}
      </Svg>
      {VILLAGE_ORDER.slice(0, 3).map((cat, i) => (
        <View key={cat} style={{ position: "absolute", left: width * backCenter[i] - back / 2, top: height * 0.06 }}>
          <Building category={cat} level={levels[cat]} detail={details?.[cat] ?? 0} lit={litCategory === cat} size={back} />
        </View>
      ))}
      {VILLAGE_ORDER.slice(3).map((cat, i) => (
        <View key={cat} style={{ position: "absolute", left: width * frontCenter[i] - front / 2, top: height - front - height * 0.01 }}>
          <Building category={cat} level={levels[cat]} detail={details?.[cat] ?? 0} lit={litCategory === cat} size={front} />
        </View>
      ))}
    </View>
  );
}
