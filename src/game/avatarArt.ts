import type { AvatarLoadout, AvatarSlot, Gender } from "../types/models";

/**
 * Dress-up art as plain shape data (rendered by `src/components/AvatarArt.tsx`).
 * Every character shares one body frame in a 160×230 box so clothes fit all of them:
 * head center (80,78) r38 · torso 54..106 × 112..166 · legs 61..99 × 156..202 · feet y≈205.
 */
export type Paint = { s?: string; sw?: number; o?: number };
export type Shape =
  | ({ k: "c"; cx: number; cy: number; r: number; f: string } & Paint)
  | ({ k: "e"; cx: number; cy: number; rx: number; ry: number; f: string } & Paint)
  | ({ k: "r"; x: number; y: number; wd: number; ht: number; rx: number; f: string } & Paint)
  | ({ k: "p"; d: string; f: string } & Paint);

const c = (cx: number, cy: number, r: number, f: string, x: Paint = {}): Shape => ({ k: "c", cx, cy, r, f, ...x });
const e = (cx: number, cy: number, rx: number, ry: number, f: string, x: Paint = {}): Shape => ({
  k: "e", cx, cy, rx, ry, f, ...x,
});
const r = (x: number, y: number, wd: number, ht: number, rx: number, f: string, p: Paint = {}): Shape => ({
  k: "r", x, y, wd, ht, rx, f, ...p,
});
const p = (d: string, f: string, x: Paint = {}): Shape => ({ k: "p", d, f, ...x });
const line = (d: string, color: string, sw: number): Shape => p(d, "none", { s: color, sw });

function star(cx: number, cy: number, R: number, f: string, x: Paint = {}): Shape {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rad = i % 2 === 0 ? R : R * 0.45;
    pts.push(`${(cx + rad * Math.cos(a)).toFixed(1)} ${(cy + rad * Math.sin(a)).toFixed(1)}`);
  }
  return p(`M${pts.join(" L")} Z`, f, x);
}

function flower(cx: number, cy: number, petal: string): Shape[] {
  const out: Shape[] = [];
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    out.push(c(cx + 4.6 * Math.cos(a), cy + 4.6 * Math.sin(a), 4.2, petal));
  }
  out.push(c(cx, cy, 3, "#FFC23D"));
  return out;
}

const INK = "#1F2A44";

// ---- Gnome: drawn in the mascot's 120×140 space, mapped onto the shared frame ----
const K = 38 / 30;
const tx = (x: number) => +(80 + (x - 60) * K).toFixed(1);
const ty = (y: number) => +(78 + (y - 92) * K).toFixed(1);
function tPath(d: string) {
  let i = 0;
  return d.replace(/-?\d+(\.\d+)?/g, (n) => String(i++ % 2 === 0 ? tx(+n) : ty(+n)));
}
function g(s: Shape): Shape {
  if (s.k === "c") return { ...s, cx: tx(s.cx), cy: ty(s.cy), r: s.r * K, sw: s.sw && s.sw * K };
  if (s.k === "e") return { ...s, cx: tx(s.cx), cy: ty(s.cy), rx: s.rx * K, ry: s.ry * K, sw: s.sw && s.sw * K };
  if (s.k === "r") return { ...s, x: tx(s.x), y: ty(s.y), wd: s.wd * K, ht: s.ht * K, rx: s.rx * K };
  return { ...s, d: tPath(s.d), sw: s.sw && s.sw * K };
}

function face(cheek = "#FF9AA2"): Shape[] {
  return [
    c(67, 80, 5, INK),
    c(93, 80, 5, INK),
    c(68.8, 78.2, 1.7, "#fff"),
    c(94.8, 78.2, 1.7, "#fff"),
    e(57, 93, 6, 4, cheek),
    e(103, 93, 6, 4, cheek),
  ];
}
const smile = (y = 96) => line(`M71 ${y} Q80 ${y + 8} 89 ${y}`, INK, 3.5);

type Body = { torso: string; belly?: string; arm: string; hand: string; leg: string; foot: string };
type Character = { back: Shape[]; head: Shape[]; body: Body };

