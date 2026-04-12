import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const MacroBar = ({ label, value, color }) => (
  <View style={styles.container}>
    <View style={styles.labelRow}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.label}>{label}</Text>
    </View>
    <View style={styles.barBg}>
      <View
        style={[
          styles.barFill,
          {
            backgroundColor: color,
            width: `${Math.min((value / 100) * 100, 100)}%`,
          },
        ]}
      />
    </View>
    <Text style={styles.value}>{Math.round(value)}g</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 10,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 80,
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    fontSize: 13,
    color: '#8888AA',
    fontWeight: '500',
  },
  barBg: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2A2A3E',
    overflow: 'hidden',
  },
  barFill: {
    height: 6,
    borderRadius: 3,
  },
  value: {
    fontSize: 13,
    color: '#CCCCDD',
    fontWeight: '600',
    width: 40,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
});

export default MacroBar;
