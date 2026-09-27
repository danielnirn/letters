import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { type ShopItem } from "../game/shop";
import { defaultAvatar, withEquipped } from "../game/avatar";
import {
  addScoreRemote,
  appendPurchaseRemote,
  clearScoresRemote,
  defaultProfile,
  ensureAccount,
  persistProfile,
  persistUser,
  submitGlobalScore,
  watchGlobalLeaderboard,
  watchProfile,
} from "../firebase/repository";
import type { CachedProgress, ProfileDoc, ScoreEntry, AvatarSlot } from "../types/models";
import { isFirebaseConfigured } from "../firebase/app";
import { useAuth } from "./AuthContext";

type ProgressValue = {
  loading: boolean;
  profiles: ProfileDoc[];
  active: ProfileDoc;
  scores: ScoreEntry[];
  topScores: ScoreEntry[];
  setActiveName: (name: string) => Promise<void>;
  addCoins: (amount: number) => Promise<void>;
  spendCoins: (amount: number) => Promise<boolean>;
  buyItem: (item: ShopItem) => Promise<"ok" | "funds" | "fail">;
  activateTheme: (themeId: string | null) => Promise<void>;
  equipAvatar: (slot: AvatarSlot, itemId: string | null) => Promise<void>;
  useInventory: (itemId: string) => Promise<boolean>;
  saveScore: (score: number, level: string) => Promise<void>;
  clearScores: () => Promise<void>;
  cloudError: boolean;
};

