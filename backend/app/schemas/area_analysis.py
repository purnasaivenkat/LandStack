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
    total_document_area_acres: float   # renamed: was total_doc_area_acres
    net_area_discrepancy_acres: float  # renamed: was area_discrepancy_acres
    litigated_parcels_count: int       # renamed: was disputed_parcels_count
    disputed_parcels_count: Optional[int] = None
    encumbered_parcels_count: int
    tax_default_count: int
    total_tax_arrears: float           # renamed: was total_tax_dues
    zoning_breakdown: Dict[str, int]
    overall_health_score: int  # 0 to 100

    def model_post_init(self, __context):
        if self.disputed_parcels_count is None:
            self.disputed_parcels_count = self.litigated_parcels_count

class AreaAnalysisResponse(BaseModel):
    summary: AreaAnalysisSummary
    parcels: List[UnifiedParcelProfile]
