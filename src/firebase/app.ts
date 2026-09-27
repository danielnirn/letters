import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, initializeAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type FirebaseServices = {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
};

function readConfig() {
  const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
  const authDomain = process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;
  const storageBucket = process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET;
  const messagingSenderId = process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
  const appId = process.env.EXPO_PUBLIC_FIREBASE_APP_ID;
  if (!apiKey || !projectId || !appId) return null;
  return { apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId };
}

export function isFirebaseConfigured(): boolean {
  return readConfig() !== null;
}

let services: FirebaseServices | null | undefined;

export function getFirebase(): FirebaseServices | null {
  if (services !== undefined) return services;
  const config = readConfig();
  if (!config) {
    services = null;
    return null;
  }
  const app = getApps()[0] ?? initializeApp(config);
  let auth: Auth;
  try {
    const { getReactNativePersistence } = require("firebase/auth") as {
      getReactNativePersistence: (storage: typeof AsyncStorage) => unknown;
    };
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage) as never,
    });
  } catch {
    auth = getAuth(app);
  }
  const db = getFirestore(app);
  services = { app, auth, db };
  return services;
}
