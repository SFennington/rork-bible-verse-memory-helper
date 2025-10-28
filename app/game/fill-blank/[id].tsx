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
import { CheckCircle2, XCircle, ArrowRight, Home, ArrowLeft, Zap } from 'lucide-react-native';
import { useVerses } from '@/contexts/VerseContext';
import { useTheme } from '@/contexts/ThemeContext';
import { CATEGORIES } from '@/mocks/verses';
import { isDebugEnabled } from '@/constants/debug';

function isToday(dateString: string): boolean {
  const date = new Date(dateString);
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

function stripPunctuation(word: string): string {
  // Remove all punctuation except apostrophes (for contractions like "don't")
  return word.replace(/[.,;:!?"()[\]{}\-—]/g, '').trim();
}

export default function FillBlankGameScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { verses, completeGameSession, getVerseProgress } = useVerses();
  const { theme } = useTheme();
  const [selectedWords, setSelectedWords] = useState<Record<number, string>>({});
  const [showResult, setShowResult] = useState(false);
  const [scaleAnim] = useState(new Animated.Value(1));
  const [startTime] = useState(Date.now());

  const verse = verses.find(v => v.id === id);
  const category = CATEGORIES.find(c => c.name === verse?.category);

  const verseProgress = getVerseProgress(id || '');
  const difficultyLevel = verseProgress?.difficultyLevel || 1;

  const gameData = useMemo(() => {
    if (!verse) return null;

    // Keep original words WITH punctuation for display
    // Split on whitespace and filter out empty strings
    const displayWords = verse.text.split(/\s+/).filter(word => word.trim().length > 0);
    
    // Create mapping between display indices and clean word indices
    // Also strip punctuation for comparison
    const cleanWords: string[] = [];
    const displayToCleanIndex: number[] = []; // Maps displayWords index to cleanWords index
    
    displayWords.forEach((word, displayIdx) => {
      const cleanWord = stripPunctuation(word);
      if (cleanWord.length > 0) {
        displayToCleanIndex[displayIdx] = cleanWords.length;
        cleanWords.push(cleanWord);
      } else {
        displayToCleanIndex[displayIdx] = -1; // Mark as not a valid word
      }
    });
    
    let blankPercentage = 0.3;
    let extraOptionsCount = 0;
    
    switch (difficultyLevel) {
      case 1:
        blankPercentage = 0.20;  // 20% blanks - easiest
        extraOptionsCount = 8;    // Many extra words to choose from
        break;
      case 2:
        blankPercentage = 0.35;  // 35% blanks
        extraOptionsCount = 5;    // Some extra words
        break;
      case 3:
        blankPercentage = 0.50;  // 50% blanks
        extraOptionsCount = 3;    // Few extra words
        break;
      case 4:
        blankPercentage = 0.70;  // 70% blanks - very challenging
        extraOptionsCount = 2;    // Very few extra words
        break;
      case 5:
        blankPercentage = 0.85;  // 85% blanks - extremely hard
        extraOptionsCount = 0;    // No extra words - exact match needed
        break;
      default:
        blankPercentage = 0.3;
        extraOptionsCount = 4;
    }

    const blanksCount = Math.max(2, Math.floor(cleanWords.length * blankPercentage));
    const blankIndices = new Set<number>();

    while (blankIndices.size < blanksCount) {
      const randomIndex = Math.floor(Math.random() * cleanWords.length);
      blankIndices.add(randomIndex);
    }

    const blanks = Array.from(blankIndices).sort((a, b) => a - b);
    const correctWords = blanks.map(i => cleanWords[i]);
    
    // Add extra distractor words for lower difficulty levels
    const allWordsInVerse = cleanWords.filter(w => w.length > 2); // Only words with 3+ letters
    const distractorWords: string[] = [];
    
    for (let i = 0; i < extraOptionsCount && distractorWords.length < extraOptionsCount; i++) {
      const randomWord = allWordsInVerse[Math.floor(Math.random() * allWordsInVerse.length)];
      if (!correctWords.includes(randomWord)) {
        distractorWords.push(randomWord);
      }
    }
    
    const options = [...correctWords, ...distractorWords].sort(() => Math.random() - 0.5);

    return { displayWords, cleanWords, blanks, options, displayToCleanIndex };
  }, [verse, difficultyLevel]);

  if (!verse || !gameData) {
    return (
      <View style={styles.container}>
        <Text>Verse not found</Text>
      </View>
    );
  }

  const handleWordSelect = (blankIndex: number, word: string) => {
    setSelectedWords(prev => ({ ...prev, [blankIndex]: word }));

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

  const handleWordRemove = (blankIndex: number) => {
    setSelectedWords(prev => {
      const newWords = { ...prev };
      delete newWords[blankIndex];
      return newWords;
    });

    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
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
    const isCorrect = gameData.blanks.every(
      (cleanWordIdx, blankPosition) => (selectedWords[blankPosition] || '').toLowerCase() === gameData.cleanWords[cleanWordIdx].toLowerCase()
    );

    const correctBlankCount = gameData.blanks.filter(
      (cleanWordIdx, blankPosition) => (selectedWords[blankPosition] || '').toLowerCase() === gameData.cleanWords[cleanWordIdx].toLowerCase()
    ).length;
    const accuracy = Math.round((correctBlankCount / gameData.blanks.length) * 100);
    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    const totalWords = gameData.cleanWords.length;
    
    const correctWords = isCorrect ? totalWords : Math.round((correctBlankCount / gameData.blanks.length) * totalWords);

    if (isCorrect) {
      const verseProgress = getVerseProgress(id || '');
      completeGameSession(id || '', {
        gameType: 'fill-blank',
        completedAt: new Date().toISOString(),
        accuracy,
        timeSpent,
        mistakeCount: 0,
        correctWords,
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
      // Only clear incorrect answers, keep correct ones
      const newSelectedWords: Record<number, string> = {};
      gameData.blanks.forEach((cleanWordIdx, blankPosition) => {
        if ((selectedWords[blankPosition] || '').toLowerCase() === gameData.cleanWords[cleanWordIdx].toLowerCase()) {
          // Keep correct answer
          newSelectedWords[blankPosition] = selectedWords[blankPosition];
        }
      });
      setSelectedWords(newSelectedWords);
      setShowResult(false);
    }
  };

  const handleExit = () => {
    router.push('/');
  };

  const isComplete = gameData.blanks.every((_, blankPosition) => selectedWords[blankPosition]);
  const isCorrect = showResult && gameData.blanks.every(
    (cleanWordIdx, blankPosition) => (selectedWords[blankPosition] || '').toLowerCase() === gameData.cleanWords[cleanWordIdx].toLowerCase()
  );

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Fill in the Blank',
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
                Tap the words below to fill in the blanks
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

          {isDebugEnabled() && !showResult && (
            <View style={styles.debugButtonsContainer}>
              <TouchableOpacity
                style={[styles.debugButton, styles.debugButtonCorrect]}
                onPress={() => {
                  // Auto-fill all correct answers
                  const correctAnswers: Record<number, string> = {};
                  gameData.hiddenWordIndices.forEach((index) => {
                    correctAnswers[index] = gameData.correctWords[index].toLowerCase();
                  });
                  setUserAnswers(correctAnswers);
                  setTimeout(() => handleSubmit(), 100);
                }}
                activeOpacity={0.8}
              >
                <Zap color="#fff" size={16} />
                <Text style={styles.debugButtonText}>Quick Correct</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.debugButton, styles.debugButtonIncorrect]}
                onPress={() => {
                  // Fill with wrong answers
                  const wrongAnswers: Record<number, string> = {};
                  gameData.hiddenWordIndices.forEach((index) => {
                    wrongAnswers[index] = 'wrong';
                  });
                  setUserAnswers(wrongAnswers);
                  setTimeout(() => handleSubmit(), 100);
                }}
                activeOpacity={0.8}
              >
                <XCircle color="#fff" size={16} />
                <Text style={styles.debugButtonText}>Quick Incorrect</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={[styles.verseCard, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.verseReference, { color: theme.text }]}>{verse.reference}</Text>
            <View style={styles.verseTextContainer}>
              {gameData.displayWords.map((word, displayIndex) => {
                const cleanIndex = gameData.displayToCleanIndex[displayIndex];
                
                // Skip if this is not a valid word (punctuation only)
                if (cleanIndex === -1) {
                  return (
                    <Text key={displayIndex} style={[styles.wordText, { color: theme.text }]}>
                      {word}{' '}
                    </Text>
                  );
                }
                
                const blankPosition = gameData.blanks.indexOf(cleanIndex);
                const isBlank = blankPosition !== -1;

                if (isBlank) {
                  const selectedWord = selectedWords[blankPosition];
                  const correctWord = gameData.cleanWords[cleanIndex];
                  const isWrong = showResult && (selectedWord || '').toLowerCase() !== correctWord.toLowerCase();

                  return (
                    <Animated.View
                      key={displayIndex}
                      style={[
                        styles.blankContainer,
                        { transform: [{ scale: scaleAnim }] },
                      ]}
                    >
                      <TouchableOpacity
                        onPress={() => {
                          if (!showResult && selectedWord) {
                            handleWordRemove(blankPosition);
                          }
                        }}
                        disabled={!selectedWord || showResult}
                        activeOpacity={0.7}
                      >
                        <View
                          style={[
                            styles.blank,
                            { backgroundColor: theme.border, borderColor: theme.border },
                            selectedWord && styles.blankFilled,
                            selectedWord && { backgroundColor: '#e0e7ff', borderColor: '#818cf8' },
                            isWrong && styles.blankWrong,
                            showResult && (selectedWord || '').toLowerCase() === correctWord.toLowerCase() && styles.blankCorrect,
                          ]}
                        >
                          <Text
                            style={[
                              styles.blankText,
                              { color: theme.textTertiary },
                              selectedWord && styles.blankTextFilled,
                              selectedWord && { color: theme.text },
                            ]}
                          >
                            {selectedWord || '____'}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    </Animated.View>
                  );
                }

                return (
                  <Text key={displayIndex} style={[styles.wordText, { color: theme.text }]}>
                    {word}{' '}
                  </Text>
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

        {/* Fixed Word Bank at Bottom - Hide when results are shown */}
        {!showResult && (
          <View style={styles.fixedBottomSection}>
            <View style={styles.optionsSection}>
              <Text style={styles.optionsTitle}>Word Bank</Text>
              <View style={styles.optionsGrid}>
                {gameData.options.map((word, index) => {
                  const timesUsed = Object.values(selectedWords).filter(w => w === word).length;
                  const timesNeeded = gameData.options.filter(w => w === word).length;
                  const isUsed = timesUsed >= timesNeeded;

                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.optionButton,
                        { backgroundColor: theme.cardBackground },
                        isUsed && styles.optionButtonUsed,
                      ]}
                      onPress={() => {
                        if (!showResult && !isUsed) {
                          const nextBlankIndex = gameData.blanks.findIndex(
                            (_, i) => !selectedWords[i]
                          );
                          if (nextBlankIndex !== -1) {
                            handleWordSelect(nextBlankIndex, word);
                          }
                        }
                      }}
                      disabled={isUsed || showResult}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          { color: theme.text },
                          isUsed && styles.optionTextUsed,
                        ]}
                      >
                        {word}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <TouchableOpacity
              style={[styles.checkButton, { backgroundColor: theme.cardBackground }]}
              onPress={handleCheck}
              activeOpacity={0.9}
            >
              <Text style={[styles.checkButtonText, { color: theme.text }]}>Check Answers</Text>
              <ArrowRight color="#fff" size={20} />
            </TouchableOpacity>
          </View>
        )}
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
    paddingBottom: 300,
  },
  fixedBottomSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  verseReference: {
    fontSize: 16,
    fontWeight: '700' as const,
    marginBottom: 16,
  },
  verseTextContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  wordText: {
    fontSize: 17,
    lineHeight: 32,
  },
  blankContainer: {
    marginRight: 4,
    marginBottom: 4,
  },
  blank: {
    borderWidth: 2,
    borderStyle: 'dashed' as const,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    minWidth: 80,
    alignItems: 'center',
  },
  blankFilled: {
    borderStyle: 'solid' as const,
  },
  blankCorrect: {
    backgroundColor: '#d1fae5',
    borderColor: '#4ade80',
  },
  blankWrong: {
    backgroundColor: '#fee2e2',
    borderColor: '#f87171',
  },
  blankText: {
    fontSize: 16,
    fontWeight: '500' as const,
  },
  blankTextFilled: {
    fontWeight: '600' as const,
  },
  optionsSection: {
    marginBottom: 24,
  },
  optionsTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 16,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  optionButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  optionButtonUsed: {
    opacity: 0.5,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  optionTextUsed: {
    opacity: 0.6,
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
  debugButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  debugButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  debugButtonCorrect: {
    backgroundColor: '#10b981',
  },
  debugButtonIncorrect: {
    backgroundColor: '#ef4444',
  },
  debugButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600' as const,
  },
});
