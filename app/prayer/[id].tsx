import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Heart,
  CheckCircle2,
  Trash2,
  Clock,
  Calendar,
  TrendingUp,
  ArrowLeft,
} from 'lucide-react-native';
import { usePrayer } from '@/contexts/PrayerContext';
import { useTheme } from '@/contexts/ThemeContext';
import { PRAYER_CATEGORIES } from '@/types/prayer';

export default function PrayerDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const {
    prayerRequests,
    getPrayerLogs,
    logPrayer,
    markAsAnswered,
    deletePrayerRequest,
  } = usePrayer();
  const { theme } = useTheme();

  const prayer = useMemo(
    () => prayerRequests.find(p => p.id === id),
    [prayerRequests, id]
  );

  const logs = useMemo(
    () => getPrayerLogs(id as string),
    [id, getPrayerLogs]
  );

  if (!prayer) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={[styles.errorText, { color: theme.text }]}>Prayer not found</Text>
      </View>
    );
  }

  const category = PRAYER_CATEGORIES.find(c => c.name === prayer.category);
  const totalPrayed = logs.length;
  const lastPrayed = logs.length > 0 ? new Date(logs[0].prayedAt).toLocaleDateString() : 'Never';

  const handleDelete = () => {
    Alert.alert(
      'Delete Prayer',
      'Are you sure you want to delete this prayer request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deletePrayerRequest(prayer.id);
            router.back();
          },
        },
      ]
    );
  };

  const handleMarkAnswered = async () => {
    await markAsAnswered(prayer.id);
    router.back();
  };

  const handlePray = async () => {
    await logPrayer(prayer.id);
    // Prayer logged silently - no popup needed
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen
        options={{
          title: prayer.category,
          headerStyle: {
            backgroundColor: category?.color || '#667eea',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: '700' as const,
          },
          headerBackVisible: true,
          headerLeft: () => (
            <TouchableOpacity
              style={{ paddingLeft: 16 }}
              onPress={() => router.push('/(tabs)/prayers' as any)}
            >
              <ArrowLeft color="#fff" size={24} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <LinearGradient
          colors={[category?.color || '#667eea', '#764ba2']}
          style={styles.headerCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.title}>{prayer.title}</Text>
          {prayer.description && (
            <Text style={styles.description}>{prayer.description}</Text>
          )}

          {prayer.status === 'answered' && prayer.answeredAt && (
            <View style={styles.answeredBadge}>
              <CheckCircle2 color="#10b981" size={20} fill="#10b981" />
              <Text style={styles.answeredText}>
                Answered on {new Date(prayer.answeredAt).toLocaleDateString()}
              </Text>
            </View>
          )}
        </LinearGradient>

        <View style={[styles.statsCard, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Prayer Stats</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Clock color={theme.textSecondary} size={24} />
              <Text style={[styles.statNumber, { color: theme.text }]}>{totalPrayed}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Times Prayed</Text>
            </View>
            
            <View style={styles.statItem}>
              <Calendar color={theme.textSecondary} size={24} />
              <Text style={[styles.statLabelSmall, { color: theme.textSecondary }]}>Last Prayed</Text>
              <Text style={[styles.statDate, { color: theme.text }]} numberOfLines={1} adjustsFontSizeToFit>{lastPrayed}</Text>
            </View>
            
            <View style={styles.statItem}>
              <TrendingUp color={theme.textSecondary} size={24} />
              <Text style={[styles.statNumber, { color: theme.text }]}>
                {prayer.priority.charAt(0).toUpperCase() + prayer.priority.slice(1)}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Priority</Text>
            </View>
          </View>
        </View>

        {logs.length > 0 && (
          <View style={[styles.historyCard, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Prayer History</Text>
            {logs.slice(0, 10).map((log) => (
              <View
                key={log.id}
                style={[styles.historyItem, { borderBottomColor: theme.border }]}
              >
                  <View style={styles.historyIcon}>
                    <Text style={styles.historyIconEmoji}>🙏</Text>
                  </View>
                <View style={styles.historyContent}>
                  <Text style={[styles.historyDate, { color: theme.text }]}>
                    {new Date(log.prayedAt).toLocaleDateString()}
                  </Text>
                  <Text style={[styles.historyTime, { color: theme.textSecondary }]}>
                    {new Date(log.prayedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                {log.notes && (
                  <Text style={[styles.historyNotes, { color: theme.textSecondary }]}>
                    {log.notes}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {prayer.status === 'active' && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.prayButton]}
              onPress={handlePray}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={[category?.color || '#667eea', '#764ba2']}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.prayIcon}>🙏</Text>
                <Text style={styles.buttonText}>Pray Now</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.answeredButton]}
              onPress={handleMarkAnswered}
              activeOpacity={0.9}
            >
              <CheckCircle2 color="#10b981" size={20} />
              <Text style={[styles.buttonTextSecondary, { color: '#10b981' }]}>Mark Answered</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.dangerZone}>
          <TouchableOpacity
            style={[styles.dangerButton, { borderColor: '#ef4444' }]}
            onPress={handleDelete}
            activeOpacity={0.7}
          >
            <Trash2 color="#ef4444" size={18} />
            <Text style={[styles.dangerButtonText, { color: '#ef4444' }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
  },
  headerCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: '#fff',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.95)',
    lineHeight: 24,
  },
  answeredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    padding: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: 12,
  },
  answeredText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  statsCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  statLabelSmall: {
    fontSize: 11,
    textAlign: 'center',
  },
  statDate: {
    fontSize: 13,
    fontWeight: '600' as const,
    textAlign: 'center',
  },
  historyCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  historyIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyIconEmoji: {
    fontSize: 16,
  },
  historyContent: {
    flex: 1,
  },
  historyDate: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  historyTime: {
    fontSize: 12,
    marginTop: 2,
  },
  historyNotes: {
    fontSize: 12,
    fontStyle: 'italic' as const,
  },
  actionButtons: {
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  prayButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  answeredButton: {
    borderWidth: 2,
    borderColor: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
  },
  buttonGradient: {
    paddingVertical: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  prayIcon: {
    fontSize: 20,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#fff',
  },
  buttonTextSecondary: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  dangerZone: {
    gap: 12,
    marginTop: 20,
  },
  dangerButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  dangerButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
});

