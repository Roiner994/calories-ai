"""
gemini_service.py — Google Gemini integration (new google-genai SDK).

Sends a food photo (as base64) to Gemini 2.0 Flash with a strict
prompt that forces it to return a structured JSON array of ingredients,
estimated weights, and hidden cooking fats.
"""

import json
import base64
import io

from google import genai
from google.genai import types

from core.config import get_settings


# ---------------------------------------------------------------------------
# System prompt: Instructs Gemini on exactly how to analyze the food image
# ---------------------------------------------------------------------------
ANALYSIS_PROMPT = """You are an expert nutritionist and food analyst with deep knowledge of food macronutrients.
Analyze the food image provided and perform the following:

1. Identify ALL visible ingredients and components in the meal.
2. Estimate the weight/volume of each ingredient in grams, using standard
   plate and portion proportions as reference.
3. Account for hidden cooking fats (oil, butter, sauces) that are likely
   present but not directly visible. List them as separate items.
4. Assign a confidence level to each estimate: "high", "medium", or "low".
5. For each ingredient, estimate its macronutrient content based on the
   estimated grams. Use standard nutritional databases as reference
   (e.g., USDA). Be accurate — this is used for calorie tracking.

Return your analysis as ONLY a valid JSON object with this exact structure,
no extra text, no markdown fences, no explanation:

{
  "meal_name": "A short, descriptive name for the meal (e.g. 'Avocado Toast with Poached Egg')",
  "ingredients": [
    {
      "name": "ingredient name",
      "estimated_grams": 150.0,
      "confidence": "high",
      "macros": {
        "calories": 165.0,
        "protein_g": 31.0,
        "carbs_g": 0.0,
        "fats_g": 3.6
      }
    },
    ...
  ],
  "notes": "Any brief notes about assumptions made"
}

Important rules:
- Be as specific as possible (e.g., "white rice" not just "rice").
- Use realistic gram estimates based on visual portion size.
- Always include at least one hidden fat estimate if the food appears cooked.
- Macro values must be proportional to the estimated_grams (not per 100g).
- Return ONLY the JSON object. No other text.
"""

REFINE_PROMPT = """You are an expert nutritionist and food analyst. 
You previously analyzed a meal and identified the following ingredients:
{current_ingredients}

The user has reviewed this and provided the following feedback/correction:
"{feedback}"

Your task is to:
1. Adjust the ingredients list based EXACTLY on the user's feedback (e.g., changing weights, removing items, adding items, switching items).
2. For any changed weights or new items, recalculate the macronutrients (calories, protein, carbs, fats) proportionally based on standard nutritional databases.
3. Keep the ingredients that were not mentioned in the feedback the same, unless the feedback implies they should be removed.

Return your analysis as ONLY a valid JSON object with this exact structure,
no extra text, no markdown fences, no explanation:

{{
  "meal_name": "Updated descriptive name if relevant",
  "ingredients": [
    {{
      "name": "ingredient name",
      "estimated_grams": 150.0,
      "confidence": "high",
      "macros": {{
        "calories": 165.0,
        "protein_g": 31.0,
        "carbs_g": 0.0,
        "fats_g": 3.6
      }}
    }}
  ],
  "notes": "Any brief notes about assumptions made or what was adjusted"
}}

Important rules:
- Keep the format exactly the same.
- Return ONLY the JSON object. No other text.
"""



def analyze_food_image(image_base64: str, language: str = "es") -> dict:
    """
    Sends a base64-encoded food image to Gemini for analysis.

    Args:
        image_base64: The food photo encoded as a base64 string.
        language: "es" or "en" to determine response language.

    Returns:
        A dict with 'ingredients' (list) and 'notes' (str) keys
        parsed from the AI response.
    """
    settings = get_settings()

    # Initialize the new google-genai client
    client = genai.Client(api_key=settings.gemini_api_key)

    # Decode base64 image bytes
    image_data = base64.b64decode(image_base64)

    # Build the image part using the new SDK's Part
    image_part = types.Part.from_bytes(
        data=image_data,
        mime_type="image/jpeg",
    )
    
    lang_name = "Spanish" if language.lower() == "es" else "English"
    final_prompt = f"{ANALYSIS_PROMPT}\n\nCRITICAL: Please provide the meal_name, ingredient names, and notes translated into {lang_name}."

    # Generate content using gemini-2.0-flash (free tier, fast)
    try:
        response = client.models.generate_content(
            model="gemini-3.1-flash-lite-preview",
            contents=[final_prompt, image_part],
        )
    except Exception as e:
        # If we hit quota or rate limits, fallback to Gemini 1.5 Flash
        if "429" in str(e) or "quota" in str(e).lower():
            print(f"[GeminiService] Quota hit for 2.0-flash. Falling back to 1.5-flash. Error: {e}")
            response = client.models.generate_content(
                model="gemini-1.5-flash",
                contents=[final_prompt, image_part],
            )
        else:
            raise e

    # Extract the raw text content from the AI response
    raw_content = response.text.strip()

    # Clean up potential markdown fences (```json ... ```)
    if raw_content.startswith("```"):
        lines = raw_content.split("\n")
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines[-1].startswith("```"):
            lines = lines[:-1]
        raw_content = "\n".join(lines).strip()

    # Parse the JSON response
    try:
        parsed = json.loads(raw_content)
    except json.JSONDecodeError:
        # Fallback: return an empty structure if AI output is malformed
        parsed = {
            "ingredients": [],
            "notes": f"Failed to parse AI response. Raw: {raw_content[:200]}",
        }

    return parsed


def refine_food_analysis(ingredients: list, feedback: str, language: str = "es") -> dict:
    """
    Sends the current ingredients and user feedback to Gemini for refinement.

    Args:
        ingredients: The current list of ingredients identified.
        feedback: The natural language feedback from the user.
        language: "es" or "en" to determine response language.

    Returns:
        A dict with updated 'ingredients' (list) and 'notes' (str).
    """
    settings = get_settings()
    client = genai.Client(api_key=settings.gemini_api_key)

    current_ingredients_str = json.dumps(ingredients, indent=2)
    prompt = REFINE_PROMPT.format(
        current_ingredients=current_ingredients_str,
        feedback=feedback
    )
    
    lang_name = "Spanish" if language.lower() == "es" else "English"
    final_prompt = f"{prompt}\n\nCRITICAL: Please provide the updated meal_name, ingredient names, and notes translated into {lang_name}."

    try:
        response = client.models.generate_content(
            model="gemini-3.1-flash-lite-preview",
            contents=[final_prompt],
        )
    except Exception as e:
        if "429" in str(e) or "quota" in str(e).lower():
            print(f"[GeminiService] Quota hit for 2.0-flash. Falling back to 1.5-flash. Error: {e}")
            response = client.models.generate_content(
                model="gemini-1.5-flash",
                contents=[final_prompt],
            )
        else:
            raise e

    raw_content = response.text.strip()

    if raw_content.startswith("```"):
        lines = raw_content.split("\n")
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines[-1].startswith("```"):
            lines = lines[:-1]
        raw_content = "\n".join(lines).strip()

    try:
        parsed = json.loads(raw_content)
    except json.JSONDecodeError:
        parsed = {
            "ingredients": ingredients, # Return the original on fail
            "notes": f"Failed to parse AI response. Raw: {raw_content[:200]}",
        }

    return parsed
