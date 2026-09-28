from fastapi import APIRouter, Depends, Path
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.unified_profile import UnifiedParcelProfile
from app.services.profile_service import get_unified_parcel_profile

router = APIRouter(prefix="/parcel-profile", tags=["Unified Parcel Profile (Flagship API)"])

@router.get(
    "/{ulpin}",
    response_model=UnifiedParcelProfile,
    summary="Get complete unified parcel profile across all 8 land subsystems + anomaly report",
    response_description="Unified parcel profile containing RoR, Deed Registration, Tax, Encumbrance, Land Use, Building Permit, Court Cases, and Automated Anomaly Diagnostics."
)
def get_parcel_profile(
    ulpin: str = Path(..., description="Unique Land Parcel Identification Number (e.g. UL001, UL002, etc.)"),
    db: Session = Depends(get_db)
):
    """
    **Flagship Unified Parcel Profile API**
    
    Orchestrates and merges all data silos into a single comprehensive record:
    - **Parcel**: GIS boundary, survey number, and physical area
    - **RoR**: Record of Rights, recorded legal area, and primary owner
    - **Registration**: Sub-registrar deed, consideration price, stamp duty
    - **Tax**: Assessment status, annual dues, payment status
    - **Encumbrance**: Bank mortgages, liens, EC certificate
    - **Land Use**: Master plan zoning vs actual usage, conversion order
    - **Building Permit**: Sanctioned floors, approvals, deviation flags
    - **Court Case**: Judicial stays, pending litigation, case details
    - **Anomalies**: Automated computation of area mismatches, zoning violations, and stay orders
    - **Risk Summary**: Calculated composite risk score (0-100) and recommendation
    """
    return get_unified_parcel_profile(ulpin.strip(), db)