function gnome(gender: Gender, hatOn: boolean): Character {
  const boy = gender === "boy";
  const hair = boy ? "#8A4A1F" : "#C86B2E";
  const head: Shape[] = [];
  if (boy) head.push(c(31, 94, 6.5, "#F4C49E"), c(89, 94, 6.5, "#F4C49E"));
  else head.push(c(27, 100, 9, hair), c(93, 100, 9, hair), c(24, 112, 4, "#FF5C6C"), c(96, 112, 4, "#FF5C6C"));
  head.push(c(60, 92, 30, "#FFD9B8"));
  if (hatOn) {
    head.push(
      boy
        ? p("M31 86 Q30 60 60 60 Q90 60 89 86 Q84 74 70 76 Q62 70 52 76 Q40 72 31 86Z", hair)
        : p("M30 88 Q28 58 60 58 Q92 58 90 88 Q86 72 60 70 Q34 72 30 88Z", hair),
    );
  } else {
    head.push(
      boy
        ? p("M31 84 Q36 70 50 72 Q46 78 52 80 Q58 72 66 78 Q70 72 78 76 Q86 74 89 84 Q88 68 60 66 Q32 68 31 84Z", hair)
        : p("M30 82 Q60 64 90 82 Q88 70 60 66 Q32 70 30 82Z", hair),
      p("M24 66 C34 42 50 18 80 6 C72 24 76 44 96 66 Z", boy ? "#2FBF71" : "#FF5C6C"),
      r(20, 60, 80, 13, 6.5, boy ? "#1E9457" : "#E04455"),
      c(80, 7, 7, "#FFC23D"),
    );
  }
  head.push(
    c(49, 92, 4.2, INK),
    c(71, 92, 4.2, INK),
    c(50.6, 90.4, 1.4, "#fff"),
    c(72.6, 90.4, 1.4, "#fff"),
    e(42, 102, 5, 3.4, boy ? "#FFB59A" : "#FF9AA2"),
    e(78, 102, 5, 3.4, boy ? "#FFB59A" : "#FF9AA2"),
    boy ? p("M50 103 Q60 113 70 103 Z", INK) : line("M52 104 Q60 111 68 104", INK, 3),
  );
  return {
    back: [],
    head: head.map(g),
    body: { torso: "#2F6FEB", arm: "#2F6FEB", hand: "#FFD9B8", leg: "#4C5A7A", foot: "#8A4A1F" },
  };
}

