import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setGlobalApiKey } from '@/services/bibleApi';

interface ApiKeyContextType {
  apiKey: string | null;
  setApiKey: (key: string) => Promise<void>;
  isLoading: boolean;
}

const ApiKeyContext = createContext<ApiKeyContextType | undefined>(undefined);

const API_KEY_STORAGE_KEY = '@bible_api_key';

export function ApiKeyProvider({ children }: { children: React.ReactNode }) {
  const [apiKey, setApiKeyState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load API key from storage on mount
  useEffect(() => {
    loadApiKey();
  }, []);

  const loadApiKey = async () => {
    try {
      const storedKey = await AsyncStorage.getItem(API_KEY_STORAGE_KEY);
      setApiKeyState(storedKey);
      setGlobalApiKey(storedKey); // Sync with Bible API service
    } catch (error) {
      console.error('Error loading API key:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setApiKey = async (key: string) => {
    try {
      const trimmedKey = key.trim();
      if (trimmedKey) {
        await AsyncStorage.setItem(API_KEY_STORAGE_KEY, trimmedKey);
        setApiKeyState(trimmedKey);
        setGlobalApiKey(trimmedKey); // Sync with Bible API service
      } else {
        await AsyncStorage.removeItem(API_KEY_STORAGE_KEY);
        setApiKeyState(null);
        setGlobalApiKey(null); // Sync with Bible API service
      }
    } catch (error) {
      console.error('Error saving API key:', error);
      throw error;
    }
  };

  return (
    <ApiKeyContext.Provider value={{ apiKey, setApiKey, isLoading }}>
      {children}
    </ApiKeyContext.Provider>
  );
}

export function useApiKey() {
  const context = useContext(ApiKeyContext);
  if (context === undefined) {
    throw new Error('useApiKey must be used within an ApiKeyProvider');
  }
  return context;
}

