/**
 * CalorieProgressRing.js — SVG-based circular progress ring.
 *
 * Displays consumed vs. goal calories in an animated ring.
 * Used prominently on the Today screen dashboard.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

const CalorieProgressRing = ({
  consumed = 0,
  goal = 2000,
  size = 200,
  strokeWidth = 12,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(consumed / goal, 1); // Cap at 100%
  const strokeDashoffset = circumference - (progress * circumference);
  const remaining = Math.max(goal - consumed, 0);

  // Determine ring color based on progress
  const getProgressColor = () => {
    if (progress >= 1) return '#FF6B6B'; // Over goal — red
    if (progress >= 0.85) return '#FFD93D'; // Close — amber
    return '#4ECDC4'; // Good — teal/green
  };

  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
        {/* Background ring */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#2A2A3E"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress ring */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getProgressColor()}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>

      {/* Center text overlay */}
      <View style={[styles.centerContent, { width: size, height: size }]}>
        <Text style={styles.consumedValue}>
          {Math.round(consumed).toLocaleString()}
        </Text>
        <Text style={styles.consumedUnit}>
          / {Math.round(goal).toLocaleString()} kcal
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  consumedValue: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
  },
  consumedUnit: {
    fontSize: 13,
    color: '#8888AA',
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
});

export default CalorieProgressRing;
