from typing import Optional, List
import enum
from pydantic import BaseModel, ConfigDict
from app.schemas.parcel import ParcelResponse
from app.schemas.ror import RoRResponse
from app.schemas.registration import RegistrationResponse
from app.schemas.tax import TaxResponse
from app.schemas.encumbrance import EncumbranceResponse
from app.schemas.land_use import LandUseResponse
from app.schemas.building_permit import BuildingPermitResponse
from app.schemas.court_case import CourtCaseResponse

class SeverityLevel(str, enum.Enum):
    INFO = "INFO"
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class AnomalyItem(BaseModel):
    category: str  # e.g., "AREA_MISMATCH", "LEGAL_STAY", "ENCUMBRANCE_LIEN", "TAX_ARREARS", "ZONING_VIOLATION", "BUILDING_VIOLATION"
    severity: SeverityLevel
    title: str
    description: str
    gis_value: Optional[str] = None
    record_value: Optional[str] = None
    delta: Optional[str] = None

class RiskLevel(str, enum.Enum):
    CLEAN = "CLEAN"
    LOW_RISK = "LOW_RISK"
    MODERATE_RISK = "MODERATE_RISK"
    HIGH_RISK = "HIGH_RISK"
    BLOCKED = "BLOCKED"

class RiskSummary(BaseModel):
    score: int  # 0 (Clear) to 100 (Severe Risk/Blocked)
    level: RiskLevel
    anomaly_count: int
    is_safe_for_transaction: bool
    summary: str

class AnomalyReport(BaseModel):
    ulpin: str
    anomalies: List[AnomalyItem]
    risk_summary: RiskSummary

class UnifiedParcelProfile(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    ulpin: str
    parcel: ParcelResponse
    ror: Optional[RoRResponse] = None
    registration: Optional[RegistrationResponse] = None
    tax: Optional[TaxResponse] = None
    encumbrance: Optional[EncumbranceResponse] = None
    land_use: Optional[LandUseResponse] = None
    building_permit: Optional[BuildingPermitResponse] = None
    court_case: Optional[CourtCaseResponse] = None
    anomalies: List[AnomalyItem] = []
    risk_summary: RiskSummary
