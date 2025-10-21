/**
 * Prayer Types and Interfaces
 */

export type PrayerCategory = 
  | 'Personal'
  | 'Family'
  | 'Friends'
  | 'Health'
  | 'Guidance'
  | 'Thanksgiving'
  | 'Church'
  | 'World'
  | 'Prayer Requests'
  | 'Verses'
  | 'Other';

export type PrayerStatus = 'active' | 'answered' | 'archived';

export interface PrayerRequest {
  id: string;
  title: string;
  description?: string;
  category: PrayerCategory;
  status: PrayerStatus;
  createdAt: string;
  updatedAt: string;
  answeredAt?: string;
  archivedAt?: string;
  priority: 'low' | 'medium' | 'high';
  reminderEnabled: boolean;
  tags?: string[];
  prayingFor?: string; // For "Prayer Requests" category - who you're praying for
  isCustom?: boolean; // True if user created it
  isInProgress?: boolean; // True if added to active prayers
  verseId?: string; // If generated from a verse
  verseReference?: string; // Reference of the verse it was generated from
}

export interface PrayerLog {
  id: string;
  prayerRequestId: string;
  prayedAt: string;
  notes?: string;
  duration?: number; // in seconds
}

export interface PrayerStats {
  totalPrayers: number;
  answeredPrayers: number;
  currentStreak: number;
  longestStreak: number;
  totalPrayerTime: number;
  prayersThisWeek: number;
  prayersThisMonth: number;
}

export const PRAYER_CATEGORIES: Array<{
  name: PrayerCategory;
  color: string;
  gradient: string[];
  icon: string;
}> = [
  { name: 'Personal', color: '#667eea', gradient: ['#667eea', '#764ba2'], icon: 'user' },
  { name: 'Family', color: '#f59e0b', gradient: ['#f59e0b', '#f97316'], icon: 'users' },
  { name: 'Friends', color: '#10b981', gradient: ['#10b981', '#059669'], icon: 'heart' },
  { name: 'Health', color: '#ef4444', gradient: ['#ef4444', '#dc2626'], icon: 'activity' },
  { name: 'Guidance', color: '#8b5cf6', gradient: ['#8b5cf6', '#7c3aed'], icon: 'compass' },
  { name: 'Thanksgiving', color: '#f97316', gradient: ['#f97316', '#ea580c'], icon: 'gift' },
  { name: 'Church', color: '#06b6d4', gradient: ['#06b6d4', '#0891b2'], icon: 'home' },
  { name: 'World', color: '#3b82f6', gradient: ['#3b82f6', '#2563eb'], icon: 'globe' },
  { name: 'Prayer Requests', color: '#ec4899', gradient: ['#ec4899', '#db2777'], icon: 'mail' },
  { name: 'Verses', color: '#8b5cf6', gradient: ['#8b5cf6', '#7c3aed'], icon: 'book-open' },
  { name: 'Other', color: '#6b7280', gradient: ['#6b7280', '#4b5563'], icon: 'more-horizontal' },
];

