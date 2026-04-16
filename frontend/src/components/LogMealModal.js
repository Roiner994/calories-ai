/**
 * LogMealModal.js — Premium bottom sheet modal for adding meals.
 *
 * Mimics the "Log a Meal" design from the mockup:
 *   - Large primary card: "AI Food Scan" (opens camera)
 *   - Two secondary cards: "Photo Gallery" and "Manual Entry"
 *   - "Cancel" button at the bottom
 *   - Dark glassmorphism aesthetic with gradient accents
 *   - Haptic feedback on card press
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  Pressable,
} from 'react-native';
import { Scan, Image as ImageIcon, PenLine } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const LogMealModal = ({ visible, onClose, onScanMeal, onGallery, onManualEntry }) => {
  const { t } = useTranslation();

  const handleScan = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onClose();
    setTimeout(() => onScanMeal(), 500);
  };

  const handleGallery = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
    setTimeout(() => onGallery(), 500);
  };

  const handleManual = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
    setTimeout(() => onManualEntry(), 500);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={styles.backdropOverlay} />
      </Pressable>

      {/* Sheet Content */}
      <View style={styles.sheetContainer}>
        {/* Grabber */}
        <View style={styles.grabber} />

        {/* Header */}
        <Text style={styles.title}>{t('modal.log_meal')}</Text>
        <Text style={styles.subtitle}>{t('modal.choose_method')}</Text>

        {/* Primary: AI Food Scan */}
        <TouchableOpacity
          style={styles.primaryCard}
          onPress={handleScan}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Scan meal with AI"
        >
          <View style={styles.primaryIconContainer}>
            <Scan color="#3E63DD" size={32} strokeWidth={2} />
          </View>
          <Text style={styles.primaryCardTitle}>{t('modal.ai_scan')}</Text>
          <Text style={styles.primaryCardSubtitle}>{t('modal.ai_scan_sub')}</Text>
        </TouchableOpacity>

        {/* Secondary row: Gallery + Manual */}
        <View style={styles.secondaryRow}>
          {/* Photo Gallery */}
          <TouchableOpacity
            style={styles.secondaryCard}
            onPress={handleGallery}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Choose from photo gallery"
          >
            <View style={[styles.secondaryIconContainer, { backgroundColor: '#3E63DD15' }]}>
              <ImageIcon color="#3E63DD" size={22} strokeWidth={2} />
            </View>
            <Text style={styles.secondaryCardTitle}>{t('modal.gallery')}</Text>
            <Text style={styles.secondaryCardSubtitle}>{t('modal.gallery_sub')}</Text>
          </TouchableOpacity>

          {/* Manual Entry */}
          <TouchableOpacity
            style={styles.secondaryCard}
            onPress={handleManual}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Enter meal manually"
          >
            <View style={[styles.secondaryIconContainer, { backgroundColor: '#F59E0B15' }]}>
              <PenLine color="#F59E0B" size={22} strokeWidth={2} />
            </View>
            <Text style={styles.secondaryCardTitle}>{t('modal.manual')}</Text>
            <Text style={styles.secondaryCardSubtitle}>{t('modal.manual_sub')}</Text>
          </TouchableOpacity>
        </View>

        {/* Cancel Button */}
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onClose}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Cancel"
        >
          <Text style={styles.cancelText}>{t('common.cancel')}</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

// ---------------------------------------------------------------------------
// Styles — Premium dark sheet
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdropOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },

  sheetContainer: {
    backgroundColor: '#16162A',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 20,
  },

  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#1E1E38',
    marginBottom: 20,
  },

  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#8888AA',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },

  // Primary card — AI Scan
  primaryCard: {
    backgroundColor: '#1E1E38',
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#3E63DD30',
    shadowColor: '#3E63DD',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  primaryIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#3E63DD15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  primaryCardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  primaryCardSubtitle: {
    fontSize: 13,
    color: '#8888AA',
    textAlign: 'center',
    lineHeight: 18,
  },

  // Secondary row
  secondaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  secondaryCard: {
    flex: 1,
    backgroundColor: '#22223A',
    borderRadius: 18,
    paddingVertical: 20,
    paddingHorizontal: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E1E38',
  },
  secondaryIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  secondaryCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  secondaryCardSubtitle: {
    fontSize: 11,
    color: '#8888AA',
    textAlign: 'center',
    lineHeight: 15,
  },

  // Cancel
  cancelButton: {
    backgroundColor: '#1E1E38',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#CCCCDD',
  },
});

export default LogMealModal;
