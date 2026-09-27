import type { AvatarLoadout, AvatarSlot } from "../types/models";

export const AVATAR_SLOTS: AvatarSlot[] = ["base", "hat", "top", "bottom", "shoes", "extra"];

export const AVATAR_SLOT_Z: Record<AvatarSlot, number> = {
  base: 0,
  bottom: 1,
  shoes: 2,
  top: 3,
  hat: 4,
  extra: 5,
};

export function defaultAvatar(): AvatarLoadout {
  return {
    base: "avatar_base_kid",
    hat: null,
    top: null,
    bottom: null,
    shoes: null,
    extra: null,
  };
}

export function normalizeAvatar(raw: unknown): AvatarLoadout {
  const fallback = defaultAvatar();
  if (!raw || typeof raw !== "object") return fallback;
  const data = raw as Record<string, unknown>;
  const pick = (key: AvatarSlot): string | null => {
    const v = data[key];
    if (typeof v !== "string" || !v) return key === "base" ? fallback.base : null;
    return v;
  };
  return {
    base: pick("base") || fallback.base,
    hat: pick("hat"),
    top: pick("top"),
    bottom: pick("bottom"),
    shoes: pick("shoes"),
    extra: pick("extra"),
  };
}

export function equippedId(loadout: AvatarLoadout, slot: AvatarSlot): string | null {
  if (slot === "base") return loadout.base;
  return loadout[slot] ?? null;
}

export function withEquipped(
  loadout: AvatarLoadout,
  slot: AvatarSlot,
  itemId: string | null,
): AvatarLoadout {
  if (slot === "base") {
    return { ...loadout, base: itemId || loadout.base };
  }
  return { ...loadout, [slot]: itemId };
}
