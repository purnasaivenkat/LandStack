from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.models.land_use import MasterPlanZone

class LandUseBase(BaseModel):
    ulpin: str
    master_plan_zone: MasterPlanZone = MasterPlanZone.AGRICULTURAL
    current_usage: str
    is_converted: bool = False
    conversion_order_no: Optional[str] = None
    conversion_date: Optional[str] = None
    zoning_authority: str = "BMRDA / BDA"
    flood_zone_risk: str = "LOW"

class LandUseCreate(LandUseBase):
    pass

class LandUseResponse(LandUseBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: Optional[datetime] = None
