/**
 * ImagePreviewScreen.js — Custom "Previsualizer" screen.
 * 
 * Shows the full captured/selected image and allows the user to
 * confirm analysis or go back to retake the photo.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { X, RefreshCw, Sparkles, ChevronLeft } from 'lucide-react-native';
import { analyzeMeal } from '../services/api';
import ScreenHeader from '../components/ScreenHeader';
import LoadingOverlay from '../components/LoadingOverlay';
import { useTranslation } from 'react-i18next';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const ImagePreviewScreen = ({ route, navigation }) => {
  const { t } = useTranslation();
  const { imageUri } = route.params || {};
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  /**
   * Triggers the AI analysis for the previewed image.
   */
  const handleConfirm = async () => {
    if (isAnalyzing) return;
    setIsAnalyzing(true);

    try {
      const result = await analyzeMeal(imageUri);
      navigation.navigate('Result', {
        analysis: result,
        imageUri: imageUri,
      });
    } catch (error) {
      const errorMsg =
        error.response?.data?.detail || error.message || t('preview.unknown_error');
      Alert.alert(t('preview.error_title'), errorMsg);
      console.error('Analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRetake = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <ScreenHeader 
        title={t('preview.title')} 
        onBack={handleRetake}
        leftElement={
          <TouchableOpacity onPress={handleRetake} style={{ marginLeft: -4 }}>
            <X color="#FFFFFF" size={28} />
          </TouchableOpacity>
        }
      />

      <View style={styles.imageContainer}>
        {imageUri ? (
          <Image 
            source={{ uri: imageUri }} 
            style={styles.previewImage} 
            resizeMode="contain" 
          />
        ) : (
          <View style={styles.errorPlaceholder}>
            <Text style={styles.errorText}>{t('preview.no_image')}</Text>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.bottomActions}>
        <TouchableOpacity 
          style={styles.secondaryButton} 
          onPress={handleRetake}
          activeOpacity={0.8}
        >
          <RefreshCw color="#CCCCDD" size={20} style={{ marginRight: 8 }} />
          <Text style={styles.secondaryButtonText}>{t('preview.retake')}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.primaryButton} 
          onPress={handleConfirm}
          activeOpacity={0.9}
        >
          <Sparkles color="#FFFFFF" size={20} style={{ marginRight: 8 }} />
          <Text style={styles.primaryButtonText}>{t('preview.analyze')}</Text>
        </TouchableOpacity>
      </View>

      <LoadingOverlay visible={isAnalyzing} message={t('preview.analyzing')} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D1A',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
    marginVertical: 20,
    borderRadius: 24,
    marginHorizontal: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1E1E2E',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  errorPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: '#8888AA',
    fontSize: 16,
  },
  bottomActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 20,
    gap: 12,
  },
  primaryButton: {
    flex: 2,
    backgroundColor: '#3B82F6',
    borderRadius: 18,
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#1E1E2E',
    borderRadius: 18,
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2A2A3E',
  },
  secondaryButtonText: {
    color: '#CCCCDD',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ImagePreviewScreen;
