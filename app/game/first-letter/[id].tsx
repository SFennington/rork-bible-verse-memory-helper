import React, { useState } from 'react';
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
import { CheckCircle2, XCircle, ArrowRight } from 'lucide-react-native';
import { useVerses } from '@/contexts/VerseContext';
import { CATEGORIES } from '@/mocks/verses';

export default function FirstLetterGameScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { verses, completeGameSession, getVerseProgress } = useVerses();
  const [inputs, setInputs] = useState<Record<number, string>>({});
  const [showResult, setShowResult] = useState(false);
  const [startTime] = useState(Date.now());

  const verse = verses.find(v => v.id === id);
  const category = CATEGORIES.find(c => c.name === verse?.category);

  if (!verse) {
    return (
      <View style={styles.container}>
        <Text>Verse not found</Text>
      </View>
    );
  }

  const words = verse.text.split(' ');

  const handleInputChange = (index: number, value: string) => {
    setInputs(prev => ({ ...prev, [index]: value }));
  };

  const handleCheck = () => {
    Keyboard.dismiss();
    setShowResult(true);

    const correctCount = words.filter((word, index) => {
      const input = inputs[index]?.trim().toLowerCase();
      return input === word.toLowerCase();
    }).length;
    const accuracy = Math.round((correctCount / words.length) * 100);
    const timeSpent = Math.round((Date.now() - startTime) / 1000);

    if (accuracy === 100) {
      const verseProgress = getVerseProgress(id || '');
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

  const handleContinue = () => {
    if (isCorrect) {
      router.push(`/verse/${id}`);
    } else {
      router.replace(`/game/first-letter/${id}`);
    }
  };

  const isComplete = words.every((_, index) => inputs[index]?.trim());
  const isCorrect = showResult && words.every((word, index) => {
    const input = inputs[index]?.trim().toLowerCase();
    return input === word.toLowerCase();
  });
  const accuracy = showResult ? Math.round(
    (words.filter((word, index) => {
      const input = inputs[index]?.trim().toLowerCase();
      return input === word.toLowerCase();
    }).length / words.length) * 100
  ) : 0;

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
                const input = inputs[index] || '';
                const isWrong = showResult && input.trim().toLowerCase() !== word.toLowerCase();
                const isRight = showResult && input.trim().toLowerCase() === word.toLowerCase();

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
                  {isCorrect ? 'Perfect!' : `${accuracy}% Complete`}
                </Text>
              </View>
              <Text style={styles.resultText}>
                {isCorrect
                  ? 'You completed this memory game!'
                  : 'Keep practicing to master this verse'}
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
            <TouchableOpacity
              style={styles.continueButton}
              onPress={handleContinue}
              activeOpacity={0.9}
            >
              <Text style={styles.continueButtonText}>
                {isCorrect ? 'Continue' : 'Try Again'}
              </Text>
            </TouchableOpacity>
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
  continueButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1f2937',
  },
});
