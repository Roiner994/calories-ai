import { round } from './mathUtils';

/**
 * Derive a rough set of ingredient-level macro/kcal values from what the AI
 * returns.
 */
export const ingredientCalories = (item) =>
  round(item.calories ?? item.estimated_grams ?? 0);

export const MEAL_EMOJIS = {
  Breakfast: '🥞',
  Lunch: '🥗',
  Snack: '🍎',
  Dinner: '🍛',
  Default: '🍽️',
};

/**
 * Get the corresponding emoji for a meal type.
 */
export const getMealEmoji = (mealLabel) => {
  return MEAL_EMOJIS[mealLabel] || MEAL_EMOJIS.Default;
};

/**
 * Determine the meal type label based on the meal name or logged time.
 */
export const getMealTypeLabel = (mealName, loggedAt) => {
  if (mealName && mealName !== 'Unnamed Meal' && mealName !== 'Meal') return mealName;
  if (!loggedAt) return 'Meal';
  try {
    const hour = new Date(loggedAt).getHours();
    if (hour < 11) return 'Breakfast';
    if (hour < 15) return 'Lunch';
    if (hour < 18) return 'Snack';
    return 'Dinner';
  } catch {
    return 'Meal';
  }
};
