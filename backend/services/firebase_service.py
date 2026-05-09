"""
firebase_service.py — Firebase database and auth integration.

Handles all database operations using Firebase Auth and Firestore.
"""

from __future__ import annotations

import json
import os
from collections import defaultdict
from datetime import date, datetime, timezone, timedelta
from typing import Any, Optional

from firebase_admin import auth as firebase_auth
from firebase_admin import credentials, firestore, get_app, initialize_app

from core.config import get_settings


_FIREBASE_APP = None
_FIRESTORE_CLIENT = None


def _build_credentials():
    settings = get_settings()

    credential_path = settings.google_application_credentials.strip()
    if credential_path and os.path.exists(credential_path):
        return credentials.Certificate(credential_path)

    raw = settings.firebase_service_account_json.strip()
    if raw:
        service_account_info = json.loads(raw)
        return credentials.Certificate(service_account_info)

    return credentials.ApplicationDefault()


def _get_app():
    global _FIREBASE_APP
    if _FIREBASE_APP is not None:
        return _FIREBASE_APP

    try:
        _FIREBASE_APP = get_app()
    except ValueError:
        _FIREBASE_APP = initialize_app(_build_credentials())

    return _FIREBASE_APP


def _get_firestore():
    global _FIRESTORE_CLIENT
    if _FIRESTORE_CLIENT is not None:
        return _FIRESTORE_CLIENT

    _FIRESTORE_CLIENT = firestore.client(app=_get_app())
    return _FIRESTORE_CLIENT


def verify_id_token(token: str) -> str:
    decoded = firebase_auth.verify_id_token(token, app=_get_app())
    uid = decoded.get("uid")
    if not uid:
        raise ValueError("Token did not contain a uid.")
    return uid


def _ensure_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def _parse_logged_at(logged_at: Optional[str]) -> datetime:
    if not logged_at:
        return datetime.now(timezone.utc)
    if isinstance(logged_at, datetime):
        return _ensure_utc(logged_at)
    normalized = logged_at.replace("Z", "+00:00")
    parsed = datetime.fromisoformat(normalized)
    return _ensure_utc(parsed)


def _format_datetime(value: Any) -> str:
    if isinstance(value, datetime):
        return _ensure_utc(value).isoformat()
    if isinstance(value, str):
        return value
    return ""


def _meal_collection(user_id: str):
    return _get_firestore().collection("users").document(user_id).collection("meal_logs")


def _settings_doc(user_id: str):
    return _get_firestore().collection("users").document(user_id).collection("settings").document("profile")


def _normalize_ingredients(ingredients: list) -> list:
    normalized = []
    for item in ingredients or []:
        if hasattr(item, "model_dump"):
            normalized.append(item.model_dump())
        elif isinstance(item, dict):
            normalized.append(item)
    return normalized


def _doc_to_meal(doc) -> dict:
    data = doc.to_dict() or {}
    return {
        "id": doc.id,
        "meal_name": data.get("meal_name", "Unnamed Meal"),
        "ingredients": data.get("ingredients", []),
        "calories": data.get("calories", 0),
        "protein_g": data.get("protein_g", 0),
        "carbs_g": data.get("carbs_g", 0),
        "fats_g": data.get("fats_g", 0),
        "ai_notes": data.get("ai_notes"),
        "image_base64": data.get("image_base64"),
        "logged_at": _format_datetime(data.get("logged_at")),
        "created_at": _format_datetime(data.get("created_at")),
        "updated_at": _format_datetime(data.get("updated_at")),
    }


def _doc_to_meal_summary(doc) -> dict:
    meal = _doc_to_meal(doc)
    return {
        "id": meal["id"],
        "meal_name": meal["meal_name"],
        "logged_at": meal["logged_at"],
        "calories": meal["calories"],
        "protein_g": meal["protein_g"],
        "carbs_g": meal["carbs_g"],
        "fats_g": meal["fats_g"],
    }


DEFAULT_CALORIE_GOAL = 2000


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
    logged_at: Optional[str] = None,
) -> dict:
    collection = _meal_collection(user_id)
    doc_ref = collection.document()
    now = datetime.now(timezone.utc)

    payload = {
        "user_id": user_id,
        "meal_name": meal_name,
        "ingredients": _normalize_ingredients(ingredients),
        "calories": round(calories, 1),
        "protein_g": round(protein_g, 1),
        "carbs_g": round(carbs_g, 1),
        "fats_g": round(fats_g, 1),
        "ai_notes": ai_notes,
        "image_base64": image_base64,
        "logged_at": _parse_logged_at(logged_at),
        "created_at": now,
        "updated_at": now,
    }

    doc_ref.set(payload)
    return _doc_to_meal(doc_ref.get())


