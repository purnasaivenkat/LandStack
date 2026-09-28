# 🏛️ LandStack — Unified Land Intelligence & Governance Platform

> **Central Connection Layer (Member 2 — Backend, Integration & Connectivity)**  
> Orchestrating GIS, Land Records, AI Agent Intelligence, and Frontend UI through standardized REST APIs.

---

## 🌟 Overview

LandStack solves land-record fragmentation by bridging the gap between:
- **🗺️ Member 1 (GIS & Spatial Analytics)**: PostGIS layers, boundary geometries, polygon area selections.
- **⚡ Member 2 (Backend, Integration & Security)**: Central relational database, unified profiles, anomaly diagnostics, and RBAC authentication.
- **🤖 Member 3 (AI Agent & Intelligence)**: Autonomous LLM tool execution, natural language property lookups, and dispute reasoning.
- **🎨 Member 4 (Frontend & UX)**: Interactive map viewer, 360° parcel visualizer, and land risk dashboards.

---

## 🏗️ Architecture & Data Flow

```mermaid
flowchart TD
    M1[Member 1: GIS Layer / PostGIS] -->|Selected ULPINs / GeoJSON BBox| API_Area[/api/area-analysis]
    M4[Member 4: Frontend Web App] -->|ULPIN search / Unified View| API_Profile[/api/parcel-profile/{ulpin}]
    M3[Member 3: AI Agent / LLM Tools] -->|Tool Calls / Query APIs| API_AI[/api/ai-agent/tools]
    
    subgraph Member2[Member 2: FastAPI + Connectivity Engine]
        RBAC[Auth & RBAC: Citizen / Officer / Admin]
        Anomaly[Automated Anomaly & Discrepancy Engine]
        ProfileAgg[Unified Profile Aggregator]
        
        RBAC --> API_Profile
        RBAC --> API_Area
        RBAC --> API_AI
        
        API_Profile --> ProfileAgg
        ProfileAgg --> Anomaly
    end
    
    subgraph LandRecordDB[Land Record Relational Database - ULPIN Key]
        P[parcels]
        RoR[ror - Record of Rights]
        Reg[registration - Deeds]
        Tax[tax - Assessments & Dues]
        Enc[encumbrance - Mortgages]
        LU[land_use - Master Plan]
        BP[building_permits - Approvals]
        CC[court_cases - Litigation & Stays]
    end
    
    ProfileAgg --> P
    ProfileAgg --> RoR
    ProfileAgg --> Reg
    ProfileAgg --> Tax
    ProfileAgg --> Enc
    ProfileAgg --> LU
    ProfileAgg --> BP
    ProfileAgg --> CC
```

---

## 🔑 Key Deliverables of Member 2

### 1. Unified Parcel Profile (`GET /api/parcel-profile/{ulpin}`)
Instead of forcing the frontend or AI agent to make 7-8 separate API calls, this flagship endpoint returns everything in one call:
```json
{
  "ulpin": "UL001",
  "parcel": { "gis_area_acres": 3.20, "survey_number": "104/1" },
  "ror": { "primary_owner": "Ravi Kumar", "document_area_acres": 3.20 },
  "registration": { "deed_number": "DEED-BNG-2018-4412", "market_value": 4800000.0 },
  "tax": { "assessment_year": "2024-2025", "payment_status": "PAID" },
  "encumbrance": { "has_encumbrance": false, "status": "NONE" },
  "land_use": { "master_plan_zone": "AGRICULTURAL" },
  "building_permit": { "approval_status": "NO_PERMIT" },
  "court_case": { "has_litigation": false, "stay_order_active": false },
  "anomalies": [],
  "risk_summary": {
    "score": 0,
    "level": "CLEAN",
    "is_safe_for_transaction": true,
    "summary": "Clear Title: No discrepancies detected."
  }
}
```

### 2. Area Analysis Integration (`POST /api/area-analysis/by-ulpins`)
Accepts an array of ULPINs from Member 1's GIS selection (`["UL001", "UL002", "UL003"]`) and returns complete enriched records along with aggregate metrics:
- Total GIS Area vs Total Document Area
- Area Discrepancy Extent
- Disputed / Court Stay count
- Active Encumbrances
- Tax Default counts & total dues
- Zoning classification breakdown
- Overall Health Score (0-100)

