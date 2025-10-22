import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Keyboard,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { CheckCircle2, XCircle, ArrowRight, Home, ArrowLeft } from 'lucide-react-native';
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

const getPreFillPercentage = (level: number): number => {
  switch (level) {
    case 1: return 0.70;  // 70% pre-filled - easiest (only type 30% of words)
    case 2: return 0.50;  // 50% pre-filled - medium (type half)
    case 3: return 0.25;  // 25% pre-filled - hard (type most words)
    case 4: return 0.10;  // 10% pre-filled - expert (type almost everything)
    case 5: return 0;     // 0% pre-filled - master (type every single word)
    default: return 0.50;
  }
};

export default function FirstLetterGameScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { verses, completeGameSession, getVerseProgress } = useVerses();
  const { theme } = useTheme();
  const [inputs, setInputs] = useState<Record<number, string>>({});
  const [showResult, setShowResult] = useState(false);
  const [startTime] = useState(Date.now());

  const verse = verses.find(v => v.id === id);
  const category = CATEGORIES.find(c => c.name === verse?.category);
  const verseProgress = getVerseProgress(id || '');
  const difficultyLevel = verseProgress?.difficultyLevel || 1;

  const words = useMemo(() => 
    verse?.text.split(' ').map(word => stripPunctuation(word)).filter(word => word.length > 0) || [], 
    [verse?.text]
  );

  const preFilledIndices = useMemo(() => {
    const percentage = getPreFillPercentage(difficultyLevel);
    const numToPreFill = Math.floor(words.length * percentage);
    const indices = new Set<number>();
    
    const allIndices = words.map((_, i) => i);
    const shuffled = [...allIndices].sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < numToPreFill && i < shuffled.length; i++) {
      indices.add(shuffled[i]);
    }
    
    return indices;
  }, [words, difficultyLevel]);

  if (!verse) {
    return (
      <View style={styles.container}>
        <Text>Verse not found</Text>
      </View>
    );
  }

  const handleInputChange = (index: number, value: string) => {
    if (preFilledIndices.has(index)) return;
    setInputs(prev => ({ ...prev, [index]: value }));
  };

  const handleCheck = () => {
    Keyboard.dismiss();
    setShowResult(true);

    const correctCount = words.filter((word, index) => {
      const input = preFilledIndices.has(index) ? word : inputs[index]?.trim();
      return input?.toLowerCase() === word.toLowerCase();
    }).length;
    const accuracy = Math.round((correctCount / words.length) * 100);
    const timeSpent = Math.round((Date.now() - startTime) / 1000);

    if (accuracy === 100) {
      completeGameSession(id || '', {
        gameType: 'first-letter',
        completedAt: new Date().toISOString(),
        accuracy,
        timeSpent,
        mistakeCount: words.length - correctCount,
        correctWords: correctCount,
        totalWords: words.length,
        difficultyLevel: verseProgress?.difficultyLevel || 1,
      });
    }
  };

  const isCorrect = showResult && words.every((word, index) => {
    if (preFilledIndices.has(index)) return true;
    const input = inputs[index]?.trim() || '';
    return input.toLowerCase() === word.toLowerCase();
  });
  const accuracy = showResult ? Math.round(
    (words.filter((word, index) => {
      const input = preFilledIndices.has(index) ? word : inputs[index]?.trim();
      return input?.toLowerCase() === word.toLowerCase();
    }).length / words.length) * 100
  ) : 0;

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
      // Only clear incorrect answers, keep correct ones
      const newInputs: Record<number, string> = {};
      words.forEach((word, index) => {
        if (!preFilledIndices.has(index)) {
          const input = inputs[index]?.trim() || '';
          if (input.toLowerCase() === word.toLowerCase()) {
            // Keep correct answer
            newInputs[index] = inputs[index];
          }
        }
      });
      setInputs(newInputs);
      setShowResult(false);
    }
  };

  const handleExit = () => {
    router.push('/');
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'First Letter',
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
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.instructionCard}>
            <Text style={styles.instructionText}>
              Type each word using the first letter as a hint
            </Text>
          </View>

          <View style={styles.verseCard}>
            <Text style={styles.verseReference}>{verse.reference}</Text>
            <View style={styles.wordsContainer}>
              {words.map((word, index) => {
                const isPreFilled = preFilledIndices.has(index);
                const input = inputs[index] || '';
                const isWrong = showResult && !isPreFilled && input.trim().toLowerCase() !== word.toLowerCase();
                const isRight = showResult && (isPreFilled || input.trim().toLowerCase() === word.toLowerCase());

                if (isPreFilled) {
                  return (
                    <View key={index} style={styles.wordInputContainer}>
                      <View style={[styles.wordInput, styles.wordInputPreFilled]}>
                        <Text style={styles.preFilledText}>{word}</Text>
                      </View>
                    </View>
                  );
                }

                return (
                  <View key={index} style={styles.wordInputContainer}>
                    <View style={styles.hintContainer}>
                      <Text style={styles.hintText}>{word[0]}</Text>
                      <Text style={styles.hintDots}>
                        {'•'.repeat(Math.max(0, word.length - 1))}
                      </Text>
                    </View>
                    <TextInput
                      style={[
                        styles.wordInput,
                        input && styles.wordInputFilled,
                        isWrong && styles.wordInputWrong,
                        isRight && styles.wordInputCorrect,
                      ]}
                      value={input}
                      onChangeText={(value) => handleInputChange(index, value)}
                      placeholder={word[0] + '...'}
                      placeholderTextColor="#9ca3af"
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!showResult}
                    />
                    {showResult && isWrong && (
                      <Text style={styles.correctAnswer}>{word}</Text>
                    )}
                  </View>
                );
              })}
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
                  {isCorrect ? 'Perfect!' : `${accuracy}% Complete`}
                </Text>
              </View>
              <Text style={[styles.resultText, { color: isCorrect ? theme.resultSuccessText : theme.resultErrorText }]}>
                {isCorrect
                  ? 'You completed this memory game!'
                  : 'Keep practicing to master this verse'}
              </Text>
            </View>
          )}

          {!showResult && (
            <TouchableOpacity
              style={styles.checkButton}
              onPress={handleCheck}
              activeOpacity={0.9}
            >
              <Text style={styles.checkButtonText}>Check Answers</Text>
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
    marginBottom: 20,
  },
  wordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  wordInputContainer: {
    gap: 8,
  },
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  hintText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#6b7280',
  },
  hintDots: {
    fontSize: 16,
    color: '#d1d5db',
    letterSpacing: 2,
  },
  wordInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500' as const,
    alignSelf: 'flex-start',
    minWidth: 80,
  },
  wordInputFilled: {
    backgroundColor: '#eff6ff',
    borderColor: '#93c5fd',
  },
  wordInputCorrect: {
    backgroundColor: '#d1fae5',
    borderColor: '#4ade80',
  },
  wordInputWrong: {
    backgroundColor: '#fee2e2',
    borderColor: '#f87171',
  },
  wordInputPreFilled: {
    backgroundColor: '#d1fae5',
    borderColor: '#86efac',
    justifyContent: 'center',
  },
  preFilledText: {
    fontSize: 16,
    color: '#15803d',
    fontWeight: '600' as const,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  correctAnswer: {
    fontSize: 14,
    color: '#4ade80',
    fontWeight: '600' as const,
    marginTop: 4,
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
