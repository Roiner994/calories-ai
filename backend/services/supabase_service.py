"""
supabase_service.py — Supabase database integration.

Handles all database operations: saving meal logs and querying
daily summaries from the Supabase PostgreSQL instance.
"""

from datetime import datetime, date
from typing import Optional
from supabase import create_client, Client

from core.config import get_settings


def _get_client() -> Client:
    """
    Creates and returns a Supabase client instance.
    Uses the URL and anon key from environment variables.
    """
    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_key)


# =============================================================================
# Table: meal_logs
# Expected Supabase schema:
#
#   CREATE TABLE meal_logs (
#     id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
#     meal_name   TEXT NOT NULL DEFAULT 'Unnamed Meal',
#     ingredients JSONB NOT NULL,
#     calories    REAL NOT NULL DEFAULT 0,
#     protein_g   REAL NOT NULL DEFAULT 0,
#     carbs_g     REAL NOT NULL DEFAULT 0,
#     fats_g      REAL NOT NULL DEFAULT 0,
#     ai_notes    TEXT,
#     image_base64 TEXT,
#     logged_at   TIMESTAMPTZ DEFAULT now(),
#     created_at  TIMESTAMPTZ DEFAULT now()
#   );
# =============================================================================

TABLE_NAME = "meal_logs"


def save_meal(
    meal_name: str,
    ingredients: list,
    calories: float,
    protein_g: float,
    carbs_g: float,
    fats_g: float,
    user_id: str,
    ai_notes: Optional[str] = None,
    image_base64: Optional[str] = None,
) -> dict:
    """
    Inserts a new meal log into the Supabase 'meal_logs' table.

    Args:
        meal_name:    User-defined label (e.g., "Lunch").
        ingredients:  Raw list of ingredient dicts from the AI analysis.
        calories:     Total kcal for the meal.
        protein_g:    Total protein in grams.
        carbs_g:      Total carbs in grams.
        fats_g:       Total fats in grams.
        user_id:      The UUID of the authenticated user.
        ai_notes:     Optional notes from the AI analysis.
        image_base64: Optional base64 thumbnail of the meal.

    Returns:
        The inserted row as a dict (includes generated 'id' and 'logged_at').
    """
    client = _get_client()

    payload = {
        "user_id": user_id,
        "meal_name": meal_name,
        "ingredients": ingredients,
        "calories": round(calories, 1),
        "protein_g": round(protein_g, 1),
        "carbs_g": round(carbs_g, 1),
        "fats_g": round(fats_g, 1),
        "ai_notes": ai_notes,
        "image_base64": image_base64,
        "logged_at": datetime.utcnow().isoformat(),
    }

    # Insert and return the created row
    result = client.table(TABLE_NAME).insert(payload).execute()

    # result.data is a list; return the first (and only) inserted row
    return result.data[0] if result.data else {}


def get_daily_summary(target_date: str, user_id: str) -> dict:
    """
    Fetches all meals logged on a specific date and aggregates their macros.

    Args:
        target_date: The date to query in 'YYYY-MM-DD' format.
        user_id: The UUID of the authenticated user.

    Returns:
        A dict with:
          - date, total_calories, total_protein_g, total_carbs_g, total_fats_g
          - meal_count
          - meals: list of individual meal entries
    """
    client = _get_client()

    # Build the date range for the query (start of day → end of day in UTC)
    start = f"{target_date}T00:00:00"
    end = f"{target_date}T23:59:59"

    # Query all meals logged within the target date for this user
    result = (
        client.table(TABLE_NAME)
        .select("*")
        .eq("user_id", user_id)
        .gte("logged_at", start)
        .lte("logged_at", end)
        .order("logged_at", desc=False)
        .execute()
    )

    meals = result.data or []

    # Aggregate totals
    total_calories = sum(m.get("calories", 0) for m in meals)
    total_protein = sum(m.get("protein_g", 0) for m in meals)
    total_carbs = sum(m.get("carbs_g", 0) for m in meals)
    total_fats = sum(m.get("fats_g", 0) for m in meals)

    # Format each meal for the response
    formatted_meals = [
        {
            "id": m.get("id", ""),
            "meal_name": m.get("meal_name", "Unnamed"),
            "logged_at": m.get("logged_at", ""),
            "calories": m.get("calories", 0),
            "protein_g": m.get("protein_g", 0),
            "carbs_g": m.get("carbs_g", 0),
            "fats_g": m.get("fats_g", 0),
        }
        for m in meals
    ]

    return {
        "date": target_date,
        "total_calories": round(total_calories, 1),
        "total_protein_g": round(total_protein, 1),
        "total_carbs_g": round(total_carbs, 1),
        "total_fats_g": round(total_fats, 1),
        "meal_count": len(meals),
        "meals": formatted_meals,
    }


