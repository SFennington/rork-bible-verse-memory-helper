import React, { useState, useRef } from 'react';
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
  Modal,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BookOpen, FileText, RefreshCw, ChevronDown } from 'lucide-react-native';
import { useVerses } from '@/contexts/VerseContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useBibleVersion } from '@/contexts/BibleVersionContext';
import { VerseCategory } from '@/types/verse';
import { CATEGORIES } from '@/mocks/verses';
import { fetchBibleVerse, fetchBibleChapter, getActualTranslation } from '@/services/bibleApi';
import BibleVersePicker from '@/components/BibleVersePicker';

type InputMode = 'single' | 'chapter';

export default function AddVerseScreen() {
  const router = useRouter();
  const { addCustomVerse, addChapter, addToProgress } = useVerses();
  const { theme } = useTheme();
  const { selectedVersion: globalVersion, availableVersions } = useBibleVersion();
  const [mode, setMode] = useState<InputMode>('single');
  const [reference, setReference] = useState('');
  const [text, setText] = useState('');
  const [chapterText, setChapterText] = useState('');
  const [category, setCategory] = useState<VerseCategory>('Custom');
  const [isLoading, setIsLoading] = useState(false);
  const [showVersionPicker, setShowVersionPicker] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState(globalVersion);
  const categoryScrollRef = useRef<ScrollView>(null);
  
  // Sync local version with global version when it changes
  React.useEffect(() => {
    setSelectedVersion(globalVersion);
  }, [globalVersion]);
  
  // Track selected verse details to preserve picker state
  const [selectedBook, setSelectedBook] = useState<string | undefined>(undefined);
  const [selectedChapter, setSelectedChapter] = useState<number | undefined>(undefined);
  const [selectedVerse, setSelectedVerse] = useState<number | undefined>(undefined);
  const [selectedEndVerse, setSelectedEndVerse] = useState<number | undefined>(undefined);

  const handleVerseSelect = (book: string, chapter: number, verse?: number, endVerse?: number) => {
    // Just store the selection - don't auto-fetch
    setSelectedBook(book);
    setSelectedChapter(chapter);
    setSelectedVerse(verse);
    setSelectedEndVerse(endVerse);
    
    // Update reference for display
    if (mode === 'single') {
      const ref = endVerse && endVerse > verse! 
        ? `${book} ${chapter}:${verse}-${endVerse}`
        : `${book} ${chapter}:${verse}`;
      setReference(ref);
    } else {
      const ref = `${book} ${chapter}`;
      setReference(ref);
    }
  };

  const handleFetchVerse = async () => {
    if (!selectedBook || !selectedChapter) {
      Alert.alert('Error', 'Please select a book and chapter');
      return;
    }

    if (mode === 'single' && !selectedVerse) {
      Alert.alert('Error', 'Please select a verse');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Auto-select Custom category when fetching
      setCategory('Custom');
      
      // Scroll to show Custom category (it's at the end)
      setTimeout(() => {
        categoryScrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
      
      if (mode === 'single') {
        // Fetch single verse or verse range
        const ref = selectedEndVerse && selectedEndVerse > selectedVerse! 
          ? `${selectedBook} ${selectedChapter}:${selectedVerse}-${selectedEndVerse}`
          : `${selectedBook} ${selectedChapter}:${selectedVerse}`;
        
        setReference(ref);
        const result = await fetchBibleVerse(ref, selectedVersion.id);
        setText(result.text);
      } else {
        // Fetch entire chapter
        const ref = `${selectedBook} ${selectedChapter}`;
        setReference(ref);
        const result = await fetchBibleChapter(selectedBook, selectedChapter, selectedVersion.id);
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
      const verseData = {
        reference: reference.trim(),
        text: text.trim(),
        category,
      };
      
      const verseId = await addCustomVerse(verseData);
      
      // Pass the full verse object to addToProgress to avoid race condition
      await addToProgress(verseId, {
        ...verseData,
        id: verseId,
        isCustom: true,
      });
      
      // Navigate directly to progress screen
      router.push('/(tabs)/verses' as any);
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
      const versesData = lines.map((line, index) => ({
        reference: `${reference.trim()}:${index + 1}`,
        text: line.trim(),
        category,
      }));

      const chapterDataForAdding = {
        reference: reference.trim(),
        verses: versesData,
        category,
      };

      const newChapter = await addChapter(chapterDataForAdding);
      console.log('Chapter added:', newChapter);

      // Add chapter to progress, passing the chapter object to avoid stale state
      console.log('Calling addToProgress with:', newChapter.id, newChapter);
      await addToProgress(newChapter.id, newChapter);
      console.log('addToProgress completed');

      // Navigate directly to verses tab
      router.push('/(tabs)/verses' as any);
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
            <Text style={[styles.label, { color: theme.text }]}>Bible Version</Text>
            <TouchableOpacity
              style={[styles.versionPicker, { backgroundColor: theme.background, borderColor: theme.border }]}
              onPress={() => setShowVersionPicker(true)}
              activeOpacity={0.7}
            >
              <View>
                <Text style={[styles.versionPickerText, { color: theme.text }]}>
                  {selectedVersion.abbreviation}
                </Text>
                <Text style={[styles.versionPickerSubtext, { color: theme.textSecondary }]}>
                  {selectedVersion.name}
                </Text>
              </View>
              <ChevronDown color={theme.textSecondary} size={24} />
            </TouchableOpacity>

            {getActualTranslation(selectedVersion.id) !== selectedVersion.abbreviation && (
              <View style={[styles.warningBox, { backgroundColor: theme.border, borderColor: theme.border }]}>
                <Text style={[styles.warningText, { color: theme.textSecondary }]}>
                  ℹ️ {getActualTranslation(selectedVersion.id)}
                </Text>
              </View>
            )}

            <Text style={[styles.label, { color: theme.text }]}>Select {mode === 'single' ? 'Verse' : 'Chapter'}</Text>
            
            <BibleVersePicker
              mode={mode === 'single' ? 'verse' : 'chapter'}
              onSelect={handleVerseSelect}
              initialBook={selectedBook}
              initialChapter={selectedChapter}
              initialVerse={selectedVerse}
              initialEndVerse={selectedEndVerse}
            />

            <TouchableOpacity
              style={[styles.fetchButton, { backgroundColor: '#667eea' }]}
              onPress={handleFetchVerse}
              activeOpacity={0.8}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <RefreshCw color="#fff" size={20} />
                  <Text style={styles.fetchButtonText}>
                    {mode === 'single' ? 'Fetch Verse' : 'Fetch Chapter'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
            
            {isLoading && (
              <View style={styles.loadingContainer}>
                <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                  Fetching from {selectedVersion.abbreviation}...
                </Text>
              </View>
            )}

            <Text style={[styles.label, { color: theme.text }]}>Category</Text>
            <ScrollView
              ref={categoryScrollRef}
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

      {/* Version Picker Modal */}
      <Modal visible={showVersionPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.cardBackground }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Select Bible Version</Text>
              <TouchableOpacity onPress={() => setShowVersionPicker(false)}>
                <Text style={[styles.modalClose, { color: '#667eea' }]}>Done</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              {availableVersions.map((version) => (
                <TouchableOpacity
                  key={version.id}
                  style={[
                    styles.versionItem,
                    selectedVersion.id === version.id && { backgroundColor: 'rgba(102, 126, 234, 0.1)' },
                  ]}
                  onPress={() => {
                    setSelectedVersion(version);
                    setShowVersionPicker(false);
                  }}
                >
                  <View>
                    <Text
                      style={[
                        styles.versionItemTitle,
                        { color: selectedVersion.id === version.id ? '#667eea' : theme.text },
                      ]}
                    >
                      {version.abbreviation}
                    </Text>
                    <Text style={[styles.versionItemSubtitle, { color: theme.textSecondary }]}>
                      {version.name}
                    </Text>
                  </View>
                  {selectedVersion.id === version.id && (
                    <View style={styles.checkmark}>
                      <Text style={{ color: '#667eea', fontSize: 20 }}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  versionPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  versionPickerText: {
    fontSize: 18,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  versionPickerSubtext: {
    fontSize: 13,
  },
  fetchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 16,
    marginBottom: 8,
  },
  fetchButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
  },
  label: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 8,
    marginTop: 16,
  },
  loadingContainer: {
    paddingVertical: 12,
    alignItems: 'center',
    gap: 8,
    flexDirection: 'row',
    justifyContent: 'center',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    maxHeight: '70%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  modalClose: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  modalScroll: {
    maxHeight: 500,
  },
  versionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  versionItemTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  versionItemSubtitle: {
    fontSize: 13,
  },
  checkmark: {
    marginLeft: 12,
  },
  warningBox: {
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 1,
  },
  warningText: {
    fontSize: 13,
    lineHeight: 18,
  },
});
