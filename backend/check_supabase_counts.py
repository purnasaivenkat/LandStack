import urllib.request
import json

SUPABASE_URL = "https://slrjtctvyhhbwwcgomcy.supabase.co"
SUPABASE_KEY = "sb_publishable_BLYmFLhC_EstHmfnHt2UpA_4LATE0c9"

for tbl in ["parcels", "ror", "registration", "tax", "encumbrance", "land_use", "building_permits", "court_cases"]:
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/{tbl}?select=count",
        headers={"apikey": SUPABASE_KEY, "Prefer": "count=exact"}
    )
    try:
        with urllib.request.urlopen(req) as resp:
            content_range = resp.headers.get("Content-Range", "")
            print(f"Table '{tbl}': Content-Range={content_range}")
    except Exception as e:
        print(f"Table '{tbl}' error: {e}")
