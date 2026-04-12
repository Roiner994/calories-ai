/**
 * ResultScreen.js — Displays the AI analysis results.
 *
 * Design matches the VisionMacro reference but adapted for DARK THEME:
 *  - Dark background (#0D0D1A), back arrow header
 *  - Food image with ingredient label overlays
 *  - Large calorie total + ESTIMATED badge
 *  - Colored macro bars (protein / carbs / fats)
 *  - "Deconstruction" section — one card per ingredient
 *  - Hidden Fats/Oils warning banner (from ai_notes)
 *  - "Log this Meal" CTA button
 */

import React, { useState, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  SafeAreaView,
  Dimensions,
  Animated,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { ChevronLeft, Plus, Sparkles, Send, Edit2, Check, X, Maximize2 } from 'lucide-react-native';
import { logMeal, refineMeal } from '../services/api';
import { round } from '../utils/mathUtils';
import SuccessModal from '../components/SuccessModal';
import MacroBars from '../components/MacroBars';
import ScreenHeader from '../components/ScreenHeader';
import DeconstructionCard from '../components/DeconstructionCard';
import LoadingOverlay from '../components/LoadingOverlay';
import { useTranslation } from 'react-i18next';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

const ResultScreen = ({ route, navigation }) => {
  const { t } = useTranslation();
  const { analysis, imageUri } = route.params || {};
  const { ingredients = [], totals = {}, ai_notes } = analysis || {};

  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Editable state
  const [mealName, setMealName] = useState(analysis?.meal_name || 'Meal');
  const [ingredientsList, setIngredientsList] = useState(ingredients);
  const [currentTotals, setCurrentTotals] = useState(totals);
  const [aiNotes, setAiNotes] = useState(ai_notes);

  const [feedbackText, setFeedbackText] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);
  const [imageAspectRatio, setImageAspectRatio] = useState(null);

  // Calculate aspect ratio for "all image" visualization
  React.useEffect(() => {
    if (imageUri) {
      Image.getSize(imageUri, (width, height) => {
        setImageAspectRatio(width / height);
      }, (error) => {
        console.error('Failed to get image size:', error);
      });
    }
  }, [imageUri]);

  // Slight scale animation on the Log button tap
  const buttonScale = useRef(new Animated.Value(1)).current;
  const animateButton = () => {
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.96,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleDeleteIngredient = (index) => {
    const newList = [...ingredientsList];
    newList.splice(index, 1);
    setIngredientsList(newList);

    // Recalculate totals
    const newTotals = newList.reduce((acc, curr) => ({
      calories: acc.calories + (curr.calories || 0),
      protein_g: acc.protein_g + (curr.protein_g || 0),
      carbs_g: acc.carbs_g + (curr.carbs_g || 0),
      fats_g: acc.fats_g + (curr.fats_g || 0),
    }), { calories: 0, protein_g: 0, carbs_g: 0, fats_g: 0 });

    setCurrentTotals(newTotals);
  };

  const handleRefine = async () => {
    if (!feedbackText.trim() || isRefining) return;
    setIsRefining(true);
    try {
      const result = await refineMeal({
        ingredients: ingredientsList,
        feedback: feedbackText,
      });
      setIngredientsList(result.ingredients);
      setCurrentTotals(result.totals);
      setAiNotes(result.ai_notes);
      if (result.meal_name) setMealName(result.meal_name);
      setFeedbackText('');
    } catch (error) {
      const errorMsg =
        error.response?.data?.detail || error.message || t('result.unknown_error');
      Alert.alert(t('result.refine_failed'), errorMsg);
    } finally {
      setIsRefining(false);
    }
  };

  const handleLogMeal = async () => {
    if (saved) return;
    animateButton();
    setIsSaving(true);
    try {
      const result = await logMeal({
        meal_name: mealName,
        ingredients: ingredientsList,
        totals: currentTotals,
        ai_notes: aiNotes,
      });
      if (result.success) {
        setSaved(true);
        setShowSuccess(true);
      }
    } catch (error) {
      const errorMsg =
        error.response?.data?.detail || error.message || t('result.unknown_error');
      Alert.alert(t('result.save_failed'), errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const goToHome = () => {
    setShowSuccess(false);
    navigation.popToTop();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <ScreenHeader 
        title={t('result.title')} 
        onBack={() => navigation.goBack()} 
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Food Image (Fixed Height with Preview) ────────────────── */}
        {imageUri && (
          <TouchableOpacity 
            style={styles.imageWrapper} 
            onPress={() => setShowFullImage(true)}
            activeOpacity={0.9}
          >
            <Image
              source={{ uri: imageUri }}
              style={styles.foodImage}
              resizeMode="cover"
            />
            <View style={styles.expandHint}>
              <Maximize2 color="#FFFFFF" size={16} />
            </View>
          </TouchableOpacity>
        )}

        {/* ── Fullscreen Image Modal ─────────────────────────── */}
        <Modal 
          visible={showFullImage} 
          transparent={false} 
          animationType="fade"
          onRequestClose={() => setShowFullImage(false)}
        >
          <View style={styles.fullImageContainer}>
            <SafeAreaView style={styles.fullImageHeader}>
              <TouchableOpacity 
                style={styles.closeFullImage} 
                onPress={() => setShowFullImage(false)}
              >
                <X color="#FFFFFF" size={28} />
              </TouchableOpacity>
            </SafeAreaView>
            <Image
              source={{ uri: imageUri }}
              style={styles.fullImage}
              resizeMode="contain"
            />
          </View>
        </Modal>

        {/* ── Total Calories ───────────────────────────────────────── */}
        <View style={styles.caloriesSection}>
          <View style={styles.caloriesTopRow}>
            <Text style={styles.totalCaloriesLabel}>{t('result.total_calories')}</Text>
            <View style={styles.estimatedBadge}>
              <Text style={styles.estimatedBadgeText}>{t('result.estimated')}</Text>
            </View>
          </View>
          <View style={styles.caloriesValueRow}>
            <Text style={styles.caloriesNumber}>
              {round(currentTotals.calories)}
            </Text>
            <Text style={styles.caloriesUnit}> kcal</Text>
          </View>
        </View>

        {/* ── Meal Name Section ───────────────────────────────────── */}
        <View style={styles.nameSection}>
          <Text style={styles.nameLabel}>{t('result.meal_name')}</Text>
          <View style={styles.nameRow}>
            {isEditingName ? (
              <TextInput
                style={[styles.nameInput, { flex: 1 }]}
                value={mealName}
                onChangeText={setMealName}
                placeholder={t('result.meal_name_placeholder')}
                placeholderTextColor="#4A4A6A"
                autoFocus
                onBlur={() => setIsEditingName(false)}
              />
            ) : (
              <Text style={styles.nameDisplay}>{mealName}</Text>
            )}
            
            <TouchableOpacity 
              style={styles.editNameBtn} 
              onPress={() => setIsEditingName(!isEditingName)}
            >
              {isEditingName ? (
                <Check color="#3B82F6" size={20} />
              ) : (
                <Edit2 color="#5AB2FF" size={18} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Macro Bars ───────────────────────────────────────────── */}
        <MacroBars
          protein={currentTotals.protein_g}
          carbs={currentTotals.carbs_g}
          fats={currentTotals.fats_g}
        />

        {/* ── Deconstruction Section ───────────────────────────────── */}
        <Text style={styles.sectionTitle}>{t('result.deconstruction')}</Text>
        <View style={styles.deconList}>
          {ingredientsList.map((item, idx) => (
            <DeconstructionCard 
              key={idx} 
              item={item} 
              onDelete={() => handleDeleteIngredient(idx)}
            />
          ))}
          {ingredientsList.length === 0 && (
            <View style={{ padding: 24, alignItems: 'center' }}>
              <Text style={{ color: '#555577', fontStyle: 'italic' }}>{t('result.no_ingredients')}</Text>
            </View>
          )}
        </View>

        {/* ── Refine with AI ───────────────────────────────────────── */}
        <View style={styles.refineSection}>
          <View style={styles.refineHeader}>
            <Sparkles color="#A855F7" size={16} />
            <Text style={styles.refineTitle}>{t('result.adjust_ai')}</Text>
          </View>
          <View style={styles.refineInputContainer}>
            <TextInput
              style={styles.refineInput}
              value={feedbackText}
              onChangeText={setFeedbackText}
              placeholder={t('result.adjust_placeholder')}
              placeholderTextColor="#4A4A6A"
              returnKeyType="send"
              onSubmitEditing={handleRefine}
              editable={!isRefining}
            />
            <TouchableOpacity 
              style={[styles.refineSendBtn, (!feedbackText.trim() || isRefining) && styles.refineSendBtnDisabled]} 
              onPress={handleRefine}
              disabled={!feedbackText.trim() || isRefining}
            >
              <Send color={(!feedbackText.trim() || isRefining) ? "#555577" : "#FFFFFF"} size={16} />
            </TouchableOpacity>
          </View>
          {isRefining && <Text style={styles.refiningText}>{t('result.refining')}</Text>}
        </View>

        {/* ── Log this Meal ────────────────────────────────────────── */}
        <Animated.View
          style={{ transform: [{ scale: buttonScale }] }}
        >
          <TouchableOpacity
            style={[styles.logButton, saved && styles.logButtonSaved]}
            onPress={handleLogMeal}
            activeOpacity={0.9}
            disabled={isSaving || saved}
          >
            <View style={styles.logButtonInner}>
              {saved ? null : (
                <Plus color="#FFFFFF" size={20} style={{ marginRight: 8 }} strokeWidth={3} />
              )}
              <Text style={styles.logButtonText}>
                {saved ? t('result.log_success') : isSaving ? t('result.log_saving') : t('result.log_meal')}
              </Text>
            </View>
          </TouchableOpacity>
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>

      </KeyboardAvoidingView>

      {/* ── Loading Overlays ──────────────────────────────────────── */}
      <LoadingOverlay 
        visible={isRefining} 
        message={t('result.refining')} 
      />

      <LoadingOverlay 
        visible={isSaving} 
        message={t('result.log_saving')} 
      />

      {/* ── Success Modal ─────────────────────────────────────────── */}
      <SuccessModal visible={showSuccess} onHome={goToHome} />
    </SafeAreaView>
  );
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D1A',
  },

  // ── Scroll content ───────────────────────────────────────────────────────
  scrollContent: {
    paddingBottom: 24,
  },

  // ── Food Image ───────────────────────────────────────────────────────────
  imageWrapper: {
    width: '100%',
    height: 280,
    backgroundColor: '#000',
    overflow: 'hidden',
    position: 'relative',
  },
  foodImage: {
    width: '100%',
    height: '100%',
  },
  expandHint: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },

  // ── Full Image Modal ─────────────────────────────────────────────────────
  fullImageContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImageHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  closeFullImage: {
    padding: 20,
    alignSelf: 'flex-end',
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },

  // ── Calories section ─────────────────────────────────────────────────────
  caloriesSection: {
    backgroundColor: '#0D0D1A',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 8,
  },
  caloriesTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  totalCaloriesLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#555577',
    letterSpacing: 1.5,
  },
  
  // ── Name section ──────────────────────────────────────────────────────────
  nameSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#0D0D1A',
  },
  nameLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#555577',
    letterSpacing: 1,
    marginBottom: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(90, 178, 255, 0.3)',
    minHeight: 44,
  },
  nameDisplay: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
    paddingVertical: 8,
  },
  nameInput: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    paddingVertical: 8,
  },
  editNameBtn: {
    padding: 8,
    marginLeft: 8,
  },
  estimatedBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  estimatedBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#3B82F6',
    letterSpacing: 1,
  },
  caloriesValueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  caloriesNumber: {
    fontSize: 62,
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: 68,
  },
  caloriesUnit: {
    fontSize: 22,
    fontWeight: '600',
    color: '#555577',
    marginBottom: 10,
    marginLeft: 6,
  },

  // ── Macro bars ───────────────────────────────────────────────────────────
  macroBarsWrapper: {
    backgroundColor: '#0D0D1A',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  barTrack: {
    flexDirection: 'row',
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    backgroundColor: '#1E1E2E',
    marginBottom: 12,
    gap: 3,
  },
  barSegment: {
    borderRadius: 2,
  },
  barLegend: {
    flexDirection: 'row',
    gap: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    marginRight: 6,
  },
  legendValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  legendLabel: {
    fontSize: 13,
    color: '#555577',
  },

  // ── Deconstruction ───────────────────────────────────────────────────────
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 12,
    backgroundColor: '#0D0D1A',
  },
  deconList: {
    backgroundColor: '#1A1A2E',
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2A2A3E',
  },
  deconCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A3E',
  },
  deconLeft: {
    flex: 1,
    paddingRight: 12,
  },
  deconName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  deconPortion: {
    fontSize: 12,
    color: '#555577',
  },
  deconRight: {
    alignItems: 'flex-end',
  },
  deconKcal: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 3,
  },
  deconMacros: {
    fontSize: 12,
    color: '#555577',
  },

  // ── Refine Section ───────────────────────────────────────────────────────
  refineSection: {
    marginHorizontal: 16,
    marginTop: 20,
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2A2A3E',
  },
  refineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  refineTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#A855F7',
  },
  refineInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D0D1A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A2A3E',
    paddingRight: 8,
  },
  refineInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  refineSendBtn: {
    backgroundColor: '#A855F7',
    padding: 8,
    borderRadius: 8,
  },
  refineSendBtnDisabled: {
    backgroundColor: '#2A2A3E',
  },
  refiningText: {
    color: '#A855F7',
    fontSize: 12,
    marginTop: 8,
    fontStyle: 'italic',
    textAlign: 'center',
  },

  // ── Warning banner ───────────────────────────────────────────────────────
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 14,
    marginHorizontal: 16,
    marginTop: 20,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  warningIcon: {
    fontSize: 18,
    marginTop: 1,
  },
  warningTextBlock: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F59E0B',
    marginBottom: 4,
  },
  warningBody: {
    fontSize: 13,
    color: 'rgba(245, 158, 11, 0.7)',
    lineHeight: 18,
  },

  // ── Log this Meal button ─────────────────────────────────────────────────
  logButton: {
    backgroundColor: '#3B82F6',
    marginHorizontal: 16,
    marginTop: 24,
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  logButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logButtonSaved: {
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
  },
  logButtonText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});

export default ResultScreen;
