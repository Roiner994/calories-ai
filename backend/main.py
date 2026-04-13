"""
main.py — VisionMacro FastAPI Application.

This is the entry point for the backend API. It exposes endpoints for:
  1. POST /analyze-meal  — Receives a food image, analyzes it with Gemini,
                           fetches macros from Edamam, and returns the result.
  2. POST /log-meal      — Saves an analyzed meal to the Supabase database.
  3. POST /log-meal-manual — Saves a manually entered meal (no image).
  4. GET  /daily-summary — Aggregates all meals logged for a given date.
  5. GET  /settings      — Fetches the user's calorie goal.
  6. POST /settings      — Updates the user's calorie goal.
  7. GET  /trends        — Returns aggregated meal data over a date range.

Run locally with:
  uvicorn main:app --reload --port 8000
"""

import base64
from datetime import date

from fastapi import FastAPI, UploadFile, File, HTTPException, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from core.config import get_settings
from core.schemas import (
    AnalyzeMealResponse,
    Ingredient,
    MacroBreakdown,
    LogMealRequest,
    LogMealResponse,
    DailySummaryResponse,
    MealSummaryItem,
    MealDetailResponse,
    UserSettings,
    UserSettingsResponse,
    ManualLogMealRequest,
    TrendsResponse,
    TrendsDayData,
    UpdateMealRequest,
    RefineMealRequest,
)
from services.gemini_service import analyze_food_image, refine_food_analysis
from services.nutrition_service import calculate_total_macros
from services.supabase_service import (
    save_meal,
    get_daily_summary,
    get_meal_detail,
    delete_meal,
    update_meal,
    get_user_settings,
    update_user_settings,
    get_trends_data,
    _get_client,
)


# ---------------------------------------------------------------------------
# App initialization & Security
# ---------------------------------------------------------------------------

security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """Verifies the Supabase JWT and returns the user's UUID."""
    token = credentials.credentials
    try:
        client = _get_client()
        user_response = client.auth.get_user(token)
        if not user_response or not user_response.user:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        return user_response.user.id
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")


settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    description="AI-powered calorie tracking API. Snap a photo → get macros.",
    version="2.0.0",
)

# Allow all origins for development (restrict in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------

@app.get("/", tags=["Health"])
async def health_check():
    """Simple health check to verify the API is running."""
    return {"status": "healthy", "app": settings.app_name}


# ---------------------------------------------------------------------------
# POST /analyze-meal
# ---------------------------------------------------------------------------

@app.post(
    "/analyze-meal",
    response_model=AnalyzeMealResponse,
    tags=["Analysis"],
    summary="Analyze a food photo and return macro breakdown",
)
async def analyze_meal(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user)
):
    """
    Accepts an uploaded food image, sends it to GPT-4o for ingredient
    identification, then queries Edamam for nutritional data.

    The full pipeline:
      1. Read and encode the image as base64.
      2. Send to GPT-4o Vision → get ingredient list + estimated weights.
      3. For each ingredient, query Edamam → get calories, protein, carbs, fats.
      4. Aggregate totals and return the unified result.
    """
    # --- Step 1: Read and encode the uploaded image ---
    try:
        contents = await file.read()
        image_base64 = base64.b64encode(contents).decode("utf-8")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read image: {str(e)}")

    # --- Step 2: Analyze with GPT-4o ---
    try:
        user_settings = get_user_settings(user_id)
        language = user_settings.get("language", "es")
        ai_result = analyze_food_image(image_base64, language)
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"Gemini analysis failed: {str(e)}",
        )

    # Extract the ingredients list from the AI response
    raw_ingredients = ai_result.get("ingredients", [])
    ai_notes = ai_result.get("notes", None)
    meal_name = ai_result.get("meal_name", "Meal")

    if not raw_ingredients:
        raise HTTPException(
            status_code=422,
            detail="AI could not identify any ingredients in the image.",
        )

    # --- Step 3: Fetch macros from Edamam for each ingredient ---
    nutrition_result = calculate_total_macros(raw_ingredients)

    # --- Step 4: Build the response ---
    # Merge AI confidence with nutrition results
    ingredients = []
    for i, item in enumerate(raw_ingredients):
        nutr = nutrition_result["per_ingredient"][i]
        ingredients.append(Ingredient(
            name=item.get("name", "unknown"),
            estimated_grams=item.get("estimated_grams", 0),
            confidence=item.get("confidence", None),
            calories=nutr["macros"]["calories"],
            protein_g=nutr["macros"]["protein_g"],
            carbs_g=nutr["macros"]["carbs_g"],
            fats_g=nutr["macros"]["fats_g"],
        ))

    totals = MacroBreakdown(
        calories=nutrition_result["totals"]["calories"],
        protein_g=nutrition_result["totals"]["protein_g"],
        carbs_g=nutrition_result["totals"]["carbs_g"],
        fats_g=nutrition_result["totals"]["fats_g"],
    )

    return AnalyzeMealResponse(
        ingredients=ingredients,
        totals=totals,
        meal_name=meal_name,
        ai_notes=ai_notes,
    )


