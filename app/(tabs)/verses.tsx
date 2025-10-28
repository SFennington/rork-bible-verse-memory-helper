import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Modal,
  Alert,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Book, Target, Plus, Play, PlusCircle, Crown, Archive, TrendingUp, Flame, CheckCircle2, Calendar, Edit2, Trash2, Check, X } from 'lucide-react-native';
import { useVerses } from '@/contexts/VerseContext';
import { useTheme } from '@/contexts/ThemeContext';
import { CATEGORIES } from '@/mocks/verses';
import { VerseCategory, BibleVerse, Chapter } from '@/types/verse';

const DIFFICULTY_LABELS = [
  '',
  'Level 1',
  'Level 2',
  'Level 3',
  'Level 4',
  'Level 5',
];

type TabType = 'browse' | 'progress';

export default function HomeScreen() {
  const router = useRouter();
  const { verses, progress, versesInProgress, dueVersesCount, addToProgress, archivedVerses, chapters, customVerses, deleteCustomVerse, deleteCustomChapter, updateVerseCategory, updateChapterCategory, bulkDeleteCustomVerses, bulkDeleteCustomChapters, getChapterUnlockedVerses } = useVerses();
  const { theme, themeMode } = useTheme();
  const [selectedTab, setSelectedTab] = useState<TabType>('progress');
  const [selectedCategory, setSelectedCategory] = useState<VerseCategory | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [bulkSelectMode, setBulkSelectMode] = useState(false);
  const [selectedVerseIds, setSelectedVerseIds] = useState<string[]>([]);
  const [selectedChapterIds, setSelectedChapterIds] = useState<string[]>([]);
  const [editingItem, setEditingItem] = useState<{type: 'verse' | 'chapter', item: BibleVerse | Chapter} | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const insets = useSafeAreaInsets();

  // Filter out individual verses that are part of chapters from browse view
  const browsableVerses = useMemo(() => {
    return verses.filter(v => !v.chapterId); // Only show verses not part of a chapter
  }, [verses]);

  const filteredVerses = selectedCategory
    ? browsableVerses.filter(v => v.category === selectedCategory)
    : browsableVerses;
  
  const filteredChapters = selectedCategory
    ? chapters.filter(c => c.category === selectedCategory)
    : chapters;

  const isInProgress = (verseId: string) => {
    return !!progress[verseId];
  };

  const handleAddToProgress = async (verseId: string) => {
    console.log('>>> verses.tsx: handleAddToProgress called with verseId:', verseId);
    console.log('>>> verses.tsx: Total chapters available:', chapters.length);
    console.log('>>> verses.tsx: Is this a chapter?', chapters.some(c => c.id === verseId));
    await addToProgress(verseId);
    console.log('>>> verses.tsx: addToProgress completed, switching to progress tab');
    setSelectedTab('progress');
  };

  const toggleBulkSelectMode = () => {
    setBulkSelectMode(!bulkSelectMode);
    setSelectedVerseIds([]);
    setSelectedChapterIds([]);
  };

  const toggleVerseSelection = (verseId: string) => {
    setSelectedVerseIds(prev => 
      prev.includes(verseId) ? prev.filter(id => id !== verseId) : [...prev, verseId]
    );
  };

  const toggleChapterSelection = (chapterId: string) => {
    setSelectedChapterIds(prev => 
      prev.includes(chapterId) ? prev.filter(id => id !== chapterId) : [...prev, chapterId]
    );
  };

  const handleBulkDelete = () => {
    const totalSelected = selectedVerseIds.length + selectedChapterIds.length;
    if (totalSelected === 0) return;

    Alert.alert(
      'Delete Items',
      `Are you sure you want to delete ${totalSelected} item(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (selectedVerseIds.length > 0) {
              await bulkDeleteCustomVerses(selectedVerseIds);
            }
            if (selectedChapterIds.length > 0) {
              await bulkDeleteCustomChapters(selectedChapterIds);
            }
            setBulkSelectMode(false);
            setSelectedVerseIds([]);
            setSelectedChapterIds([]);
          },
        },
      ]
    );
  };

  const handleItemClick = (type: 'verse' | 'chapter', item: BibleVerse | Chapter) => {
    const isCustom = type === 'verse' ? customVerses.some(v => v.id === item.id) : true;
    
    if (bulkSelectMode && isCustom) {
      if (type === 'verse') {
        toggleVerseSelection(item.id);
      } else {
        toggleChapterSelection(item.id);
      }
    } else if (isCustom && selectedTab === 'browse') {
      // Show edit modal for custom items in browse
      setEditingItem({ type, item });
      setShowEditModal(true);
    } else {
      // Regular behavior for non-custom items or items in progress tab
      const inProgress = isInProgress(item.id);
      if (inProgress) {
        router.push(`/verse/${item.id}`);
      } else {
        handleAddToProgress(item.id);
      }
    }
  };

  const handleDeleteItem = async () => {
    if (!editingItem) return;

    Alert.alert(
      'Delete Item',
      `Are you sure you want to delete this ${editingItem.type}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (editingItem.type === 'verse') {
              await deleteCustomVerse(editingItem.item.id);
            } else {
              await deleteCustomChapter(editingItem.item.id);
            }
            setShowEditModal(false);
            setEditingItem(null);
          },
        },
      ]
    );
  };

  const handleUpdateCategory = async (newCategory: VerseCategory) => {
    if (!editingItem) return;

    if (editingItem.type === 'verse') {
      await updateVerseCategory(editingItem.item.id, newCategory);
    } else {
      await updateChapterCategory(editingItem.item.id, newCategory);
    }
    setShowEditModal(false);
    setEditingItem(null);
  };

  // Separate incomplete and completed verses
  const incompleteVerses = versesInProgress.filter(item => {
    const requiredGames = item.progress.isChapter ? 2 : (item.progress.difficultyLevel === 5 ? 1 : 3);
    return item.progress.completedGamesToday < requiredGames;
  });
  
  const completedVerses = versesInProgress.filter(item => {
    const requiredGames = item.progress.isChapter ? 2 : (item.progress.difficultyLevel === 5 ? 1 : 3);
    return item.progress.completedGamesToday >= requiredGames;
  });

  // Better stats calculation
  const totalStreak = versesInProgress.reduce((sum, item) => sum + item.progress.streakDays, 0);
  const masteredCount = versesInProgress.filter(item => item.progress.overallProgress === 100).length;
  const masteredPercent = versesInProgress.length > 0
    ? (masteredCount / versesInProgress.length) * 100
    : 0;

  return (
    <View style={styles.container}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="transparent" 
        translucent={true}
      />
      <LinearGradient
        colors={theme.gradient as any}
        style={styles.gradient}
        start={theme.gradientStart}
        end={theme.gradientEnd}
      >
        <View style={[styles.header, { paddingTop: 20 + insets.top }]}>
          <View style={styles.headerRow}>
            <View style={styles.headerContent}>
              <Book color="#fff" size={28} strokeWidth={2.5} />
              <Text style={styles.title}>Scripture Memory</Text>
            </View>
          </View>
          <Text style={styles.subtitle}>Hide God&apos;s Word in your heart</Text>
          
          {selectedTab === 'progress' && versesInProgress.length > 0 && (
            <View style={styles.statsRow}>
              <View style={[styles.statCard, themeMode === 'dark' && styles.statCardDark]}>
                <Target color="#667eea" size={16} />
                <Text style={[styles.statValue, themeMode === 'dark' && styles.statValueDark]}>{versesInProgress.length}</Text>
                <Text style={[styles.statLabel, themeMode === 'dark' && styles.statLabelDark]}>Active</Text>
              </View>
              <View style={[styles.statCard, themeMode === 'dark' && styles.statCardDark]}>
                <Flame color="#f59e0b" size={16} />
                <Text style={[styles.statValue, themeMode === 'dark' && styles.statValueDark]}>{totalStreak}</Text>
                <Text style={[styles.statLabel, themeMode === 'dark' && styles.statLabelDark]}>Streak</Text>
              </View>
              <View style={[styles.statCard, themeMode === 'dark' && styles.statCardDark]}>
                <Calendar color="#10b981" size={16} />
                <Text style={[styles.statValue, themeMode === 'dark' && styles.statValueDark]}>{dueVersesCount}</Text>
                <Text style={[styles.statLabel, themeMode === 'dark' && styles.statLabelDark]}>Due</Text>
              </View>
              <View style={[styles.statCard, themeMode === 'dark' && styles.statCardDark]}>
                <TrendingUp color="#8b5cf6" size={16} />
                <Text style={[styles.statValue, themeMode === 'dark' && styles.statValueDark]}>{masteredPercent.toFixed(0)}%</Text>
                <Text style={[styles.statLabel, themeMode === 'dark' && styles.statLabelDark]}>Mastered</Text>
              </View>
            </View>
          )}

          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[
                styles.tab,
                selectedTab === 'progress' && styles.tabActive,
              ]}
              onPress={() => setSelectedTab('progress')}
              activeOpacity={0.7}
            >
              <Target color={selectedTab === 'progress' ? '#fff' : 'rgba(255, 255, 255, 0.7)'} size={20} />
              <Text style={[
                styles.tabText,
                selectedTab === 'progress' && styles.tabTextActive,
              ]}>
                My Progress
              </Text>
              {(versesInProgress.length > 0 || archivedVerses.length > 0) && (
                <View style={[styles.dueBadge, dueVersesCount === 0 && styles.dueBadgeComplete]}>
                  <Text style={styles.dueBadgeText}>{dueVersesCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tab,
                selectedTab === 'browse' && styles.tabActive,
              ]}
              onPress={() => setSelectedTab('browse')}
              activeOpacity={0.7}
            >
              <Book color={selectedTab === 'browse' ? '#fff' : 'rgba(255, 255, 255, 0.7)'} size={20} />
              <Text style={[
                styles.tabText,
                selectedTab === 'browse' && styles.tabTextActive,
              ]}>
                Browse
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {selectedTab === 'browse' && (
          <View style={styles.categoriesContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesScroll}
            >
              <TouchableOpacity
                style={[
                  styles.categoryChip,
                  !selectedCategory && styles.categoryChipActive,
                ]}
                onPress={() => setSelectedCategory(null)}
              >
                <Text
                  style={[
                    styles.categoryText,
                    !selectedCategory && styles.categoryTextAllActive,
                  ]}
                >
                  All
                </Text>
              </TouchableOpacity>
              {CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat.name}
                  style={[
                    styles.categoryChip,
                    selectedCategory === cat.name && styles.categoryChipActive,
                    selectedCategory === cat.name && { backgroundColor: cat.color },
                  ]}
                  onPress={() => setSelectedCategory(cat.name as VerseCategory)}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      selectedCategory === cat.name && styles.categoryTextActive,
                    ]}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.versesContainer}
          showsVerticalScrollIndicator={false}
        >
          {selectedTab === 'progress' && (
            <>
              {versesInProgress.length === 0 && archivedVerses.length === 0 && !showArchived ? (
                <View style={styles.emptyState}>
                  <Target color="rgba(255, 255, 255, 0.5)" size={64} />
                  <Text style={styles.emptyTitle}>Start Your Journey</Text>
                  <Text style={styles.emptyText}>
                    Add verses from Browse to begin memorizing
                  </Text>
                  <TouchableOpacity
                    style={styles.browseButton}
                    onPress={() => setSelectedTab('browse')}
                    activeOpacity={0.9}
                  >
                    <Text style={styles.browseButtonText}>Browse Verses</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  {/* Continue Learning Section */}
                  {incompleteVerses.length > 0 && (
                    <>
                      <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Continue Learning</Text>
                        <View style={styles.dueBadgeSection}>
                          <Text style={styles.dueBadgeTextSection}>{incompleteVerses.length}</Text>
                        </View>
                      </View>
                      {incompleteVerses.map(({ verse, progress: verseProgress }) => {
                        const category = CATEGORIES.find(c => c.name === verse.category);
                        const difficultyLabel = DIFFICULTY_LABELS[verseProgress.difficultyLevel];
                        const requiredGames = verseProgress.isChapter ? 2 : (verseProgress.difficultyLevel === 5 ? 1 : 3);
                        
                        const completedGames = verseProgress.gameSessions
                          .filter(s => {
                            const sessionDate = new Date(s.completedAt);
                            const today = new Date();
                            return sessionDate.toDateString() === today.toDateString() && s.difficultyLevel === verseProgress.difficultyLevel;
                          })
                          .map(s => s.gameType);
                        
                        const nextGame = verseProgress.currentDayGames.find(game => !completedGames.includes(game)) || verseProgress.currentDayGames[0];

                        // Determine game target ID (for chapters with single-verse games, use current verse ID)
                        let gameTargetId = verse.id;
                        let chapterParam = '';
                        if (verseProgress.isChapter && verseProgress.chapterProgress) {
                          if (nextGame === 'progressive-reveal' || nextGame === 'flashcard') {
                            const unlockedVerses = getChapterUnlockedVerses(verse.id);
                            const currentVerse = unlockedVerses[verseProgress.chapterProgress.currentVerseIndex];
                            gameTargetId = currentVerse?.id || verse.id;
                            chapterParam = `?chapterId=${verse.id}`; // Pass chapter ID for progress tracking
                          }
                        }

                        return (
                          <TouchableOpacity
                            key={verse.id}
                            style={styles.verseCard}
                            onPress={() => router.push(`/verse/${verse.id}`)}
                            activeOpacity={0.9}
                          >
                            <LinearGradient
                              colors={category?.gradient || ['#667eea', '#764ba2']}
                              style={styles.verseGradient}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 1 }}
                            >
                              <View style={styles.verseHeader}>
                                <Text style={styles.verseReference}>{verse.reference}</Text>
                                <View style={styles.headerActions}>
                                  {verseProgress.completedGamesToday >= requiredGames && (
                                    <View style={styles.completedBadge}>
                                      <CheckCircle2 color="#10b981" size={20} fill="#10b981" />
                                    </View>
                                  )}
                                  <TouchableOpacity 
                                    style={styles.playButton}
                                    onPress={(e) => {
                                      e.stopPropagation();
                                      router.push(`/game/${nextGame}/${gameTargetId}${chapterParam}`);
                                    }}
                                  >
                                    <Play color="#fff" size={16} fill="#fff" />
                                  </TouchableOpacity>
                                </View>
                              </View>
                              <Text style={styles.verseText} numberOfLines={2}>
                                {verse.text}
                              </Text>
                              <View style={styles.verseFooter}>
                                {verseProgress.overallProgress === 100 ? (
                                  <View style={styles.masteredContainer}>
                                    <Crown color="#10b981" size={24} fill="#10b981" />
                                    <Text style={styles.masteredText}>Mastered</Text>
                                  </View>
                                ) : (
                                  <>
                                    <View style={styles.progressRow}>
                                      <View style={styles.progressBarContainer}>
                                        <View style={[styles.progressBar, { width: `${verseProgress.overallProgress}%` }]} />
                                      </View>
                                      <Text style={styles.progressPercentage}>{verseProgress.overallProgress}%</Text>
                                    </View>
                                    <View style={styles.badgeRow}>
                                      <View style={styles.masteryBadge}>
                                        <Text style={styles.masteryBadgeText}>{difficultyLabel}</Text>
                                      </View>
                                      <View style={styles.gamesBadge}>
                                        <Text style={styles.gamesBadgeText}>{verseProgress.completedGamesToday}/{requiredGames} today</Text>
                                      </View>
                                    </View>
                                  </>
                                )}
                              </View>
                            </LinearGradient>
                          </TouchableOpacity>
                        );
                      })}
                    </>
                  )}

                  {/* Completed Today Section */}
                  {completedVerses.length > 0 && (
                    <>
                      <Text style={styles.sectionTitle}>Completed Today</Text>
                      {completedVerses.map(({ verse, progress: verseProgress }) => {
                        const category = CATEGORIES.find(c => c.name === verse.category);
                        const difficultyLabel = DIFFICULTY_LABELS[verseProgress.difficultyLevel];

                        return (
                          <TouchableOpacity
                            key={verse.id}
                            style={styles.completedCard}
                            onPress={() => router.push(`/verse/${verse.id}`)}
                            activeOpacity={0.9}
                          >
                            <View style={styles.completedContent}>
                              <View style={styles.completedHeader}>
                                <Text style={styles.completedReference}>{verse.reference}</Text>
                                <CheckCircle2 color="#10b981" size={24} fill="#10b981" />
                              </View>
                              <Text style={styles.completedText} numberOfLines={1}>
                                {verse.text}
                              </Text>
                              <View style={styles.completedFooter}>
                                {verseProgress.overallProgress === 100 ? (
                                  <View style={styles.masteredBadge}>
                                    <Crown color="#10b981" size={16} fill="#10b981" />
                                    <Text style={styles.masteredBadgeText}>Mastered</Text>
                                  </View>
                                ) : (
                                  <>
                                    <View style={styles.completedMasteryBadge}>
                                      <Text style={styles.completedMasteryText}>{difficultyLabel}</Text>
                                    </View>
                                    <Text style={styles.nextReviewText}>
                                      {verseProgress.overallProgress}% memorized
                                    </Text>
                                  </>
                                )}
                              </View>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </>
                  )}

                  {archivedVerses.length > 0 && (
                    <TouchableOpacity
                      style={styles.archivedToggle}
                      onPress={() => setShowArchived(!showArchived)}
                      activeOpacity={0.7}
                    >
                      <Archive color="#fff" size={20} />
                      <Text style={styles.archivedToggleText}>
                        {showArchived ? 'Hide' : 'Show'} Archived ({archivedVerses.length})
                      </Text>
                    </TouchableOpacity>
                  )}

                  {showArchived && archivedVerses.map(({ verse, progress: verseProgress }) => {
                    const category = CATEGORIES.find(c => c.name === verse.category);

                    return (
                      <TouchableOpacity
                        key={verse.id}
                        style={[styles.verseCard, styles.archivedCard]}
                        onPress={() => router.push(`/verse/${verse.id}`)}
                        activeOpacity={0.9}
                      >
                        <LinearGradient
                          colors={category?.gradient || ['#667eea', '#764ba2']}
                          style={[styles.verseGradient, styles.archivedGradient]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                        >
                          <View style={styles.archivedBadge}>
                            <Archive color="#fff" size={14} />
                            <Text style={styles.archivedBadgeText}>Archived</Text>
                          </View>
                          <View style={styles.verseHeader}>
                            <Text style={styles.verseReference}>{verse.reference}</Text>
                          </View>
                          <Text style={styles.verseText} numberOfLines={3}>
                            {verse.text}
                          </Text>
                          {verseProgress.overallProgress === 100 ? (
                            <View style={styles.masteredContainer}>
                              <Crown color="#10b981" size={24} fill="#10b981" />
                              <Text style={styles.masteredText}>Mastered</Text>
                            </View>
                          ) : (
                            <View style={styles.verseFooter}>
                              <View style={styles.progressBarContainer}>
                                <View style={[styles.progressBar, { width: `${verseProgress.overallProgress}%` }]} />
                              </View>
                              <Text style={styles.progressText}>{verseProgress.overallProgress}%</Text>
                            </View>
                          )}
                        </LinearGradient>
                      </TouchableOpacity>
                    );
                  })}
                </>
              )}
            </>
          )}

          {selectedTab === 'browse' && (
            <>
              <TouchableOpacity
                style={styles.addCustomCard}
                onPress={() => router.push('/add-verse')}
                activeOpacity={0.9}
              >
                <View style={styles.addCustomContent}>
                  <PlusCircle color="#fff" size={32} />
                  <Text style={styles.addCustomTitle}>Add Custom Verse</Text>
                  <Text style={styles.addCustomText}>
                    Add your own verses or chapters to memorize
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Bulk Select Controls */}
              {(customVerses.length > 0 || chapters.length > 0) && (
                <View style={styles.bulkSelectBar}>
                  <TouchableOpacity
                    style={[styles.bulkButton, bulkSelectMode && styles.bulkButtonActive]}
                    onPress={toggleBulkSelectMode}
                    activeOpacity={0.7}
                  >
                    <Edit2 color={bulkSelectMode ? "#fff" : "#667eea"} size={18} />
                    <Text style={[styles.bulkButtonText, bulkSelectMode && styles.bulkButtonTextActive]}>
                      {bulkSelectMode ? 'Cancel' : 'Select'}
                    </Text>
                  </TouchableOpacity>

                  {bulkSelectMode && (
                    <TouchableOpacity
                      style={[styles.bulkDeleteButton, (selectedVerseIds.length === 0 && selectedChapterIds.length === 0) && styles.bulkDeleteButtonDisabled]}
                      onPress={handleBulkDelete}
                      activeOpacity={0.7}
                      disabled={selectedVerseIds.length === 0 && selectedChapterIds.length === 0}
                    >
                      <Trash2 color="#fff" size={18} />
                      <Text style={styles.bulkButtonText}>
                        Delete ({selectedVerseIds.length + selectedChapterIds.length})
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
              
              {/* Display Chapters */}
              {filteredChapters.map(chapter => {
              const inProgress = isInProgress(chapter.id);
              const category = CATEGORIES.find(c => c.name === chapter.category);
              const isSelected = selectedChapterIds.includes(chapter.id);

              return (
                <TouchableOpacity
                  key={chapter.id}
                  style={[styles.verseCard, isSelected && styles.verseCardSelected]}
                  onPress={() => handleItemClick('chapter', chapter)}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={category?.gradient || ['#667eea', '#764ba2']}
                    style={styles.verseGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={styles.verseHeader}>
                      <Text style={styles.verseReference}>{chapter.reference} ({chapter.verses.length} verses)</Text>
                      {bulkSelectMode && (
                        <View style={[styles.selectCheckbox, isSelected && styles.selectCheckboxSelected]}>
                          {isSelected && <Check color="#fff" size={16} />}
                        </View>
                      )}
                      {!inProgress && !bulkSelectMode && (
                        <View style={styles.addButton}>
                          <Plus color="#fff" size={20} strokeWidth={3} />
                        </View>
                      )}
                    </View>
                    <Text style={styles.verseText} numberOfLines={3}>
                      {chapter.verses[0]?.text}...
                    </Text>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryBadgeText}>{chapter.category}</Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              );
              })}
              
              {/* Display Individual Verses */}
              {filteredVerses.map(verse => {
              const inProgress = isInProgress(verse.id);
              const category = CATEGORIES.find(c => c.name === verse.category);
              const isCustom = customVerses.some(v => v.id === verse.id);
              const isSelected = selectedVerseIds.includes(verse.id);

              return (
                <TouchableOpacity
                  key={verse.id}
                  style={[styles.verseCard, isSelected && styles.verseCardSelected]}
                  onPress={() => handleItemClick('verse', verse)}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={category?.gradient || ['#667eea', '#764ba2']}
                    style={styles.verseGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={styles.verseHeader}>
                      <Text style={styles.verseReference}>{verse.reference}</Text>
                      {bulkSelectMode && isCustom && (
                        <View style={[styles.selectCheckbox, isSelected && styles.selectCheckboxSelected]}>
                          {isSelected && <Check color="#fff" size={16} />}
                        </View>
                      )}
                      {!inProgress && !bulkSelectMode && (
                        <View style={styles.addButton}>
                          <Plus color="#fff" size={20} strokeWidth={3} />
                        </View>
                      )}
                    </View>
                    <Text style={styles.verseText} numberOfLines={3}>
                      {verse.text}
                    </Text>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryBadgeText}>{verse.category}</Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              );
              })}
            </>
          )}
        </ScrollView>
      </LinearGradient>

      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, themeMode === 'dark' && styles.modalContentDark]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, themeMode === 'dark' && styles.modalTitleDark]}>
                Edit {editingItem?.type === 'chapter' ? 'Chapter' : 'Verse'}
              </Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <X color={themeMode === 'dark' ? '#fff' : '#333'} size={24} />
              </TouchableOpacity>
            </View>

            {editingItem && (
              <>
                <View style={styles.modalSection}>
                  <Text style={[styles.modalLabel, themeMode === 'dark' && styles.modalLabelDark]}>Reference</Text>
                  <Text style={[styles.modalValue, themeMode === 'dark' && styles.modalValueDark]}>
                    {editingItem.type === 'chapter' 
                      ? (editingItem.item as Chapter).reference 
                      : (editingItem.item as BibleVerse).reference}
                  </Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={[styles.modalLabel, themeMode === 'dark' && styles.modalLabelDark]}>Category</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categorySelectorScroll}>
                    {CATEGORIES.map(cat => (
                      <TouchableOpacity
                        key={cat.name}
                        style={[
                          styles.categoryOption,
                          editingItem.item.category === cat.name && styles.categoryOptionSelected
                        ]}
                        onPress={() => handleUpdateCategory(cat.name as VerseCategory)}
                      >
                        <LinearGradient
                          colors={cat.gradient}
                          style={styles.categoryOptionGradient}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                        >
                          <Text style={styles.categoryOptionText}>{cat.name}</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.addToProgressButton}
                    onPress={async () => {
                      await handleAddToProgress(editingItem.item.id);
                      setShowEditModal(false);
                      setEditingItem(null);
                    }}
                  >
                    <Play color="#fff" size={20} />
                    <Text style={styles.addToProgressButtonText}>Add to Progress</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={handleDeleteItem}
                  >
                    <Trash2 color="#fff" size={20} />
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
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
  gradient: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginLeft: 44,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 10,
    padding: 8,
    alignItems: 'center',
    gap: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statCardDark: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1f2937',
  },
  statValueDark: {
    color: '#fff',
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '600' as const,
    color: '#6b7280',
    textAlign: 'center',
  },
  statLabelDark: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  tabsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  tabActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  tabTextActive: {
    color: '#fff',
  },
  dueBadge: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  dueBadgeComplete: {
    backgroundColor: '#10b981',
  },
  dueBadgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#fff',
  },
  categoriesContainer: {
    marginBottom: 16,
  },
  categoriesScroll: {
    paddingHorizontal: 24,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: '#fff',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#fff',
  },
  categoryTextActive: {
    color: '#fff',
  },
  categoryTextAllActive: {
    color: '#667eea',
  },
  scrollView: {
    flex: 1,
  },
  versesContainer: {
    padding: 24,
    gap: 12,
    paddingBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#fff',
  },
  dueBadgeSection: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dueBadgeTextSection: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#fff',
  },
  verseCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  verseGradient: {
    padding: 20,
  },
  verseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  verseReference: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  completedBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verseText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#fff',
    marginBottom: 12,
  },
  verseFooter: {
    gap: 8,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  progressBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 4,
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#fff',
    minWidth: 40,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  masteryBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    flex: 1,
  },
  masteryBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#fff',
  },
  gamesBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  gamesBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#fff',
  },
  progressText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#fff',
    minWidth: 40,
  },
  masteredContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  masteredText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#10b981',
  },
  completedCard: {
    borderRadius: 16,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  completedContent: {
    gap: 8,
  },
  completedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  completedReference: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1f2937',
  },
  completedText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#6b7280',
  },
  completedFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  completedMasteryBadge: {
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  completedMasteryText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#6b7280',
  },
  nextReviewText: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: '#9ca3af',
  },
  masteredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  masteredBadgeText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#10b981',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#fff',
  },
  emptyText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 32,
  },
  browseButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 8,
  },
  browseButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#667eea',
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#fff',
  },
  addCustomCard: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    borderStyle: 'dashed' as const,
  },
  addCustomContent: {
    padding: 24,
    alignItems: 'center',
    gap: 10,
    justifyContent: 'center',
  },
  addCustomTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#fff',
  },
  addCustomText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 20,
  },
  archivedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    marginTop: 12,
  },
  archivedToggleText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#fff',
  },
  archivedCard: {
    opacity: 0.8,
  },
  archivedGradient: {
    position: 'relative',
  },
  archivedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    zIndex: 1,
  },
  archivedBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#fff',
  },
  bulkSelectBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  bulkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#667eea',
  },
  bulkButtonActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  bulkButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#667eea',
  },
  bulkButtonTextActive: {
    color: '#fff',
  },
  bulkDeleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#ef4444',
  },
  bulkDeleteButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.5,
  },
  selectCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  selectCheckboxSelected: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  verseCardSelected: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: 400,
  },
  modalContentDark: {
    backgroundColor: '#1f2937',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#1f2937',
  },
  modalTitleDark: {
    color: '#fff',
  },
  modalSection: {
    marginBottom: 24,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#6b7280',
    marginBottom: 8,
  },
  modalLabelDark: {
    color: '#9ca3af',
  },
  modalValue: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#1f2937',
  },
  modalValueDark: {
    color: '#fff',
  },
  categorySelectorScroll: {
    marginTop: 8,
  },
  categoryOption: {
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  categoryOptionSelected: {
    transform: [{ scale: 1.05 }],
  },
  categoryOptionGradient: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  categoryOptionText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#fff',
  },
  modalActions: {
    gap: 12,
    marginTop: 8,
  },
  addToProgressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#667eea',
    paddingVertical: 16,
    borderRadius: 12,
  },
  addToProgressButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ef4444',
    paddingVertical: 16,
    borderRadius: 12,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
});
