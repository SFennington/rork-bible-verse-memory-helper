export type VerseCategory = 'Comfort' | 'Strength' | 'Peace' | 'Love' | 'Faith' | 'Hope';

export type GameType = 'fill-blank' | 'word-order' | 'first-letter' | 'full-verse';

export const DIFFICULTY_LEVELS: Record<DifficultyLevel, GameType[]> = {
  1: ['fill-blank', 'word-order', 'first-letter'],
  2: ['fill-blank', 'word-order', 'first-letter'],
  3: ['word-order', 'first-letter', 'fill-blank'],
  4: ['first-letter', 'fill-blank', 'word-order'],
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
}
