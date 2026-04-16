import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { round } from '../utils/mathUtils';
import COLORS from '../theme/colors';

const MacroLegendItem = ({ color, value, label }) => (
  <View style={styles.legendItem}>
    <View style={[styles.legendDot, { backgroundColor: color }]} />
    <Text style={styles.legendValue}>{round(value)}g</Text>
    <Text style={styles.legendLabel}> {label}</Text>
  </View>
);

const MacroBars = ({ protein, carbs, fats }) => {
  const total = (protein || 0) + (carbs || 0) + (fats || 0) || 1;
  return (
    <View style={styles.macroBarsWrapper}>
      {/* Bar track */}
      <View style={styles.barTrack}>
        <View
          style={[
            styles.barSegment,
            { flex: (protein || 0) / total, backgroundColor: COLORS.protein },
          ]}
        />
        <View
          style={[
            styles.barSegment,
            { flex: (carbs || 0) / total, backgroundColor: COLORS.carbs },
          ]}
        />
        <View
          style={[
            styles.barSegment,
            { flex: (fats || 0) / total, backgroundColor: COLORS.fats },
          ]}
        />
      </View>
      {/* Legend */}
      <View style={styles.barLegend}>
        <MacroLegendItem color={COLORS.protein} value={protein} label="Protein" />
        <MacroLegendItem color={COLORS.carbs} value={carbs} label="Carbs" />
        <MacroLegendItem color={COLORS.fats} value={fats} label="Fats" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  macroBarsWrapper: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  barTrack: {
    flexDirection: 'row',
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    backgroundColor: COLORS.border,
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
    color: COLORS.text,
  },
  legendLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
});

export default MacroBars;
