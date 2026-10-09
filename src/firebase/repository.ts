import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  writeBatch,
  type Unsubscribe,
} from "firebase/firestore";
import type { Firestore } from "firebase/firestore";
import type { CachedProgress, LeaderboardLook, ProfileDoc, ScoreEntry, UserDoc } from "../types/models";
import { CATEGORIES, type Category } from "../game/config";
import { defaultAvatar, normalizeAvatar } from "../game/avatar";
import { getFirebase } from "./app";

const emptyUser = (email: string | null, profileId: string): UserDoc => ({
  email,
  createdAt: Date.now(),
  plan: "free",
  activeProfileId: profileId,
});

export function defaultProfile(id: string, displayName = ""): ProfileDoc {
  return {
    id,
    displayName,
    nameChosen: false,
    gender: null,
    coins: 0,
    purchases: [],
    inventory: {},
    avatar: defaultAvatar(),
    stageClears: {},
    stageCoins: {},
    stagePerfect: {},
    stageStars: {},
    villageBuilt: {},
    villageBlooms: 0,
    wishDay: null,
    wishDone: false,
    updatedAt: Date.now(),
  };
}

function villageBuiltFrom(value: unknown): Partial<Record<Category, number>> {
  if (!value || typeof value !== "object") return {};
  const out: Partial<Record<Category, number>> = {};
  for (const cat of CATEGORIES) {
    const n = (value as Record<string, unknown>)[cat];
    if (typeof n === "number" && n > 0) out[cat] = Math.min(4, Math.floor(n));
  }
  return out;
}

function profileFromData(id: string, data: Record<string, unknown>): ProfileDoc {
  return {
    id,
    displayName: typeof data.displayName === "string" ? data.displayName : "",
    nameChosen: data.nameChosen === true,
    gender: data.gender === "girl" || data.gender === "boy" ? data.gender : null,
    coins: typeof data.coins === "number" ? data.coins : 0,
    purchases: Array.isArray(data.purchases) ? (data.purchases as string[]) : [],
    inventory: (data.inventory as Record<string, number>) ?? {},
    avatar: normalizeAvatar(data.avatar),
    stageClears:
      data.stageClears && typeof data.stageClears === "object"
        ? (data.stageClears as Record<string, number>)
        : {},
    stageCoins:
      data.stageCoins && typeof data.stageCoins === "object"
        ? (data.stageCoins as Record<string, number>)
        : {},
    stagePerfect:
      data.stagePerfect && typeof data.stagePerfect === "object"
        ? (data.stagePerfect as Record<string, boolean>)
        : {},
    stageStars:
      data.stageStars && typeof data.stageStars === "object"
        ? (data.stageStars as Record<string, number>)
        : {},
    villageBuilt: villageBuiltFrom(data.villageBuilt),
    villageBlooms: typeof data.villageBlooms === "number" ? data.villageBlooms : 0,
    wishDay: typeof data.wishDay === "string" ? data.wishDay : null,
    wishDone: data.wishDone === true,
    updatedAt: typeof data.updatedAt === "number" ? data.updatedAt : 0,
  };
}

function userRef(db: Firestore, uid: string) {
  return doc(db, "users", uid);
}

function profileRef(db: Firestore, uid: string, profileId: string) {
  return doc(db, "users", uid, "profiles", profileId);
}

function scoresCol(db: Firestore, uid: string, profileId: string) {
  return collection(db, "users", uid, "profiles", profileId, "scores");
}

export async function ensureAccount(
  uid: string,
  email: string | null,
): Promise<CachedProgress> {
  const fb = getFirebase();
  const profileId = "default";
  const local: CachedProgress = {
    user: emptyUser(email, profileId),
    profiles: [defaultProfile(profileId)],
    scores: [],
  };
  if (!fb) return local;

  const snap = await getDoc(userRef(fb.db, uid));
  if (!snap.exists()) {
    await setDoc(userRef(fb.db, uid), local.user);
    await setDoc(profileRef(fb.db, uid, profileId), {
      displayName: "",
      nameChosen: false,
      gender: null,
      coins: 0,
      purchases: [],
      inventory: {},
      avatar: defaultAvatar(),
      stageClears: {},
      stageCoins: {},
      stagePerfect: {},
      stageStars: {},
      villageBuilt: {},
      villageBlooms: 0,
      wishDay: null,
      wishDone: false,
      updatedAt: Date.now(),
    });
    return local;
  }
  return loadAccount(uid);
}

