import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { VerseProvider } from "@/contexts/VerseContext";
import { PrayerProvider } from "@/contexts/PrayerContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { BibleVersionProvider } from "@/contexts/BibleVersionContext";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="add-prayer" options={{ headerShown: true, title: 'Add Prayer' }} />
      <Stack.Screen name="prayer/[id]" options={{ headerShown: true }} />
      <Stack.Screen name="add-verse" options={{ headerShown: true }} />
      <Stack.Screen name="verse/[id]" options={{ headerShown: true }} />
      <Stack.Screen name="game/fill-blank/[id]" options={{ headerShown: true }} />
      <Stack.Screen name="game/word-order/[id]" options={{ headerShown: true }} />
      <Stack.Screen name="game/first-letter/[id]" options={{ headerShown: true }} />
      <Stack.Screen name="game/word-scramble/[id]" options={{ headerShown: true }} />
      <Stack.Screen name="game/missing-vowels/[id]" options={{ headerShown: true }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    // Delay hiding splash screen to ensure app is ready
    const timer = setTimeout(() => {
      SplashScreen.hideAsync();
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BibleVersionProvider>
          <PrayerProvider>
            <VerseProvider>
              <GestureHandlerRootView style={{ flex: 1 }}>
                <RootLayoutNav />
              </GestureHandlerRootView>
            </VerseProvider>
          </PrayerProvider>
        </BibleVersionProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
