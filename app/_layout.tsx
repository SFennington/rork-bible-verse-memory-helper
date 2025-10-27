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
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="index" />
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen name="add-prayer" options={{ headerShown: true, title: 'Add Prayer' }} />
                  <Stack.Screen name="add-verse" options={{ headerShown: true, title: 'Add Verse' }} />
                  <Stack.Screen name="prayer/[id]" options={{ headerShown: true }} />
                  <Stack.Screen name="verse/[id]" options={{ headerShown: true }} />
                  <Stack.Screen 
                    name="game/fill-blank/[id]" 
                    options={{ headerShown: true, title: 'Fill in the Blank' }} 
                  />
                  <Stack.Screen 
                    name="game/word-order/[id]" 
                    options={{ headerShown: true, title: 'Word Order' }} 
                  />
                  <Stack.Screen 
                    name="game/first-letter/[id]" 
                    options={{ headerShown: true, title: 'First Letter' }} 
                  />
                  <Stack.Screen 
                    name="game/word-scramble/[id]" 
                    options={{ headerShown: true, title: 'Word Scramble' }} 
                  />
                  <Stack.Screen 
                    name="game/missing-vowels/[id]" 
                    options={{ headerShown: true, title: 'Missing Vowels' }} 
                  />
                  <Stack.Screen 
                    name="game/full-verse/[id]" 
                    options={{ headerShown: true, title: 'Full Verse' }} 
                  />
                  <Stack.Screen 
                    name="game/verse-order/[id]" 
                    options={{ headerShown: true, title: 'Verse Order' }} 
                  />
                  <Stack.Screen 
                    name="game/speed-tap/[id]" 
                    options={{ headerShown: true, title: 'Speed Tap' }} 
                  />
                  <Stack.Screen 
                    name="game/progressive-reveal/[id]" 
                    options={{ headerShown: true, title: 'Progressive Reveal' }} 
                  />
                  <Stack.Screen 
                    name="game/progressive-review/[id]" 
                    options={{ headerShown: true, title: 'Progressive Review' }} 
                  />
                  <Stack.Screen 
                    name="game/flashcard/[id]" 
                    options={{ headerShown: true, title: 'Flashcard' }} 
                  />
                  <Stack.Screen name="progress" options={{ headerShown: true, title: 'Progress' }} />
                </Stack>
              </VerseProvider>
            </PrayerProvider>
          </BibleVersionProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
