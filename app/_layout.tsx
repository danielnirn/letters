import "react-native-gesture-handler";
import { Heebo_400Regular, Heebo_700Bold, Heebo_800ExtraBold, Heebo_900Black, useFonts } from "@expo-google-fonts/heebo";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, type ReactNode } from "react";
import { I18nManager, Platform, View } from "react-native";
import { AuthProvider, useAuth } from "../src/context/AuthContext";
import { ProgressProvider, useProgress } from "../src/context/ProgressContext";

SplashScreen.preventAutoHideAsync();

if (Platform.OS !== "web" && !I18nManager.isRTL) {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
}

function Gate({ children }: { children: ReactNode }) {
  const { uid, ready } = useAuth();
  const progress = useProgress();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    const route = segments[0];
    const onLogin = route === "login";
    const onName = route === "name";
    if (!uid) {
      if (!onLogin) router.replace("/login");
      return;
    }
    if (progress.loading) return;
    const needsName = !progress.active.nameChosen;
    if (onLogin || (needsName && !onName)) {
      router.replace(needsName ? "/name" : "/");
      return;
    }
    if (!needsName && onName) router.replace("/");
  }, [uid, ready, segments, router, progress.loading, progress.active.nameChosen]);

  if (!ready || (uid && progress.loading)) {
    return <View style={{ flex: 1, backgroundColor: "#1a1a2e" }} />;
  }
  return <>{children}</>;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Heebo_400Regular,
    Heebo_700Bold,
    Heebo_800ExtraBold,
    Heebo_900Black,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <AuthProvider>
      <ProgressProvider>
        <Gate>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: "#1a1a2e" },
              animation: "fade",
            }}
          />
        </Gate>
      </ProgressProvider>
    </AuthProvider>
  );
}
