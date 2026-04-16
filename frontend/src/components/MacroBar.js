/**
 * MacroBar.js — Animated macro progress bar (Reanimated v3).
 *
 * Smoothly animates the bar width from 0 → value on mount/data change.
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';

import COLORS from '../theme/colors';

// Each macro bar assumes a rough daily max of 250g for scale.
// Protein ~50g, Carbs ~300g, Fats ~80g typical — we use 300 as the ceiling.
const MACRO_MAX_G = 300;

const MacroBar = ({ label, value, color }) => {
  const animatedWidth = useSharedValue(0);

  useEffect(() => {
    animatedWidth.value = 0;
    animatedWidth.value = withTiming(
      Math.min((value / MACRO_MAX_G) * 100, 100),
      { duration: 700, easing: Easing.out(Easing.quad) }
    );
  }, [value]);

  const animatedFillStyle = useAnimatedStyle(() => ({
    width: `${animatedWidth.value}%`,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <View style={[styles.dot, { backgroundColor: color }]} />
        <Text style={styles.label}>{label}</Text>
      </View>
      <View style={styles.barBg}>
        <Animated.View style={[styles.barFill, { backgroundColor: color }, animatedFillStyle]} />
      </View>
      <Text style={styles.value}>{Math.round(value)}g</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
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
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  barBg: {
    flex: 1,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.border,
    overflow: 'hidden',
  },
  barFill: {
    height: 7,
    borderRadius: 4,
  },
  value: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600',
    width: 40,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
});

export default MacroBar;
