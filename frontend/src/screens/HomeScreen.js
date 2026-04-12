/**
 * HomeScreen.js — Main landing screen for VisionMacro.
 *
 * Features:
 *   - Large "Scan Meal" button that opens the camera
 *   - "Upload from Gallery" option via Image Picker
 *   - "Daily Summary" button to navigate to the summary screen
 *   - Dark theme with vibrant gradients and micro-animations
 */

import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { analyzeMeal } from '../services/api';

const HomeScreen = ({ navigation }) => {
  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  /**
   * Opens the device camera, captures a photo, and sends it to the backend.
   */
  const handleScanMeal = async () => {
    // Request camera permission if not already granted
    if (!cameraPermission?.granted) {
      const permResult = await requestCameraPermission();
      if (!permResult.granted) {
        Alert.alert(
          'Permission Required',
          'Camera access is needed to scan your meals.'
        );
        return;
      }
    }

    // Use ImagePicker to launch the camera (simpler than managing CameraView)
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false, 
        quality: 0.8,
      });
      if (!result.canceled && result.assets?.[0]?.uri) {
        navigation.navigate('ImagePreview', { imageUri: result.assets[0].uri });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open camera. Please try again.');
      console.error('Camera error:', error);
    }
  };

  /**
   * Opens the photo gallery for the user to select a food image.
   */
  const handleUploadFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
      });
      if (!result.canceled && result.assets?.[0]?.uri) {
        navigation.navigate('ImagePreview', { imageUri: result.assets[0].uri });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open gallery. Please try again.');
      console.error('Gallery error:', error);
    }
  };

  // ---- Image processing is now handled in ImagePreviewScreen ----

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logoEmoji}>🍽️</Text>
        <Text style={styles.title}>VisionMacro</Text>
        <Text style={styles.subtitle}>
          AI-powered nutrition at your fingertips
        </Text>
      </View>

      {/* Main action area */}
      <View style={styles.actionArea}>
        {/* Primary: Scan Meal Button */}
        <TouchableOpacity
          style={styles.scanButton}
          onPress={handleScanMeal}
          activeOpacity={0.85}
        >
          <Text style={styles.scanButtonIcon}>📸</Text>
          <Text style={styles.scanButtonText}>Scan Meal</Text>
          <Text style={styles.scanButtonHint}>
            Take a photo of your food
          </Text>
        </TouchableOpacity>

        {/* Secondary: Upload from Gallery */}
        <TouchableOpacity
          style={styles.uploadButton}
          onPress={handleUploadFromGallery}
          activeOpacity={0.85}
        >
          <Text style={styles.uploadButtonIcon}>🖼️</Text>
          <Text style={styles.uploadButtonText}>Upload from Gallery</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom: Daily Summary Link */}
      <TouchableOpacity
        style={styles.summaryButton}
        onPress={() => navigation.navigate('DailySummary')}
        activeOpacity={0.8}
      >
        <Text style={styles.summaryButtonIcon}>📊</Text>
        <Text style={styles.summaryButtonText}>View Daily Summary</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

// ---------------------------------------------------------------------------
// Styles — Dark theme with vibrant accents
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D1A',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginTop: 50,
    marginBottom: 20,
  },
  logoEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  title: {
    fontSize: 34,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 15,
    color: '#8888AA',
    marginTop: 6,
    fontWeight: '400',
  },

  // Action area (center of screen)
  actionArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Scan Meal button — large, prominent, gradient-like
  scanButton: {
    width: '100%',
    backgroundColor: '#6C63FF',
    borderRadius: 24,
    paddingVertical: 36,
    alignItems: 'center',
    marginBottom: 16,
    // Glow effect
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 10,
  },
  scanButtonIcon: {
    fontSize: 44,
    marginBottom: 8,
  },
  scanButtonText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  scanButtonHint: {
    fontSize: 13,
    color: '#FFFFFFAA',
    marginTop: 6,
  },

  // Upload from gallery — secondary style
  uploadButton: {
    width: '100%',
    backgroundColor: '#1E1E2E',
    borderRadius: 16,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2A2A3E',
  },
  uploadButtonIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#CCCCDD',
  },

  // Loading state
  loadingContainer: {
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 20,
  },
  loadingSubtext: {
    fontSize: 13,
    color: '#8888AA',
    marginTop: 6,
  },

  // Daily Summary button (bottom)
  summaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A1A2E',
    borderRadius: 14,
    paddingVertical: 16,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#2A2A3E',
  },
  summaryButtonIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  summaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6C63FF',
  },
});

export default HomeScreen;
