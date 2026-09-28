import re
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.parcel import Parcel
from app.models.ror import RoR
from app.models.registration import Registration
from app.models.tax import Tax, TaxPaymentStatus
from app.models.encumbrance import Encumbrance, EncumbranceStatus
from app.models.land_use import LandUse
from app.models.building_permit import BuildingPermit
from app.models.court_case import CourtCase, CourtCaseStatus
from app.services.profile_service import get_unified_parcel_profile, perform_area_analysis
from app.config import settings
from pydantic import BaseModel

def _call_gemini_llm(prompt: str) -> Optional[str]:
    """Optional external LLM call (Gemini) when API key is configured."""
    import os
    import requests
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("LLM_API_KEY") or getattr(settings, "LLM_API_KEY", "")
    if not api_key:
        return None
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
        headers = {"Content-Type": "application/json"}
        payload = {
            "contents": [{
                "parts": [{"text": (
                    "You are the LandStack AI Land Governance Copilot for authorized revenue officers in India. "
                    "Answer the following question clearly, authoritatively, and concisely using Indian land record and revenue administration principles.\n\n"
                    f"Question: {prompt}"
                )}]
            }],
            "generationConfig": {"temperature": 0.2, "maxOutputTokens": 600}
        }
        res = requests.post(url, json=payload, headers=headers, timeout=8)
        if res.status_code == 200:
            data = res.json()
            candidates = data.get("candidates", [])
            if candidates:
                parts = candidates[0].get("content", {}).get("parts", [])
                if parts and "text" in parts[0]:
                    return parts[0]["text"].strip()
    except Exception:
        pass
    return None

router = APIRouter(prefix="/ai-agent", tags=["AI Agent Tools (Member 3 Integration)"])

class ToolExecuteRequest(BaseModel):
    tool_name: str
    arguments: Dict[str, Any]

class AgentChatRequest(BaseModel):
    question: str
    ulpin: Optional[str] = None
    ulpins: Optional[List[str]] = None

class AgentChatResponse(BaseModel):
    answer: str
    parcel_ids: List[str]
    action: Optional[str] = None
    sources: List[str] = []
    warnings: List[str] = []
    parcels_data: Optional[List[Dict[str, Any]]] = None

TOOL_DEFINITIONS = [
    {
        "name": "get_unified_parcel_profile",
        "description": "Fetch the complete unified 360-degree profile for one or more land parcels by ULPIN including ownership, taxes, encumbrances, court stays, zoning, permits, and calculated risk anomalies.",
        "parameters": {
            "type": "object",
            "properties": {
                "ulpin": {"type": "string", "description": "The unique land parcel identification number, e.g. 'UL001'"},
                "ulpins": {"type": "array", "items": {"type": "string"}, "description": "Optional list of multiple ULPINs"}
            }
        }
    },
    {
        "name": "get_multiple_parcels_details",
        "description": "Fetch unified 360-degree profiles, legal status, and risk summaries for multiple land parcels simultaneously by their ULPINs.",
        "parameters": {
            "type": "object",
            "properties": {
                "ulpins": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "List of ULPIN identifiers, e.g. ['UL001', 'UL002']"
                }
            },
            "required": ["ulpins"]
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
                    "description": "List of ULPINs to analyze"
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
    },
    {
        "name": "search_parcels_by_filter",
        "description": "Bulk-search and filter parcels by location (village/taluk/district) and status (court_status, tax_status, encumbrance_status, risk_level). Use this for queries like 'parcels with no court cases in Karjat' or 'tax defaulters in Raigad'.",
        "parameters": {
            "type": "object",
            "properties": {
                "village": {"type": "string", "description": "Filter by village name (partial match)"},
                "taluk": {"type": "string", "description": "Filter by taluk name (partial match)"},
                "district": {"type": "string", "description": "Filter by district name (partial match)"},
                "court_status": {"type": "string", "description": "Filter: 'NO_LITIGATION', 'STAY_GRANTED', 'PENDING'"},
                "tax_status": {"type": "string", "description": "Filter: 'PAID', 'DUE', 'DEFAULTED'"},
                "encumbrance_status": {"type": "string", "description": "Filter: 'NONE', 'ACTIVE', 'DISCHARGED'"},
                "risk_level": {"type": "string", "description": "Filter: 'CLEAN', 'LOW_RISK', 'MODERATE_RISK', 'HIGH_RISK', 'BLOCKED'"},
                "limit": {"type": "integer", "description": "Max results to return (default 50, max 200)"}
            }
        }
    },
    {
        "name": "list_all_parcels_summary",
        "description": "Get a high-level governance summary of ALL parcels - total counts, risk breakdowns, litigated vs clean, tax defaulters, encumbrances, district-wise distribution.",
        "parameters": {
            "type": "object",
            "properties": {}
        }
    }
]

@router.get("/tools", summary="Get OpenAI/Gemini/LangChain compatible tool definitions for Member 3 AI Agent")
def get_ai_tools_manifest() -> Dict[str, Any]:
    return {
        "provider": "LandStack Integration Hub",
        "version": "2.0.0",
        "tools_count": len(TOOL_DEFINITIONS),
        "tools": TOOL_DEFINITIONS,
        "instructions": (
            "Member 3 AI Agent should invoke these tools via POST /api/ai-agent/execute-tool "
            "or direct REST endpoints to retrieve authoritative land records without direct DB access. "
            "For bulk/area queries use search_parcels_by_filter. For summaries use list_all_parcels_summary."
        )
    }

@router.post("/execute-tool", summary="Execute any LandStack tool dynamically on behalf of the AI Agent")
def execute_ai_tool(req: ToolExecuteRequest, db: Session = Depends(get_db)) -> Dict[str, Any]:
    return _dispatch_tool(req.tool_name, req.arguments, db)

@router.post("/tools", summary="Execute any LandStack tool (frontend-facing alias)")
def execute_ai_tool_frontend(req: ToolExecuteRequest, db: Session = Depends(get_db)) -> Dict[str, Any]:
    return _dispatch_tool(req.tool_name, req.arguments, db)

