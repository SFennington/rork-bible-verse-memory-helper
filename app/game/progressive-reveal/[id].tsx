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
import { CheckCircle2, XCircle, ArrowRight, Home, ArrowLeft, Eye, CheckSquare } from 'lucide-react-native';
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

export default function ProgressiveRevealGameScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { verses, completeGameSession, getVerseProgress } = useVerses();
  const { theme } = useTheme();
  const [revealedCount, setRevealedCount] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [fadeAnims] = useState(() => 
    Array.from({ length: 50 }, () => new Animated.Value(0))
  );
  const [startTime] = useState(Date.now());

  const verse = verses.find(v => v.id === id);
  const category = CATEGORIES.find(c => c.name === verse?.category);
  const verseProgress = getVerseProgress(id || '');
  const difficultyLevel = verseProgress?.difficultyLevel || 1;

  const words = useMemo(() => {
    if (!verse) return [];
    return verse.text.split(' ').map(word => stripPunctuation(word)).filter(word => word.length > 0);
  }, [verse]);

  // Start with some words revealed based on difficulty
  const initialRevealCount = useMemo(() => {
    switch (difficultyLevel) {
      case 1: return Math.floor(words.length * 0.4); // 40% revealed at start
      case 2: return Math.floor(words.length * 0.3); // 30% revealed
      case 3: return Math.floor(words.length * 0.2); // 20% revealed
      case 4: return Math.floor(words.length * 0.1); // 10% revealed
      default: return Math.floor(words.length * 0.3);
    }
  }, [words.length, difficultyLevel]);

  // Initialize revealed count
  React.useEffect(() => {
    if (revealedCount === 0 && initialRevealCount > 0) {
      setRevealedCount(initialRevealCount);
      // Fade in initial words
      for (let i = 0; i < initialRevealCount; i++) {
        Animated.timing(fadeAnims[i], {
          toValue: 1,
          duration: 300,
          delay: i * 50,
          useNativeDriver: true,
        }).start();
      }
    }
  }, [initialRevealCount]);

  if (!verse) {
    return (
      <View style={styles.container}>
        <Text>Verse not found</Text>
      </View>
    );
  }

  const handleRevealNext = () => {
    if (revealedCount < words.length) {
      Animated.timing(fadeAnims[revealedCount], {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      setRevealedCount(revealedCount + 1);
    }
  };

  const handleIKnowIt = () => {
    setShowResult(true);
    
    const percentRevealed = (revealedCount / words.length) * 100;
    const accuracy = Math.max(0, Math.round(100 - percentRevealed));
    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    
    // Consider it successful if they needed less than 75% of words revealed
    const isCorrect = percentRevealed <= 75;

    if (isCorrect) {
      completeGameSession(id || '', {
        gameType: 'progressive-reveal',
        completedAt: new Date().toISOString(),
        accuracy,
        timeSpent,
        mistakeCount: 0,
        correctWords: words.length,
        totalWords: words.length,
        difficultyLevel: verseProgress?.difficultyLevel || 1,
      });
    }
  };

  const handleContinue = () => {
    const percentRevealed = (revealedCount / words.length) * 100;
    const isCorrect = percentRevealed <= 75;

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
      setRevealedCount(initialRevealCount);
      setShowResult(false);
      // Reset animations
      fadeAnims.forEach((anim, index) => {
        if (index < initialRevealCount) {
          anim.setValue(1);
        } else {
          anim.setValue(0);
        }
      });
    }
  };

  const handleExit = () => {
    router.push('/(tabs)/verses');
  };

  const percentRevealed = (revealedCount / words.length) * 100;
  const memoryStrength = Math.max(0, Math.round(100 - percentRevealed));
  const isCorrect = percentRevealed <= 75;

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Progressive Reveal',
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
          <View style={[styles.instructionCard, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.instructionText, { color: theme.textSecondary }]}>
              Reveal as few words as possible to recall the full verse
            </Text>
          </View>

          {!showResult && (
            <>
              <View style={[styles.statsCard, { backgroundColor: theme.cardBackground }]}>
                <View style={styles.statRow}>
                  <Eye color={category?.color || '#667eea'} size={20} />
                  <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                    Revealed: {revealedCount} / {words.length} words
                  </Text>
                </View>
                <View style={styles.statRow}>
                  <CheckSquare color="#10b981" size={20} />
                  <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                    Memory Strength: {memoryStrength}%
                  </Text>
                </View>
              </View>

              <View style={[styles.verseCard, { backgroundColor: theme.cardBackground }]}>
                <Text style={[styles.verseReference, { color: theme.text }]}>{verse.reference}</Text>
                <View style={styles.wordsContainer}>
                  {words.map((word, index) => (
                    <Animated.View
                      key={index}
                      style={{
                        opacity: fadeAnims[index],
                      }}
                    >
                      {index < revealedCount ? (
                        <View style={[styles.revealedWord, { backgroundColor: theme.border }]}>
                          <Text style={[styles.wordText, { color: theme.text }]}>{word}</Text>
                        </View>
                      ) : (
                        <View style={[styles.hiddenWord, { backgroundColor: theme.border }]}>
                          <Text style={[styles.hiddenText, { color: theme.textTertiary }]}>•••</Text>
                        </View>
                      )}
                    </Animated.View>
                  ))}
                </View>
              </View>

              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.revealButton, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
                  onPress={handleRevealNext}
                  disabled={revealedCount >= words.length}
                  activeOpacity={0.8}
                >
                  <Eye color={theme.text} size={24} />
                  <Text style={[styles.revealButtonText, { color: theme.text }]}>
                    {revealedCount >= words.length ? 'All Revealed' : 'Reveal Next Word'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.knowItButton, { backgroundColor: theme.buttonSuccess }]}
                  onPress={handleIKnowIt}
                  activeOpacity={0.8}
                >
                  <CheckCircle2 color={theme.buttonSuccessText} size={24} />
                  <Text style={[styles.knowItButtonText, { color: theme.buttonSuccessText }]}>I Know the Rest!</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {showResult && (
            <>
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
                    {isCorrect ? 'Great Memory!' : 'Keep Practicing'}
                  </Text>
                </View>
                <Text style={[styles.resultText, { color: isCorrect ? theme.resultSuccessText : theme.resultErrorText }]}>
                  {isCorrect
                    ? `You needed only ${Math.round(percentRevealed)}% of the verse revealed!`
                    : 'Try to memorize more of the verse before revealing words'}
                </Text>
              </View>

              <View style={[styles.reviewCard, { backgroundColor: theme.cardBackground }]}>
                <Text style={[styles.reviewTitle, { color: theme.text }]}>Full Verse:</Text>
                <Text style={[styles.reviewText, { color: theme.textSecondary }]}>
                  {verse.text}
                </Text>
                <Text style={[styles.reviewReference, { color: theme.textTertiary }]}>
                  — {verse.reference}
                </Text>
              </View>

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
  statsCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
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
    marginBottom: 20,
  },
  wordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  revealedWord: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  hiddenWord: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  wordText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  hiddenText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  actionButtons: {
    gap: 16,
  },
  revealButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  revealButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  knowItButton: {
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
  knowItButtonText: {
    fontSize: 18,
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

