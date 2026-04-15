/**
 * App.js — VisionMacro entry point.
 *
 * Wraps the entire app in the navigation container
 * defined in AppNavigator.
 */

import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { DateProvider } from './src/context/DateContext';
import './src/i18n'; // Import i18n configuration

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <DateProvider>
            <AppNavigator />
          </DateProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
