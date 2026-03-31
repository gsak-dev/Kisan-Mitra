from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services.eligibility_service import run_eligibility, run_whatif, ALL_SCHEMES

router = APIRouter()


class ProfileBody(BaseModel):
    profile: dict


class WhatIfBody(BaseModel):
    profile: dict
    changes: dict


@router.get("/all")
def get_all_schemes():
    return {
        "schemes": ALL_SCHEMES,
        "count": len(ALL_SCHEMES)
    }


@router.post("/check-eligibility")
def check_eligibility_endpoint(body: ProfileBody):
    results = run_eligibility(body.profile)

    return {
        "results": results,
        "summary": {
            "eligible_count": len([r for r in results if r["eligible"]]),
            "partial_count": len([r for r in results if r["partially_eligible"]]),
            "total": len(results)
        }
    }


@router.post("/whatif")
def whatif_simulator(body: WhatIfBody):
    return run_whatif(body.profile, body.changes)


@router.get("/{scheme_id}")
def get_scheme(scheme_id: str):
    for s in ALL_SCHEMES:
        if s["id"] == scheme_id:
            return s

    raise HTTPException(status_code=404, detail="Scheme not found")


@router.post("/refresh")
def refresh_scheme_cache():
    from services.eligibility_service import refresh_schemes
    count = refresh_schemes()
    return {
        "success": True,
        "schemes_loaded": count
    }