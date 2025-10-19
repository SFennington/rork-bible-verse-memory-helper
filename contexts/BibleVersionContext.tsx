import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BIBLE_VERSION_STORAGE_KEY = 'bible_version';

export type BibleVersion = {
  id: string;
  name: string;
  abbreviation: string;
};

export const BIBLE_VERSIONS: BibleVersion[] = [
  { id: 'kjv', name: 'King James Version', abbreviation: 'KJV' },
  { id: 'niv', name: 'New International Version', abbreviation: 'NIV' },
  { id: 'esv', name: 'English Standard Version', abbreviation: 'ESV' },
  { id: 'nkjv', name: 'New King James Version', abbreviation: 'NKJV' },
  { id: 'nlt', name: 'New Living Translation', abbreviation: 'NLT' },
  { id: 'nasb', name: 'New American Standard Bible', abbreviation: 'NASB' },
  { id: 'csb', name: 'Christian Standard Bible', abbreviation: 'CSB' },
  { id: 'msg', name: 'The Message', abbreviation: 'MSG' },
];

export const [BibleVersionProvider, useBibleVersion] = createContextHook(() => {
  const [selectedVersion, setSelectedVersion] = useState<BibleVersion>(BIBLE_VERSIONS[0]);
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
