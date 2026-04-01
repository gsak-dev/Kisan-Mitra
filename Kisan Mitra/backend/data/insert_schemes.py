import json
from supabase import create_client

# 🔑 Replace these

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
