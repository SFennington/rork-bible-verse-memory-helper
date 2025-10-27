import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Slot } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { VerseProvider } from "@/contexts/VerseContext";
import { PrayerProvider } from "@/contexts/PrayerContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { BibleVersionProvider } from "@/contexts/BibleVersionContext";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

export default function RootLayout() {
  useEffect(() => {
    // Delay hiding splash screen to ensure app is ready
    const timer = setTimeout(() => {
      SplashScreen.hideAsync();
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <BibleVersionProvider>
            <PrayerProvider>
              <VerseProvider>
                <Slot />
              </VerseProvider>
            </PrayerProvider>
          </BibleVersionProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
