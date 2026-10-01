import type { Category, Difficulty, ThemeId } from "../game/config";

export type ThemeColors = {
  ground: string;
  surface: string;
  ink: string;
  soft: string;
  line: string;
  primary: string;
  primaryLip: string;
  primaryTint: string;
  heroBlob: string;
  toast: string;
};

export const defaultTheme: ThemeColors = {
  ground: "#EAF5FF",
  surface: "#FFFFFF",
  ink: "#1F2A44",
  soft: "#5B6785",
  line: "#CFE0F2",
  primary: "#2F6FEB",
  primaryLip: "#1F4FB8",
  primaryTint: "#DCE7FF",
  heroBlob: "#4C86F5",
  toast: "#1F2A44",
};

const themes: Record<ThemeId, ThemeColors> = {
  theme_space: {
    ...defaultTheme,
    ground: "#E6E4FF",
    line: "#D2CDF5",
    primary: "#5B4BD6",
    primaryLip: "#3E2FAE",
    primaryTint: "#E3DEFF",
    heroBlob: "#7364E6",
    toast: "#221B4A",
  },
  theme_jungle: {
    ...defaultTheme,
    ground: "#E3F6E6",
    line: "#C5E6CB",
    primary: "#1E9457",
    primaryLip: "#13703F",
    primaryTint: "#D5F5E5",
    heroBlob: "#33AD6C",
    toast: "#123A24",
  },
  theme_unicorn: {
    ...defaultTheme,
    ground: "#FFE9F6",
    line: "#F5CDE4",
    primary: "#C9379A",
    primaryLip: "#9C2276",
    primaryTint: "#FFDDF1",
    heroBlob: "#DB55AF",
    toast: "#4A1739",
  },
};

export function colorsFor(themeId: string | null): ThemeColors {
  if (themeId && themeId in themes) return themes[themeId as ThemeId];
  return defaultTheme;
}

/** Fixed game palette (not themed): base fill, darker lip, light tint, dark text on tint. */
export type Swatch = { base: string; lip: string; tint: string; deep: string };

export const CATEGORY_COLORS: Record<Category, Swatch> = {
  language: { base: "#FF7A59", lip: "#E0552F", tint: "#FFE3DA", deep: "#B23A17" },
  math: { base: "#FFB020", lip: "#D98A00", tint: "#FFF0C7", deep: "#9A6200" },
  english: { base: "#2FBF71", lip: "#1E9457", tint: "#D5F5E5", deep: "#146B3E" },
  logic: { base: "#8B6CF6", lip: "#6A4BD8", tint: "#E6DFFF", deep: "#4B2FB0" },
  science: { base: "#1FB5CC", lip: "#138A9C", tint: "#D2F3F8", deep: "#0C6574" },
  reading: { base: "#FF6FB0", lip: "#D94A8C", tint: "#FFE0EF", deep: "#A3306A" },
};

export const DIFFICULTY_COLORS: Record<Difficulty, Swatch> = {
  easy: CATEGORY_COLORS.english,
  mid: CATEGORY_COLORS.math,
  hard: { base: "#FF5C6C", lip: "#D93A4B", tint: "#FFE4E7", deep: "#B3263A" },
};

export const OK: Swatch = CATEGORY_COLORS.english;
export const BAD: Swatch = DIFFICULTY_COLORS.hard;
export const GOLD: Swatch = CATEGORY_COLORS.math;

/** Letter tiles cycle through these. */
export const TILE_SWATCHES: Swatch[] = [
  CATEGORY_COLORS.language,
  CATEGORY_COLORS.math,
  CATEGORY_COLORS.english,
  CATEGORY_COLORS.logic,
  CATEGORY_COLORS.science,
  { base: "#2F6FEB", lip: "#1F4FB8", tint: "#DCE7FF", deep: "#1F4FB8" },
];

export const font = {
  regular: "Rubik_400Regular",
  medium: "Rubik_500Medium",
  bold: "Rubik_700Bold",
  heavy: "Rubik_800ExtraBold",
  black: "Rubik_900Black",
} as const;