# ---------------------------------------------------------------------------
# POST /refine-meal
# ---------------------------------------------------------------------------

@app.post(
    "/refine-meal",
    response_model=AnalyzeMealResponse,
    tags=["Analysis"],
    summary="Refine a previous meal analysis using natural language feedback",
)
async def refine_meal(
    payload: RefineMealRequest,
    user_id: str = Depends(get_current_user)
):
    """
    Accepts the current list of ingredients and a natural language feedback string from the user.
    Passes them to Gemini to output a corrected list of ingredients and macros.
    """
    try:
        # Convert Pydantic models to dicts for the service
        ingredients_data = [ing.model_dump() for ing in payload.ingredients]
        
        user_settings = get_user_settings(user_id)
        language = user_settings.get("language", "es")
        
        # Call Gemini to refine the analysis
        ai_result = refine_food_analysis(ingredients_data, payload.feedback, language)
        
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"AI refinement failed: {str(e)}",
        )

    raw_ingredients = ai_result.get("ingredients", [])
    ai_notes = ai_result.get("notes", None)
    meal_name = ai_result.get("meal_name", None)

    if not raw_ingredients:
        raise HTTPException(
            status_code=422,
            detail="AI failed to return any ingredients after refinement.",
        )

    # Recalculate totals based on the returned ingredients containing macros
    nutrition_result = calculate_total_macros(raw_ingredients)

    # Build the response
    ingredients = []
    for i, item in enumerate(raw_ingredients):
        nutr = nutrition_result["per_ingredient"][i]
        ingredients.append(Ingredient(
            name=item.get("name", "unknown"),
            estimated_grams=item.get("estimated_grams", 0),
            confidence=item.get("confidence", None),
            calories=nutr["macros"]["calories"],
            protein_g=nutr["macros"]["protein_g"],
            carbs_g=nutr["macros"]["carbs_g"],
            fats_g=nutr["macros"]["fats_g"],
        ))

    totals = MacroBreakdown(
        calories=nutrition_result["totals"]["calories"],
        protein_g=nutrition_result["totals"]["protein_g"],
        carbs_g=nutrition_result["totals"]["carbs_g"],
        fats_g=nutrition_result["totals"]["fats_g"],
    )

    return AnalyzeMealResponse(
        ingredients=ingredients,
        totals=totals,
        meal_name=meal_name,
        ai_notes=ai_notes,
    )


# ---------------------------------------------------------------------------
# POST /log-meal
# ---------------------------------------------------------------------------