const CHARACTERS: Record<string, (gender: Gender, hatOn: boolean) => Character> = {
  avatar_base_kid: gnome,
  avatar_base_bunny: () => ({
    back: [e(63, 30, 10, 28, "#FFE1EC"), e(97, 30, 10, 28, "#FFE1EC"), e(63, 33, 5, 19, "#FF9AB8"), e(97, 33, 5, 19, "#FF9AB8")],
    head: [
      c(80, 78, 38, "#FFE1EC"),
      ...face("#FF9AB8"),
      e(80, 96, 13, 9, "#FFFFFF"),
      e(80, 90, 4.5, 3.4, "#FF5C8A"),
      line("M74 98 Q80 103 86 98", INK, 3),
      r(76.5, 100, 7, 6, 2, "#FFFFFF", { s: "#F5CDE4", sw: 1 }),
    ],
    body: { torso: "#FFE1EC", belly: "#FFFFFF", arm: "#FFE1EC", hand: "#FFE1EC", leg: "#FFE1EC", foot: "#FFC7DA" },
  }),
  avatar_base_cat: () => ({
    back: [
      p("M46 62 L50 26 L76 44 Z", "#FFB347"),
      p("M114 62 L110 26 L84 44 Z", "#FFB347"),
      p("M52 52 L54 34 L68 44 Z", "#FF9AB8"),
      p("M108 52 L106 34 L92 44 Z", "#FF9AB8"),
      line("M104 160 Q138 154 130 122", "#FFB347", 9),
    ],
    head: [
      c(80, 78, 38, "#FFB347"),
      line("M80 42 L80 52", "#E8892B", 4),
      line("M69 45 L71 53", "#E8892B", 4),
      line("M91 45 L89 53", "#E8892B", 4),
      ...face(),
      e(80, 97, 12, 8, "#FFE7C7"),
      p("M75.5 90 L84.5 90 L80 95.5 Z", "#FF5C8A"),
      line("M75 99 Q80 103 85 99", INK, 2.8),
      line("M56 93 L41 90", INK, 1.6),
      line("M56 98 L41 100", INK, 1.6),
      line("M104 93 L119 90", INK, 1.6),
      line("M104 98 L119 100", INK, 1.6),
    ],
    body: { torso: "#FFB347", belly: "#FFE7C7", arm: "#FFB347", hand: "#FFB347", leg: "#FFB347", foot: "#E8892B" },
  }),
  avatar_base_bear: () => ({
    back: [c(50, 48, 13, "#B97A4B"), c(110, 48, 13, "#B97A4B"), c(50, 48, 7, "#E8C39E"), c(110, 48, 7, "#E8C39E")],
    head: [
      c(80, 78, 38, "#B97A4B"),
      ...face("#E59A7A"),
      e(80, 97, 15, 11, "#E8C39E"),
      e(80, 91, 6, 4.5, INK),
      line("M74 100 Q80 104 86 100", INK, 2.8),
    ],
    body: { torso: "#B97A4B", belly: "#E8C39E", arm: "#B97A4B", hand: "#B97A4B", leg: "#B97A4B", foot: "#8A5530" },
  }),
  avatar_base_star: () => ({
    back: [
      line("M66 46 Q60 28 52 20", "#5BBF3A", 3.5),
      line("M94 46 Q100 28 108 20", "#5BBF3A", 3.5),
      star(51, 17, 8, "#FFC23D"),
      star(109, 17, 8, "#FFC23D"),
    ],
    head: [
      c(80, 78, 38, "#8FE36B"),
      e(66, 80, 9, 11, "#FFFFFF"),
      e(94, 80, 9, 11, "#FFFFFF"),
      c(67, 82, 5.5, INK),
      c(95, 82, 5.5, INK),
      c(69, 79.5, 1.8, "#fff"),
      c(97, 79.5, 1.8, "#fff"),
      e(55, 97, 5, 3.4, "#5BBF3A"),
      e(105, 97, 5, 3.4, "#5BBF3A"),
      smile(98),
    ],
    body: { torso: "#8FE36B", belly: "#C9F5B0", arm: "#8FE36B", hand: "#8FE36B", leg: "#8FE36B", foot: "#5BBF3A" },
  }),
  avatar_base_robot: () => ({
    back: [line("M80 42 L80 22", "#8C9BB5", 4), c(80, 18, 6, "#FF5C6C"), r(34, 66, 12, 24, 4, "#8C9BB5"), r(114, 66, 12, 24, 4, "#8C9BB5")],
    head: [
      r(44, 42, 72, 72, 22, "#C9D3E3"),
      r(52, 56, 56, 44, 14, INK),
      c(68, 76, 6, "#4FE3F5"),
      c(92, 76, 6, "#4FE3F5"),
      line("M71 90 Q80 96 89 90", "#4FE3F5", 3),
    ],
    body: { torso: "#C9D3E3", belly: "#8C9BB5", arm: "#8C9BB5", hand: "#8C9BB5", leg: "#8C9BB5", foot: "#5B6785" },
  }),
  avatar_base_unicorn: () => ({
    back: [
      c(108, 54, 12, "#FF7A59"),
      c(116, 72, 11, "#FFB020"),
      c(117, 91, 10, "#2FBF71"),
      c(112, 108, 9, "#1FB5CC"),
      p("M58 50 L54 28 L72 42 Z", "#EDE4FF"),
      p("M102 50 L106 28 L88 42 Z", "#EDE4FF"),
    ],
    head: [
      c(80, 78, 38, "#EDE4FF"),
      p("M73 46 L80 6 L87 46 Z", "#FFC23D"),
      line("M76 34 L84 31", "#E09A00", 2),
      line("M75 24 L85 21", "#E09A00", 2),
      c(66, 46, 10, "#8B6CF6"),
      c(80, 43, 8, "#FF5C8A"),
      ...face("#FF9AD5"),
      e(80, 99, 16, 11, "#FFD6EC"),
      c(74, 99, 2.2, "#C9379A"),
      c(86, 99, 2.2, "#C9379A"),
    ],
    body: { torso: "#EDE4FF", belly: "#FFFFFF", arm: "#EDE4FF", hand: "#EDE4FF", leg: "#EDE4FF", foot: "#B9A4FF" },
  }),
};