const ProgressContext = createContext<ProgressValue | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const { uid, email, isLocal } = useAuth();
  const [data, setData] = useState<CachedProgress | null>(null);
  const dataRef = useRef(data);
  dataRef.current = data;
  const [loading, setLoading] = useState(true);
  const [cloudError, setCloudError] = useState<string | null>(null);
  const [globalScores, setGlobalScores] = useState<ScoreEntry[]>([]);

  const persist = useCallback(
    async (next: CachedProgress) => {
      dataRef.current = next;
      setData(next);
      if (!uid || isLocal) return true;
      try {
        await persistUser(uid, next.user);
        const activeP = next.profiles.find((p) => p.id === next.user.activeProfileId);
        if (activeP) await persistProfile(uid, activeP);
        setCloudError(null);
        return true;
      } catch {
        setCloudError("cloud");
        return false;
      }
    },
    [uid, isLocal],
  );

  useEffect(() => {
    if (!uid) {
      setData(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      if (isLocal) {
        const guest: CachedProgress = {
          user: {
            email,
            createdAt: Date.now(),
            plan: "free",
            activeProfileId: "default",
          },
          profiles: [defaultProfile("default")],
          scores: [],
        };
        if (!cancelled) {
          setData(guest);
          setLoading(false);
        }
        return;
      }
      try {
        const remote = isFirebaseConfigured()
          ? await ensureAccount(uid, email)
          : {
              user: {
                email,
                createdAt: Date.now(),
                plan: "free" as const,
                activeProfileId: "default",
              },
              profiles: [defaultProfile("default")],
              scores: [] as ScoreEntry[],
            };
        if (!cancelled) setData(remote);
      } catch {
        if (!cancelled) {
          setData({
            user: {
              email,
              createdAt: Date.now(),
              plan: "free",
              activeProfileId: "default",
            },
            profiles: [defaultProfile("default")],
            scores: [],
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [uid, email, isLocal]);

  const activeProfileId = data?.user.activeProfileId ?? "default";

  useEffect(() => {
    if (!uid || isLocal) return;
    const unsub = watchProfile(
      uid,
      activeProfileId,
      (profile) => {
        const current = dataRef.current;
        if (!current) return;
        const existing = current.profiles.find((p) => p.id === profile.id);
        if (existing && (existing.updatedAt ?? 0) > (profile.updatedAt ?? 0)) return;
        const profiles = current.profiles.map((p) => (p.id === profile.id ? profile : p));
        const next = { ...current, profiles };
        dataRef.current = next;
        setData(next);
      },
      () => setCloudError("cloud"),
    );
    return () => unsub?.();
  }, [uid, isLocal, activeProfileId]);

  useEffect(() => {
    if (!uid || isLocal) {
      setGlobalScores([]);
      return;
    }
    const unsub = watchGlobalLeaderboard(setGlobalScores, () => setCloudError("cloud"));
    return () => unsub?.();
  }, [uid, isLocal]);

  const active = data?.profiles.find((p) => p.id === data.user.activeProfileId) ??
    data?.profiles[0] ??
    defaultProfile("default");

  const patchActive = async (fn: (p: ProfileDoc) => ProfileDoc) => {
    const current = dataRef.current;
    if (!current) return false;
    const currentActive =
      current.profiles.find((p) => p.id === current.user.activeProfileId) ?? current.profiles[0];
    const profiles = current.profiles.map((p) =>
      p.id === currentActive.id ? { ...fn(p), updatedAt: Date.now() } : p,
    );
    return persist({ ...current, profiles });
  };

  const value = useMemo<ProgressValue>(() => {
    const loadingVal = loading || !data;
    return {
      loading: loadingVal,
      profiles: data?.profiles ?? [active],
      active,
      cloudError: cloudError !== null,
      scores: data?.scores ?? [],
      topScores: globalScores,
      setActiveName: async (name: string) => {
        const trimmed = name.trim();
        if (!trimmed) return;
        await patchActive((p) => ({ ...p, displayName: trimmed, nameChosen: true }));
      },
      addCoins: async (amount: number) => {
        await patchActive((p) => ({ ...p, coins: p.coins + amount }));
      },
      spendCoins: async (amount: number) => {
        const current = dataRef.current;
        if (!current) return false;
        const p =
          current.profiles.find((x) => x.id === current.user.activeProfileId) ??
          current.profiles[0];
        if (p.coins < amount) return false;
        await patchActive((prev) => ({ ...prev, coins: prev.coins - amount }));
        return true;
      },
      buyItem: async (item: ShopItem) => {
        const current = dataRef.current;
        if (!current) return "fail";
        const p =
          current.profiles.find((x) => x.id === current.user.activeProfileId) ??
          current.profiles[0];
        if (p.coins < item.cost) return "funds";
        const saved = await patchActive((prev) => {
          const coins = prev.coins - item.cost;
          if (item.consumable) {
            const inventory = {
              ...prev.inventory,
              [item.id]: (prev.inventory[item.id] || 0) + 1,
            };
            return { ...prev, coins, inventory };
          }
          const purchases = prev.purchases.includes(item.id)
            ? prev.purchases
            : [...prev.purchases, item.id];
          const theme = item.type === "theme" ? (item.id as ProfileDoc["theme"]) : prev.theme;
          let avatar = prev.avatar ?? defaultAvatar();
          if (item.section === "avatar" && item.slot) {
            avatar = withEquipped(avatar, item.slot, item.id);
          }
          return { ...prev, coins, purchases, theme, avatar };
        });
        if (!isLocal && uid) {
          try {
            await appendPurchaseRemote(uid, p.id, {
              itemId: item.id,
              cost: item.cost,
              consumable: Boolean(item.consumable),
            });
          } catch {
            setCloudError("cloud");
          }
        }
        if (!isLocal && !saved) return "fail";
        return "ok";
      },
      activateTheme: async (themeId) => {
        await patchActive((p) => ({
          ...p,
          theme: themeId as ProfileDoc["theme"],
        }));
      },
      equipAvatar: async (slot, itemId) => {
        await patchActive((p) => {
          if (itemId && itemId !== "avatar_base_kid" && !p.purchases.includes(itemId)) {
            return p;
          }
          return {
            ...p,
            avatar: withEquipped(p.avatar ?? defaultAvatar(), slot, itemId),
          };
        });
      },
      useInventory: async (itemId: string) => {
        const current = dataRef.current;
        if (!current) return false;
        const p =
          current.profiles.find((x) => x.id === current.user.activeProfileId) ??
          current.profiles[0];
        const count = p.inventory[itemId] || 0;
        if (count <= 0) return false;
        await patchActive((prev) => ({
          ...prev,
          inventory: {
            ...prev.inventory,
            [itemId]: Math.max(0, (prev.inventory[itemId] || 0) - 1),
          },
        }));
        return true;
      },
      saveScore: async (score: number, level: string) => {
        const current = dataRef.current;
        if (!current || !uid) return;
        const currentActive =
          current.profiles.find((p) => p.id === current.user.activeProfileId) ??
          current.profiles[0];
        const entry: ScoreEntry = {
          id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          name: currentActive.displayName,
          score,
          level,
          ts: Date.now(),
        };
        const scores = [...current.scores, entry].slice(-200);
        await persist({ ...current, scores });
        if (isLocal) return;
        try {
          await addScoreRemote(uid, currentActive.id, entry);
          await submitGlobalScore(uid, entry);
        } catch {
          setCloudError("cloud");
        }
      },
      clearScores: async () => {
        const current = dataRef.current;
        if (!current || !uid) return;
        await persist({ ...current, scores: [] });
        if (isLocal) return;
        try {
          await clearScoresRemote(uid, current.profiles);
        } catch {
          setCloudError("cloud");
        }
      },
    };
  }, [data, loading, active, uid, isLocal, persist, cloudError, globalScores]);

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useProgress");
  return ctx;
}
