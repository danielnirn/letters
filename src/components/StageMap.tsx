import { useEffect, useRef, useState, type ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Ellipse, G, Path, Rect } from "react-native-svg";
import { he } from "../i18n/he";
import { GOLD, OK, font } from "../theme/colors";
import type { Category } from "../game/config";
import { Coin, Star } from "./Art";
import { FlowerG, MushroomG, PineG, TreeG } from "./HomeArt";
import { useColors } from "./ui";
import { Building, buildingName } from "./VillageArt";

const VB_W = 100;
const VB_H = 240;
/** Stage 1 at the bottom, winding up to stage 10. */
const STAGE_PTS: [number, number][] = [
  [50, 222],
  [72, 203],
  [72, 181],
  [48, 166],
  [26, 150],
  [30, 128],
  [54, 114],
  [74, 96],
  [62, 72],
  [36, 56],
];
const GOAL: [number, number] = [50, 26];
const PATH_PTS: [number, number][] = [[46, 252], ...STAGE_PTS, GOAL];
/** The river crosses between these two stages (path segment index in PATH_PTS). */
const RIVER_SEGMENT = 8;
const NODE_W = 21;

const WOOD = "#D9A066";
const WOOD_LIP = "#A8723A";
const WOOD_DEEP = "#7E5226";
const GRASS = "#8ED46B";
const SAND = "#F3DDB0";
const SAND_EDGE = "#DDBF8A";
const WATER = "#5CC8F2";
const WATER_EDGE = "#3AA6D6";

type Pt = [number, number];
type Seg = { p0: Pt; c1: Pt; c2: Pt; p3: Pt };

function segments(pts: Pt[]): Seg[] {
  const out: Seg[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i];
    const p3 = pts[i + 1];
    const prev = pts[i - 1] ?? p0;
    const next = pts[i + 2] ?? p3;
    out.push({
      p0,
      c1: [p0[0] + (p3[0] - prev[0]) / 6, p0[1] + (p3[1] - prev[1]) / 6],
      c2: [p3[0] - (next[0] - p0[0]) / 6, p3[1] - (next[1] - p0[1]) / 6],
      p3,
    });
  }
  return out;
}

const SEGS = segments(PATH_PTS);
const TRAIL = SEGS.reduce(
  (d, s) => `${d} C${s.c1[0]} ${s.c1[1]} ${s.c2[0]} ${s.c2[1]} ${s.p3[0]} ${s.p3[1]}`,
  `M${PATH_PTS[0][0]} ${PATH_PTS[0][1]}`,
);

/** Where the path meets the river, and the path's angle there. */
const CROSS = (() => {
  const { p0, c1, c2, p3 } = SEGS[RIVER_SEGMENT];
  const x = (p0[0] + 3 * c1[0] + 3 * c2[0] + p3[0]) / 8;
  const y = (p0[1] + 3 * c1[1] + 3 * c2[1] + p3[1]) / 8;
  const dx = p3[0] + c2[0] - c1[0] - p0[0];
  const dy = p3[1] + c2[1] - c1[1] - p0[1];
  return { x, y, angle: (Math.atan2(dy, dx) * 180) / Math.PI };
})();

const RIVER = (() => {
  let d = "";
  for (let x = -6; x <= 106; x += 4) {
    const y = CROSS.y + 4 * Math.sin((x - CROSS.x) / 15) - (x - CROSS.x) * 0.06;
    d += `${d ? "L" : "M"}${x} ${y.toFixed(2)}`;
  }
  return d;
})();

