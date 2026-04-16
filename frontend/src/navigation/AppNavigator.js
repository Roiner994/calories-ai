/**
 * AppNavigator.js — Navigation for VisionMacro with Bottom Tabs.
 *
 * Navigation structure:
 *   - Bottom Tab Navigator (Today, [+] button, Trends)
 *   - Stack screens layered on top (Result, DailySummary, Settings, ManualEntry)
 *   - Custom center button that opens the LogMealModal
 *   - ModalContext provides global access to openLogMeal for any screen
 */

import React, { useState, useRef } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Pressable } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LayoutGrid, BarChart3, Plus } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

// Screens
import TodayScreen from '../screens/TodayScreen';
import TrendsScreen from '../screens/TrendsScreen';
import ResultScreen from '../screens/ResultScreen';
import MealDetailScreen from '../screens/MealDetailScreen';
import DailySummaryScreen from '../screens/DailySummaryScreen';
import ManualEntryScreen from '../screens/ManualEntryScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ImagePreviewScreen from '../screens/ImagePreviewScreen';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';

// Components
import LogMealModal from '../components/LogMealModal';
import LoadingOverlay from '../components/LoadingOverlay';

// Context
import { ModalProvider, useModal } from '../context/ModalContext';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// ---------------------------------------------------------------------------
// Custom Center Tab Button — spring press animation
// ---------------------------------------------------------------------------
const CenterTabButton = ({ onPress }) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPressIn={() => {
        scale.value = withSpring(0.88, { damping: 14, stiffness: 200 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 12, stiffness: 180 });
      }}
      onPress={onPress}
      style={styles.centerButton}
      accessibilityRole="button"
      accessibilityLabel="Log a meal"
    >
      <Animated.View style={[styles.centerButtonInner, animatedStyle]}>
        <Plus color="#FFFFFF" size={28} strokeWidth={2.5} />
      </Animated.View>
    </Pressable>
  );
};

// ---------------------------------------------------------------------------
// Tab Navigator with custom center button
// ---------------------------------------------------------------------------
const TabNavigator = ({ navigation }) => {
  const { t } = useTranslation();
  const { logMealVisible, openLogMeal, closeLogMeal } = useModal();
  // Ref guard: prevents launching picker while it's already open on iOS
  const isPickerActive = useRef(false);

  // ---- Camera handler ----
  const handleScanMeal = async () => {
    if (isPickerActive.current) return;
    isPickerActive.current = true;

    try {
      const { status: existingStatus } = await ImagePicker.getCameraPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        Alert.alert(t('permissions.title'), t('permissions.camera'));
        isPickerActive.current = false;
        return;
      }

      // Close the modal FIRST so the iOS view controller hierarchy is clean
      closeLogMeal();

      // Delay picker launch to allow Modal to dismiss completely on iOS
      setTimeout(async () => {
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
          Alert.alert(t('permissions.error_title'), t('permissions.camera_error'));
          console.error('Camera error:', error);
        } finally {
          isPickerActive.current = false;
        }
      }, 500);
    } catch (error) {
      Alert.alert(t('permissions.error_title'), t('permissions.camera_error'));
      console.error('Permission error:', error);
      isPickerActive.current = false;
    }
  };

  // ---- Gallery handler ----
  const handleGallery = async () => {
    if (isPickerActive.current) return;
    isPickerActive.current = true;

    try {
      const { status: existingStatus } = await ImagePicker.getMediaLibraryPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        Alert.alert(t('permissions.title'), t('permissions.gallery'));
        isPickerActive.current = false;
        return;
      }

      closeLogMeal();

      setTimeout(async () => {
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
          Alert.alert(t('permissions.error_title'), t('permissions.gallery_error'));
          console.error('Gallery error:', error);
        } finally {
          isPickerActive.current = false;
        }
      }, 500);
    } catch (error) {
      Alert.alert(t('permissions.error_title'), t('permissions.gallery_error'));
      console.error('Permission error:', error);
      isPickerActive.current = false;
    }
  };

  // ---- Manual entry handler ----
  const handleManualEntry = () => {
    navigation.navigate('ManualEntry');
  };

  return (
    <>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: '#3E63DD',
          tabBarInactiveTintColor: '#555577',
          tabBarLabelStyle: styles.tabBarLabel,
          tabBarItemStyle: styles.tabBarItem,
        }}
      >
        <Tab.Screen
          name="Today"
          component={TodayScreen}
          options={{
            tabBarLabel: t('tabs.today'),
            tabBarIcon: ({ color }) => <LayoutGrid color={color} size={22} />,
          }}
        />

        {/* Placeholder screen for the center button */}
        <Tab.Screen
          name="AddMeal"
          component={View}
          options={{
            tabBarButton: () => (
              <CenterTabButton onPress={openLogMeal} />
            ),
            tabBarLabel: () => null,
          }}
        />

        <Tab.Screen
          name="Trends"
          component={TrendsScreen}
          options={{
            tabBarLabel: t('tabs.trends'),
            tabBarIcon: ({ color }) => <BarChart3 color={color} size={22} />,
          }}
        />
      </Tab.Navigator>

      {/* Log Meal Modal — controlled by ModalContext */}
      <LogMealModal
        visible={logMealVisible}
        onClose={closeLogMeal}
        onScanMeal={handleScanMeal}
        onGallery={handleGallery}
        onManualEntry={handleManualEntry}
      />
    </>
  );
};

// ---------------------------------------------------------------------------
// Auth Stack Navigator
// ---------------------------------------------------------------------------
const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Signup" component={SignupScreen} />
  </Stack.Navigator>
);

// ---------------------------------------------------------------------------
// Root Stack Navigator (wraps tabs + modals)
// ---------------------------------------------------------------------------
const AppNavigator = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0B0B15', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3E63DD" />
      </View>
    );
  }

  const screenOptions = {
    headerStyle: { backgroundColor: '#0B0B15' },
    headerTintColor: '#FFFFFF',
    headerTitleStyle: { fontWeight: 'bold' },
    headerShadowVisible: false,
  };

  return (
    <NavigationContainer>
      {/* ModalProvider wraps everything so any screen can call openLogMeal() */}
      <ModalProvider>
        <Stack.Navigator screenOptions={screenOptions}>
          {user ? (
            <>
              <Stack.Screen name="Main" component={TabNavigator} options={{ headerShown: false }} />
              <Stack.Screen name="Result" component={ResultScreen} options={{ headerShown: false }} />
              <Stack.Screen name="MealDetail" component={MealDetailScreen} options={{ headerShown: false }} />
              <Stack.Screen name="DailySummary" component={DailySummaryScreen} options={{ headerShown: false }} />
              <Stack.Screen name="ManualEntry" component={ManualEntryScreen} options={{ headerShown: false }} />
              <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />
              <Stack.Screen name="ImagePreview" component={ImagePreviewScreen} options={{ headerShown: false }} />
            </>
          ) : (
            <Stack.Screen name="Auth" component={AuthStack} options={{ headerShown: false }} />
          )}
        </Stack.Navigator>
      </ModalProvider>
    </NavigationContainer>
  );
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  // Bottom Tab Bar
  tabBar: {
    position: 'absolute',
    backgroundColor: '#16162A',
    borderTopWidth: 0,
    height: 85,
    paddingBottom: 20,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 20,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  tabBarItem: {
    paddingTop: 4,
  },

  // Center floating button
  centerButton: {
    top: -24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3E63DD',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3E63DD',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
});

export default AppNavigator;