export async function loadAccount(uid: string): Promise<CachedProgress> {
  const fb = getFirebase();
  if (!fb) {
    return {
      user: emptyUser(null, "default"),
      profiles: [defaultProfile("default")],
      scores: [],
    };
  }
  const userSnap = await getDoc(userRef(fb.db, uid));
  const user = (userSnap.data() as UserDoc) ?? emptyUser(null, "default");
  const profilesSnap = await getDocs(collection(fb.db, "users", uid, "profiles"));
  const profiles: ProfileDoc[] = profilesSnap.docs.map((d) =>
    profileFromData(d.id, d.data() as Record<string, unknown>),
  );
  if (profiles.length === 0) {
    const p = defaultProfile("default");
    await setDoc(profileRef(fb.db, uid, p.id), {
      displayName: "",
      nameChosen: false,
      gender: null,
      coins: 0,
      purchases: [],
      inventory: {},
      avatar: defaultAvatar(),
      stageClears: {},
      stageCoins: {},
      stagePerfect: {},
      stageStars: {},
      villageBuilt: {},
      villageBlooms: 0,
      wishDay: null,
      wishDone: false,
      updatedAt: Date.now(),
    });
    profiles.push(p);
  }
  const active = profiles.find((p) => p.id === user.activeProfileId) ?? profiles[0];
  const scoresSnap = await getDocs(collection(fb.db, "users", uid, "profiles", active.id, "scores"));
  const scores: ScoreEntry[] = scoresSnap.docs
    .map((d) => {
      const data = d.data();
      return {
        id: d.id,
        name: data.name ?? active.displayName,
        score: data.score ?? 0,
        level: data.level ?? "easy",
        ts: data.ts ?? 0,
      };
    })
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 200);
  return { user: { ...user, activeProfileId: active.id }, profiles, scores };
}

export async function persistUser(uid: string, user: UserDoc): Promise<void> {
  const fb = getFirebase();
  if (!fb) return;
  await setDoc(userRef(fb.db, uid), user, { merge: true });
}

export async function persistProfile(uid: string, profile: ProfileDoc): Promise<void> {
  const fb = getFirebase();
  if (!fb) return;
  await setDoc(
    profileRef(fb.db, uid, profile.id),
    {
      displayName: profile.displayName,
      nameChosen: profile.nameChosen,
      gender: profile.gender ?? null,
      coins: profile.coins,
      purchases: profile.purchases,
      inventory: profile.inventory,
      avatar: profile.avatar,
      stageClears: profile.stageClears ?? {},
      stageCoins: profile.stageCoins ?? {},
      stagePerfect: profile.stagePerfect ?? {},
      stageStars: profile.stageStars ?? {},
      villageBuilt: profile.villageBuilt ?? {},
      villageBlooms: profile.villageBlooms ?? 0,
      wishDay: profile.wishDay ?? null,
      wishDone: profile.wishDone === true,
      updatedAt: profile.updatedAt,
    },
    { merge: true },
  );
}

export async function appendPurchaseRemote(
  uid: string,
  profileId: string,
  item: { itemId: string; cost: number; consumable: boolean },
): Promise<void> {
  const fb = getFirebase();
  if (!fb) return;
  const id = `${Date.now()}_${item.itemId}`;
  await setDoc(doc(fb.db, "users", uid, "profiles", profileId, "purchases", id), {
    itemId: item.itemId,
    cost: item.cost,
    consumable: item.consumable,
    ts: Date.now(),
  });
}

