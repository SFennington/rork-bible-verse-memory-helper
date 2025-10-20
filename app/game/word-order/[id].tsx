import React, { useState, useMemo } from 'react';
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
import { CheckCircle2, XCircle, ArrowRight, RotateCcw, Home, ArrowLeft } from 'lucide-react-native';
import { useVerses } from '@/contexts/VerseContext';
import { CATEGORIES } from '@/mocks/verses';

function isToday(dateString: string): boolean {
  const date = new Date(dateString);
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

export default function WordOrderGameScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { verses, completeGameSession, getVerseProgress } = useVerses();
  const [orderedWords, setOrderedWords] = useState<string[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [scaleAnim] = useState(new Animated.Value(1));
  const [startTime] = useState(Date.now());
  const [mistakes, setMistakes] = useState(0);

  const verse = verses.find(v => v.id === id);
  const category = CATEGORIES.find(c => c.name === verse?.category);
  const verseProgress = getVerseProgress(id || '');
  const difficultyLevel = verseProgress?.difficultyLevel || 1;

  const scrambledWords = useMemo(() => {
    if (!verse) return [];
    const words = verse.text.split(' ');
    let scrambledArray = [...words];
    
    const scrambleIterations = difficultyLevel;
    for (let i = 0; i < scrambleIterations; i++) {
      scrambledArray = scrambledArray.sort(() => Math.random() - 0.5);
    }
    
    return scrambledArray;
  }, [verse, difficultyLevel]);

  const [availableWords, setAvailableWords] = useState<string[]>(scrambledWords);

  if (!verse) {
    return (
      <View style={styles.container}>
        <Text>Verse not found</Text>
      </View>
    );
  }

  const correctWords = verse.text.split(' ');

  const handleWordSelect = (word: string, fromAvailable: boolean, index: number) => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.05,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    if (fromAvailable) {
      setOrderedWords([...orderedWords, word]);
      setAvailableWords(prev => prev.filter((_, i) => i !== index));
    } else {
      const newOrderedWords = orderedWords.filter((_, i) => i !== index);
      setOrderedWords(newOrderedWords);
      setAvailableWords([...availableWords, word]);
      if (showResult) {
        setMistakes(prev => prev + 1);
      }
    }
  };

  const handleReset = () => {
    setOrderedWords([]);
    setAvailableWords(scrambledWords);
    setShowResult(false);
    setMistakes(0);
  };

  const handleCheck = () => {
    setShowResult(true);
    const userText = orderedWords.join(' ');
    const correctText = verse.text;
    const isCorrect = userText === correctText;
    
    const distance = levenshteinDistance(userText.toLowerCase(), correctText.toLowerCase());
    const maxLength = Math.max(userText.length, correctText.length);
    const accuracy = Math.round(((maxLength - distance) / maxLength) * 100);
    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    const totalWords = correctWords.length;
    const correctWordCount = isCorrect ? totalWords : Math.round((accuracy / 100) * totalWords);

    if (accuracy >= 80) {
      const verseProgress = getVerseProgress(id || '');
      completeGameSession(id || '', {
        gameType: 'word-order',
        completedAt: new Date().toISOString(),
        accuracy,
        timeSpent,
        mistakeCount: mistakes,
        correctWords: correctWordCount,
        totalWords,
        difficultyLevel: verseProgress?.difficultyLevel || 1,
      });
    }
  };

  const handleContinue = () => {
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
      router.replace(`/game/word-order/${id}`);
    }
  };

  const handleExit = () => {
    router.push('/');
  };

  const isComplete = orderedWords.length === correctWords.length;
  const isCorrect = showResult && orderedWords.join(' ') === verse.text;

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Word Order',
          headerStyle: {
            backgroundColor: category?.color || '#667eea',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: '700' as const,
          },
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.push('/')}
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
          <View style={styles.instructionCard}>
            <Text style={styles.instructionText}>
              Tap the words in the correct order to complete the verse
            </Text>
          </View>

          <View style={styles.verseCard}>
            <View style={styles.verseHeader}>
              <Text style={styles.verseReference}>{verse.reference}</Text>
              <TouchableOpacity
                style={styles.resetButton}
                onPress={handleReset}
                activeOpacity={0.7}
              >
                <RotateCcw color="#6b7280" size={20} />
              </TouchableOpacity>
            </View>

            <View style={styles.orderedWordsContainer}>
              {orderedWords.length === 0 ? (
                <Text style={styles.placeholderText}>
                  Tap words below to build the verse...
                </Text>
              ) : (
                <View style={styles.orderedWordsGrid}>
                  {orderedWords.map((word, index) => (
                    <Animated.View
                      key={`${word}-${index}`}
                      style={{ transform: [{ scale: scaleAnim }] }}
                    >
                      <TouchableOpacity
                        style={[
                          styles.orderedWord,
                          showResult && word !== correctWords[index] && styles.orderedWordWrong,
                          showResult && word === correctWords[index] && styles.orderedWordCorrect,
                        ]}
                        onPress={() => !showResult && handleWordSelect(word, false, index)}
                        disabled={showResult}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.orderedWordText}>{word}</Text>
                      </TouchableOpacity>
                    </Animated.View>
                  ))}
                </View>
              )}
            </View>
          </View>

          <View style={styles.availableSection}>
            <Text style={styles.availableTitle}>Available Words</Text>
            <View style={styles.availableGrid}>
              {availableWords.map((word, index) => (
                <TouchableOpacity
                  key={`${word}-${index}`}
                  style={styles.availableWord}
                  onPress={() => handleWordSelect(word, true, index)}
                  disabled={showResult}
                  activeOpacity={0.8}
                >
                  <Text style={styles.availableWordText}>{word}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {showResult && (
            <View
              style={[
                styles.resultCard,
                isCorrect ? styles.resultCardSuccess : styles.resultCardError,
              ]}
            >
              <View style={styles.resultHeader}>
                {isCorrect ? (
                  <CheckCircle2 color="#4ade80" size={32} />
                ) : (
                  <XCircle color="#f87171" size={32} />
                )}
                <Text style={styles.resultTitle}>
                  {isCorrect ? 'Perfect!' : 'Not quite right'}
                </Text>
              </View>
              <Text style={styles.resultText}>
                {isCorrect
                  ? 'You completed this memory game!'
                  : 'Try again to master this verse'}
              </Text>
            </View>
          )}

          {!showResult && isComplete && (
            <TouchableOpacity
              style={styles.checkButton}
              onPress={handleCheck}
              activeOpacity={0.9}
            >
              <Text style={styles.checkButtonText}>Check Answer</Text>
              <ArrowRight color="#fff" size={20} />
            </TouchableOpacity>
          )}

          {showResult && (
            <View style={styles.buttonGroup}>
              {isCorrect && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.exitButton]}
                  onPress={handleExit}
                  activeOpacity={0.9}
                >
                  <Home color="#6b7280" size={20} />
                  <Text style={styles.exitButtonText}>Exit</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.actionButton, styles.continueButton, !isCorrect && styles.fullWidthButton]}
                onPress={handleContinue}
                activeOpacity={0.9}
              >
                <Text style={styles.continueButtonText}>
                  {isCorrect ? 'Continue' : 'Try Again'}
                </Text>
                <ArrowRight color="#1f2937" size={20} />
              </TouchableOpacity>
            </View>
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
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  instructionText: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    fontWeight: '500' as const,
  },
  verseCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    minHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  verseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  verseReference: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1f2937',
  },
  resetButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  orderedWordsContainer: {
    minHeight: 120,
  },
  placeholderText: {
    fontSize: 15,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 40,
    fontStyle: 'italic' as const,
  },
  orderedWordsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  orderedWord: {
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#818cf8',
  },
  orderedWordCorrect: {
    backgroundColor: '#d1fae5',
    borderColor: '#4ade80',
  },
  orderedWordWrong: {
    backgroundColor: '#fee2e2',
    borderColor: '#f87171',
  },
  orderedWordText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#374151',
  },
  availableSection: {
    marginBottom: 24,
  },
  availableTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 16,
  },
  availableGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  availableWord: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  availableWordText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1f2937',
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
  resultCardSuccess: {
    backgroundColor: '#d1fae5',
  },
  resultCardError: {
    backgroundColor: '#fee2e2',
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
    color: '#1f2937',
  },
  resultText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  checkButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
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
  checkButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1f2937',
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
  continueButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  exitButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
  fullWidthButton: {
    flex: 1,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1f2937',
  },
  exitButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#6b7280',
  },
});
