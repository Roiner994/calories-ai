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
            { flex: (protein || 0) / total, backgroundColor: '#4ECDC4' },
          ]}
        />
        <View
          style={[
            styles.barSegment,
            { flex: (carbs || 0) / total, backgroundColor: '#FFD93D' },
          ]}
        />
        <View
          style={[
            styles.barSegment,
            { flex: (fats || 0) / total, backgroundColor: '#C084FC' },
          ]}
        />
      </View>
      {/* Legend */}
      <View style={styles.barLegend}>
        <MacroLegendItem color="#4ECDC4" value={protein} label="Protein" />
        <MacroLegendItem color="#FFD93D" value={carbs} label="Carbs" />
        <MacroLegendItem color="#C084FC" value={fats} label="Fats" />
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
