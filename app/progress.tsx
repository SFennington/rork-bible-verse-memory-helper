import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Target, Flame, Calendar, TrendingUp, Play } from 'lucide-react-native';
import { useVerses } from '@/contexts/VerseContext';
import { useTheme } from '@/contexts/ThemeContext';
import { CATEGORIES } from '@/mocks/verses';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 48;

const DIFFICULTY_LABELS = [
  '',
  'Level 1',
  'Level 2',
  'Level 3',
  'Level 4',
  'Level 5',
];

export default function ProgressScreen() {
  const router = useRouter();
  const { versesInProgress, dueVersesCount } = useVerses();
  const { theme } = useTheme();

  const incompleteVerses = versesInProgress.filter(item => item.progress.completedGamesToday < 3);
  const completedVerses = versesInProgress.filter(item => item.progress.completedGamesToday >= 3);

  const totalStreak = versesInProgress.reduce((sum, item) => sum + item.progress.streakDays, 0);
  const avgProgress = versesInProgress.length > 0
    ? versesInProgress.reduce((sum, item) => sum + item.progress.overallProgress, 0) / versesInProgress.length
    : 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen
        options={{
          title: 'My Progress',
          headerStyle: {
            backgroundColor: theme.background,
          },
          headerTintColor: theme.text,
          headerTitleStyle: {
            fontWeight: '700' as const,
          },
        }}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: theme.cardBackground }]}>
            <Target color="#667eea" size={24} />
            <Text style={[styles.statValue, { color: theme.text }]}>{versesInProgress.length}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>In Progress</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.cardBackground }]}>
            <Flame color="#f59e0b" size={24} />
            <Text style={[styles.statValue, { color: theme.text }]}>{totalStreak}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total Streak</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.cardBackground }]}>
            <Calendar color="#10b981" size={24} />
            <Text style={[styles.statValue, { color: theme.text }]}>{dueVersesCount}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Due Today</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.cardBackground }]}>
            <TrendingUp color="#8b5cf6" size={24} />
            <Text style={[styles.statValue, { color: theme.text }]}>{avgProgress.toFixed(0)}%</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Avg Progress</Text>
          </View>
        </View>

        {incompleteVerses.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Continue Learning</Text>
              <View style={styles.dueBadge}>
                <Text style={styles.dueBadgeText}>{incompleteVerses.length}</Text>
              </View>
            </View>
            {incompleteVerses.map(({ verse, progress }) => {
              const category = CATEGORIES.find(c => c.name === verse.category);
              const difficultyLabel = DIFFICULTY_LABELS[progress.difficultyLevel];
              
              const completedGames = progress.gameSessions
                .filter(s => {
                  const sessionDate = new Date(s.completedAt);
                  const today = new Date();
                  return sessionDate.toDateString() === today.toDateString();
                })
                .map(s => s.gameType);
              
              const nextGame = progress.currentDayGames.find(game => !completedGames.includes(game)) || progress.currentDayGames[0];

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
                      <TouchableOpacity 
                        style={styles.playButton}
                        onPress={(e) => {
                          e.stopPropagation();
                          router.push(`/game/${nextGame}/${verse.id}`);
                        }}
                      >
                        <Play color="#fff" size={16} fill="#fff" />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.verseText} numberOfLines={2}>
                      {verse.text}
                    </Text>
                    <View style={styles.verseFooter}>
                      <View style={styles.progressRow}>
                        <View style={styles.progressBarContainer}>
                          <View style={[styles.progressBar, { width: `${progress.overallProgress}%` }]} />
                        </View>
                        <Text style={styles.progressPercentage}>{progress.overallProgress}%</Text>
                      </View>
                      <View style={styles.badgeRow}>
                        <View style={styles.masteryBadge}>
                          <Text style={styles.masteryBadgeText}>{difficultyLabel}</Text>
                        </View>
                        <View style={styles.gamesBadge}>
                          <Text style={styles.gamesBadgeText}>{progress.completedGamesToday}/3 today</Text>
                        </View>
                      </View>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {completedVerses.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Completed Today</Text>
            {completedVerses.map(({ verse, progress }) => {
              const category = CATEGORIES.find(c => c.name === verse.category);
              const difficultyLabel = DIFFICULTY_LABELS[progress.difficultyLevel];

              return (
                <TouchableOpacity
                  key={verse.id}
                  style={[styles.upcomingCard, { backgroundColor: theme.cardBackground }]}
                  onPress={() => router.push(`/verse/${verse.id}`)}
                  activeOpacity={0.9}
                >
                  <View style={styles.upcomingContent}>
                    <View style={styles.upcomingHeader}>
                      <Text style={[styles.upcomingReference, { color: theme.text }]}>{verse.reference}</Text>
                      <View style={[styles.categoryDot, { backgroundColor: category?.color || '#667eea' }]} />
                    </View>
                    <Text style={[styles.upcomingText, { color: theme.textSecondary }]} numberOfLines={1}>
                      {verse.text}
                    </Text>
                    <View style={styles.upcomingFooter}>
                      <View style={[styles.upcomingMasteryBadge, { backgroundColor: theme.border }]}>
                        <Text style={[styles.upcomingMasteryText, { color: theme.textSecondary }]}>{difficultyLabel}</Text>
                      </View>
                      <Text style={[styles.nextReviewText, { color: theme.textTertiary }]}>
                        {progress.overallProgress}% memorized
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {versesInProgress.length === 0 && (
          <View style={styles.emptyState}>
            <Target color={theme.textTertiary} size={64} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No verses in progress</Text>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              Browse verses and add them to your learning path to start memorizing
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    width: (width - 60) / 2,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700' as const,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '500' as const,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
  },
  dueBadge: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dueBadgeText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#fff',
  },
  verseCard: {
    width: CARD_WIDTH,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  verseGradient: {
    padding: 20,
    minHeight: 140,
  },
  verseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  verseReference: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
  },
  playButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verseText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#fff',
    marginBottom: 12,
  },
  verseFooter: {
    gap: 8,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
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
  progressPercentage: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#fff',
    minWidth: 40,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  masteryBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    flex: 1,
  },
  gamesBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  gamesBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#fff',
  },
  masteryBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#fff',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  streakText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#fff',
  },
  upcomingCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  upcomingContent: {
    gap: 8,
  },
  upcomingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  upcomingReference: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  upcomingText: {
    fontSize: 14,
    lineHeight: 20,
  },
  upcomingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  upcomingMasteryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  upcomingMasteryText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  nextReviewText: {
    fontSize: 12,
    fontWeight: '500' as const,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 32,
  },
});