### 3. AI Agent Tool Hub (`/api/ai-agent/tools` & `/api/ai-agent/execute-tool`)
Provides standardized JSON tool manifests and a dynamic execution proxy so Member 3's AI Agent (LangChain / LlamaIndex / Gemini / OpenAI) never accesses raw database tables directly.

### 4. RBAC & Authentication
Three built-in role tiers:
- `CITIZEN`: Public transparency access
- `OFFICER`: Verification, area analytics, record mutation
- `ADMIN`: User management, audit logs, system config

---

## 🎯 Realistic Demo Scenarios & Deliberate Anomalies

| ULPIN | Owner | Primary Scenario / Deliberate Inconsistency | Risk Level |
| :--- | :--- | :--- | :--- |
| **UL001** | Ravi Kumar | **Clean Agricultural Title**: 3.20 acres GIS = 3.20 acres RoR, Tax Paid, No Encumbrance | `CLEAN` (0) |
| **UL002** | Smt. Lakshmi Devi | **Area Mismatch Demo**: GIS Area = 3.20 acres vs RoR Document Area = 2.80 acres (+0.40 acre discrepancy) | `MODERATE_RISK` |
| **UL003** | Ramesh Gowda | **Litigation & Injunction Demo**: Active City Civil Court stay order prohibiting sale/transfer | `BLOCKED` / `HIGH_RISK` |
| **UL004** | Venkatesh Prasad | **Heavy Mortgage Lien Demo**: Active ₹4.5 Crore State Bank of India registered mortgage | `MODERATE_RISK` |
| **UL005** | Anand Rao | **Tax Defaulter Demo**: 3 years overdue municipal property taxes (₹78,000 pending) | `LOW_RISK` |
| **UL006** | Horizon Logistics | **Illegal Construction Demo**: Green Belt agricultural zoning used as commercial warehouse + 4 floors built vs 1 floor sanctioned | `HIGH_RISK` |

---

## 🚀 Quickstart & Setup

### 1. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment (`.env`)
The system works out-of-the-box with SQLite, and can connect directly to Supabase PostgreSQL:
```env
# Local SQLite (Default)
DATABASE_URL="sqlite:///./landstack.db"

# Supabase PostgreSQL (Project ID: slrjtctvyhhbwwcgomcy)
# DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.slrjtctvyhhbwwcgomcy.supabase.co:5432/postgres"

SUPABASE_PROJECT_ID="slrjtctvyhhbwwcgomcy"
SUPABASE_URL="https://slrjtctvyhhbwwcgomcy.supabase.co"
```

### 3. Run Server
```bash
python run.py
```
Open **http://127.0.0.1:8000/docs** in your browser for the interactive Swagger UI.

### 4. Run Automated Test Suite
```bash
python -m pytest tests -v
```

---

## 🔌 Integration SDKs for Team Members

- **Member 1 (GIS Specialist)**: Check [`backend/integration_clients/member1_gis_guide.md`](file:///c:/Users/purna%20sai/OneDrive/IVY%20PICS/LandStack/backend/integration_clients/member1_gis_guide.md)
- **Member 3 (AI Agent Lead)**: Import [`backend/integration_clients/member3_ai_agent_sdk.py`](file:///c:/Users/purna%20sai/OneDrive/IVY%20PICS/LandStack/backend/integration_clients/member3_ai_agent_sdk.py) or use [`ai_tools_spec.json`](file:///c:/Users/purna%20sai/OneDrive/IVY%20PICS/LandStack/backend/integration_clients/ai_tools_spec.json)
- **Member 4 (Frontend Lead)**: Import [`backend/integration_clients/member4_frontend_api.ts`](file:///c:/Users/purna%20sai/OneDrive/IVY%20PICS/LandStack/backend/integration_clients/member4_frontend_api.ts)

---

## 👥 Team Demonstration Checklist

- [x] **Give me a ULPIN** &rarr; I return the complete 360° parcel profile with automated anomaly detection.
- [x] **Give me a selected area** &rarr; I return all relevant parcel records and aggregate statistics.
- [x] **RBAC Protected mutation** &rarr; Citizen vs Officer privilege checks.
- [x] **AI Agent integration** &rarr; Zero-SQL tool execution proxy.
