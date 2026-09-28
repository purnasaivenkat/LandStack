import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from app.config import settings
from app.database import engine, Base
from app.seed_data import seed_database
from app.routers import (
    auth_router,
    parcels_router,
    ror_router,
    registration_router,
    tax_router,
    encumbrance_router,
    land_use_router,
    building_permits_router,
    court_cases_router,
    unified_profile_router,
    area_analysis_router,
    ai_agent_tools_router,
)

from app.services.supabase_sync import sync_supabase_to_database

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context: Initialize tables and seed mock data on startup."""
    print("[*] Starting LandStack Central Integration Layer...")
    Base.metadata.create_all(bind=engine)
    if settings.AUTO_SEED_DATABASE:
        seed_database()
        sync_supabase_to_database()
    yield
    print("[*] Shutting down LandStack Backend...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=settings.DESCRIPTION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Configure CORS for Frontend, External GIS Tools, and Subsystems
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all Domain Routers under /api and /backend-api
for prefix in [settings.API_V1_STR, "/backend-api"]:
    app.include_router(auth_router, prefix=prefix)
    app.include_router(parcels_router, prefix=prefix)
    app.include_router(ror_router, prefix=prefix)
    app.include_router(registration_router, prefix=prefix)
    app.include_router(tax_router, prefix=prefix)
    app.include_router(encumbrance_router, prefix=prefix)
    app.include_router(land_use_router, prefix=prefix)
    app.include_router(building_permits_router, prefix=prefix)
    app.include_router(court_cases_router, prefix=prefix)
    app.include_router(unified_profile_router, prefix=prefix)
    app.include_router(area_analysis_router, prefix=prefix)
    app.include_router(ai_agent_tools_router, prefix=prefix)

@app.get("/api/status", summary="LandStack API Health and System Status")
@app.get("/backend-api/status", summary="LandStack API Health and System Status")
@app.get("/status", summary="LandStack API Health and System Status")
def api_status():
    return {
        "status": "online",
        "system": "LandStack Central Connection Layer",
        "version": settings.VERSION,
        "database": "Connected (SQLite & Supabase Schema Ready)",
        "supabase": {
            "project_id": settings.SUPABASE_PROJECT_ID,
            "url": settings.SUPABASE_URL,
            "schemas": [
                "dept_gis", "dept_ror", "dept_registration", "dept_tax",
                "dept_banking", "dept_urban_plan", "dept_municipal",
                "dept_judiciary", "dept_auth"
            ]
        },
        "documentation": {
            "swagger_ui": "/docs",
            "redoc": "/redoc",
            "openapi_schema": "/openapi.json"
        },
        "endpoints": {
            "flagship_unified_profile": "/api/parcel-profile/{ulpin}",
            "area_analysis": "/api/area-analysis/by-ulpins",
            "ai_agent_tools": "/api/ai-agent/tools",
            "parcels": "/api/parcels",
            "auth": "/api/auth/login",
            "demo_tokens": "/api/auth/demo-tokens"
        },
        "demo_ulpins": {
            "UL001": "Clean Agricultural parcel (0 risk, Sy #104/1)",
            "UL002": "Area Mismatch Demo (GIS 3.20 acres vs RoR 2.80 acres, Sy #104/2)",
            "UL003": "Active Court Stay Order Demo (Judicial Injunction, Sy #105)",
            "UL004": "Heavy Bank Mortgage Lien Demo (SBI 4.5 Crore, Sy #106/1)",
            "UL005": "Tax Defaulter Demo (3 years overdue 78,000 INR, Sy #107)",
            "UL006": "Unauthorized Construction and Green Belt Zone Conflict (Sy #108)",
            "UL007-UL012": "Clean Cadastral Synced Parcels (Sy #115/2 - 120/1)"
        }
    }

from fastapi.responses import FileResponse

# Mount Frontend Built SPA Static Files so localhost:8000 serves the full combined app
frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist"))
assets_dist = os.path.join(frontend_dist, "assets")

if os.path.exists(assets_dist):
    app.mount("/assets", StaticFiles(directory=assets_dist), name="static_assets")

if os.path.exists(frontend_dist):
    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        file_path = os.path.join(frontend_dist, full_path)
        if full_path and os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dist, "index.html"))
else:
    @app.get("/")
    def root_fallback():
        return api_status()
