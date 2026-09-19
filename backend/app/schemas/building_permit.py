from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.models.building_permit import PermitApprovalStatus

class BuildingPermitBase(BaseModel):
    ulpin: str
    permit_number: Optional[str] = None
    sanctioning_authority: str = "BBMP / BDA"
    sanctioned_floors: int = 0
    actual_floors: int = 0
    sanctioned_builtup_area_sqft: float = 0.0
    actual_builtup_area_sqft: float = 0.0
    approval_status: PermitApprovalStatus = PermitApprovalStatus.NO_PERMIT
    approval_date: Optional[str] = None
    expiry_date: Optional[str] = None
    occupancy_certificate_issued: bool = False
    deviation_detected: bool = False
    violation_remarks: Optional[str] = None

class BuildingPermitCreate(BuildingPermitBase):
    pass

class BuildingPermitResponse(BuildingPermitBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: Optional[datetime] = None
