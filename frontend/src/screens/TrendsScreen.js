/**
 * TrendsScreen.js — Trends dashboard with charts and statistics.
 *
 * Features:
 *   - Timeframe selector (W, M, 6M, Y)
 *   - Daily average calories display
 *   - Bar chart of calorie intake
 *   - Statistics cards: Total Logs, Goal Hit Rate, Average Macros
 *   - Streak indicator
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
  Dimensions,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Zap, User } from 'lucide-react-native';
import { getTrends, getUserSettings } from '../services/api';
import ScreenHeader from '../components/ScreenHeader';
import { useTranslation } from 'react-i18next';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TIMEFRAMES = [
  { labelKey: 'trends.weekly', days: 7 },
  { labelKey: 'trends.monthly', days: 30 },
  { labelKey: 'trends.six_months', days: 180 },
  { labelKey: 'trends.yearly', days: 365 },
];

const TrendsScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [selectedTimeframe, setSelectedTimeframe] = useState(0); // index
  const [trendsData, setTrendsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [calorieGoal, setCalorieGoal] = useState(2000);

  // ---------------------------------------------------------------------------
  // Data Fetching
  // ---------------------------------------------------------------------------

  const fetchTrends = useCallback(async () => {
    try {
      const days = TIMEFRAMES[selectedTimeframe].days;
      const [data, settings] = await Promise.all([
        getTrends(days),
        getUserSettings(),
      ]);
      setTrendsData(data);
      setCalorieGoal(settings.daily_calorie_goal || 2000);
    } catch (error) {
      console.error('Failed to fetch trends:', error);
      setTrendsData(null);
    } finally {
      setLoading(false);
    }
  }, [selectedTimeframe]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchTrends();
    }, [fetchTrends])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTrends();
    setRefreshing(false);
  };

  // ---------------------------------------------------------------------------
  // Chart helpers
  // ---------------------------------------------------------------------------

  const chartDays = trendsData?.days || [];
  const maxCalories = Math.max(...chartDays.map(d => d.total_calories), calorieGoal);
  const chartWidth = SCREEN_WIDTH - 72; // Account for padding

  // For weekly view, show day labels; for others, show shorter labels
  const getBarLabel = (dateStr, index) => {
    const date = new Date(dateStr + 'T12:00:00');
    if (TIMEFRAMES[selectedTimeframe].days <= 7) {
      return ['M', 'T', 'W', 'T', 'F', 'S', 'S'][date.getDay() === 0 ? 6 : date.getDay() - 1];
    }
    // For longer periods, show every Nth label
    if (TIMEFRAMES[selectedTimeframe].days <= 30 && index % 5 === 0) {
      return `${date.getMonth() + 1}/${date.getDate()}`;
    }
    if (TIMEFRAMES[selectedTimeframe].days <= 180 && index % 30 === 0) {
      return date.toLocaleDateString('en-US', { month: 'short' });
    }
    if (TIMEFRAMES[selectedTimeframe].days > 180 && index % 60 === 0) {
      return date.toLocaleDateString('en-US', { month: 'short' });
    }
    return '';
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

  const daysWithMeals = chartDays.filter(d => d.meal_count > 0).length;
  const goalHitDays = trendsData?.goal_hit_days || 0;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <ScreenHeader
        title={t('trends.title')}
        centerTitle={false}
        titleStyle={styles.headerTitle}
        rightElement={
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => navigation.navigate('Settings')}
            accessibilityLabel="Open settings"
            accessibilityRole="button"
          >
            <User color="#FFFFFF" size={20} />
          </TouchableOpacity>
        }
      />

      {/* Timeframe Selector */}
      <View style={styles.timeframeContainer}>
        {TIMEFRAMES.map((tf, index) => (
          <TouchableOpacity
            key={tf.labelKey}
            style={[
              styles.timeframeButton,
              selectedTimeframe === index && styles.timeframeButtonActive,
            ]}
            onPress={() => {
              setSelectedTimeframe(index);
              setLoading(true);
            }}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.timeframeLabel,
                selectedTimeframe === index && styles.timeframeLabelActive,
              ]}
            >
              {t(tf.labelKey)}
            </Text>
          </TouchableOpacity>
        ))}
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
        {/* Daily Average Card */}
        <View style={styles.avgCard}>
          <Text style={styles.avgLabel}>{t('trends.daily_avg')}</Text>
          <Text style={styles.avgValue}>
            {Math.round(trendsData?.daily_average_calories || 0).toLocaleString()}
          </Text>
          <Text style={styles.avgUnit}>kcal</Text>
        </View>

        {/* Bar Chart */}
        <View style={styles.chartContainer}>
          {chartDays.length > 0 && chartDays.length <= 14 ? (
            // Show individual bars for weekly/short views
            <View style={styles.barChart}>
              {chartDays.map((day, index) => {
                const barHeight = maxCalories > 0
                  ? (day.total_calories / maxCalories) * 140
                  : 0;
                const isOverGoal = day.total_calories > calorieGoal;
                return (
                  <View key={day.date} style={styles.barWrapper}>
                    <View style={styles.barBackground}>
                      {day.total_calories > 0 && (
                        <Text style={styles.barValue}>
                          {Math.round(day.total_calories)}
                        </Text>
                      )}
                      <View
                        style={[
                          styles.bar,
                          {
                            height: Math.max(barHeight, 4),
                            backgroundColor: isOverGoal ? '#FF6B6B' : '#4ECDC4',
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.barLabel}>
                      {getBarLabel(day.date, index)}
                    </Text>
                  </View>
                );
              })}
            </View>
          ) : chartDays.length > 0 ? (
            // For longer time ranges, show a compact chart
            <View style={styles.compactChart}>
              {chartDays.map((day, index) => {
                const barHeight = maxCalories > 0
                  ? (day.total_calories / maxCalories) * 140
                  : 0;
                const isOverGoal = day.total_calories > calorieGoal;
                return (
                  <View
                    key={day.date}
                    style={[
                      styles.compactBar,
                      {
                        height: Math.max(barHeight, 1),
                        backgroundColor: isOverGoal ? '#FF6B6B' : '#4ECDC4',
                        width: Math.max(chartWidth / chartDays.length - 1, 2),
                      },
                    ]}
                  />
                );
              })}
            </View>
          ) : (
            <Text style={styles.noDataText}>{t('trends.no_data')}</Text>
          )}
        </View>

        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>{t('trends.total_logs')}</Text>
            <Text style={styles.statValue}>{trendsData?.total_meals || 0}</Text>
            <Text style={styles.statUnit}>{t('trends.meals_unit')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>{t('trends.goal_hit')}</Text>
            <Text style={styles.statValue}>
              {goalHitDays}/{daysWithMeals}
            </Text>
            <Text style={styles.statUnit}>{t('trends.days_unit')}</Text>
          </View>
        </View>

        {/* Average Macros */}
        <View style={styles.macroAvgCard}>
          <Text style={styles.macroAvgTitle}>{t('trends.avg_macros')}</Text>
          <View style={styles.macroBarRow}>
            <View style={[styles.macroSegment, { flex: trendsData?.total_protein_g || 1, backgroundColor: '#4ECDC4' }]} />
            <View style={[styles.macroSegment, { flex: trendsData?.total_carbs_g || 1, backgroundColor: '#FFD93D' }]} />
            <View style={[styles.macroSegment, { flex: trendsData?.total_fats_g || 1, backgroundColor: '#C084FC' }]} />
          </View>
          <View style={styles.macroLegend}>
            <View style={styles.macroLegendItem}>
              <View style={[styles.macroLegendDot, { backgroundColor: '#4ECDC4' }]} />
              <Text style={styles.macroLegendLabel}>{t('today.protein')}</Text>
            </View>
            <View style={styles.macroLegendItem}>
              <View style={[styles.macroLegendDot, { backgroundColor: '#FFD93D' }]} />
              <Text style={styles.macroLegendLabel}>{t('today.carbs')}</Text>
            </View>
            <View style={styles.macroLegendItem}>
              <View style={[styles.macroLegendDot, { backgroundColor: '#C084FC' }]} />
              <Text style={styles.macroLegendLabel}>{t('today.fats')}</Text>
            </View>
          </View>
          <View style={styles.macroValues}>
            <Text style={styles.macroValueText}>
              {Math.round(trendsData?.total_protein_g || 0)}g{' '}
              <Text style={styles.macroPercent}>
                ({Math.round(((trendsData?.total_protein_g || 0) / Math.max((trendsData?.total_protein_g || 0) + (trendsData?.total_carbs_g || 0) + (trendsData?.total_fats_g || 0), 1)) * 100)}%)
              </Text>
            </Text>
            <Text style={styles.macroValueText}>
              {Math.round(trendsData?.total_carbs_g || 0)}g{' '}
              <Text style={styles.macroPercent}>
                ({Math.round(((trendsData?.total_carbs_g || 0) / Math.max((trendsData?.total_protein_g || 0) + (trendsData?.total_carbs_g || 0) + (trendsData?.total_fats_g || 0), 1)) * 100)}%)
              </Text>
            </Text>
            <Text style={styles.macroValueText}>
              {Math.round(trendsData?.total_fats_g || 0)}g{' '}
              <Text style={styles.macroPercent}>
                ({Math.round(((trendsData?.total_fats_g || 0) / Math.max((trendsData?.total_protein_g || 0) + (trendsData?.total_carbs_g || 0) + (trendsData?.total_fats_g || 0), 1)) * 100)}%)
              </Text>
            </Text>
          </View>
        </View>

        {/* Streak indicator */}
        <View style={styles.streakCard}>
          <View style={styles.streakIcon}>
            <Zap color="#4A9EFF" size={24} fill="#4A9EFF" />
          </View>
          <View style={styles.streakInfo}>
            <Text style={styles.streakText}>
              {t('trends.logged_meals_1')}{trendsData?.total_meals || 0}{t('trends.logged_meals_2')}
            </Text>
            <Text style={styles.streakSubtext}>{t('trends.keep_it_up')}</Text>
          </View>
        </View>

        {/* Spacer for bottom tab */}
        <View style={{ height: 100 }} />
      </ScrollView>
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
  profileDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E1E2E',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2A2A3E',
  },
  profileDotInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2A2A3E',
  },

  // Timeframe
  timeframeContainer: {
    flexDirection: 'row',
    marginHorizontal: 24,
    backgroundColor: '#14142A',
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
  },
  timeframeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  timeframeButtonActive: {
    backgroundColor: '#4A9EFF18',
    borderColor: '#4A9EFF40',
  },
  timeframeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8888AA',
  },
  timeframeLabelActive: {
    color: '#4A9EFF',
    fontWeight: '700',
  },


  // Scroll
  scrollContent: {
    paddingHorizontal: 24,
  },

  // Average card
  avgCard: {
    backgroundColor: '#14142A',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#1E1E38',
  },
  avgLabel: {
    fontSize: 14,
    color: '#8888AA',
    fontWeight: '500',
    marginBottom: 6,
  },
  avgValue: {
    fontSize: 42,
    fontWeight: '900',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
  },
  avgUnit: {
    fontSize: 16,
    color: '#8888AA',
    fontWeight: '500',
    marginTop: 2,
  },

  // Chart
  chartContainer: {
    backgroundColor: '#14142A',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    minHeight: 200,
    justifyContent: 'flex-end',
    borderWidth: 1,
    borderColor: '#1E1E38',
  },
  barChart: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 160,
  },
  barWrapper: {
    alignItems: 'center',
    flex: 1,
  },
  barBackground: {
    height: 140,
    justifyContent: 'flex-end',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 4,
  },
  bar: {
    width: '70%',
    borderRadius: 6,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 11,
    color: '#8888AA',
    marginTop: 8,
    fontWeight: '500',
  },
  barValue: {
    fontSize: 10,
    fontWeight: '700',
    color: '#CCCCDD',
    marginBottom: 4,
  },
  compactChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 140,
    gap: 1,
  },
  compactBar: {
    borderRadius: 2,
    minHeight: 1,
  },
  noDataText: {
    color: '#8888AA',
    textAlign: 'center',
    fontSize: 14,
    paddingVertical: 40,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#14142A',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1E1E38',
  },
  statLabel: {
    fontSize: 13,
    color: '#8888AA',
    fontWeight: '500',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
  },
  statUnit: {
    fontSize: 13,
    color: '#8888AA',
    fontWeight: '500',
    marginTop: 2,
  },

  // Macro averages
  macroAvgCard: {
    backgroundColor: '#14142A',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#1E1E38',
  },
  macroAvgTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 14,
  },
  macroBarRow: {
    flexDirection: 'row',
    height: 14,
    borderRadius: 7,
    overflow: 'hidden',
    marginBottom: 14,
  },
  macroSegment: {
    height: 14,
  },
  macroLegend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  macroLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  macroLegendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  macroLegendLabel: {
    fontSize: 12,
    color: '#8888AA',
    fontWeight: '500',
  },
  macroValues: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroValueText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#CCCCDD',
  },
  macroPercent: {
    fontSize: 12,
    color: '#8888AA',
    fontWeight: '500',
  },

  // Streak
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#14142A',
    borderRadius: 18,
    padding: 18,
    gap: 14,
    borderWidth: 1,
    borderColor: '#1E1E38',
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E1E2E',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2A2A3E',
  },
  streakIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#4A9EFF15',
    alignItems: 'center',
    justifyContent: 'center',
  },

  streakInfo: {
    flex: 1,
  },
  streakText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#CCCCDD',
    lineHeight: 20,
  },
  streakSubtext: {
    fontSize: 13,
    color: '#8888AA',
    marginTop: 2,
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

export default TrendsScreen;
