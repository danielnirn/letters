import type { AvatarSlot } from "../types/models";

export type ShopSection = "enhance" | "avatar";
export type ShopCategory = "cosmetics" | AvatarSlot;
export type ShopItem = {
  id: string;
  emoji: string;
  name: string;
  section: ShopSection;
  category: ShopCategory;
  cost: number;
  desc: string;
  type: "theme" | "avatar";
  effect: "theme" | "equip" | "none";
  consumable?: boolean;
  /** Avatar clothing slot. */
  slot?: AvatarSlot;
  /**
   * Future real art: `assets/avatar/{id}.png` or a remote URL.
   * Until then the shop uses `emoji` as a placeholder.
   */
  assetKey?: string;
  locked?: boolean;
};

export const SHOP_ITEMS: ShopItem[] = [
  {
    id: "theme_space",
    emoji: "🚀",
    name: "ערכת חלל",
    section: "enhance",
    category: "cosmetics",
    cost: 350,
    desc: "עיצוב חלל סגול וחלומי",
    type: "theme",
    effect: "theme",
  },
  {
    id: "theme_jungle",
    emoji: "🌴",
    name: "ערכת ג׳ונגל",
    section: "enhance",
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
    section: "enhance",
    category: "cosmetics",
    cost: 350,
    desc: "עיצוב קשת ורוד-סגול נוצץ",
    type: "theme",
    effect: "theme",
  },
  {
    id: "avatar_base_kid",
    emoji: "🧒",
    name: "גמד בסיסי",
    section: "avatar",
    category: "base",
    slot: "base",
    cost: 0,
    desc: "הדמות ההתחלתית — אפשר להחליף כשיהיו איורים",
    type: "avatar",
    effect: "equip",
    assetKey: "avatar/base_kid",
  },
  {
    id: "avatar_base_star",
    emoji: "🌟",
    name: "גמד כוכב",
    section: "avatar",
    category: "base",
    slot: "base",
    cost: 80,
    desc: "דמות אחרת (אימוג׳י זמני עד לאיור)",
    type: "avatar",
    effect: "equip",
    assetKey: "avatar/base_star",
  },
  {
    id: "avatar_hat_cap",
    emoji: "🧢",
    name: "כובע מצחייה",
    section: "avatar",
    category: "hat",
    slot: "hat",
    cost: 40,
    desc: "כובע לדמות",
    type: "avatar",
    effect: "equip",
    assetKey: "avatar/hat_cap",
  },
  {
    id: "avatar_hat_crown",
    emoji: "👑",
    name: "כתר",
    section: "avatar",
    category: "hat",
    slot: "hat",
    cost: 120,
    desc: "כתר קטן",
    type: "avatar",
    effect: "equip",
    assetKey: "avatar/hat_crown",
  },
  {
    id: "avatar_top_shirt",
    emoji: "👕",
    name: "חולצה",
    section: "avatar",
    category: "top",
    slot: "top",
    cost: 50,
    desc: "חולצה לדמות",
    type: "avatar",
    effect: "equip",
    assetKey: "avatar/top_shirt",
  },
  {
    id: "avatar_top_hoodie",
    emoji: "🧥",
    name: "קפוצ׳ון",
    section: "avatar",
    category: "top",
    slot: "top",
    cost: 90,
    desc: "קפוצ׳ון חם",
    type: "avatar",
    effect: "equip",
    assetKey: "avatar/top_hoodie",
  },
  {
    id: "avatar_bottom_shorts",
    emoji: "🩳",
    name: "מכנסיים קצרים",
    section: "avatar",
    category: "bottom",
    slot: "bottom",
    cost: 40,
    desc: "מכנסיים קצרים",
    type: "avatar",
    effect: "equip",
    assetKey: "avatar/bottom_shorts",
  },
  {
    id: "avatar_shoes_sneakers",
    emoji: "👟",
    name: "נעלי ספורט",
    section: "avatar",
    category: "shoes",
    slot: "shoes",
    cost: 45,
    desc: "נעליים לדמות",
    type: "avatar",
    effect: "equip",
    assetKey: "avatar/shoes_sneakers",
  },
  {
    id: "avatar_extra_cape",
    emoji: "🦸",
    name: "גלימה",
    section: "avatar",
    category: "extra",
    slot: "extra",
    cost: 150,
    desc: "גלימה של גיבור",
    type: "avatar",
    effect: "equip",
    assetKey: "avatar/extra_cape",
  },
  {
    id: "avatar_coming_pet",
    emoji: "🐾",
    name: "חיית מחמד",
    section: "avatar",
    category: "extra",
    slot: "extra",
    cost: 999,
    desc: "בקרוב — מחכה לאיור",
    type: "avatar",
    effect: "none",
    locked: true,
    assetKey: "avatar/extra_pet",
  },
];

export function shopItemById(id: string): ShopItem | undefined {
  return SHOP_ITEMS.find((it) => it.id === id);
}

export function avatarCatalog(): ShopItem[] {
  return SHOP_ITEMS.filter((it) => it.section === "avatar");
}

export function enhanceCatalog(): ShopItem[] {
  return SHOP_ITEMS.filter((it) => it.section === "enhance");
}
