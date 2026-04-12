
import os
from supabase import create_client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")

if not supabase_url or not supabase_key:
    print("Error: SUPABASE_URL or SUPABASE_KEY not found in .env")
    exit(1)

supabase = create_client(supabase_url, supabase_key)

try:
    # Try to fetch one row to see the columns
    result = supabase.table("meal_logs").select("*").limit(1).execute()
    if result.data:
        print("Columns in meal_logs:", list(result.data[0].keys()))
    else:
        # If no data, try to fetch table info if possible, or just insert/select with user_id
        print("No data in meal_logs. Checking if user_id column exists by querying it...")
        try:
            supabase.table("meal_logs").select("user_id").limit(1).execute()
            print("user_id column exists.")
        except Exception as e:
            print(f"Error querying user_id column: {e}")

    # Check user_settings table too
    print("\nChecking user_settings table:")
    try:
        res_settings = supabase.table("user_settings").select("*").limit(1).execute()
        if res_settings.data:
             print("Columns in user_settings:", list(res_settings.data[0].keys()))
        else:
             print("No data in user_settings. Checking loop...")
             supabase.table("user_settings").select("user_id").limit(1).execute()
             print("user_id column exists in user_settings.")
    except Exception as e:
        print(f"Error checking user_settings: {e}")

except Exception as e:
    print(f"General error: {e}")
