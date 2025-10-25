import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BibleVerse, VerseProgress, GameType, VerseCategory, DifficultyLevel, DIFFICULTY_LEVELS, GameSession, Chapter, CHAPTER_GAME_TYPES, ChapterProgress } from '@/types/verse';
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

  const addToProgress = useCallback((verseId: string, verseOverride?: BibleVerse | Chapter) => {
    if (progress[verseId]) {
      console.log('Already in progress:', verseId);
      return;
    }

    // Check if it's a chapter - use override if provided, otherwise search in chapters
    const chapterOverride = verseOverride && 'verses' in verseOverride ? verseOverride as Chapter : null;
    const chapter = chapterOverride || chapters.find(c => c.id === verseId);
    const isChapter = !!chapter;

    console.log('addToProgress called:', { verseId, isChapter, hasOverride: !!verseOverride, hasChapter: !!chapter });

    if (isChapter && chapter) {
      // Initialize chapter progress
      const now = new Date().toISOString();
      const firstVerse = chapter.verses[0];
      const totalWords = chapter.verses.reduce((sum, v) => sum + v.text.split(' ').length, 0);
      
      const chapterProgress: ChapterProgress = {
        currentVerseIndex: 0,
        unlockedVerses: [0], // Start with first verse unlocked
        masteredVerses: [],
        startedAt: now,
        lastAdvancedAt: now,
        daysInSequence: 1,
        isComplete: false,
      };

      const newProgress: VerseProgress = {
        verseId,
        difficultyLevel: 1,
        addedToProgressAt: now,
        lastReviewedAt: now,
        reviewCount: 0,
        gameSessions: [],
        currentDayGames: CHAPTER_GAME_TYPES,
        completedGamesToday: 0,
        streakDays: 0,
        overallProgress: 0,
        totalCorrectWords: 0,
        totalWords,
        isChapter: true,
        chapterId: verseId,
        chapterProgress,
        lastStreakDate: undefined,
        daysInProgress: 0,
        uniqueDaysWorked: [],
      };

      const updatedProgress = {
        ...progress,
        [verseId]: newProgress,
      };

      console.log('Saving chapter progress:', newProgress);
      saveProgress(updatedProgress);
    } else {
      // Regular verse
      const verse = verseOverride as BibleVerse || [...BIBLE_VERSES, ...customVerses, ...chapters.flatMap(c => c.verses)].find(v => v.id === verseId);
      if (!verse) {
        console.error('Verse not found:', verseId, 'Override:', verseOverride);
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
        lastStreakDate: undefined,
        daysInProgress: 0,
        uniqueDaysWorked: [],
      };

      const updatedProgress = {
        ...progress,
        [verseId]: newProgress,
      };

      saveProgress(updatedProgress);
    }
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

  // Chapter-specific functions
  const unlockNextVerseInChapter = useCallback(async (chapterId: string) => {
    const chapterProgress = progress[chapterId];
    if (!chapterProgress || !chapterProgress.isChapter || !chapterProgress.chapterProgress) {
      console.error('Chapter not found or not a chapter');
      return false;
    }

    const chapter = chapters.find(c => c.id === chapterId);
    if (!chapter) {
      console.error('Chapter data not found');
      return false;
    }

    const cp = chapterProgress.chapterProgress;
    const nextIndex = cp.currentVerseIndex + 1;

    // Check if there's a next verse
    if (nextIndex >= chapter.verses.length) {
      // All verses unlocked
      return false;
    }

    // Unlock the next verse
    const updatedChapterProgress: ChapterProgress = {
      ...cp,
      currentVerseIndex: nextIndex,
      unlockedVerses: [...cp.unlockedVerses, nextIndex],
      lastAdvancedAt: new Date().toISOString(),
      daysInSequence: cp.daysInSequence + 1,
    };

    const updatedProgress = {
      ...progress,
      [chapterId]: {
        ...chapterProgress,
        chapterProgress: updatedChapterProgress,
        completedGamesToday: 0, // Reset daily games for new verse
        lastReviewedAt: new Date().toISOString(),
      },
    };

    await saveProgress(updatedProgress);
    return true;
  }, [progress, chapters]);

  const getChapterUnlockedVerses = useCallback((chapterId: string): BibleVerse[] => {
    const chapterProgress = progress[chapterId];
    if (!chapterProgress || !chapterProgress.isChapter || !chapterProgress.chapterProgress) {
      return [];
    }

    const chapter = chapters.find(c => c.id === chapterId);
    if (!chapter) {
      return [];
    }

    const unlockedIndices = chapterProgress.chapterProgress.unlockedVerses;
    return chapter.verses.filter((_, index) => unlockedIndices.includes(index));
  }, [progress, chapters]);

  const advanceChapterProgress = useCallback(async (chapterId: string, verseIndex: number) => {
    const chapterProgress = progress[chapterId];
    if (!chapterProgress || !chapterProgress.isChapter || !chapterProgress.chapterProgress) {
      return;
    }

    const chapter = chapters.find(c => c.id === chapterId);
    if (!chapter) {
      return;
    }

    const cp = chapterProgress.chapterProgress;
    
    // Mark verse as mastered if not already
    let updatedMasteredVerses = [...cp.masteredVerses];
    if (!updatedMasteredVerses.includes(verseIndex)) {
      updatedMasteredVerses.push(verseIndex);
    }

    // Check if chapter is complete
    const isComplete = updatedMasteredVerses.length === chapter.verses.length;

    // Calculate overall progress based on mastered verses
    const overallProgress = Math.round((updatedMasteredVerses.length / chapter.verses.length) * 100);

    const updatedChapterProgress: ChapterProgress = {
      ...cp,
      masteredVerses: updatedMasteredVerses,
      isComplete,
    };

    const updatedProgress = {
      ...progress,
      [chapterId]: {
        ...chapterProgress,
        chapterProgress: updatedChapterProgress,
        overallProgress,
        lastReviewedAt: new Date().toISOString(),
      },
    };

    await saveProgress(updatedProgress);
  }, [progress, chapters]);

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
    const timestamp = Date.now();
    const chapterId = `chapter-${timestamp}`;
    const newChapter: Chapter = {
      ...chapter,
      id: chapterId,
      isCustom: true,
      verses: chapter.verses.map((v, i) => ({
        ...v,
        id: `${chapterId}-verse-${i}`,
        isCustom: true,
        chapterId,
      })),
    };
    const updated = [...chapters, newChapter];
    setChapters(updated);
    try {
      await AsyncStorage.setItem(CHAPTERS_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save chapter:', error);
    }
    return newChapter;
  }, [chapters]);

  const deleteCustomVerse = useCallback(async (verseId: string) => {
    const updated = customVerses.filter(v => v.id !== verseId);
    setCustomVerses(updated);
    try {
      await AsyncStorage.setItem(CUSTOM_VERSES_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to delete custom verse:', error);
    }
  }, [customVerses]);

  const deleteCustomChapter = useCallback(async (chapterId: string) => {
    const updated = chapters.filter(c => c.id !== chapterId);
    setChapters(updated);
    try {
      await AsyncStorage.setItem(CHAPTERS_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to delete chapter:', error);
    }
  }, [chapters]);

  const updateVerseCategory = useCallback(async (verseId: string, newCategory: VerseCategory) => {
    const updated = customVerses.map(v => 
      v.id === verseId ? { ...v, category: newCategory } : v
    );
    setCustomVerses(updated);
    try {
      await AsyncStorage.setItem(CUSTOM_VERSES_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to update verse category:', error);
    }
  }, [customVerses]);

  const updateChapterCategory = useCallback(async (chapterId: string, newCategory: VerseCategory) => {
    const updated = chapters.map(c => 
      c.id === chapterId ? { 
        ...c, 
        category: newCategory,
        verses: c.verses.map(v => ({ ...v, category: newCategory }))
      } : c
    );
    setChapters(updated);
    try {
      await AsyncStorage.setItem(CHAPTERS_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to update chapter category:', error);
    }
  }, [chapters]);

  const bulkDeleteCustomVerses = useCallback(async (verseIds: string[]) => {
    const updated = customVerses.filter(v => !verseIds.includes(v.id));
    setCustomVerses(updated);
    try {
      await AsyncStorage.setItem(CUSTOM_VERSES_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to bulk delete verses:', error);
    }
  }, [customVerses]);

  const bulkDeleteCustomChapters = useCallback(async (chapterIds: string[]) => {
    const updated = chapters.filter(c => !chapterIds.includes(c.id));
    setChapters(updated);
    try {
      await AsyncStorage.setItem(CHAPTERS_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to bulk delete chapters:', error);
    }
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
    unlockNextVerseInChapter,
    getChapterUnlockedVerses,
    advanceChapterProgress,
    deleteCustomVerse,
    deleteCustomChapter,
    updateVerseCategory,
    updateChapterCategory,
    bulkDeleteCustomVerses,
    bulkDeleteCustomChapters,
  }), [progress, isLoading, addToProgress, completeGameSession, getVerseProgress, getVersesByCategory, versesInProgress, dueVersesCount, addCustomVerse, addChapter, chapters, customVerses, allVerses, advanceToNextLevel, getFirstIncompleteLevel, resetToLevel, deleteVerse, archiveVerse, unarchiveVerse, archivedVerses, unlockNextVerseInChapter, getChapterUnlockedVerses, advanceChapterProgress, deleteCustomVerse, deleteCustomChapter, updateVerseCategory, updateChapterCategory, bulkDeleteCustomVerses, bulkDeleteCustomChapters]);
});

export const useFilteredVerses = (category: VerseCategory | null) => {
  const { verses } = useVerses();
  return useMemo(() => {
    if (!category) return verses;
    return verses.filter(v => v.category === category);
  }, [verses, category]);
};