export function watchProfile(
  uid: string,
  profileId: string,
  onNext: (profile: ProfileDoc) => void,
  onError?: (err: Error) => void,
): Unsubscribe | null {
  const fb = getFirebase();
  if (!fb) return null;
  return onSnapshot(
    profileRef(fb.db, uid, profileId),
    (snap) => {
      if (!snap.exists()) return;
      onNext(profileFromData(snap.id, snap.data() as Record<string, unknown>));
    },
    (err) => onError?.(err),
  );
}

export async function addScoreRemote(
  uid: string,
  profileId: string,
  entry: ScoreEntry,
): Promise<void> {
  const fb = getFirebase();
  if (!fb) return;
  await setDoc(doc(scoresCol(fb.db, uid, profileId), entry.id), {
    name: entry.name,
    score: entry.score,
    level: entry.level,
    ts: entry.ts,
  });
}

export async function clearScoresRemote(uid: string, profiles: ProfileDoc[]): Promise<void> {
  const fb = getFirebase();
  if (!fb) return;
  for (const p of profiles) {
    const snap = await getDocs(scoresCol(fb.db, uid, p.id));
    const batch = writeBatch(fb.db);
    snap.docs.forEach((d) => batch.delete(d.ref));
    if (!snap.empty) await batch.commit();
  }
}

function leaderboardLook(entry: ScoreEntry) {
  return {
    avatar: entry.avatar ?? defaultAvatar(),
    gender: entry.gender === "boy" || entry.gender === "girl" ? entry.gender : null,
    ...(entry.village ? { village: entry.village } : {}),
    ...(typeof entry.stars === "number" ? { stars: entry.stars } : {}),
  };
}

function villageFromData(raw: unknown): Partial<Record<Category, number>> | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const out: Partial<Record<Category, number>> = {};
  for (const cat of CATEGORIES) {
    const v = (raw as Record<string, unknown>)[cat];
    if (typeof v === "number") out[cat] = Math.max(0, Math.min(4, Math.round(v)));
  }
  return out;
}

export async function submitGlobalScore(uid: string, entry: ScoreEntry): Promise<void> {
  const fb = getFirebase();
  if (!fb) return;
  const ref = doc(fb.db, "leaderboard", uid);
  const snap = await getDoc(ref);
  const prev = snap.data();
  const prevScore = typeof prev?.score === "number" ? prev.score : null;
  const keep = prevScore !== null && prevScore >= entry.score;
  await setDoc(ref, {
    name: entry.name,
    score: keep ? prevScore : entry.score,
    level: keep && typeof prev?.level === "string" ? prev.level : entry.level,
    ts: keep && typeof prev?.ts === "number" ? prev.ts : entry.ts,
    ...leaderboardLook(entry),
  });
}

/** Refresh name, clothes and village on an existing row without changing the score. */
export async function syncLeaderboardLook(uid: string, look: LeaderboardLook): Promise<void> {
  const fb = getFirebase();
  if (!fb) return;
  const ref = doc(fb.db, "leaderboard", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  await updateDoc(ref, {
    name: look.name,
    avatar: look.avatar,
    gender: look.gender,
    village: look.village,
    stars: look.stars,
  });
}

export function watchGlobalLeaderboard(
  onNext: (scores: ScoreEntry[]) => void,
  onError?: (err: Error) => void,
): Unsubscribe | null {
  const fb = getFirebase();
  if (!fb) return null;
  const q = query(collection(fb.db, "leaderboard"), orderBy("score", "desc"), limit(20));
  return onSnapshot(
    q,
    (snap) => {
      onNext(
        snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            name: data.name ?? "שחקן",
            score: data.score ?? 0,
            level: data.level ?? "easy",
            ts: data.ts ?? 0,
            avatar: data.avatar ? normalizeAvatar(data.avatar) : undefined,
            gender: data.gender === "girl" || data.gender === "boy" ? data.gender : null,
            village: villageFromData(data.village),
            stars: typeof data.stars === "number" ? data.stars : undefined,
          };
        }),
      );
    },
    (err) => onError?.(err),
  );
}

export async function updateActiveProfile(uid: string, profileId: string): Promise<void> {
  const fb = getFirebase();
  if (!fb) return;
  await updateDoc(userRef(fb.db, uid), { activeProfileId: profileId });
}
