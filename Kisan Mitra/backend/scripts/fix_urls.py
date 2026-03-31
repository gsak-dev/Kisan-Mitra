import os
import json
import asyncio
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

REAL_URLS = {
    "pm-kisan": "https://pmkisan.gov.in/",
    "pmfby": "https://pmfby.gov.in/",
    "kcc": "https://sbi.co.in/web/agri-rural/agriculture-banking/crop-loan/kisan-credit-card",
    "pmksy": "https://pmksy.gov.in/",
    "soil-health-card": "https://soilhealth.dac.gov.in/",
    "pkvy": "https://pgsindia-ncof.gov.in/pkvy/index.aspx",
    "enam": "https://enam.gov.in/",
    "smam": "https://agrimachinery.nic.in/",
    "pm-kusum": "https://pmkusum.mnre.gov.in/",
    "mids": "https://midh.gov.in/",
    "agri-infra-fund": "https://agriinfra.dac.gov.in/",
    "nabard-dairy": "https://www.nabard.org/content.aspx?id=594",
    "rkvy": "https://rkvy.nic.in/",
    "nfsm": "https://nfsm.gov.in/",
    "kisan-suvidha": "https://kisansuvidha.gov.in/",
    "e-pashuhaat": "https://epashuhaat.gov.in/",
    "nrc-pig": "https://nrcp.icar.gov.in/",
    "namo-shetkari": "https://nsnmy.mahait.org/",
    "rythu-bandhu": "https://rythubandhu.telangana.gov.in/",
    "kalia": "https://kalia.odisha.gov.in/",
    "krishi-ashirwad": "https://mmkay.jharkhand.gov.in/",
    "bhavantar": "https://agri.mp.gov.in/",
    "yso": "https://ysrrythubharosa.ap.gov.in/",
    "pm-fme": "https://pmfme.mofpi.gov.in/",
    "ahidf": "https://ahidf.udyamimitra.in/",
    "gks": "https://agricoop.nic.in/",
    "kisan-call-center": "https://mkisan.gov.in/",
    "agri-clinics": "https://www.agriclinics.net/",
    "nmoop": "https://nmoop.gov.in/",
    "sub-mission-seeds": "https://seednet.gov.in/"
}

def fix_urls():
    print("Loading schemes...")
    with open("data/schemes.json", "r", encoding="utf-8") as f:
        schemes = json.load(f)
        
    for s in schemes:
        if s["id"] in REAL_URLS:
            s["apply_url"] = REAL_URLS[s["id"]]
        else:
            # Safe generic fallback instead of hardcoded 404 links
            s["apply_url"] = "https://agricoop.nic.in/"

    # Write fallback JSON
    with open("data/schemes.json", "w", encoding="utf-8") as f:
        json.dump(schemes, f, indent=2)
    with open("../frontend/src/data/schemes.json", "w", encoding="utf-8") as f:
        json.dump(schemes, f, indent=2)

    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_KEY")
    
    if url and key:
        print("Syncing live DB...")
        supabase = create_client(url, key)
        # We only need to bulk update apply_url for the existing 30 schemes.
        # But replacing them is easiest.
        try:
            supabase.table("schemes").delete().neq("id", "none").execute()
            supabase.table("schemes").insert(schemes).execute()
            print("Successfully synced 30 fixed URLs to live database.")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    fix_urls()
