import { View } from "react-native";
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop } from "react-native-svg";
import { GOLD } from "../theme/colors";

const WOOD = "#D9A066";
const WOOD_LIP = "#A8723A";
const WOOD_DEEP = "#7E5226";
const LEAF = "#5FBF4A";
const LEAF_LIP = "#3F9A35";
const CAP = "#FF5C6C";
const CAP_LIP = "#D93A4B";

/** Red gnome mushroom with white spots, drawn around its stem base at (x, y). */
export function MushroomG({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      <Ellipse cx={0} cy={0} rx={7} ry={1.8} fill="#000" opacity={0.12} />
      <Path d="M-2.6 0V-6.5Q0 -7.5 2.6 -6.5V0Z" fill="#FFF6E6" stroke="#E7D3B5" strokeWidth={0.8} />
      <Path d="M-7 -6.2Q-7 -13 0 -13.5Q7 -13 7 -6.2Q0 -4.6 -7 -6.2Z" fill={CAP} stroke={CAP_LIP} strokeWidth={0.9} />
      <Circle cx={-3.4} cy={-9.6} r={1.3} fill="#fff" />
      <Circle cx={1.2} cy={-11.6} r={1.1} fill="#fff" />
      <Circle cx={3.8} cy={-8.4} r={1.2} fill="#fff" />
    </G>
  );
}

/** Round leafy tree centered on its trunk base (x, y). */
export function TreeG({ x, y, s = 1, tone = LEAF }: { x: number; y: number; s?: number; tone?: string }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      <Ellipse cx={0} cy={0} rx={10} ry={2.4} fill="#000" opacity={0.12} />
      <Rect x={-2} y={-9} width={4} height={9} rx={1.5} fill={WOOD_LIP} />
      <Circle cx={-5.5} cy={-13} r={7} fill={tone} stroke={LEAF_LIP} strokeWidth={1} />
      <Circle cx={5.5} cy={-13} r={7} fill={tone} stroke={LEAF_LIP} strokeWidth={1} />
      <Circle cx={0} cy={-19} r={8} fill={tone} stroke={LEAF_LIP} strokeWidth={1} />
      <Circle cx={-2.5} cy={-21.5} r={2.6} fill="#fff" opacity={0.25} />
    </G>
  );
}

/** Pine tree centered on its base (x, y). */
export function PineG({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      <Rect x={-1.6} y={-5} width={3.2} height={5} fill={WOOD_LIP} />
      <Path d="M-9 -4L0 -15L9 -4Z" fill="#3FA65A" stroke="#2C8045" strokeWidth={1} strokeLinejoin="round" />
      <Path d="M-7 -11L0 -22L7 -11Z" fill="#4DB868" stroke="#2C8045" strokeWidth={1} strokeLinejoin="round" />
      <Path d="M-5 -18L0 -27L5 -18Z" fill="#5CC877" stroke="#2C8045" strokeWidth={1} strokeLinejoin="round" />
    </G>
  );
}

export function FlowerG({ x, y, color = "#FFE07A" }: { x: number; y: number; color?: string }) {
  return (
    <G>
      {[0, 72, 144, 216, 288].map((a) => (
        <Circle
          key={a}
          cx={x + Math.cos((a * Math.PI) / 180) * 1.5}
          cy={y + Math.sin((a * Math.PI) / 180) * 1.5}
          r={1.2}
          fill={color}
        />
      ))}
      <Circle cx={x} cy={y} r={0.9} fill="#FF9F43" />
    </G>
  );
}

