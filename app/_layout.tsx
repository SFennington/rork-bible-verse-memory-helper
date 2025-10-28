import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { VerseProvider } from "@/contexts/VerseContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { PrayerProvider } from "@/contexts/PrayerContext";
import { BibleVersionProvider } from "@/contexts/BibleVersionContext";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <ThemeProvider>
      <BibleVersionProvider>
        <VerseProvider>
          <PrayerProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="+not-found" options={{ headerShown: false }} />
            </Stack>
          </PrayerProvider>
        </VerseProvider>
      </BibleVersionProvider>
    </ThemeProvider>
  );
}
