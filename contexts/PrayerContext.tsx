import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PrayerRequest, PrayerLog, PrayerStats, PrayerCategory, PrayerStatus } from '@/types/prayer';

const PRAYER_REQUESTS_KEY = 'prayer_requests';
const PRAYER_LOGS_KEY = 'prayer_logs';

export const [PrayerProvider, usePrayer] = createContextHook(() => {
  const [prayerRequests, setPrayerRequests] = useState<PrayerRequest[]>([]);
  const [prayerLogs, setPrayerLogs] = useState<PrayerLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [requestsData, logsData] = await Promise.all([
        AsyncStorage.getItem(PRAYER_REQUESTS_KEY),
        AsyncStorage.getItem(PRAYER_LOGS_KEY),
      ]);

      if (requestsData) {
        setPrayerRequests(JSON.parse(requestsData));
      }
      if (logsData) {
        setPrayerLogs(JSON.parse(logsData));
      }
    } catch (error) {
      console.error('Failed to load prayer data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const savePrayerRequests = async (requests: PrayerRequest[]) => {
    try {
      await AsyncStorage.setItem(PRAYER_REQUESTS_KEY, JSON.stringify(requests));
      setPrayerRequests(requests);
    } catch (error) {
      console.error('Failed to save prayer requests:', error);
    }
  };

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
    };
    const updated = [...prayerRequests, newRequest];
    await savePrayerRequests(updated);
    return newRequest.id;
  }, [prayerRequests]);

  const updatePrayerRequest = useCallback(async (id: string, updates: Partial<PrayerRequest>) => {
    const updated = prayerRequests.map(req =>
      req.id === id
        ? { ...req, ...updates, updatedAt: new Date().toISOString() }
        : req
    );
    await savePrayerRequests(updated);
  }, [prayerRequests]);

  const deletePrayerRequest = useCallback(async (id: string) => {
    const updated = prayerRequests.filter(req => req.id !== id);
    const updatedLogs = prayerLogs.filter(log => log.prayerRequestId !== id);
    await savePrayerRequests(updated);
    await savePrayerLogs(updatedLogs);
  }, [prayerRequests, prayerLogs]);

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

  const getPrayersByCategory = useCallback((category: PrayerCategory | null) => {
    if (!category) return prayerRequests;
    return prayerRequests.filter(req => req.category === category);
  }, [prayerRequests]);

  const getPrayerLogs = useCallback((prayerRequestId: string) => {
    return prayerLogs
      .filter(log => log.prayerRequestId === prayerRequestId)
      .sort((a, b) => new Date(b.prayedAt).getTime() - new Date(a.prayedAt).getTime());
  }, [prayerLogs]);

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

    // Calculate streak
    const sortedLogs = [...prayerLogs].sort(
      (a, b) => new Date(b.prayedAt).getTime() - new Date(a.prayedAt).getTime()
    );

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    const logDates = new Set(
      sortedLogs.map(log => new Date(log.prayedAt).toDateString())
    );

    let checkDate = new Date();
    while (logDates.has(checkDate.toDateString())) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    // Calculate longest streak (simplified)
    longestStreak = Math.max(currentStreak, logDates.size);

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

  return useMemo(
    () => ({
      prayerRequests,
      prayerLogs,
      activePrayers,
      answeredPrayers,
      archivedPrayers,
      stats,
      isLoading,
      addPrayerRequest,
      updatePrayerRequest,
      deletePrayerRequest,
      markAsAnswered,
      markAsArchived,
      logPrayer,
      getPrayersByCategory,
      getPrayerLogs,
    }),
    [
      prayerRequests,
      prayerLogs,
      activePrayers,
      answeredPrayers,
      archivedPrayers,
      stats,
      isLoading,
      addPrayerRequest,
      updatePrayerRequest,
      deletePrayerRequest,
      markAsAnswered,
      markAsArchived,
      logPrayer,
      getPrayersByCategory,
      getPrayerLogs,
    ]
  );
});

