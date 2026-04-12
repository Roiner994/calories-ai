"""
nutrition_service.py — Macro aggregation from Gemini AI response.

Gemini now returns macros (calories, protein, carbs, fats) directly
for each ingredient in its JSON response, so we no longer need an
external nutrition API. This module simply aggregates the per-ingredient
data into totals.
"""

from typing import List, Dict


def calculate_total_macros(ingredients: List[Dict]) -> Dict:
    """
    Aggregates macros from the AI-identified ingredients.

    Gemini provides macros per ingredient in the 'macros' key.
    This function sums them up and returns per-ingredient details
    alongside the totals.

    Args:
        ingredients: List of dicts from Gemini, each with:
                     'name', 'estimated_grams', 'confidence', 'macros'

    Returns:
        A dict with:
          - 'per_ingredient': list of each ingredient + its macros
          - 'totals': aggregated calories, protein, carbs, fats
    """
    totals = {"calories": 0.0, "protein_g": 0.0, "carbs_g": 0.0, "fats_g": 0.0}
    per_ingredient = []

    for item in ingredients:
        name = item.get("name", "unknown")
        grams = item.get("estimated_grams", 0)

        # Read macros directly from Gemini's response
        raw_macros = item.get("macros", {})
        macros = {
            "calories": float(raw_macros.get("calories", 0)),
            "protein_g": float(raw_macros.get("protein_g", 0)),
            "carbs_g": float(raw_macros.get("carbs_g", 0)),
            "fats_g": float(raw_macros.get("fats_g", 0)),
        }

        print(f"[NutritionService] {name} ({grams}g) → {macros}")

        per_ingredient.append({
            "name": name,
            "estimated_grams": grams,
            "macros": macros,
        })

        totals["calories"] += macros["calories"]
        totals["protein_g"] += macros["protein_g"]
        totals["carbs_g"] += macros["carbs_g"]
        totals["fats_g"] += macros["fats_g"]

    # Round totals for cleaner output
    for key in totals:
        totals[key] = round(totals[key], 1)

    return {
        "per_ingredient": per_ingredient,
        "totals": totals,
    }
