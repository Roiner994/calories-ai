/**
 * MacroCard.js — Reusable macro display card.
 *
 * A visually rich card that displays a single macro value
 * (e.g., Calories, Protein) with an icon, value, and label.
 * Used across the Results and Daily Summary screens.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * @param {Object} props
 * @param {string} props.label   - The macro name (e.g., "Calories")
 * @param {number} props.value   - The numeric value
 * @param {string} props.unit    - The unit suffix (e.g., "kcal", "g")
 * @param {string} props.color   - The accent color for this card
 * @param {string} props.icon    - Emoji icon for visual flair
 */
const MacroCard = ({ label, value, unit = 'g', color = '#6C63FF', icon = '🔥' }) => {
  return (
    <View style={[styles.card, { borderLeftColor: color }]}>
      {/* Icon */}
      <Text style={styles.icon}>{icon}</Text>

      {/* Value */}
      <Text style={[styles.value, { color }]}>
        {typeof value === 'number' ? value.toFixed(1) : value}
      </Text>

      {/* Unit + Label */}
      <Text style={styles.unit}>{unit}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E1E2E',
    borderRadius: 16,
    borderLeftWidth: 4,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
    flex: 1,
    marginHorizontal: 4,
    // Subtle shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  icon: {
    fontSize: 22,
    marginBottom: 6,
  },
  value: {
    fontSize: 22,
    fontWeight: '800',
  },
  unit: {
    fontSize: 11,
    color: '#8888AA',
    marginTop: 2,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  label: {
    fontSize: 12,
    color: '#AAAACC',
    marginTop: 4,
    fontWeight: '500',
  },
});

export default MacroCard;
