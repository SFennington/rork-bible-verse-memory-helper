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
import { useTheme } from '@/contexts/ThemeContext';
import { CATEGORIES } from '@/mocks/verses';

function isToday(dateString: string): boolean {
  const date = new Date(dateString);
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

function stripPunctuation(word: string): string {
  // Remove all punctuation except apostrophes (for contractions like "don't")
  return word.replace(/[.,;:!?"()[\]{}\-—]/g, '').trim();
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
  const { theme } = useTheme();
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
    const words = verse.text.split(/\s+/).map(word => stripPunctuation(word)).filter(word => word.length > 0);
    let scrambledArray = [...words];
    
    // More scramble iterations = harder to recognize original order
    let scrambleIterations = 1;
    let extraDistractorCount = 0;
    
    switch (difficultyLevel) {
      case 1:
        scrambleIterations = 2;   // Lightly scrambled
        extraDistractorCount = 6; // Many extra words to make it easier to spot patterns
        break;
      case 2:
        scrambleIterations = 3;   // Moderately scrambled
        extraDistractorCount = 4; // Some extra words
        break;
      case 3:
        scrambleIterations = 5;   // Well scrambled
        extraDistractorCount = 2; // Few extra words
        break;
      case 4:
        scrambleIterations = 7;   // Heavily scrambled
        extraDistractorCount = 1; // Very few extra words
        break;
      case 5:
        scrambleIterations = 10;  // Completely randomized
        extraDistractorCount = 0; // No extra words
        break;
      default:
        scrambleIterations = 3;
        extraDistractorCount = 3;
    }
    
    for (let i = 0; i < scrambleIterations; i++) {
      scrambledArray = scrambledArray.sort(() => Math.random() - 0.5);
    }
    
    // Add distractor words for easier levels
    if (extraDistractorCount > 0) {
      const distractors: string[] = [];
      const allWordsInVerse = words.filter(w => w.length > 2);
      
      for (let i = 0; i < extraDistractorCount; i++) {
        const randomWord = allWordsInVerse[Math.floor(Math.random() * allWordsInVerse.length)];
        distractors.push(randomWord);
      }
      
      scrambledArray = [...scrambledArray, ...distractors].sort(() => Math.random() - 0.5);
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

  const correctWords = verse.text.split(/\s+/).map(word => stripPunctuation(word)).filter(word => word.length > 0);

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
    const correctText = correctWords.join(' '); // Compare to stripped version, not original
    const isCorrect = userText.toLowerCase() === correctText.toLowerCase();
    
    const distance = levenshteinDistance(userText.toLowerCase(), correctText.toLowerCase());
    const maxLength = Math.max(userText.length, correctText.length);
    const accuracy = Math.round(((maxLength - distance) / maxLength) * 100);
    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    const totalWords = correctWords.length;
    const correctWordCount = isCorrect ? totalWords : Math.round((accuracy / 100) * totalWords);

    if (isCorrect) {
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
      // Return incorrect words to available pool, keep correct ones
      const correctWordsArray = correctWords;
      const newOrderedWords: string[] = [];
      const wordsToReturn: string[] = [];
      
      orderedWords.forEach((word, index) => {
        if (word.toLowerCase() === correctWordsArray[index].toLowerCase()) {
          // Keep correct word in correct position
          newOrderedWords.push(word);
        } else {
          // Return incorrect word to available pool
          wordsToReturn.push(word);
        }
      });
      
      setOrderedWords(newOrderedWords);
      setAvailableWords([...availableWords, ...wordsToReturn]);
      setShowResult(false);
    }
  };

  const handleExit = () => {
    router.push('/');
  };

  const isComplete = orderedWords.length === correctWords.length;
  const isCorrect = showResult && orderedWords.join(' ').toLowerCase() === correctWords.join(' ').toLowerCase();

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
              onPress={() => router.push(`/verse/${id}` as any)}
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
          <View style={styles.topBar}>
            <View style={[styles.instructionCard, { backgroundColor: theme.cardBackground }]}>
              <Text style={[styles.instructionText, { color: theme.textSecondary }]}>
                Tap the words in the correct order to complete the verse
              </Text>
            </View>
            {!showResult && (
              <TouchableOpacity
                style={[styles.exitButtonTop, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
                onPress={handleExit}
                activeOpacity={0.8}
              >
                <Home color={theme.textSecondary} size={20} />
              </TouchableOpacity>
            )}
          </View>

          <View style={[styles.verseCard, { backgroundColor: theme.cardBackground }]}>
            <View style={styles.verseHeader}>
              <Text style={[styles.verseReference, { color: theme.text }]}>{verse.reference}</Text>
              <TouchableOpacity
                style={[styles.resetButton, { backgroundColor: theme.border }]}
                onPress={handleReset}
                activeOpacity={0.7}
              >
                <RotateCcw color={theme.textSecondary} size={20} />
              </TouchableOpacity>
            </View>

            <View style={styles.orderedWordsContainer}>
              {orderedWords.length === 0 ? (
                <Text style={[styles.placeholderText, { color: theme.textTertiary }]}>
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
                          { backgroundColor: theme.cardBackground, borderColor: theme.border },
                          showResult && word.toLowerCase() !== correctWords[index].toLowerCase() && styles.orderedWordWrong,
                          showResult && word.toLowerCase() === correctWords[index].toLowerCase() && styles.orderedWordCorrect,
                        ]}
                        onPress={() => !showResult && handleWordSelect(word, false, index)}
                        disabled={showResult}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.orderedWordText, { color: theme.text }]}>{word}</Text>
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
                  style={[styles.availableWord, { backgroundColor: theme.cardBackground }]}
                  onPress={() => handleWordSelect(word, true, index)}
                  disabled={showResult}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.availableWordText, { color: theme.text }]}>{word}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {showResult && (
            <View
              style={[
                styles.resultCard,
                { backgroundColor: isCorrect ? theme.resultSuccess : theme.resultError },
              ]}
            >
              <View style={styles.resultHeader}>
                {isCorrect ? (
                  <CheckCircle2 color="#4ade80" size={32} />
                ) : (
                  <XCircle color="#f87171" size={32} />
                )}
                <Text style={[styles.resultTitle, { color: isCorrect ? theme.resultSuccessText : theme.resultErrorText }]}>
                  {isCorrect ? 'Perfect!' : 'Not quite right'}
                </Text>
              </View>
              <Text style={[styles.resultText, { color: isCorrect ? theme.resultSuccessText : theme.resultErrorText }]}>
                {isCorrect
                  ? 'You completed this memory game!'
                  : 'Try again to master this verse'}
              </Text>
            </View>
          )}

          {!showResult && (
            <TouchableOpacity
              style={[styles.checkButton, { backgroundColor: theme.cardBackground }]}
              onPress={handleCheck}
              activeOpacity={0.9}
            >
              <Text style={[styles.checkButtonText, { color: theme.text }]}>Check Answers</Text>
              <ArrowRight color="#fff" size={20} />
            </TouchableOpacity>
          )}

          {showResult && (
            <View style={styles.buttonGroup}>
              {isCorrect && (
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
                style={[styles.actionButton, styles.continueButton, { backgroundColor: theme.cardBackground }, !isCorrect && styles.fullWidthButton]}
                onPress={handleContinue}
                activeOpacity={0.9}
              >
                <Text style={[styles.continueButtonText, { color: theme.text }]}>
                  {isCorrect ? 'Continue' : 'Try Again'}
                </Text>
                <ArrowRight color={theme.text} size={20} />
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
  topBar: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  instructionCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
  },
  instructionText: {
    fontSize: 15,
    textAlign: 'center',
    fontWeight: '500' as const,
  },
  exitButtonTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 2,
  },
  verseCard: {
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
  },
  resetButton: {
    padding: 8,
    borderRadius: 8,
  },
  orderedWordsContainer: {
    minHeight: 120,
  },
  placeholderText: {
    fontSize: 15,
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
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 2,
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
  checkButton: {
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
  },
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
