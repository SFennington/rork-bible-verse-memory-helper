import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Book, Target, Plus, Play, PlusCircle, Crown, Archive, TrendingUp, Flame, CheckCircle2 } from 'lucide-react-native';
import { useVerses } from '@/contexts/VerseContext';
import { useTheme } from '@/contexts/ThemeContext';
import { CATEGORIES } from '@/mocks/verses';
import { VerseCategory } from '@/types/verse';



type TabType = 'browse' | 'progress';

export default function HomeScreen() {
  const router = useRouter();
  const { verses, progress, versesInProgress, dueVersesCount, addToProgress, archivedVerses } = useVerses();
  const { theme, themeMode } = useTheme();
  const [selectedTab, setSelectedTab] = useState<TabType>('progress');
  const [selectedCategory, setSelectedCategory] = useState<VerseCategory | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const insets = useSafeAreaInsets();

  const filteredVerses = selectedCategory
    ? verses.filter(v => v.category === selectedCategory)
    : verses;

  const isInProgress = (verseId: string) => {
    return !!progress[verseId];
  };

  const handleAddToProgress = (verseId: string) => {
    addToProgress(verseId);
    setSelectedTab('progress');
  };

  const stats = useMemo(() => {
    const completedVerses = versesInProgress.filter(v => v.progress.overallProgress === 100).length;
    const completedArchived = archivedVerses.filter(v => v.progress.overallProgress === 100).length;
    const totalCompleted = completedVerses + completedArchived;
    
    const allProgress = Object.values(progress);
    const totalDaysInProgress = allProgress.reduce((max, p) => 
      Math.max(max, p.daysInProgress || 0), 0
    );
    
    const currentStreak = allProgress.reduce((max, p) => 
      Math.max(max, p.streakDays || 0), 0
    );
    
    return {
      totalCompleted,
      totalDaysInProgress,
      currentStreak,
      activeVerses: versesInProgress.length,
    };
  }, [versesInProgress, archivedVerses, progress]);

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
              <Book color="#fff" size={28} strokeWidth={2.5} />
              <Text style={styles.title}>Scripture Memory</Text>
            </View>
          </View>
          <Text style={styles.subtitle}>Hide God&apos;s Word in your heart</Text>
          
          {selectedTab === 'progress' && (versesInProgress.length > 0 || archivedVerses.length > 0) && (
            <View style={styles.statsContainer}>
              <View style={styles.statRow}>
                <View style={[styles.statCard, themeMode === 'dark' && styles.statCardDark]}>
                  <CheckCircle2 color="#10b981" size={16} fill="#10b981" />
                  <Text style={[styles.statValue, themeMode === 'dark' && styles.statValueDark]}>{stats.totalCompleted}</Text>
                  <Text style={[styles.statLabel, themeMode === 'dark' && styles.statLabelDark]}>Completed</Text>
                </View>
                <View style={[styles.statCard, themeMode === 'dark' && styles.statCardDark]}>
                  <Flame color="#f59e0b" size={16} fill="#f59e0b" />
                  <Text style={[styles.statValue, themeMode === 'dark' && styles.statValueDark]}>{stats.currentStreak}</Text>
                  <Text style={[styles.statLabel, themeMode === 'dark' && styles.statLabelDark]}>Day Streak</Text>
                </View>
                <View style={[styles.statCard, themeMode === 'dark' && styles.statCardDark]}>
                  <TrendingUp color="#3b82f6" size={16} />
                  <Text style={[styles.statValue, themeMode === 'dark' && styles.statValueDark]}>{stats.totalDaysInProgress}</Text>
                  <Text style={[styles.statLabel, themeMode === 'dark' && styles.statLabelDark]}>Days Active</Text>
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
              {(versesInProgress.length > 0 || archivedVerses.length > 0) && (
                <View style={[styles.dueBadge, dueVersesCount === 0 && styles.dueBadgeComplete]}>
                  <Text style={styles.dueBadgeText}>{dueVersesCount}</Text>
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
              <Book color={selectedTab === 'browse' ? '#fff' : 'rgba(255, 255, 255, 0.7)'} size={20} />
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
              {CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat.name}
                  style={[
                    styles.categoryChip,
                    selectedCategory === cat.name && styles.categoryChipActive,
                    selectedCategory === cat.name && { backgroundColor: cat.color },
                  ]}
                  onPress={() => setSelectedCategory(cat.name as VerseCategory)}
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
          contentContainerStyle={styles.versesContainer}
          showsVerticalScrollIndicator={false}
        >
          {selectedTab === 'progress' && (
            <>
              {versesInProgress.length === 0 && archivedVerses.length === 0 && !showArchived ? (
                <View style={styles.emptyState}>
                  <Target color="rgba(255, 255, 255, 0.5)" size={64} />
                  <Text style={styles.emptyTitle}>Start Your Journey</Text>
                  <Text style={styles.emptyText}>
                    Add verses from Browse to begin memorizing
                  </Text>
                  <TouchableOpacity
                    style={styles.browseButton}
                    onPress={() => setSelectedTab('browse')}
                    activeOpacity={0.9}
                  >
                    <Text style={styles.browseButtonText}>Browse Verses</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  {versesInProgress.length > 0 && versesInProgress.map(({ verse, progress: verseProgress }) => {
                  const category = CATEGORIES.find(c => c.name === verse.category);
                  const requiredGames = verseProgress.difficultyLevel === 5 ? 1 : 3;
                  const isDue = verseProgress.completedGamesToday < requiredGames;

                  return (
                    <TouchableOpacity
                      key={verse.id}
                      style={styles.verseCard}
                      onPress={() => router.push(`/verse/${verse.id}`)}
                      activeOpacity={0.9}
                    >
                      <LinearGradient
                        colors={category?.gradient || ['#667eea', '#764ba2']}
                        style={styles.verseGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <View style={styles.verseHeader}>
                          <Text style={styles.verseReference}>{verse.reference}</Text>
                          {isDue ? (
                            <View style={styles.dueIndicator}>
                              <Play color="#fff" size={14} fill="#fff" />
                            </View>
                          ) : (
                            <View style={styles.completedIndicator}>
                              <CheckCircle2 color="#10b981" size={20} fill="#10b981" />
                            </View>
                          )}
                        </View>
                        <Text style={styles.verseText} numberOfLines={3}>
                          {verse.text}
                        </Text>
                        {verseProgress.overallProgress === 100 ? (
                          <View style={styles.masteredContainer}>
                            <Crown color="#10b981" size={24} fill="#10b981" />
                            <Text style={styles.masteredText}>Mastered</Text>
                          </View>
                        ) : (
                          <View style={styles.verseFooter}>
                            <View style={styles.progressBarContainer}>
                              <View style={[styles.progressBar, { width: `${verseProgress.overallProgress}%` }]} />
                            </View>
                            <Text style={styles.progressText}>{verseProgress.overallProgress}%</Text>
                          </View>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  );
                })}

                  {archivedVerses.length > 0 && (
                    <TouchableOpacity
                      style={styles.archivedToggle}
                      onPress={() => setShowArchived(!showArchived)}
                      activeOpacity={0.7}
                    >
                      <Archive color="#fff" size={20} />
                      <Text style={styles.archivedToggleText}>
                        {showArchived ? 'Hide' : 'Show'} Archived ({archivedVerses.length})
                      </Text>
                    </TouchableOpacity>
                  )}

                  {showArchived && archivedVerses.map(({ verse, progress: verseProgress }) => {
                    const category = CATEGORIES.find(c => c.name === verse.category);

                    return (
                      <TouchableOpacity
                        key={verse.id}
                        style={[styles.verseCard, styles.archivedCard]}
                        onPress={() => router.push(`/verse/${verse.id}`)}
                        activeOpacity={0.9}
                      >
                        <LinearGradient
                          colors={category?.gradient || ['#667eea', '#764ba2']}
                          style={[styles.verseGradient, styles.archivedGradient]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                        >
                          <View style={styles.archivedBadge}>
                            <Archive color="#fff" size={14} />
                            <Text style={styles.archivedBadgeText}>Archived</Text>
                          </View>
                          <View style={styles.verseHeader}>
                            <Text style={styles.verseReference}>{verse.reference}</Text>
                          </View>
                          <Text style={styles.verseText} numberOfLines={3}>
                            {verse.text}
                          </Text>
                          {verseProgress.overallProgress === 100 ? (
                            <View style={styles.masteredContainer}>
                              <Crown color="#10b981" size={24} fill="#10b981" />
                              <Text style={styles.masteredText}>Mastered</Text>
                            </View>
                          ) : (
                            <View style={styles.verseFooter}>
                              <View style={styles.progressBarContainer}>
                                <View style={[styles.progressBar, { width: `${verseProgress.overallProgress}%` }]} />
                              </View>
                              <Text style={styles.progressText}>{verseProgress.overallProgress}%</Text>
                            </View>
                          )}
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
                onPress={() => router.push('/add-verse')}
                activeOpacity={0.9}
              >
                <View style={styles.addCustomContent}>
                  <PlusCircle color="#fff" size={32} />
                  <Text style={styles.addCustomTitle}>Add Custom Verse</Text>
                  <Text style={styles.addCustomText}>
                    Add your own verses or chapters to memorize
                  </Text>
                </View>
              </TouchableOpacity>
              {filteredVerses.map(verse => {
              const inProgress = isInProgress(verse.id);
              const category = CATEGORIES.find(c => c.name === verse.category);

              return (
                <TouchableOpacity
                  key={verse.id}
                  style={styles.verseCard}
                  onPress={() => inProgress ? router.push(`/verse/${verse.id}`) : handleAddToProgress(verse.id)}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={category?.gradient || ['#667eea', '#764ba2']}
                    style={styles.verseGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={styles.verseHeader}>
                      <Text style={styles.verseReference}>{verse.reference}</Text>
                      {!inProgress && (
                        <View style={styles.addButton}>
                          <Plus color="#fff" size={20} strokeWidth={3} />
                        </View>
                      )}
                    </View>
                    <Text style={styles.verseText} numberOfLines={3}>
                      {verse.text}
                    </Text>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryBadgeText}>{verse.category}</Text>
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
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
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
  dueBadge: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  dueBadgeComplete: {
    backgroundColor: '#10b981',
  },
  dueBadgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#fff',
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
  versesContainer: {
    padding: 24,
    gap: 12,
    paddingBottom: 40,
  },
  verseCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  verseGradient: {
    padding: 16,
  },
  verseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  verseReference: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
  },
  dueIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
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
  verseFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#fff',
    minWidth: 40,
  },
  masteryInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  masteryText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#fff',
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
  verseText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#fff',
    marginBottom: 8,
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
  masteredContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  masteredText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#10b981',
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
