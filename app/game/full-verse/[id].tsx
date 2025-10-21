import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
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

export default function FullVerseGameScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { verses, completeGameSession, getVerseProgress } = useVerses();
  const { theme } = useTheme();
  const [userInput, setUserInput] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [startTime] = useState(Date.now());
  const [mistakes, setMistakes] = useState(0);

  const verse = verses.find(v => v.id === id);
  const category = CATEGORIES.find(c => c.name === verse?.category);

  if (!verse) {
    return (
      <View style={styles.container}>
        <Text>Verse not found</Text>
      </View>
    );
  }

  const normalizeText = (text: string) => {
    return text.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
  };

  const calculateAccuracy = () => {
    const correctText = normalizeText(verse.text);
    const inputText = normalizeText(userInput);
    
    if (inputText.length === 0) return 0;
    
    const correctWords = correctText.split(' ');
    const inputWords = inputText.split(' ');
    
    let correctCount = 0;
    const maxLength = Math.max(correctWords.length, inputWords.length);
    
    for (let i = 0; i < maxLength; i++) {
      if (correctWords[i] === inputWords[i]) {
        correctCount++;
      }
    }
    
    return Math.round((correctCount / correctWords.length) * 100);
  };

  const handleCheck = () => {
    const accuracy = calculateAccuracy();
    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    const totalWords = verse.text.split(' ').length;
    const correctWords = Math.round((accuracy / 100) * totalWords);
    
    setShowResult(true);
    
    if (accuracy >= 80) {
      const verseProgress = getVerseProgress(id || '');
      completeGameSession(id || '', {
        gameType: 'full-verse',
        completedAt: new Date().toISOString(),
        accuracy,
        timeSpent,
        mistakeCount: mistakes,
        correctWords,
        totalWords,
        difficultyLevel: verseProgress?.difficultyLevel || 1,
      });
    }
  };

  const handleReset = () => {
    setUserInput('');
    setShowResult(false);
    setMistakes(0);
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
      router.replace(`/game/full-verse/${id}`);
    }
  };

  const handleExit = () => {
    router.push('/');
  };

  const accuracy = calculateAccuracy();
  const isCorrect = accuracy >= 80;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      <Stack.Screen
        options={{
          title: 'Full Verse',
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
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.instructionCard}>
            <Text style={styles.instructionText}>
              Type the entire verse from memory. This is the ultimate test!
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

            <TextInput
              style={styles.textInput}
              value={userInput}
              onChangeText={setUserInput}
              placeholder="Type the verse here..."
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              editable={!showResult}
              autoFocus
            />

            {showResult && (
              <View style={styles.comparisonSection}>
                <View style={styles.comparisonHeader}>
                  <Text style={styles.comparisonTitle}>Correct Verse:</Text>
                </View>
                <Text style={styles.correctText}>{verse.text}</Text>
              </View>
            )}
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
                <View style={styles.resultTitleContainer}>
                  <Text style={[styles.resultTitle, { color: isCorrect ? theme.resultSuccessText : theme.resultErrorText }]}>
                    {isCorrect ? 'Excellent!' : 'Keep Practicing'}
                  </Text>
                  <Text style={[styles.accuracyText, { color: isCorrect ? theme.resultSuccessText : theme.resultErrorText }]}>Accuracy: {accuracy}%</Text>
                </View>
              </View>
              <Text style={[styles.resultText, { color: isCorrect ? theme.resultSuccessText : theme.resultErrorText }]}>
                {isCorrect
                  ? 'You\'ve mastered this verse! Keep reviewing to maintain your memory.'
                  : 'You\'re making progress! Try again to improve your accuracy.'}
              </Text>
            </View>
          )}

          {!showResult && userInput.length > 0 && (
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
    </KeyboardAvoidingView>
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
  textInput: {
    fontSize: 16,
    lineHeight: 24,
    color: '#1f2937',
    minHeight: 150,
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  comparisonSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  comparisonHeader: {
    marginBottom: 12,
  },
  comparisonTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#6b7280',
    textTransform: 'uppercase' as const,
  },
  correctText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#10b981',
    fontWeight: '500' as const,
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
  resultTitleContainer: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
  },
  accuracyText: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginTop: 4,
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