@router.post("/chat", summary="Chat with LandStack AI Governance Agent (Single or Multiple Parcels)", response_model=AgentChatResponse)
@router.post("/ask", summary="Chat with LandStack AI Governance Agent (Alias)", response_model=AgentChatResponse)
def chat_with_agent(req: AgentChatRequest, db: Session = Depends(get_db)) -> AgentChatResponse:
    q = (req.question or "").strip()
    if not q:
        return AgentChatResponse(
            answer="Please enter a valid land governance question.",
            parcel_ids=[],
            warnings=["Empty question received."]
        )

    q_lower = q.lower()

    if any(k in q_lower for k in ["write", "modify", "delete", "approve", "update", "change", "assign", "amend"]):
        return AgentChatResponse(
            answer="LandStack Agent is strictly read-only. It cannot modify land registry records or approve title changes.",
            parcel_ids=[],
            warnings=["Read-only guardrail enforced."]
        )

    if "legal" in q_lower:
        return AgentChatResponse(
            answer="Legal interpretation requires authorized judicial or revenue court review. The AI Agent provides factual land record extracts only.",
            parcel_ids=[],
            warnings=["Unsupported legal conclusion avoided."]
        )

    # ── 1. Domain & Governance Conceptual Knowledge Engine ────────────────
    # Answers general, educational, legal, and platform governance questions
    is_concept_query = any(k in q_lower for k in [
        "what is", "what are", "what does", "define", "explain", "how does", "meaning of",
        "difference between", "tell me about the concept", "who are you", "what can you do", "help"
    ]) or q_lower in ["hi", "hello", "hey", "help", "capabilities"]

    if "ulpin" in q_lower or "bhu-aadhaar" in q_lower or "bhu aadhaar" in q_lower:
        if not re.search(r"UL\d+|ULPIN[-A-Z0-9]+|P\d{4}", q, re.IGNORECASE):
            return AgentChatResponse(
                answer=(
                    "### 🆔 What is ULPIN (Bhu-Aadhaar)?\n\n"
                    "**ULPIN** (*Unique Land Parcel Identification Number*), also known as **Bhu-Aadhaar**, is a 14-digit alphanumeric code assigned to every surveyed land parcel in India under the **Digital India Land Records Modernization Programme (DILRMP)**.\n\n"
                    "**Key Characteristics:**\n"
                    "• **Geo-Referenced Pinning**: Derived from the longitude and latitude coordinates of the land parcel's boundary vertices (centroid & polygon nodes) using EPSG:4326 PostGIS standard.\n"
                    "• **Single Source of Truth**: Integrates Cadastral Map polygons with Revenue RoR (7/12 / Pahani), Deed Registration, and Property Tax databases.\n"
                    "• **Fraud Prevention**: Eliminates duplicate registration, bogus titles, and illegal double-mortgaging of land across commercial banks.\n"
                    "• **Format Example**: `ULPIN-DEMO-000001` or standard state code sequence."
                ),
                parcel_ids=[],
                sources=["dilrmp_guidelines", "bhu_aadhaar_standard"],
                warnings=[]
            )

    if any(k in q_lower for k in ["7/12", "7 12", "pahani", "record of rights", "ror", "khata", "jamabandi", "patta"]):
        if not re.search(r"UL\d+|ULPIN[-A-Z0-9]+|P\d{4}", q, re.IGNORECASE):
            return AgentChatResponse(
                answer=(
                    "### 📜 Record of Rights (RoR / 7/12 / Pahani)\n\n"
                    "The **Record of Rights (RoR)** is the foundational revenue title register maintained by State Revenue Departments (known as **7/12 Extract** in Maharashtra & Gujarat, **RTC/Pahani** in Karnataka, and **Jamabandi** in North India).\n\n"
                    "**Components:**\n"
                    "• **Village Form VII (Title & Rights)**: Records primary landowner names, father/husband names, ancestral shares, survey & hissa numbers, tenure type, and government charges.\n"
                    "• **Village Form XII (Crop & Land Use)**: Records seasonal agricultural crops, uncultivated/fallow acreage, irrigation source, and DC-conversion non-agricultural status.\n"
                    "• **Khata Number**: Unique ledger account number identifying the landowner within the Tehsil revenue circle."
                ),
                parcel_ids=[],
                sources=["revenue_code", "dept_ror"],
                warnings=[]
            )

    if any(k in q_lower for k in ["what is encumbrance", "what is an encumbrance", "define encumbrance", "what does encumbrance mean", "encumbrance certificate", "what is mortgage", "what is lien"]):
        return AgentChatResponse(
            answer=(
                "### 🏦 Encumbrances & Encumbrance Certificates (EC)\n\n"
                "An **Encumbrance** is any financial charge, mortgage, lien, or legal liability registered against a land parcel that restricts its clean sale or title transfer.\n\n"
                "**Key Concepts:**\n"
                "• **Bank Mortgage**: Registered under Section 58 of Transfer of Property Act when a landowner borrows against property deeds.\n"
                "• **Encumbrance Certificate (EC / Form 15)**: Official search document issued by the Sub-Registrar of Assurances showing all registered transactions, charges, and mortgages over a specified historical period (typically 12–30 years).\n"
                "• **Form 16 (Nil Encumbrance Certificate)**: Issued when no registered charges or liabilities exist, indicating a clear financial title."
            ),
            parcel_ids=[],
            sources=["transfer_of_property_act", "dept_banking"],
            warnings=[]
        )

    if any(k in q_lower for k in ["mutation", "dakhil kharij", "namantaran"]):
        return AgentChatResponse(
            answer=(
                "### 🔄 Land Mutation (Dakhil Kharij / Namantaran)\n\n"
                "**Mutation** is the formal administrative entry made in the Revenue Department's Record of Rights (RoR) transferring title ownership from one individual to another following:\n"
                "1. Registered Sale Deed\n"
                "2. Inheritance or Succession\n"
                "3. Gift Deed or Partition Deed\n"
                "4. Civil Court Decree or Auction\n\n"
                "**Critical Legal Distinction:**\n"
                "• **Deed Registration** (Sub-Registrar Office) confers legal ownership rights between parties.\n"
                "• **Mutation** (Tahsildar / Revenue Inspector) updates government tax records and fiscal liability. Both steps are legally required."
            ),
            parcel_ids=[],
            sources=["revenue_manual", "land_mutation_rules"],
            warnings=[]
        )

    if any(k in q_lower for k in ["stay order", "court stay", "injunction", "lis pendens", "section 145"]):
        if not any(w in q_lower for w in ["who has", "which parcels", "list", "show"]):
            return AgentChatResponse(
                answer=(
                    "### ⚖️ Court Stays, Injunctions & Lis Pendens\n\n"
                    "A **Stay Order / Temporary Injunction** is a judicial restraint order issued by a Civil Court or Revenue Tribunal under Order 39 of the Code of Civil Procedure (CPC).\n\n"
                    "**Legal Implications for Land:**\n"
                    "• **Prohibition of Sale / Transfer**: Restrains the landowner or developer from creating third-party rights, executing sale deeds, or mortgaging the land.\n"
                    "• **Lis Pendens (Section 52, Transfer of Property Act)**: Any transfer of property during the pendency of a title suit is subject to the final decree of the court.\n"
                    "• **Section 145 CrPC**: Executive Magistrate proceedings where an urgent land possession dispute risks a breach of public peace."
                ),
                parcel_ids=[],
                sources=["cpc_order_39", "dept_judiciary"],
                warnings=[]
            )

    if any(k in q_lower for k in ["what is discrepancy", "what is area discrepancy", "what is an anomaly", "what is survey mismatch", "explain discrepancy"]):
        return AgentChatResponse(
            answer=(
                "### 📐 GIS Boundary vs Title Document Area Discrepancy\n\n"
                "An **Area Discrepancy** occurs when the physical boundary acreage computed from satellite GIS/cadastral polygon coordinates diverges from the legal document area recorded in registered revenue deeds (RoR/Pahani).\n\n"
                "**Common Root Causes:**\n"
                "• Historical manual chain/tape survey measurement errors\n"
                "• Physical boundary encroachment by neighboring landowners\n"
                "• Unrecorded government road widening, railway acquisitions, or waterbody erosion\n"
                "• Unapproved sub-divisions or unrecorded family partitions\n\n"
                "**LandStack Risk Thresholds:**\n"
                "• **Difference ≤ 0.05 acres**: Tolerable survey variance (Clean/Low Risk)\n"
                "• **0.05 – 0.25 acres**: Moderate anomaly requiring verification\n"
                "• **> 0.25 acres**: Severe boundary risk requiring resurvey before transaction"
            ),
            parcel_ids=[],
            sources=["gis_cadastral_standards", "anomaly_engine"],
            warnings=[]
        )

    if any(k in q_lower for k in ["what is landstack", "about landstack", "how does landstack work", "what does landstack do", "overview of landstack"]):
        return AgentChatResponse(
            answer=(
                "### 🛡️ LandStack Central Governance Engine\n\n"
                "**LandStack** is an enterprise unified land intelligence platform connecting state GIS boundary maps, Revenue RoR registers, Deed Registration, Property Tax assessments, Bank Mortgages, and Civil Court registries into a single authoritative dashboard.\n\n"
                "**Key Subsystems:**\n"
                "1. **360° Unified Parcel Profile**: Merges spatial polygons with multi-department legal, financial, and tax records.\n"
                "2. **Autonomous Anomaly & Risk Detector**: Flags boundary encroachments, tax arrears, active court injunctions, and mortgage liens in real time.\n"
                "3. **AI Governance Copilot**: Answers officer queries, cross-checks title histories, filters defaulters, and evaluates transaction safety."
            ),
            parcel_ids=[],
            sources=["landstack_architecture_spec"],
            warnings=[]
        )

    if any(k in q_lower for k in ["risk level", "risk levels", "how is risk calculated", "risk score"]):
        if not any(w in q_lower for w in ["which", "who", "list", "parcels"]):
            return AgentChatResponse(
                answer=(
                    "### 🚦 LandStack Autonomous Risk Scoring Engine\n\n"
                    "LandStack computes a dynamic 0–100 risk score for every parcel across 5 risk tiers:\n\n"
                    "• **🟢 CLEAN (Score 0)**: Flawless title, zero encumbrance, tax paid, matching GIS/RoR areas, no litigation. Safe for transaction.\n"
                    "• **🔵 LOW RISK (Score 1–29)**: Minor documentation variance or trivial tax dues. Safe with standard advisory.\n"
                    "• **🟡 MODERATE RISK (Score 30–59)**: Active bank mortgage, overdue property tax, or 0.05–0.25 acre boundary discrepancy.\n"
                    "• **🟠 HIGH RISK (Score 60–79)**: Active civil litigation, severe area discrepancy (>0.25 acres), or defaulted tax arrears.\n"
                    "• **🔴 BLOCKED (Score 80–100)**: Active judicial court stay order or injunction prohibiting sale. Transaction legally prohibited."
                ),
                parcel_ids=[],
                sources=["risk_engine_spec"],
                warnings=[]
            )

    if any(k in q_lower for k in ["hello", "hi", "hey", "who are you", "what can you do", "help"]) and len(q_lower.split()) <= 4:
        return AgentChatResponse(
            answer=(
                "### 👋 Hello! I am the LandStack AI Land Governance Copilot.\n\n"
                "I assist authorized revenue officers, sub-registrars, and land administrators with:\n\n"
                "• **🔍 360° Parcel Audits**: e.g., *'Audit UL001'*, *'Check Survey 104/1'*, *'Status of UL002'*\n"
                "• **⚖️ Court Litigation**: e.g., *'Show parcels with active stay orders'*, *'Court cases in Karjat'*\n"
                "• **🏦 Bank Encumbrances**: e.g., *'Which parcels have active mortgages?'*, *'Check bank lien on UL004'*\n"
                "• **⚠️ Tax Defaulters**: e.g., *'List tax defaulters'*, *'Who has unpaid property taxes?'*\n"
                "• **📐 Boundary Discrepancies**: e.g., *'Detect area discrepancies between GIS and RoR'*\n"
                "• **👤 Landowner Portfolio**: e.g., *'Who is Ravi Kumar?'*, *'Parcels owned by Anita Sharma'*\n"
                "• **📍 Village & Region Filters**: e.g., *'Parcels in Kengeri'*, *'Overview of Karjat registry'*\n"
                "• **📚 Land Record Concepts**: e.g., *'What is ULPIN?'*, *'Explain 7/12 extract'*, *'What is mutation?'*"
            ),
            parcel_ids=[],
            sources=["copilot_manifest"],
            warnings=[]
        )

    # ── 2. Explicit Parcel Lookup by ULPIN or Survey Number ──────────────
    found_ulpins = [u.upper() for u in re.findall(r"UL\d+|ULPIN[-A-Z0-9]+|P\d{4}", q, re.IGNORECASE)]

    # Detect Survey Numbers (e.g. "104/1", "104/2", "12/1", "survey 104/1", "survey no 19/3")
    if not found_ulpins:
        survey_matches = re.findall(r"\b(\d{1,4}/\d{1,4}[A-Za-z]?)\b", q)
        if not survey_matches:
            s_word_match = re.search(r"\bsurvey\s*(?:no\.?|number)?\s*([0-9A-Za-z\/\-]+)", q, re.IGNORECASE)
            if s_word_match:
                survey_matches = [s_word_match.group(1)]
        for sm in survey_matches:
            matched_p = db.query(Parcel).filter(Parcel.survey_number.ilike(f"%{sm}%")).first()
            if matched_p and matched_p.ulpin not in found_ulpins:
                found_ulpins.append(matched_p.ulpin)

    # Detect if user is asking for all parcels in registry / study area
    is_all_parcels = any(k in q_lower for k in [
        "all parcels", "all the parcels", "all of the parcels", "every parcel",
        "details all", "details of all", "list parcels", "list all parcels", "list of all parcels",
        "show all parcels", "show all the parcels", "parcels list", "all plots", "all the plots",
        "parcels in the area", "parcels in area", "entire registry", "all land", "audit all parcels",
        "get the details all the parcels", "get details of all parcels", "all parcel details"
    ]) or bool(re.search(r"\b(?:all\s+(?:the\s+)?parcels?|details\s+(?:of\s+)?all(?:\s+the)?(?:\s+parcels?)?|every\s+parcel|list\s+(?:all\s+)?parcels?)\b", q_lower))

    if is_all_parcels:
        total_p = db.query(Parcel).count()
        total_stays = db.query(CourtCase).filter(CourtCase.stay_order_active == True).count()
        total_court = db.query(CourtCase).filter(CourtCase.has_litigation == True).count()
        total_enc = db.query(Encumbrance).filter(Encumbrance.has_encumbrance == True).count()
        total_tax_def = db.query(Tax).filter(Tax.payment_status.in_([TaxPaymentStatus.DEFAULTED, TaxPaymentStatus.DUE])).count()

        # Query active representative / benchmark parcels
        all_db_parcels = db.query(Parcel).limit(10).all()
        target_ulpins = [p.ulpin for p in all_db_parcels]

        parcels_info = []
        table_rows = []
        for p in all_db_parcels:
            try:
                prof = get_unified_parcel_profile(p.ulpin, db).model_dump()
                parcels_info.append(prof)
                r_summary = prof.get("risk_summary") or {}
                raw_risk = r_summary.get("risk_level", "CLEAN")
                r_level = raw_risk.value if hasattr(raw_risk, "value") else str(raw_risk).replace("RiskLevel.", "")
                ror = prof.get("ror") or {}
                owner = ror.get("primary_owner", "Registry Record")
                doc_area = ror.get("document_area_acres", p.gis_area_acres)
                court = prof.get("court") or {}
                stay = court.get("stay_order_active", False)
                enc = prof.get("encumbrance") or {}
                has_enc = enc.get("has_encumbrance", False)
                tax = prof.get("tax") or {}
                raw_tax_st = tax.get("payment_status", "PAID")
                tax_st = raw_tax_st.value if hasattr(raw_tax_st, "value") else str(raw_tax_st).replace("TaxPaymentStatus.", "")

                status_tag = "✅ Clean Title"
                if stay:
                    status_tag = "🚨 Stay Order"
                elif has_enc:
                    status_tag = "🏦 Mortgaged"
                elif tax_st in ["DUE", "DEFAULTED"]:
                    status_tag = "⚠️ Tax Due"

                table_rows.append(
                    f"| `{p.ulpin}` | `{p.survey_number}` | {owner[:20]} | {p.gis_area_acres:.2f} ac | {doc_area:.2f} ac | **{r_level}** | {status_tag} |"
                )
            except Exception:
                table_rows.append(
                    f"| `{p.ulpin}` | `{p.survey_number}` | Active Registry Record | {p.gis_area_acres:.2f} ac | — | **CLEAN** | ✅ Active |"
                )

        table_md = (
            "| ULPIN | Survey No | Primary Owner | GIS Area | Doc Area | Risk Level | Status |\n"
            "| :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n"
            + "\n".join(table_rows)
        )

        reply = (
            f"### 📋 Multi-Parcel Registry Audit Report ({total_p:,} Total Registered Parcels)\n\n"
            f"Here are the details for all registered land parcels in the LandStack registry:\n\n"
            f"• **Total Registered Land Parcels**: **{total_p:,} parcels**\n"
            f"• **Active Court Stays / Injunctions**: **{total_stays} parcels** (Restrained from conveyance)\n"
            f"• **Civil Disputes / Litigations**: **{total_court} parcels** under judicial dispute\n"
            f"• **Commercial Bank Mortgages / Liens**: **{total_enc} parcels** with registered financial charges\n"
            f"• **Property Tax Arrears**: **{total_tax_def} parcels** with pending revenue dues\n\n"
            f"#### 🔍 Parcel Details & Verification Table:\n\n"
            f"{table_md}\n\n"
            f"💡 *Tip: Ask `\"Audit <ULPIN>\"` or `\"Is Survey <No> safe to buy?\"` for deep cross-department inspection of any individual parcel.*"
        )
        return AgentChatResponse(
            answer=reply,
            parcel_ids=target_ulpins,
            action="highlight" if ("highlight" in q_lower or "map" in q_lower) else None,
            sources=["get_multiple_parcels_details", "database"],
            warnings=[],
            parcels_data=parcels_info,
        )

    # Contextual fallback to currently selected parcel only if query refers to specific parcel context AND NOT an all-parcels request
    if not found_ulpins and not is_all_parcels and req.ulpins:
        if any(w in q_lower for w in ["this", "selected", "current", "here", "it"]) or (any(w in q_lower for w in ["inspect", "check", "verify", "audit", "status"]) and not any(w in q_lower for w in ["all", "every", "list", "parcels"])):
            for u in req.ulpins:
                u_clean = u.upper().strip()
                if u_clean and u_clean not in found_ulpins:
                    found_ulpins.append(u_clean)
    if not found_ulpins and not is_all_parcels and req.ulpin:
        if any(w in q_lower for w in ["this", "selected", "current", "here", "it"]) or (any(w in q_lower for w in ["inspect", "check", "verify", "audit", "status"]) and not any(w in q_lower for w in ["all", "every", "list", "parcels"])):
            found_ulpins.append(req.ulpin.upper().strip())

    found_ulpins = list(dict.fromkeys(found_ulpins))

    # ── Multi-Parcel Comparative Audit ──────────────────────────────────
    if len(found_ulpins) > 1:
        parcels_info = []
        detail_lines = []
        warnings = []
        for u in found_ulpins:
            try:
                prof = get_unified_parcel_profile(u, db).model_dump()
                parcels_info.append(prof)
                r_summary = prof.get("risk_summary") or {}
                raw_risk = r_summary.get("risk_level", "CLEAN")
                r_level = raw_risk.value if hasattr(raw_risk, "value") else str(raw_risk).replace("RiskLevel.", "")
                r_score = r_summary.get("risk_score", 0)
                ror = prof.get("ror") or {}
                owner = ror.get("primary_owner", "Unknown")
                doc_area = ror.get("document_area_acres")
                p_obj = prof.get("parcel") or {}
                gis_area = p_obj.get("gis_area_acres")
                court = prof.get("court") or {}
                stay = court.get("stay_order_active", False)
                enc = prof.get("encumbrance") or {}
                has_enc = enc.get("has_encumbrance", False)
                tax = prof.get("tax") or {}
                raw_tax_st = tax.get("payment_status", "PAID")
                tax_st = raw_tax_st.value if hasattr(raw_tax_st, "value") else str(raw_tax_st).replace("TaxPaymentStatus.", "")

                flags = []
                if stay:
                    flags.append("🚨 Active Stay Order")
                if has_enc:
                    flags.append("🏦 Bank Encumbrance")
                if tax_st in ["DUE", "DEFAULTED"]:
                    flags.append(f"⚠️ Tax {tax_st}")

                flags_str = f" | Flags: {', '.join(flags)}" if flags else " | Title Clean"

                detail_lines.append(
                    f"• **Parcel `{u}`** (Survey `{p_obj.get('survey_number', 'N/A')}`): Owner **{owner}**, GIS Area {gis_area} ac (Doc: {doc_area} ac) | "
                    f"Risk: **{r_level}** ({r_score}/100){flags_str}"
                )
            except Exception:
                warnings.append(f"Parcel record not found for {u}.")
                detail_lines.append(f"• **Parcel `{u}`**: Record not found in land registry.")

        reply = f"### LandStack Comparative Audit Report ({len(found_ulpins)} Parcels)\n\n" + "\n".join(detail_lines)
        return AgentChatResponse(
            answer=reply,
            parcel_ids=found_ulpins,
            action="highlight" if ("highlight" in q_lower or "map" in q_lower) else None,
            sources=["unified_parcel_profile", "database"],
            warnings=warnings,
            parcels_data=parcels_info,
        )

    # ── Single Parcel Detailed or Targeted Inspection ──────────────────
    if len(found_ulpins) == 1:
        u = found_ulpins[0]
        try:
            prof = get_unified_parcel_profile(u, db).model_dump()
            r_summary = prof.get("risk_summary") or {}
            ror = prof.get("ror") or {}
            p_obj = prof.get("parcel") or {}
            court = prof.get("court") or {}
            enc = prof.get("encumbrance") or {}
            tax = prof.get("tax") or {}
            bp = prof.get("building_permit") or {}
            lu = prof.get("land_use") or {}

            r_level_val = r_summary.get('risk_level') or 'CLEAN'
            r_level_str = r_level_val.value if hasattr(r_level_val, 'value') else str(r_level_val).replace('RiskLevel.', '')
            enc_status = enc.get('status', 'NONE')
            enc_status_str = enc_status.value if hasattr(enc_status, 'value') else str(enc_status).replace('EncumbranceStatus.', '')
            tax_status = tax.get('payment_status', 'PAID')
            tax_status_str = tax_status.value if hasattr(tax_status, 'value') else str(tax_status).replace('TaxPaymentStatus.', '')

            # Check if user asked for a targeted aspect of the parcel
            if any(k in q_lower for k in ["tax", "taxes", "property tax", "tax status", "paid tax", "tax due"]):
                reply = (
                    f"### 💰 Tax Assessment for Parcel `{u}`\n\n"
                    f"• **Status**: **{tax_status_str}**\n"
                    f"• **Owner**: {ror.get('primary_owner', 'Unknown')} (Khata: `{ror.get('khata_number', 'N/A')}`)\n"
                    f"• **Property Tax Due**: ₹{float(tax.get('property_tax_due', 0)):,.2f}\n"
                    f"• **Cess & Penalties**: ₹{float((tax.get('cess_amount', 0) or 0) + (tax.get('penalties', 0) or 0)):,.2f}\n"
                    f"• **Total Paid**: ₹{float(tax.get('total_paid', 0)):,.2f}\n"
                    f"• **Assessment Year**: {tax.get('assessment_year', '2024-2025')}"
                )
            elif any(k in q_lower for k in ["encumbrance", "mortgage", "bank", "loan", "lien", "financial charge"]):
                reply = (
                    f"### 🏦 Encumbrance & Mortgage Status for Parcel `{u}`\n\n"
                    f"• **Status**: **{enc_status_str}**\n"
                    f"• **Has Encumbrance**: {'Yes, Active Charge' if enc.get('has_encumbrance') else 'No, Clean Title'}\n"
                    f"• **Bank / Lender**: {enc.get('bank_name', 'None')}\n"
                    f"• **Mortgage Amount**: ₹{float(enc.get('mortgage_amount', 0)):,.2f}\n"
                    f"• **Loan Account No**: `{enc.get('loan_account_no', 'N/A')}`\n"
                    f"• **Registration Date**: {enc.get('registration_date', 'N/A')}"
                )
            elif any(k in q_lower for k in ["court", "stay", "litigation", "dispute", "case", "injunction"]):
                stay_str = "🚨 Active Stay Order" if court.get('stay_order_active') else ("Active Civil Dispute" if court.get('has_litigation') else "✅ No Litigation")
                reply = (
                    f"### ⚖️ Court Litigation Status for Parcel `{u}`\n\n"
                    f"• **Litigation Status**: **{stay_str}**\n"
                    f"• **Case Number**: `{court.get('case_number', 'N/A')}`\n"
                    f"• **Court Name**: {court.get('court_name', 'N/A')}\n"
                    f"• **Petitioner**: {court.get('petitioner', 'N/A')}\n"
                    f"• **Stay Order Active**: {'🚨 YES — Title alienation prohibited' if court.get('stay_order_active') else 'No'}"
                )
            elif any(k in q_lower for k in ["who owns", "owner of", "owner", "khata", "father name", "pahani", "ror"]):
                reply = (
                    f"### 👤 Ownership & Title Record for Parcel `{u}`\n\n"
                    f"• **Primary Owner**: **{ror.get('primary_owner', 'Unknown')}**\n"
                    f"• **Father / Husband**: {ror.get('father_name', 'N/A')}\n"
                    f"• **Khata Number**: `{ror.get('khata_number', 'N/A')}`\n"
                    f"• **Survey Number**: `{p_obj.get('survey_number', 'N/A')}` (Village: {p_obj.get('village', 'N/A')})\n"
                    f"• **Document Area**: **{ror.get('document_area_acres', 'N/A')} acres** (GIS Physical: {p_obj.get('gis_area_acres', 'N/A')} acres)"
                )
            elif any(k in q_lower for k in ["area", "size", "acres", "discrepancy", "mismatch", "acreage"]):
                gis_a = float(p_obj.get('gis_area_acres') or 0)
                doc_a = float(ror.get('document_area_acres') or gis_a)
                diff = round(abs(gis_a - doc_a), 3)
                reply = (
                    f"### 📐 Acreage & Boundary Audit for Parcel `{u}`\n\n"
                    f"• **Physical GIS Satellite Area**: **{gis_a} acres**\n"
                    f"• **Registered Legal Title Area**: **{doc_a} acres**\n"
                    f"• **Area Discrepancy**: **{diff:+.2f} acres** ({'✅ Matching' if diff <= 0.05 else '⚠️ Discrepancy Alert'})\n"
                    f"• **Survey Number**: `{p_obj.get('survey_number', 'N/A')}`"
                )
            elif any(k in q_lower for k in ["safe", "can i buy", "verdict", "risk", "safe to buy"]):
                verdict = "✅ SAFE TO PROCEED" if r_summary.get('is_safe_for_transaction') else "⛔ TRANSACTION PROHIBITED / CAUTION"
                reply = (
                    f"### 🚦 Transaction Verdict for Parcel `{u}`: **{verdict}**\n\n"
                    f"• **Risk Level**: **{r_level_str}** (Score: {r_summary.get('risk_score', 0)}/100)\n"
                    f"• **Title Owner**: {ror.get('primary_owner', 'Unknown')}\n"
                    f"• **Court Stays**: {'🚨 ACTIVE STAY' if court.get('stay_order_active') else '✅ Clear'}\n"
                    f"• **Bank Encumbrance**: {'🏦 ACTIVE MORTGAGE' if enc.get('has_encumbrance') else '✅ Clear'}\n"
                    f"• **Tax Arrears**: {'⚠️ ' + tax_status_str if tax_status_str in ['DUE', 'DEFAULTED'] else '✅ Paid'}\n"
                    f"• **Boundary Variance**: {abs(float(p_obj.get('gis_area_acres') or 0) - float(ror.get('document_area_acres') or 0)):.2f} acres"
                )
            else:
                # Comprehensive 360-degree inspection report
                reply = (
                    f"### Land Inspection Report for `{u}`\n\n"
                    f"• **Owner**: {ror.get('primary_owner', 'Unknown')} (Father: {ror.get('father_name', 'N/A')}, Khata: {ror.get('khata_number', 'N/A')})\n"
                    f"• **Survey Number**: `{p_obj.get('survey_number', 'N/A')}` | Location: Village {p_obj.get('village', 'N/A')}, District {p_obj.get('district', 'N/A')}\n"
                    f"• **Area**: GIS {p_obj.get('gis_area_acres', 'N/A')} acres vs Document {ror.get('document_area_acres', 'N/A')} acres\n"
                    f"• **Risk Assessment**: **{r_level_str}** (Score: {r_summary.get('risk_score', 0)}/100) — "
                    f"{'✅ Safe for Transaction' if r_summary.get('is_safe_for_transaction') else '⛔ Caution / High Risk'}\n"
                    f"• **Court Litigation**: {'🚨 Active Stay Order' if court.get('stay_order_active') else ('Litigation Active' if court.get('has_litigation') else '✅ None')}\n"
                    f"• **Encumbrance**: {'🏦 ' + enc_status_str if enc.get('has_encumbrance') else '✅ None'}\n"
                    f"• **Tax Status**: {tax_status_str} (Dues: ₹{float(tax.get('property_tax_due', 0)):,.2f})\n"
                    f"• **Zoning / Land Use**: {lu.get('master_plan_zone', 'Agricultural')}\n"
                )

            return AgentChatResponse(
                answer=reply,
                parcel_ids=[u],
                action="highlight" if ("highlight" in q_lower or "map" in q_lower) else None,
                sources=["unified_parcel_profile"],
                warnings=[],
                parcels_data=[prof],
            )
        except Exception:
            return AgentChatResponse(
                answer=f"No land record was found for parcel `{u}` in the registry.",
                parcel_ids=[u],
                sources=["unified_parcel_profile"],
                warnings=[f"Parcel {u} not found."]
            )

    # ── 3. Search by Owner Name ──────────────────────────────────────────
    known_owners = [
        "ravi kumar", "lakshmi devi", "ramesh gowda", "venkatesh prasad",
        "anand rao", "horizon logistics", "anita sharma", "rahul patil",
        "priya singh", "santosh deshmukh"
    ]
    matched_owner_kw = next((name for name in known_owners if name in q_lower), None)
    if not matched_owner_kw:
        owner_name_search = re.search(r"(?:owner|owned by|who is|landowner|properties of|parcels of)\s+([A-Za-z\s]+)", q, re.IGNORECASE)
        if owner_name_search:
            matched_owner_kw = owner_name_search.group(1).strip().lower()

    if matched_owner_kw and len(matched_owner_kw) > 2:
        owner_records = (
            db.query(RoR, Parcel)
            .join(Parcel, RoR.ulpin == Parcel.ulpin)
            .filter(RoR.primary_owner.ilike(f"%{matched_owner_kw}%"))
            .all()
        )
        if owner_records:
            lines = []
            ids = []
            for r, p in owner_records:
                ids.append(r.ulpin)
                lines.append(
                    f"• **Parcel `{r.ulpin}`** (Survey `{p.survey_number}` in {p.village}, {p.district}): "
                    f"Registered Area: **{r.document_area_acres} acres** | Khata: `{r.khata_number}`"
                )
            reply = (
                f"### 👤 Landowner Registry Extract: **{owner_records[0][0].primary_owner}** ({len(owner_records)} Parcel(s) Found)\n\n"
                + "\n".join(lines)
            )
            return AgentChatResponse(
                answer=reply,
                parcel_ids=ids,
                action="highlight",
                sources=["ror", "parcels"],
                warnings=[]
            )

    # ── 4. Location-Based Queries (Village / Taluk / District) ───────────
    known_villages = ["kengeri", "karjat", "dahivali", "mudre", "posheri", "akurle", "bengaluru", "raigad"]
    matched_loc = next((v for v in known_villages if v in q_lower), None)
    if matched_loc:
        loc_parcels = (
            db.query(Parcel, RoR)
            .join(RoR, Parcel.ulpin == RoR.ulpin)
            .filter(
                (Parcel.village.ilike(f"%{matched_loc}%"))
                | (Parcel.taluk.ilike(f"%{matched_loc}%"))
                | (Parcel.district.ilike(f"%{matched_loc}%"))
            )
            .limit(10)
            .all()
        )
        if loc_parcels:
            total_loc_count = (
                db.query(Parcel)
                .filter(
                    (Parcel.village.ilike(f"%{matched_loc}%"))
                    | (Parcel.taluk.ilike(f"%{matched_loc}%"))
                    | (Parcel.district.ilike(f"%{matched_loc}%"))
                )
                .count()
            )
            ids = [p.ulpin for p, _ in loc_parcels]
            lines = [
                f"• **Parcel `{p.ulpin}`** (Survey `{p.survey_number}`): Owner **{r.primary_owner}** | Area: {p.gis_area_acres} acres"
                for p, r in loc_parcels
            ]
            loc_title = matched_loc.capitalize()
            reply = (
                f"### 📍 Land Parcels in **{loc_title}** ({total_loc_count} Total Registered)\n\n"
                f"Showing sample registered land holdings in {loc_title}:\n\n"
                + "\n".join(lines)
            )
            return AgentChatResponse(
                answer=reply,
                parcel_ids=ids,
                action="highlight",
                sources=["parcels", "ror"],
                warnings=[]
            )

    # ── 5. Tax Arrears & Defaulters Registry Query ───────────────────────
    is_tax_defaulter_query = (
        any(w in q_lower for w in [
            "havenot paid", "have not paid", "has not paid", "hasnt paid", "not paid",
            "unpaid tax", "tax unpaid", "tax due", "tax defaulter", "tax defaulters",
            "defaulter", "defaulters", "tax arrears", "pending tax", "who havenot", "who have not"
        ])
        or ("tax" in q_lower and any(w in q_lower for w in ["unpaid", "pending", "due", "default", "havenot", "not paid", "who"]))
    )

    if is_tax_defaulter_query:
        tax_records = (
            db.query(Tax, RoR, Parcel)
            .join(RoR, Tax.ulpin == RoR.ulpin)
            .join(Parcel, Tax.ulpin == Parcel.ulpin)
            .filter(Tax.payment_status.in_([TaxPaymentStatus.DEFAULTED, TaxPaymentStatus.DUE, TaxPaymentStatus.PARTIAL]))
            .order_by(Tax.property_tax_due.desc())
            .limit(25)
            .all()
        )
        if tax_records:
            lines = []
            ids = []
            parcels_info = []
            for t, r, p in tax_records:
                ids.append(t.ulpin)
                due_val = max(0.0, float((t.property_tax_due or 0) + (t.cess_amount or 0) + (t.penalties or 0) - (t.total_paid or 0)))
                status_str = t.payment_status.value if hasattr(t.payment_status, "value") else str(t.payment_status)
                lines.append(
                    f"• **Parcel `{t.ulpin}`** ({p.village}, {p.district}): Owner **{r.primary_owner}** (Khata: `{r.khata_number}`)\n"
                    f"  - Tax Status: **{status_str}** | Arrears / Due: **₹{due_val:,.2f}** | Total Paid: ₹{float(t.total_paid or 0):,.2f}"
                )
                parcels_info.append({
                    "ulpin": t.ulpin,
                    "owner": r.primary_owner,
                    "khata_number": r.khata_number,
                    "tax_status": status_str,
                    "due_amount": due_val,
                    "total_paid": t.total_paid,
                    "village": p.village,
                    "district": p.district
                })

            reply = (
                f"### ⚠️ Tax Arrears & Defaulters Registry Report ({len(tax_records)} Landowners Found)\n\n"
                f"The following land parcels currently have unpaid property taxes, defaults, or pending revenue arrears:\n\n"
                + "\n".join(lines)
            )
            return AgentChatResponse(
                answer=reply,
                parcel_ids=ids,
                action="highlight",
                sources=["tax", "ror", "parcels"],
                warnings=[],
                parcels_data=parcels_info
            )

    # ── 6. Active Litigation & Court Injunctions Query ───────────────────
    is_court_query = any(w in q_lower for w in [
        "court case", "court cases", "stay order", "stay orders", "litigation", "dispute", "injunction",
        "who has court", "parcels with court", "litigated", "active stay"
    ])

    if is_court_query:
        cases = (
            db.query(CourtCase, RoR, Parcel)
            .join(RoR, CourtCase.ulpin == RoR.ulpin)
            .join(Parcel, CourtCase.ulpin == Parcel.ulpin)
            .filter(CourtCase.has_litigation == True)
            .limit(20)
            .all()
        )
        if cases:
            lines = []
            ids = []
            for c, r, p in cases:
                ids.append(c.ulpin)
                stay_str = "🚨 Active Judicial Stay Order" if c.stay_order_active else "Active Civil Dispute"
                lines.append(
                    f"• **Parcel `{c.ulpin}`** ({p.village}, {p.district}): Owner **{r.primary_owner}**\n"
                    f"  - Case No: **{c.case_number or 'Case Registered'}** ({c.court_name or 'Sub-Court'})\n"
                    f"  - Status: **{stay_str}** | Petitioner: {c.petitioner or 'N/A'}"
                )
            reply = (
                f"### ⚖️ Active Litigation & Injunctions Report ({len(cases)} Parcels Found)\n\n"
                f"The following land parcels are currently subject to active judicial proceedings or stay orders:\n\n"
                + "\n".join(lines)
            )
            return AgentChatResponse(
                answer=reply,
                parcel_ids=ids,
                action="highlight",
                sources=["court_cases", "ror", "parcels"],
                warnings=[],
                parcels_data=[{"ulpin": c.ulpin, "case_number": c.case_number, "stay_active": c.stay_order_active} for c, _, _ in cases]
            )

    # ── 7. Encumbrance & Mortgage Registry Query ─────────────────────────
    is_encumbrance_query = any(w in q_lower for w in [
        "encumbrance", "encumbrances", "mortgage", "mortgages", "bank lien", "lien",
        "who has mortgage", "active mortgage", "parcels with mortgage"
    ])

    if is_encumbrance_query:
        encs = (
            db.query(Encumbrance, RoR, Parcel)
            .join(RoR, Encumbrance.ulpin == RoR.ulpin)
            .join(Parcel, Encumbrance.ulpin == Parcel.ulpin)
            .filter(Encumbrance.has_encumbrance == True)
            .limit(20)
            .all()
        )
        if encs:
            lines = []
            ids = []
            for e, r, p in encs:
                ids.append(e.ulpin)
                lines.append(
                    f"• **Parcel `{e.ulpin}`** ({p.village}, {p.district}): Owner **{r.primary_owner}**\n"
                    f"  - Bank: **{e.bank_name or 'Commercial Bank'}** (Loan Acc: `{e.loan_account_no or 'N/A'}`)\n"
                    f"  - Mortgage Amount: **₹{float(e.mortgage_amount or 0):,.2f}** | Status: **{e.status.value}**"
                )
            reply = (
                f"### 🏦 Active Encumbrance & Mortgage Registry Report ({len(encs)} Parcels Found)\n\n"
                f"The following land parcels have active bank mortgages or financial charges registered:\n\n"
                + "\n".join(lines)
            )
            return AgentChatResponse(
                answer=reply,
                parcel_ids=ids,
                action="highlight",
                sources=["encumbrance", "ror", "parcels"],
                warnings=[],
                parcels_data=[{"ulpin": e.ulpin, "bank": e.bank_name, "amount": e.mortgage_amount} for e, _, _ in encs]
            )

    # ── 8. Area Discrepancy & Boundary Anomaly Query ─────────────────────
    is_discrepancy_query = any(w in q_lower for w in [
        "discrepancy", "anomaly", "anomalies", "area mismatch", "mismatch", "encroachment"
    ])

    if is_discrepancy_query:
        parcels_all = db.query(Parcel, RoR).join(RoR, Parcel.ulpin == RoR.ulpin).limit(100).all()
        discrepancies = []
        for p, r in parcels_all:
            gis_a = float(p.gis_area_acres or 0)
            doc_a = float(r.document_area_acres or gis_a)
            diff = round(abs(gis_a - doc_a), 3)
            if diff > 0.05:
                discrepancies.append((p, r, gis_a, doc_a, diff))
        if discrepancies:
            discrepancies.sort(key=lambda x: x[4], reverse=True)
            lines = []
            ids = []
            for p, r, gis_a, doc_a, diff in discrepancies[:20]:
                ids.append(p.ulpin)
                lines.append(
                    f"• **Parcel `{p.ulpin}`** ({p.village}): Owner **{r.primary_owner}**\n"
                    f"  - Physical GIS: **{gis_a} acres** vs RoR Title: **{doc_a} acres** (Discrepancy: **{diff:+.2f} acres**)"
                )
            reply = (
                f"### 📐 GIS vs Legal Title Area Discrepancies ({len(discrepancies)} Detected)\n\n"
                f"The following parcels exhibit measurable area mismatch between GIS boundaries and registered revenue documents:\n\n"
                + "\n".join(lines)
            )
            return AgentChatResponse(
                answer=reply,
                parcel_ids=ids,
                action="highlight",
                sources=["parcels", "ror"],
                warnings=[],
                parcels_data=[{"ulpin": p.ulpin, "gis_area": gis_a, "doc_area": doc_a, "diff": diff} for p, _, gis_a, doc_a, diff in discrepancies[:20]]
            )

    # ── 9. Risk Level Filtering Query ────────────────────────────────────
    if any(k in q_lower for k in ["high risk", "blocked", "moderate risk", "clean title", "clean parcel", "safe parcel", "safe to buy"]):
        sample_parcels = db.query(Parcel).limit(30).all()
        matches = []
        for p in sample_parcels:
            try:
                prof = get_unified_parcel_profile(p.ulpin, db)
                r_level = prof.risk_summary.risk_level.value.lower()
                if "blocked" in q_lower and r_level == "blocked":
                    matches.append((p.ulpin, p.village, prof.ror.primary_owner, prof.risk_summary.risk_score, "BLOCKED"))
                elif "high risk" in q_lower and r_level in ["high_risk", "blocked"]:
                    matches.append((p.ulpin, p.village, prof.ror.primary_owner, prof.risk_summary.risk_score, "HIGH_RISK"))
                elif "moderate" in q_lower and r_level == "moderate_risk":
                    matches.append((p.ulpin, p.village, prof.ror.primary_owner, prof.risk_summary.risk_score, "MODERATE_RISK"))
                elif any(s in q_lower for s in ["clean", "safe"]) and r_level in ["clean", "low_risk"]:
                    matches.append((p.ulpin, p.village, prof.ror.primary_owner, prof.risk_summary.risk_score, "CLEAN / SAFE"))
            except Exception:
                pass
        if matches:
            lines = [f"• **Parcel `{m[0]}`** ({m[1]}): Owner **{m[2]}** | Risk Score: **{m[3]}/100** ({m[4]})" for m in matches[:15]]
            reply = f"### 🚦 Risk Evaluation Filter Results ({len(matches)} Parcels)\n\n" + "\n".join(lines)
            return AgentChatResponse(
                answer=reply,
                parcel_ids=[m[0] for m in matches[:15]],
                action="highlight",
                sources=["risk_engine"],
                warnings=[]
            )

    # ── 10. Building Permits Query ───────────────────────────────────────
    if any(k in q_lower for k in ["building permit", "building permission", "sanction plan", "unauthorized construction"]):
        permits = db.query(BuildingPermit, Parcel).join(Parcel, BuildingPermit.ulpin == Parcel.ulpin).limit(15).all()
        if permits:
            lines = [
                f"• **Parcel `{bp.ulpin}`** ({p.village}): Status: **{bp.status.value}** | Sanction No: `{bp.permit_number or 'Pending'}` | Approved Floors: {bp.approved_floors or 1}"
                for bp, p in permits
            ]
            reply = f"### 🏗️ Municipal Building Sanction Permits ({len(permits)} Records)\n\n" + "\n".join(lines)
            return AgentChatResponse(
                answer=reply,
                parcel_ids=[bp.ulpin for bp, _ in permits],
                sources=["building_permits"],
                warnings=[]
            )

    # ── 11. Registry Aggregates & Summary ────────────────────────────────
    if any(k in q_lower for k in ["how many parcels", "total parcels", "summary of all parcels", "overview of registry", "how much land", "registry summary", "all parcels", "list parcels"]):
        total_p = db.query(Parcel).count()
        total_tax_defaulters = db.query(Tax).filter(Tax.payment_status.in_([TaxPaymentStatus.DEFAULTED, TaxPaymentStatus.DUE])).count()
        total_court = db.query(CourtCase).filter(CourtCase.has_litigation == True).count()
        total_stays = db.query(CourtCase).filter(CourtCase.stay_order_active == True).count()
        total_encumbered = db.query(Encumbrance).filter(Encumbrance.has_encumbrance == True).count()

        parcels_sample = db.query(Parcel).limit(8).all()
        ids = [p.ulpin for p in parcels_sample]
        sample_lines = [f"• **Parcel `{p.ulpin}`** (Survey `{p.survey_number}`): {p.village}, {p.district} ({p.gis_area_acres} acres)" for p in parcels_sample]

        reply = (
            f"### 📊 LandStack Central Land Registry Summary\n\n"
            f"• **Total Registered Land Parcels**: **{total_p:,} parcels** across Bengaluru & Raigad Districts\n"
            f"• **Active Court Stays / Injunctions**: **{total_stays} parcels** (Restrained from sale)\n"
            f"• **Total Active Civil Disputes**: **{total_court} parcels** under ongoing litigation\n"
            f"• **Commercial Bank Mortgages**: **{total_encumbered} parcels** with registered financial liens\n"
            f"• **Property Tax Arrears / Defaults**: **{total_tax_defaulters} parcels** with pending revenue dues\n\n"
            f"**Sample Active Parcels:**\n"
            + "\n".join(sample_lines)
        )
        return AgentChatResponse(
            answer=reply,
            parcel_ids=ids,
            sources=["parcels_aggregate", "registry_stats"],
            warnings=[]
        )

    # ── 12. Optional LLM Fallback (Gemini) or Structured Guidance ────────
    llm_answer = _call_gemini_llm(q)
    if llm_answer:
        return AgentChatResponse(
            answer=llm_answer,
            parcel_ids=[],
            sources=["gemini_llm_engine"],
            warnings=[]
        )

    return AgentChatResponse(
        answer=(
            "### 🤖 LandStack AI Governance Copilot\n\n"
            f"I analyzed your query: *\"{q}\"*\n\n"
            "Here is what you can ask me to inspect:\n"
            "• **Specific Parcels**: *'Audit UL001'*, *'Check Survey 104/1'*, *'Compare UL001 and UL002'*\n"
            "• **Risk & Legal**: *'Show parcels with court stay orders'*, *'Is UL001 safe to buy?'*\n"
            "• **Financials**: *'Check active bank mortgages'*, *'List tax defaulters'*\n"
            "• **Landowner Portfolio**: *'Parcels owned by Ravi Kumar'*, *'Parcels in Kengeri'*\n"
            "• **Governance Concepts**: *'What is ULPIN?'*, *'Explain 7/12 Pahani'*, *'What is mutation?'*"
        ),
        parcel_ids=[],
        sources=["landstack_copilot"],
        warnings=[]
    )


