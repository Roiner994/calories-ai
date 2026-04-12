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
        <Text style={styles.mealName}>{mealName}</Text>
        <Text style={styles.time}>{formatTime(loggedAt)}</Text>
      </View>

      {/* Macro pills row */}
      <View style={styles.macroRow}>
        <View style={[styles.pill, { backgroundColor: '#FF6B6B22' }]}>
          <Text style={[styles.pillText, { color: '#FF6B6B' }]}>
            🔥 {calories?.toFixed(0)} kcal
          </Text>
        </View>
        <View style={[styles.pill, { backgroundColor: '#4ECDC422' }]}>
          <Text style={[styles.pillText, { color: '#4ECDC4' }]}>
            💪 {protein?.toFixed(1)}g
          </Text>
        </View>
        <View style={[styles.pill, { backgroundColor: '#FFD93D22' }]}>
          <Text style={[styles.pillText, { color: '#FFD93D' }]}>
            🌾 {carbs?.toFixed(1)}g
          </Text>
        </View>
        <View style={[styles.pill, { backgroundColor: '#C084FC22' }]}>
          <Text style={[styles.pillText, { color: '#C084FC' }]}>
            🧈 {fats?.toFixed(1)}g
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1E1E2E',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    // Subtle shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
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
