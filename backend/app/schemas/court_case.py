from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.models.court_case import CourtCaseStatus

class CourtCaseBase(BaseModel):
    ulpin: str
    has_litigation: bool = False
    case_number: Optional[str] = None
    court_name: Optional[str] = None
    case_type: Optional[str] = None
    petitioner: Optional[str] = None
    respondent: Optional[str] = None
    stay_order_active: bool = False
    case_status: CourtCaseStatus = CourtCaseStatus.NO_LITIGATION
    filing_date: Optional[str] = None
    next_hearing_date: Optional[str] = None
    case_summary: Optional[str] = None

class CourtCaseCreate(CourtCaseBase):
    pass

class CourtCaseResponse(CourtCaseBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: Optional[datetime] = None
