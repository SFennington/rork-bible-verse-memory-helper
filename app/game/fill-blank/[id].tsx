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
import { CheckCircle2, XCircle, ArrowRight, Home } from 'lucide-react-native';
import { useVerses } from '@/contexts/VerseContext';
import { CATEGORIES } from '@/mocks/verses';

function isToday(dateString: string): boolean {
  const date = new Date(dateString);
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

export default function FillBlankGameScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { verses, completeGameSession, getVerseProgress } = useVerses();
  const [selectedWords, setSelectedWords] = useState<Record<number, string>>({});
  const [showResult, setShowResult] = useState(false);
  const [scaleAnim] = useState(new Animated.Value(1));
  const [startTime] = useState(Date.now());

  const verse = verses.find(v => v.id === id);
  const category = CATEGORIES.find(c => c.name === verse?.category);

  const gameData = useMemo(() => {
    if (!verse) return null;

    const words = verse.text.split(' ');
    const blanksCount = Math.max(3, Math.floor(words.length * 0.3));
    const blankIndices = new Set<number>();

    while (blankIndices.size < blanksCount) {
      const randomIndex = Math.floor(Math.random() * words.length);
      blankIndices.add(randomIndex);
    }

    const blanks = Array.from(blankIndices).sort((a, b) => a - b);
    const options = blanks.map(i => words[i]).sort(() => Math.random() - 0.5);

    return { words, blanks, options };
  }, [verse]);

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

  const handleCheck = () => {
    setShowResult(true);
    const isCorrect = gameData.blanks.every(
      (blankIdx, i) => selectedWords[i] === gameData.words[blankIdx]
    );

    const correctBlankCount = gameData.blanks.filter(
      (blankIdx, i) => selectedWords[i] === gameData.words[blankIdx]
    ).length;
    const accuracy = Math.round((correctBlankCount / gameData.blanks.length) * 100);
    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    const totalWords = gameData.words.length;
    
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
      
      if (nextGame && completedGames.length < requiredGames) {
        router.push(`/game/${nextGame}/${id}`);
      } else {
        router.push(`/verse/${id}`);
      }
    } else {
      router.replace(`/game/fill-blank/${id}`);
    }
  };

  const handleExit = () => {
    router.push(`/verse/${id}`);
  };

  const isComplete = gameData.blanks.every((_, i) => selectedWords[i]);
  const isCorrect = showResult && gameData.blanks.every(
    (blankIdx, i) => selectedWords[i] === gameData.words[blankIdx]
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
              Tap the words below to fill in the blanks
            </Text>
          </View>

          <View style={styles.verseCard}>
            <Text style={styles.verseReference}>{verse.reference}</Text>
            <View style={styles.verseTextContainer}>
              {gameData.words.map((word, index) => {
                const blankPosition = gameData.blanks.indexOf(index);
                const isBlank = blankPosition !== -1;

                if (isBlank) {
                  const selectedWord = selectedWords[blankPosition];
                  const correctWord = gameData.words[index];
                  const isWrong = showResult && selectedWord !== correctWord;

                  return (
                    <Animated.View
                      key={index}
                      style={[
                        styles.blankContainer,
                        { transform: [{ scale: scaleAnim }] },
                      ]}
                    >
                      <View
                        style={[
                          styles.blank,
                          selectedWord && styles.blankFilled,
                          isWrong && styles.blankWrong,
                          showResult && selectedWord === correctWord && styles.blankCorrect,
                        ]}
                      >
                        <Text
                          style={[
                            styles.blankText,
                            selectedWord && styles.blankTextFilled,
                          ]}
                        >
                          {selectedWord || '____'}
                        </Text>
                      </View>
                    </Animated.View>
                  );
                }

                return (
                  <Text key={index} style={styles.wordText}>
                    {word}{' '}
                  </Text>
                );
              })}
            </View>
          </View>

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
  verseTextContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  wordText: {
    fontSize: 17,
    lineHeight: 32,
    color: '#374151',
  },
  blankContainer: {
    marginRight: 4,
    marginBottom: 4,
  },
  blank: {
    backgroundColor: '#f3f4f6',
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderStyle: 'dashed' as const,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    minWidth: 80,
    alignItems: 'center',
  },
  blankFilled: {
    backgroundColor: '#e0e7ff',
    borderColor: '#818cf8',
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
    color: '#9ca3af',
    fontWeight: '500' as const,
  },
  blankTextFilled: {
    color: '#374151',
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
  optionButtonUsed: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    opacity: 0.5,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1f2937',
  },
  optionTextUsed: {
    color: '#9ca3af',
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
