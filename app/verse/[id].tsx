import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Target, CheckCircle2, Flame, TrendingUp, Play, Trophy, ArrowRight, AlertCircle, RotateCcw } from 'lucide-react-native';
import { useVerses } from '@/contexts/VerseContext';
import { useTheme } from '@/contexts/ThemeContext';
import { CATEGORIES } from '@/mocks/verses';
import { GameType } from '@/types/verse';

const GAME_INFO: Record<GameType, { title: string; description: string }> = {
  'fill-blank': {
    title: 'Fill in the Blank',
    description: 'Tap the missing words to complete the verse',
  },
  'word-order': {
    title: 'Word Order',
    description: 'Arrange the words in the correct order',
  },
  'first-letter': {
    title: 'First Letter',
    description: 'Type words using first letter hints',
  },
  'full-verse': {
    title: 'Full Verse',
    description: 'Type the entire verse from memory',
  },
  'word-scramble': {
    title: 'Word Scramble',
    description: 'Unscramble the words in each phrase',
  },
  'missing-vowels': {
    title: 'Missing Vowels',
    description: 'Fill in the missing vowels to complete words',
  },
};

const DIFFICULTY_LABELS = [
  '',
  'Level 1 - Easy',
  'Level 2 - Medium',
  'Level 3 - Hard',
  'Level 4 - Expert',
  'Level 5 - Master',
];

