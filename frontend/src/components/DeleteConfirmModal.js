import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Trash2, AlertCircle } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

const DeleteConfirmModal = ({ visible, onCancel, onDelete, isDeleting }) => {
  const { t } = useTranslation();
  return (
  <Modal visible={visible} transparent animationType="fade">
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <View style={styles.modalIconBg}>
          <Trash2 color="#FF4D4D" size={32} strokeWidth={2.5} />
        </View>
        <Text style={styles.modalTitle}>{t('detail.delete_confirm_title')}</Text>
        <Text style={styles.modalSubtitle}>
          {t('detail.delete_confirm_msg')}
        </Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.cancelButton} 
            onPress={onCancel} 
            disabled={isDeleting}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelButtonText}>{t('detail.keep_meal')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.deleteButton} 
            onPress={onDelete} 
            disabled={isDeleting}
            activeOpacity={0.8}
          >
            {isDeleting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.deleteButtonText}>{t('common.delete_short')}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#141426',
    borderRadius: 30,
    padding: 32,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A3E',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  modalIconBg: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 77, 77, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 77, 0.2)',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 15,
    color: '#8888AA',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#1E1E2E',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A3E',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#CCCCDD',
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#FF4D4D',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#FF4D4D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  deleteButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

export default DeleteConfirmModal;
