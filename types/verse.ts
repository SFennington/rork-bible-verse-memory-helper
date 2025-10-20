export type VerseCategory = 'Comfort' | 'Strength' | 'Peace' | 'Love' | 'Faith' | 'Hope' | 'Promises';

export type GameType = 'fill-blank' | 'word-order' | 'first-letter' | 'full-verse' | 'word-scramble' | 'missing-vowels';

export const DIFFICULTY_LEVELS: Record<DifficultyLevel, GameType[]> = {
  1: ['fill-blank', 'word-order', 'first-letter'],
  2: ['word-scramble', 'missing-vowels', 'fill-blank'],
  3: ['word-order', 'first-letter', 'missing-vowels'],
  4: ['first-letter', 'word-scramble', 'fill-blank'],
  5: ['full-verse'],
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
