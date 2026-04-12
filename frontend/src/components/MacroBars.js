import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { round } from '../utils/mathUtils';

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
            { flex: protein / total, backgroundColor: '#3B82F6' },
          ]}
        />
        <View
          style={[
            styles.barSegment,
            { flex: carbs / total, backgroundColor: '#F59E0B' },
          ]}
        />
        <View
          style={[
            styles.barSegment,
            { flex: fats / total, backgroundColor: '#A855F7' },
          ]}
        />
      </View>
      {/* Legend */}
      <View style={styles.barLegend}>
        <MacroLegendItem color="#3B82F6" value={protein} label="Protein" />
        <MacroLegendItem color="#F59E0B" value={carbs} label="Carbs" />
        <MacroLegendItem color="#A855F7" value={fats} label="Fats" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
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
});

export default MacroBars;
