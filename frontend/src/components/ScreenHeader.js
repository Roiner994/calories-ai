import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const insets = useSafeAreaInsets();
  
  // Standard header height logic: Safe area + 56px content area
  const HEADER_CONTENT_HEIGHT = 56;

  const hasLeft = !!(leftElement || onBack);
  const hasRight = !!rightElement;

  const renderLeft = () => {
    if (leftElement) return leftElement;
    if (onBack) {
      return (
        <TouchableOpacity 
          onPress={onBack} 
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ChevronLeft color="#FFFFFF" size={28} strokeWidth={2.5} />
        </TouchableOpacity>
      );
    }
    return null;
  };

  return (
    <View style={[
      styles.container, 
      { 
        height: HEADER_CONTENT_HEIGHT + insets.top,
        paddingTop: insets.top 
      }
    ]}>
      {/* Left Action */}
      <View style={[styles.actionContainer, !hasLeft && styles.hiddenContainer]}>
        {renderLeft()}
      </View>
      
      {/* Title */}
      <View style={[
        styles.titleContainer, 
        !centerTitle && styles.leftAlignedTitle,
        !hasLeft && !centerTitle && { paddingLeft: 16 }
      ]}>
        {titleElement ? (
          titleElement
        ) : (
          <Text style={[styles.title, titleStyle]} numberOfLines={1}>
            {title}
          </Text>
        )}
      </View>
      
      {/* Right Action */}
      <View style={[styles.actionContainer, !hasRight && styles.hiddenContainer]}>
        {rightElement || null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#0B0B15',
    borderBottomWidth: 1,
    borderBottomColor: '#1E1E38',
  },
  actionContainer: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  hiddenContainer: {
    width: 0,
    minWidth: 0,
    overflow: 'hidden',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  leftAlignedTitle: {
    alignItems: 'flex-start',
    paddingLeft: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  backButton: {
    padding: 4,
  },
});

export default ScreenHeader;