def get_daily_summary(target_date: str, user_id: str) -> dict:
    collection = _meal_collection(user_id)
    start = datetime.fromisoformat(f"{target_date}T00:00:00+00:00")
    end = datetime.fromisoformat(f"{target_date}T23:59:59.999999+00:00")

    query = (
        collection.where("logged_at", ">=", start)
        .where("logged_at", "<=", end)
        .order_by("logged_at")
    )

    meals = [_doc_to_meal_summary(doc) for doc in query.stream()]

    total_calories = sum(m.get("calories", 0) for m in meals)
    total_protein = sum(m.get("protein_g", 0) for m in meals)
    total_carbs = sum(m.get("carbs_g", 0) for m in meals)
    total_fats = sum(m.get("fats_g", 0) for m in meals)

    return {
        "date": target_date,
        "total_calories": round(total_calories, 1),
        "total_protein_g": round(total_protein, 1),
        "total_carbs_g": round(total_carbs, 1),
        "total_fats_g": round(total_fats, 1),
        "meal_count": len(meals),
        "meals": meals,
    }


def get_meal_detail(meal_id: str, user_id: str) -> dict:
    doc = _meal_collection(user_id).document(meal_id).get()
    if not doc.exists:
        return {}
    return _doc_to_meal(doc)


def delete_meal(meal_id: str, user_id: str) -> bool:
    doc_ref = _meal_collection(user_id).document(meal_id)
    if not doc_ref.get().exists:
        return False
    doc_ref.delete()
    return True


def update_meal(meal_id: str, payload: dict, user_id: str) -> dict:
    doc_ref = _meal_collection(user_id).document(meal_id)
    snapshot = doc_ref.get()
    if not snapshot.exists:
        return {}

    update_data = {k: v for k, v in payload.items() if v is not None}
    if not update_data:
        return _doc_to_meal(snapshot)

    if "ingredients" in update_data:
        update_data["ingredients"] = _normalize_ingredients(update_data["ingredients"])
    update_data["updated_at"] = datetime.now(timezone.utc)

    doc_ref.update(update_data)
    return _doc_to_meal(doc_ref.get())


def get_user_settings(user_id: str) -> dict:
    default_settings = {"daily_calorie_goal": DEFAULT_CALORIE_GOAL, "language": "es"}
    doc = _settings_doc(user_id).get()
    if not doc.exists:
        return default_settings

    data = doc.to_dict() or {}
    default_settings["daily_calorie_goal"] = float(data.get("daily_calorie_goal", DEFAULT_CALORIE_GOAL))
    default_settings["language"] = data.get("language", "es")
    return default_settings


def update_user_settings(daily_calorie_goal: float, language: str, user_id: str) -> dict:
    payload = {
        "daily_calorie_goal": float(round(daily_calorie_goal, 1)),
        "language": language,
        "updated_at": datetime.now(timezone.utc),
    }
    _settings_doc(user_id).set(payload, merge=True)
    return {
        "daily_calorie_goal": payload["daily_calorie_goal"],
        "language": language,
        "message": "Settings updated successfully",
    }


def get_trends_data(user_id: str, days: int = 7, daily_goal: float = DEFAULT_CALORIE_GOAL) -> dict:
    collection = _meal_collection(user_id)
    today = date.today()
    start_date = today - timedelta(days=days - 1)

    start = datetime.combine(start_date, datetime.min.time(), tzinfo=timezone.utc)
    end = datetime.combine(today, datetime.max.time(), tzinfo=timezone.utc)

    query = (
        collection.where("logged_at", ">=", start)
        .where("logged_at", "<=", end)
        .order_by("logged_at")
    )

    meals = [_doc_to_meal(doc) for doc in query.stream()]

    daily_data = defaultdict(lambda: {
        "calories": 0,
        "protein_g": 0,
        "carbs_g": 0,
        "fats_g": 0,
        "meal_count": 0,
    })

    for meal in meals:
        logged_at = meal.get("logged_at", "")
        meal_date = logged_at[:10] if isinstance(logged_at, str) else ""
        daily_data[meal_date]["calories"] += meal.get("calories", 0)
        daily_data[meal_date]["protein_g"] += meal.get("protein_g", 0)
        daily_data[meal_date]["carbs_g"] += meal.get("carbs_g", 0)
        daily_data[meal_date]["fats_g"] += meal.get("fats_g", 0)
        daily_data[meal_date]["meal_count"] += 1

    days_list = []
    goal_hit_count = 0
    total_calories = 0
    total_protein = 0
    total_carbs = 0
    total_fats = 0
    total_meals = 0

    for i in range(days):
        current_date = start_date + timedelta(days=i)
        date_str = current_date.isoformat()
        day_info = daily_data.get(date_str, {
            "calories": 0,
            "protein_g": 0,
            "carbs_g": 0,
            "fats_g": 0,
            "meal_count": 0,
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
