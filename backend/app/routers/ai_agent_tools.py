from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.parcel import Parcel
from app.models.ror import RoR
from app.models.registration import Registration
from app.models.tax import Tax
from app.models.encumbrance import Encumbrance
from app.models.land_use import LandUse
from app.models.building_permit import BuildingPermit
from app.models.court_case import CourtCase
from app.services.profile_service import get_unified_parcel_profile, perform_area_analysis
from pydantic import BaseModel

router = APIRouter(prefix="/ai-agent", tags=["AI Agent Tools (Member 3 Integration)"])

class ToolExecuteRequest(BaseModel):
    tool_name: str
    arguments: Dict[str, Any]

TOOL_DEFINITIONS = [
    {
        "name": "get_unified_parcel_profile",
        "description": "Fetch the complete unified 360-degree profile for a land parcel by its ULPIN (Unique Land Parcel Identification Number), including ownership, taxes, encumbrances, court stays, zoning, permits, and calculated risk anomalies.",
        "parameters": {
            "type": "object",
            "properties": {
                "ulpin": {
                    "type": "string",
                    "description": "The unique land parcel identification number, e.g., 'UL001', 'UL002', etc."
                }
            },
            "required": ["ulpin"]
        }
    },
    {
        "name": "get_parcel_details",
        "description": "Get physical GIS boundaries, survey number, and physical acreage for a parcel.",
        "parameters": {
            "type": "object",
            "properties": {
                "ulpin": {"type": "string", "description": "The ULPIN of the parcel"}
            },
            "required": ["ulpin"]
        }
    },
    {
        "name": "get_ror",
        "description": "Retrieve legal Record of Rights (Pahani/7/12) showing title owner name, khata number, and registered document area.",
        "parameters": {
            "type": "object",
            "properties": {
                "ulpin": {"type": "string", "description": "The ULPIN of the parcel"}
            },
            "required": ["ulpin"]
        }
    },
    {
        "name": "get_tax_status",
        "description": "Retrieve property tax assessment records, payment history, and pending dues for a parcel.",
        "parameters": {
            "type": "object",
            "properties": {
                "ulpin": {"type": "string", "description": "The ULPIN of the parcel"}
            },
            "required": ["ulpin"]
        }
    },
    {
        "name": "get_encumbrance_status",
        "description": "Check if a parcel has active bank mortgages, financial liens, or charges.",
        "parameters": {
            "type": "object",
            "properties": {
                "ulpin": {"type": "string", "description": "The ULPIN of the parcel"}
            },
            "required": ["ulpin"]
        }
    },
    {
        "name": "get_court_cases",
        "description": "Check if a parcel is subject to active litigation, title disputes, or judicial stay orders prohibiting sale.",
        "parameters": {
            "type": "object",
            "properties": {
                "ulpin": {"type": "string", "description": "The ULPIN of the parcel"}
            },
            "required": ["ulpin"]
        }
    },
    {
        "name": "get_parcels_in_area",
        "description": "Analyze multiple parcels within a selected GIS region or list of ULPINs, returning aggregated statistics.",
        "parameters": {
            "type": "object",
            "properties": {
                "ulpins": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "List of ULPINs to analyze, e.g. ['UL001', 'UL002']"
                }
            },
            "required": ["ulpins"]
        }
    },
    {
        "name": "search_parcels_by_owner",
        "description": "Search land records by owner name to find all associated ULPINs and properties.",
        "parameters": {
            "type": "object",
            "properties": {
                "owner_name": {"type": "string", "description": "Full or partial name of the landowner"}
            },
            "required": ["owner_name"]
        }
    }
]

@router.get("/tools", summary="Get OpenAI/Gemini/LangChain compatible tool definitions for Member 3's AI Agent")
def get_ai_tools_manifest() -> Dict[str, Any]:
    """Returns the standardized JSON schema tool definitions for Member 3's LLM Agent."""
    return {
        "provider": "LandStack Integration Hub",
        "version": "1.0.0",
        "tools_count": len(TOOL_DEFINITIONS),
        "tools": TOOL_DEFINITIONS,
        "instructions": (
            "Member 3 AI Agent should invoke these tools via POST /api/ai-agent/execute-tool "
            "or direct REST endpoints to retrieve authoritative land records without direct DB access."
        )
    }