export default function VerseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { verses, getVerseProgress, addToProgress, advanceToNextLevel, getFirstIncompleteLevel, resetToLevel } = useVerses();
  const { theme } = useTheme();
  const [showDayCompleteModal, setShowDayCompleteModal] = useState(false);
  const [showIncompleteWarning, setShowIncompleteWarning] = useState(false);

  const verse = verses.find(v => v.id === id);
  const verseProgress = getVerseProgress(id || '');
  const category = CATEGORIES.find(c => c.name === verse?.category);

  if (!verse) {
    return (
      <View style={styles.container}>
        <Text>Verse not found</Text>
      </View>
    );
  }

  const handleAddToProgress = () => {
    if (id) {
      addToProgress(id);
    }
  };

  const isGameCompleted = (gameType: GameType) => {
    if (!verseProgress) return false;
    const todaysSessions = verseProgress.gameSessions.filter(s => {
      const sessionDate = new Date(s.completedAt);
      const today = new Date();
      return sessionDate.toDateString() === today.toDateString() && s.difficultyLevel === verseProgress.difficultyLevel;
    });
    return todaysSessions.some(s => s.gameType === gameType);
  };

  const areAllGamesCompleted = () => {
    if (!verseProgress) return false;
    const currentGames = verseProgress.currentDayGames;
    return currentGames.every(gameType => isGameCompleted(gameType));
  };

  const currentPathGames = verseProgress?.currentDayGames || [];
  const requiredGames = verseProgress?.difficultyLevel === 5 ? 1 : 3;
  const isDue = verseProgress ? verseProgress.completedGamesToday < requiredGames : false;
  const isDayComplete = verseProgress ? areAllGamesCompleted() : false;
  const isMastered = verseProgress ? verseProgress.difficultyLevel === 5 && verseProgress.overallProgress === 100 : false;
  const canAdvanceToNextLevel = verseProgress ? isDayComplete && verseProgress.completedGamesToday >= requiredGames : false;
  const firstIncompleteLevel = id ? getFirstIncompleteLevel(id) : null;
  const hasIncompleteLevels = firstIncompleteLevel !== null && verseProgress && firstIncompleteLevel < verseProgress.difficultyLevel;
  const isStuck = hasIncompleteLevels && isDayComplete;

  const handleAdvanceLevel = () => {
    if (id) {
      const firstIncompleteLevel = getFirstIncompleteLevel(id);
      if (firstIncompleteLevel && firstIncompleteLevel < (verseProgress?.difficultyLevel || 1)) {
        setShowIncompleteWarning(true);
        setShowDayCompleteModal(false);
        return;
      }
      advanceToNextLevel(id);
      setShowDayCompleteModal(false);
    }
  };

  const handleResetToIncompleteLevel = () => {
    if (id) {
      const firstIncompleteLevel = getFirstIncompleteLevel(id);
      if (firstIncompleteLevel) {
        resetToLevel(id, firstIncompleteLevel);
        setShowIncompleteWarning(false);
      }
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: verse.reference,
          headerStyle: {
            backgroundColor: category?.color || '#667eea',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: '700' as const,
          },
        }}
      />
      <LinearGradient
        colors={category?.gradient || ['#667eea', '#764ba2']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {!verseProgress ? (
            <View style={styles.addToProgressSection}>
              <View style={styles.addToProgressCard}>
                <Target color="#667eea" size={48} />
                <Text style={styles.addToProgressTitle}>Start Learning</Text>
                <Text style={styles.addToProgressText}>
                  Add this verse to your progress to begin the memorization journey
                </Text>
                <TouchableOpacity
                  style={styles.addToProgressButton}
                  onPress={handleAddToProgress}
                  activeOpacity={0.9}
                >
                  <Text style={styles.addToProgressButtonText}>Add to My Progress</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              <View style={[styles.progressCard, { backgroundColor: theme.cardBackground }]}>
                <View style={styles.progressHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.progressTitle, { color: theme.text }]}>Your Progress</Text>
                    <Text style={[styles.masteryLabel, { color: theme.textSecondary }]}>
                      {DIFFICULTY_LABELS[verseProgress.difficultyLevel]}
                    </Text>
                    <View style={styles.progressBarSection}>
                      <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: `${verseProgress.overallProgress}%` }]} />
                      </View>
                      <Text style={[styles.progressPercentText, { color: theme.text }]}>
                        {verseProgress.overallProgress}% Memorized
                      </Text>
                    </View>
                  </View>
                  {isDue && (
                    <View style={styles.dueIndicator}>
                      <Play color="#fff" size={16} fill="#fff" />
                    </View>
                  )}
                </View>
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Flame color="#f59e0b" size={20} />
                    <Text style={[styles.statValue, { color: theme.text }]}>{verseProgress.streakDays}</Text>
                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Day Streak</Text>
                  </View>
                  <View style={styles.statItem}>
                    <TrendingUp color="#10b981" size={20} />
                    <Text style={[styles.statValue, { color: theme.text }]}>{verseProgress.reviewCount}</Text>
                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Reviews</Text>
                  </View>
                  <View style={styles.statItem}>
                    <CheckCircle2 color="#8b5cf6" size={20} />
                    <Text style={[styles.statValue, { color: theme.text }]}>{verseProgress.gameSessions.length}</Text>
                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Sessions</Text>
                  </View>
                </View>
              </View>

              <View style={styles.gamesSection}>
                <View style={styles.gamesSectionHeader}>
                  <Text style={styles.gamesTitle}>Today&apos;s Games</Text>
                  <View style={styles.gamesCountBadge}>
                    <Text style={styles.gamesCountText}>{verseProgress.completedGamesToday}/{requiredGames}</Text>
                  </View>
                </View>
                {isStuck ? (
                  <View style={styles.dayCompleteSection}>
                    <View style={styles.warningCard}>
                      <AlertCircle color="#f59e0b" size={48} />
                      <Text style={styles.warningTitle}>Level Incomplete</Text>
                      <Text style={styles.warningText}>
                        You&apos;re at Level {verseProgress.difficultyLevel} but Level {firstIncompleteLevel} isn&apos;t fully complete ({verseProgress.overallProgress}% overall).
                      </Text>
                      <TouchableOpacity
                        style={styles.resetButton}
                        onPress={handleResetToIncompleteLevel}
                        activeOpacity={0.9}
                      >
                        <RotateCcw color="#fff" size={20} />
                        <Text style={styles.resetButtonText}>Go Back to Level {firstIncompleteLevel}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : isDayComplete ? (
                  <View style={styles.dayCompleteSection}>
                    <View style={styles.dayCompleteCard}>
                      <Trophy color="#f59e0b" size={48} />
                      <Text style={styles.dayCompleteTitle}>Level {verseProgress.difficultyLevel} Complete!</Text>
                      <Text style={styles.dayCompleteText}>
                        Great job! You&apos;ve completed all games for today.
                      </Text>
                      {canAdvanceToNextLevel && verseProgress.difficultyLevel < 5 && (
                        <TouchableOpacity
                          style={styles.advanceButton}
                          onPress={() => setShowDayCompleteModal(true)}
                          activeOpacity={0.9}
                        >
                          <Text style={styles.advanceButtonText}>Continue to Next Level</Text>
                          <ArrowRight color="#fff" size={20} />
                        </TouchableOpacity>
                      )}
                      {isMastered && (
                        <Text style={styles.masteredText}>You&apos;ve mastered this verse! 🎉</Text>
                      )}
                    </View>
                  </View>
                ) : (
                  <Text style={styles.gamesSubtitle}>
                    Complete all {requiredGames} {requiredGames === 1 ? 'game' : 'games'} to finish Level {verseProgress.difficultyLevel}
                  </Text>
                )}

                <View style={styles.gamesGrid}>
                  {currentPathGames.map((gameType, index) => {
                    const gameInfo = GAME_INFO[gameType];
                    const isCompleted = isGameCompleted(gameType);

                    return (
                      <TouchableOpacity
                        key={`${gameType}-${index}`}
                        style={[styles.gameCard, { backgroundColor: theme.cardBackground }]}
                        onPress={() => router.push(`/game/${gameType}/${id}`)}
                        activeOpacity={0.9}
                      >
                        <View style={styles.gameCardContent}>
                          <View style={styles.gameHeader}>
                            <View style={styles.gameHeaderLeft}>
                              <View style={styles.gameNumber}>
                                <Text style={styles.gameNumberText}>{index + 1}</Text>
                              </View>
                              <Text style={[styles.gameTitle, { color: theme.text }]}>{gameInfo.title}</Text>
                            </View>
                            {isCompleted ? (
                              <CheckCircle2 color="#4ade80" size={24} />
                            ) : (
                              <View style={styles.playIcon}>
                                <Play color="#667eea" size={16} fill="#667eea" />
                              </View>
                            )}
                          </View>
                          <Text style={[styles.gameDescription, { color: theme.textSecondary }]}>
                            {gameInfo.description}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </>
          )}
        </ScrollView>
      </LinearGradient>

      <Modal
        visible={showDayCompleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDayCompleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.cardBackground }]}>
            <Trophy color="#f59e0b" size={64} />
            <Text style={[styles.modalTitle, { color: theme.text }]}>Day Complete!</Text>
            <Text style={[styles.modalText, { color: theme.textSecondary }]}>
              You&apos;ve completed Level {verseProgress?.difficultyLevel}. Ready to advance?
            </Text>
            <Text style={[styles.modalSubtext, { color: theme.textTertiary }]}>
              If you don&apos;t continue now, the next level will unlock tomorrow morning.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary, { backgroundColor: theme.border }]}
                onPress={() => setShowDayCompleteModal(false)}
                activeOpacity={0.8}
              >
                <Text style={[styles.modalButtonText, { color: theme.text }]}>Wait Until Tomorrow</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleAdvanceLevel}
                activeOpacity={0.8}
              >
                <Text style={styles.modalButtonTextPrimary}>Continue Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showIncompleteWarning}
        transparent
        animationType="fade"
        onRequestClose={() => setShowIncompleteWarning(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.cardBackground }]}>
            <AlertCircle color="#f59e0b" size={64} />
            <Text style={[styles.modalTitle, { color: theme.text }]}>Previous Level Incomplete</Text>
            <Text style={[styles.modalText, { color: theme.textSecondary }]}>
              You need to complete Level {firstIncompleteLevel} before advancing further. Your progress is {verseProgress?.overallProgress}%.
            </Text>
            <Text style={[styles.modalSubtext, { color: theme.textTertiary }]}>
              Would you like to go back to Level {firstIncompleteLevel} and complete it?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary, { backgroundColor: theme.border }]}
                onPress={() => setShowIncompleteWarning(false)}
                activeOpacity={0.8}
              >
                <Text style={[styles.modalButtonText, { color: theme.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleResetToIncompleteLevel}
                activeOpacity={0.8}
              >
                <Text style={styles.modalButtonTextPrimary}>Go to Level {firstIncompleteLevel}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  verseCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  verseReference: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1f2937',
    marginBottom: 16,
  },
  verseText: {
    fontSize: 17,
    lineHeight: 28,
    color: '#374151',
    marginBottom: 16,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  categoryBadgeText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#6b7280',
  },
  addToProgressSection: {
    marginBottom: 24,
  },
  addToProgressCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  addToProgressTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#1f2937',
  },
  addToProgressText: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  addToProgressButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 8,
  },
  addToProgressButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
  },
  progressCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  progressTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  masteryLabel: {
    fontSize: 14,
    fontWeight: '500' as const,
    marginBottom: 12,
  },
  progressBarSection: {
    gap: 8,
  },
  progressBarBg: {
    height: 10,
    backgroundColor: '#e5e7eb',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#667eea',
    borderRadius: 5,
  },
  progressPercentText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  dueIndicator: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700' as const,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500' as const,
  },
  gamesSection: {
    marginBottom: 24,
  },
  gamesSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  gamesTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#fff',
  },
  gamesCountBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  gamesCountText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#fff',
  },
  gamesSubtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 20,
  },
  gamesGrid: {
    gap: 12,
  },
  gameCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  gameCardContent: {
    padding: 20,
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  gameHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  gameNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e0e7ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gameNumberText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#667eea',
  },
  gameTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1f2937',
  },
  playIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e0e7ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gameDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginLeft: 44,
  },
  dayCompleteSection: {
    marginBottom: 20,
  },
  dayCompleteCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  dayCompleteTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#1f2937',
  },
  dayCompleteText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  advanceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#667eea',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 8,
  },
  advanceButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
  },
  masteredText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#10b981',
    textAlign: 'center',
    marginTop: 8,
  },
  warningCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  warningTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#1f2937',
  },
  warningText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f59e0b',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 8,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
  },
  modalText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  modalSubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
  modalButtons: {
    width: '100%',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  modalButtonSecondary: {
    backgroundColor: '#e5e7eb',
  },
  modalButtonPrimary: {
    backgroundColor: '#667eea',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  modalButtonTextPrimary: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
  },
});
