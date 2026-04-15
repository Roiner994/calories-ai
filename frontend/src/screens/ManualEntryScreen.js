/**
 * ManualEntryScreen.js — Simple form for manually logging a meal.
 *
 * Allows users to type a meal name and estimated macros without
 * needing a photo or AI analysis.
 */

import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { logMealManual } from '../services/api';
import ScreenHeader from '../components/ScreenHeader';
import { useTranslation } from 'react-i18next';
import { useDate } from '../context/DateContext';

const ManualEntryScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { selectedDate } = useDate();
  const [mealName, setMealName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fats, setFats] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!mealName.trim()) {
      Alert.alert(t('manual.missing_info'), t('manual.meal_name_empty') || 'Please enter a meal name.');
      return;
    }
    if (!calories || parseFloat(calories) <= 0) {
      Alert.alert(t('manual.missing_info'), t('manual.calories_empty') || 'Please enter estimated calories.');
      return;
    }

    setIsSaving(true);
    try {
      const result = await logMealManual({
        meal_name: mealName.trim(),
        calories: parseFloat(calories) || 0,
        protein_g: parseFloat(protein) || 0,
        carbs_g: parseFloat(carbs) || 0,
        fats_g: parseFloat(fats) || 0,
        logged_at: selectedDate.toISOString(),
      });

      if (result.success) {
        Alert.alert(t('common.success') + '! ', result.message, [
          { text: t('common.ok'), onPress: () => navigation.goBack() },
        ]);
      }
    } catch (error) {
      const errorMsg =
        error.response?.data?.detail || error.message || t('preview.unknown_error');
      Alert.alert(t('manual.save_error'), errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="light" />
      
      <ScreenHeader 
        title={t('manual.title')} 
        onBack={() => navigation.goBack()} 
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle}>
          {t('manual.subtitle')}
        </Text>

        {/* Meal Name */}
        <Text style={styles.inputLabel}>{t('manual.meal_name')}</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Chicken Salad"
          placeholderTextColor="#555577"
          value={mealName}
          onChangeText={setMealName}
          autoFocus
        />

        {/* Calories */}
        <Text style={styles.inputLabel}>{t('manual.calories')}</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., 450"
          placeholderTextColor="#555577"
          value={calories}
          onChangeText={setCalories}
          keyboardType="numeric"
        />

        {/* Optional Macros */}
        <Text style={styles.sectionLabel}>{t('manual.macros_optional')}</Text>
        <View style={styles.macroRow}>
          <View style={styles.macroInput}>
            <Text style={styles.macroLabel}>{t('manual.protein')}</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              placeholderTextColor="#555577"
              value={protein}
              onChangeText={setProtein}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.macroInput}>
            <Text style={styles.macroLabel}>{t('manual.carbs')}</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              placeholderTextColor="#555577"
              value={carbs}
              onChangeText={setCarbs}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.macroInput}>
            <Text style={styles.macroLabel}>{t('manual.fats')}</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              placeholderTextColor="#555577"
              value={fats}
              onChangeText={setFats}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSave}
          activeOpacity={0.85}
          disabled={isSaving}
        >
          <Text style={styles.saveButtonText}>
            {isSaving ? t('common.saving') : t('common.save')}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D1A',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 60,
  },

  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
    marginTop: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#8888AA',
    marginBottom: 28,
  },

  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#CCCCDD',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1E1E2E',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#2A2A3E',
    marginBottom: 18,
  },

  sectionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 14,
    marginTop: 8,
  },

  macroRow: {
    flexDirection: 'row',
    gap: 12,
  },
  macroInput: {
    flex: 1,
  },
  macroLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8888AA',
    marginBottom: 6,
  },

  saveButton: {
    backgroundColor: '#4ECDC4',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#4ECDC4',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#2A9D8F',
    shadowOpacity: 0,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

export default ManualEntryScreen;