def _compute_risk(c, e, t, discrepancy):
    has_stay = bool(c and c.stay_order_active)
    is_encumbered = bool(e and e.status == EncumbranceStatus.ACTIVE)
    is_tax_default = bool(t and t.payment_status in [TaxPaymentStatus.DEFAULTED, TaxPaymentStatus.DUE])
    risk_score = 0
    if has_stay:
        risk_score += 80
    elif c and c.has_litigation:
        risk_score += 40
    if is_encumbered:
        risk_score += 30
    if is_tax_default:
        risk_score += 25
    if discrepancy > 0.05:
        risk_score += (35 if discrepancy > 0.25 else 20)
    if risk_score >= 80:
        risk_level = "BLOCKED"
    elif risk_score >= 60:
        risk_level = "HIGH_RISK"
    elif risk_score >= 30:
        risk_level = "MODERATE_RISK"
    elif risk_score > 0:
        risk_level = "LOW_RISK"
    else:
        risk_level = "CLEAN"
    return min(100, risk_score), risk_level


def _dispatch_tool(tool: str, args: Dict[str, Any], db: Session) -> Dict[str, Any]:

    # ── Single and Multi-parcel tools ──────────────────────────────────────────
    if tool in ["get_unified_parcel_profile", "get_multiple_parcels_details"]:
        ulpins = args.get("ulpins")
        ulpin = args.get("ulpin")
        if not ulpins and isinstance(ulpin, list):
            ulpins = ulpin
        elif not ulpins and isinstance(ulpin, str) and ("," in ulpin or len(re.findall(r"UL\d+", ulpin, re.IGNORECASE)) > 1):
            ulpins = [u.upper() for u in re.findall(r"UL\d+", ulpin, re.IGNORECASE)]

        if ulpins and len(ulpins) > 1:
            results = []
            for u in ulpins:
                try:
                    prof = get_unified_parcel_profile(u, db).model_dump()
                    results.append(prof)
                except Exception:
                    p = db.query(Parcel).filter(Parcel.ulpin == u).first()
                    if p:
                        results.append({
                            "ulpin": u,
                            "gis_area_acres": p.gis_area_acres,
                            "village": p.village,
                            "status": "partial"
                        })
                    else:
                        results.append({"ulpin": u, "error": f"Parcel '{u}' not found."})
            return {"count": len(results), "ulpins": ulpins, "parcels": results, "result": results}

        target_ulpin = ulpins[0] if (ulpins and len(ulpins) > 0) else ulpin
        if not target_ulpin:
            if tool == "get_multiple_parcels_details":
                all_p = db.query(Parcel).limit(10).all()
                ulpins = [p.ulpin for p in all_p]
                results = []
                for u in ulpins:
                    try:
                        prof = get_unified_parcel_profile(u, db).model_dump()
                        results.append(prof)
                    except Exception:
                        p = db.query(Parcel).filter(Parcel.ulpin == u).first()
                        if p:
                            results.append({"ulpin": u, "gis_area_acres": p.gis_area_acres, "village": p.village, "status": "partial"})
                return {"count": len(results), "ulpins": ulpins, "parcels": results, "result": results}
            raise HTTPException(status_code=400, detail="Missing required argument 'ulpin' or 'ulpins'")
        profile = get_unified_parcel_profile(target_ulpin, db)
        p_dict = profile.model_dump()
        return {**p_dict, "result": p_dict}

    elif tool == "get_parcel_details":
        ulpins = args.get("ulpins") or args.get("ulpin")
        if isinstance(ulpins, str) and ("," in ulpins or len(re.findall(r"UL\d+", ulpins, re.IGNORECASE)) > 1):
            ulpins = [u.upper() for u in re.findall(r"UL\d+", ulpins, re.IGNORECASE)]
        elif isinstance(ulpins, str):
            ulpins = [ulpins]
        elif not isinstance(ulpins, list):
            ulpins = []

        if len(ulpins) > 1:
            parcels = db.query(Parcel).filter(Parcel.ulpin.in_(ulpins)).all()
            p_map = {p.ulpin: p for p in parcels}
            results = []
            for u in ulpins:
                p = p_map.get(u)
                if p:
                    results.append({
                        "ulpin": p.ulpin,
                        "gis_area_acres": p.gis_area_acres,
                        "survey_number": p.survey_number,
                        "village": p.village,
                        "taluk": p.taluk,
                        "district": p.district,
                        "state": p.state,
                        "centroid": [p.centroid_lat, p.centroid_lng]
                    })
                else:
                    results.append({"ulpin": u, "error": f"Parcel '{u}' not found."})
            return {"count": len(results), "parcels": results}

        target_u = ulpins[0] if ulpins else args.get("ulpin")
        p = db.query(Parcel).filter(Parcel.ulpin == target_u).first()
        if not p:
            return {"error": f"Parcel '{target_u}' not found."}
        return {
            "ulpin": p.ulpin,
            "gis_area_acres": p.gis_area_acres,
            "survey_number": p.survey_number,
            "village": p.village,
            "taluk": p.taluk,
            "district": p.district,
            "state": p.state,
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
            "father_name": r.father_name,
            "document_area_acres": r.document_area_acres,
            "khata_number": r.khata_number,
            "land_type": r.land_type,
            "soil_type": r.soil_type,
            "mutation_number": r.mutation_number,
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
            "cess_amount": t.cess_amount,
            "penalties": t.penalties,
            "total_paid": t.total_paid,
            "last_payment_date": t.last_payment_date,
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
            "loan_account_no": e.loan_account_no,
            "mortgage_amount": e.mortgage_amount,
            "date_of_mortgage": e.date_of_mortgage,
            "status": e.status.value,
            "ec_certificate_number": e.ec_certificate_number,
            "period_from": e.period_from,
            "period_to": e.period_to,
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
            "petitioner": c.petitioner,
            "respondent": c.respondent,
            "case_type": c.case_type,
            "stay_order_active": c.stay_order_active,
            "case_status": c.case_status.value,
            "filing_date": c.filing_date,
            "case_summary": c.case_summary
        }

    elif tool == "get_parcels_in_area":
        ulpins = args.get("ulpins", [])
        res = perform_area_analysis(ulpins, db)
        return {"result": res.model_dump()}

    elif tool == "search_parcels_by_owner":
        owner_name = args.get("owner_name", "")
        records = db.query(RoR).filter(RoR.primary_owner.ilike(f"%{owner_name}%")).limit(100).all()
        results = [
            {
                "ulpin": r.ulpin,
                "owner": r.primary_owner,
                "document_area_acres": r.document_area_acres,
                "khata": r.khata_number,
                "land_type": r.land_type
            }
            for r in records
        ]
        return {"found_count": len(results), "matches": results}

    # ── Bulk / Area filter tool ──────────────────────────────────────────────
    elif tool == "search_parcels_by_filter":
        limit = min(int(args.get("limit", 50)), 200)
        village = args.get("village")
        taluk = args.get("taluk")
        district = args.get("district")
        court_filter = (args.get("court_status") or "").upper()
        tax_filter = (args.get("tax_status") or "").upper()
        enc_filter = (args.get("encumbrance_status") or "").upper()
        risk_filter = (args.get("risk_level") or "").upper()

        p_query = db.query(Parcel)
        if village:
            p_query = p_query.filter(Parcel.village.ilike(f"%{village}%"))
        if taluk:
            p_query = p_query.filter(Parcel.taluk.ilike(f"%{taluk}%"))
        if district:
            p_query = p_query.filter(Parcel.district.ilike(f"%{district}%"))

        parcels = p_query.limit(500).all()
        if not parcels:
            return {
                "found_count": 0,
                "total_scanned": 0,
                "matches": [],
                "message": "No parcels found for the given location filters."
            }

        ulpins = [p.ulpin for p in parcels]
        rors = {r.ulpin: r for r in db.query(RoR).filter(RoR.ulpin.in_(ulpins)).all()}
        taxes = {t.ulpin: t for t in db.query(Tax).filter(Tax.ulpin.in_(ulpins)).all()}
        encs = {e.ulpin: e for e in db.query(Encumbrance).filter(Encumbrance.ulpin.in_(ulpins)).all()}
        cases = {c.ulpin: c for c in db.query(CourtCase).filter(CourtCase.ulpin.in_(ulpins)).all()}

        results = []
        for p in parcels:
            u = p.ulpin
            r = rors.get(u)
            t = taxes.get(u)
            e = encs.get(u)
            c = cases.get(u)

            # Court filter
            if court_filter == "NO_LITIGATION":
                if c and c.has_litigation:
                    continue
            elif court_filter == "STAY_GRANTED":
                if not (c and c.stay_order_active):
                    continue
            elif court_filter == "PENDING":
                if not (c and c.has_litigation and not c.stay_order_active):
                    continue

            # Tax filter
            if tax_filter:
                t_val = t.payment_status.value.upper() if t else "PAID"
                if t_val != tax_filter:
                    continue

            # Encumbrance filter
            if enc_filter:
                e_val = e.status.value.upper() if e else "NONE"
                if e_val != enc_filter:
                    continue

            gis_area = float(p.gis_area_acres or 0)
            doc_area = float(r.document_area_acres or gis_area) if r else gis_area
            discrepancy = round(abs(gis_area - doc_area), 3)
            risk_score, computed_risk = _compute_risk(c, e, t, discrepancy)

            if risk_filter and computed_risk != risk_filter:
                continue

            results.append({
                "ulpin": p.ulpin,
                "survey_number": p.survey_number,
                "village": p.village,
                "taluk": p.taluk,
                "district": p.district,
                "state": p.state,
                "owner": r.primary_owner if r else "Unknown",
                "father_name": r.father_name if r else "",
                "khata_number": r.khata_number if r else "N/A",
                "gis_area_acres": round(gis_area, 2),
                "document_area_acres": round(doc_area, 2),
                "area_discrepancy": discrepancy,
                "tax_status": t.payment_status.value if t else "PAID",
                "tax_due": max(0, float((t.property_tax_due or 0) + (t.cess_amount or 0) + (t.penalties or 0) - (t.total_paid or 0))) if t else 0.0,
                "encumbrance_status": e.status.value if e else "NONE",
                "bank_name": e.bank_name if e else None,
                "mortgage_amount": float(e.mortgage_amount or 0) if e else 0.0,
                "court_status": c.case_status.value if c else "NO_LITIGATION",
                "stay_order_active": bool(c and c.stay_order_active),
                "has_litigation": bool(c and c.has_litigation),
                "case_number": c.case_number if c and c.has_litigation else None,
                "risk_level": computed_risk,
                "risk_score": risk_score,
            })
            if len(results) >= limit:
                break

        return {
            "found_count": len(results),
            "total_scanned": len(parcels),
            "filters_applied": {k: v for k, v in args.items() if v and k != "limit"},
            "matches": results
        }

    # ── Portfolio / governance summary ───────────────────────────────────────
    elif tool == "list_all_parcels_summary":
        total = db.query(Parcel).count()
        litigated = db.query(CourtCase).filter(CourtCase.has_litigation == True).count()
        stay_orders = db.query(CourtCase).filter(CourtCase.stay_order_active == True).count()
        encumbered = db.query(Encumbrance).filter(Encumbrance.has_encumbrance == True).count()
        tax_defaulters = db.query(Tax).filter(Tax.payment_status == TaxPaymentStatus.DEFAULTED).count()
        tax_due = db.query(Tax).filter(Tax.payment_status == TaxPaymentStatus.DUE).count()
        district_counts = db.query(Parcel.district, func.count(Parcel.ulpin)).group_by(Parcel.district).all()

        return {
            "total_parcels": total,
            "litigated_parcels": litigated,
            "active_stay_orders": stay_orders,
            "encumbered_parcels": encumbered,
            "tax_defaulters": tax_defaulters,
            "tax_due_parcels": tax_due,
            "clean_parcels": max(0, total - litigated - encumbered - tax_defaulters),
            "district_breakdown": [{"district": d, "count": c} for d, c in district_counts],
            "governance_health_score": round(
                max(0, 100 - (litigated + encumbered + tax_defaulters) / max(total, 1) * 100), 1
            )
        }

    else:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Unknown AI tool '{tool}'. Available tools: {[t['name'] for t in TOOL_DEFINITIONS]}"
        )
