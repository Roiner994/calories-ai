/**
 * LoadingOverlay.js — A premium full-screen loading indicator.
 *
 * Used when the AI is analyzing an image or any long-running process.
 * Features a blurred dark backdrop and a message.
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Modal, Dimensions, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const LoadingOverlay = ({ visible, message }) => {
  const { t } = useTranslation();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.2, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.container}>
        <View style={styles.overlay} />
        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <Animated.View style={[styles.glowCircle, { transform: [{ scale: pulseAnim }] }]} />
            <ActivityIndicator size="large" color="#FFFFFF" style={styles.spinner} />
          </View>
          <Text style={styles.message}>{message || t('preview.analyzing')}</Text>
          <Text style={styles.subtext}>{t('preview.analyzing_sub')}</Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(13, 13, 26, 0.85)',
  },
  card: {
    backgroundColor: '#1A1A2E',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '80%',
    borderWidth: 1,
    borderColor: '#2A2A3E',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  iconContainer: {
    marginBottom: 20,
  },
  message: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtext: {
    fontSize: 14,
    color: '#8888AA',
    textAlign: 'center',
  },
  glowCircle: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(74, 158, 255, 0.2)',
    borderRadius: 30,
  },
  spinner: {
    margin: 8,
  },
});

export default LoadingOverlay;