@router.post("/execute-tool", summary="Execute any LandStack tool dynamically on behalf of the AI Agent")
def execute_ai_tool(req: ToolExecuteRequest, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Dynamic tool dispatcher enabling Member 3's AI Agent to execute tools securely."""
    tool = req.tool_name
    args = req.arguments

    if tool == "get_unified_parcel_profile":
        ulpin = args.get("ulpin")
        if not ulpin:
            raise HTTPException(status_code=400, detail="Missing required argument 'ulpin'")
        profile = get_unified_parcel_profile(ulpin, db)
        return {"result": profile.model_dump()}

    elif tool == "get_parcel_details":
        ulpin = args.get("ulpin")
        p = db.query(Parcel).filter(Parcel.ulpin == ulpin).first()
        if not p:
            return {"error": f"Parcel '{ulpin}' not found."}
        return {
            "ulpin": p.ulpin,
            "gis_area_acres": p.gis_area_acres,
            "survey_number": p.survey_number,
            "village": p.village,
            "taluk": p.taluk,
            "district": p.district,
            "centroid": [p.centroid_lat, p.centroid_lng]
        }

    elif tool == "get_ror":
        ulpin = args.get("ulpin")
        r = db.query(RoR).filter(RoR.ulpin == ulpin).first()
        if not r:
            return {"error": f"RoR record for '{ulpin}' not found."}
        return {
            "ulpin": r.ulpin,
            "primary_owner": r.primary_owner,
            "document_area_acres": r.document_area_acres,
            "khata_number": r.khata_number,
            "land_type": r.land_type,
            "mutated_date": r.mutated_date
        }

    elif tool == "get_tax_status":
        ulpin = args.get("ulpin")
        t = db.query(Tax).filter(Tax.ulpin == ulpin).order_by(Tax.id.desc()).first()
        if not t:
            return {"error": f"Tax record for '{ulpin}' not found."}
        return {
            "ulpin": t.ulpin,
            "assessment_year": t.assessment_year,
            "payment_status": t.payment_status.value,
            "property_tax_due": t.property_tax_due,
            "total_paid": t.total_paid,
            "receipt_number": t.receipt_number
        }

    elif tool == "get_encumbrance_status":
        ulpin = args.get("ulpin")
        e = db.query(Encumbrance).filter(Encumbrance.ulpin == ulpin).order_by(Encumbrance.id.desc()).first()
        if not e:
            return {"status": "NONE", "has_encumbrance": False}
        return {
            "ulpin": e.ulpin,
            "has_encumbrance": e.has_encumbrance,
            "bank_name": e.bank_name,
            "mortgage_amount": e.mortgage_amount,
            "status": e.status.value,
            "remarks": e.remarks
        }

    elif tool == "get_court_cases":
        ulpin = args.get("ulpin")
        c = db.query(CourtCase).filter(CourtCase.ulpin == ulpin).first()
        if not c or not c.has_litigation:
            return {"has_litigation": False, "stay_order_active": False, "status": "CLEAR"}
        return {
            "ulpin": c.ulpin,
            "has_litigation": c.has_litigation,
            "case_number": c.case_number,
            "court_name": c.court_name,
            "stay_order_active": c.stay_order_active,
            "case_status": c.case_status.value,
            "case_summary": c.case_summary
        }

    elif tool == "get_parcels_in_area":
        ulpins = args.get("ulpins", [])
        res = perform_area_analysis(ulpins, db)
        return {"result": res.model_dump()}

    elif tool == "search_parcels_by_owner":
        owner_name = args.get("owner_name", "")
        records = db.query(RoR).filter(RoR.primary_owner.ilike(f"%{owner_name}%")).all()
        results = [
            {"ulpin": r.ulpin, "owner": r.primary_owner, "document_area_acres": r.document_area_acres, "khata": r.khata_number}
            for r in records
        ]
        return {"found_count": len(results), "matches": results}

    else:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Unknown AI tool '{tool}'."
        )
