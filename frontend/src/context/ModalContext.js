/**
 * ModalContext.js — Global context for the "Add Meal" bottom sheet modal.
 *
 * Allows any screen (e.g., TodayScreen empty state) to open the LogMealModal
 * without needing to pass callbacks through the navigator hierarchy.
 */

import React, { createContext, useContext, useState } from 'react';

const ModalContext = createContext(null);

export const ModalProvider = ({ children }) => {
  const [logMealVisible, setLogMealVisible] = useState(false);

  const openLogMeal = () => setLogMealVisible(true);
  const closeLogMeal = () => setLogMealVisible(false);

  return (
    <ModalContext.Provider value={{ logMealVisible, openLogMeal, closeLogMeal }}>
      {children}
    </ModalContext.Provider>
  );
};

export const useModal = () => {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error('useModal must be used within a ModalProvider');
  return ctx;
};
