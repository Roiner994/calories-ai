/**
 * api.js — Centralized API client for VisionMacro.
 *
 * All communication with the FastAPI backend goes through this module.
 * Uses Axios for HTTP requests with a pre-configured base URL.
 */

import axios from 'axios';
import { supabase } from './supabaseClient';

// ---------------------------------------------------------------------------
// Base URL Configuration
// ---------------------------------------------------------------------------
// For local development:
//   - iOS Simulator: use 'http://localhost:8000'
//   - Android Emulator: use 'http://10.0.2.2:8000'
//   - Physical device: use your machine's local IP (e.g., 'http://192.168.0.126:8000')
// For production: replace with your deployed backend URL.
// ---------------------------------------------------------------------------
const API_BASE_URL = 'http://192.168.1.18:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60 seconds — image analysis can take a while
  headers: {
    'Accept': 'application/json',
  },
});

// Add interceptor to inject Authorization header with Supabase JWT
apiClient.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session && session.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});


/**
 * Sends a food image to the backend for AI analysis.
 *
 * @param {string} imageUri - The local URI of the captured/selected image.
 * @returns {Promise<Object>} The analysis result with ingredients and macros.
 */
export const analyzeMeal = async (imageUri) => {
  // Build a FormData object to send the image as a multipart upload
  const formData = new FormData();
  formData.append('file', {
    uri: imageUri,
    type: 'image/jpeg',
    name: 'meal_photo.jpg',
  });

  const response = await apiClient.post('/analyze-meal', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};


/**
 * Refines a meal analysis based on natural language feedback.
 *
 * @param {Object} refineData - The refinement data.
 * @param {Array} refineData.ingredients - The current list of ingredients.
 * @param {string} refineData.feedback - The natural language feedback.
 * @returns {Promise<Object>} The updated analysis result with new ingredients and macros.
 */
export const refineMeal = async (refineData) => {
  const response = await apiClient.post('/refine-meal', refineData);
  return response.data;
};


/**
 * Saves an analyzed meal to the Supabase database via the backend.
 *
 * @param {Object} mealData - The meal data matching LogMealRequest schema.
 * @param {string} mealData.meal_name - Name for the meal (e.g., "Lunch").
 * @param {Array}  mealData.ingredients - List of identified ingredients.
 * @param {Object} mealData.totals - Aggregated macros {calories, protein_g, carbs_g, fats_g}.
 * @param {string} [mealData.ai_notes] - Optional notes from the AI.
 * @returns {Promise<Object>} Confirmation with meal_id and success flag.
 */
export const logMeal = async (mealData) => {
  const response = await apiClient.post('/log-meal', mealData);
  return response.data;
};


/**
 * Saves a manually entered meal (no AI analysis required).
 *
 * @param {Object} mealData - The manual meal data.
 * @param {string} mealData.meal_name - Name for the meal.
 * @param {number} mealData.calories - Estimated calories.
 * @param {number} [mealData.protein_g] - Protein in grams.
 * @param {number} [mealData.carbs_g] - Carbs in grams.
 * @param {number} [mealData.fats_g] - Fats in grams.
 * @returns {Promise<Object>} Confirmation with meal_id and success flag.
 */
export const logMealManual = async (mealData) => {
  const response = await apiClient.post('/log-meal-manual', mealData);
  return response.data;
};


/**
 * Fetches the daily macro summary for a specific date.
 *
 * @param {string} date - The target date in 'YYYY-MM-DD' format.
 * @returns {Promise<Object>} Aggregated daily macros + individual meals list.
 */
export const getDailySummary = async (date) => {
  const response = await apiClient.get('/daily-summary', {
    params: { date },
  });
  return response.data;
};


/**
 * Fetches the full details of a specific meal.
 *
 * @param {string} mealId - The UUID of the meal log.
 * @returns {Promise<Object>} Full meal detail with ingredients and notes.
 */
export const getMealDetail = async (mealId) => {
  const response = await apiClient.get(`/meals/${mealId}`);
  return response.data;
};


/**
 * Deletes a meal log from the database.
 *
 * @param {string} mealId - The UUID of the meal to delete.
 * @returns {Promise<Object>} { success: boolean, message: string }
 */
export const deleteMeal = async (mealId) => {
  const response = await apiClient.delete(`/meals/${mealId}`);
  return response.data;
};


/**
 * Updates an existing meal log.
 *
 * @param {string} mealId - The UUID of the meal to update.
 * @param {Object} mealData - The fields to update.
 * @returns {Promise<Object>} The updated meal detail.
 */
export const updateMeal = async (mealId, mealData) => {
  const response = await apiClient.patch(`/meals/${mealId}`, mealData);
  return response.data;
};


/**
 * Fetches the user's current settings (calorie goal).
 *
 * @returns {Promise<Object>} { daily_calorie_goal: number }
 */
export const getUserSettings = async () => {
  const response = await apiClient.get('/settings');
  return response.data;
};


/**
 * Updates the user's daily calorie goal and language preference.
 *
 * @param {number} dailyCalorieGoal - The new calorie goal.
 * @param {string} language - The new language preference.
 * @returns {Promise<Object>} Updated settings.
 */
export const updateUserSettings = async (dailyCalorieGoal, language = 'es') => {
  const response = await apiClient.post('/settings', {
    daily_calorie_goal: dailyCalorieGoal,
    language: language,
  });
  return response.data;
};


/**
 * Fetches trends data over a date range.
 *
 * @param {number} days - Number of days to look back (7, 30, 180, 365).
 * @returns {Promise<Object>} Per-day aggregates and overall stats.
 */
export const getTrends = async (days = 7) => {
  const response = await apiClient.get('/trends', {
    params: { days },
  });
  return response.data;
};

export default apiClient;
