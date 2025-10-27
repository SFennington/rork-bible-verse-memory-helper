import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PrayerRequest, PrayerLog, PrayerStats, PrayerCategory, PrayerStatus } from '@/types/prayer';
import { EXAMPLE_PRAYERS } from '@/mocks/prayers';
import { getDateString, calculateStreak } from '@/utils/dateUtils';
import { useDateChange } from '@/hooks/useDateChange';

const PRAYER_REQUESTS_KEY = 'prayer_requests';
const PRAYER_LOGS_KEY = 'prayer_logs';
const DAILY_PRAYERS_KEY = 'daily_prayers';
const LAST_ROTATION_DATE_KEY = 'last_rotation_date';

const getToday = () => getDateString();

export const [PrayerProvider, usePrayer] = createContextHook(() => {
  const [prayerRequests, setPrayerRequests] = useState<PrayerRequest[]>([]);
  const [prayerLogs, setPrayerLogs] = useState<PrayerLog[]>([]);
  const [dailyPrayers, setDailyPrayers] = useState<string[]>([]);
  const [lastRotationDate, setLastRotationDate] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [requestsData, logsData, dailyData, rotationData] = await Promise.all([
        AsyncStorage.getItem(PRAYER_REQUESTS_KEY),
        AsyncStorage.getItem(PRAYER_LOGS_KEY),
        AsyncStorage.getItem(DAILY_PRAYERS_KEY),
        AsyncStorage.getItem(LAST_ROTATION_DATE_KEY),
      ]);

      let requests: PrayerRequest[] = [];
      if (requestsData) {
        requests = JSON.parse(requestsData);
      } else {
        // First time - load example prayers
        requests = EXAMPLE_PRAYERS.map((prayer, index) => ({
          ...prayer,
          id: `example-${index}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isInProgress: false, // Start in Browse, not Progress
        }));
        await AsyncStorage.setItem(PRAYER_REQUESTS_KEY, JSON.stringify(requests));
      }
      setPrayerRequests(requests);

      if (logsData) {
        setPrayerLogs(JSON.parse(logsData));
      }

      if (dailyData) {
        setDailyPrayers(JSON.parse(dailyData));
      }

      if (rotationData) {
        setLastRotationDate(rotationData);
      }
    } catch (error) {
      console.error('Failed to load prayer data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const rotateDailyPrayers = useCallback(async () => {
    const progressRequests = prayerRequests.filter(p => p.status === 'active' && p.isInProgress === true);
    
    if (progressRequests.length === 0) return;

    // Shuffle and select 5 prayers for today from progress prayers only
    const shuffled = [...progressRequests].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(5, shuffled.length)).map(p => p.id);

    const today = getToday();
    
    setDailyPrayers(selected);
    setLastRotationDate(today);

    try {
      await Promise.all([
        AsyncStorage.setItem(DAILY_PRAYERS_KEY, JSON.stringify(selected)),
        AsyncStorage.setItem(LAST_ROTATION_DATE_KEY, today),
      ]);
    } catch (error) {
      console.error('Failed to save daily prayers:', error);
    }
  }, [prayerRequests]);

  // Check if we need to rotate daily prayers when date or requests change
  useEffect(() => {
    const today = getToday();
    if (lastRotationDate !== today) {
      rotateDailyPrayers();
    }
  }, [lastRotationDate, prayerRequests, rotateDailyPrayers]);

  const savePrayerLogs = async (logs: PrayerLog[]) => {
    try {
      await AsyncStorage.setItem(PRAYER_LOGS_KEY, JSON.stringify(logs));
      setPrayerLogs(logs);
    } catch (error) {
      console.error('Failed to save prayer logs:', error);
    }
  };

  const addPrayerRequest = useCallback(async (request: Omit<PrayerRequest, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newRequest: PrayerRequest = {
      ...request,
      id: `prayer-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
      isInProgress: request.isInProgress === true, // Explicitly convert to boolean
    };
    
    // Read current data from AsyncStorage first
    let currentRequests: PrayerRequest[] = [];
    try {
      const stored = await AsyncStorage.getItem(PRAYER_REQUESTS_KEY);
      if (stored) {
        currentRequests = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to read current prayers:', error);
    }
    
    // Add new prayer
    const updated = [...currentRequests, newRequest];
    
    // Save to AsyncStorage FIRST
    try {
      await AsyncStorage.setItem(PRAYER_REQUESTS_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save to AsyncStorage:', error);
      throw error;
    }
    
    // Then update React state
    setPrayerRequests(updated);
    
    return newRequest.id;
  }, []);

  const updatePrayerRequest = useCallback(async (id: string, updates: Partial<PrayerRequest>) => {
    const updated = await new Promise<PrayerRequest[]>((resolve) => {
      setPrayerRequests((prevRequests) => {
        const newList = prevRequests.map(req =>
          req.id === id
            ? { ...req, ...updates, updatedAt: new Date().toISOString() }
            : req
        );
        resolve(newList);
        return newList;
      });
    });
    
    try {
      await AsyncStorage.setItem(PRAYER_REQUESTS_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save prayer requests:', error);
    }
  }, []);

  const deletePrayerRequest = useCallback(async (id: string) => {
    const [updatedRequests, updatedLogs] = await Promise.all([
      new Promise<PrayerRequest[]>((resolve) => {
        setPrayerRequests((prev) => {
          const filtered = prev.filter(req => req.id !== id);
          resolve(filtered);
          return filtered;
        });
      }),
      new Promise<PrayerLog[]>((resolve) => {
        setPrayerLogs((prev) => {
          const filtered = prev.filter(log => log.prayerRequestId !== id);
          resolve(filtered);
          return filtered;
        });
      })
    ]);
    
    try {
      await Promise.all([
        AsyncStorage.setItem(PRAYER_REQUESTS_KEY, JSON.stringify(updatedRequests)),
        AsyncStorage.setItem(PRAYER_LOGS_KEY, JSON.stringify(updatedLogs))
      ]);
    } catch (error) {
      console.error('Failed to save after deletion:', error);
    }
  }, []);

  const markAsAnswered = useCallback(async (id: string) => {
    await updatePrayerRequest(id, {
      status: 'answered',
      answeredAt: new Date().toISOString(),
    });
  }, [updatePrayerRequest]);

  const markAsArchived = useCallback(async (id: string) => {
    await updatePrayerRequest(id, {
      status: 'archived',
      archivedAt: new Date().toISOString(),
    });
  }, [updatePrayerRequest]);

  const addToProgress = useCallback(async (prayerId: string) => {
    await updatePrayerRequest(prayerId, { isInProgress: true });
  }, [updatePrayerRequest]);

  const logPrayer = useCallback(async (prayerRequestId: string, notes?: string, duration?: number) => {
    const newLog: PrayerLog = {
      id: `log-${Date.now()}`,
      prayerRequestId,
      prayedAt: new Date().toISOString(),
      notes,
      duration,
    };
    const updated = [...prayerLogs, newLog];
    await savePrayerLogs(updated);
  }, [prayerLogs]);

  const activePrayers = useMemo(
    () => prayerRequests.filter(req => req.status === 'active'),
    [prayerRequests]
  );

  const answeredPrayers = useMemo(
    () => prayerRequests.filter(req => req.status === 'answered'),
    [prayerRequests]
  );

  const archivedPrayers = useMemo(
    () => prayerRequests.filter(req => req.status === 'archived'),
    [prayerRequests]
  );

  const progressPrayers = useMemo(() => {
    return prayerRequests.filter(req => req.status === 'active' && req.isInProgress === true);
  }, [prayerRequests]);

  const browsePrayers = useMemo(
    () => prayerRequests.filter(req => req.status === 'active' && !req.isInProgress),
    [prayerRequests]
  );

  const getPrayersByCategory = useCallback((category: PrayerCategory | null) => {
    if (!category) return prayerRequests;
    return prayerRequests.filter(req => req.category === category);
  }, [prayerRequests]);

  const getPrayerLogs = useCallback((prayerRequestId: string) => {
    return prayerLogs
      .filter(log => log.prayerRequestId === prayerRequestId)
      .sort((a, b) => new Date(b.prayedAt).getTime() - new Date(a.prayedAt).getTime());
  }, [prayerLogs]);

  const todaysPrayers = useMemo(() => {
    return dailyPrayers
      .map(id => prayerRequests.find(p => p.id === id))
      .filter((p): p is PrayerRequest => p !== undefined);
  }, [dailyPrayers, prayerRequests]);

  const getTodaysPrayerLogs = useMemo(() => {
    const today = getToday();
    return prayerLogs.filter(log => {
      const logDate = getDateString(new Date(log.prayedAt));
      return logDate === today;
    });
  }, [prayerLogs]);

  const prayedTodayIds = useMemo(() => {
    return new Set(getTodaysPrayerLogs.map(log => log.prayerRequestId));
  }, [getTodaysPrayerLogs]);

  const stats: PrayerStats = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const prayersThisWeek = prayerLogs.filter(
      log => new Date(log.prayedAt) >= weekAgo
    ).length;

    const prayersThisMonth = prayerLogs.filter(
      log => new Date(log.prayedAt) >= monthAgo
    ).length;

    const totalPrayerTime = prayerLogs.reduce((sum, log) => sum + (log.duration || 0), 0);

    // Calculate streak using utility function
    const uniquePrayerDates = Array.from(
      new Set(prayerLogs.map(log => getDateString(new Date(log.prayedAt))))
    ).sort().reverse(); // Sort descending (most recent first)

    const currentStreak = calculateStreak(uniquePrayerDates);
    
    // Calculate longest streak by checking all possible streaks
    let longestStreak = currentStreak;
    let tempStreak = 1;
    
    if (uniquePrayerDates.length > 0) {
      for (let i = 0; i < uniquePrayerDates.length - 1; i++) {
        const current = new Date(uniquePrayerDates[i]);
        const next = new Date(uniquePrayerDates[i + 1]);
        const daysDiff = Math.round((current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === 1) {
          tempStreak++;
          longestStreak = Math.max(longestStreak, tempStreak);
        } else {
          tempStreak = 1;
        }
      }
    }

    return {
      totalPrayers: prayerLogs.length,
      answeredPrayers: answeredPrayers.length,
      currentStreak,
      longestStreak,
      totalPrayerTime,
      prayersThisWeek,
      prayersThisMonth,
    };
  }, [prayerLogs, answeredPrayers]);

  const reloadPrayers = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(PRAYER_REQUESTS_KEY);
      if (stored) {
        const loaded = JSON.parse(stored);
        setPrayerRequests(loaded);
      }
    } catch (error) {
      console.error('Failed to reload prayers:', error);
    }
  }, []);

  // Handle date changes (midnight rollover)
  useDateChange(() => {
    console.log('📅 Date changed! Rotating daily prayers...');
    const today = getToday();
    if (lastRotationDate !== today) {
      rotateDailyPrayers();
    }
  });

  return useMemo(
    () => ({
      prayerRequests,
      prayerLogs,
      activePrayers,
      answeredPrayers,
      archivedPrayers,
      progressPrayers,
      browsePrayers,
      todaysPrayers,
      prayedTodayIds,
      stats,
      isLoading,
      addPrayerRequest,
      addToProgress,
      updatePrayerRequest,
      deletePrayerRequest,
      markAsAnswered,
      markAsArchived,
      logPrayer,
      getPrayersByCategory,
      getPrayerLogs,
      rotateDailyPrayers,
      reloadPrayers,
    }),
    [
      prayerRequests,
      prayerLogs,
      activePrayers,
      answeredPrayers,
      archivedPrayers,
      progressPrayers,
      browsePrayers,
      todaysPrayers,
      prayedTodayIds,
      stats,
      isLoading,
      addPrayerRequest,
      addToProgress,
      updatePrayerRequest,
      deletePrayerRequest,
      markAsAnswered,
      markAsArchived,
      logPrayer,
      getPrayersByCategory,
      getPrayerLogs,
      rotateDailyPrayers,
      reloadPrayers,
    ]
  );
});

