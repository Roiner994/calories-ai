/**
 * TodayScreen.js — Main dashboard for VisionMacro.
 *
 * Features:
 *   - Horizontal calendar strip (week view) with prev/next week navigation
 *   - Calorie progress ring with animated fill
 *   - Macro progress bars (Protein, Carbs, Fats) with animation
 *   - Today's meal log with edit capability
 *   - Pull-to-refresh
 *   - Native date picker for quick date navigation
 *   - Empty state with CTA to log a meal (via ModalContext)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  User,
  Calendar as CalendarIcon,
  Leaf,
  ChevronLeft,
  ChevronRight,
  Plus,
} from 'lucide-react-native';
import CalorieProgressRing from '../components/CalorieProgressRing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDailySummary, getUserSettings } from '../services/api';
import MacroBar from '../components/MacroBar';
import MealLogItem from '../components/MealLogItem';
import { isToday, isSameDay, formatDateForAPI } from '../utils/dateUtils';
import ScreenHeader from '../components/ScreenHeader';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';
import { useDate } from '../context/DateContext';
import { useModal } from '../context/ModalContext';

import COLORS from '../theme/colors';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ---------------------------------------------------------------------------
// Helper: get Monday of the week containing `date`
// ---------------------------------------------------------------------------
const getMondayOf = (date) => {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const TodayScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { selectedDate, setSelectedDate } = useDate();
  const { openLogMeal } = useModal();

  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [calorieGoal, setCalorieGoal] = useState(2000);
  const [weekDates, setWeekDates] = useState([]);
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week
  const [showDatePicker, setShowDatePicker] = useState(false);

  // ---------------------------------------------------------------------------
  // Generate week dates from weekOffset relative to today's week
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const baseMonday = getMondayOf(new Date());
    baseMonday.setDate(baseMonday.getDate() + weekOffset * 7);
    const dates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(baseMonday);
      d.setDate(baseMonday.getDate() + i);
      return d;
    });
    setWeekDates(dates);
  }, [weekOffset]);

  // When weekOffset changes and the selectedDate is not in the visible week,
  // auto-select Monday of the new week
  useEffect(() => {
    if (weekDates.length === 0) return;
    const inWeek = weekDates.some(d => isSameDay(d, selectedDate));
    if (!inWeek) {
      setSelectedDate(new Date(weekDates[0]));
    }
  }, [weekDates]);

  const onDateChange = (event, date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
      // Jump weekOffset so the calendar shows the week of the picked date
      const baseMonday = getMondayOf(new Date());
      const pickedMonday = getMondayOf(date);
      const diffDays = Math.round((pickedMonday - baseMonday) / (7 * 24 * 60 * 60 * 1000));
      setWeekOffset(diffDays);
      setLoading(true);
    }
  };

  // ---------------------------------------------------------------------------
  // Data Fetching
  // ---------------------------------------------------------------------------

  const fetchData = useCallback(async () => {
    try {
      const localGoal = await AsyncStorage.getItem('user_calorie_goal');
      if (localGoal) {
        setCalorieGoal(parseFloat(localGoal));
      }

      const summaryData = await getDailySummary(formatDateForAPI(selectedDate));
      setSummary(summaryData);

      try {
        const settingsData = await getUserSettings();
        if (settingsData.daily_calorie_goal && !localGoal) {
          setCalorieGoal(settingsData.daily_calorie_goal);
          await AsyncStorage.setItem('user_calorie_goal', String(settingsData.daily_calorie_goal));
        }
      } catch (e) {
        console.log('Backend settings not found or table missing. Using local goal.');
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setSummary({
        total_calories: 0,
        total_protein_g: 0,
        total_carbs_g: 0,
        total_fats_g: 0,
        meal_count: 0,
        meals: [],
      });
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  const totalCalories = summary?.total_calories || 0;
  const totalProtein = summary?.total_protein_g || 0;
  const totalCarbs = summary?.total_carbs_g || 0;
  const totalFats = summary?.total_fats_g || 0;
  const meals = summary?.meals || [];

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <ScreenHeader
        title={
          isToday(selectedDate)
            ? t('today.title')
            : selectedDate.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })
        }
        centerTitle={false}
        titleStyle={[styles.headerTitle, !isToday(selectedDate) && styles.headerTitleSub]}
        rightElement={
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.headerIconButton}
              onPress={() => setShowDatePicker(true)}
              accessibilityLabel="Select date"
              accessibilityRole="button"
            >
              <CalendarIcon color={COLORS.text} size={20} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerIconButton}
              onPress={() => navigation.navigate('Settings')}
              accessibilityLabel="Open settings"
              accessibilityRole="button"
            >
              <User color={COLORS.text} size={20} />
            </TouchableOpacity>
          </View>
        }
      />

      {/* Calendar Strip with week navigation */}
      <View style={styles.calendarRow}>
        <TouchableOpacity
          onPress={() => setWeekOffset(prev => prev - 1)}
          style={styles.weekNavButton}
          accessibilityLabel="Previous week"
          accessibilityRole="button"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ChevronLeft color={COLORS.textMuted} size={20} />
        </TouchableOpacity>

        <View style={styles.calendarStrip}>
          {weekDates.map((d, index) => {
            const isSelected = isSameDay(d, selectedDate);
            const dayLabel = DAYS_OF_WEEK[d.getDay()].slice(0, 3);
            return (
              <TouchableOpacity
                key={index}
                style={[styles.calendarDay, isSelected && styles.calendarDaySelected]}
                onPress={() => {
                  setSelectedDate(d);
                  setLoading(true);
                }}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`${dayLabel} ${d.getDate()}${isSelected ? ', selected' : ''}`}
              >
                <Text style={[styles.calendarDayLabel, isSelected && styles.calendarDayLabelSelected]}>
                  {dayLabel}
                </Text>
                <Text style={[styles.calendarDayNumber, isSelected && styles.calendarDayNumberSelected]}>
                  {d.getDate()}
                </Text>
                {isToday(d) && <View style={styles.todayDot} />}
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          onPress={() => setWeekOffset(prev => prev + 1)}
          style={styles.weekNavButton}
          accessibilityLabel="Next week"
          accessibilityRole="button"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ChevronRight color={COLORS.textMuted} size={20} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        {/* Progress Ring */}
        <View style={styles.ringSection}>
          <CalorieProgressRing
            consumed={totalCalories}
            goal={calorieGoal}
            size={200}
            strokeWidth={14}
          />
          {/* Macro bars below ring */}
          <View style={styles.macroBarContainer}>
            <MacroBar label={t('today.protein')} value={totalProtein} color={COLORS.protein} />
            <MacroBar label={t('today.carbs')} value={totalCarbs} color={COLORS.carbs} />
            <MacroBar label={t('today.fats')} value={totalFats} color={COLORS.fats} />
          </View>
        </View>

        {/* Today's Log header */}
        <View style={styles.logHeader}>
          <Text style={styles.logTitle}>
            {isToday(selectedDate) ? t('today.log_today') : t('today.log_other')}
          </Text>
        </View>

        {meals.length > 0 ? (
          meals.map((meal, index) => (
            <MealLogItem
              key={meal.id || index}
              meal={meal}
              onPress={() => navigation.navigate('MealDetail', { meal })}
            />
          ))
        ) : (
          <View style={styles.emptyLog}>
            <View style={styles.emptyLogIcon}>
              <Leaf color={COLORS.fats} size={32} strokeWidth={1.5} />
            </View>
            <Text style={styles.emptyLogText}>{t('today.no_meals')}</Text>
            <Text style={styles.emptyLogSubtext}>
              {isToday(selectedDate) ? t('today.tap_to_add') : t('today.no_logs_day')}
            </Text>
            {isToday(selectedDate) && (
              <TouchableOpacity
                style={styles.emptyLogCta}
                onPress={openLogMeal}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Log your first meal"
              >
                <Plus color={COLORS.primary} size={16} strokeWidth={2.5} />
                <Text style={styles.emptyLogCtaText}>Log your first meal</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Spacer for bottom tab */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={onDateChange}
          themeVariant="dark"
        />
      )}
    </View>
  );
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
  },
  headerTitleSub: {
    fontSize: 20,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  // Calendar row with week nav arrows
  calendarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 10,
    marginBottom: 4,
  },
  weekNavButton: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  calendarStrip: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  calendarDay: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 14,
    minWidth: 36,
  },
  calendarDaySelected: {
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  calendarDayLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  calendarDayLabelSelected: {
    color: COLORS.primary,
  },
  calendarDayNumber: {
    fontSize: 17,
    fontWeight: '700',
    color: '#CCCCDD',
  },
  calendarDayNumberSelected: {
    color: COLORS.text,
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
    marginTop: 3,
  },

  // Scroll content
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },

  // Ring section
  ringSection: {
    alignItems: 'center',
    marginBottom: 28,
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    paddingVertical: 28,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  macroBarContainer: {
    width: '100%',
    marginTop: 24,
  },

  // Log section
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  logTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },

  // Empty state
  emptyLog: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyLogIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: COLORS.fats + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyLogText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#CCCCDD',
    marginBottom: 6,
  },
  emptyLogSubtext: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyLogCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.primary + '40',
    backgroundColor: COLORS.primary + '10',
  },
  emptyLogCtaText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginTop: 12,
  },
});

export default TodayScreen;