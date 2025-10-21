import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Heart,
  Plus,
  CheckCircle2,
  Clock,
  Flame,
  TrendingUp,
  Archive,
  Circle,
} from 'lucide-react-native';
import { usePrayer } from '@/contexts/PrayerContext';
import { useTheme } from '@/contexts/ThemeContext';
import { PRAYER_CATEGORIES, PrayerCategory } from '@/types/prayer';

type TabType = 'active' | 'answered' | 'archived';

export default function PrayersScreen() {
  const router = useRouter();
  const {
    activePrayers,
    answeredPrayers,
    archivedPrayers,
    stats,
    logPrayer,
    markAsAnswered,
  } = usePrayer();
  const { theme, themeMode } = useTheme();
  const [selectedTab, setSelectedTab] = useState<TabType>('active');
  const [selectedCategory, setSelectedCategory] = useState<PrayerCategory | null>(null);
  const insets = useSafeAreaInsets();

  const displayedPrayers = useMemo(() => {
    let prayers = selectedTab === 'active' ? activePrayers
      : selectedTab === 'answered' ? answeredPrayers
      : archivedPrayers;

    if (selectedCategory) {
      prayers = prayers.filter(p => p.category === selectedCategory);
    }

    return prayers.sort((a, b) => {
      // Sort by priority first, then by date
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      if (a.priority !== b.priority) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [selectedTab, selectedCategory, activePrayers, answeredPrayers, archivedPrayers]);

  const handlePrayNow = (prayerId: string) => {
    Alert.alert(
      'Prayer Logged',
      'Would you like to mark this prayer?',
      [
        { text: 'Just Log', onPress: () => logPrayer(prayerId) },
        { text: 'Mark Answered', onPress: () => markAsAnswered(prayerId) },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent={false}
      />
      <LinearGradient
        colors={theme.gradient as any}
        style={styles.gradient}
        start={theme.gradientStart}
        end={theme.gradientEnd}
      >
        <View style={[styles.header, { paddingTop: 20 + insets.top }]}>
          <View style={styles.headerRow}>
            <View style={styles.headerContent}>
              <Heart color="#fff" size={28} strokeWidth={2.5} />
              <Text style={styles.title}>PrayPal</Text>
            </View>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => router.push('/add-prayer' as any)}
              activeOpacity={0.7}
            >
              <Plus color="#fff" size={24} />
            </TouchableOpacity>
          </View>
          <Text style={styles.subtitle}>Your Prayer Journey</Text>

          {stats.totalPrayers > 0 && (
            <View style={styles.statsContainer}>
              <View style={styles.statRow}>
                <View style={[styles.statCard, themeMode === 'dark' && styles.statCardDark]}>
                  <CheckCircle2 color="#10b981" size={16} fill="#10b981" />
                  <Text style={[styles.statValue, themeMode === 'dark' && styles.statValueDark]}>
                    {stats.answeredPrayers}
                  </Text>
                  <Text style={[styles.statLabel, themeMode === 'dark' && styles.statLabelDark]}>
                    Answered
                  </Text>
                </View>
                <View style={[styles.statCard, themeMode === 'dark' && styles.statCardDark]}>
                  <Flame color="#f59e0b" size={16} fill="#f59e0b" />
                  <Text style={[styles.statValue, themeMode === 'dark' && styles.statValueDark]}>
                    {stats.currentStreak}
                  </Text>
                  <Text style={[styles.statLabel, themeMode === 'dark' && styles.statLabelDark]}>
                    Day Streak
                  </Text>
                </View>
                <View style={[styles.statCard, themeMode === 'dark' && styles.statCardDark]}>
                  <TrendingUp color="#3b82f6" size={16} />
                  <Text style={[styles.statValue, themeMode === 'dark' && styles.statValueDark]}>
                    {stats.prayersThisWeek}
                  </Text>
                  <Text style={[styles.statLabel, themeMode === 'dark' && styles.statLabelDark]}>
                    This Week
                  </Text>
                </View>
              </View>
            </View>
          )}

          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[styles.tab, selectedTab === 'active' && styles.tabActive]}
              onPress={() => setSelectedTab('active')}
              activeOpacity={0.7}
            >
              <Circle color={selectedTab === 'active' ? '#fff' : 'rgba(255, 255, 255, 0.7)'} size={20} />
              <Text style={[styles.tabText, selectedTab === 'active' && styles.tabTextActive]}>
                Active
              </Text>
              {activePrayers.length > 0 && (
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{activePrayers.length}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, selectedTab === 'answered' && styles.tabActive]}
              onPress={() => setSelectedTab('answered')}
              activeOpacity={0.7}
            >
              <CheckCircle2
                color={selectedTab === 'answered' ? '#fff' : 'rgba(255, 255, 255, 0.7)'}
                size={20}
              />
              <Text style={[styles.tabText, selectedTab === 'answered' && styles.tabTextActive]}>
                Answered
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, selectedTab === 'archived' && styles.tabActive]}
              onPress={() => setSelectedTab('archived')}
              activeOpacity={0.7}
            >
              <Archive
                color={selectedTab === 'archived' ? '#fff' : 'rgba(255, 255, 255, 0.7)'}
                size={20}
              />
              <Text style={[styles.tabText, selectedTab === 'archived' && styles.tabTextActive]}>
                Archived
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {selectedTab === 'active' && activePrayers.length === 0 && (
            <View style={[styles.emptyState, { backgroundColor: theme.cardBackground }]}>
              <Heart color={theme.textSecondary} size={48} />
              <Text style={[styles.emptyStateTitle, { color: theme.text }]}>No Active Prayers</Text>
              <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>
                Tap the + button to add your first prayer request
              </Text>
            </View>
          )}

          {displayedPrayers.map((prayer) => {
            const category = PRAYER_CATEGORIES.find(c => c.name === prayer.category);
            const logs = stats.totalPrayers; // You can get specific logs later
            
            return (
              <TouchableOpacity
                key={prayer.id}
                style={[styles.prayerCard, { backgroundColor: theme.cardBackground }]}
                onPress={() => router.push(`/prayer/${prayer.id}` as any)}
                activeOpacity={0.9}
              >
                <View style={styles.prayerHeader}>
                  <View style={styles.prayerTitleRow}>
                    <View style={[styles.categoryDot, { backgroundColor: category?.color || '#667eea' }]} />
                    <Text style={[styles.prayerTitle, { color: theme.text }]} numberOfLines={2}>
                      {prayer.title}
                    </Text>
                  </View>
                  {prayer.priority === 'high' && (
                    <View style={styles.priorityBadge}>
                      <Text style={styles.priorityText}>!</Text>
                    </View>
                  )}
                </View>

                {prayer.description && (
                  <Text style={[styles.prayerDescription, { color: theme.textSecondary }]} numberOfLines={2}>
                    {prayer.description}
                  </Text>
                )}

                <View style={styles.prayerFooter}>
                  <Text style={[styles.prayerCategory, { color: theme.textTertiary }]}>
                    {prayer.category}
                  </Text>
                  <View style={styles.prayerActions}>
                    <TouchableOpacity
                      style={[styles.prayNowButton, { backgroundColor: category?.color || '#667eea' }]}
                      onPress={(e) => {
                        e.stopPropagation();
                        handlePrayNow(prayer.id);
                      }}
                      activeOpacity={0.8}
                    >
                      <Heart color="#fff" size={16} fill="#fff" />
                      <Text style={styles.prayNowText}>Pray</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500' as const,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    marginTop: 20,
  },
  statRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 4,
  },
  statCardDark: {
    backgroundColor: 'rgba(31, 41, 55, 0.95)',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#1f2937',
  },
  statValueDark: {
    color: '#f9fafb',
  },
  statLabel: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '600' as const,
  },
  statLabelDark: {
    color: '#9ca3af',
  },
  tabsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 20,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  tabActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  tabTextActive: {
    color: '#fff',
  },
  countBadge: {
    backgroundColor: '#ef4444',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  countBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700' as const,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
    paddingTop: 16,
  },
  emptyState: {
    borderRadius: 20,
    padding: 48,
    alignItems: 'center',
    gap: 12,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    marginTop: 12,
  },
  emptyStateText: {
    fontSize: 15,
    textAlign: 'center',
  },
  prayerCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  prayerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  prayerTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    flex: 1,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 6,
  },
  prayerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    flex: 1,
  },
  priorityBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  priorityText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700' as const,
  },
  prayerDescription: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  prayerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  prayerCategory: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  prayerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  prayNowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  prayNowText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600' as const,
  },
});

