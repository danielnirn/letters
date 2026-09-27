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
import type { CachedProgress, ProfileDoc, ScoreEntry, UserDoc } from "../types/models";
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
    coins: 0,
    purchases: [],
    inventory: {},
    theme: null,
    updatedAt: Date.now(),
  };
}

function profileFromData(id: string, data: Record<string, unknown>): ProfileDoc {
  return {
    id,
    displayName: typeof data.displayName === "string" ? data.displayName : "",
    nameChosen: data.nameChosen === true,
    coins: typeof data.coins === "number" ? data.coins : 0,
    purchases: Array.isArray(data.purchases) ? (data.purchases as string[]) : [],
    inventory: (data.inventory as Record<string, number>) ?? {},
    theme: (data.theme as ProfileDoc["theme"]) ?? null,
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
      coins: 0,
      purchases: [],
      inventory: {},
      theme: null,
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
      coins: 0,
      purchases: [],
      inventory: {},
      theme: null,
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
      coins: profile.coins,
      purchases: profile.purchases,
      inventory: profile.inventory,
      theme: profile.theme,
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

export async function submitGlobalScore(uid: string, entry: ScoreEntry): Promise<void> {
  const fb = getFirebase();
  if (!fb) return;
  const ref = doc(fb.db, "leaderboard", uid);
  const snap = await getDoc(ref);
  const prev = snap.data();
  if (prev && typeof prev.score === "number" && prev.score >= entry.score) return;
  await setDoc(ref, {
    name: entry.name,
    score: entry.score,
    level: entry.level,
    ts: entry.ts,
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