def get_meal_detail(meal_id: str, user_id: str) -> dict:
    """
    Fetches the full details of a specific meal by its ID and user_id.
    """
    client = _get_client()
    result = client.table(TABLE_NAME).select("*").eq("id", meal_id).eq("user_id", user_id).execute()
    
    if not result.data:
        return {}
    
    return result.data[0]


def delete_meal(meal_id: str, user_id: str) -> bool:
    """
    Deletes a meal log from the database.
    Returns True if successful, False otherwise.
    """
    client = _get_client()
    result = client.table(TABLE_NAME).delete().eq("id", meal_id).eq("user_id", user_id).execute()
    
    # If data is returned, it means a row was deleted
    return len(result.data) > 0


def update_meal(meal_id: str, payload: dict, user_id: str) -> dict:
    """
    Updates an existing meal log in Supabase.
    
    Args:
        meal_id: The UUID of the meal to update.
        payload: A dictionary of fields to update.
        user_id: The UUID of the authenticated user to ensure ownership.
        
    Returns:
        The updated row as a dict.
    """
    client = _get_client()
    
    # Filter out None values to avoid overwriting with nulls if partial update is intended
    update_data = {k: v for k, v in payload.items() if v is not None}
    
    if "ingredients" in update_data and isinstance(update_data["ingredients"], list):
        # Ensure ingredients are serialized if they are Pydantic objects or similar
        # (Though we expect dicts here if coming from service layer)
        pass

    result = client.table(TABLE_NAME).update(update_data).eq("id", meal_id).eq("user_id", user_id).execute()
    
    return result.data[0] if result.data else {}


# =============================================================================
# Table: user_settings
# Expected Supabase schema:
#
#   CREATE TABLE user_settings (
#     id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
#     key         TEXT UNIQUE NOT NULL,
#     value       TEXT NOT NULL,
#     updated_at  TIMESTAMPTZ DEFAULT now()
#   );
# =============================================================================

SETTINGS_TABLE = "user_settings"
DEFAULT_CALORIE_GOAL = 2000


def get_user_settings(user_id: str) -> dict:
    """
    Fetches user settings from the database.
    Returns default values if no settings exist yet.
    """
    client = _get_client()

    default_settings = {"daily_calorie_goal": DEFAULT_CALORIE_GOAL, "language": "es"}
    try:
        result = (
            client.table(SETTINGS_TABLE)
            .select("*")
            .in_("key", ["daily_calorie_goal", "language"])
            .eq("user_id", user_id)
            .execute()
        )

        if result.data and len(result.data) > 0:
            for row in result.data:
                if row["key"] == "daily_calorie_goal":
                    default_settings["daily_calorie_goal"] = float(row["value"])
                elif row["key"] == "language":
                    default_settings["language"] = row["value"]
    except Exception:
        pass

    return default_settings


