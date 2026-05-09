
from dotenv import load_dotenv
from core.config import get_settings
from services.firebase_service import get_user_settings, get_daily_summary, save_meal

# Load environment variables
load_dotenv()

settings = get_settings()
print("Firebase check starting...")
print("Firebase service account configured:", bool(settings.firebase_service_account_json.strip()))

try:
    print("Default settings:", get_user_settings("health-check-user"))
except Exception as e:
    print("Error checking user settings:", e)

try:
    print("Daily summary:", get_daily_summary("2026-01-01", "health-check-user"))
except Exception as e:
    print("Error checking daily summary:", e)
