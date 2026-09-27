import type { ThemeId } from "../game/config";

export type ThemeColors = {
  bg: [string, string, string];
  accent: string;
  accent2: string;
  title: string;
  subtitle: string;
  card: string;
  score: string;
  coin: string;
  filledBg: string;
  filledBorder: string;
  toast: string;
};

export const defaultTheme: ThemeColors = {
  bg: ["#1a1a2e", "#16213e", "#0f3460"],
  accent: "#a0c4ff",
  accent2: "#a29bfe",
  title: "#fff",
  subtitle: "#a0c4ff",
  card: "rgba(255,255,255,0.08)",
  score: "#ffd93d",
  coin: "#a29bfe",
  filledBg: "rgba(107,203,119,0.25)",
  filledBorder: "#6bcb77",
  toast: "rgba(30,30,60,0.95)",
};

const themes: Record<ThemeId, ThemeColors> = {
  theme_space: {
    ...defaultTheme,
    bg: ["#0d0d1a", "#0a0a2e", "#050520"],
    accent: "#7ecfff",
    accent2: "#bd93f9",
    subtitle: "#7ecfff",
    score: "#f1fa8c",
    coin: "#bd93f9",
    toast: "rgba(10,10,40,0.97)",
  },
  theme_jungle: {
    ...defaultTheme,
    bg: ["#0a2e0a", "#1a4a1a", "#0d3d1a"],
    accent: "#a8e063",
    accent2: "#56ab2f",
    subtitle: "#a8e063",
    coin: "#a8e063",
    toast: "rgba(10,30,10,0.97)",
  },
  theme_unicorn: {
    bg: ["#2d1b4e", "#4a1e5e", "#6b2d6b"],
    accent: "#f9a8d4",
    accent2: "#e879f9",
    title: "#fdf4ff",
    subtitle: "#f9a8d4",
    card: "rgba(249,168,212,0.08)",
    score: "#fde68a",
    coin: "#e879f9",
    filledBg: "rgba(233,121,249,0.25)",
    filledBorder: "#e879f9",
    toast: "rgba(45,27,78,0.97)",
  },
};

export function colorsFor(themeId: string | null): ThemeColors {
  if (themeId && themeId in themes) return themes[themeId as ThemeId];
  return defaultTheme;
}
