import { useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { getDateString, getMillisecondsUntilMidnight } from '@/utils/dateUtils';

/**
 * Hook that detects when the date changes (midnight rollover)
 * and calls the provided callback
 */
export function useDateChange(onDateChange: () => void) {
  const [currentDate, setCurrentDate] = useState(getDateString());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const appStateRef = useRef(AppState.currentState);

  useEffect(() => {
    // Function to check if date has changed
    const checkDateChange = () => {
      const newDate = getDateString();
      if (newDate !== currentDate) {
        console.log(`📅 Date changed from ${currentDate} to ${newDate}`);
        setCurrentDate(newDate);
        onDateChange();
        // Reschedule for next midnight
        scheduleNextCheck();
      }
    };

    // Schedule check at next midnight
    const scheduleNextCheck = () => {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
      }
      
      const msUntilMidnight = getMillisecondsUntilMidnight();
      console.log(`⏰ Scheduling date check in ${Math.round(msUntilMidnight / 1000 / 60)} minutes`);
      
      intervalRef.current = setTimeout(() => {
        checkDateChange();
      }, msUntilMidnight + 1000); // Add 1 second buffer to ensure we're past midnight
    };

    // Handle app state changes (for when app comes back from background)
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        console.log('📱 App came to foreground, checking date...');
        checkDateChange();
      }
      appStateRef.current = nextAppState;
    };

    // Set up app state listener
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    // Schedule initial check
    scheduleNextCheck();

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
      }
      subscription.remove();
    };
  }, [currentDate, onDateChange]);

  return currentDate;
}

