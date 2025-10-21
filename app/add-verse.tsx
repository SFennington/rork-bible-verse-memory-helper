import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BookOpen, FileText } from 'lucide-react-native';
import { useVerses } from '@/contexts/VerseContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useBibleVersion } from '@/contexts/BibleVersionContext';
import { VerseCategory } from '@/types/verse';
import { CATEGORIES } from '@/mocks/verses';
import { fetchBibleVerse, fetchBibleChapter } from '@/services/bibleApi';
import BibleVersePicker from '@/components/BibleVersePicker';

type InputMode = 'single' | 'chapter';

export default function AddVerseScreen() {
  const router = useRouter();
  const { addCustomVerse, addChapter, addToProgress } = useVerses();
  const { theme } = useTheme();
  const { selectedVersion } = useBibleVersion();
  const [mode, setMode] = useState<InputMode>('single');
  const [reference, setReference] = useState('');
  const [text, setText] = useState('');
  const [chapterText, setChapterText] = useState('');
  const [category, setCategory] = useState<VerseCategory>('Faith');
  const [isLoading, setIsLoading] = useState(false);

  const handleVerseSelect = async (book: string, chapter: number, verse?: number, endVerse?: number) => {
    setIsLoading(true);
    
    try {
      if (mode === 'single') {
        // Fetch single verse or verse range
        const ref = endVerse && endVerse > verse! 
          ? `${book} ${chapter}:${verse}-${endVerse}`
          : `${book} ${chapter}:${verse}`;
        
        setReference(ref);
        const result = await fetchBibleVerse(ref, selectedVersion.id);
        setText(result.text);
      } else {
        // Fetch entire chapter
        const ref = `${book} ${chapter}`;
        setReference(ref);
        const result = await fetchBibleChapter(book, chapter, selectedVersion.id);
        const formattedText = result.verses.map(v => v.text).join('\n');
        setChapterText(formattedText);
      }
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to fetch verse'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSingleVerse = async () => {
    if (!reference.trim() || !text.trim()) {
      Alert.alert('Error', 'Please fill in both reference and text');
      return;
    }

    try {
      const verseId = await addCustomVerse({
        reference: reference.trim(),
        text: text.trim(),
        category,
      });
      addToProgress(verseId);
      Alert.alert('Success', 'Verse added to your progress!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to add verse');
      console.error(error);
    }
  };

  const handleAddChapter = async () => {
    if (!reference.trim() || !chapterText.trim()) {
      Alert.alert('Error', 'Please fill in both reference and chapter text');
      return;
    }

    const lines = chapterText.split('\n').filter(line => line.trim());
    if (lines.length === 0) {
      Alert.alert('Error', 'Please enter at least one verse');
      return;
    }

    try {
      const chapterId = await addChapter({
        reference: reference.trim(),
        verses: lines.map((line, index) => ({
          id: '',
          reference: `${reference.trim()} ${index + 1}`,
          text: line.trim(),
          category,
        })),
        category,
      });

      lines.forEach((_, index) => {
        addToProgress(`${chapterId}-verse-${index}`);
      });

      Alert.alert(
        'Success',
        `Chapter with ${lines.length} verses added to your progress!`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to add chapter');
      console.error(error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen
        options={{
          title: 'Add Custom Verse',
          headerStyle: {
            backgroundColor: theme.background,
          },
          headerTintColor: theme.text,
          headerTitleStyle: {
            fontWeight: '700' as const,
          },
        }}
      />
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.modeSelector}>
            <TouchableOpacity
              style={[
                styles.modeButton,
                mode === 'single' && styles.modeButtonActive,
                { backgroundColor: theme.cardBackground },
              ]}
              onPress={() => setMode('single')}
              activeOpacity={0.7}
            >
              <BookOpen
                color={mode === 'single' ? '#667eea' : theme.textSecondary}
                size={24}
              />
              <Text
                style={[
                  styles.modeButtonText,
                  { color: mode === 'single' ? '#667eea' : theme.textSecondary },
                ]}
              >
                Single Verse
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modeButton,
                mode === 'chapter' && styles.modeButtonActive,
                { backgroundColor: theme.cardBackground },
              ]}
              onPress={() => setMode('chapter')}
              activeOpacity={0.7}
            >
              <FileText
                color={mode === 'chapter' ? '#667eea' : theme.textSecondary}
                size={24}
              />
              <Text
                style={[
                  styles.modeButtonText,
                  { color: mode === 'chapter' ? '#667eea' : theme.textSecondary },
                ]}
              >
                Chapter
              </Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
            <View style={styles.versionBadge}>
              <Text style={[styles.versionText, { color: theme.textSecondary }]}>
                Using: {selectedVersion.abbreviation}
              </Text>
            </View>

            <Text style={[styles.label, { color: theme.text }]}>Select {mode === 'single' ? 'Verse' : 'Chapter'}</Text>
            
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="#667eea" size="large" />
                <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                  Fetching verse...
                </Text>
              </View>
            ) : (
              <BibleVersePicker
                mode={mode === 'single' ? 'verse' : 'chapter'}
                onSelect={handleVerseSelect}
              />
            )}

            <Text style={[styles.label, { color: theme.text }]}>Category</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoryScroll}
            >
              {CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat.name}
                  style={[
                    styles.categoryButton,
                    category === cat.name && { backgroundColor: cat.color },
                    category !== cat.name && {
                      backgroundColor: theme.border,
                    },
                  ]}
                  onPress={() => setCategory(cat.name as VerseCategory)}
                >
                  <Text
                    style={[
                      styles.categoryButtonText,
                      {
                        color: category === cat.name ? '#fff' : theme.textSecondary,
                      },
                    ]}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {mode === 'single' ? (
              <>
                <Text style={[styles.label, { color: theme.text }]}>Verse Text</Text>
                <TextInput
                  style={[
                    styles.textArea,
                    {
                      backgroundColor: theme.background,
                      color: theme.text,
                      borderColor: theme.border,
                    },
                  ]}
                  placeholder="Enter the verse text..."
                  placeholderTextColor={theme.textTertiary}
                  value={text}
                  onChangeText={setText}
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                />
              </>
            ) : (
              <>
                <Text style={[styles.label, { color: theme.text }]}>
                  Chapter Text
                </Text>
                <Text style={[styles.hint, { color: theme.textSecondary }]}>
                  Enter each verse on a new line
                </Text>
                <TextInput
                  style={[
                    styles.textArea,
                    styles.chapterTextArea,
                    {
                      backgroundColor: theme.background,
                      color: theme.text,
                      borderColor: theme.border,
                    },
                  ]}
                  placeholder="The Lord is my shepherd I shall not want&#10;He makes me lie down in green pastures&#10;He leads me beside quiet waters..."
                  placeholderTextColor={theme.textTertiary}
                  value={chapterText}
                  onChangeText={setChapterText}
                  multiline
                  numberOfLines={12}
                  textAlignVertical="top"
                />
              </>
            )}
          </View>

          <TouchableOpacity
            style={styles.addButton}
            onPress={mode === 'single' ? handleAddSingleVerse : handleAddChapter}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.addButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.addButtonText}>
                {mode === 'single' ? 'Add Verse' : 'Add Chapter'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  modeSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  modeButtonActive: {
    borderColor: '#667eea',
  },
  modeButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  card: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  versionBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 16,
  },
  versionText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  label: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 8,
    marginTop: 16,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontStyle: 'italic' as const,
  },
  hint: {
    fontSize: 13,
    marginBottom: 8,
    fontStyle: 'italic' as const,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 120,
  },
  chapterTextArea: {
    minHeight: 240,
  },
  categoryScroll: {
    marginBottom: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginRight: 8,
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  addButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  addButtonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#fff',
  },
});