@app.post(
    "/log-meal",
    response_model=LogMealResponse,
    tags=["Logging"],
    summary="Save an analyzed meal to the database",
)
async def log_meal(
    payload: LogMealRequest,
    user_id: str = Depends(get_current_user)
):
    """
    Receives the analyzed meal data from the frontend and persists it
    to the Supabase 'meal_logs' table.
    """
    try:
        # Convert ingredients to plain dicts for JSON storage
        ingredients_data = [ing.model_dump() for ing in payload.ingredients]

        saved = save_meal(
            meal_name=payload.meal_name,
            ingredients=ingredients_data,
            calories=payload.totals.calories,
            protein_g=payload.totals.protein_g,
            carbs_g=payload.totals.carbs_g,
            fats_g=payload.totals.fats_g,
            user_id=user_id,
            ai_notes=payload.ai_notes,
            image_base64=payload.image_base64,
        )

        return LogMealResponse(
            success=True,
            meal_id=saved.get("id", "unknown"),
            message="Meal logged successfully!",
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save meal: {str(e)}",
        )


# ---------------------------------------------------------------------------
# POST /log-meal-manual
# ---------------------------------------------------------------------------

@app.post(
    "/log-meal-manual",
    response_model=LogMealResponse,
    tags=["Logging"],
    summary="Manually log a meal without AI analysis",
)
async def log_meal_manual(
    payload: ManualLogMealRequest,
    user_id: str = Depends(get_current_user)
):
    """
    Saves a manually entered meal to the database.
    No image or AI analysis required — just name and estimated macros.
    """
    try:
        saved = save_meal(
            meal_name=payload.meal_name,
            ingredients=[{"name": payload.meal_name, "estimated_grams": 0}],
            calories=payload.calories,
            protein_g=payload.protein_g,
            carbs_g=payload.carbs_g,
            fats_g=payload.fats_g,
            user_id=user_id,
            ai_notes="Manually entered meal",
        )

        return LogMealResponse(
            success=True,
            meal_id=saved.get("id", "unknown"),
            message="Manual meal logged successfully!",
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save manual meal: {str(e)}",
        )


# ---------------------------------------------------------------------------
# GET /daily-summary
# ---------------------------------------------------------------------------

@app.get(
    "/daily-summary",
    response_model=DailySummaryResponse,
    tags=["Summary"],
    summary="Get aggregated macros for all meals on a given date",
)
async def daily_summary(
    target_date: str = Query(
        ...,
        alias="date",
        description="The date to summarize in YYYY-MM-DD format",
        examples=["2026-04-08"],
    ),
    user_id: str = Depends(get_current_user)
):
    """
    Queries the database for all meals logged on the specified date
    and returns aggregated totals plus individual meal details.
    """
    # Basic date format validation
    try:
        date.fromisoformat(target_date)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid date format. Use YYYY-MM-DD.",
        )

    try:
        summary = get_daily_summary(target_date, user_id)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch daily summary: {str(e)}",
        )

    # Map the raw data to the response schema
    meals = [
        MealSummaryItem(**m) for m in summary.get("meals", [])
    ]

    return DailySummaryResponse(
        date=summary["date"],
        total_calories=summary["total_calories"],
        total_protein_g=summary["total_protein_g"],
        total_carbs_g=summary["total_carbs_g"],
        total_fats_g=summary["total_fats_g"],
        meal_count=summary["meal_count"],
        meals=meals,
    )


# ---------------------------------------------------------------------------
# GET /meals/{meal_id}
# ---------------------------------------------------------------------------

@app.get(
    "/meals/{meal_id}",
    response_model=MealDetailResponse,
    tags=["Logging"],
    summary="Get full details for a specific meal",
)
async def get_meal(
    meal_id: str,
    user_id: str = Depends(get_current_user)
):
    """Returns all details for a meal log, including ingredients and notes."""
    try:
        detail = get_meal_detail(meal_id, user_id)
        if not detail:
            raise HTTPException(status_code=404, detail="Meal not found")
        return MealDetailResponse(**detail)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch meal detail: {str(e)}",
        )


# ---------------------------------------------------------------------------
# DELETE /meals/{meal_id}
# ---------------------------------------------------------------------------

