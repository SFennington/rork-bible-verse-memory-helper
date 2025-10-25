import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import { BIBLE_BOOKS, getVerseCount } from '@/constants/bibleBooks';
import { useTheme } from '@/contexts/ThemeContext';

interface BibleVersePickerProps {
  onSelect: (book: string, chapter: number, verse?: number, endVerse?: number) => void;
  mode: 'verse' | 'chapter';
  initialBook?: string;
  initialChapter?: number;
  initialVerse?: number;
  initialEndVerse?: number;
}

export default function BibleVersePicker({
  onSelect,
  mode,
  initialBook,
  initialChapter,
  initialVerse,
  initialEndVerse,
}: BibleVersePickerProps) {
  const { theme } = useTheme();
  const [selectedBook, setSelectedBook] = useState(initialBook || 'John');
  const [selectedChapter, setSelectedChapter] = useState(initialChapter || 1);
  const [selectedVerse, setSelectedVerse] = useState(initialVerse || 1);
  const [selectedEndVerse, setSelectedEndVerse] = useState<number | undefined>(initialEndVerse);
  
  // Update internal state when initial values change
  useEffect(() => {
    if (initialBook) setSelectedBook(initialBook);
  }, [initialBook]);
  
  useEffect(() => {
    if (initialChapter) setSelectedChapter(initialChapter);
  }, [initialChapter]);
  
  useEffect(() => {
    if (initialVerse) setSelectedVerse(initialVerse);
  }, [initialVerse]);
  
  useEffect(() => {
    setSelectedEndVerse(initialEndVerse);
  }, [initialEndVerse]);

  // Notify parent of initial selection
  useEffect(() => {
    if (mode === 'chapter') {
      onSelect(selectedBook, selectedChapter);
    } else {
      onSelect(selectedBook, selectedChapter, selectedVerse, selectedEndVerse);
    }
  }, [mode]); // Only run when mode changes
  
  const [showBookPicker, setShowBookPicker] = useState(false);
  const [showChapterPicker, setShowChapterPicker] = useState(false);
  const [showVersePicker, setShowVersePicker] = useState(false);
  const [showEndVersePicker, setShowEndVersePicker] = useState(false);

  const selectedBookData = useMemo(
    () => BIBLE_BOOKS.find(b => b.name === selectedBook),
    [selectedBook]
  );

  const chapters = useMemo(() => {
    if (!selectedBookData) return [];
    return Array.from({ length: selectedBookData.chapters }, (_, i) => i + 1);
  }, [selectedBookData]);

  const verses = useMemo(() => {
    const count = getVerseCount(selectedBook, selectedChapter);
    return Array.from({ length: count }, (_, i) => i + 1);
  }, [selectedBook, selectedChapter]);

  const handleBookSelect = (book: string) => {
    setSelectedBook(book);
    setSelectedChapter(1);
    setSelectedVerse(1);
    setSelectedEndVerse(undefined);
    setShowBookPicker(false);
  };

  const handleChapterSelect = (chapter: number) => {
    setSelectedChapter(chapter);
    setSelectedVerse(1);
    setSelectedEndVerse(undefined);
    setShowChapterPicker(false);
    
    if (mode === 'chapter') {
      onSelect(selectedBook, chapter);
    }
  };

  const handleVerseSelect = (verse: number) => {
    setSelectedVerse(verse);
    setShowVersePicker(false);
    
    if (mode === 'verse' && !selectedEndVerse) {
      onSelect(selectedBook, selectedChapter, verse);
    } else if (selectedEndVerse) {
      onSelect(selectedBook, selectedChapter, verse, selectedEndVerse);
    }
  };

  const handleEndVerseSelect = (endVerse: number) => {
    setSelectedEndVerse(endVerse);
    setShowEndVersePicker(false);
    onSelect(selectedBook, selectedChapter, selectedVerse, endVerse);
  };

  const reference = useMemo(() => {
    if (mode === 'chapter') {
      return `${selectedBook} ${selectedChapter}`;
    }
    if (selectedEndVerse && selectedEndVerse > selectedVerse) {
      return `${selectedBook} ${selectedChapter}:${selectedVerse}-${selectedEndVerse}`;
    }
    return `${selectedBook} ${selectedChapter}:${selectedVerse}`;
  }, [selectedBook, selectedChapter, selectedVerse, selectedEndVerse, mode]);

  return (
    <View style={styles.container}>
      {/* First Row: Book Name */}
      <View style={styles.bookRow}>
        <TouchableOpacity
          style={[styles.bookButton, { backgroundColor: theme.background, borderColor: theme.border }]}
          onPress={() => setShowBookPicker(true)}
          activeOpacity={0.7}
        >
          <Text style={[styles.bookButtonText, { color: theme.text }]}>
            {selectedBook}
          </Text>
          <ChevronDown color={theme.textSecondary} size={20} />
        </TouchableOpacity>
      </View>

      {/* Second Row: Chapter and Verse Pickers */}
      <View style={styles.pickerRow}>
        {/* Chapter Picker */}
        <TouchableOpacity
          style={[styles.pickerButtonSmall, { backgroundColor: theme.background, borderColor: theme.border }]}
          onPress={() => setShowChapterPicker(true)}
          activeOpacity={0.7}
        >
          <Text style={[styles.pickerButtonText, { color: theme.text }]}>
            {selectedChapter}
          </Text>
          <ChevronDown color={theme.textSecondary} size={18} />
        </TouchableOpacity>

        {mode === 'verse' && (
          <>
            <Text style={[styles.separator, { color: theme.textSecondary }]}>:</Text>
            
            {/* Verse Picker */}
            <TouchableOpacity
              style={[styles.pickerButtonSmall, { backgroundColor: theme.background, borderColor: theme.border }]}
              onPress={() => setShowVersePicker(true)}
              activeOpacity={0.7}
            >
              <Text style={[styles.pickerButtonText, { color: theme.text }]}>
                {selectedVerse}
              </Text>
              <ChevronDown color={theme.textSecondary} size={18} />
            </TouchableOpacity>

            {/* Optional: End Verse Picker for ranges */}
            <TouchableOpacity
              style={[styles.rangeButton, { backgroundColor: theme.background, borderColor: theme.border }]}
              onPress={() => setShowEndVersePicker(true)}
              activeOpacity={0.7}
            >
              <Text style={[styles.rangeButtonText, { color: theme.textSecondary }]}>
                {selectedEndVerse ? `-${selectedEndVerse}` : '+'}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <Text style={[styles.referenceDisplay, { color: theme.textSecondary }]}>
        {reference}
      </Text>

      {/* Book Modal */}
      <Modal visible={showBookPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.cardBackground }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Select Book</Text>
              <TouchableOpacity onPress={() => setShowBookPicker(false)}>
                <Text style={[styles.modalClose, { color: '#667eea' }]}>Done</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              <Text style={[styles.testamentHeader, { color: theme.textSecondary }]}>Old Testament</Text>
              {BIBLE_BOOKS.filter(b => b.testament === 'OT').map((book) => (
                <TouchableOpacity
                  key={book.name}
                  style={[
                    styles.modalItem,
                    selectedBook === book.name && { backgroundColor: 'rgba(102, 126, 234, 0.1)' },
                  ]}
                  onPress={() => handleBookSelect(book.name)}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      { color: selectedBook === book.name ? '#667eea' : theme.text },
                    ]}
                  >
                    {book.name}
                  </Text>
                </TouchableOpacity>
              ))}
              
              <Text style={[styles.testamentHeader, { color: theme.textSecondary }]}>New Testament</Text>
              {BIBLE_BOOKS.filter(b => b.testament === 'NT').map((book) => (
                <TouchableOpacity
                  key={book.name}
                  style={[
                    styles.modalItem,
                    selectedBook === book.name && { backgroundColor: 'rgba(102, 126, 234, 0.1)' },
                  ]}
                  onPress={() => handleBookSelect(book.name)}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      { color: selectedBook === book.name ? '#667eea' : theme.text },
                    ]}
                  >
                    {book.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Chapter Modal */}
      <Modal visible={showChapterPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.cardBackground }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Select Chapter</Text>
              <TouchableOpacity onPress={() => setShowChapterPicker(false)}>
                <Text style={[styles.modalClose, { color: '#667eea' }]}>Done</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll} contentContainerStyle={styles.gridContainer}>
              {chapters.map((chapter) => (
                <TouchableOpacity
                  key={chapter}
                  style={[
                    styles.gridItem,
                    { backgroundColor: theme.background, borderColor: theme.border },
                    selectedChapter === chapter && styles.gridItemSelected,
                  ]}
                  onPress={() => handleChapterSelect(chapter)}
                >
                  <Text
                    style={[
                      styles.gridItemText,
                      { color: selectedChapter === chapter ? '#fff' : theme.text },
                    ]}
                  >
                    {chapter}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Verse Modal */}
      {mode === 'verse' && (
        <>
          <Modal visible={showVersePicker} transparent animationType="slide">
            <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, { backgroundColor: theme.cardBackground }]}>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: theme.text }]}>Select Verse</Text>
                  <TouchableOpacity onPress={() => setShowVersePicker(false)}>
                    <Text style={[styles.modalClose, { color: '#667eea' }]}>Done</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.modalScroll} contentContainerStyle={styles.gridContainer}>
                  {verses.map((verse) => (
                    <TouchableOpacity
                      key={verse}
                      style={[
                        styles.gridItem,
                        { backgroundColor: theme.background, borderColor: theme.border },
                        selectedVerse === verse && styles.gridItemSelected,
                      ]}
                      onPress={() => handleVerseSelect(verse)}
                    >
                      <Text
                        style={[
                          styles.gridItemText,
                          { color: selectedVerse === verse ? '#fff' : theme.text },
                        ]}
                      >
                        {verse}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </Modal>

          {/* End Verse Modal */}
          <Modal visible={showEndVersePicker} transparent animationType="slide">
            <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, { backgroundColor: theme.cardBackground }]}>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: theme.text }]}>Select End Verse (Optional)</Text>
                  <TouchableOpacity onPress={() => {
                    setSelectedEndVerse(undefined);
                    setShowEndVersePicker(false);
                  }}>
                    <Text style={[styles.modalClose, { color: '#667eea' }]}>Clear</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.modalScroll} contentContainerStyle={styles.gridContainer}>
                  {verses.filter(v => v > selectedVerse).map((verse) => (
                    <TouchableOpacity
                      key={verse}
                      style={[
                        styles.gridItem,
                        { backgroundColor: theme.background, borderColor: theme.border },
                        selectedEndVerse === verse && styles.gridItemSelected,
                      ]}
                      onPress={() => handleEndVerseSelect(verse)}
                    >
                      <Text
                        style={[
                          styles.gridItemText,
                          { color: selectedEndVerse === verse ? '#fff' : theme.text },
                        ]}
                      >
                        {verse}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </Modal>
        </>
      )}
    </View>
  );
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  bookRow: {
    marginBottom: 8,
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  bookButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pickerButtonSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 60,
  },
  pickerButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  separator: {
    fontSize: 20,
    fontWeight: '600' as const,
  },
  rangeButton: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 50,
    alignItems: 'center',
  },
  rangeButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  referenceDisplay: {
    marginTop: 8,
    fontSize: 14,
    fontStyle: 'italic' as const,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    maxHeight: SCREEN_HEIGHT * 0.7,
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
    maxHeight: SCREEN_HEIGHT * 0.6,
  },
  modalItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  modalItemText: {
    fontSize: 16,
    fontWeight: '500' as const,
  },
  testamentHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
    fontSize: 14,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  gridItem: {
    width: (Dimensions.get('window').width - 80) / 5,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
  },
  gridItemSelected: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  gridItemText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
});

