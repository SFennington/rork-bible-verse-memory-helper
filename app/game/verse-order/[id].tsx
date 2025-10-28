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
import { CheckCircle2, XCircle, ArrowRight, Home, ArrowLeft } from 'lucide-react-native';
import { useVerses } from '@/contexts/VerseContext';
import { useTheme } from '@/contexts/ThemeContext';
import { CATEGORIES } from '@/mocks/verses';
import { BibleVerse } from '@/types/verse';

export default function VerseOrderGameScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { chapters, completeGameSession, getVerseProgress, getChapterUnlockedVerses, unlockNextVerseInChapter } = useVerses();
  const { theme } = useTheme();
  const [orderedVerses, setOrderedVerses] = useState<BibleVerse[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [scaleAnim] = useState(new Animated.Value(1));
  const [startTime] = useState(Date.now());
  const [mistakes, setMistakes] = useState(0);

  const chapter = chapters.find(c => c.id === id);
  const category = CATEGORIES.find(c => c.name === chapter?.category);
  const verseProgress = getVerseProgress(id || '');
  
  // Get unlocked verses once at mount and don't update during gameplay
  const [initialUnlockedVerses] = useState(() => getChapterUnlockedVerses(id || ''));

  const scrambledVerses = useMemo(() => {
    if (!initialUnlockedVerses || initialUnlockedVerses.length === 0) return [];
    
    // Scramble the unlocked verses
    const scrambled = [...initialUnlockedVerses];
    for (let i = scrambled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [scrambled[i], scrambled[j]] = [scrambled[j], scrambled[i]];
    }
    
    return scrambled;
  }, [initialUnlockedVerses]);
  
  const unlockedVerses = initialUnlockedVerses;

  if (!chapter || !verseProgress || !verseProgress.isChapter) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Chapter Not Found' }} />
        <Text>Chapter not found</Text>
      </View>
    );
  }

  const handleVersePress = (verse: BibleVerse) => {
    if (showResult) return;
    
    const newOrdered = [...orderedVerses, verse];
    setOrderedVerses(newOrdered);

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

  const handleRemoveVerse = (index: number) => {
    if (showResult) return;
    const newOrdered = orderedVerses.filter((_, i) => i !== index);
    setOrderedVerses(newOrdered);
  };

  const handleCheck = async () => {
    const isCorrect = orderedVerses.length === unlockedVerses.length &&
      orderedVerses.every((verse, index) => verse.id === unlockedVerses[index].id);

    if (!isCorrect) {
      setMistakes(mistakes + 1);
    }

    setShowResult(true);

    if (isCorrect) {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      const totalWords = unlockedVerses.reduce((sum, v) => sum + v.text.split(' ').length, 0);
      
      await completeGameSession(id || '', {
        gameType: 'verse-order',
        completedAt: new Date().toISOString(),
        accuracy: mistakes === 0 ? 100 : Math.max(0, 100 - (mistakes * 10)),
        timeSpent,
        mistakeCount: mistakes,
        correctWords: isCorrect ? totalWords : 0,
        totalWords,
        difficultyLevel: verseProgress.difficultyLevel,
      });
    }
  };

  const handleContinue = () => {
    const isCorrect = orderedVerses.length === unlockedVerses.length &&
      orderedVerses.every((verse, index) => verse.id === unlockedVerses[index].id);

    if (isCorrect) {
      // completeGameSession already handles unlocking - just navigate back
      router.push(`/verse/${id}` as any);
    } else {
      setShowResult(false);
      setOrderedVerses([]);
      setMistakes(mistakes + 1);
    }
  };

  const handleExit = () => {
    router.push(`/verse/${id}` as any);
  };

  const remainingVerses = scrambledVerses.filter(
    verse => !orderedVerses.find(ov => ov.id === verse.id)
  );

  const isComplete = orderedVerses.length === unlockedVerses.length;
  const isCorrect = showResult && orderedVerses.every((verse, index) => verse.id === unlockedVerses[index].id);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Verse Order',
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
              Arrange the verses in the correct order
            </Text>
            <Text style={[styles.chapterReference, { color: theme.text }]}>
              {chapter.reference} ({unlockedVerses.length} verse{unlockedVerses.length !== 1 ? 's' : ''})
            </Text>
          </View>

          {/* Ordered verses area */}
          <View style={[styles.orderedSection, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Your Order {orderedVerses.length > 0 && `(${orderedVerses.length}/${unlockedVerses.length})`}
            </Text>
            <View style={styles.orderedContainer}>
              {orderedVerses.map((verse, index) => {
                const verseNum = unlockedVerses.findIndex(v => v.id === verse.id);
                const isWrong = showResult && verse.id !== unlockedVerses[index]?.id;
                
                return (
                  <TouchableOpacity
                    key={`ordered-${verse.id}-${index}`}
                    style={[
                      styles.verseCard,
                      { backgroundColor: theme.border },
                      showResult && !isWrong && styles.verseCardCorrect,
                      isWrong && styles.verseCardWrong,
                    ]}
                    onPress={() => handleRemoveVerse(index)}
                    disabled={showResult}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.verseNumber, { color: theme.text }]}>
                      {index + 1}
                    </Text>
                    <Text style={[styles.verseText, { color: theme.text }]} numberOfLines={2}>
                      {verse.text}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              {orderedVerses.length === 0 && (
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                  Tap verses below to add them in order
                </Text>
              )}
            </View>
          </View>

          {/* Available verses */}
          {!showResult && remainingVerses.length > 0 && (
            <View style={styles.versesSection}>
              <Text style={styles.sectionTitleLight}>Available Verses</Text>
              <View style={styles.versesGrid}>
                {remainingVerses.map((verse) => (
                  <TouchableOpacity
                    key={`available-${verse.id}`}
                    style={[styles.availableVerseCard, { backgroundColor: theme.cardBackground }]}
                    onPress={() => handleVersePress(verse)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.availableVerseText, { color: theme.text }]} numberOfLines={3}>
                      {verse.text}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

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
                  ? 'Great job! You got the verses in the correct order!'
                  : 'Try again to get the verses in the right order'}
              </Text>
            </View>
          )}

          {!showResult && (
            <TouchableOpacity
              style={[
                styles.checkButton,
                { backgroundColor: theme.cardBackground },
                !isComplete && styles.checkButtonDisabled,
              ]}
              onPress={handleCheck}
              disabled={!isComplete}
              activeOpacity={0.9}
            >
              <Text style={[styles.checkButtonText, { color: isComplete ? theme.text : theme.textSecondary }]}>
                Check Order
              </Text>
              <ArrowRight color={isComplete ? theme.text : theme.textSecondary} size={20} />
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
  instructionCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  instructionText: {
    fontSize: 15,
    textAlign: 'center',
    fontWeight: '500' as const,
    marginBottom: 8,
  },
  chapterReference: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600' as const,
  },
  orderedSection: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    marginBottom: 12,
  },
  orderedContainer: {
    gap: 12,
    minHeight: 100,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
  verseCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    alignItems: 'flex-start',
  },
  verseCardCorrect: {
    backgroundColor: '#d1fae5',
    borderWidth: 2,
    borderColor: '#4ade80',
  },
  verseCardWrong: {
    backgroundColor: '#fee2e2',
    borderWidth: 2,
    borderColor: '#f87171',
  },
  verseNumber: {
    fontSize: 18,
    fontWeight: '700' as const,
    minWidth: 30,
  },
  verseText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
  versesSection: {
    marginBottom: 20,
  },
  sectionTitleLight: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 12,
  },
  versesGrid: {
    gap: 12,
  },
  availableVerseCard: {
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  availableVerseText: {
    fontSize: 15,
    lineHeight: 22,
  },
  resultCard: {
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
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
  checkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 18,
    borderRadius: 16,
    marginTop: 10,
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
  exitButton: {
    borderWidth: 2,
  },
  continueButton: {},
  fullWidthButton: {
    flex: 1,
  },
  exitButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
});