@app.delete(
    "/meals/{meal_id}",
    tags=["Logging"],
    summary="Delete a meal log",
)
async def delete_meal_endpoint(
    meal_id: str,
    user_id: str = Depends(get_current_user)
):
    """Removes a meal log from the database."""
    try:
        success = delete_meal(meal_id, user_id)
        if not success:
            raise HTTPException(status_code=404, detail="Meal not found or already deleted")
        return {"success": True, "message": "Meal deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete meal: {str(e)}",
        )


# ---------------------------------------------------------------------------
# PATCH /meals/{meal_id}
# ---------------------------------------------------------------------------

@app.patch(
    "/meals/{meal_id}",
    response_model=MealDetailResponse,
    tags=["Logging"],
    summary="Update a meal log",
)
async def update_meal_endpoint(
    meal_id: str,
    payload: UpdateMealRequest,
    user_id: str = Depends(get_current_user)
):
    """Updates specific fields of an existing meal log."""
    try:
        # Convert payload to dict, excluding unset fields
        update_data = payload.model_dump(exclude_unset=True)
        
        # Handle ingredients specifically if they are present in the update
        if "ingredients" in update_data:
            update_data["ingredients"] = [ing.model_dump() for ing in update_data["ingredients"]]

        updated = update_meal(meal_id, update_data, user_id)
        if not updated:
            raise HTTPException(status_code=404, detail="Meal not found")
        return MealDetailResponse(**updated)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update meal: {str(e)}",
        )


# ---------------------------------------------------------------------------
# GET /settings
# ---------------------------------------------------------------------------

@app.get(
    "/settings",
    response_model=UserSettingsResponse,
    tags=["Settings"],
    summary="Get the user's current settings (calorie goal)",
)
async def get_settings_endpoint(
    user_id: str = Depends(get_current_user)
):
    """Fetches the user's daily calorie goal from the database."""
    try:
        settings_data = get_user_settings(user_id)
        return UserSettingsResponse(**settings_data)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch settings: {str(e)}",
        )


# ---------------------------------------------------------------------------
# POST /settings
# ---------------------------------------------------------------------------

@app.post(
    "/settings",
    response_model=UserSettingsResponse,
    tags=["Settings"],
    summary="Update the user's calorie goal",
)
async def update_settings_endpoint(
    payload: UserSettings,
    user_id: str = Depends(get_current_user)
):
    """Updates the user's daily calorie goal."""
    if payload.daily_calorie_goal <= 0:
        raise HTTPException(
            status_code=400,
            detail="Calorie goal must be a positive number.",
        )

    try:
        result = update_user_settings(payload.daily_calorie_goal, payload.language, user_id)
        return UserSettingsResponse(**result)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update settings: {str(e)}",
        )


# ---------------------------------------------------------------------------
# GET /trends
# ---------------------------------------------------------------------------

@app.get(
    "/trends",
    response_model=TrendsResponse,
    tags=["Trends"],
    summary="Get aggregated meal trends over a date range",
)
async def trends(
    days: int = Query(
        7,
        description="Number of days to look back (7=week, 30=month, 180=6months, 365=year)",
        ge=1,
        le=365,
    ),
    user_id: str = Depends(get_current_user)
):
    """
    Returns per-day calorie aggregates and overall statistics
    for the requested time range, including goal-hit frequency.
    """
    try:
        # Get the user's calorie goal for goal-hit calculation
        user_settings = get_user_settings(user_id)
        daily_goal = user_settings.get("daily_calorie_goal", 2000)

        raw = get_trends_data(user_id, days=days, daily_goal=daily_goal)

        trend_days = [TrendsDayData(**d) for d in raw["days"]]

        return TrendsResponse(
            days=trend_days,
            daily_average_calories=raw["daily_average_calories"],
            total_meals=raw["total_meals"],
            total_protein_g=raw["total_protein_g"],
            total_carbs_g=raw["total_carbs_g"],
            total_fats_g=raw["total_fats_g"],
            goal_hit_days=raw["goal_hit_days"],
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch trends: {str(e)}",
        )
