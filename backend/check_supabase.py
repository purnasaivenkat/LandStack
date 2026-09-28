import urllib.request
import json

SUPABASE_URL = "https://slrjtctvyhhbwwcgomcy.supabase.co"
SUPABASE_KEY = "sb_publishable_BLYmFLhC_EstHmfnHt2UpA_4LATE0c9"

tables = [
    "parcels", "ror", "registration", "tax", "encumbrance", 
    "land_use", "building_permits", "court_cases", "users"
]

for tbl in tables:
    try:
        req = urllib.request.Request(
            f"{SUPABASE_URL}/rest/v1/{tbl}?select=*&limit=5",
            headers={"apikey": SUPABASE_KEY}
        )
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode())
            print(f"[OK] Table '{tbl}': {len(data)} sample rows returned.")
            if len(data) > 0:
                print(f"     Sample columns: {list(data[0].keys())}")
    except Exception as e:
        print(f"[FAIL] Table '{tbl}': {e}")
