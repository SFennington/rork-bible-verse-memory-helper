import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BibleVerse, VerseProgress, GameType, VerseCategory, DifficultyLevel, DIFFICULTY_LEVELS, GameSession, Chapter } from '@/types/verse';
import { BIBLE_VERSES } from '@/mocks/verses';

const STORAGE_KEY = 'verse_progress';
const CUSTOM_VERSES_KEY = 'custom_verses';
const CHAPTERS_KEY = 'chapters';

function isToday(dateString: string): boolean {
  const date = new Date(dateString);
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

export const [VerseProvider, useVerses] = createContextHook(() => {
  const [progress, setProgress] = useState<Record<string, VerseProgress>>({});
  const [customVerses, setCustomVerses] = useState<BibleVerse[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProgress();
    loadCustomVerses();
    loadChapters();
  }, []);

  const loadProgress = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setProgress(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load progress:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCustomVerses = async () => {
    try {
      const stored = await AsyncStorage.getItem(CUSTOM_VERSES_KEY);
      if (stored) {
        setCustomVerses(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load custom verses:', error);
    }
  };

  const loadChapters = async () => {
    try {
      const stored = await AsyncStorage.getItem(CHAPTERS_KEY);
      if (stored) {
        setChapters(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load chapters:', error);
    }
  };

  const saveProgress = async (newProgress: Record<string, VerseProgress>) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newProgress));
      setProgress(newProgress);
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  };

  const addToProgress = useCallback((verseId: string) => {
    if (progress[verseId]) {
      console.log('Verse already in progress');
      return;
    }

    const verse = [...BIBLE_VERSES, ...customVerses, ...chapters.flatMap(c => c.verses)].find(v => v.id === verseId);
    if (!verse) {
      console.error('Verse not found');
      return;
    }

    const totalWords = verse.text.split(' ').length;
    const now = new Date().toISOString();
    const newProgress: VerseProgress = {
      verseId,
      difficultyLevel: 1,
      addedToProgressAt: now,
      lastReviewedAt: now,
      reviewCount: 0,
      gameSessions: [],
      currentDayGames: DIFFICULTY_LEVELS[1],
      completedGamesToday: 0,
      streakDays: 0,
      overallProgress: 0,
      totalCorrectWords: 0,
      totalWords,
    };

    const updatedProgress = {
      ...progress,
      [verseId]: newProgress,
    };

    saveProgress(updatedProgress);
  }, [progress, customVerses, chapters]);

  const completeGameSession = useCallback((verseId: string, session: GameSession) => {
    const verseProgress = progress[verseId];
    if (!verseProgress) {
      console.error('Verse not in progress');
      return;
    }

    const now = new Date();
    const updatedSessions = [...verseProgress.gameSessions, session];
    
    const todaysSessions = updatedSessions.filter(s => isToday(s.completedAt));
    const completedGamesToday = todaysSessions.length;
    
    const requiredGamesPerLevel = [
      0,
      3,
      3,
      3,
      3,
      1,
    ];
    
    const totalRequiredGames = requiredGamesPerLevel.reduce((sum, count) => sum + count, 0);
    const verse = [...BIBLE_VERSES, ...customVerses, ...chapters.flatMap(c => c.verses)].find(v => v.id === verseId);
    const totalWordsInVerse = verse ? verse.text.split(' ').length : 0;
    
    const totalCorrectWordsAccumulated = updatedSessions.reduce((sum, s) => {
      return sum + (s.correctWords || 0);
    }, 0);
    
    const totalPossibleWords = totalRequiredGames * totalWordsInVerse;
    const overallProgress = totalPossibleWords > 0 
      ? Math.min(100, Math.round((totalCorrectWordsAccumulated / totalPossibleWords) * 100))
      : 0;

    const requiredGames = requiredGamesPerLevel[verseProgress.difficultyLevel];
    const allGamesCompletedToday = completedGamesToday >= requiredGames;
    const avgAccuracyToday = todaysSessions.reduce((sum, s) => sum + s.accuracy, 0) / todaysSessions.length;
    
    let newDifficultyLevel = verseProgress.difficultyLevel;
    let newStreakDays = verseProgress.streakDays;
    let newReviewCount = verseProgress.reviewCount;

    const wasCompletedBefore = verseProgress.completedGamesToday >= requiredGames;
    if (allGamesCompletedToday && !wasCompletedBefore) {
      newStreakDays = verseProgress.streakDays + 1;
      newReviewCount = verseProgress.reviewCount + 1;
      
      if (avgAccuracyToday >= 85 && verseProgress.difficultyLevel < 5) {
        newDifficultyLevel = (verseProgress.difficultyLevel + 1) as DifficultyLevel;
      }
    }

    const lastReviewedAt = now.toISOString();

    const updatedProgress = {
      ...progress,
      [verseId]: {
        ...verseProgress,
        difficultyLevel: newDifficultyLevel,
        lastReviewedAt,
        reviewCount: newReviewCount,
        gameSessions: updatedSessions,
        currentDayGames: DIFFICULTY_LEVELS[newDifficultyLevel],
        completedGamesToday,
        streakDays: newStreakDays,
        overallProgress,
        totalCorrectWords: totalCorrectWordsAccumulated,
        totalWords: totalPossibleWords,
      },
    };

    saveProgress(updatedProgress);
  }, [progress]);

  const advanceToNextLevel = useCallback((verseId: string) => {
    const verseProgress = progress[verseId];
    if (!verseProgress) {
      console.error('Verse not in progress');
      return;
    }

    const newDifficultyLevel = Math.min(5, verseProgress.difficultyLevel + 1) as DifficultyLevel;
    
    const updatedProgress = {
      ...progress,
      [verseId]: {
        ...verseProgress,
        difficultyLevel: newDifficultyLevel,
        currentDayGames: DIFFICULTY_LEVELS[newDifficultyLevel],
        completedGamesToday: 0,
        lastReviewedAt: new Date().toISOString(),
      },
    };

    saveProgress(updatedProgress);
  }, [progress]);

  const resetDailyProgress = useCallback(() => {
    const updatedProgress = { ...progress };
    let hasChanges = false;

    Object.keys(updatedProgress).forEach(verseId => {
      const verseProgress = updatedProgress[verseId];
      const requiredGames = verseProgress.difficultyLevel === 5 ? 1 : 3;
      if (verseProgress.completedGamesToday >= requiredGames && !isToday(verseProgress.lastReviewedAt)) {
        const newDifficultyLevel = Math.min(5, verseProgress.difficultyLevel + 1) as DifficultyLevel;
        updatedProgress[verseId] = {
          ...verseProgress,
          difficultyLevel: newDifficultyLevel,
          currentDayGames: DIFFICULTY_LEVELS[newDifficultyLevel],
          completedGamesToday: 0,
        };
        hasChanges = true;
      }
    });

    if (hasChanges) {
      saveProgress(updatedProgress);
    }
  }, [progress]);

  useEffect(() => {
    resetDailyProgress();
  }, []);

  const getVerseProgress = useCallback((verseId: string): VerseProgress | undefined => {
    return progress[verseId];
  }, [progress]);

  const addCustomVerse = useCallback(async (verse: Omit<BibleVerse, 'id' | 'isCustom'>) => {
    const newVerse: BibleVerse = {
      ...verse,
      id: `custom-${Date.now()}`,
      isCustom: true,
    };
    const updated = [...customVerses, newVerse];
    setCustomVerses(updated);
    try {
      await AsyncStorage.setItem(CUSTOM_VERSES_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save custom verse:', error);
    }
    return newVerse.id;
  }, [customVerses]);

  const addChapter = useCallback(async (chapter: Omit<Chapter, 'id' | 'isCustom'>) => {
    const newChapter: Chapter = {
      ...chapter,
      id: `chapter-${Date.now()}`,
      isCustom: true,
      verses: chapter.verses.map((v, i) => ({
        ...v,
        id: `chapter-${Date.now()}-verse-${i}`,
        isCustom: true,
        chapterId: `chapter-${Date.now()}`,
      })),
    };
    const updated = [...chapters, newChapter];
    setChapters(updated);
    try {
      await AsyncStorage.setItem(CHAPTERS_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save chapter:', error);
    }
    return newChapter.id;
  }, [chapters]);

  const allVerses = useMemo(() => {
    const chapterVerses = chapters.flatMap(c => c.verses);
    return [...BIBLE_VERSES, ...customVerses, ...chapterVerses];
  }, [customVerses, chapters]);

  const getVersesByCategory = useCallback((category: VerseCategory | null): BibleVerse[] => {
    if (!category) return allVerses;
    return allVerses.filter(v => v.category === category);
  }, [allVerses]);

  const versesInProgress = useMemo(() => {
    return Object.values(progress)
      .map(p => {
        const verse = allVerses.find(v => v.id === p.verseId);
        return verse ? { verse, progress: p } : null;
      })
      .filter((item): item is { verse: BibleVerse; progress: VerseProgress } => item !== null)
      .sort((a, b) => {
        const aRequiredGames = a.progress.difficultyLevel === 5 ? 1 : 3;
        const bRequiredGames = b.progress.difficultyLevel === 5 ? 1 : 3;
        const aIncomplete = a.progress.completedGamesToday < aRequiredGames;
        const bIncomplete = b.progress.completedGamesToday < bRequiredGames;
        if (aIncomplete && !bIncomplete) return -1;
        if (!aIncomplete && bIncomplete) return 1;
        return b.progress.overallProgress - a.progress.overallProgress;
      });
  }, [progress, allVerses]);

  const dueVersesCount = useMemo(() => {
    return Object.values(progress).filter(p => {
      const requiredGames = p.difficultyLevel === 5 ? 1 : 3;
      return p.completedGamesToday < requiredGames;
    }).length;
  }, [progress]);

  return useMemo(() => ({
    verses: allVerses,
    progress,
    isLoading,
    addToProgress,
    completeGameSession,
    getVerseProgress,
    getVersesByCategory,
    versesInProgress,
    dueVersesCount,
    addCustomVerse,
    addChapter,
    chapters,
    customVerses,
    advanceToNextLevel,
  }), [progress, isLoading, addToProgress, completeGameSession, getVerseProgress, getVersesByCategory, versesInProgress, dueVersesCount, addCustomVerse, addChapter, chapters, customVerses, allVerses, advanceToNextLevel]);
});

export const useFilteredVerses = (category: VerseCategory | null) => {
  const { verses } = useVerses();
  return useMemo(() => {
    if (!category) return verses;
    return verses.filter(v => v.category === category);
  }, [verses, category]);
};