type ItemArt = { back?: Shape[]; front: Shape[]; thumb?: string };

const sleeves = (color: string, long: boolean): Shape[] =>
  long
    ? [line("M58 120 Q44 128 42 150", color, 17), line("M102 120 Q116 128 118 150", color, 17)]
    : [line("M58 120 Q50 124 47 134", color, 17), line("M102 120 Q110 124 113 134", color, 17)];

const ITEM_ART: Record<string, ItemArt> = {
  // hats
  avatar_hat_cap: {
    front: [
      p("M44 62 Q44 26 80 24 Q116 26 116 62 Z", "#2F6FEB"),
      line("M80 27 L80 60", "#5C8DF0", 3),
      p("M80 58 Q118 52 138 62 Q118 70 80 66 Z", "#1F4FB8"),
      c(80, 25, 4.5, "#1F4FB8"),
    ],
  },
  avatar_hat_crown: {
    front: [
      p("M50 56 L52 20 L66 36 L80 14 L94 36 L108 20 L110 56 Z", "#FFC23D", { s: "#E09A00", sw: 3 }),
      c(80, 50, 4.5, "#FF5C6C"),
      c(64, 50, 3.4, "#1FB5CC"),
      c(96, 50, 3.4, "#2FBF71"),
      c(52, 20, 3.2, "#FFF3C4"),
      c(80, 14, 3.6, "#FFF3C4"),
      c(108, 20, 3.2, "#FFF3C4"),
    ],
  },
  avatar_hat_party: {
    front: [
      e(80, 51, 25, 5, "#1E9457"),
      p("M58 50 L80 2 L102 50 Z", "#2FBF71"),
      p("M71.2 20 L88.8 20 L91.4 26 L68.6 26 Z", "#FFC23D"),
      p("M64.2 36 L95.8 36 L98.5 42 L61.5 42 Z", "#FF5C6C"),
      c(80, 3, 6.5, "#FFC23D"),
    ],
  },
  avatar_hat_wizard: {
    front: [
      e(80, 55, 46, 9, "#4B2FB0"),
      p("M54 55 Q66 34 72 2 Q90 18 106 55 Z", "#6A4BD8"),
      p("M56 47 Q80 53 104 47 L106 55 Q80 61 54 55 Z", "#FFC23D"),
      star(77, 28, 6, "#FFC23D"),
      star(92, 40, 4, "#FFF3C4"),
      c(68, 42, 2, "#FFF3C4"),
    ],
  },
  avatar_hat_flowers: {
    front: [
      line("M44 64 Q80 30 116 64", "#2FBF71", 4),
      ...flower(51.2, 57.9, "#FF8FB8"),
      ...flower(65.6, 49.7, "#FFFFFF"),
      ...flower(80, 47, "#B9A4FF"),
      ...flower(94.4, 49.7, "#FFFFFF"),
      ...flower(108.8, 57.9, "#FF8FB8"),
    ],
  },
  // tops
  avatar_top_shirt: {
    front: [...sleeves("#FF5C6C", false), r(52, 110, 56, 54, 18, "#FF5C6C"), line("M70 112 L80 122 L90 112", "#fff", 3.5)],
  },
  avatar_top_stripes: {
    front: [
      ...sleeves("#FFF8EC", false),
      r(52, 110, 56, 54, 18, "#FFF8EC"),
      r(53, 121, 54, 7, 0, "#2F6FEB"),
      r(52, 135, 56, 7, 0, "#2F6FEB"),
      r(56, 149, 48, 7, 0, "#2F6FEB"),
    ],
  },
  avatar_top_hoodie: {
    front: [
      e(80, 111, 30, 10, "#6A4BD8"),
      ...sleeves("#8B6CF6", true),
      r(52, 110, 56, 56, 18, "#8B6CF6"),
      r(64, 142, 32, 16, 8, "#6A4BD8"),
      line("M74 114 L73 130", "#fff", 2.5),
      line("M86 114 L87 130", "#fff", 2.5),
    ],
  },
  avatar_top_heart: {
    front: [
      ...sleeves("#FF8FB8", true),
      r(52, 110, 56, 56, 18, "#FF8FB8"),
      p("M80 152 C62 140 64 124 75 127 C78 128 80 131 80 134 C80 131 82 128 85 127 C96 124 98 140 80 152 Z", "#fff"),
      r(60, 158, 40, 6, 3, "#FF6FA3"),
    ],
  },
  // bottoms
  avatar_bottom_shorts: {
    front: [r(58, 152, 44, 14, 6, "#4C86F5"), r(59, 158, 20, 20, 6, "#4C86F5"), r(81, 158, 20, 20, 6, "#4C86F5"), line("M80 160 L80 168", "#2F6FEB", 2)],
  },
  avatar_bottom_jeans: {
    front: [
      r(58, 152, 44, 14, 6, "#3D5A99"),
      r(59, 156, 20, 46, 7, "#3D5A99"),
      r(81, 156, 20, 46, 7, "#3D5A99"),
      r(59, 194, 20, 7, 3, "#5872B0"),
      r(81, 194, 20, 7, 3, "#5872B0"),
    ],
  },
  avatar_bottom_skirt: {
    front: [
      p("M58 150 L102 150 L116 184 Q80 194 44 184 Z", "#FF9AD5"),
      r(57, 147, 46, 8, 4, "#FF6FB8"),
      c(66, 168, 2.6, "#fff"),
      c(88, 166, 2.6, "#fff"),
      c(78, 180, 2.6, "#fff"),
      c(100, 178, 2.6, "#fff"),
      c(56, 180, 2.6, "#fff"),
    ],
  },
  // shoes
  avatar_shoes_sneakers: {
    front: [
      e(68, 203, 15, 9.5, "#FF5C6C"),
      e(92, 203, 15, 9.5, "#FF5C6C"),
      r(53, 206, 30, 6, 3, "#fff"),
      r(77, 206, 30, 6, 3, "#fff"),
      line("M64 198 L71 198", "#fff", 2),
      line("M88 198 L95 198", "#fff", 2),
    ],
  },
  avatar_shoes_boots: {
    front: [
      r(59, 182, 20, 24, 7, "#8A4A1F"),
      r(81, 182, 20, 24, 7, "#8A4A1F"),
      e(68, 205, 14, 8, "#8A4A1F"),
      e(92, 205, 14, 8, "#8A4A1F"),
      r(57, 180, 24, 7, 3.5, "#B86A32"),
      r(79, 180, 24, 7, 3.5, "#B86A32"),
    ],
  },
  avatar_shoes_rain: {
    front: [
      r(59, 182, 20, 24, 7, "#FFC23D"),
      r(81, 182, 20, 24, 7, "#FFC23D"),
      e(68, 205, 14, 8, "#FFC23D"),
      e(92, 205, 14, 8, "#FFC23D"),
      r(57, 180, 24, 7, 3.5, "#E09A00"),
      r(79, 180, 24, 7, 3.5, "#E09A00"),
      r(54, 208, 28, 4, 2, "#E09A00"),
      r(78, 208, 28, 4, 2, "#E09A00"),
    ],
  },
  // extras
  avatar_extra_cape: {
    back: [p("M58 112 L102 112 L124 200 Q80 212 36 200 Z", "#FF5C6C"), p("M62 116 L98 116 L112 190 Q80 198 48 190 Z", "#E04455")],
    front: [c(64, 116, 4.5, "#FFC23D"), c(96, 116, 4.5, "#FFC23D")],
    thumb: "20 100 120 116",
  },
  avatar_extra_wings: {
    back: [
      p("M62 124 Q28 84 18 112 Q16 140 62 134 Z", "#BCE6FF", { s: "#7CC6F0", sw: 2.5 }),
      p("M62 136 Q30 146 34 166 Q46 174 64 144 Z", "#BCE6FF", { s: "#7CC6F0", sw: 2.5 }),
      p("M98 124 Q132 84 142 112 Q144 140 98 134 Z", "#BCE6FF", { s: "#7CC6F0", sw: 2.5 }),
      p("M98 136 Q130 146 126 166 Q114 174 96 144 Z", "#BCE6FF", { s: "#7CC6F0", sw: 2.5 }),
    ],
    front: [],
    thumb: "10 84 140 96",
  },
  avatar_extra_balloon: {
    front: [
      line("M118 152 Q126 110 136 72", "#8C9BB5", 1.6),
      e(138, 50, 17, 21, "#FF5C8A"),
      p("M134 72 L142 72 L138 66 Z", "#E0446F"),
      e(132, 42, 4, 7, "#fff", { o: 0.55 }),
    ],
    thumb: "96 24 64 132",
  },
  avatar_extra_wand: {
    front: [
      line("M116 160 L134 118", INK, 4.5),
      star(136, 112, 13, "#FFC23D", { s: "#E09A00", sw: 2 }),
      c(151, 99, 2.5, "#FFC23D"),
      c(123, 97, 2, "#FFC23D"),
      c(152, 124, 2, "#E09A00"),
    ],
    thumb: "104 88 56 80",
  },
  avatar_extra_pet: {
    front: [
      line("M154 205 Q160 196 156 188", "#D9A877", 4),
      e(140, 208, 17, 11, "#E8C39E"),
      c(147, 207, 5, "#D9A877"),
      c(136, 188, 13, "#E8C39E"),
      e(125, 187, 5, 10, "#B97A4B"),
      e(147, 187, 5, 10, "#B97A4B"),
      c(132, 187, 2.2, INK),
      c(140, 187, 2.2, INK),
      e(136, 193, 3, 2.2, INK),
    ],
    thumb: "112 168 50 54",
  },
};

