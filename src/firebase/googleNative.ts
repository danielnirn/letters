import * as Crypto from "expo-crypto";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";

/** Google allows this loopback URI; Expo Go's exp:// is rejected. */
export const GOOGLE_NATIVE_REDIRECT = "http://localhost:8081";

function parseIdToken(url: string): string | null {
  const hash = url.includes("#") ? url.slice(url.indexOf("#") + 1) : "";
  const search = url.includes("?") ? url.slice(url.indexOf("?") + 1).split("#")[0] : "";
  const params = new URLSearchParams(hash || search);
  return params.get("id_token");
}

export async function getGoogleIdTokenNative(clientId: string): Promise<string> {
  if (!clientId) throw new Error("google-client");
  const nonce = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
  const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, nonce);
  const authUrl =
    "https://accounts.google.com/o/oauth2/v2/auth?" +
    new URLSearchParams({
      client_id: clientId,
      redirect_uri: GOOGLE_NATIVE_REDIRECT,
      response_type: "id_token",
      response_mode: "fragment",
      scope: "openid profile email",
      nonce: hashedNonce,
      prompt: "select_account",
    }).toString();

  if (Platform.OS === "android") {
    await WebBrowser.warmUpAsync();
  }
  const result = await WebBrowser.openAuthSessionAsync(authUrl, GOOGLE_NATIVE_REDIRECT, {
    preferEphemeralSession: true,
  });
  if (Platform.OS === "android") {
    await WebBrowser.coolDownAsync();
  }
  if (result.type !== "success" || !("url" in result) || !result.url) {
    throw new Error("google-cancel");
  }
  const idToken = parseIdToken(result.url);
  if (!idToken) throw new Error("google-token");
  return idToken;
}
