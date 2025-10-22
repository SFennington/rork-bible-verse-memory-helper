import React, { useState } from 'react';
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
import { CheckCircle2, XCircle, ArrowRight, RotateCcw, Home, ArrowLeft, Eye, EyeOff } from 'lucide-react-native';
import { useVerses } from '@/contexts/VerseContext';
import { useTheme } from '@/contexts/ThemeContext';
import { CATEGORIES } from '@/mocks/verses';

function isToday(dateString: string): boolean {
  const date = new Date(dateString);
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

export default function FlashcardGameScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { verses, completeGameSession, getVerseProgress } = useVerses();
  const { theme } = useTheme();
  const [isFlipped, setIsFlipped] = useState(false);
  const [flipAnim] = useState(new Animated.Value(0));
  const [showResult, setShowResult] = useState(false);
  const [userKnewIt, setUserKnewIt] = useState<boolean | null>(null);
  const [startTime] = useState(Date.now());

  const verse = verses.find(v => v.id === id);
  const category = CATEGORIES.find(c => c.name === verse?.category);
  const verseProgress = getVerseProgress(id || '');
  const difficultyLevel = verseProgress?.difficultyLevel || 1;

  if (!verse) {
    return (
      <View style={styles.container}>
        <Text>Verse not found</Text>
      </View>
    );
  }

  const handleFlip = () => {
    const toValue = isFlipped ? 0 : 1;
    Animated.spring(flipAnim, {
      toValue,
      friction: 8,
      tension: 10,
      useNativeDriver: true,
    }).start();
    setIsFlipped(!isFlipped);
  };

  const handleAnswer = (knewIt: boolean) => {
    setUserKnewIt(knewIt);
    setShowResult(true);
    
    const accuracy = knewIt ? 100 : 0;
    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    const words = verse.text.split(' ').length;

    if (knewIt) {
      completeGameSession(id || '', {
        gameType: 'flashcard',
        completedAt: new Date().toISOString(),
        accuracy,
        timeSpent,
        mistakeCount: knewIt ? 0 : 1,
        correctWords: words,
        totalWords: words,
        difficultyLevel: verseProgress?.difficultyLevel || 1,
      });
    }
  };

  const handleContinue = () => {
    if (userKnewIt) {
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
      setShowResult(false);
      setUserKnewIt(null);
      setIsFlipped(false);
      flipAnim.setValue(0);
    }
  };

  const handleExit = () => {
    router.push('/(tabs)/verses');
  };

  const frontRotate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const backRotate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  const frontOpacity = flipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0, 0],
  });

  const backOpacity = flipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Flashcard',
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
        >
          <View style={[styles.instructionCard, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.instructionText, { color: theme.textSecondary }]}>
              {!isFlipped 
                ? "Try to recall the verse, then tap the card to flip and check"
                : "Did you remember the verse correctly?"}
            </Text>
          </View>

          <View style={styles.cardContainer}>
            <TouchableOpacity 
              activeOpacity={0.9} 
              onPress={handleFlip}
              disabled={showResult}
            >
              {/* Front of card - Reference */}
              <Animated.View
                style={[
                  styles.card,
                  { backgroundColor: theme.cardBackground },
                  {
                    transform: [{ rotateY: frontRotate }],
                    opacity: frontOpacity,
                  },
                  isFlipped && styles.cardHidden,
                ]}
              >
                <View style={styles.cardIcon}>
                  <Eye color={category?.color || '#667eea'} size={48} />
                </View>
                <Text style={[styles.cardReference, { color: theme.text }]}>
                  {verse.reference}
                </Text>
                <Text style={[styles.cardHint, { color: theme.textTertiary }]}>
                  Tap to reveal verse
                </Text>
              </Animated.View>

              {/* Back of card - Verse text */}
              <Animated.View
                style={[
                  styles.card,
                  styles.cardBack,
                  { backgroundColor: theme.cardBackground },
                  {
                    transform: [{ rotateY: backRotate }],
                    opacity: backOpacity,
                  },
                  !isFlipped && styles.cardHidden,
                ]}
              >
                <View style={styles.cardIcon}>
                  <EyeOff color={category?.color || '#667eea'} size={48} />
                </View>
                <Text style={[styles.verseText, { color: theme.text }]}>
                  {verse.text}
                </Text>
                <Text style={[styles.verseReferenceSmall, { color: theme.textSecondary }]}>
                  — {verse.reference}
                </Text>
              </Animated.View>
            </TouchableOpacity>
          </View>

          {isFlipped && !showResult && (
            <View style={styles.answerButtons}>
              <TouchableOpacity
                style={[styles.answerButton, styles.wrongButton, { backgroundColor: theme.resultError }]}
                onPress={() => handleAnswer(false)}
                activeOpacity={0.8}
              >
                <XCircle color="#fff" size={32} />
                <Text style={styles.answerButtonText}>Need More Practice</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.answerButton, styles.correctButton, { backgroundColor: theme.resultSuccess }]}
                onPress={() => handleAnswer(true)}
                activeOpacity={0.8}
              >
                <CheckCircle2 color="#fff" size={32} />
                <Text style={styles.answerButtonText}>I Got It!</Text>
              </TouchableOpacity>
            </View>
          )}

          {showResult && (
            <View
              style={[
                styles.resultCard,
                { backgroundColor: userKnewIt ? theme.resultSuccess : theme.resultError },
              ]}
            >
              <View style={styles.resultHeader}>
                {userKnewIt ? (
                  <CheckCircle2 color="#4ade80" size={32} />
                ) : (
                  <XCircle color="#f87171" size={32} />
                )}
                <Text style={[styles.resultTitle, { color: userKnewIt ? theme.resultSuccessText : theme.resultErrorText }]}>
                  {userKnewIt ? 'Excellent!' : 'Keep Practicing'}
                </Text>
              </View>
              <Text style={[styles.resultText, { color: userKnewIt ? theme.resultSuccessText : theme.resultErrorText }]}>
                {userKnewIt
                  ? 'You remembered the verse correctly!'
                  : 'Review the verse and try again'}
              </Text>
            </View>
          )}

          {showResult && (
            <View style={styles.buttonGroup}>
              {userKnewIt && (
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
                style={[styles.actionButton, styles.continueButton, { backgroundColor: theme.cardBackground }, !userKnewIt && styles.fullWidthButton]}
                onPress={handleContinue}
                activeOpacity={0.9}
              >
                <Text style={[styles.continueButtonText, { color: theme.text }]}>
                  {userKnewIt ? 'Continue' : 'Try Again'}
                </Text>
                {userKnewIt ? (
                  <ArrowRight color={theme.text} size={20} />
                ) : (
                  <RotateCcw color={theme.text} size={20} />
                )}
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
  },
  cardContainer: {
    height: 400,
    marginBottom: 24,
  },
  card: {
    position: 'absolute',
    width: '100%',
    height: 400,
    borderRadius: 20,
    padding: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
    backfaceVisibility: 'hidden',
  },
  cardBack: {
    position: 'absolute',
  },
  cardHidden: {
    pointerEvents: 'none',
  },
  cardIcon: {
    marginBottom: 24,
  },
  cardReference: {
    fontSize: 32,
    fontWeight: '700' as const,
    textAlign: 'center',
    marginBottom: 16,
  },
  cardHint: {
    fontSize: 16,
    fontStyle: 'italic' as const,
  },
  verseText: {
    fontSize: 20,
    lineHeight: 32,
    textAlign: 'center',
    fontWeight: '500' as const,
    marginBottom: 16,
  },
  verseReferenceSmall: {
    fontSize: 16,
    fontStyle: 'italic' as const,
  },
  answerButtons: {
    gap: 16,
    marginBottom: 24,
  },
  answerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  wrongButton: {},
  correctButton: {},
  answerButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#fff',
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

