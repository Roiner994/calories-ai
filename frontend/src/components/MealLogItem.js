import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Utensils } from 'lucide-react-native';
import { formatMealTime } from '../utils/dateUtils';
import { getMealTypeLabel } from '../utils/mealUtils';
import COLORS from '../theme/colors';

const MealLogItem = ({ meal, onPress }) => {
  const mealLabel = getMealTypeLabel(meal.meal_name, meal.logged_at);
  const timeLabel = formatMealTime(meal.logged_at);

  return (
    <TouchableOpacity
      style={styles.mealLogItem}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${mealLabel}, ${Math.round(meal.calories)} calories`}
    >
      <View style={styles.mealLogLeft}>
        <View style={styles.mealLogIcon}>
          <Utensils color={COLORS.textSecondary} size={20} strokeWidth={1.8} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.mealLogName} numberOfLines={1} ellipsizeMode="tail">
            {mealLabel}
          </Text>
          <Text style={styles.mealLogTime} numberOfLines={1} ellipsizeMode="tail">
            {timeLabel || '—'}
          </Text>
        </View>
      </View>
      <View style={styles.mealLogRight}>
        <Text style={styles.mealLogCalories}>{Math.round(meal.calories)}</Text>
        <Text style={styles.mealLogCalUnit}>kcal</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  mealLogItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  mealLogLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  mealLogIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealLogName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  mealLogTime: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  mealLogRight: {
    alignItems: 'flex-end',
  },
  mealLogCalories: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    fontVariant: ['tabular-nums'],
  },
  mealLogCalUnit: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
});

export default MealLogItem;
