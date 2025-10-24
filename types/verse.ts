export type VerseCategory = 'Comfort' | 'Strength' | 'Peace' | 'Love' | 'Faith' | 'Hope' | 'Promises' | 'Custom';

export type GameType = 'fill-blank' | 'word-order' | 'first-letter' | 'full-verse' | 'word-scramble' | 'missing-vowels' | 'flashcard' | 'speed-tap' | 'progressive-reveal';

export const DIFFICULTY_LEVELS: Record<DifficultyLevel, GameType[]> = {
  1: ['flashcard', 'fill-blank', 'word-order'],          // Easy: Simple memorization and selection
  2: ['progressive-reveal', 'fill-blank', 'speed-tap'],  // Medium: Test recall with hints
  3: ['speed-tap', 'word-order', 'progressive-reveal'],  // Hard: Quick recognition and order
  4: ['flashcard', 'progressive-reveal', 'fill-blank'],  // Expert: Minimal hints
  5: ['full-verse'],                                     // Master: Full recall, type entire verse
};

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
  lastStreakDate?: string;
  daysInProgress: number;
  uniqueDaysWorked: string[];
  isArchived?: boolean;
  archivedAt?: string;
}
