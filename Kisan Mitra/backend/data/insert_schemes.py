import json
from supabase import create_client

# 🔑 Replace these
url = "https://jqeeoyzvhvpkgdowoszg.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxZWVveXp2aHZwa2dkb3dvc3pnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTU1MDc2NywiZXhwIjoyMDg3MTI2NzY3fQ.BbNNKAMU_jVaMAMc3-3pZYRxAnYs-bcoyYm9Knpekr4"

supabase = create_client(url, key)

# 📂 Load your JSON file
with open("schemes.json", "r") as f:
    schemes = json.load(f)

# 🚀 Insert data
for scheme in schemes:
    response = supabase.table("schemes").insert({
        "id": scheme["id"],
        "data": scheme
    }).execute()

    print(f"Inserted: {scheme['id']}")

print("✅ All schemes inserted successfully!")