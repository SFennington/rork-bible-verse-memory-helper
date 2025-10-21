import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Heart,
  Target,
  Plus,
  CheckCircle2,
  Flame,
  TrendingUp,
  PlusCircle,
  Clock,
} from 'lucide-react-native';
import { usePrayer } from '@/contexts/PrayerContext';
import { useTheme } from '@/contexts/ThemeContext';
import { PRAYER_CATEGORIES, PrayerCategory } from '@/types/prayer';

type TabType = 'browse' | 'progress';

export default function PrayersScreen() {
  const router = useRouter();
  const {
    progressPrayers,
    browsePrayers,
    answeredPrayers,
    prayedTodayIds,
    stats,
    addToProgress,
    prayerRequests,
    reloadPrayers,
  } = usePrayer();
  const { theme, themeMode } = useTheme();
  const [selectedTab, setSelectedTab] = useState<TabType>('progress');
  const [selectedCategory, setSelectedCategory] = useState<PrayerCategory | null>(null);
  const [showAllProgress, setShowAllProgress] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const insets = useSafeAreaInsets();

  // Reload prayers when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      reloadPrayers();
    }, [reloadPrayers])
  );

  const filteredBrowsePrayers = selectedCategory
    ? browsePrayers.filter(p => p.category === selectedCategory)
    : browsePrayers;

  const displayedProgressPrayers = showAllProgress 
    ? progressPrayers 
    : progressPrayers.slice(0, 5);

  const isInProgress = (prayerId: string) => {
    return progressPrayers.some(p => p.id === prayerId);
  };

  const handleAddToProgress = (prayerId: string) => {
    addToProgress(prayerId);
    setSelectedTab('progress');
  };

  const prayedToday = (prayerId: string) => {
    return prayedTodayIds.has(prayerId);
  };

  // Check if all visible progress prayers have been prayed today
  const allProgressPrayersCompleted = displayedProgressPrayers.every(prayer => prayedToday(prayer.id));

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
              <Heart color="#fff" size={28} strokeWidth={2.5} fill="#fff" />
              <Text style={styles.title}>Prayer Journey</Text>
            </View>
          </View>
          <Text style={styles.subtitle}>Keep your prayers in focus</Text>

          {selectedTab === 'progress' && progressPrayers.length > 0 && (
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
              style={[
                styles.tab,
                selectedTab === 'progress' && styles.tabActive,
              ]}
              onPress={() => setSelectedTab('progress')}
              activeOpacity={0.7}
            >
              <Target color={selectedTab === 'progress' ? '#fff' : 'rgba(255, 255, 255, 0.7)'} size={20} />
              <Text style={[
                styles.tabText,
                selectedTab === 'progress' && styles.tabTextActive,
              ]}>
                My Progress
              </Text>
              {progressPrayers.length > 0 && (
                <View style={[
                  styles.countBadge,
                  allProgressPrayersCompleted && progressPrayers.length > 0 && styles.countBadgeComplete
                ]}>
                  <Text style={styles.countBadgeText}>{progressPrayers.length}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tab,
                selectedTab === 'browse' && styles.tabActive,
              ]}
              onPress={() => setSelectedTab('browse')}
              activeOpacity={0.7}
            >
              <Heart color={selectedTab === 'browse' ? '#fff' : 'rgba(255, 255, 255, 0.7)'} size={20} fill={selectedTab === 'browse' ? '#fff' : 'rgba(255, 255, 255, 0.7)'} />
              <Text style={[
                styles.tabText,
                selectedTab === 'browse' && styles.tabTextActive,
              ]}>
                Browse
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {selectedTab === 'browse' && (
          <View style={styles.categoriesContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesScroll}
            >
              <TouchableOpacity
                style={[
                  styles.categoryChip,
                  !selectedCategory && styles.categoryChipActive,
                ]}
                onPress={() => setSelectedCategory(null)}
              >
                <Text
                  style={[
                    styles.categoryText,
                    !selectedCategory && styles.categoryTextAllActive,
                  ]}
                >
                  All
                </Text>
              </TouchableOpacity>
              {PRAYER_CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat.name}
                  style={[
                    styles.categoryChip,
                    selectedCategory === cat.name && styles.categoryChipActive,
                    selectedCategory === cat.name && { backgroundColor: cat.color },
                  ]}
                  onPress={() => setSelectedCategory(cat.name as PrayerCategory)}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      selectedCategory === cat.name && styles.categoryTextActive,
                    ]}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {selectedTab === 'progress' && (
            <>
              {progressPrayers.length === 0 && !showArchived ? (
                <View style={styles.emptyState}>
                  <Target color="rgba(255, 255, 255, 0.5)" size={64} />
                  <Text style={styles.emptyTitle}>Start Your Prayer Journey</Text>
                  <Text style={styles.emptyText}>
                    Add prayers from Browse to begin your focused prayer time
                  </Text>
                  <TouchableOpacity
                    style={styles.browseButton}
                    onPress={() => setSelectedTab('browse')}
                    activeOpacity={0.9}
                  >
                    <Text style={styles.browseButtonText}>Browse Prayers</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  {displayedProgressPrayers.map((prayer) => {
                    const category = PRAYER_CATEGORIES.find(c => c.name === prayer.category);
                    const isPrayedToday = prayedToday(prayer.id);

                    return (
                      <TouchableOpacity
                        key={prayer.id}
                        style={styles.prayerCard}
                        onPress={() => router.push(`/prayer/${prayer.id}` as any)}
                        activeOpacity={0.9}
                      >
                        <LinearGradient
                          colors={(category?.gradient || ['#667eea', '#764ba2']) as any}
                          style={styles.prayerGradient}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                        >
                          <View style={styles.prayerHeader}>
                            <View style={styles.prayerTitleSection}>
                              <Text style={styles.prayerTitle} numberOfLines={2}>
                                {prayer.title}
                              </Text>
                              {prayer.prayingFor && (
                                <Text style={styles.prayingForText}>
                                  For: {prayer.prayingFor}
                                </Text>
                              )}
                            </View>
                            {isPrayedToday && (
                              <View style={styles.prayedBadge}>
                                <CheckCircle2 color="#fff" size={16} fill="#fff" />
                              </View>
                            )}
                          </View>
                          {prayer.description && (
                            <Text style={styles.prayerDescription} numberOfLines={2}>
                              {prayer.description}
                            </Text>
                          )}
                          <View style={styles.prayerFooter}>
                            <View style={styles.categoryBadge}>
                              <Text style={styles.categoryBadgeText}>{prayer.category}</Text>
                            </View>
                            {prayer.priority === 'high' && (
                              <View style={styles.priorityBadge}>
                                <Text style={styles.priorityText}>High Priority</Text>
                              </View>
                            )}
                          </View>
                        </LinearGradient>
                      </TouchableOpacity>
                    );
                  })}

                  {progressPrayers.length > 5 && (
                    <TouchableOpacity
                      style={styles.showAllToggle}
                      onPress={() => setShowAllProgress(!showAllProgress)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.showAllToggleText}>
                        {showAllProgress ? 'Show Less' : `Show All (${progressPrayers.length})`}
                      </Text>
                    </TouchableOpacity>
                  )}

                  {answeredPrayers.length > 0 && (
                    <TouchableOpacity
                      style={styles.archivedToggle}
                      onPress={() => setShowArchived(!showArchived)}
                      activeOpacity={0.7}
                    >
                      <CheckCircle2 color="#fff" size={20} />
                      <Text style={styles.archivedToggleText}>
                        {showArchived ? 'Hide' : 'Show'} Answered ({answeredPrayers.length})
                      </Text>
                    </TouchableOpacity>
                  )}

                  {showArchived && answeredPrayers.map((prayer) => {
                    const category = PRAYER_CATEGORIES.find(c => c.name === prayer.category);

                    return (
                      <TouchableOpacity
                        key={prayer.id}
                        style={[styles.prayerCard, styles.archivedCard]}
                        onPress={() => router.push(`/prayer/${prayer.id}` as any)}
                        activeOpacity={0.9}
                      >
                        <LinearGradient
                          colors={(category?.gradient || ['#667eea', '#764ba2']) as any}
                          style={[styles.prayerGradient, styles.archivedGradient]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                        >
                          <View style={styles.archivedBadge}>
                            <CheckCircle2 color="#fff" size={14} />
                            <Text style={styles.archivedBadgeText}>Answered</Text>
                          </View>
                          <View style={styles.prayerHeader}>
                            <View style={styles.prayerTitleSection}>
                              <Text style={styles.prayerTitle} numberOfLines={2}>
                                {prayer.title}
                              </Text>
                              {prayer.prayingFor && (
                                <Text style={styles.prayingForText}>
                                  For: {prayer.prayingFor}
                                </Text>
                              )}
                            </View>
                          </View>
                          {prayer.description && (
                            <Text style={styles.prayerDescription} numberOfLines={2}>
                              {prayer.description}
                            </Text>
                          )}
                          <View style={styles.categoryBadge}>
                            <Text style={styles.categoryBadgeText}>{prayer.category}</Text>
                          </View>
                        </LinearGradient>
                      </TouchableOpacity>
                    );
                  })}
                </>
              )}
            </>
          )}

          {selectedTab === 'browse' && (
            <>
              <TouchableOpacity
                style={styles.addCustomCard}
                onPress={() => router.push('/add-prayer' as any)}
                activeOpacity={0.9}
              >
                <View style={styles.addCustomContent}>
                  <PlusCircle color="#fff" size={32} />
                  <Text style={styles.addCustomTitle}>Add Prayer Request</Text>
                  <Text style={styles.addCustomText}>
                    Create your own prayer requests to focus on
                  </Text>
                </View>
              </TouchableOpacity>

              {filteredBrowsePrayers.map(prayer => {
                const inProgress = isInProgress(prayer.id);
                const category = PRAYER_CATEGORIES.find(c => c.name === prayer.category);

                return (
                  <TouchableOpacity
                    key={prayer.id}
                    style={styles.prayerCard}
                    onPress={() => inProgress ? router.push(`/prayer/${prayer.id}` as any) : handleAddToProgress(prayer.id)}
                    activeOpacity={0.9}
                  >
                    <LinearGradient
                      colors={(category?.gradient || ['#667eea', '#764ba2']) as any}
                      style={styles.prayerGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <View style={styles.prayerHeader}>
                        <View style={styles.prayerTitleSection}>
                          <Text style={styles.prayerTitle} numberOfLines={2}>
                            {prayer.title}
                          </Text>
                          {prayer.prayingFor && (
                            <Text style={styles.prayingForText}>
                              For: {prayer.prayingFor}
                            </Text>
                          )}
                        </View>
                        {!inProgress && (
                          <View style={styles.addButton}>
                            <Plus color="#fff" size={20} strokeWidth={3} />
                          </View>
                        )}
                      </View>
                      {prayer.description && (
                        <Text style={styles.prayerDescription} numberOfLines={2}>
                          {prayer.description}
                        </Text>
                      )}
                      <View style={styles.categoryBadge}>
                        <Text style={styles.categoryBadgeText}>{prayer.category}</Text>
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                );
              })}
            </>
          )}
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
    paddingBottom: 16,
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
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginLeft: 44,
    marginBottom: 12,
  },
  statsContainer: {
    marginTop: 16,
    marginBottom: 8,
  },
  statRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 10,
    padding: 8,
    alignItems: 'center',
    gap: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statCardDark: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1f2937',
  },
  statValueDark: {
    color: '#fff',
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '600' as const,
    color: '#6b7280',
    textAlign: 'center',
  },
  statLabelDark: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  tabsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  tabActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  tabTextActive: {
    color: '#fff',
  },
  countBadge: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  countBadgeComplete: {
    backgroundColor: '#10b981',
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#fff',
  },
  categoriesContainer: {
    marginBottom: 16,
  },
  categoriesScroll: {
    paddingHorizontal: 24,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: '#fff',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#fff',
  },
  categoryTextActive: {
    color: '#fff',
  },
  categoryTextAllActive: {
    color: '#667eea',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
    gap: 12,
    paddingBottom: 40,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#fff',
  },
  emptyText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 32,
  },
  browseButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 8,
  },
  browseButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#667eea',
  },
  prayerCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  prayerGradient: {
    padding: 16,
  },
  prayerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  prayerTitleSection: {
    flex: 1,
    gap: 4,
  },
  prayerTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
  },
  prayingForText: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: 'rgba(255, 255, 255, 0.8)',
    fontStyle: 'italic',
  },
  prayedBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  prayerDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: '#fff',
    marginBottom: 8,
  },
  prayerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#fff',
  },
  priorityBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#fff',
  },
  addCustomCard: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    borderStyle: 'dashed' as const,
  },
  addCustomContent: {
    padding: 24,
    alignItems: 'center',
    gap: 10,
    justifyContent: 'center',
  },
  addCustomTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#fff',
  },
  addCustomText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 20,
  },
  showAllToggle: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  showAllToggleText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#fff',
  },
  archivedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    marginTop: 12,
  },
  archivedToggleText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#fff',
  },
  archivedCard: {
    opacity: 0.8,
  },
  archivedGradient: {
    position: 'relative',
  },
  archivedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    zIndex: 1,
  },
  archivedBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#fff',
  },
});
