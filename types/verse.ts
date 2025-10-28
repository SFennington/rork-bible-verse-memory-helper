export type VerseCategory = 'Comfort' | 'Strength' | 'Peace' | 'Love' | 'Faith' | 'Hope' | 'Promises' | 'Custom';

export type GameType = 'fill-blank' | 'word-order' | 'full-verse' | 'flashcard' | 'speed-tap' | 'progressive-reveal' | 'verse-order' | 'progressive-review';

export const DIFFICULTY_LEVELS: Record<DifficultyLevel, GameType[]> = {
  1: ['flashcard', 'fill-blank', 'word-order'],          // Easy: Simple memorization and selection
  2: ['progressive-reveal', 'fill-blank', 'speed-tap'],  // Medium: Test recall with hints
  3: ['speed-tap', 'word-order', 'progressive-reveal'],  // Hard: Quick recognition and order
  4: ['flashcard', 'progressive-reveal', 'fill-blank'],  // Expert: Minimal hints
  5: ['full-verse'],                                     // Master: Full recall, type entire verse
};

// Chapter-specific games (used for chapter memorization)
// For single verse: practice the current verse
export const CHAPTER_SINGLE_VERSE_GAMES: GameType[] = ['progressive-reveal', 'flashcard'];
// For multiple verses: practice all unlocked verses  
export const CHAPTER_MULTI_VERSE_GAMES: GameType[] = ['verse-order', 'progressive-review'];

export type DifficultyLevel = 1 | 2 | 3 | 4 | 5;

export interface BibleVerse {
  id: string;
  reference: string;
  text: string;
  category: VerseCategory;
  isCustom?: boolean;
  chapterId?: string;
}

export interface Chapter {
  id: string;
  reference: string;
  verses: BibleVerse[];
  category: VerseCategory;
  isCustom?: boolean;
}

export interface GameSession {
  gameType: GameType;
  completedAt: string;
  accuracy: number;
  timeSpent: number;
  mistakeCount: number;
  correctWords: number;
  totalWords: number;
  difficultyLevel: DifficultyLevel;
}

export interface ChapterProgress {
  currentVerseIndex: number;        // Which verse they're currently learning (0-based)
  unlockedVerses: number[];         // Indices of verses unlocked so far
  masteredVerses: number[];         // Indices of verses fully mastered
  startedAt: string;                // When chapter memorization began
  lastAdvancedAt: string;           // When they last unlocked a new verse
  daysInSequence: number;           // Consecutive days working on this chapter
  isComplete: boolean;              // All verses mastered
}

export interface VerseProgress {
  verseId: string;
  difficultyLevel: DifficultyLevel;
  addedToProgressAt: string;
  lastReviewedAt: string;
  reviewCount: number;
  gameSessions: GameSession[];
  currentDayGames: GameType[];
  completedGamesToday: number;
  streakDays: number;
  overallProgress: number;
  totalCorrectWords: number;
  totalWords: number;
  isChapter?: boolean;
  chapterId?: string;
  chapterProgress?: ChapterProgress; // Progressive chapter tracking
  lastStreakDate?: string;
  daysInProgress: number;
  uniqueDaysWorked: string[];
  isArchived?: boolean;
  archivedAt?: string;
}
