import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Target, CheckCircle2, Flame, TrendingUp, Play, Trophy, ArrowRight, ArrowLeft, AlertCircle, RotateCcw, MoreVertical, Trash2, Archive, Crown, Heart, ChevronDown, ChevronUp } from 'lucide-react-native';
import { useVerses } from '@/contexts/VerseContext';
import { usePrayer } from '@/contexts/PrayerContext';
import { useTheme } from '@/contexts/ThemeContext';
import { CATEGORIES } from '@/mocks/verses';
import { GameType } from '@/types/verse';
import { generatePrayerFromVerse } from '@/services/prayerAI';

const GAME_INFO: Record<GameType, { title: string; description: string }> = {
  'fill-blank': {
    title: 'Fill in the Blank',
    description: 'Tap the missing words to complete the verse',
  },
  'word-order': {
    title: 'Word Order',
    description: 'Arrange the words in the correct order',
  },
  'full-verse': {
    title: 'Full Verse',
    description: 'Type the entire verse from memory',
  },
  'flashcard': {
    title: 'Flashcard',
    description: 'Review the verse with flashcard-style memorization',
  },
  'speed-tap': {
    title: 'Speed Tap',
    description: 'Tap words quickly in the correct order',
  },
  'progressive-reveal': {
    title: 'Progressive Reveal',
    description: 'Reveal words one at a time to build memory',
  },
  'verse-order': {
    title: 'Verse Order',
    description: 'Arrange verses in the correct order',
  },
  'progressive-review': {
    title: 'Progressive Review',
    description: 'Type each unlocked verse from memory',
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
  const { verses, chapters, getVerseProgress, addToProgress, advanceToNextLevel, getFirstIncompleteLevel, resetToLevel, deleteVerse, archiveVerse, getChapterUnlockedVerses, unlockNextVerseInChapter } = useVerses();
  const { addPrayerRequest, reloadPrayers } = usePrayer();
  const { theme } = useTheme();
  const [showDayCompleteModal, setShowDayCompleteModal] = useState(false);
  const [showIncompleteWarning, setShowIncompleteWarning] = useState(false);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [isGeneratingPrayer, setIsGeneratingPrayer] = useState(false);
  const [isChapterProgressExpanded, setIsChapterProgressExpanded] = useState(false);

  // Check if it's a chapter or regular verse
  const chapter = chapters.find(c => c.id === id);
  const verse = chapter || verses.find(v => v.id === id);
  const isChapter = !!chapter;
  const verseProgress = getVerseProgress(id || '');
  const category = CATEGORIES.find(c => c.name === verse?.category);
  const unlockedVerses = isChapter ? getChapterUnlockedVerses(id || '') : [];

  if (!verse) {
    return (
      <View style={styles.container}>
        <Text>Verse not found</Text>
      </View>
    );
  }

  const handleAddToProgress = async () => {
    if (id) {
      await addToProgress(id);
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
  const requiredGames = isChapter ? 2 : (verseProgress?.difficultyLevel === 5 ? 1 : 3);
  const isDue = verseProgress ? verseProgress.completedGamesToday < requiredGames : false;
  const isDayComplete = verseProgress ? areAllGamesCompleted() : false;
  const isMastered = isChapter 
    ? (verseProgress?.chapterProgress?.isComplete || false)
    : (verseProgress ? verseProgress.difficultyLevel === 5 && verseProgress.overallProgress === 100 : false);
  const canAdvanceToNextLevel = verseProgress ? isDayComplete && verseProgress.completedGamesToday >= requiredGames : false;
  const firstIncompleteLevel = id ? getFirstIncompleteLevel(id) : null;
  const hasIncompleteLevels = firstIncompleteLevel !== null && verseProgress && firstIncompleteLevel < verseProgress.difficultyLevel;
  const isStuck = !isChapter && hasIncompleteLevels && isDayComplete;

  const handleAdvanceLevel = async () => {
    if (id) {
      if (isChapter) {
        // For chapters: unlock verses first, then advance levels
        const currentVerseIndex = verseProgress?.chapterProgress?.currentVerseIndex || 0;
        const totalVerses = chapter?.verses.length || 0;
        const allVersesUnlocked = currentVerseIndex >= totalVerses - 1;
        
        if (!allVersesUnlocked) {
          // Still have verses to unlock - unlock next verse
          await unlockNextVerseInChapter(id);
          setShowDayCompleteModal(false);
        } else if (verseProgress.difficultyLevel < 5) {
          // All verses unlocked - advance difficulty level
          advanceToNextLevel(id);
          setShowDayCompleteModal(false);
        } else {
          // Already at max level and all verses unlocked
          setShowDayCompleteModal(false);
        }
      } else {
        // For regular verses: advance to next level
        const firstIncompleteLevel = getFirstIncompleteLevel(id);
        if (firstIncompleteLevel && firstIncompleteLevel < (verseProgress?.difficultyLevel || 1)) {
          setShowIncompleteWarning(true);
          setShowDayCompleteModal(false);
          return;
        }
        advanceToNextLevel(id);
        setShowDayCompleteModal(false);
      }
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

  const handleDeleteVerse = async () => {
    if (id) {
      await deleteVerse(id);
      router.back();
    }
  };

  const handleArchiveVerse = async () => {
    if (id) {
      await archiveVerse(id);
      router.back();
    }
  };

  const handlePlayNextIncomplete = () => {
    if (!verseProgress || !id) return;
    
    const currentGames = verseProgress.currentDayGames;
    const firstIncompleteGame = currentGames.find(gameType => !isGameCompleted(gameType));
    
    if (firstIncompleteGame) {
      // For chapters, determine game target and include chapter ID for progress tracking
      let gameTargetId = id;
      let chapterParam = '';
      if (isChapter && verseProgress.chapterProgress) {
        if (firstIncompleteGame === 'progressive-reveal' || firstIncompleteGame === 'flashcard') {
          const currentVerse = unlockedVerses[verseProgress.chapterProgress.currentVerseIndex];
          gameTargetId = currentVerse?.id || id;
          chapterParam = `?chapterId=${id}`;
        }
      }
      router.push(`/game/${firstIncompleteGame}/${gameTargetId}${chapterParam}`);
    }
  };

  const handleConvertToPrayer = async () => {
    if (!verse) {
      Alert.alert('Error', 'Verse not found. Please try again.');
      return;
    }

    setShowOptionsModal(false);
    setIsGeneratingPrayer(true);
    
    try {
      const generatedPrayer = await generatePrayerFromVerse({
        reference: verse.reference,
        text: verse.text,
        category: verse.category,
      });

      const prayerData = {
        ...generatedPrayer,
        status: 'active' as const,
        reminderEnabled: false,
        verseId: verse.id,
        verseReference: verse.reference,
        isInProgress: true, // Add directly to progress
      };

      const prayerId = await addPrayerRequest(prayerData);

      // Wait for AsyncStorage to complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Reload prayers from AsyncStorage to ensure sync
      await reloadPrayers();
      
      // Wait a bit more to ensure React has updated
      await new Promise(resolve => setTimeout(resolve, 300));

      setIsGeneratingPrayer(false);

      Alert.alert(
        'Prayer Created!',
        'A prayer has been generated from this verse and added to your Prayers list.',
        [
          { 
            text: 'View in Prayers', 
            onPress: () => {
              router.push('/(tabs)/prayers' as any);
            }
          },
          { text: 'OK', style: 'cancel' },
        ]
      );
    } catch (error) {
      console.error('Failed to generate prayer:', error);
      setIsGeneratingPrayer(false);
      Alert.alert('Error', 'Failed to generate prayer. Please try again.');
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
          headerBackVisible: false,
          headerLeft: () => (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.push('/(tabs)/verses' as any)}
              activeOpacity={0.7}
            >
              <ArrowLeft color="#fff" size={24} strokeWidth={2.5} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity
              style={styles.optionsButton}
              onPress={() => setShowOptionsModal(true)}
            >
              <MoreVertical color="#fff" size={24} />
            </TouchableOpacity>
          ),
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
                    {verseProgress.overallProgress === 100 ? (
                      <View style={styles.masteredSection}>
                        <Crown color="#10b981" size={48} fill="#10b981" />
                        <Text style={styles.masteredMainText}>Mastered</Text>
                      </View>
                    ) : (
                      <>
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
                      </>
                    )}
                  </View>
                  {isDue && verseProgress.overallProgress < 100 && (
                    <TouchableOpacity 
                      style={styles.dueIndicator}
                      onPress={handlePlayNextIncomplete}
                      activeOpacity={0.8}
                    >
                      <Play color="#fff" size={16} fill="#fff" />
                    </TouchableOpacity>
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
                    <Text style={[styles.statValue, { color: theme.text }]}>{verseProgress.daysInProgress || 0}</Text>
                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Days</Text>
                  </View>
                  <View style={styles.statItem}>
                    <CheckCircle2 color="#8b5cf6" size={20} />
                    <Text style={[styles.statValue, { color: theme.text }]}>{verseProgress.gameSessions.length}</Text>
                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Sessions</Text>
                  </View>
                </View>
              </View>

              {isChapter && verseProgress.chapterProgress && (
                <TouchableOpacity 
                  style={[styles.chapterInfoCard, { backgroundColor: theme.cardBackground }]}
                  onPress={() => setIsChapterProgressExpanded(!isChapterProgressExpanded)}
                  activeOpacity={0.7}
                >
                  <View style={styles.chapterInfoHeader}>
                    <View style={styles.chapterInfoHeaderLeft}>
                      <Text style={[styles.chapterInfoTitle, { color: theme.text }]}>
                        Learning verse {verseProgress.chapterProgress.currentVerseIndex + 1} of {chapter.verses.length}
                      </Text>
                      {/* Progress bar */}
                      <View style={[styles.chapterProgressBar, { backgroundColor: theme.border }]}>
                        <View 
                          style={[
                            styles.chapterProgressBarFill, 
                            { 
                              backgroundColor: category?.color || '#667eea',
                              width: `${((verseProgress.chapterProgress.currentVerseIndex + 1) / chapter.verses.length) * 100}%`
                            }
                          ]} 
                        />
                      </View>
                    </View>
                    {isChapterProgressExpanded ? (
                      <ChevronUp color={theme.textSecondary} size={24} />
                    ) : (
                      <ChevronDown color={theme.textSecondary} size={24} />
                    )}
                  </View>
                  
                  {isChapterProgressExpanded && (
                    <>
                      <View style={styles.versesProgressContainer}>
                        {chapter.verses.map((v, index) => {
                          const isUnlocked = verseProgress.chapterProgress!.unlockedVerses.includes(index);
                          const isMastered = verseProgress.chapterProgress!.masteredVerses.includes(index);
                          const isCurrent = index === verseProgress.chapterProgress!.currentVerseIndex;
                          
                          // Color scheme: mastered=green, unlocked=yellow, locked=gray
                          let backgroundColor = theme.border; // locked (gray)
                          let textColor = theme.textSecondary;
                          if (isMastered) {
                            backgroundColor = '#10b981'; // mastered (green)
                            textColor = '#fff';
                          } else if (isUnlocked) {
                            backgroundColor = '#f59e0b'; // unlocked (yellow/orange)
                            textColor = '#fff';
                          }
                          
                          return (
                            <View key={v.id} style={[
                              styles.verseProgressItem,
                              { backgroundColor },
                              isCurrent && styles.verseProgressItemCurrent,
                            ]}>
                              <Text style={[
                                styles.verseProgressText,
                                { color: textColor }
                              ]}>
                                {index + 1}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                      <View style={styles.legendRow}>
                        <View style={styles.legendItem}>
                          <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
                          <Text style={[styles.legendText, { color: theme.textSecondary }]}>Mastered</Text>
                        </View>
                        <View style={styles.legendItem}>
                          <View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} />
                          <Text style={[styles.legendText, { color: theme.textSecondary }]}>Unlocked</Text>
                        </View>
                        <View style={styles.legendItem}>
                          <View style={[styles.legendDot, { backgroundColor: theme.border }]} />
                          <Text style={[styles.legendText, { color: theme.textSecondary }]}>Locked</Text>
                        </View>
                      </View>
                    </>
                  )}
                </TouchableOpacity>
              )}

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
                    <View style={[styles.dayCompleteCard, { backgroundColor: theme.cardBackground }]}>
                      <Trophy color="#f59e0b" size={48} />
                      <Text style={[styles.dayCompleteTitle, { color: theme.text }]}>
                        {isChapter 
                          ? `Verse ${(verseProgress?.chapterProgress?.currentVerseIndex || 0) + 1} Complete!`
                          : `Level ${verseProgress.difficultyLevel} Complete!`
                        }
                      </Text>
                      <Text style={[styles.dayCompleteText, { color: theme.textSecondary }]}>
                        {isChapter
                          ? verseProgress?.chapterProgress?.currentVerseIndex < (chapter?.verses.length || 0) - 1
                            ? 'Great job! Ready to continue to the next verse?'
                            : 'Amazing! You\'ve completed all verses in this chapter!'
                          : 'Great job! You\'ve completed all games for today.'
                        }
                      </Text>
                      {isChapter && canAdvanceToNextLevel && verseProgress?.chapterProgress?.currentVerseIndex < (chapter?.verses.length || 0) - 1 && (
                        <TouchableOpacity
                          style={styles.advanceButton}
                          onPress={() => setShowDayCompleteModal(true)}
                          activeOpacity={0.9}
                        >
                          <Text style={styles.advanceButtonText}>Continue to Next Verse</Text>
                          <ArrowRight color="#fff" size={20} />
                        </TouchableOpacity>
                      )}
                      {!isChapter && canAdvanceToNextLevel && verseProgress.difficultyLevel < 5 && (
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
                        <Text style={[styles.masteredText, { color: '#10b981' }]}>
                          {isChapter ? 'You\'ve mastered this chapter! 🎉' : 'You\'ve mastered this verse! 🎉'}
                        </Text>
                      )}
                    </View>
                  </View>
                ) : (
                  <Text style={styles.gamesSubtitle}>
                    {isChapter
                      ? `Complete all ${requiredGames} games for Verse ${(verseProgress?.chapterProgress?.currentVerseIndex || 0) + 1}`
                      : `Complete all ${requiredGames} ${requiredGames === 1 ? 'game' : 'games'} to finish Level ${verseProgress.difficultyLevel}`
                    }
                  </Text>
                )}

                <View style={styles.gamesGrid}>
                  {currentPathGames.map((gameType, index) => {
                    const gameInfo = GAME_INFO[gameType];
                    const isCompleted = isGameCompleted(gameType);

                    // For chapters, determine which ID to pass to the game
                    let gameTargetId = id;
                    let chapterParam = '';
                    if (isChapter && verseProgress?.chapterProgress) {
                      // Single-verse games: pass current verse ID
                      if (gameType === 'progressive-reveal' || gameType === 'flashcard') {
                        const currentVerse = unlockedVerses[verseProgress.chapterProgress.currentVerseIndex];
                        gameTargetId = currentVerse?.id || id;
                        chapterParam = `?chapterId=${id}`; // Pass chapter ID for progress tracking
                      }
                      // Multi-verse games: pass chapter ID (already set)
                    }

                    return (
                      <TouchableOpacity
                        key={`${gameType}-${index}`}
                        style={[styles.gameCard, { backgroundColor: theme.cardBackground }]}
                        onPress={() => router.push(`/game/${gameType}/${gameTargetId}${chapterParam}`)}
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
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {isChapter ? 'Verse Complete!' : 'Day Complete!'}
            </Text>
            <Text style={[styles.modalText, { color: theme.textSecondary }]}>
              {isChapter
                ? `You've completed Verse ${(verseProgress?.chapterProgress?.currentVerseIndex || 0) + 1}. Ready to continue?`
                : `You've completed Level ${verseProgress?.difficultyLevel}. Ready to advance?`
              }
            </Text>
            <Text style={[styles.modalSubtext, { color: theme.textTertiary }]}>
              {isChapter
                ? 'If you don\'t continue now, the next verse will unlock tomorrow morning.'
                : 'If you don\'t continue now, the next level will unlock tomorrow morning.'
              }
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

      <Modal
        visible={showOptionsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOptionsModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowOptionsModal(false)}
        >
          <View style={[styles.optionsContent, { backgroundColor: theme.cardBackground }]}>
            <TouchableOpacity
              style={styles.optionItem}
              onPress={handleConvertToPrayer}
              activeOpacity={0.7}
              disabled={isGeneratingPrayer}
            >
              {isGeneratingPrayer ? (
                <ActivityIndicator size="small" color="#ec4899" />
              ) : (
                <Heart color="#ec4899" size={22} />
              )}
              <Text style={[styles.optionText, { color: theme.text }]}>
                {isGeneratingPrayer ? 'Generating...' : 'Convert to Prayer'}
              </Text>
            </TouchableOpacity>
            {verseProgress && (
              <>
                <View style={[styles.optionDivider, { backgroundColor: theme.border }]} />
                <TouchableOpacity
                  style={styles.optionItem}
                  onPress={() => {
                    setShowOptionsModal(false);
                    setShowArchiveConfirm(true);
                  }}
                  activeOpacity={0.7}
                >
                  <Archive color="#3b82f6" size={22} />
                  <Text style={[styles.optionText, { color: theme.text }]}>Archive Verse</Text>
                </TouchableOpacity>
                <View style={[styles.optionDivider, { backgroundColor: theme.border }]} />
                <TouchableOpacity
                  style={styles.optionItem}
                  onPress={() => {
                    setShowOptionsModal(false);
                    setShowDeleteConfirm(true);
                  }}
                  activeOpacity={0.7}
                >
                  <Trash2 color="#ef4444" size={22} />
                  <Text style={[styles.optionText, { color: '#ef4444' }]}>Delete Verse</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showDeleteConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteConfirm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.cardBackground }]}>
            <AlertCircle color="#ef4444" size={64} />
            <Text style={[styles.modalTitle, { color: theme.text }]}>Delete Verse?</Text>
            <Text style={[styles.modalText, { color: theme.textSecondary }]}>
              This will permanently delete all progress for this verse. This action cannot be undone.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary, { backgroundColor: theme.border }]}
                onPress={() => setShowDeleteConfirm(false)}
                activeOpacity={0.8}
              >
                <Text style={[styles.modalButtonText, { color: theme.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#ef4444' }]}
                onPress={handleDeleteVerse}
                activeOpacity={0.8}
              >
                <Text style={styles.modalButtonTextPrimary}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showArchiveConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowArchiveConfirm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.cardBackground }]}>
            <Archive color="#3b82f6" size={64} />
            <Text style={[styles.modalTitle, { color: theme.text }]}>Archive Verse?</Text>
            <Text style={[styles.modalText, { color: theme.textSecondary }]}>
              This verse will be moved to your archived list. You can unarchive it later from the Progress screen.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary, { backgroundColor: theme.border }]}
                onPress={() => setShowArchiveConfirm(false)}
                activeOpacity={0.8}
              >
                <Text style={[styles.modalButtonText, { color: theme.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#3b82f6' }]}
                onPress={handleArchiveVerse}
                activeOpacity={0.8}
              >
                <Text style={styles.modalButtonTextPrimary}>Archive</Text>
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
  masteredSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  masteredMainText: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#10b981',
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  optionsButton: {
    padding: 8,
    marginRight: 8,
  },
  optionsContent: {
    marginTop: 'auto',
    marginBottom: 'auto',
    marginHorizontal: 24,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 20,
  },
  optionDivider: {
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  optionText: {
    fontSize: 17,
    fontWeight: '600' as const,
  },
  // Chapter-specific styles
  chapterInfoCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  chapterInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  chapterInfoHeaderLeft: {
    flex: 1,
  },
  chapterInfoTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    marginBottom: 8,
  },
  chapterProgressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  chapterProgressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  chapterInfoText: {
    fontSize: 14,
    marginBottom: 16,
  },
  versesProgressContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  verseProgressItem: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verseProgressItemCurrent: {
    borderWidth: 3,
    borderColor: '#667eea',
  },
  verseProgressText: {
    fontSize: 14,
    fontWeight: '700' as const,
  },
  legendRow: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
  },
});
