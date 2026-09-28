import urllib.request
import json
import os

SUPABASE_URL = "https://slrjtctvyhhbwwcgomcy.supabase.co"
SUPABASE_KEY = "sb_publishable_BLYmFLhC_EstHmfnHt2UpA_4LATE0c9"

def download_karjat_parcels():
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/parcels?select=*&limit=1000",
        headers={"apikey": SUPABASE_KEY}
    )
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode())
    
    print(f"Downloaded {len(data)} Karjat parcels from Supabase.")
    out_path = os.path.join(os.path.dirname(__file__), "karjat_parcels.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
    print(f"Saved to {out_path}")

if __name__ == "__main__":
    download_karjat_parcels()
