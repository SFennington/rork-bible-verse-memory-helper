/**
 * Date utilities for managing midnight rollovers and daily resets
 */

export function getDateString(date: Date = new Date()): string {
  return date.toISOString().split('T')[0];
}

export function isToday(dateString: string): boolean {
  const date = new Date(dateString);
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

export function isSameDay(date1: string | Date, date2: string | Date): boolean {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
  return getDateString(d1) === getDateString(d2);
}

export function getYesterday(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return getDateString(yesterday);
}

export function getDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return getDateString(date);
}

export function daysBetween(date1String: string, date2String: string): number {
  const d1 = new Date(date1String);
  const d2 = new Date(date2String);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export function getMillisecondsUntilMidnight(): number {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return midnight.getTime() - now.getTime();
}

/**
 * Checks if a streak should be broken based on the last activity date
 * @param lastActivityDate - The date of the last activity (YYYY-MM-DD format)
 * @returns true if the streak should be broken (more than 1 day gap)
 */
export function shouldBreakStreak(lastActivityDate: string | undefined): boolean {
  if (!lastActivityDate) return false;
  
  const today = getDateString();
  const yesterday = getYesterday();
  
  // If last activity was today or yesterday, streak is still alive
  if (lastActivityDate === today || lastActivityDate === yesterday) {
    return false;
  }
  
  // If last activity was before yesterday, break the streak
  return true;
}

/**
 * Calculates the current streak based on an array of activity dates
 * @param activityDates - Array of date strings (YYYY-MM-DD format) sorted desc
 * @returns The number of consecutive days with activity
 */
export function calculateStreak(activityDates: string[]): number {
  if (activityDates.length === 0) return 0;
  
  let streak = 0;
  let checkDate = new Date();
  const today = getDateString();
  const dateSet = new Set(activityDates);
  
  // If there's activity today, include today in the streak
  if (dateSet.has(today)) {
    streak = 1;
    checkDate.setDate(checkDate.getDate() - 1);
  } else {
    // If no activity today, check if there was activity yesterday
    // If not, streak is broken
    const yesterday = getYesterday();
    if (!dateSet.has(yesterday)) {
      return 0;
    }
    streak = 1;
    checkDate = new Date(yesterday);
    checkDate.setDate(checkDate.getDate() - 1);
  }
  
  // Count consecutive days backwards
  while (dateSet.has(getDateString(checkDate))) {
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }
  
  return streak;
}

