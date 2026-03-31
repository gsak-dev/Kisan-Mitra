import json
import os


def _load_schemes_from_supabase():
    json_path = os.path.join(os.path.dirname(__file__), "..", "data", "schemes.json")
    if os.path.exists(json_path):
        with open(json_path, encoding="utf-8") as f:
            data = json.load(f)
            if isinstance(data, list):
                return data
            return data.get("schemes", [])
    return []


ALL_SCHEMES = _load_schemes_from_supabase()


DOCUMENT_LABELS = {
    "aadhaar": "Aadhaar Card",
    "pan_card": "PAN Card",
    "land_record": "Land Record",
    "bank_account": "Bank Account",
    "income_certificate": "Income Certificate",
    "caste_certificate": "Caste Certificate",
    "passport_photo": "Passport Photo",
    "mobile_number": "Mobile Number",
    "business_proof": "Business Proof",
    "sowing_certificate": "Sowing Certificate",
    "quotation_machinery": "Machinery Quotation",
    "cluster_registration": "Cluster Registration",
    "electricity_bill": "Electricity Bill",
    "irrigation_plan": "Irrigation Plan",
}


def _user_has_doc(profile, doc):
    return {
        "aadhaar": profile.get("has_aadhaar", False),
        "pan_card": profile.get("has_pan", False),
        "land_record": profile.get("has_land_record", False),
        "bank_account": profile.get("has_bank_account", False),
        "income_certificate": profile.get("has_income_certificate", False),
        "caste_certificate": profile.get("has_caste_certificate", False),
        "mobile_number": profile.get("has_mobile", True),
        "passport_photo": True,
    }.get(doc, False)


def check_eligibility(profile, scheme):
    e = scheme.get("eligibility", {})

    failures = []
    warnings = []
    checks_passed = 0
    total_checks = 0

    def to_int(val):
        try:
            return int(val)
        except:
            return 0

    def to_float(val):
        try:
            return float(val)
        except:
            return 0.0

    user_age = to_int(profile.get("age"))
    user_land = to_float(profile.get("land_acres"))

    user_occ = str(profile.get("occupation", "")).lower()

    is_farmer = user_occ in [
        "farmer",
        "landowning farmer",
        "tenant farmer",
        "agricultural laborer"
    ]

    def check(condition, msg, hard=True):
        nonlocal checks_passed, total_checks
        total_checks += 1
        if condition:
            checks_passed += 1
        else:
            if hard:
                failures.append(msg)
            else:
                warnings.append(msg)

    # ----------------------------
    # CORE CHECKS
    # ----------------------------

    if e.get("farmer_required"):
        check(is_farmer, "Must be a farmer")

    if e.get("land_required"):
        check(user_land > 0, "Requires agricultural land")

    if e.get("min_land_acres"):
        check(user_land >= e["min_land_acres"], "Land too small")

    if e.get("max_land_acres"):
        check(user_land <= e["max_land_acres"], "Land too large")

    if e.get("age_min"):
        check(user_age >= e["age_min"], "Below required age")

    if e.get("crop_required"):
        crops = profile.get("crops", [])
        check(len(crops) > 0, "Requires crops")

    if scheme.get("states") and "all" not in scheme["states"]:
        check(profile.get("state") in scheme["states"], "Not available in your state")

    if "income_tax_payer" in e.get("disqualifiers", []):
        check(not profile.get("is_income_tax_payer"), "Income tax payer not eligible")

    if "government_employee" in e.get("disqualifiers", []):
        check(not profile.get("is_government_employee"), "Gov employee not eligible")

    # ----------------------------
    # DOCUMENT CHECK
    # ----------------------------

    required_docs = scheme.get("documents_required", [])
    docs_have = [d for d in required_docs if _user_has_doc(profile, d)]
    docs_missing = [d for d in required_docs if not _user_has_doc(profile, d)]

    doc_score = len(docs_have) / max(len(required_docs), 1)

    # ----------------------------
    # SCORING
    # ----------------------------

    base_score = (checks_passed / max(total_checks, 1)) * 70
    final_score = base_score + (doc_score * 30)

    # ----------------------------
    # SMART BOOSTS (NEW)
    # ----------------------------

    # Small farmer boost
    if user_land > 0 and user_land <= 2:
        final_score += 5

    # Crop relevance boost
    if profile.get("crops"):
        final_score += 3

    # Irrigation intelligence
    irrigation = profile.get("irrigation")

    if "irrigation" in scheme.get("category", []):
        if irrigation == "rainfed":
            final_score += 10
        elif irrigation == "drip":
            final_score += 5

    final_score = round(min(final_score, 100), 2)

    eligible = final_score >= 70
    partially_eligible = 40 <= final_score < 70

    # ----------------------------
    # BENEFIT FIX
    # ----------------------------

    benefit = scheme.get("benefit_amount", 0)

    if benefit > 200000:
        benefit = 50000

    if scheme.get("benefit_type") == "loan":
        benefit = 0

    priority_score = round(final_score * (benefit / 10000), 2)

    # ----------------------------
    # EXPLANATION (NEW 🔥)
    # ----------------------------

    reasons = []

    if is_farmer:
        reasons.append("You are a farmer")

    if user_land > 0:
        reasons.append(f"You own {user_land} acres of land")

    if profile.get("crops"):
        reasons.append("You have active crops")

    if irrigation:
        reasons.append(f"Irrigation type: {irrigation}")

    return {
        "scheme_id": scheme.get("id"),
        "scheme_name": scheme.get("name"),

        "eligible": eligible,
        "partially_eligible": partially_eligible,
        "score": final_score,

        "failure_reasons": failures,
        "warnings": warnings,

        "missing_documents": docs_missing,
        "documents_you_have": docs_have,

        "benefit_amount": benefit,
        "priority_score": priority_score,

        "category": scheme.get("category", []),
        "apply_url": scheme.get("apply_url", ""),
        "benefit_description": scheme.get("description", ""),
        "why_recommended": reasons
    }
def run_eligibility(profile):
    results = [check_eligibility(profile, s) for s in ALL_SCHEMES]
    results.sort(key=lambda x: x["priority_score"], reverse=True)
    return results


def run_whatif(profile, changes):
    modified_profile = {**profile, **changes}

    original = {r["scheme_id"]: r for r in run_eligibility(profile)}
    modified = {r["scheme_id"]: r for r in run_eligibility(modified_profile)}

    gained = []
    lost = []

    for sid, mod in modified.items():
        orig = original.get(sid, {})
        if mod["eligible"] and not orig.get("eligible"):
            gained.append(mod)
        elif not mod["eligible"] and orig.get("eligible"):
            lost.append(mod)

    return {
        "gained": gained,
        "lost": lost,
        "all": list(modified.values())
    }


def refresh_schemes():
    global ALL_SCHEMES
    ALL_SCHEMES = _load_schemes_from_supabase()
    return len(ALL_SCHEMES)