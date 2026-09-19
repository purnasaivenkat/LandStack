from app.routers.auth import router as auth_router
from app.routers.parcels import router as parcels_router
from app.routers.ror import router as ror_router
from app.routers.registration import router as registration_router
from app.routers.tax import router as tax_router
from app.routers.encumbrance import router as encumbrance_router
from app.routers.land_use import router as land_use_router
from app.routers.building_permits import router as building_permits_router
from app.routers.court_cases import router as court_cases_router
from app.routers.unified_profile import router as unified_profile_router
from app.routers.area_analysis import router as area_analysis_router
from app.routers.ai_agent_tools import router as ai_agent_tools_router

__all__ = [
    "auth_router",
    "parcels_router",
    "ror_router",
    "registration_router",
    "tax_router",
    "encumbrance_router",
    "land_use_router",
    "building_permits_router",
    "court_cases_router",
    "unified_profile_router",
    "area_analysis_router",
    "ai_agent_tools_router",
]
