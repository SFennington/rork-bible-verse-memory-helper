import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { CheckCircle2, XCircle, ArrowRight, Home, ArrowLeft, Eye, EyeOff } from 'lucide-react-native';
import { useVerses } from '@/contexts/VerseContext';
import { useTheme } from '@/contexts/ThemeContext';
import { CATEGORIES } from '@/mocks/verses';
import { BibleVerse } from '@/types/verse';

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

export default function ProgressiveReviewGameScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { chapters, completeGameSession, getVerseProgress, getChapterUnlockedVerses, unlockNextVerseInChapter } = useVerses();
  const { theme } = useTheme();
  
  const [currentVerseIndex, setCurrentVerseIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [showVerse, setShowVerse] = useState(false);
  const [verseResults, setVerseResults] = useState<{ correct: boolean; attempts: number }[]>([]);
  const [showFinalResult, setShowFinalResult] = useState(false);
  const [startTime] = useState(Date.now());
  const [mistakes, setMistakes] = useState(0);

  const chapter = chapters.find(c => c.id === id);
  const category = CATEGORIES.find(c => c.name === chapter?.category);
  const verseProgress = getVerseProgress(id || '');
  const unlockedVerses = getChapterUnlockedVerses(id || '');

  if (!chapter || !verseProgress || !verseProgress.isChapter) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Chapter Not Found' }} />
        <Text>Chapter not found</Text>
      </View>
    );
  }

  const currentVerse = unlockedVerses[currentVerseIndex];
  const isLastVerse = currentVerseIndex === unlockedVerses.length - 1;

  const normalizeText = (text: string) => {
    return text.toLowerCase()
      .replace(/[.,;:!?"()[\]{}'"'""\-—]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const checkAnswer = () => {
    const normalizedUser = normalizeText(userInput);
    const normalizedCorrect = normalizeText(currentVerse.text);
    
    const distance = levenshteinDistance(normalizedUser, normalizedCorrect);
    const maxLength = Math.max(normalizedUser.length, normalizedCorrect.length);
    const accuracy = maxLength > 0 ? ((maxLength - distance) / maxLength) * 100 : 0;
    
    const isCorrect = accuracy >= 85;
    
    const currentAttempts = verseResults[currentVerseIndex]?.attempts || 0;
    const newResults = [...verseResults];
    newResults[currentVerseIndex] = {
      correct: isCorrect,
      attempts: currentAttempts + 1,
    };
    setVerseResults(newResults);

    if (!isCorrect) {
      setMistakes(mistakes + 1);
      setShowVerse(true);
    } else {
      if (isLastVerse) {
        // Finish the game
        setShowFinalResult(true);
        
        const timeSpent = Math.floor((Date.now() - startTime) / 1000);
        const totalWords = unlockedVerses.reduce((sum, v) => sum + v.text.split(' ').length, 0);
        const correctWords = unlockedVerses.reduce((sum, v, idx) => {
          return sum + (verseResults[idx]?.correct ? v.text.split(' ').length : 0);
        }, currentVerse.text.split(' ').length); // Add current verse
        
        completeGameSession(id || '', {
          gameType: 'progressive-review',
          completedAt: new Date().toISOString(),
          accuracy: Math.round((correctWords / totalWords) * 100),
          timeSpent,
          mistakeCount: mistakes,
          correctWords,
          totalWords,
          difficultyLevel: verseProgress.difficultyLevel,
        });
      } else {
        // Move to next verse
        setTimeout(() => {
          setCurrentVerseIndex(currentVerseIndex + 1);
          setUserInput('');
          setShowVerse(false);
        }, 500);
      }
    }
  };

  const handleTryAgain = () => {
    setUserInput('');
    setShowVerse(false);
  };

  const handleNextVerse = () => {
    setCurrentVerseIndex(currentVerseIndex + 1);
    setUserInput('');
    setShowVerse(false);
  };

  const handleContinue = async () => {
    // Check if we should unlock next verse
    const completedToday = (verseProgress.completedGamesToday || 0) + 1;
    const requiredGames = 2; // Require 2 games per day for chapter memorization

    if (completedToday >= requiredGames) {
      // Unlock next verse
      await unlockNextVerseInChapter(id || '');
    }

    router.push(`/verse/${id}` as any);
  };

  const handleExit = () => {
    router.push(`/verse/${id}` as any);
  };

  const allCorrect = verseResults.every(r => r && r.correct);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Progressive Review',
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
          {!showFinalResult ? (
            <>
              <View style={styles.topBar}>
                <View style={[styles.instructionCard, { backgroundColor: theme.cardBackground }]}>
                  <Text style={[styles.instructionText, { color: theme.textSecondary }]}>
                    Type each verse from memory
                  </Text>
                  <Text style={[styles.progressText, { color: theme.text }]}>
                    Verse {currentVerseIndex + 1} of {unlockedVerses.length}
                  </Text>
                  <Text style={[styles.referenceText, { color: theme.text }]}>
                    {currentVerse?.reference}
                  </Text>
                </View>
                {currentVerseIndex < unlockedVerses.length && (
                  <TouchableOpacity
                    style={[styles.exitButtonTop, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
                    onPress={handleExit}
                    activeOpacity={0.8}
                  >
                    <Home color={theme.textSecondary} size={20} />
                  </TouchableOpacity>
                )}
              </View>

              {showVerse && (
                <View style={[styles.verseCard, { backgroundColor: theme.cardBackground }]}>
                  <Text style={[styles.verseText, { color: theme.text }]}>
                    {currentVerse?.text}
                  </Text>
                </View>
              )}

              <View style={[styles.inputCard, { backgroundColor: theme.cardBackground }]}>
                <TextInput
                  style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                  value={userInput}
                  onChangeText={setUserInput}
                  placeholder="Type the verse here..."
                  placeholderTextColor={theme.textSecondary}
                  multiline
                  textAlignVertical="top"
                  autoCapitalize="sentences"
                  autoCorrect={false}
                  editable={!showVerse}
                />
                
                {!showVerse && (
                  <TouchableOpacity
                    style={[styles.peekButton, { borderColor: theme.border }]}
                    onPress={() => setShowVerse(true)}
                    activeOpacity={0.7}
                  >
                    <Eye color={theme.text} size={20} />
                    <Text style={[styles.peekButtonText, { color: theme.text }]}>
                      Peek at Verse
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {showVerse ? (
                <View style={styles.buttonGroup}>
                  {!isLastVerse && (
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: theme.cardBackground, borderWidth: 2, borderColor: theme.border }]}
                      onPress={handleNextVerse}
                      activeOpacity={0.9}
                    >
                      <Text style={[styles.actionButtonText, { color: theme.text }]}>
                        Next Verse
                      </Text>
                      <ArrowRight color={theme.text} size={20} />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: theme.cardBackground }]}
                    onPress={handleTryAgain}
                    activeOpacity={0.9}
                  >
                    <Text style={[styles.actionButtonText, { color: theme.text }]}>
                      Try Again
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.checkButton,
                    { backgroundColor: theme.cardBackground },
                    !userInput.trim() && styles.checkButtonDisabled,
                  ]}
                  onPress={checkAnswer}
                  disabled={!userInput.trim()}
                  activeOpacity={0.9}
                >
                  <Text style={[styles.checkButtonText, { color: userInput.trim() ? theme.text : theme.textSecondary }]}>
                    Check Answer
                  </Text>
                  <ArrowRight color={userInput.trim() ? theme.text : theme.textSecondary} size={20} />
                </TouchableOpacity>
              )}
            </>
          ) : (
            <>
              <View
                style={[
                  styles.resultCard,
                  { backgroundColor: allCorrect ? theme.resultSuccess : theme.resultError },
                ]}
              >
                <View style={styles.resultHeader}>
                  {allCorrect ? (
                    <CheckCircle2 color="#4ade80" size={32} />
                  ) : (
                    <XCircle color="#f87171" size={32} />
                  )}
                  <Text style={[styles.resultTitle, { color: allCorrect ? theme.resultSuccessText : theme.resultErrorText }]}>
                    {allCorrect ? 'Perfect!' : 'Review Complete'}
                  </Text>
                </View>
                <Text style={[styles.resultText, { color: allCorrect ? theme.resultSuccessText : theme.resultErrorText }]}>
                  {allCorrect
                    ? `Great job! You've mastered all ${unlockedVerses.length} verses!`
                    : `You completed ${verseResults.filter(r => r?.correct).length} out of ${unlockedVerses.length} verses correctly.`}
                </Text>
              </View>

              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.exitButton, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
                  onPress={handleExit}
                  activeOpacity={0.9}
                >
                  <Home color={theme.textSecondary} size={20} />
                  <Text style={[styles.exitButtonText, { color: theme.textSecondary }]}>Exit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.continueButton, { backgroundColor: theme.cardBackground }]}
                  onPress={handleContinue}
                  activeOpacity={0.9}
                >
                  <Text style={[styles.continueButtonText, { color: theme.text }]}>
                    Continue
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
  exitButtonTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 2,
  },
  instructionText: {
    fontSize: 15,
    textAlign: 'center',
    fontWeight: '500' as const,
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  referenceText: {
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '700' as const,
  },
  verseCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  verseText: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  inputCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  input: {
    minHeight: 150,
    fontSize: 16,
    lineHeight: 24,
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  peekButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  peekButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  checkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 18,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  checkButtonDisabled: {
    opacity: 0.5,
  },
  checkButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  resultCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  resultText: {
    fontSize: 15,
    lineHeight: 22,
  },
  exitButton: {
    borderWidth: 2,
  },
  continueButton: {},
  exitButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
});

