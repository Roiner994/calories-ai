/**
 * MealItem.js — Individual meal entry for the Daily Summary list.
 *
 * Displays a single logged meal with its name, time, and macro breakdown
 * in a compact, dark-themed row format.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * @param {Object} props
 * @param {string} props.mealName  - Name of the meal (e.g., "Lunch")
 * @param {string} props.loggedAt  - ISO timestamp of when it was logged
 * @param {number} props.calories  - Calorie count
 * @param {number} props.protein   - Protein in grams
 * @param {number} props.carbs     - Carbs in grams
 * @param {number} props.fats      - Fats in grams
 */
const MealItem = ({ mealName, loggedAt, calories, protein, carbs, fats }) => {
  // Format the timestamp to a readable time (e.g., "2:30 PM")
  const formatTime = (isoString) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '--:--';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header: Meal name + time */}
      <View style={styles.header}>
        <Text 
          style={[styles.mealName, { flex: 1, marginRight: 8 }]} 
          numberOfLines={1} 
          ellipsizeMode="tail"
        >
          {mealName}
        </Text>
        <Text style={styles.time}>{formatTime(loggedAt)}</Text>
      </View>

      {/* Macro pills row */}
      <View style={styles.macroRow}>
        <View style={[styles.pill, { backgroundColor: '#3E63DD22' }]}>
          <Text style={[styles.pillText, { color: '#3E63DD' }]}>
            🔥 {calories?.toFixed(0)} kcal
          </Text>
        </View>
        <View style={[styles.pill, { backgroundColor: '#F43F5E22' }]}>
          <Text style={[styles.pillText, { color: '#F43F5E' }]}>
            💪 {protein?.toFixed(1)}g
          </Text>
        </View>
        <View style={[styles.pill, { backgroundColor: '#F59E0B22' }]}>
          <Text style={[styles.pillText, { color: '#F59E0B' }]}>
            🌾 {carbs?.toFixed(1)}g
          </Text>
        </View>
        <View style={[styles.pill, { backgroundColor: '#06B6D422' }]}>
          <Text style={[styles.pillText, { color: '#06B6D4' }]}>
            🧈 {fats?.toFixed(1)}g
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#16162A',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1E1E38',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  mealName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  time: {
    fontSize: 13,
    color: '#8888AA',
    fontWeight: '500',
  },
  macroRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  pill: {
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default MealItem;
