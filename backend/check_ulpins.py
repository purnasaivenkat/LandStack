import urllib.request
import json

SUPABASE_URL = "https://slrjtctvyhhbwwcgomcy.supabase.co"
SUPABASE_KEY = "sb_publishable_BLYmFLhC_EstHmfnHt2UpA_4LATE0c9"

for tbl in ["parcels", "ror", "registration", "tax", "encumbrance", "land_use", "building_permits", "court_cases"]:
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/{tbl}?select=ulpin&limit=10",
        headers={"apikey": SUPABASE_KEY}
    )
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode())
        print(f"Table '{tbl}' sample ULPINs: {[r.get('ulpin') for r in data]}")
