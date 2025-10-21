export type VerseCategory = 'Comfort' | 'Strength' | 'Peace' | 'Love' | 'Faith' | 'Hope' | 'Promises';

export type GameType = 'fill-blank' | 'word-order' | 'first-letter' | 'full-verse' | 'word-scramble' | 'missing-vowels';

export const DIFFICULTY_LEVELS: Record<DifficultyLevel, GameType[]> = {
  1: ['fill-blank', 'word-order', 'first-letter'],      // Easy: Basic games with more hints
  2: ['fill-blank', 'first-letter', 'word-scramble'],   // Medium: Introduce scrambling
  3: ['word-order', 'missing-vowels', 'word-scramble'], // Hard: More challenging combinations
  4: ['fill-blank', 'first-letter', 'missing-vowels'],  // Expert: Hardest versions of pattern games
  5: ['full-verse'],                                     // Master: Full recall
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
