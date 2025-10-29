import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BIBLE_VERSION_STORAGE_KEY = 'bible_version';

export type BibleVersion = {
  id: string;
  name: string;
  abbreviation: string;
  canFetch?: boolean; // Whether this version can be fetched from API
};

export const BIBLE_VERSIONS: BibleVersion[] = [
  // Fetchable versions first
  { id: 'kjv', name: 'King James Version', abbreviation: 'KJV', canFetch: true },
  { id: 'web', name: 'World English Bible', abbreviation: 'WEB', canFetch: true },
  
  // Paste-only versions (alphabetically)
  { id: 'amp', name: 'Amplified Bible', abbreviation: 'AMP', canFetch: false },
  { id: 'csb', name: 'Christian Standard Bible', abbreviation: 'CSB', canFetch: false },
  { id: 'ehv', name: 'English Heritage Version', abbreviation: 'EHV', canFetch: false },
  { id: 'esv', name: 'English Standard Version', abbreviation: 'ESV', canFetch: false },
  { id: 'msg', name: 'The Message', abbreviation: 'MSG', canFetch: false },
  { id: 'nasb', name: 'New American Standard Bible', abbreviation: 'NASB', canFetch: false },
  { id: 'niv', name: 'New International Version', abbreviation: 'NIV', canFetch: false },
  { id: 'nkjv', name: 'New King James Version', abbreviation: 'NKJV', canFetch: false },
  { id: 'nlt', name: 'New Living Translation', abbreviation: 'NLT', canFetch: false },
  { id: 'tpt', name: 'The Passion Translation', abbreviation: 'TPT', canFetch: false },
];

export const [BibleVersionProvider, useBibleVersion] = createContextHook(() => {
  const [selectedVersion, setSelectedVersion] = useState<BibleVersion>(BIBLE_VERSIONS[0]); // Now defaults to KJV
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadVersion();
  }, []);

  const loadVersion = async () => {
    try {
      const stored = await AsyncStorage.getItem(BIBLE_VERSION_STORAGE_KEY);
      if (stored) {
        const version = BIBLE_VERSIONS.find(v => v.id === stored);
        if (version) {
          setSelectedVersion(version);
        }
      }
    } catch (error) {
      console.error('Failed to load bible version:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveVersion = useCallback(async (version: BibleVersion) => {
    try {
      await AsyncStorage.setItem(BIBLE_VERSION_STORAGE_KEY, version.id);
      setSelectedVersion(version);
    } catch (error) {
      console.error('Failed to save bible version:', error);
    }
  }, []);

  return useMemo(() => ({
    selectedVersion,
    setSelectedVersion: saveVersion,
    availableVersions: BIBLE_VERSIONS,
    isLoading,
  }), [selectedVersion, saveVersion, isLoading]);
});
