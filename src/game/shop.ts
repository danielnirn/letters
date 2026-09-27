import { CONFIG } from "./config";

export type ShopCategory = "tools" | "cosmetics" | "coming";
export type ShopItem = {
  id: string;
  emoji: string;
  name: string;
  category: ShopCategory;
  cost: number;
  desc: string;
  type: "powerup" | "theme" | "tbd";
  effect: "extra_hints" | "skip_word" | "double_coins" | "theme" | "none";
  consumable?: boolean;
};

export const SHOP_ITEMS: ShopItem[] = [
  {
    id: "extra_hints",
    emoji: "💡",
    name: "רמזים נוספים",
    category: "tools",
    cost: 30,
    desc: `+${CONFIG.hintsPerWord} רמזים למשחק הנוכחי`,
    type: "powerup",
    effect: "extra_hints",
    consumable: true,
  },
  {
    id: "skip_word",
    emoji: "⏭️",
    name: "דלג מילה",
    category: "tools",
    cost: 20,
    desc: "דלג על מילה אחת ב-20 מטבעות",
    type: "powerup",
    effect: "skip_word",
    consumable: true,
  },
  {
    id: "double_coins",
    emoji: "💰",
    name: "מטבעות כפולים",
    category: "tools",
    cost: 50,
    desc: "X2 מטבעות עד סוף הסיבוב",
    type: "powerup",
    effect: "double_coins",
    consumable: true,
  },
  {
    id: "theme_space",
    emoji: "🚀",
    name: "ערכת חלל",
    category: "cosmetics",
    cost: 350,
    desc: "עיצוב חלל כהה עם כוכבים",
    type: "theme",
    effect: "theme",
  },
  {
    id: "theme_jungle",
    emoji: "🌴",
    name: "ערכת ג׳ונגל",
    category: "cosmetics",
    cost: 350,
    desc: "עיצוב ג׳ונגל ירוק",
    type: "theme",
    effect: "theme",
  },
  {
    id: "theme_unicorn",
    emoji: "🦄",
    name: "ערכת חד-קרן",
    category: "cosmetics",
    cost: 350,
    desc: "עיצוב קשת ורוד-סגול נוצץ",
    type: "theme",
    effect: "theme",
  },
  { id: "coming_1", emoji: "🎭", name: "???", category: "coming", cost: 999, desc: "בקרוב...", type: "tbd", effect: "none" },
  { id: "coming_2", emoji: "🌈", name: "???", category: "coming", cost: 999, desc: "בקרוב...", type: "tbd", effect: "none" },
];
