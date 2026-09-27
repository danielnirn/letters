import AsyncStorage from "@react-native-async-storage/async-storage";
import type { CachedProgress } from "../types/models";

const keyFor = (uid: string) => `letters_progress_${uid}`;

export async function readCache(uid: string): Promise<CachedProgress | null> {
  try {
    const raw = await AsyncStorage.getItem(keyFor(uid));
    if (!raw) return null;
    return JSON.parse(raw) as CachedProgress;
  } catch {
    return null;
  }
}

export async function writeCache(uid: string, data: CachedProgress): Promise<void> {
  await AsyncStorage.setItem(keyFor(uid), JSON.stringify(data));
}

export async function clearCache(uid: string): Promise<void> {
  await AsyncStorage.removeItem(keyFor(uid));
}
