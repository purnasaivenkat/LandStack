from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class ParcelBase(BaseModel):
    ulpin: str
    state: str = "Karnataka"
    district: str = "Bengaluru Urban"
    taluk: str = "Bengaluru South"
    village: str = "Kengeri"
    survey_number: str
    sub_division: Optional[str] = None
    gis_area_acres: float
    centroid_lat: Optional[float] = None
    centroid_lng: Optional[float] = None
    geometry_geojson: Optional[str] = None

class ParcelCreate(ParcelBase):
    pass

class ParcelResponse(ParcelBase):
    model_config = ConfigDict(from_attributes=True)
    created_at: Optional[datetime] = None
