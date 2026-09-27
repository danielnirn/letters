import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  GoogleAuthProvider,
  OAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
  signInWithPopup,
  signOut as fbSignOut,
  type User,
} from "firebase/auth";
import * as WebBrowser from "expo-web-browser";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from "expo-crypto";
import { Platform } from "react-native";
import { getFirebase, isFirebaseConfigured } from "../firebase/app";
import { getGoogleIdTokenNative } from "../firebase/googleNative";

WebBrowser.maybeCompleteAuthSession();

const LOCAL_UID = "local-device";

type AuthValue = {
  uid: string | null;
  user: User | null;
  ready: boolean;
  firebaseReady: boolean;
  isLocal: boolean;
  email: string | null;
  displayName: string | null;
  signInGoogle: () => Promise<void>;
  signInApple: () => Promise<void>;
  signInLocal: () => void;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [localUid, setLocalUid] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const firebaseReady = isFirebaseConfigured();
  const fb = getFirebase();
  const googleWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || "";

  useEffect(() => {
    if (!fb) {
      setReady(true);
      return;
    }
    return onAuthStateChanged(fb.auth, (next) => {
      setUser(next);
      setReady(true);
    });
  }, [fb]);

  const signInGoogle = async () => {
    if (!fb) throw new Error("firebase");
    if (Platform.OS === "web") {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(fb.auth, provider);
      return;
    }
    const idToken = await getGoogleIdTokenNative(googleWebClientId);
    await signInWithCredential(fb.auth, GoogleAuthProvider.credential(idToken));
  };

  const signInApple = async () => {
    if (!fb) throw new Error("firebase");
    const nonce = Math.random().toString(36).slice(2);
    const hashed = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      nonce,
    );
    const apple = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashed,
    });
    if (!apple.identityToken) throw new Error("apple");
    const provider = new OAuthProvider("apple.com");
    const credential = provider.credential({
      idToken: apple.identityToken,
      rawNonce: nonce,
    });
    await signInWithCredential(fb.auth, credential);
  };

  const signOut = async () => {
    setLocalUid(null);
    if (fb) await fbSignOut(fb.auth);
  };

  const uid = user?.uid ?? localUid;
  const value = useMemo<AuthValue>(
    () => ({
      uid,
      user,
      ready,
      firebaseReady,
      isLocal: !user && uid === LOCAL_UID,
      email: user?.email ?? null,
      displayName: user?.displayName ?? null,
      signInGoogle,
      signInApple,
      signInLocal: () => setLocalUid(LOCAL_UID),
      signOut,
    }),
    [uid, user, ready, firebaseReady],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth");
  return ctx;
}

export { LOCAL_UID };
