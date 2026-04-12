/**
 * App.js — VisionMacro entry point.
 *
 * Wraps the entire app in the navigation container
 * defined in AppNavigator.
 */

import React from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
import './src/i18n'; // Import i18n configuration

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}
