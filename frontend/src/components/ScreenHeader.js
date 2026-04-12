import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';

const ScreenHeader = ({ 
  title, 
  titleElement,
  onBack, 
  rightElement, 
  leftElement,
  centerTitle = true,
  titleStyle,
}) => {
  // Safe area handling for Android
  const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight : 0;
  
  const paddingTop = Platform.OS === 'android' ? statusBarHeight + 12 : 12;

  const renderLeft = () => {
    if (leftElement) return leftElement;
    if (onBack) {
      return (
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ChevronLeft color="#FFFFFF" size={28} />
        </TouchableOpacity>
      );
    }
    return null;
  };

  return (
    <View style={[styles.container, { paddingTop }]}>
      <View style={styles.actionContainer}>
        {renderLeft()}
      </View>
      
      <View style={[styles.titleContainer, !centerTitle && styles.leftAlignedTitle]}>
        {titleElement ? (
          titleElement
        ) : (
          <Text style={[styles.title, titleStyle]} numberOfLines={1}>
            {title}
          </Text>
        )}
      </View>
      
      <View style={[styles.actionContainer, styles.rightAction]}>
        {rightElement || null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#0D0D1A',
  },
  actionContainer: {
    width: 60,
    justifyContent: 'center',
  },
  rightAction: {
    alignItems: 'flex-end',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftAlignedTitle: {
    alignItems: 'flex-start',
    marginLeft: -20, // Adjust to balance the space if needed
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  backButton: {
    marginLeft: -4,
  },
  placeholder: {
    width: 28,
  },
});

export default ScreenHeader;
