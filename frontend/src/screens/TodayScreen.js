/**
 * TodayScreen.js — Main dashboard for VisionMacro.
 *
 * Features:
 *   - Horizontal calendar strip (week view)
 *   - Calorie progress ring with goal tracking
 *   - Macro progress bars (Protein, Carbs, Fats)
 *   - Today's meal log with edit capability
 *   - Pull-to-refresh
 *   - Native date picker for quick date navigation
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
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Settings, User, Calendar as CalendarIcon } from 'lucide-react-native';
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

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TodayScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { selectedDate, setSelectedDate } = useDate();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [calorieGoal, setCalorieGoal] = useState(2000);
  const [weekDates, setWeekDates] = useState([]);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  // Generate week dates around selected date
  useEffect(() => {
    const dates = [];
    const tempDate = new Date(selectedDate);
    const day = tempDate.getDay();
    // Monday = 1, Sunday = 0. To get Monday:
    const diff = tempDate.getDate() - day + (day === 0 ? -6 : 1);
    const startOfWeek = new Date(tempDate.setDate(diff));

    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      dates.push(d);
    }
    setWeekDates(dates);
  }, [selectedDate]);

  const onDateChange = (event, date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
      setLoading(true);
    }
  };

  // ---------------------------------------------------------------------------
  // Data Fetching
  // ---------------------------------------------------------------------------

  const fetchData = useCallback(async () => {
    try {
      // 1. Try to load custom goal from AsyncStorage first (Works even without DB)
      const localGoal = await AsyncStorage.getItem('user_calorie_goal');
      if (localGoal) {
        setCalorieGoal(parseFloat(localGoal));
      }

      // 2. Fetch daily summary from backend
      const summaryData = await getDailySummary(formatDateForAPI(selectedDate));
      setSummary(summaryData);

      // 3. Try to sync with backend settings if possible
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

  // Refresh when screen comes into focus (e.g., after logging a meal)
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
        <ActivityIndicator size="large" color="#4A9EFF" />
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
        title={isToday(selectedDate) ? t('today.title') : selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
        centerTitle={false}
        titleStyle={[styles.headerTitle, !isToday(selectedDate) && styles.headerTitleSub]}
        rightElement={
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.headerIconButton}
              onPress={() => setShowDatePicker(true)}
            >
              <CalendarIcon color="#FFFFFF" size={20} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerIconButton}
              onPress={() => navigation.navigate('Settings')}
            >
              <User color="#FFFFFF" size={20} />
            </TouchableOpacity>
          </View>
        }
      />

      {/* Calendar Strip */}
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

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#4A9EFF"
          />
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
            <MacroBar label={t('today.protein')} value={totalProtein} color="#4ECDC4" />
            <MacroBar label={t('today.carbs')} value={totalCarbs} color="#FFD93D" />
            <MacroBar label={t('today.fats')} value={totalFats} color="#C084FC" />
          </View>
        </View>

        {/* Today's Log */}
        <View style={styles.logHeader}>
          <Text style={styles.logTitle}>{isToday(selectedDate) ? t('today.log_today') : t('today.log_other')}</Text>
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
            <Text style={styles.emptyLogEmoji}>🍃</Text>
            <Text style={styles.emptyLogText}>{t('today.no_meals')}</Text>
            <Text style={styles.emptyLogSubtext}>
              {isToday(selectedDate) ? t('today.tap_to_add') : t('today.no_logs_day')}
            </Text>
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
    backgroundColor: '#0D0D1A',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerTitleSub: {
    fontSize: 20,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E1E2E',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2A2A3E',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  // Calendar strip
  calendarStrip: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginBottom: 8,
  },
  calendarDay: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 16,
    width: (SCREEN_WIDTH - 40) / 7.5,
  },
  calendarDaySelected: {
    backgroundColor: '#1E1E2E',
    borderWidth: 1.5,
    borderColor: '#4A9EFF',
  },
  calendarDayLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8888AA',
    marginBottom: 4,
  },
  calendarDayLabelSelected: {
    color: '#4A9EFF',
  },
  calendarDayNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#CCCCDD',
  },
  calendarDayNumberSelected: {
    color: '#FFFFFF',
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#4A9EFF',
    marginTop: 4,
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
    backgroundColor: '#14142A',
    borderRadius: 24,
    paddingVertical: 28,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: '#1E1E38',
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
    color: '#FFFFFF',
  },
  editLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A9EFF',
  },

  // Meal log items
  mealLogItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#14142A',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1E1E38',
  },
  mealLogLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    gap: 12,
  },
  mealLogIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#1E1E38',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealLogEmoji: {
    fontSize: 22,
  },
  mealLogName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  mealLogTime: {
    fontSize: 12,
    color: '#8888AA',
    marginTop: 2,
  },
  mealLogRight: {
    alignItems: 'flex-end',
  },
  mealLogCalories: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
  },
  mealLogCalUnit: {
    fontSize: 11,
    color: '#8888AA',
    marginTop: 1,
  },

  // Empty state
  emptyLog: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyLogEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyLogText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#CCCCDD',
    marginBottom: 6,
  },
  emptyLogSubtext: {
    fontSize: 13,
    color: '#8888AA',
    textAlign: 'center',
  },

  // Loading
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0D0D1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 15,
    color: '#8888AA',
    marginTop: 12,
  },
});

export default TodayScreen;
