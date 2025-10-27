import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BibleVerse, VerseProgress, GameType, VerseCategory, DifficultyLevel, DIFFICULTY_LEVELS, GameSession, Chapter, CHAPTER_SINGLE_VERSE_GAMES, CHAPTER_MULTI_VERSE_GAMES, ChapterProgress } from '@/types/verse';
import { BIBLE_VERSES } from '@/mocks/verses';
import { isToday, getDateString, isSameDay, shouldBreakStreak, getYesterday } from '@/utils/dateUtils';
import { useDateChange } from '@/hooks/useDateChange';

const STORAGE_KEY = 'verse_progress';
const CUSTOM_VERSES_KEY = 'custom_verses';
const CHAPTERS_KEY = 'chapters';
const ARCHIVED_KEY = 'archived_verses';

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

  // Handle date changes (midnight rollover)
  useDateChange(useCallback(() => {
    console.log('📅 Date changed! Resetting daily verse progress...');
    resetDailyProgress();
  }, [progress]));

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

  const addToProgress = useCallback(async (verseId: string, verseOverride?: BibleVerse | Chapter) => {
    console.log('=== ADD TO PROGRESS DEBUG START ===');
    console.log('1. Input verseId:', verseId);
    console.log('2. Has verseOverride:', !!verseOverride);
    console.log('3. Total chapters in state:', chapters.length);
    console.log('4. Chapter IDs in state:', chapters.map(c => c.id));
    
    if (progress[verseId]) {
      console.log('5. Already in progress:', verseId);
      console.log('=== ADD TO PROGRESS DEBUG END (already exists) ===');
      return;
    }

    // Check if it's a chapter - use override if provided, otherwise search in chapters
    const chapterOverride = verseOverride && 'verses' in verseOverride ? verseOverride as Chapter : null;
    const chapter = chapterOverride || chapters.find(c => c.id === verseId);
    const isChapter = !!chapter;

    console.log('5. Chapter override:', chapterOverride ? 'YES' : 'NO');
    console.log('6. Found chapter in state:', chapter ? 'YES' : 'NO');
    console.log('7. Is chapter:', isChapter);
    console.log('8. Chapter data:', chapter ? { id: chapter.id, reference: chapter.reference, versesCount: chapter.verses.length } : 'NULL');

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

      // Use single verse games when only 1 verse is unlocked
      const initialGames = CHAPTER_SINGLE_VERSE_GAMES;

      const newProgress: VerseProgress = {
        verseId,
        difficultyLevel: 1,
        addedToProgressAt: now,
        lastReviewedAt: now,
        reviewCount: 0,
        gameSessions: [],
        currentDayGames: initialGames,
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

      console.log('9. Chapter progress object created:', JSON.stringify(newProgress, null, 2));
      console.log('10. About to save to AsyncStorage...');
      await saveProgress(updatedProgress);
      console.log('11. AsyncStorage save completed');
      console.log('12. State should update now');
      console.log('=== ADD TO PROGRESS DEBUG END (chapter saved) ===');
    } else {
      console.log('9. NOT A CHAPTER - processing as regular verse');
      console.log('10. Verse override:', verseOverride);
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

      console.log('11. Verse progress saved');
      await saveProgress(updatedProgress);
      console.log('=== ADD TO PROGRESS DEBUG END (verse saved) ===');
    }
  }, [progress, customVerses, chapters]);

  const completeGameSession = useCallback(async (verseId: string, session: GameSession) => {
    const verseProgress = progress[verseId];
    if (!verseProgress) {
      console.error('❌ Verse not in progress:', verseId);
      console.error('Available progress IDs:', Object.keys(progress));
      console.error('Session details:', session);
      return;
    }
    
    console.log('✅ Completing game session for:', verseId, 'Game:', session.gameType);

    const now = new Date();
    const updatedSessions = [...verseProgress.gameSessions, session];
    
    const sessionsForCurrentLevel = updatedSessions.filter(s => s.difficultyLevel === verseProgress.difficultyLevel);
    const todaysSessions = updatedSessions.filter(s => isToday(s.completedAt) && s.difficultyLevel === verseProgress.difficultyLevel);
    const completedGamesToday = todaysSessions.length;
    
    // For chapters: always 2 games. For verses: 3 games per level, except level 5 (1 game)
    const requiredGamesPerLevel = [
      0,  // Level 0 (not used)
      3,  // Level 1
      3,  // Level 2
      3,  // Level 3
      3,  // Level 4
      1,  // Level 5 (master)
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

    // Calculate required games: 2 for chapters, otherwise use level-based requirements
    const requiredGames = verseProgress.isChapter ? 2 : requiredGamesPerLevel[verseProgress.difficultyLevel];
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

    // Determine the correct games for next time
    let nextDayGames: GameType[];
    if (verseProgress.isChapter && verseProgress.chapterProgress) {
      // For chapters, use appropriate games based on unlocked verses
      const unlockedCount = verseProgress.chapterProgress.unlockedVerses.length;
      if (unlockedCount === 1) {
        // Only one verse: use single-verse games
        nextDayGames = CHAPTER_SINGLE_VERSE_GAMES;
      } else {
        // Multiple verses: use multi-verse games
        nextDayGames = CHAPTER_MULTI_VERSE_GAMES;
      }
    } else {
      // Regular verse: use difficulty-based games
      nextDayGames = DIFFICULTY_LEVELS[newDifficultyLevel];
    }

    const updatedProgress = {
      ...progress,
      [verseId]: {
        ...verseProgress,
        difficultyLevel: newDifficultyLevel,
        lastReviewedAt,
        reviewCount: newReviewCount,
        gameSessions: updatedSessions,
        currentDayGames: nextDayGames,
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

    await saveProgress(updatedProgress);

    // For chapters: if all games completed today AND high accuracy, unlock next verse
    if (verseProgress.isChapter && verseProgress.chapterProgress && allGamesCompletedToday && !wasCompletedBefore) {
      if (avgAccuracyToday >= 80) {
        const chapter = chapters.find(c => c.id === verseId);
        if (chapter) {
          const currentVerseIndex = verseProgress.chapterProgress.currentVerseIndex;
          const hasMoreVerses = currentVerseIndex < chapter.verses.length - 1;
          
          if (hasMoreVerses) {
            console.log('✅ Chapter verse completed with good accuracy! Unlocking next verse...');
            // Mark current verse as mastered and unlock next
            await unlockNextVerseInChapter(verseId);
          } else {
            console.log('✅ Final verse in chapter completed!');
            // Mark as complete
            await advanceChapterProgress(verseId, currentVerseIndex);
          }
        }
      }
    }
  }, [progress, customVerses, chapters]);

  const advanceToNextLevel = useCallback((verseId: string) => {
    const verseProgress = progress[verseId];
    if (!verseProgress) {
      console.error('Verse not in progress');
      return;
    }

    const newDifficultyLevel = Math.min(5, verseProgress.difficultyLevel + 1) as DifficultyLevel;
    
    // Determine the correct games
    let newGames: GameType[];
    if (verseProgress.isChapter && verseProgress.chapterProgress) {
      const unlockedCount = verseProgress.chapterProgress.unlockedVerses.length;
      newGames = unlockedCount === 1 ? CHAPTER_SINGLE_VERSE_GAMES : CHAPTER_MULTI_VERSE_GAMES;
    } else {
      newGames = DIFFICULTY_LEVELS[newDifficultyLevel];
    }
    
    const updatedProgress = {
      ...progress,
      [verseId]: {
        ...verseProgress,
        difficultyLevel: newDifficultyLevel,
        currentDayGames: newGames,
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

    // Determine the correct games
    let newGames: GameType[];
    if (verseProgress.isChapter && verseProgress.chapterProgress) {
      const unlockedCount = verseProgress.chapterProgress.unlockedVerses.length;
      newGames = unlockedCount === 1 ? CHAPTER_SINGLE_VERSE_GAMES : CHAPTER_MULTI_VERSE_GAMES;
    } else {
      newGames = DIFFICULTY_LEVELS[targetLevel];
    }

    const updatedProgress = {
      ...progress,
      [verseId]: {
        ...verseProgress,
        difficultyLevel: targetLevel,
        currentDayGames: newGames,
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

    // Mark current verse as mastered and unlock the next verse
    const currentIndex = cp.currentVerseIndex;
    let updatedMasteredVerses = [...cp.masteredVerses];
    if (!updatedMasteredVerses.includes(currentIndex)) {
      updatedMasteredVerses.push(currentIndex);
    }

    const updatedChapterProgress: ChapterProgress = {
      ...cp,
      currentVerseIndex: nextIndex,
      unlockedVerses: [...cp.unlockedVerses, nextIndex],
      masteredVerses: updatedMasteredVerses,
      lastAdvancedAt: new Date().toISOString(),
      daysInSequence: cp.daysInSequence + 1,
    };

    // Update games based on new unlocked count
    const newUnlockedCount = updatedChapterProgress.unlockedVerses.length;
    const newGames = newUnlockedCount === 1 ? CHAPTER_SINGLE_VERSE_GAMES : CHAPTER_MULTI_VERSE_GAMES;

    const updatedProgress = {
      ...progress,
      [chapterId]: {
        ...chapterProgress,
        chapterProgress: updatedChapterProgress,
        currentDayGames: newGames,
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
    const today = getDateString();
    const yesterday = getYesterday();

    Object.keys(updatedProgress).forEach(verseId => {
      const verseProgress = updatedProgress[verseId];
      
      // Reset completedGamesToday if it's a new day
      if (!isToday(verseProgress.lastReviewedAt)) {
        // Check if streak should be broken
        let newStreakDays = verseProgress.streakDays;
        let newLastStreakDate = verseProgress.lastStreakDate;
        
        if (shouldBreakStreak(verseProgress.lastStreakDate)) {
          console.log(`💔 Breaking streak for verse ${verseId} - last activity: ${verseProgress.lastStreakDate}`);
          newStreakDays = 0;
          newLastStreakDate = undefined;
        }
        
        // Determine the correct games
        let newGames: GameType[];
        if (verseProgress.isChapter && verseProgress.chapterProgress) {
          const unlockedCount = verseProgress.chapterProgress.unlockedVerses.length;
          newGames = unlockedCount === 1 ? CHAPTER_SINGLE_VERSE_GAMES : CHAPTER_MULTI_VERSE_GAMES;
        } else {
          newGames = DIFFICULTY_LEVELS[verseProgress.difficultyLevel];
        }
        
        updatedProgress[verseId] = {
          ...verseProgress,
          completedGamesToday: 0,
          currentDayGames: newGames,
          streakDays: newStreakDays,
          lastStreakDate: newLastStreakDate,
        };
        hasChanges = true;
      }
    });

    if (hasChanges) {
      console.log(`✅ Reset daily progress for ${Object.keys(updatedProgress).length} verses`);
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
    console.log('>>> COMPUTING versesInProgress <<<');
    console.log('Progress keys:', Object.keys(progress));
    console.log('AllVerses count:', allVerses.length);
    console.log('Chapters count:', chapters.length);
    
    const result = Object.values(progress)
      .filter(p => !p.isArchived)
      .map(p => {
        console.log('Looking for verseId:', p.verseId, 'isChapter flag:', p.isChapter);
        
        // For chapters, find in chapters array and convert to verse-like object
        if (p.isChapter) {
          const chapter = chapters.find(c => c.id === p.verseId);
          if (chapter) {
            console.log('Found chapter:', chapter.reference);
            // Create a verse-like representation of the chapter for display
            const chapterAsVerse: BibleVerse = {
              id: chapter.id,
              reference: `${chapter.reference} (${chapter.verses.length} verses)`,
              text: chapter.verses[0]?.text || 'Chapter with multiple verses',
              category: chapter.category,
              isCustom: chapter.isCustom,
            };
            return { verse: chapterAsVerse, progress: p };
          } else {
            console.log('WARNING: Chapter not found in chapters array:', p.verseId);
          }
        }
        
        // For regular verses
        const verse = allVerses.find(v => v.id === p.verseId);
        if (verse) {
          console.log('Found verse:', verse.reference);
        } else {
          console.log('WARNING: Verse not found:', p.verseId);
        }
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
    
    console.log('Final versesInProgress count:', result.length);
    console.log('>>> END COMPUTING versesInProgress <<<');
    return result;
  }, [progress, allVerses, chapters]);

  const archivedVerses = useMemo(() => {
    return Object.values(archivedProgress)
      .map(p => {
        // Handle chapters in archived list
        if (p.isChapter) {
          const chapter = chapters.find(c => c.id === p.verseId);
          if (chapter) {
            const chapterAsVerse: BibleVerse = {
              id: chapter.id,
              reference: `${chapter.reference} (${chapter.verses.length} verses)`,
              text: chapter.verses[0]?.text || 'Chapter with multiple verses',
              category: chapter.category,
              isCustom: chapter.isCustom,
            };
            return { verse: chapterAsVerse, progress: p };
          }
          return null;
        }
        
        const verse = allVerses.find(v => v.id === p.verseId);
        return verse ? { verse, progress: p } : null;
      })
      .filter((item): item is { verse: BibleVerse; progress: VerseProgress } => item !== null)
      .sort((a, b) => new Date(b.progress.archivedAt || 0).getTime() - new Date(a.progress.archivedAt || 0).getTime());
  }, [archivedProgress, allVerses, chapters]);

  const dueVersesCount = useMemo(() => {
    return Object.values(progress).filter(p => {
      const requiredGames = p.isChapter ? 2 : (p.difficultyLevel === 5 ? 1 : 3);
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
