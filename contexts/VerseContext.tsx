import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BibleVerse, VerseProgress, GameType, VerseCategory, DifficultyLevel, DIFFICULTY_LEVELS, GameSession, Chapter } from '@/types/verse';
import { BIBLE_VERSES } from '@/mocks/verses';

const STORAGE_KEY = 'verse_progress';
const CUSTOM_VERSES_KEY = 'custom_verses';
const CHAPTERS_KEY = 'chapters';
const ARCHIVED_KEY = 'archived_verses';

function isToday(dateString: string): boolean {
  const date = new Date(dateString);
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

function getDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

function isSameDay(date1: string, date2: string): boolean {
  return getDateString(new Date(date1)) === getDateString(new Date(date2));
}

export const [VerseProvider, useVerses] = createContextHook(() => {
  const [progress, setProgress] = useState<Record<string, VerseProgress>>({});
  const [customVerses, setCustomVerses] = useState<BibleVerse[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [archivedProgress, setArchivedProgress] = useState<Record<string, VerseProgress>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProgress();
    loadCustomVerses();
    loadChapters();
    loadArchivedProgress();
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

  const loadArchivedProgress = async () => {
    try {
      const stored = await AsyncStorage.getItem(ARCHIVED_KEY);
      if (stored) {
        setArchivedProgress(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load archived progress:', error);
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

  const saveArchivedProgress = async (newArchived: Record<string, VerseProgress>) => {
    try {
      await AsyncStorage.setItem(ARCHIVED_KEY, JSON.stringify(newArchived));
      setArchivedProgress(newArchived);
    } catch (error) {
      console.error('Failed to save archived progress:', error);
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
    const today = getDateString(new Date());
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
      lastStreakDate: undefined,
      daysInProgress: 0,
      uniqueDaysWorked: [],
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
    
    const sessionsForCurrentLevel = updatedSessions.filter(s => s.difficultyLevel === verseProgress.difficultyLevel);
    const todaysSessions = updatedSessions.filter(s => isToday(s.completedAt) && s.difficultyLevel === verseProgress.difficultyLevel);
    const completedGamesToday = todaysSessions.length;
    
    const requiredGamesPerLevel = [
      0,
      3,
      3,
      3,
      3,
      1,
    ];

    const today = getDateString(now);
    const lastStreakDate = verseProgress.lastStreakDate;
    const uniqueDaysWorked = verseProgress.uniqueDaysWorked || [];
    const existingDaysInProgress = verseProgress.daysInProgress || 0;
    
    const verse = [...BIBLE_VERSES, ...customVerses, ...chapters.flatMap(c => c.verses)].find(v => v.id === verseId);
    const totalWordsInVerse = verse ? verse.text.split(' ').length : 0;
    
    const totalCompletedLevels = Math.max(0, verseProgress.difficultyLevel - 1);
    const currentLevelSessions = sessionsForCurrentLevel.length;
    const currentLevelRequired = requiredGamesPerLevel[verseProgress.difficultyLevel];
    
    const completedLevelsWords = totalCompletedLevels * 3 * totalWordsInVerse;
    const currentLevelCorrectWords = sessionsForCurrentLevel.reduce((sum, s) => sum + (s.correctWords || 0), 0);
    
    const totalCorrectWords = completedLevelsWords + currentLevelCorrectWords;
    const totalRequiredGames = requiredGamesPerLevel.reduce((sum, count) => sum + count, 0);
    const totalPossibleWords = totalRequiredGames * totalWordsInVerse;
    
    const overallProgress = totalPossibleWords > 0 
      ? Math.min(100, Math.round((totalCorrectWords / totalPossibleWords) * 100))
      : 0;

    const requiredGames = requiredGamesPerLevel[verseProgress.difficultyLevel];
    const allGamesCompletedToday = completedGamesToday >= requiredGames;
    const avgAccuracyToday = todaysSessions.reduce((sum, s) => sum + s.accuracy, 0) / todaysSessions.length;
    
    let newDifficultyLevel = verseProgress.difficultyLevel;
    let newStreakDays = verseProgress.streakDays;
    let newReviewCount = verseProgress.reviewCount;
    let newLastStreakDate = lastStreakDate;
    let newUniqueDaysWorked = [...uniqueDaysWorked];
    let newDaysInProgress = existingDaysInProgress;

    const isNewDay = !uniqueDaysWorked.includes(today);
    if (isNewDay) {
      newUniqueDaysWorked.push(today);
      newDaysInProgress += 1;
    }

    const wasCompletedBefore = verseProgress.completedGamesToday >= requiredGames;
    if (allGamesCompletedToday && !wasCompletedBefore) {
      newReviewCount = verseProgress.reviewCount + 1;
      
      if (!lastStreakDate) {
        newStreakDays = 1;
        newLastStreakDate = today;
      } else {
        const yesterday = getDateString(new Date(Date.now() - 86400000));
        if (lastStreakDate === yesterday) {
          newStreakDays = verseProgress.streakDays + 1;
          newLastStreakDate = today;
        } else if (lastStreakDate === today) {
          newStreakDays = verseProgress.streakDays;
          newLastStreakDate = today;
        } else {
          newStreakDays = 1;
          newLastStreakDate = today;
        }
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
        totalCorrectWords,
        totalWords: totalPossibleWords,
        lastStreakDate: newLastStreakDate,
        daysInProgress: newDaysInProgress,
        uniqueDaysWorked: newUniqueDaysWorked,
      },
    };

    saveProgress(updatedProgress);
  }, [progress, customVerses, chapters]);

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

  const getFirstIncompleteLevel = useCallback((verseId: string): DifficultyLevel | null => {
    const verseProgress = progress[verseId];
    if (!verseProgress) return null;

    const verse = [...BIBLE_VERSES, ...customVerses, ...chapters.flatMap(c => c.verses)].find(v => v.id === verseId);
    if (!verse) return null;

    const totalWordsInVerse = verse.text.split(' ').length;
    const requiredGamesPerLevel = [0, 3, 3, 3, 3, 1];

    for (let level = 1; level <= 5; level++) {
      const levelSessions = verseProgress.gameSessions.filter(s => s.difficultyLevel === level);
      const requiredGames = requiredGamesPerLevel[level];
      const totalPossibleWords = requiredGames * totalWordsInVerse;
      const totalCorrectWords = levelSessions.reduce((sum, s) => sum + (s.correctWords || 0), 0);
      const levelProgress = totalPossibleWords > 0 ? (totalCorrectWords / totalPossibleWords) * 100 : 0;

      if (levelProgress < 100) {
        return level as DifficultyLevel;
      }
    }

    return null;
  }, [progress, customVerses, chapters]);

  const resetToLevel = useCallback((verseId: string, targetLevel: DifficultyLevel) => {
    const verseProgress = progress[verseId];
    if (!verseProgress) {
      console.error('Verse not in progress');
      return;
    }

    const updatedProgress = {
      ...progress,
      [verseId]: {
        ...verseProgress,
        difficultyLevel: targetLevel,
        currentDayGames: DIFFICULTY_LEVELS[targetLevel],
        completedGamesToday: 0,
        lastReviewedAt: new Date().toISOString(),
      },
    };

    saveProgress(updatedProgress);
  }, [progress]);

  const deleteVerse = useCallback(async (verseId: string) => {
    const updatedProgress = { ...progress };
    delete updatedProgress[verseId];
    await saveProgress(updatedProgress);
  }, [progress]);

  const archiveVerse = useCallback(async (verseId: string) => {
    const verseProgress = progress[verseId];
    if (!verseProgress) {
      console.error('Verse not in progress');
      return;
    }

    const archivedVerse = {
      ...verseProgress,
      isArchived: true,
      archivedAt: new Date().toISOString(),
    };

    const updatedProgress = { ...progress };
    delete updatedProgress[verseId];
    await saveProgress(updatedProgress);

    const updatedArchived = {
      ...archivedProgress,
      [verseId]: archivedVerse,
    };
    await saveArchivedProgress(updatedArchived);
  }, [progress, archivedProgress]);

  const unarchiveVerse = useCallback(async (verseId: string) => {
    const verse = archivedProgress[verseId];
    if (!verse) {
      console.error('Verse not archived');
      return;
    }

    const { isArchived, archivedAt, ...verseData } = verse;

    const updatedProgress = {
      ...progress,
      [verseId]: verseData,
    };
    await saveProgress(updatedProgress);

    const updatedArchived = { ...archivedProgress };
    delete updatedArchived[verseId];
    await saveArchivedProgress(updatedArchived);
  }, [progress, archivedProgress]);

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
      .filter(p => !p.isArchived)
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

  const archivedVerses = useMemo(() => {
    return Object.values(archivedProgress)
      .map(p => {
        const verse = allVerses.find(v => v.id === p.verseId);
        return verse ? { verse, progress: p } : null;
      })
      .filter((item): item is { verse: BibleVerse; progress: VerseProgress } => item !== null)
      .sort((a, b) => new Date(b.progress.archivedAt || 0).getTime() - new Date(a.progress.archivedAt || 0).getTime());
  }, [archivedProgress, allVerses]);

  const dueVersesCount = useMemo(() => {
    return Object.values(progress).filter(p => {
      const requiredGames = p.difficultyLevel === 5 ? 1 : 3;
      return p.completedGamesToday < requiredGames && !p.isArchived;
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
    getFirstIncompleteLevel,
    resetToLevel,
    deleteVerse,
    archiveVerse,
    unarchiveVerse,
    archivedVerses,
  }), [progress, isLoading, addToProgress, completeGameSession, getVerseProgress, getVersesByCategory, versesInProgress, dueVersesCount, addCustomVerse, addChapter, chapters, customVerses, allVerses, advanceToNextLevel, getFirstIncompleteLevel, resetToLevel, deleteVerse, archiveVerse, unarchiveVerse, archivedVerses]);
});

export const useFilteredVerses = (category: VerseCategory | null) => {
  const { verses } = useVerses();
  return useMemo(() => {
    if (!category) return verses;
    return verses.filter(v => v.category === category);
  }, [verses, category]);
};
