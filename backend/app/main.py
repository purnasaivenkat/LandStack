from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
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

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context: Initialize tables and seed mock data on startup."""
    print("[*] Starting LandStack Backend (Member 2 - Central Integration Layer)...")
    Base.metadata.create_all(bind=engine)
    if settings.AUTO_SEED_DATABASE:
        seed_database()
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

# Configure CORS for Frontend (Member 4) and External GIS Tools (Member 1)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all Domain Routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(parcels_router, prefix=settings.API_V1_STR)
app.include_router(ror_router, prefix=settings.API_V1_STR)
app.include_router(registration_router, prefix=settings.API_V1_STR)
app.include_router(tax_router, prefix=settings.API_V1_STR)
app.include_router(encumbrance_router, prefix=settings.API_V1_STR)
app.include_router(land_use_router, prefix=settings.API_V1_STR)
app.include_router(building_permits_router, prefix=settings.API_V1_STR)
app.include_router(court_cases_router, prefix=settings.API_V1_STR)
app.include_router(unified_profile_router, prefix=settings.API_V1_STR)
app.include_router(area_analysis_router, prefix=settings.API_V1_STR)
app.include_router(ai_agent_tools_router, prefix=settings.API_V1_STR)

@app.get("/", summary="LandStack API Health and System Status")
def root_status():
    return {
        "status": "online",
        "system": "LandStack Central Connection Layer (Member 2)",
        "version": settings.VERSION,
        "database": "Connected",
        "documentation": {
            "swagger_ui": "/docs",
            "redoc": "/redoc",
            "openapi_schema": "/openapi.json"
        },
        "endpoints": {
            "flagship_unified_profile": "/api/parcel-profile/{ulpin}",
            "area_analysis": "/api/area-analysis/by-ulpins",
            "ai_agent_tools": "/api/ai-agent/tools",
            "auth": "/api/auth/login",
            "demo_tokens": "/api/auth/demo-tokens"
        },
        "demo_ulpins": {
            "UL001": "Clean Agricultural parcel (0 risk)",
            "UL002": "Area Mismatch Demo (GIS 3.20 acres vs RoR 2.80 acres)",
            "UL003": "Active Court Stay Order Demo (Judicial Injunction)",
            "UL004": "Heavy Bank Mortgage Lien Demo (SBI 4.5 Crore)",
            "UL005": "Tax Defaulter Demo (3 years overdue 78,000 INR)",
            "UL006": "Unauthorized Construction and Green Belt Zone Conflict"
        }
    }
