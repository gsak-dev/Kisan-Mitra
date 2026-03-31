import os
import json
import asyncio
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

URL_MAP = {
    "pm-kisan": "https://pmkisan.gov.in/",
    "pmfby": "https://pmfby.gov.in/",
    "kcc": "https://sbi.co.in/web/agri-rural/agriculture-banking/crop-loan/kisan-credit-card",
    "pmksy": "https://pmksy.gov.in/",
    "enam": "https://enam.gov.in/",
    "smam": "https://agrimachinery.nic.in/",
    "pm-kusum": "https://pmkusum.mnre.gov.in/",
    "mids": "https://midh.gov.in/",
    "agri-infra-fund": "https://agriinfra.dac.gov.in/",
    "rkvy": "https://rkvy.nic.in/",
    "nfsm": "https://nfsm.gov.in/"
}

async def main():
    print("Loading schemes.json...")
    with open("data/schemes.json", "r", encoding="utf-8") as f:
        schemes = json.load(f)
        
    for s in schemes:
        if s["id"] in URL_MAP:
            s["apply_url"] = URL_MAP[s["id"]]
        else:
            s["apply_url"] = f"https://myscheme.gov.in/schemes/{s['id']}"  # Placeholder
        
        # Strip fields not in supabase schema
        if "last_verified" in s:
            del s["last_verified"]
            
        s["is_active"] = True
        s["confidence_score"] = 1.0

    print("Writing enriched schemes back to backend/data/schemes.json")
    with open("data/schemes.json", "w", encoding="utf-8") as f:
        json.dump(schemes, f, indent=2)
        
    print("Writing enriched schemes to frontend/src/data/schemes.json")
    with open("../frontend/src/data/schemes.json", "w", encoding="utf-8") as f:
        json.dump(schemes, f, indent=2)

    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_KEY")
    
    if not url or not key:
        print("Missing Supabase credentials!")
        return

    print("Connecting to Supabase...")
    supabase: Client = create_client(url, key)
    
    print("Wiping old schemes (is_active=True or False)...")
    # PostgREST allows deleting all if we pass a condition that matches everything, 
    # e.g., neq on ID that isn't empty, or just gte.
    try:
        res = supabase.table("schemes").delete().neq("id", "impossible_id_123").execute()
        print(f"Deleted {len(res.data)} old schemes.")
    except Exception as e:
        print("Delete error:", e)

    print("Inserting 30 high-quality agriculture schemes...")
    try:
        ins = supabase.table("schemes").insert(schemes).execute()
        print(f"Inserted {len(ins.data)} schemes successfully!")
    except Exception as e:
        print("Insert error:", e)

if __name__ == "__main__":
    asyncio.run(main())
