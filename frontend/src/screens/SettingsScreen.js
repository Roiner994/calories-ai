/**
 * SettingsScreen.js — User settings for configuring the daily calorie goal.
 *
 * Features:
 *   - Current goal display
 *   - Input to set a new calorie goal
 *   - Save to backend/Supabase
 */

import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserSettings, updateUserSettings } from '../services/api';
import ScreenHeader from '../components/ScreenHeader';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

const SettingsScreen = ({ navigation }) => {
  const { signOut } = useAuth();
  const { t, i18n } = useTranslation();
  const [goal, setGoal] = useState('');
  const [currentGoal, setCurrentGoal] = useState(2000);
  const [language, setLanguage] = useState('es');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      // 1. Try local storage first
      const localGoal = await AsyncStorage.getItem('user_calorie_goal');
      if (localGoal) {
        setCurrentGoal(parseFloat(localGoal));
        setGoal(String(Math.round(parseFloat(localGoal))));
      }

      const localLanguage = await AsyncStorage.getItem('user_language');
      if (localLanguage) {
        setLanguage(localLanguage);
      }

      // 2. Try to fetch from backend
      try {
        const settings = await getUserSettings();
        if (settings.daily_calorie_goal) {
          setCurrentGoal(settings.daily_calorie_goal);
          setGoal(String(Math.round(settings.daily_calorie_goal)));
          await AsyncStorage.setItem('user_calorie_goal', String(settings.daily_calorie_goal));
        }
        if (settings.language) {
          setLanguage(settings.language);
          await AsyncStorage.setItem('user_language', settings.language);
        }
      } catch (e) {
        console.log('Backend settings not found or table missing.');
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      setGoal('2000');
      setLanguage('es');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const newGoal = parseFloat(goal);
    if (!newGoal || newGoal <= 0 || newGoal > 10000) {
      Alert.alert('Invalid Goal', 'Please enter a value between 1 and 10,000 kcal.');
      return;
    }

    setSaving(true);
    try {
      // 1. Save to local storage first
      await AsyncStorage.setItem('user_calorie_goal', String(newGoal));
      await AsyncStorage.setItem('user_language', language);

      // 2. Try to sync with backend
      try {
        await updateUserSettings(newGoal, language);
        if (i18n.language !== language) {
          i18n.changeLanguage(language);
        }
      } catch (e) {
        console.log('Backend sync failed (table probably missing), but local goal saved.');
      }

      setCurrentGoal(newGoal);
      Alert.alert(t('settings.goal_updated'), t('settings.invalid_goal_msg'), [
        { text: t('common.ok'), onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Save Failed', error.message || 'Could not update settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color="#3E63DD" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <ScreenHeader 
        title={t('settings.title')} 
        onBack={() => navigation.goBack()} 
      />

      <View style={styles.content}>
        {/* Current goal */}
        <View style={styles.currentGoalCard}>
          <Text style={styles.currentLabel}>{t('settings.current_goal')}</Text>
          <Text style={styles.currentValue}>
            {Math.round(currentGoal).toLocaleString()}
          </Text>
          <Text style={styles.currentUnit}>kcal / day</Text>
        </View>

        {/* Input */}
        <Text style={styles.inputLabel}>{t('settings.set_new_goal')}</Text>
        <TextInput
          style={styles.input}
          value={goal}
          onChangeText={setGoal}
          keyboardType="numeric"
          placeholder="e.g., 2000"
          placeholderTextColor="#555577"
          selectTextOnFocus
        />

        {/* Quick presets */}
        <View style={styles.presetRow}>
          {[1500, 1800, 2000, 2200, 2500].map((preset) => (
            <TouchableOpacity
              key={preset}
              style={[
                styles.presetButton,
                parseInt(goal) === preset && styles.presetButtonActive,
              ]}
              onPress={() => setGoal(String(preset))}
            >
              <Text
                style={[
                  styles.presetText,
                  parseInt(goal) === preset && styles.presetTextActive,
                ]}
              >
                {preset}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Language Preference */}
        <Text style={styles.inputLabel}>{t('settings.language_preference')}</Text>
        <View style={styles.presetRow}>
          <TouchableOpacity
            style={[styles.presetButton, language === 'es' && styles.presetButtonActive]}
            onPress={() => setLanguage('es')}
          >
            <Text style={[styles.presetText, language === 'es' && styles.presetTextActive]}>
              Español
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.presetButton, language === 'en' && styles.presetButtonActive]}
            onPress={() => setLanguage('en')}
          >
            <Text style={[styles.presetText, language === 'en' && styles.presetTextActive]}>
              English
            </Text>
          </TouchableOpacity>
        </View>

        {/* Save */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          activeOpacity={0.85}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? t('settings.saving') : t('settings.update_goal')}
          </Text>
        </TouchableOpacity>

        {/* Sign Out */}
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={() => {
            Alert.alert(
              t('settings.sign_out'),
              'Are you sure you want to sign out?',
              [
                { text: t('common.cancel'), style: 'cancel' },
                { text: t('settings.sign_out'), style: 'destructive', onPress: signOut },
              ]
            );
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.signOutButtonText}>{t('settings.sign_out')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B15',
  },
  content: {
    padding: 24,
    paddingTop: 16,
  },

  currentGoalCard: {
    backgroundColor: '#16162A',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#1E1E38',
  },
  currentLabel: {
    fontSize: 14,
    color: '#8888AA',
    fontWeight: '500',
    marginBottom: 8,
  },
  currentValue: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
  },
  currentUnit: {
    fontSize: 16,
    color: '#8888AA',
    fontWeight: '500',
    marginTop: 4,
  },

  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#CCCCDD',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#16162A',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 20,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#1E1E38',
    marginBottom: 18,
    textAlign: 'center',
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },

  presetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    gap: 8,
  },
  presetButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#16162A',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E1E38',
  },
  presetButtonActive: {
    borderColor: '#3E63DD',
    backgroundColor: '#3E63DD15',
  },
  presetText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8888AA',
  },
  presetTextActive: {
    color: '#3E63DD',
  },

  saveButton: {
    backgroundColor: '#3E63DD',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#3E63DD',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
    shadowOpacity: 0,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: '#0B0B15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signOutButton: {
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#16162A',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F43F5E30',
  },
  signOutButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F43F5E',
  },
});

export default SettingsScreen;
