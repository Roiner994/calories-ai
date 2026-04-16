/**
 * CalorieProgressRing.js — Animated SVG progress ring (Reanimated v3).
 *
 * Animates the ring arc on mount/value change entirely on the UI thread.
 * A JS-side counter animates the displayed calorie number.
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { 
  useSharedValue, 
  withTiming, 
  useAnimatedProps, 
  Easing 
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import COLORS from '../theme/colors';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const CalorieProgressRing = ({
  consumed = 0,
  goal = 2000,
  size = 200,
  strokeWidth = 14,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const rawProgress = consumed / goal;
  const progress = Math.min(rawProgress, 1);

  // Animated value for the stroke offset (UI thread)
  const animatedProgress = useSharedValue(0);
  // JS-side counter for the displayed number
  const [displayedCalories, setDisplayedCalories] = useState(0);

  useEffect(() => {
    animatedProgress.value = 0;
    animatedProgress.value = withTiming(progress, {
      duration: 900,
      easing: Easing.out(Easing.exp),
    });

    // Animate the number counter on the JS side
    const steps = 40;
    const stepDuration = 900 / steps;
    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      const easedProgress = 1 - Math.pow(1 - currentStep / steps, 3);
      setDisplayedCalories(Math.round(easedProgress * consumed));
      if (currentStep >= steps) clearInterval(interval);
    }, stepDuration);

    return () => clearInterval(interval);
  }, [consumed]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - animatedProgress.value),
  }));

  const remaining = Math.max(goal - consumed, 0);
  const isOver = consumed > goal;

  // Dynamic Color Logic
  const getRingColor = () => {
    if (rawProgress < 0.33) return COLORS.safe;
    if (rawProgress < 0.66) return COLORS.warning;
    return COLORS.danger;
  };

  const ringColor = getRingColor();
  const statusLabel = isOver
    ? `${Math.round(consumed - goal)} over`
    : `${Math.round(remaining)} left`;

  return (
    <View style={styles.container}>
      <Svg width={size} height={size} style={styles.svg}>
        {/* Track circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={COLORS.border}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Animated progress arc */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={ringColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>

      {/* Center text overlay */}
      <View style={[styles.centerOverlay, { width: size, height: size }]}>
        <Text style={[styles.calorieNumber, { color: ringColor }]}>
          {displayedCalories.toLocaleString()}
        </Text>
        <Text style={styles.calorieUnit}>kcal</Text>
        <Text style={styles.statusLabel}>{statusLabel}</Text>
        <Text style={styles.goalLabel}>of {goal.toLocaleString()} goal</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    position: 'absolute',
  },
  centerOverlay: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  calorieNumber: {
    fontSize: 42,
    fontWeight: '800',
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
  },
  calorieUnit: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8888AA',
    marginTop: -4,
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#CCCCDD',
    marginTop: 6,
  },
  goalLabel: {
    fontSize: 11,
    color: '#8888AA',
    marginTop: 2,
  },
});

export default CalorieProgressRing;