function Cloud({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`} opacity={0.95}>
      <Ellipse cx={0} cy={0} rx={12} ry={4.5} fill="#fff" />
      <Circle cx={-4} cy={-3} r={5} fill="#fff" />
      <Circle cx={3} cy={-4.5} r={6} fill="#fff" />
    </G>
  );
}

/** Home backdrop: sky, clouds, hills and a gnome forest edge. Fills its box. */
export function SkyScene({ width, height }: { width: number; height: number }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 100 200" preserveAspectRatio="xMidYMax slice">
      <Defs>
        <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#7CC8FF" />
          <Stop offset="0.6" stopColor="#C4EAFF" />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={100} height={200} fill="url(#sky)" />
      <Cloud x={18} y={42} s={1.1} />
      <Cloud x={82} y={30} s={0.9} />
      <Cloud x={60} y={62} s={0.7} />
      <Path d="M0 118Q22 98 46 110T100 104V200H0Z" fill="#B9E7A0" />
      <PineG x={8} y={116} s={0.9} />
      <PineG x={92} y={108} s={1} />
      <PineG x={84} y={112} s={0.75} />
      <Path d="M0 136Q30 122 60 130T100 126V200H0Z" fill="#9BDB7C" />
      <Path d="M0 160Q40 150 100 158V200H0Z" fill="#8ED46B" />
      <Path d="M36 200Q44 168 50 160Q56 168 64 200Z" fill="#F3DDB0" />
      <TreeG x={10} y={168} s={1.1} />
      <TreeG x={92} y={172} s={1.2} tone="#6CCB55" />
      <MushroomG x={22} y={182} s={0.9} />
      <MushroomG x={78} y={186} s={0.75} />
      <FlowerG x={30} y={170} />
      <FlowerG x={70} y={166} color="#FF9AC4" />
      <FlowerG x={18} y={192} color="#FF9AC4" />
      <FlowerG x={84} y={195} />
    </Svg>
  );
}

/** Wooden treasure chest with a star lock. */
export function Chest({ size = 64, open = false }: { size?: number; open?: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Ellipse cx={32} cy={58} rx={24} ry={4} fill="#000" opacity={0.15} />
      {open ? (
        <>
          <Path d="M10 24Q32 6 54 24L54 14Q32 -2 10 14Z" fill={WOOD_LIP} />
          <Circle cx={22} cy={26} r={6} fill={GOLD.base} stroke={GOLD.lip} strokeWidth={1.5} />
          <Circle cx={34} cy={23} r={6} fill={GOLD.base} stroke={GOLD.lip} strokeWidth={1.5} />
          <Circle cx={44} cy={27} r={5} fill={GOLD.base} stroke={GOLD.lip} strokeWidth={1.5} />
        </>
      ) : (
        <Path d="M8 30V22Q8 10 32 10Q56 10 56 22V30Z" fill={WOOD} stroke={WOOD_DEEP} strokeWidth={2} />
      )}
      <Rect x={8} y={28} width={48} height={28} rx={4} fill={WOOD} stroke={WOOD_DEEP} strokeWidth={2} />
      <Path d="M8 38H56" stroke={WOOD_LIP} strokeWidth={1.5} />
      {[16, 48].map((x) => (
        <Rect key={x} x={x - 3} y={open ? 28 : 11} width={6} height={open ? 28 : 45} rx={1.5} fill={GOLD.base} stroke={GOLD.lip} strokeWidth={1.2} />
      ))}
      <Rect x={25} y={26} width={14} height={16} rx={4} fill={GOLD.base} stroke={GOLD.lip} strokeWidth={1.5} />
      <Path d="M32 29l1.4 2.8 3.1.4-2.2 2.2.5 3-2.8-1.5-2.8 1.5.5-3-2.2-2.2 3.1-.4z" fill="#FFF3C4" />
    </Svg>
  );
}

/** Two stacks of coins with a big star coin in front. */
export function CoinStack({ size = 96 }: { size?: number }) {
  const stack = (x: number, n: number) =>
    Array.from({ length: n }, (_, i) => (
      <G key={`${x}-${i}`}>
        <Ellipse cx={x} cy={66 - i * 7 + 3} rx={14} ry={5} fill="#E09A00" />
        <Ellipse cx={x} cy={66 - i * 7} rx={14} ry={5} fill="#FFC23D" stroke="#E09A00" strokeWidth={1} />
      </G>
    ));
  return (
    <Svg width={size} height={size} viewBox="0 0 96 96">
      <Ellipse cx={48} cy={84} rx={36} ry={6} fill="#000" opacity={0.15} />
      {stack(28, 6)}
      {stack(52, 4)}
      <Circle cx={66} cy={64} r={20} fill="#E09A00" />
      <Circle cx={66} cy={61} r={20} fill="#FFC23D" />
      <Circle cx={66} cy={61} r={14} fill="none" stroke="#E09A00" strokeWidth={2.5} />
      <Path d="M66 50l3.3 6.6 7.3 1-5.3 5.2 1.3 7.2L66 66.5l-6.6 3.5 1.3-7.2-5.3-5.2 7.3-1z" fill="#FFF3C4" />
    </Svg>
  );
}

/** Gnome's wooden hammer, tilted. */
export function Hammer({ size = 64 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <G transform="rotate(-35 32 32)">
        <Rect x={29} y={22} width={7} height={38} rx={3} fill={WOOD} stroke={WOOD_DEEP} strokeWidth={1.8} />
        <Rect x={14} y={8} width={36} height={17} rx={5} fill="#8C9BB5" stroke="#5C6B85" strokeWidth={2} />
        <Rect x={17} y={10} width={30} height={5} rx={2.5} fill="#fff" opacity={0.35} />
      </G>
    </Svg>
  );
}

/** Clay coin pot (the building fund). */
export function CoinPot({ size = 64 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Ellipse cx={32} cy={58} rx={22} ry={4} fill="#000" opacity={0.15} />
      <Circle cx={24} cy={18} r={7} fill="#FFC23D" stroke="#E09A00" strokeWidth={1.5} />
      <Circle cx={38} cy={15} r={7} fill="#FFC23D" stroke="#E09A00" strokeWidth={1.5} />
      <Circle cx={31} cy={10} r={6} fill="#FFC23D" stroke="#E09A00" strokeWidth={1.5} />
      <Path d="M14 26Q6 42 16 54Q32 62 48 54Q58 42 50 26Z" fill="#E9845A" stroke="#B85A35" strokeWidth={2} />
      <Rect x={12} y={20} width={40} height={9} rx={4.5} fill="#F29C73" stroke="#B85A35" strokeWidth={2} />
      <Path d="M20 40Q32 46 44 40" stroke="#FFD2B8" strokeWidth={2.5} fill="none" strokeLinecap="round" />
    </Svg>
  );
}

/** White curved hint arrow. `flip` mirrors it left↔right. */
export function CurvyArrow({ width = 70, flip = false }: { width?: number; flip?: boolean }) {
  return (
    <View style={flip ? { transform: [{ scaleX: -1 }] } : undefined}>
      <Svg width={width} height={width * 0.7} viewBox="0 0 70 49">
        <Path d="M8 8Q44 6 52 34" stroke="#3B2A1A" strokeWidth={11} fill="none" strokeLinecap="round" opacity={0.35} />
        <Path d="M8 8Q44 6 52 34" stroke="#fff" strokeWidth={8} fill="none" strokeLinecap="round" />
        <Path d="M40 30L53 44L62 26Z" fill="#fff" stroke="#fff" strokeWidth={3} strokeLinejoin="round" />
      </Svg>
    </View>
  );
}
