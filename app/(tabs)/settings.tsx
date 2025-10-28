import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  TextInput,
  Alert,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Moon, Sun, ArrowLeft, Book, ChevronRight, Key } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useBibleVersion } from '@/contexts/BibleVersionContext';
import { useApiKey } from '@/contexts/ApiKeyContext';
import Constants from 'expo-constants';

export default function SettingsScreen() {
  const router = useRouter();
  const { theme, themeMode, toggleTheme } = useTheme();
  const { selectedVersion, setSelectedVersion, availableVersions} = useBibleVersion();
  const { apiKey, setApiKey } = useApiKey();
  const insets = useSafeAreaInsets();
  const [showVersionPicker, setShowVersionPicker] = React.useState(false);
  const [apiKeyInput, setApiKeyInput] = React.useState(apiKey || '');
  const [isSavingKey, setIsSavingKey] = React.useState(false);

  const handleSaveApiKey = async () => {
    setIsSavingKey(true);
    try {
      await setApiKey(apiKeyInput);
      Alert.alert('Success', 'API key saved! You can now fetch all Bible versions.');
    } catch (error) {
      Alert.alert('Error', 'Failed to save API key. Please try again.');
    } finally {
      setIsSavingKey(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={theme.gradient}
        style={styles.gradient}
        start={theme.gradientStart}
        end={theme.gradientEnd}
      >
        <View style={[styles.header, { paddingTop: 60 + insets.top }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <ArrowLeft color="#fff" size={24} />
          </TouchableOpacity>
          <Text style={styles.title}>Settings</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Bible
            </Text>

            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => setShowVersionPicker(!showVersionPicker)}
              activeOpacity={0.7}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.iconContainer, { backgroundColor: '#10b981' }]}>
                  <Book color="#fff" size={20} />
                </View>
                <View style={styles.settingTextContainer}>
                  <Text style={[styles.settingTitle, { color: theme.text }]}>
                    Bible Version
                  </Text>
                  <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
                    {selectedVersion.abbreviation}
                  </Text>
                </View>
              </View>
              <ChevronRight color={theme.textSecondary} size={20} />
            </TouchableOpacity>

            {showVersionPicker && (
              <View style={[styles.versionPicker, { borderTopColor: theme.border }]}>
                {availableVersions.map((version) => (
                  <TouchableOpacity
                    key={version.id}
                    style={[
                      styles.versionItem,
                      { borderBottomColor: theme.border },
                    ]}
                    onPress={() => {
                      setSelectedVersion(version);
                      setShowVersionPicker(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <View>
                      <Text style={[styles.versionName, { color: theme.text }]}>
                        {version.name}
                      </Text>
                      <Text style={[styles.versionAbbr, { color: theme.textSecondary }]}>
                        {version.abbreviation}
                      </Text>
                    </View>
                    {selectedVersion.id === version.id && (
                      <View style={styles.selectedIndicator} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              API.Bible Key (Optional)
            </Text>
            <Text style={[styles.sectionDescription, { color: theme.textSecondary }]}>
              All Bible versions already work! Add your own API key from scripture.api.bible for higher rate limits (optional).
            </Text>

            <View style={styles.apiKeyContainer}>
              <View style={[styles.iconContainer, { backgroundColor: '#8b5cf6' }]}>
                <Key color="#fff" size={20} />
              </View>
              <View style={styles.apiKeyInputContainer}>
                <TextInput
                  style={[styles.apiKeyInput, { 
                    color: theme.text,
                    backgroundColor: theme.background,
                    borderColor: theme.border,
                  }]}
                  value={apiKeyInput}
                  onChangeText={setApiKeyInput}
                  placeholder="Paste your API key here"
                  placeholderTextColor={theme.textSecondary}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.saveButton, { 
                backgroundColor: apiKeyInput.trim() ? '#8b5cf6' : theme.border,
                opacity: isSavingKey ? 0.6 : 1,
              }]}
              onPress={handleSaveApiKey}
              disabled={!apiKeyInput.trim() || isSavingKey}
              activeOpacity={0.7}
            >
              <Text style={styles.saveButtonText}>
                {isSavingKey ? 'Saving...' : (apiKey ? 'Update API Key' : 'Save API Key')}
              </Text>
            </TouchableOpacity>

            {apiKey && (
              <View style={[styles.statusBadge, { backgroundColor: '#10b981' + '20' }]}>
                <Text style={[styles.statusText, { color: '#10b981' }]}>
                  ✓ API Key Configured
                </Text>
              </View>
            )}
          </View>

          <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Appearance
            </Text>

            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.iconContainer, { backgroundColor: themeMode === 'dark' ? '#3b82f6' : '#fbbf24' }]}>
                  {themeMode === 'dark' ? (
                    <Moon color="#fff" size={20} />
                  ) : (
                    <Sun color="#fff" size={20} />
                  )}
                </View>
                <View style={styles.settingTextContainer}>
                  <Text style={[styles.settingTitle, { color: theme.text }]}>
                    Dark Mode
                  </Text>
                  <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
                    {themeMode === 'dark' ? 'Enabled' : 'Disabled'}
                  </Text>
                </View>
              </View>
              <Switch
                value={themeMode === 'dark'}
                onValueChange={toggleTheme}
                trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
                thumbColor="#fff"
              />
            </View>
          </View>

          <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              About
            </Text>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>
                Version
              </Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>
                {Constants.expoConfig?.version || '1.0.2'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>
                App Name
              </Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>
                HeartScript
              </Text>
            </View>
          </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  section: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  infoLabel: {
    fontSize: 15,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  versionPicker: {
    marginTop: 12,
    borderTopWidth: 1,
    paddingTop: 12,
  },
  versionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  versionName: {
    fontSize: 15,
    fontWeight: '600' as const,
    marginBottom: 2,
  },
  versionAbbr: {
    fontSize: 13,
  },
  selectedIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#10b981',
  },
  sectionDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  apiKeyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  apiKeyInputContainer: {
    flex: 1,
  },
  apiKeyInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    fontFamily: 'monospace' as const,
  },
  saveButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  statusBadge: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
});
