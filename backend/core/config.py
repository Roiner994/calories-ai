"""
config.py — Centralized application configuration.

Loads all environment variables from a .env file and exposes them
as a single `Settings` instance used throughout the app.
"""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    Create a `.env` file in the backend/ directory with these keys.
    """

    # --- AI APIs ---
    openai_api_key: str = ""
    gemini_api_key: str = ""

    # --- Edamam Nutrition API ---
    edamam_app_id: str = ""
    edamam_app_key: str = ""

    # --- Supabase ---
    supabase_url: str = ""
    supabase_key: str = ""  # Use the Service Role Key (secret) for server-side bypass of RLS

    # --- App ---
    app_name: str = "VisionMacro API"
    debug: bool = True

    class Config:
        # Automatically read from .env file in the project root
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    """
    Returns a cached Settings instance. Using lru_cache ensures
    the .env file is only read once during the app lifecycle.
    """
    return Settings()
