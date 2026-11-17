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
import { defaultAvatar } from "../game/avatar";
import {
  addScoreRemote,
  clearScoresRemote,
  defaultProfile,
  ensureAccount,
  persistProfile,
  persistUser,
  submitGlobalScore,
  syncLeaderboardLook,
  watchGlobalLeaderboard,
  watchProfile,
} from "../firebase/repository";
import type { CachedProgress, Gender, ProfileDoc, ScoreEntry } from "../types/models";
import { isFirebaseConfigured } from "../firebase/app";
import { useAuth } from "./AuthContext";
import { stageProgressKey, stageCoinsKey, type Category, type Difficulty } from "../game/config";
import { totalStars } from "../game/village";
import {
  applyBuild,
  applyDailyGift,
  applyEntry,
  applyStageWin,
  ECONOMY,
  sceneLevels,
  todayKey,
  type BuildResult,
} from "../game/economy";

type ProgressValue = {
  loading: boolean;
  profiles: ProfileDoc[];
  active: ProfileDoc;
  scores: ScoreEntry[];
  topScores: ScoreEntry[];
  setActiveName: (name: string) => Promise<void>;
  setGender: (gender: Gender) => Promise<void>;
  /** Pays the entry fee. `false` when the player has too few coins. */
  enterStage: (difficulty: Difficulty) => Promise<boolean>;
  /** Builds the next scene element with stars. `null` when the player has too few stars. */
  buildNext: () => Promise<BuildResult | null>;
  /** Coins from today's daily gift, until the home screen shows it. */
  dailyGift: number | null;
  clearDailyGift: () => void;
  saveScore: (score: number, level: string) => Promise<void>;
  /** Pays stars (and coins on a perfect win). `rating` is the 1–3 stage map rating. */
  completeStage: (
    category: Category,
    difficulty: Difficulty,
    stage: number,
    perfect: boolean,
    rating: number,
  ) => Promise<{ stars: number; coins: number }>;
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
  const [dailyGift, setDailyGift] = useState<number | null>(null);

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

  const patchActive = async (fn: (p: ProfileDoc) => ProfileDoc): Promise<ProfileDoc | null> => {
    const current = dataRef.current;
    if (!current) return null;
    const currentActive =
      current.profiles.find((p) => p.id === current.user.activeProfileId) ?? current.profiles[0];
    const profiles = current.profiles.map((p) =>
      p.id === currentActive.id ? { ...fn(p), updatedAt: Date.now() } : p,
    );
    const nextProfile = profiles.find((p) => p.id === currentActive.id) ?? null;
    const ok = await persist({ ...current, profiles });
    return ok ? nextProfile : null;
  };

  const publishLook = useCallback(async (profile: ProfileDoc) => {
    if (!uid || isLocal) return;
    try {
      await syncLeaderboardLook(uid, {
        name: profile.displayName,
        avatar: profile.avatar ?? defaultAvatar(),
        gender: profile.gender,
        village: sceneLevels(profile),
        stars: totalStars(profile),
      });
    } catch {
      setCloudError("cloud");
    }
  }, [uid, isLocal]);

  const giftChecked = useRef<string | null>(null);
  useEffect(() => {
    if (loading || !data) return;
    const key = `${data.user.activeProfileId}:${todayKey()}`;
    if (giftChecked.current === key) return;
    giftChecked.current = key;
    const profile = data.profiles.find((p) => p.id === data.user.activeProfileId) ?? data.profiles[0];
    if (!profile || !applyDailyGift(profile)) return;
    void patchActive((p) => applyDailyGift(p) ?? p).then((saved) => {
      if (saved) setDailyGift(ECONOMY.dailyGiftCoins);
    });
  }, [loading, data]);

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
        const next = await patchActive((p) => ({ ...p, displayName: trimmed, nameChosen: true }));
        if (next) await publishLook(next);
      },
      setGender: async (gender) => {
        const next = await patchActive((p) => ({ ...p, gender }));
        if (next) await publishLook(next);
      },
      enterStage: async (difficulty) => {
        let paid = false;
        await patchActive((p) => {
          const next = applyEntry(p, difficulty);
          paid = next !== null;
          return next ?? p;
        });
        return paid;
      },
      buildNext: async () => {
        const out: { result: BuildResult | null } = { result: null };
        const saved = await patchActive((p) => {
          out.result = applyBuild(p);
          return out.result?.profile ?? p;
        });
        if (!saved) return null;
        if (out.result) await publishLook(saved);
        return out.result;
      },
      dailyGift,
      clearDailyGift: () => setDailyGift(null),
      completeStage: async (category, difficulty, stage, perfect, rating) => {
        const key = stageProgressKey(category, difficulty);
        const stageKey = stageCoinsKey(category, difficulty, stage);
        let paid = { stars: 0, coins: 0 };
        await patchActive((p) => {
          const win = applyStageWin(p, difficulty, perfect);
          paid = { stars: win.stars, coins: win.coins };
          const prev = p.stageClears ?? {};
          const prevPerfect = p.stagePerfect ?? {};
          const prevStars = p.stageStars ?? {};
          return {
            ...win.profile,
            stageClears: { ...prev, [key]: Math.max(prev[key] ?? 0, stage) },
            stagePerfect: { ...prevPerfect, [stageKey]: Boolean(prevPerfect[stageKey] || perfect) },
            stageStars: { ...prevStars, [stageKey]: Math.max(prevStars[stageKey] ?? 0, rating) },
          };
        });
        return paid;
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
          avatar: currentActive.avatar ?? defaultAvatar(),
          gender: currentActive.gender,
          village: sceneLevels(currentActive),
          stars: totalStars(currentActive),
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
  }, [data, loading, active, uid, isLocal, persist, cloudError, globalScores, publishLook, dailyGift]);

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useProgress");
  return ctx;
}
