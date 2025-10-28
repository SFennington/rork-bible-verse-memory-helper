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
  const { id, chapterId } = useLocalSearchParams<{ id: string; chapterId?: string }>();
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
  // For chapters, get progress from chapter ID
  const progressId = chapterId || id || '';
  const verseProgress = getVerseProgress(progressId);
  const difficultyLevel = verseProgress?.difficultyLevel || 1;

  if (!verse) {
    return (
      <View style={styles.container}>
        <Text>Verse not found</Text>
      </View>
    );
  }

  // Split verse into 2 equal parts by word count
  const splitVerseIntoCards = (text: string): string[] => {
    const words = text.split(' ');
    
    // If verse is short (less than 10 words), keep it as one card
    if (words.length < 10) {
      return [text];
    }
    
    // Split in half by word count
    const midpoint = Math.ceil(words.length / 2);
    const firstHalf = words.slice(0, midpoint).join(' ');
    const secondHalf = words.slice(midpoint).join(' ');
    
    return [firstHalf, secondHalf];
  };

  const verseCards = splitVerseIntoCards(verse.text);
  const totalCards = verseCards.length;

  const handleFlip = () => {
    if (showResult) return; // Don't flip when showing results
    
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
      // For chapters, record progress under chapter ID, not verse ID
      completeGameSession(progressId, {
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
      const requiredGames = verseProgress?.isChapter ? 2 : (verseProgress?.difficultyLevel === 5 ? 1 : 3);
      const games = verseProgress?.currentDayGames || [];
      const completedGames = verseProgress?.gameSessions
        .filter(s => isToday(s.completedAt) && s.difficultyLevel === verseProgress?.difficultyLevel)
        .map(s => s.gameType) || [];
      
      const nextGame = games.find(g => !completedGames.includes(g));
      
      if (nextGame) {
        // Keep the chapter param when navigating to next game
        const chapterParam = chapterId ? `?chapterId=${chapterId}` : '';
        router.replace(`/game/${nextGame}/${id}${chapterParam}`);
      } else {
        // Return to the chapter/verse detail page
        router.push(`/verse/${progressId}`);
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
                {!isFlipped 
                  ? "Try to recall the verse, then tap to flip and check"
                  : "Did you remember the verse correctly?"}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.exitButtonTop, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
              onPress={handleExit}
              activeOpacity={0.8}
            >
              <Home color={theme.textSecondary} size={20} />
              <Text style={[styles.exitButtonTopText, { color: theme.textSecondary }]}>Exit</Text>
            </TouchableOpacity>
          </View>

          {/* Show all cards stacked vertically */}
          {verseCards.map((cardText, index) => (
            <TouchableOpacity 
              key={index}
              activeOpacity={0.9} 
              onPress={handleFlip}
              disabled={showResult}
              style={styles.cardContainer}
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
                ]}
                pointerEvents={isFlipped ? 'none' : 'auto'}
              >
                <View style={styles.cardIcon}>
                  <Eye color={category?.color || '#667eea'} size={36} />
                </View>
                <Text style={[styles.cardReference, { color: theme.text }]}>
                  {verse.reference}
                </Text>
                {totalCards > 1 && (
                  <Text style={[styles.cardPartLabel, { color: theme.textSecondary }]}>
                    Part {index + 1} of {totalCards}
                  </Text>
                )}
                <Text style={[styles.cardHint, { color: theme.textTertiary }]}>
                  Tap to reveal
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
                ]}
                pointerEvents={!isFlipped ? 'none' : 'auto'}
              >
                <View style={styles.cardIcon}>
                  <EyeOff color={category?.color || '#667eea'} size={36} />
                </View>
                <Text style={[styles.verseText, { color: theme.text }]}>
                  {cardText}
                </Text>
                <Text style={[styles.verseReferenceSmall, { color: theme.textSecondary }]}>
                  — {verse.reference}
                </Text>
              </Animated.View>
            </TouchableOpacity>
          ))}

          {isFlipped && !showResult && (
            <View style={styles.answerButtons}>
              <TouchableOpacity
                style={[styles.answerButton, styles.wrongButton, { backgroundColor: theme.buttonError }]}
                onPress={() => handleAnswer(false)}
                activeOpacity={0.8}
              >
                <XCircle color={theme.buttonErrorText} size={32} />
                <Text style={[styles.answerButtonText, { color: theme.buttonErrorText }]}>Need More Practice</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.answerButton, styles.correctButton, { backgroundColor: theme.buttonSuccess }]}
                onPress={() => handleAnswer(true)}
                activeOpacity={0.8}
              >
                <CheckCircle2 color={theme.buttonSuccessText} size={32} />
                <Text style={[styles.answerButtonText, { color: theme.buttonSuccessText }]}>I Got It!</Text>
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
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
  },
  exitButtonTopText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  cardCounter: {
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '600' as const,
  },
  cardContainer: {
    height: 260,
    marginBottom: 16,
    position: 'relative',
  },
  card: {
    position: 'absolute',
    width: '100%',
    height: 260,
    borderRadius: 16,
    padding: 24,
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
    marginBottom: 12,
  },
  cardReference: {
    fontSize: 24,
    fontWeight: '700' as const,
    textAlign: 'center',
    marginBottom: 6,
  },
  cardPartLabel: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '600' as const,
  },
  cardHint: {
    fontSize: 14,
    fontStyle: 'italic' as const,
  },
  verseScrollContainer: {
    maxHeight: 250,
    width: '100%',
  },
  verseScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  verseText: {
    fontSize: 17,
    lineHeight: 26,
    textAlign: 'center',
    fontWeight: '500' as const,
  },
  cardNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  navButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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

