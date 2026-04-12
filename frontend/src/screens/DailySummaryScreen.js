/**
 * DailySummaryScreen.js — Shows aggregated macros for a specific date.
 *
 * Features:
 *   - Date selector (previous/next day arrows + current date display)
 *   - Aggregated macro totals in MacroCard components
 *   - Scrollable list of individual meals logged that day
 *   - Empty state when no meals are logged
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
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import MacroCard from '../components/MacroCard';
import MealItem from '../components/MealItem';
import { getDailySummary } from '../services/api';
import ScreenHeader from '../components/ScreenHeader';
import { useTranslation } from 'react-i18next';

const DailySummaryScreen = () => {
  const { t } = useTranslation();
  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  /** Formats a Date to 'YYYY-MM-DD' for the API query. */
  const formatDateForAPI = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  /** Formats a Date to a readable string (e.g., "Tue, Apr 8"). */
  const formatDateDisplay = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  /** Check if the selected date is today. */
  const isToday = (date) => {
    const today = new Date();
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  };

  // ---------------------------------------------------------------------------
  // Data Fetching
  // ---------------------------------------------------------------------------

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    try {
      const dateStr = formatDateForAPI(selectedDate);
      const data = await getDailySummary(dateStr);
      setSummary(data);
    } catch (error) {
      console.error('Failed to fetch daily summary:', error);
      // Set an empty summary on error so the UI doesn't break
      setSummary({
        date: formatDateForAPI(selectedDate),
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

  // Re-fetch when the selected date changes
  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  /** Pull-to-refresh handler */
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSummary();
    setRefreshing(false);
  };

  // ---------------------------------------------------------------------------
  // Date Navigation
  // ---------------------------------------------------------------------------

  const goToPreviousDay = () => {
    setSelectedDate((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() - 1);
      return newDate;
    });
  };

  const goToNextDay = () => {
    // Don't allow navigating past today
    if (isToday(selectedDate)) return;

    setSelectedDate((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() + 1);
      return newDate;
    });
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <ScreenHeader
        centerTitle={true}
        leftElement={
          <TouchableOpacity onPress={goToPreviousDay} style={styles.dateArrow}>
            <Text style={styles.dateArrowText}>◀</Text>
          </TouchableOpacity>
        }
        titleElement={
          <View style={styles.dateLabelContainer}>
            <Text style={styles.dateLabel}>
              {isToday(selectedDate) ? t('common.today') : formatDateDisplay(selectedDate)}
            </Text>
            {isToday(selectedDate) && (
              <Text style={styles.dateSubLabel}>
                {formatDateDisplay(selectedDate)}
              </Text>
            )}
          </View>
        }
        rightElement={
          <TouchableOpacity
            onPress={goToNextDay}
            style={[styles.dateArrow, isToday(selectedDate) && styles.dateArrowDisabled]}
            disabled={isToday(selectedDate)}
          >
            <Text
              style={[
                styles.dateArrowText,
                isToday(selectedDate) && styles.dateArrowTextDisabled,
              ]}
            >
              ▶
            </Text>
          </TouchableOpacity>
        }
      />

      {/* Main content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6C63FF" />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#6C63FF"
            />
          }
        >
          {/* Macro Totals */}
          <Text style={styles.sectionTitle}>{t('summary.daily_totals')}</Text>
          <View style={styles.macroRow}>
            <MacroCard
              label={t('today.calories')}
              value={summary?.total_calories || 0}
              unit="kcal"
              color="#FF6B6B"
              icon="🔥"
            />
            <MacroCard
              label={t('today.protein')}
              value={summary?.total_protein_g || 0}
              unit="g"
              color="#4ECDC4"
              icon="💪"
            />
            <MacroCard
              label={t('today.carbs')}
              value={summary?.total_carbs_g || 0}
              unit="g"
              color="#FFD93D"
              icon="🌾"
            />
            <MacroCard
              label={t('today.fats')}
              value={summary?.total_fats_g || 0}
              unit="g"
              color="#C084FC"
              icon="🧈"
            />
          </View>

          {/* Meal count badge */}
          <View style={styles.mealCountBadge}>
            <Text style={styles.mealCountText}>
              {summary?.meal_count || 0}
              {summary?.meal_count === 1 ? t('summary.meal_logged') : t('summary.meals_logged')}
            </Text>
          </View>

          {/* Individual Meals List */}
          {summary?.meals?.length > 0 ? (
            <>
              <Text style={styles.sectionTitle}>{t('summary.meals')}</Text>
              {summary.meals.map((meal, index) => (
                <MealItem
                  key={meal.id || index}
                  mealName={meal.meal_name}
                  loggedAt={meal.logged_at}
                  calories={meal.calories}
                  protein={meal.protein_g}
                  carbs={meal.carbs_g}
                  fats={meal.fats_g}
                />
              ))}
            </>
          ) : (
            /* Empty state */
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🍃</Text>
              <Text style={styles.emptyTitle}>{t('summary.empty_title')}</Text>
              <Text style={styles.emptySubtitle}>
                {t('summary.empty_subtitle')}
              </Text>
            </View>
          )}
        </ScrollView>
      )}
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
  dateArrow: {
    padding: 10,
  },
  dateArrowDisabled: {
    opacity: 0.3,
  },
  dateArrowText: {
    fontSize: 18,
    color: '#6C63FF',
    fontWeight: '700',
  },
  dateArrowTextDisabled: {
    color: '#555577',
  },
  dateLabelContainer: {
    alignItems: 'center',
  },
  dateLabel: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  dateSubLabel: {
    fontSize: 13,
    color: '#8888AA',
    marginTop: 2,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#8888AA',
    marginTop: 12,
  },

  // Scroll content
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  // Sections
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 14,
    marginTop: 8,
  },

  // Macro row
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },

  // Meal count
  mealCountBadge: {
    alignSelf: 'center',
    backgroundColor: '#6C63FF22',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  mealCountText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6C63FF',
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#CCCCDD',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#8888AA',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default DailySummaryScreen;
