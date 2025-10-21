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
  icon: string;
}> = [
  { name: 'Personal', color: '#667eea', icon: 'user' },
  { name: 'Family', color: '#f59e0b', icon: 'users' },
  { name: 'Friends', color: '#10b981', icon: 'heart' },
  { name: 'Health', color: '#ef4444', icon: 'activity' },
  { name: 'Guidance', color: '#8b5cf6', icon: 'compass' },
  { name: 'Thanksgiving', color: '#f97316', icon: 'gift' },
  { name: 'Church', color: '#06b6d4', icon: 'home' },
  { name: 'World', color: '#3b82f6', icon: 'globe' },
  { name: 'Other', color: '#6b7280', icon: 'more-horizontal' },
];

