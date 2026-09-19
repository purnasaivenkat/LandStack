from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class RoRBase(BaseModel):
    ulpin: str
    khata_number: str
    primary_owner: str
    father_name: Optional[str] = None
    joint_owners: Optional[str] = None
    document_area_acres: float
    land_type: str = "Dry"
    soil_type: Optional[str] = None
    mutation_number: Optional[str] = None
    mutated_date: Optional[str] = None

class RoRCreate(RoRBase):
    pass

class RoRResponse(RoRBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    updated_at: Optional[datetime] = None
