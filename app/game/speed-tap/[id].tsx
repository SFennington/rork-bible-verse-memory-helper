import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { CheckCircle2, XCircle, ArrowRight, Home, ArrowLeft, Zap } from 'lucide-react-native';
import { useVerses } from '@/contexts/VerseContext';
import { useTheme } from '@/contexts/ThemeContext';
import { CATEGORIES } from '@/mocks/verses';

function isToday(dateString: string): boolean {
  const date = new Date(dateString);
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

function stripPunctuation(word: string): string {
  return word.replace(/[.,;:!?"()[\]{}\-—]/g, '').trim();
}

export default function SpeedTapGameScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { verses, completeGameSession, getVerseProgress } = useVerses();
  const { theme } = useTheme();
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [scaleAnim] = useState(new Animated.Value(1));
  const [startTime] = useState(Date.now());

  const verse = verses.find(v => v.id === id);
  const category = CATEGORIES.find(c => c.name === verse?.category);
  const verseProgress = getVerseProgress(id || '');
  const difficultyLevel = verseProgress?.difficultyLevel || 1;

  const gameData = useMemo(() => {
    if (!verse) return null;

    const correctWords = verse.text.split(' ').map(word => stripPunctuation(word)).filter(word => word.length > 0);
    
    // Create a mix of correct and incorrect words based on difficulty
    let wrongWordPercentage = 0.3; // 30% wrong words
    switch (difficultyLevel) {
      case 1:
        wrongWordPercentage = 0.2; // 20% wrong - easier
        break;
      case 2:
        wrongWordPercentage = 0.3; // 30% wrong - medium
        break;
      case 3:
        wrongWordPercentage = 0.4; // 40% wrong - hard
        break;
      case 4:
        wrongWordPercentage = 0.5; // 50% wrong - expert
        break;
    }

    const numWrongWords = Math.floor(correctWords.length * wrongWordPercentage);
    
    // Pick random positions for wrong words
    const wrongIndices = new Set<number>();
    while (wrongIndices.size < numWrongWords) {
      wrongIndices.add(Math.floor(Math.random() * correctWords.length));
    }

    // Create shuffled words with some wrong ones
    const shuffledWords = correctWords.map((word, index) => {
      if (wrongIndices.has(index)) {
        // Insert a random word from the verse in the wrong position
        const randomIndex = Math.floor(Math.random() * correctWords.length);
        return correctWords[randomIndex];
      }
      return word;
    });

    // Determine if each word is in correct position
    const correctPositions = shuffledWords.map((word, index) => word === correctWords[index]);

    return {
      words: shuffledWords,
      correctPositions,
      correctWords,
    };
  }, [verse, difficultyLevel]);

  if (!verse || !gameData) {
    return (
      <View style={styles.container}>
        <Text>Verse not found</Text>
      </View>
    );
  }

  const handleAnswer = (isCorrect: boolean) => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    const newAnswers = [...answers, isCorrect];
    setAnswers(newAnswers);

    if (currentWordIndex < gameData.words.length - 1) {
      setCurrentWordIndex(currentWordIndex + 1);
    } else {
      // Game complete - check answers
      handleGameComplete(newAnswers);
    }
  };

  const handleGameComplete = (finalAnswers: boolean[]) => {
    setShowResult(true);
    
    const correctCount = finalAnswers.filter((answer, index) => 
      answer === gameData.correctPositions[index]
    ).length;
    
    const accuracy = Math.round((correctCount / gameData.words.length) * 100);
    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    const isCorrect = accuracy === 100;

    if (isCorrect) {
      completeGameSession(id || '', {
        gameType: 'speed-tap',
        completedAt: new Date().toISOString(),
        accuracy,
        timeSpent,
        mistakeCount: gameData.words.length - correctCount,
        correctWords: correctCount,
        totalWords: gameData.words.length,
        difficultyLevel: verseProgress?.difficultyLevel || 1,
      });
    }
  };

  const handleContinue = () => {
    const correctCount = answers.filter((answer, index) => 
      answer === gameData.correctPositions[index]
    ).length;
    const accuracy = Math.round((correctCount / gameData.words.length) * 100);
    const isCorrect = accuracy === 100;

    if (isCorrect) {
      const verseProgress = getVerseProgress(id || '');
      const requiredGames = verseProgress?.difficultyLevel === 5 ? 1 : 3;
      const games = verseProgress?.currentDayGames || [];
      const completedGames = verseProgress?.gameSessions
        .filter(s => isToday(s.completedAt) && s.difficultyLevel === verseProgress?.difficultyLevel)
        .map(s => s.gameType) || [];
      
      const nextGame = games.find(g => !completedGames.includes(g));
      
      if (nextGame) {
        router.replace(`/game/${nextGame}/${id}`);
      } else {
        router.push(`/verse/${id}`);
      }
    } else {
      // Try again
      setCurrentWordIndex(0);
      setAnswers([]);
      setShowResult(false);
    }
  };

  const handleExit = () => {
    router.push('/(tabs)/verses');
  };

  const currentWord = gameData.words[currentWordIndex];
  const isCorrectPosition = gameData.correctPositions[currentWordIndex];
  const progress = ((currentWordIndex) / gameData.words.length) * 100;

  const correctCount = answers.filter((answer, index) => 
    answer === gameData.correctPositions[index]
  ).length;
  const accuracy = answers.length > 0 ? Math.round((correctCount / answers.length) * 100) : 0;
  const finalAccuracy = showResult ? Math.round((correctCount / gameData.words.length) * 100) : 0;
  const isGameCorrect = finalAccuracy === 100;

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Speed Tap',
          headerStyle: {
            backgroundColor: category?.color || '#667eea',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: '700' as const,
          },
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/verses' as any)}
              style={{ marginLeft: 8 }}
            >
              <ArrowLeft color="#fff" size={24} />
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
          <View style={[styles.instructionCard, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.instructionText, { color: theme.textSecondary }]}>
              Tap ✓ if the word is in the <Text style={{ fontWeight: '700' }}>correct position</Text>, or ✗ if it's wrong
            </Text>
          </View>

          {!showResult && (
            <>
              <View style={[styles.progressCard, { backgroundColor: theme.cardBackground }]}>
                <View style={styles.progressHeader}>
                  <Text style={[styles.progressText, { color: theme.text }]}>
                    Word {currentWordIndex + 1} of {gameData.words.length}
                  </Text>
                  <View style={styles.statsRow}>
                    <Zap color="#fbbf24" size={16} />
                    <Text style={[styles.accuracyText, { color: theme.textSecondary }]}>
                      {accuracy}% accurate
                    </Text>
                  </View>
                </View>
                <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { width: `${progress}%`, backgroundColor: category?.color || '#667eea' }
                    ]} 
                  />
                </View>
              </View>

              <Animated.View style={[styles.wordCard, { backgroundColor: theme.cardBackground, transform: [{ scale: scaleAnim }] }]}>
                <Text style={[styles.wordNumber, { color: theme.textTertiary }]}>
                  Position {currentWordIndex + 1}
                </Text>
                <Text style={[styles.currentWord, { color: theme.text }]}>
                  {currentWord}
                </Text>
                <Text style={[styles.wordHint, { color: theme.textSecondary }]}>
                  Is this word in the correct position?
                </Text>
              </Animated.View>

              <View style={styles.answerButtons}>
                <TouchableOpacity
                  style={[styles.answerButton, styles.wrongButton, { backgroundColor: theme.buttonError }]}
                  onPress={() => handleAnswer(false)}
                  activeOpacity={0.8}
                >
                  <XCircle color={theme.buttonErrorText} size={48} />
                  <Text style={[styles.answerButtonText, { color: theme.buttonErrorText }]}>Wrong Position</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.answerButton, styles.correctButton, { backgroundColor: theme.buttonSuccess }]}
                  onPress={() => handleAnswer(true)}
                  activeOpacity={0.8}
                >
                  <CheckCircle2 color={theme.buttonSuccessText} size={48} />
                  <Text style={[styles.answerButtonText, { color: theme.buttonSuccessText }]}>Correct Position</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {showResult && (
            <>
              <View
                style={[
                  styles.resultCard,
                  { backgroundColor: isGameCorrect ? theme.resultSuccess : theme.resultError },
                ]}
              >
                <View style={styles.resultHeader}>
                  {isGameCorrect ? (
                    <CheckCircle2 color="#4ade80" size={32} />
                  ) : (
                    <XCircle color="#f87171" size={32} />
                  )}
                  <Text style={[styles.resultTitle, { color: isGameCorrect ? theme.resultSuccessText : theme.resultErrorText }]}>
                    {isGameCorrect ? 'Perfect!' : `${finalAccuracy}% Correct`}
                  </Text>
                </View>
                <Text style={[styles.resultText, { color: isGameCorrect ? theme.resultSuccessText : theme.resultErrorText }]}>
                  {isGameCorrect
                    ? 'You identified all word positions correctly!'
                    : 'Review the verse and try again'}
                </Text>
              </View>

              <View style={[styles.reviewCard, { backgroundColor: theme.cardBackground }]}>
                <Text style={[styles.reviewTitle, { color: theme.text }]}>Correct Verse:</Text>
                <Text style={[styles.reviewText, { color: theme.textSecondary }]}>
                  {gameData.correctWords.join(' ')}
                </Text>
                <Text style={[styles.reviewReference, { color: theme.textTertiary }]}>
                  — {verse.reference}
                </Text>
              </View>

              <View style={styles.buttonGroup}>
                {isGameCorrect && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.exitButton, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
                    onPress={handleExit}
                    activeOpacity={0.9}
                  >
                    <Home color={theme.textSecondary} size={20} />
                    <Text style={[styles.exitButtonText, { color: theme.textSecondary }]}>Exit</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.actionButton, styles.continueButton, { backgroundColor: theme.cardBackground }, !isGameCorrect && styles.fullWidthButton]}
                  onPress={handleContinue}
                  activeOpacity={0.9}
                >
                  <Text style={[styles.continueButtonText, { color: theme.text }]}>
                    {isGameCorrect ? 'Continue' : 'Try Again'}
                  </Text>
                  <ArrowRight color={theme.text} size={20} />
                </TouchableOpacity>
              </View>
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  instructionCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  instructionText: {
    fontSize: 15,
    textAlign: 'center',
    fontWeight: '500' as const,
  },
  progressCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  accuracyText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  wordCard: {
    borderRadius: 20,
    padding: 40,
    marginBottom: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  wordNumber: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginBottom: 12,
    textTransform: 'uppercase' as const,
  },
  currentWord: {
    fontSize: 48,
    fontWeight: '700' as const,
    marginBottom: 16,
  },
  wordHint: {
    fontSize: 16,
    fontStyle: 'italic' as const,
  },
  answerButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  answerButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  wrongButton: {},
  correctButton: {},
  answerButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  resultCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
  },
  resultText: {
    fontSize: 16,
    lineHeight: 24,
  },
  reviewCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
  },
  reviewTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    marginBottom: 12,
  },
  reviewText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 8,
  },
  reviewReference: {
    fontSize: 14,
    fontStyle: 'italic' as const,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  continueButton: {},
  exitButton: {
    borderWidth: 2,
  },
  fullWidthButton: {
    flex: 1,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  exitButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
});

