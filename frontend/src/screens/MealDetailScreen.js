/**
 * MealDetailScreen.js — Displays detailed information about a logged meal.
 */

import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  ActivityIndicator,
  Alert,
  Platform,
  TextInput,
  StatusBar as RNStatusBar,
} from 'react-native';
import { ChevronLeft, Clock, Calendar as CalendarIcon, Trash2, Edit2, Check, X, Utensils } from 'lucide-react-native';
import { formatMealTime, formatDateForDisplay } from '../utils/dateUtils';
import { getMealTypeLabel } from '../utils/mealUtils';
import MacroBars from '../components/MacroBars';
import DeconstructionCard from '../components/DeconstructionCard';
import ScreenHeader from '../components/ScreenHeader';
import { round } from '../utils/mathUtils';
import { getMealDetail, deleteMeal, updateMeal } from '../services/api';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import { useTranslation } from 'react-i18next';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const MealDetailScreen = ({ route, navigation }) => {
  const { t } = useTranslation();
  const { meal: initialMeal } = route.params || {};
  const [meal, setMeal] = useState(initialMeal);
  const [loading, setLoading] = useState(!initialMeal || !initialMeal.ingredients);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  
  // Edit state
  const [editMode, setEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedCalories, setEditedCalories] = useState('');
  const [editedProtein, setEditedProtein] = useState('');
  const [editedCarbs, setEditedCarbs] = useState('');
  const [editedFats, setEditedFats] = useState('');
  const [editedNotes, setEditedNotes] = useState('');

  useEffect(() => {
    if (meal) {
      setEditedName(meal.meal_name);
      setEditedCalories(String(round(meal.calories)));
      setEditedProtein(String(round(meal.protein_g)));
      setEditedCarbs(String(round(meal.carbs_g)));
      setEditedFats(String(round(meal.fats_g)));
      setEditedNotes(meal.ai_notes || '');
    }
  }, [meal, editMode === false]);

  useEffect(() => {
    const fetchFullDetails = async () => {
      if (!initialMeal?.id) return;
      
      try {
        const fullMeal = await getMealDetail(initialMeal.id);
        setMeal(fullMeal);
      } catch (error) {
        console.error('Failed to fetch meal details:', error);
        Alert.alert(t('auth.error_title'), t('detail.load_error'));
      } finally {
        setLoading(false);
      }
    };

    fetchFullDetails();
  }, [initialMeal?.id]);

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteMeal(meal.id);
      setDeleteModalVisible(false);
      navigation.goBack();
    } catch (error) {
      Alert.alert(t('auth.error_title'), t('detail.delete_error'));
      setIsDeleting(false);
      setDeleteModalVisible(false);
    }
  };

  if (!meal) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{t('detail.not_found')}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backLink}>{t('common.back')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const mealLabel = getMealTypeLabel(meal.meal_name, meal.logged_at);
  const timeLabel = formatMealTime(meal.logged_at);
  const dateLabel = formatDateForDisplay(meal.logged_at);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <ScreenHeader
        title={editMode ? t('detail.edit_meal') : t('detail.title')}
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Meal Info Card */}
        <View style={styles.infoSection}>
          <View style={styles.mealHeader}>
            <View style={styles.iconContainer}>
              <Utensils color="#8888AA" size={28} strokeWidth={1.8} />
            </View>
            <View style={{ flex: 1 }}>
              {editMode ? (
                <TextInput
                  style={styles.nameInput}
                  value={editedName}
                  onChangeText={setEditedName}
                  placeholder="Meal Name"
                  placeholderTextColor="#4A4A6A"
                />
              ) : (
                <Text style={styles.mealName} numberOfLines={2}>{meal.meal_name}</Text>
              )}
              <View style={styles.timeRow}>
                <Clock size={14} color="#8888AA" style={{ marginRight: 4 }} />
                <Text style={styles.timeText}>{timeLabel}</Text>
                <View style={styles.dot} />
                <CalendarIcon size={14} color="#8888AA" style={{ marginRight: 4, marginLeft: 4 }} />
                <Text style={styles.timeText}>{dateLabel}</Text>
              </View>
            </View>
          </View>

          <View style={styles.caloriesBox}>
            {editMode ? (
              <View style={styles.caloriesInputContainer}>
                <TextInput
                  style={styles.caloriesInput}
                  value={editedCalories}
                  onChangeText={setEditedCalories}
                  keyboardType="numeric"
                />
                <Text style={styles.caloriesInputLabel}>{t('detail.kcal')}</Text>
              </View>
            ) : (
              <>
                <Text style={styles.caloriesNumber}>{round(meal.calories)}</Text>
                <Text style={styles.caloriesLabel}>{t('detail.total_kcal')}</Text>
              </>
            )}
          </View>
        </View>

        {/* Macros Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('detail.macros_title')}</Text>
        </View>
        <MacroBars
          protein={editMode ? parseFloat(editedProtein) || 0 : meal.protein_g}
          carbs={editMode ? parseFloat(editedCarbs) || 0 : meal.carbs_g}
          fats={editMode ? parseFloat(editedFats) || 0 : meal.fats_g}
        />

        {editMode && (
          <View style={styles.macroInputsRow}>
            <View style={styles.macroInputItem}>
              <Text style={[styles.macroLabel, { color: '#FF4D4D' }]}>{t('detail.pro_short')}</Text>
              <TextInput
                style={styles.macroTextInput}
                value={editedProtein}
                onChangeText={setEditedProtein}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.macroInputItem}>
              <Text style={[styles.macroLabel, { color: '#4ADE80' }]}>{t('detail.car_short')}</Text>
              <TextInput
                style={styles.macroTextInput}
                value={editedCarbs}
                onChangeText={setEditedCarbs}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.macroInputItem}>
              <Text style={[styles.macroLabel, { color: '#FACC15' }]}>{t('detail.fat_short')}</Text>
              <TextInput
                style={styles.macroTextInput}
                value={editedFats}
                onChangeText={setEditedFats}
                keyboardType="numeric"
              />
            </View>
          </View>
        )}

        {/* Ingredients / Deconstruction */}
        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator color="#4A9EFF" />
            <Text style={styles.loaderText}>{t('common.loading')}</Text>
          </View>
        ) : meal.ingredients && meal.ingredients.length > 0 ? (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('detail.ingredients_title')}</Text>
            </View>
            <View style={styles.deconList}>
              {meal.ingredients.map((item, idx) => (
                <DeconstructionCard key={idx} item={item} />
              ))}
            </View>
            {/* AI Notes */}
            {(meal.ai_notes || editMode) && (
              <View style={styles.notesContainer}>
                <Text style={styles.notesTitle}>{t('detail.ai_notes')}</Text>
                {editMode ? (
                  <TextInput
                    style={styles.notesInput}
                    value={editedNotes}
                    onChangeText={setEditedNotes}
                    multiline
                    placeholder={t('detail.add_notes')}
                    placeholderTextColor="#4A4A6A"
                  />
                ) : (
                  <Text style={styles.notesBody}>{meal.ai_notes}</Text>
                )}
              </View>
            )}

        {/* Delete Button at the bottom */}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => setDeleteModalVisible(true)}
          disabled={isDeleting}
          activeOpacity={0.8}
        >
          {isDeleting ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Trash2 color="#FFFFFF" size={18} style={{ marginRight: 8 }} />
              <Text style={styles.deleteButtonText}>{t('common.delete')}</Text>
            </>
          )}
        </TouchableOpacity>
          </>
        ) : (
          <View style={styles.noIngredients}>
            <Text style={styles.noIngredientsText}>{t('detail.no_breakdown')}</Text>
          </View>
        )}


        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Custom Deletion Modal */}
      <DeleteConfirmModal
        visible={deleteModalVisible}
        onCancel={() => setDeleteModalVisible(false)}
        onDelete={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D1A',
  },
  editButton: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionIcon: {
    padding: 4,
  },
  deleteIconButton: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  infoSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: '#14142A',
    marginHorizontal: 16,
    borderRadius: 24,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#1E1E38',
    alignItems: 'center',
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 24,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#1E1E38',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  emoji: {
    fontSize: 30,
  },
  mealName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  nameInput: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#4A9EFF',
    paddingVertical: 2,
    minWidth: 150,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 13,
    color: '#8888AA',
    fontWeight: '500',
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#4A4A6A',
    marginHorizontal: 8,
  },
  caloriesBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  caloriesNumber: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  caloriesLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#555577',
    letterSpacing: 1.5,
    marginTop: -4,
  },
  caloriesInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  caloriesInput: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FFFFFF',
    borderBottomWidth: 2,
    borderBottomColor: '#4A9EFF',
    minWidth: 100,
    textAlign: 'center',
  },
  caloriesInputLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#555577',
    marginLeft: 8,
    marginBottom: 10,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  macroInputsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginTop: 16,
    paddingBottom: 8,
  },
  macroInputItem: {
    alignItems: 'center',
    width: '30%',
  },
  macroLabel: {
    fontSize: 10,
    fontWeight: '900',
    marginBottom: 4,
  },
  macroTextInput: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#4A4A6A',
    width: '80%',
    textAlign: 'center',
    paddingVertical: 5,
  },
  deconList: {
    backgroundColor: '#1A1A2E',
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2A2A3E',
  },
  notesContainer: {
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    marginHorizontal: 16,
    marginTop: 32,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.1)',
  },
  notesTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#3B82F6',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  notesBody: {
    fontSize: 14,
    color: '#8888AA',
    lineHeight: 22,
  },
  notesInput: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#0D0D1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 18,
    marginBottom: 10,
  },
  backLink: {
    color: '#4A9EFF',
    fontSize: 16,
  },
  loaderContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderText: {
    color: '#8888AA',
    fontSize: 13,
    marginTop: 8,
  },
  noIngredients: {
    padding: 24,
    alignItems: 'center',
  },
  noIngredientsText: {
    color: '#555577',
    fontSize: 14,
    fontStyle: 'italic',
  },
  deleteButton: {
    flexDirection: 'row',
    backgroundColor: '#FF4D4D',
    marginHorizontal: 24,
    marginTop: 40,
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF4D4D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});

export default MealDetailScreen;
