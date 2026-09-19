from typing import List, Dict, Optional
from pydantic import BaseModel
from app.schemas.unified_profile import UnifiedParcelProfile

class AreaAnalysisByUlpinsRequest(BaseModel):
    ulpins: List[str]

class AreaAnalysisSpatialRequest(BaseModel):
    min_lat: float
    max_lat: float
    min_lng: float
    max_lng: float

class AreaAnalysisSummary(BaseModel):
    total_parcels: int
    total_gis_area_acres: float
    total_doc_area_acres: float
    area_discrepancy_acres: float
    disputed_parcels_count: int
    encumbered_parcels_count: int
    tax_default_count: int
    total_tax_dues: float
    zoning_breakdown: Dict[str, int]
    overall_health_score: int  # 0 to 100

class AreaAnalysisResponse(BaseModel):
    summary: AreaAnalysisSummary
    parcels: List[UnifiedParcelProfile]
