import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  TextInput,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { CheckCircle2, XCircle, ArrowRight, Home } from 'lucide-react-native';
import { useVerses } from '@/contexts/VerseContext';
import { CATEGORIES } from '@/mocks/verses';

function isToday(dateString: string): boolean {
  const date = new Date(dateString);
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

export default function MissingVowelsGameScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { verses, completeGameSession, getVerseProgress } = useVerses();
  const [userInputs, setUserInputs] = useState<Record<string, string>>({});
  const [showResult, setShowResult] = useState(false);
  const [scaleAnim] = useState(new Animated.Value(1));
  const [startTime] = useState(Date.now());

  const verse = verses.find(v => v.id === id);
  const category = CATEGORIES.find(c => c.name === verse?.category);
  const verseProgress = getVerseProgress(id || '');
  const difficultyLevel = verseProgress?.difficultyLevel || 1;

  const gameData = useMemo(() => {
    if (!verse) return null;

    const words = verse.text.split(' ');
    
    const wordsData = words.map((word, index) => {
      const vowelPattern = /[aeiouAEIOU]/g;
      const vowels = word.match(vowelPattern) || [];
      const vowelCount = vowels.length;
      
      let vowelsToRemove = vowelCount;
      if (difficultyLevel === 1) {
        vowelsToRemove = Math.ceil(vowelCount * 0.5);
      } else if (difficultyLevel === 2) {
        vowelsToRemove = Math.ceil(vowelCount * 0.7);
      }

      const vowelIndices = [];
      for (let i = 0; i < word.length; i++) {
        if (vowelPattern.test(word[i])) {
          vowelIndices.push(i);
        }
      }

      const indicesToRemove = vowelIndices
        .sort(() => Math.random() - 0.5)
        .slice(0, vowelsToRemove);

      const displayWord = word
        .split('')
        .map((char, i) => (indicesToRemove.includes(i) ? '_' : char))
        .join('');

      return {
        original: word,
        display: displayWord,
        missingVowels: indicesToRemove.map(i => word[i]),
        wordIndex: index,
      };
    });

    return { wordsData };
  }, [verse, difficultyLevel]);

  if (!verse || !gameData) {
    return (
      <View style={styles.container}>
        <Text>Verse not found</Text>
      </View>
    );
  }

  const handleInputChange = (wordIndex: number, value: string) => {
    setUserInputs(prev => ({ ...prev, [wordIndex]: value }));

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
  };

  const handleCheck = () => {
    setShowResult(true);
    
    let correctWordsCount = 0;
    const totalWordsCount = gameData.wordsData.length;

    gameData.wordsData.forEach((wordData) => {
      const userWord = userInputs[wordData.wordIndex] || '';
      if (userWord.toLowerCase().trim() === wordData.original.toLowerCase().trim()) {
        correctWordsCount++;
      }
    });

    const accuracy = totalWordsCount > 0 ? Math.round((correctWordsCount / totalWordsCount) * 100) : 0;
    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    const isCorrect = accuracy === 100;

    if (isCorrect) {
      completeGameSession(id || '', {
        gameType: 'missing-vowels',
        completedAt: new Date().toISOString(),
        accuracy,
        timeSpent,
        mistakeCount: totalWordsCount - correctWordsCount,
        correctWords: correctWordsCount,
        totalWords: totalWordsCount,
        difficultyLevel,
      });
    }
  };

  const handleContinue = () => {
    const allCorrect = gameData.wordsData.every((wordData) => {
      const userWord = userInputs[wordData.wordIndex] || '';
      return userWord.toLowerCase().trim() === wordData.original.toLowerCase().trim();
    });

    if (allCorrect) {
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
      router.replace(`/game/missing-vowels/${id}`);
    }
  };

  const handleExit = () => {
    router.push(`/verse/${id}`);
  };

  const totalWords = gameData.wordsData.length;
  const filledWords = Object.keys(userInputs).filter(k => userInputs[k]?.trim()).length;
  const isComplete = filledWords === totalWords;

  const allCorrect = showResult && gameData.wordsData.every((wordData) => {
    const userWord = userInputs[wordData.wordIndex] || '';
    return userWord.toLowerCase().trim() === wordData.original.toLowerCase().trim();
  });

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Missing Vowels',
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
          <View style={styles.instructionCard}>
            <Text style={styles.instructionText}>
              Fill in the missing vowels to complete each word
            </Text>
          </View>

          <View style={styles.verseCard}>
            <Text style={styles.verseReference}>{verse.reference}</Text>
            <View style={styles.wordsContainer}>
              {gameData.wordsData.map((wordData) => {
                const userWord = userInputs[wordData.wordIndex] || '';
                const isWrong = showResult && userWord.toLowerCase().trim() !== wordData.original.toLowerCase().trim();
                const isCorrect = showResult && userWord.toLowerCase().trim() === wordData.original.toLowerCase().trim();

                return (
                  <View key={wordData.wordIndex} style={styles.wordContainer}>
                    <View style={styles.displayWordCard}>
                      <Text style={styles.displayWord}>{wordData.display}</Text>
                    </View>
                    <Text style={styles.arrowText}>↓</Text>
                    <TextInput
                      style={[
                        styles.inputBox,
                        userWord && styles.inputBoxFilled,
                        isWrong && styles.inputBoxWrong,
                        isCorrect && styles.inputBoxCorrect,
                      ]}
                      value={userWord}
                      onChangeText={(text) => handleInputChange(wordData.wordIndex, text)}
                      placeholder="Type word"
                      placeholderTextColor="#9ca3af"
                      editable={!showResult}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                );
              })}
            </View>
          </View>

          {showResult && (
            <View
              style={[
                styles.resultCard,
                allCorrect ? styles.resultCardSuccess : styles.resultCardError,
              ]}
            >
              <View style={styles.resultHeader}>
                {allCorrect ? (
                  <CheckCircle2 color="#4ade80" size={32} />
                ) : (
                  <XCircle color="#f87171" size={32} />
                )}
                <Text style={styles.resultTitle}>
                  {allCorrect ? 'Perfect!' : 'Not quite right'}
                </Text>
              </View>
              <Text style={styles.resultText}>
                {allCorrect
                  ? 'You completed all the words!'
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
              {allCorrect && (
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
                style={[styles.actionButton, styles.continueButton, !allCorrect && styles.fullWidthButton]}
                onPress={handleContinue}
                activeOpacity={0.9}
              >
                <Text style={styles.continueButtonText}>
                  {allCorrect ? 'Continue' : 'Try Again'}
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  verseReference: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1f2937',
    marginBottom: 16,
  },
  wordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  wordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  displayWordCard: {
    backgroundColor: '#ddd6fe',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#8b5cf6',
  },
  displayWord: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#5b21b6',
    fontFamily: 'monospace' as const,
  },
  arrowText: {
    fontSize: 18,
    color: '#6b7280',
    marginHorizontal: 4,
  },
  inputBox: {
    backgroundColor: '#f3f4f6',
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderStyle: 'dashed' as const,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 80,
    fontSize: 15,
    color: '#374151',
    fontWeight: '600' as const,
    textAlign: 'center',
  },
  inputBoxFilled: {
    backgroundColor: '#e0e7ff',
    borderColor: '#818cf8',
    borderStyle: 'solid' as const,
  },
  inputBoxCorrect: {
    backgroundColor: '#d1fae5',
    borderColor: '#4ade80',
  },
  inputBoxWrong: {
    backgroundColor: '#fee2e2',
    borderColor: '#f87171',
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