def update_user_settings(daily_calorie_goal: float, language: str, user_id: str) -> dict:
    """
    Updates or creates the user's daily calorie goal and language setting.
    Uses upsert to handle both insert and update cases.
    """
    client = _get_client()

    payloads = [
        {
            "user_id": user_id,
            "key": "daily_calorie_goal",
            "value": str(round(daily_calorie_goal, 1)),
            "updated_at": datetime.utcnow().isoformat(),
        },
        {
            "user_id": user_id,
            "key": "language",
            "value": language,
            "updated_at": datetime.utcnow().isoformat(),
        }
    ]

    result = (
        client.table(SETTINGS_TABLE)
        .upsert(payloads, on_conflict="user_id,key")
        .execute()
    )

    return {
        "daily_calorie_goal": daily_calorie_goal,
        "language": language,
        "message": "Settings updated successfully",
    }


# =============================================================================
# Trends Data
# =============================================================================

def get_trends_data(user_id: str, days: int = 7, daily_goal: float = DEFAULT_CALORIE_GOAL) -> dict:
    """
    Fetches and aggregates meal data over the last N days for trends.

    Args:
        user_id: The UUID of the authenticated user.
        days: Number of days to look back (7 = weekly, 30 = monthly, etc.)
        daily_goal: The user's daily calorie goal for goal-hit calculation.

    Returns:
        A dict with per-day aggregates and overall statistics.
    """
    client = _get_client()

    # Calculate the date range
    today = date.today()
    start_date = today - __import__("datetime").timedelta(days=days - 1)

    start = f"{start_date.isoformat()}T00:00:00"
    end = f"{today.isoformat()}T23:59:59"

    # Fetch all meals in the range
    result = (
        client.table(TABLE_NAME)
        .select("*")
        .eq("user_id", user_id)
        .gte("logged_at", start)
        .lte("logged_at", end)
        .order("logged_at", desc=False)
        .execute()
    )

    meals = result.data or []

    # Group meals by date
    from collections import defaultdict
    daily_data = defaultdict(lambda: {
        "calories": 0, "protein_g": 0, "carbs_g": 0, "fats_g": 0, "meal_count": 0
    })

    for meal in meals:
        # Extract just the date portion from logged_at
        meal_date = meal.get("logged_at", "")[:10]
        daily_data[meal_date]["calories"] += meal.get("calories", 0)
        daily_data[meal_date]["protein_g"] += meal.get("protein_g", 0)
        daily_data[meal_date]["carbs_g"] += meal.get("carbs_g", 0)
        daily_data[meal_date]["fats_g"] += meal.get("fats_g", 0)
        daily_data[meal_date]["meal_count"] += 1

    # Build per-day list (fill gaps with zeros)
    days_list = []
    goal_hit_count = 0
    total_calories = 0
    total_protein = 0
    total_carbs = 0
    total_fats = 0
    total_meals = 0

    import datetime as dt
    for i in range(days):
        current_date = start_date + dt.timedelta(days=i)
        date_str = current_date.isoformat()
        day_info = daily_data.get(date_str, {
            "calories": 0, "protein_g": 0, "carbs_g": 0, "fats_g": 0, "meal_count": 0
        })

        day_cals = round(day_info["calories"], 1)
        days_list.append({
            "date": date_str,
            "total_calories": day_cals,
            "total_protein_g": round(day_info["protein_g"], 1),
            "total_carbs_g": round(day_info["carbs_g"], 1),
            "total_fats_g": round(day_info["fats_g"], 1),
            "meal_count": day_info["meal_count"],
        })

        total_calories += day_cals
        total_protein += day_info["protein_g"]
        total_carbs += day_info["carbs_g"]
        total_fats += day_info["fats_g"]
        total_meals += day_info["meal_count"]

        # Count goal hits (only days with meals logged)
        if day_info["meal_count"] > 0 and day_cals <= daily_goal:
            goal_hit_count += 1

    days_with_meals = sum(1 for d in days_list if d["meal_count"] > 0)
    avg_calories = round(total_calories / days_with_meals, 1) if days_with_meals > 0 else 0

    return {
        "days": days_list,
        "daily_average_calories": avg_calories,
        "total_meals": total_meals,
        "total_protein_g": round(total_protein, 1),
        "total_carbs_g": round(total_carbs, 1),
        "total_fats_g": round(total_fats, 1),
        "goal_hit_days": goal_hit_count,
    }