function MapBackdrop() {
  return (
    <>
      <Rect x={0} y={0} width={VB_W} height={VB_H} fill={GRASS} />
      {[
        [30, 200, 26, 14],
        [74, 150, 22, 16],
        [24, 100, 20, 12],
        [70, 40, 28, 14],
        [50, 26, 30, 13],
      ].map(([x, y, rx, ry]) => (
        <Ellipse key={`${x}-${y}`} cx={x} cy={y} rx={rx} ry={ry} fill="#A3DE80" />
      ))}
      <Path d={TRAIL} stroke={SAND_EDGE} strokeWidth={15} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Path d={TRAIL} stroke={SAND} strokeWidth={12.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Path d={RIVER} stroke="#E9D7A6" strokeWidth={19} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Path d={RIVER} stroke={WATER_EDGE} strokeWidth={14} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Path d={RIVER} stroke={WATER} strokeWidth={11} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Path
        d={RIVER}
        stroke="#fff"
        strokeWidth={0.9}
        fill="none"
        strokeDasharray="5 9"
        opacity={0.7}
        transform="translate(0 -2)"
      />
      {[
        [12, CROSS.y + 2],
        [90, CROSS.y - 5],
      ].map(([x, y]) => (
        <G key={x}>
          <Ellipse cx={x} cy={y} rx={3.6} ry={1.8} fill="#5FBF4A" />
          <Path d={`M${x} ${y}L${x + 3.4} ${y - 0.8}`} stroke={WATER} strokeWidth={0.8} />
        </G>
      ))}
      <G transform={`translate(${CROSS.x} ${CROSS.y}) rotate(${CROSS.angle})`}>
        <Rect x={-12} y={-6.5} width={24} height={13} rx={1.5} fill={WOOD} stroke={WOOD_DEEP} strokeWidth={0.9} />
        {[-8, -4, 0, 4, 8].map((x) => (
          <Path key={x} d={`M${x} -6.5V6.5`} stroke={WOOD_LIP} strokeWidth={0.8} />
        ))}
        <Rect x={-12} y={-7.5} width={24} height={2} rx={1} fill={WOOD_LIP} />
        <Rect x={-12} y={5.5} width={24} height={2} rx={1} fill={WOOD_LIP} />
        {[-12, 12].map((x) => (
          <G key={x}>
            <Rect x={x - 1.3} y={-9} width={2.6} height={4} rx={0.8} fill={WOOD_DEEP} />
            <Rect x={x - 1.3} y={5} width={2.6} height={4} rx={0.8} fill={WOOD_DEEP} />
          </G>
        ))}
      </G>

      {/* Forest edge */}
      <TreeG x={4} y={238} s={1.3} />
      <TreeG x={96} y={232} s={1.1} tone="#6CCB55" />
      <TreeG x={3} y={196} s={0.95} tone="#6CCB55" />
      <TreeG x={97} y={176} s={1.15} />
      <TreeG x={4} y={130} s={0.9} />
      <TreeG x={96} y={112} s={0.9} tone="#6CCB55" />
      <TreeG x={5} y={68} s={0.9} />
      <PineG x={12} y={44} s={0.9} />
      <PineG x={88} y={48} s={1} />
      <PineG x={22} y={22} s={0.8} />
      <PineG x={80} y={18} s={0.85} />
      <PineG x={94} y={62} s={0.7} />

      {/* Gnome house: a big mushroom with a door */}
      <G transform="translate(86 142)">
        <Ellipse cx={0} cy={0} rx={10} ry={2.4} fill="#000" opacity={0.12} />
        <Path d="M-5 0V-10Q0 -12 5 -10V0Z" fill="#FFF6E6" stroke="#E7D3B5" strokeWidth={0.8} />
        <Path d="M-2 0V-5A2 2 0 0 1 2 -5V0Z" fill={WOOD_LIP} />
        <Circle cx={2.6} cy={-7.6} r={1.1} fill="#CDEBFF" stroke="#E7D3B5" strokeWidth={0.5} />
        <Path d="M-11 -9Q-11 -21 0 -22Q11 -21 11 -9Q0 -6.5 -11 -9Z" fill="#FF5C6C" stroke="#D93A4B" strokeWidth={0.9} />
        <Circle cx={-5} cy={-15} r={2} fill="#fff" />
        <Circle cx={2} cy={-18.5} r={1.6} fill="#fff" />
        <Circle cx={6} cy={-13} r={1.8} fill="#fff" />
      </G>

      {/* Hollow log */}
      <G transform="translate(12 106)">
        <Ellipse cx={0} cy={3} rx={11} ry={2} fill="#000" opacity={0.12} />
        <Rect x={-10} y={-5} width={18} height={9} rx={2} fill={WOOD} stroke={WOOD_DEEP} strokeWidth={0.8} />
        <Ellipse cx={8} cy={-0.5} rx={3} ry={4.5} fill="#E8B87C" stroke={WOOD_DEEP} strokeWidth={0.8} />
        <Ellipse cx={8} cy={-0.5} rx={1.6} ry={2.6} fill={WOOD_DEEP} />
        <Path d="M-6 -5V4M0 -5V4" stroke={WOOD_LIP} strokeWidth={0.6} />
      </G>

      {/* Signpost */}
      <G transform="translate(30 234)">
        <Rect x={-0.9} y={-9} width={1.8} height={9} fill={WOOD_DEEP} />
        <Path d="M-6 -11H4L6.5 -9L4 -7H-6Z" fill={WOOD} stroke={WOOD_DEEP} strokeWidth={0.7} />
      </G>

      {[
        [90, 155, "#BCA88E"],
        [10, 178, "#BCA88E"],
        [62, 142, "#C9B79F"],
      ].map(([x, y, f]) => (
        <G key={`${x}`}>
          <Ellipse cx={x as number} cy={(y as number) + 1.4} rx={4} ry={1.4} fill="#000" opacity={0.12} />
          <Path
            d={`M${(x as number) - 4} ${(y as number) + 1}Q${(x as number) - 3.6} ${(y as number) - 3} ${x} ${(y as number) - 3.2}Q${(x as number) + 4} ${(y as number) - 2.6} ${(x as number) + 4} ${(y as number) + 1}Z`}
            fill={f as string}
          />
        </G>
      ))}

      <MushroomG x={18} y={212} s={0.9} />
      <MushroomG x={32} y={194} s={0.7} />
      <MushroomG x={88} y={192} s={0.75} />
      <MushroomG x={60} y={130} s={0.65} />
      <MushroomG x={16} y={80} s={0.7} />
      <MushroomG x={84} y={78} s={0.6} />
      <MushroomG x={22} y={40} s={0.6} />

      {[
        [40, 206, "#FFE07A"],
        [84, 214, "#FF9AC4"],
        [14, 160, "#FF9AC4"],
        [60, 186, "#FFE07A"],
        [40, 136, "#FFE07A"],
        [76, 126, "#FF9AC4"],
        [36, 98, "#FF9AC4"],
        [86, 104, "#FFE07A"],
        [80, 64, "#FF9AC4"],
        [18, 56, "#FFE07A"],
        [66, 40, "#FFE07A"],
        [34, 14, "#FF9AC4"],
      ].map(([x, y, col]) => (
        <FlowerG key={`${x}-${y}`} x={x as number} y={y as number} color={col as string} />
      ))}
    </>
  );
}

type NodeLook = { base: string; lip: string; num: string };

/** Tree stump with a round colored button on top. */
function Stump({ width, look, pressed }: { width: number; look: NodeLook; pressed: boolean }) {
  const dy = pressed ? 3 : 0;
  return (
    <Svg width={width} height={(width * 70) / 80} viewBox="0 0 80 70">
      <Ellipse cx={40} cy={60} rx={36} ry={8} fill="#000" opacity={0.16} />
      <Path d="M6 34V48A34 12 0 0 0 74 48V34Z" fill={WOOD} stroke={WOOD_DEEP} strokeWidth={2} />
      <Path d="M18 44V56M30 46V59M50 46V59M62 44V56" stroke={WOOD_LIP} strokeWidth={2} strokeLinecap="round" />
      <Ellipse cx={40} cy={34} rx={34} ry={12} fill="#E8B87C" stroke={WOOD_DEEP} strokeWidth={2} />
      <G transform={`translate(0 ${dy})`}>
        <Path d={`M13 28V${pressed ? 30 : 34}A27 10 0 0 0 67 ${pressed ? 30 : 34}V28Z`} fill={look.lip} />
        <Ellipse cx={40} cy={28} rx={27} ry={10} fill={look.base} />
        <Ellipse cx={33} cy={24.5} rx={13} ry={3.6} fill="#fff" opacity={0.3} />
      </G>
    </Svg>
  );
}

function Pin({ size }: { size: number }) {
  return (
    <Svg width={size} height={size * 1.3} viewBox="0 0 40 52">
      <Ellipse cx={20} cy={49} rx={7} ry={2.5} fill="#000" opacity={0.2} />
      <Path d="M20 48C12 36 4 28 4 18A16 16 0 0 1 36 18C36 28 28 36 20 48Z" fill="#D93A4B" />
      <Path d="M20 45C12 34 5 27 5 17A15 15 0 0 1 35 17C35 27 28 34 20 45Z" fill="#FF5C6C" />
      <Circle cx={20} cy={17} r={7} fill="#fff" />
      <Circle cx={20} cy={17} r={3.4} fill="#FFC23D" />
      <Ellipse cx={13} cy={10} rx={4} ry={2.4} fill="#fff" opacity={0.35} />
    </Svg>
  );
}

function useBounce(on: boolean) {
  const [y, setY] = useState(0);
  useEffect(() => {
    if (!on) return;
    let frame = 0;
    const started = performance.now();
    const tick = (now: number) => {
      setY(-Math.abs(Math.sin((now - started) / 380)) * 7);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [on]);
  return y;
}

export type StageNodeState = { stars: number; state: "done" | "current" | "locked"; cost: number };

export function StageMap({
  category,
  goalLevel,
  stages,
  onPressStage,
  header,
  hint,
}: {
  category: Category;
  goalLevel: number;
  stages: StageNodeState[];
  onPressStage: (stage: number) => void;
  header: ReactNode;
  hint?: ReactNode;
}) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { width: winW } = useWindowDimensions();
  const mapW = Math.min(winW, 520);
  const k = mapW / VB_W;
  const mapH = VB_H * k;
  const nodeW = NODE_W * k;
  const nodeH = (nodeW * 70) / 80;
  const scroller = useRef<ScrollView>(null);
  const scrolled = useRef(false);
  const currentIdx = stages.findIndex((s) => s.state === "current");
  const bounce = useBounce(currentIdx >= 0);
  const goalSize = 34 * k;
  const topPad = insets.top + 64;

  const look = (s: StageNodeState): NodeLook =>
    s.state === "current"
      ? { base: OK.base, lip: OK.lip, num: OK.deep }
      : s.state === "done"
        ? { base: c.primary, lip: c.primaryLip, num: c.primaryLip }
        : { base: "#C9D2DE", lip: "#9AA6B8", num: "#7D899C" };

  return (
    <View style={[styles.fill, { backgroundColor: GRASS }]}>
      <ScrollView
        ref={scroller}
        style={styles.fill}
        contentContainerStyle={{ alignItems: "center" }}
        showsVerticalScrollIndicator={false}
        onLayout={(e) => {
          if (scrolled.current) return;
          scrolled.current = true;
          const focus = topPad + STAGE_PTS[Math.max(0, currentIdx)][1] * k;
          const y = Math.max(0, Math.min(topPad + mapH - e.nativeEvent.layout.height, focus - e.nativeEvent.layout.height * 0.55));
          requestAnimationFrame(() => scroller.current?.scrollTo({ y, animated: false }));
        }}
      >
        <View style={{ width: mapW, height: topPad, backgroundColor: GRASS }} />
        <View style={{ width: mapW, height: mapH }}>
          <Svg width={mapW} height={mapH} viewBox={`0 0 ${VB_W} ${VB_H}`} style={StyleSheet.absoluteFill}>
            <MapBackdrop />
          </Svg>

          <View
            pointerEvents="none"
            style={[styles.goal, { left: GOAL[0] * k - goalSize / 2, top: GOAL[1] * k - goalSize * 0.62, width: goalSize }]}
          >
            <Building category={category} level={goalLevel} size={goalSize} />
            <View style={styles.goalSign}>
              <Text style={styles.goalSignText} numberOfLines={1}>
                {buildingName(category)}
              </Text>
            </View>
          </View>

          {stages.map((s, i) => {
            const [x, y] = STAGE_PTS[i];
            const stage = i + 1;
            const l = look(s);
            const left = x * k - nodeW / 2;
            const top = y * k - nodeH * 0.5;
            const starSize = nodeW * 0.3;
            return (
              <View key={stage} style={{ position: "absolute", left, top, width: nodeW, height: nodeH }}>
                {s.state !== "locked" ? (
                  <View pointerEvents="none" style={[styles.stars, { top: -starSize * 0.55, width: nodeW }]}>
                    {[0, 1, 2].map((n) => (
                      <View key={n} style={{ marginTop: n === 1 ? -starSize * 0.35 : 0 }}>
                        {n < s.stars ? (
                          <Star size={starSize} />
                        ) : (
                          <Star size={starSize} fill="#D5DCE6" stroke="#9AA6B8" />
                        )}
                      </View>
                    ))}
                  </View>
                ) : null}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    s.state === "locked" ? `${he.stageLabel(stage)} · ${he.stageLocked}` : he.stageLabel(stage)
                  }
                  onPress={() => onPressStage(stage)}
                >
                  {({ pressed }) => (
                    <View>
                      <Stump width={nodeW} look={l} pressed={pressed} />
                      <View pointerEvents="none" style={[styles.numWrap, { top: nodeH * (pressed ? 0.24 : 0.2) }]}>
                        <Text
                          style={[
                            styles.num,
                            { fontSize: nodeW * 0.34, lineHeight: nodeW * 0.4, textShadowColor: l.lip },
                          ]}
                        >
                          {stage}
                        </Text>
                      </View>
                    </View>
                  )}
                </Pressable>
                {s.state === "current" ? (
                  <>
                    <View
                      pointerEvents="none"
                      style={[
                        styles.pin,
                        {
                          left: nodeW / 2 - nodeW * 0.24,
                          top: -starSize * 0.9 - nodeW * 0.62,
                          transform: [{ translateY: bounce }],
                        },
                      ]}
                    >
                      <Pin size={nodeW * 0.48} />
                    </View>
                    {s.cost > 0 ? (
                      <View pointerEvents="none" style={[styles.cost, { top: nodeH - 4, backgroundColor: GOLD.tint }]}>
                        <Coin size={14} />
                        <Text style={[styles.costText, { color: GOLD.deep }]}>{`−${s.cost}`}</Text>
                      </View>
                    ) : null}
                  </>
                ) : null}
              </View>
            );
          })}
        </View>
      </ScrollView>

      <View pointerEvents="box-none" style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View pointerEvents="box-none" style={styles.headerInner}>
          {header}
          {hint}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  header: { position: "absolute", top: 0, left: 0, right: 0, paddingHorizontal: 14 },
  headerInner: { width: "100%", maxWidth: 520, alignSelf: "center" },
  goal: { position: "absolute", alignItems: "center" },
  goalSign: {
    marginTop: -6,
    backgroundColor: WOOD,
    borderBottomWidth: 4,
    borderBottomColor: WOOD_LIP,
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  goalSignText: { fontFamily: font.heavy, fontSize: 15, color: "#fff" },
  stars: { position: "absolute", left: 0, flexDirection: "row", justifyContent: "center", alignItems: "flex-start" },
  numWrap: { position: "absolute", left: 0, right: 0, alignItems: "center" },
  num: {
    color: "#fff",
    fontFamily: font.black,
    textAlign: "center",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 0,
  },
  pin: { position: "absolute" },
  cost: {
    position: "absolute",
    alignSelf: "center",
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 3,
    borderRadius: 999,
    paddingVertical: 2,
    paddingLeft: 7,
    paddingRight: 3,
  },
  costText: { fontFamily: font.black, fontSize: 13 },
});
