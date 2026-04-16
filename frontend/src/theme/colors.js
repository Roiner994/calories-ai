/**
 * Colors.js — Central design system tokens.
 * 
 * Palette: Modern Midnight (Option A)
 * A premium, cohesive color system with intentional accents.
 */

export const COLORS = {
  // Base
  background: '#0B0B15',
  surface: '#16162A',      // Cards, Modals
  surfaceLight: '#1E1E38', // Hover, borders
  
  // Brand
  primary: '#3E63DD',      // Electric Cobalt
  primaryLight: '#3E63DD20',
  
  // Macros
  protein: '#F43F5E',      // Rose-Coral
  carbs: '#F59E0B',        // Golden Amber
  fats: '#06B6D4',         // Cyan-Teal
  
  // Typography
  text: '#FFFFFF',
  textSecondary: '#8888AA',
  textMuted: '#555577',
  
  // Status (Progress System)
  safe: '#10B981',         // Green (0-33%)
  warning: '#F59E0B',      // Yellow/Orange (33-66%)
  danger: '#F43F5E',       // Red (> 66%)
  
  // System Status
  success: '#10B981',
  error: '#F43F5E',
  info: '#3E63DD',
  
  // UI Elements
  border: '#1E1E38',
  divider: '#2A2A3E',
  overlay: 'rgba(11, 11, 21, 0.9)',
};

export default COLORS;
