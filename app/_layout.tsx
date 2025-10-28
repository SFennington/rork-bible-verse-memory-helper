import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { StatusBar } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
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
    <SafeAreaProvider>
      <ThemeProvider>
        <BibleVersionProvider>
          <VerseProvider>
            <PrayerProvider>
              <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
              <Stack 
                screenOptions={{ 
                  headerShown: true,
                  animation: 'slide_from_right',
                }}
              >
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="+not-found" options={{ headerShown: false }} />
              </Stack>
            </PrayerProvider>
          </VerseProvider>
        </BibleVersionProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
