import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Book, Target, Settings, Plus, Play, PlusCircle } from 'lucide-react-native';
import { useVerses } from '@/contexts/VerseContext';
import { useTheme } from '@/contexts/ThemeContext';
import { CATEGORIES } from '@/mocks/verses';
import { VerseCategory } from '@/types/verse';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 48;

type TabType = 'browse' | 'progress';

export default function HomeScreen() {
  const router = useRouter();
  const { verses, progress, versesInProgress, dueVersesCount, addToProgress } = useVerses();
  const { theme } = useTheme();
  const [selectedTab, setSelectedTab] = useState<TabType>('progress');
  const [selectedCategory, setSelectedCategory] = useState<VerseCategory | null>(null);
  const insets = useSafeAreaInsets();

  const filteredVerses = selectedCategory
    ? verses.filter(v => v.category === selectedCategory)
    : verses;

  const isInProgress = (verseId: string) => {
    return !!progress[verseId];
  };

  const handleAddToProgress = (verseId: string) => {
    addToProgress(verseId);
    setSelectedTab('progress');
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
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
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => router.push('/settings')}
              activeOpacity={0.7}
            >
              <Settings color="#fff" size={24} />
            </TouchableOpacity>
          </View>
          <Text style={styles.subtitle}>Hide God&apos;s Word in your heart</Text>
          
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
              {dueVersesCount > 0 && (
                <View style={styles.dueBadge}>
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
                    !selectedCategory && styles.categoryTextActive,
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
              {versesInProgress.length === 0 ? (
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
                versesInProgress.map(({ verse, progress: verseProgress }) => {
                  const category = CATEGORIES.find(c => c.name === verse.category);
                  const isDue = verseProgress.completedGamesToday < 3;

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
                          {isDue && (
                            <View style={styles.dueIndicator}>
                              <Play color="#fff" size={14} fill="#fff" />
                            </View>
                          )}
                        </View>
                        <Text style={styles.verseText} numberOfLines={3}>
                          {verse.text}
                        </Text>
                        <View style={styles.verseFooter}>
                          <View style={styles.progressBarContainer}>
                            <View style={[styles.progressBar, { width: `${verseProgress.overallProgress}%` }]} />
                          </View>
                          <Text style={styles.progressText}>{verseProgress.overallProgress}%</Text>
                        </View>
                      </LinearGradient>
                    </TouchableOpacity>
                  );
                })
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
              {filteredVerses.map(verse => {
              const inProgress = isInProgress(verse.id);
              const category = CATEGORIES.find(c => c.name === verse.category);

              return (
                <TouchableOpacity
                  key={verse.id}
                  style={styles.verseCard}
                  onPress={() => inProgress ? router.push(`/verse/${verse.id}`) : handleAddToProgress(verse.id)}
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
                      {!inProgress && (
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
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
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
    marginBottom: 12,
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
    color: '#667eea',
  },
  scrollView: {
    flex: 1,
  },
  versesContainer: {
    padding: 24,
    gap: 16,
    paddingBottom: 40,
  },
  verseCard: {
    width: CARD_WIDTH,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  verseGradient: {
    padding: 20,
    minHeight: 160,
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
  dueIndicator: {
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
  verseFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  progressText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#fff',
    minWidth: 40,
  },
  masteryInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  masteryText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#fff',
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
  verseText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#fff',
    marginBottom: 12,
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
    width: CARD_WIDTH,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    borderStyle: 'dashed' as const,
  },
  addCustomContent: {
    padding: 32,
    alignItems: 'center',
    gap: 12,
    minHeight: 160,
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
});