const SLOT_THUMB: Record<AvatarSlot, string> = {
  base: "0 -38 160 160",
  hat: "30 -2 100 72",
  top: "26 102 108 70",
  bottom: "36 144 88 54",
  shoes: "46 176 68 40",
  extra: "0 0 160 230",
};

export const FULL_VIEWBOX = "0 -40 160 270";
export const HEAD_VIEWBOX = "0 -38 160 160";

function characterFor(base: string, gender: Gender, hatOn: boolean) {
  return (CHARACTERS[base] ?? gnome)(gender, hatOn);
}

function bodyShapes(b: Body): Shape[] {
  return [
    line("M58 120 Q44 128 42 150", b.arm, 14),
    line("M102 120 Q116 128 118 150", b.arm, 14),
    r(61, 156, 16, 46, 8, b.leg),
    r(83, 156, 16, 46, 8, b.leg),
    e(69, 205, 13, 8, b.foot),
    e(91, 205, 13, 8, b.foot),
    r(54, 112, 52, 54, 18, b.torso),
    ...(b.belly ? [e(80, 142, 16, 18, b.belly)] : []),
  ];
}

const art = (id: string | null) => (id ? ITEM_ART[id] : undefined);

/** All shapes for a dressed character, back to front. */
export function composeAvatar(loadout: AvatarLoadout, gender: Gender): Shape[] {
  const ch = characterFor(loadout.base, gender, Boolean(art(loadout.hat)));
  const hands = [c(42, 155, 8.5, ch.body.hand), c(118, 155, 8.5, ch.body.hand)];
  return [
    e(80, 219, 46, 7, "rgba(31,42,68,0.12)"),
    ...(art(loadout.extra)?.back ?? []),
    ...ch.back,
    ...bodyShapes(ch.body),
    ...(art(loadout.bottom)?.front ?? []),
    ...(art(loadout.shoes)?.front ?? []),
    ...(art(loadout.top)?.front ?? []),
    ...hands,
    ...ch.head,
    ...(art(loadout.hat)?.front ?? []),
    ...(art(loadout.extra)?.front ?? []),
  ];
}

/** Shapes + framing for a shop card thumbnail of one item. */
export function itemThumb(id: string, slot: AvatarSlot, gender: Gender): { shapes: Shape[]; viewBox: string } {
  if (slot === "base") {
    const ch = characterFor(id, gender, false);
    return {
      shapes: [...ch.back, ...bodyShapes(ch.body), c(42, 155, 8.5, ch.body.hand), c(118, 155, 8.5, ch.body.hand), ...ch.head],
      viewBox: SLOT_THUMB.base,
    };
  }
  const a = ITEM_ART[id];
  return { shapes: a ? [...(a.back ?? []), ...a.front] : [], viewBox: a?.thumb ?? SLOT_THUMB[slot] };
}
