from typing import Optional, List, Dict
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.parcel import Parcel
from app.models.ror import RoR
from app.models.registration import Registration
from app.models.tax import Tax, TaxPaymentStatus
from app.models.encumbrance import Encumbrance, EncumbranceStatus
from app.models.land_use import LandUse
from app.models.building_permit import BuildingPermit
from app.models.court_case import CourtCase, CourtCaseStatus
from app.schemas.parcel import ParcelResponse
from app.schemas.ror import RoRResponse
from app.schemas.registration import RegistrationResponse
from app.schemas.tax import TaxResponse
from app.schemas.encumbrance import EncumbranceResponse
from app.schemas.land_use import LandUseResponse
from app.schemas.building_permit import BuildingPermitResponse
from app.schemas.court_case import CourtCaseResponse
from app.schemas.unified_profile import UnifiedParcelProfile
from app.schemas.area_analysis import AreaAnalysisSummary, AreaAnalysisResponse
from app.services.anomaly_detector import detect_anomalies_and_risk

def get_unified_parcel_profile(ulpin: str, db: Session) -> UnifiedParcelProfile:
    """Fetch all 7 land-record datasets and run anomaly detection for a given ULPIN."""
    parcel = db.query(Parcel).filter(Parcel.ulpin == ulpin).first()
    if not parcel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Parcel with ULPIN '{ulpin}' not found in LandStack database."
        )

    ror = db.query(RoR).filter(RoR.ulpin == ulpin).first()
    registration = db.query(Registration).filter(Registration.ulpin == ulpin).first()
    tax = db.query(Tax).filter(Tax.ulpin == ulpin).order_by(Tax.id.desc()).first()
    encumbrance = db.query(Encumbrance).filter(Encumbrance.ulpin == ulpin).order_by(Encumbrance.id.desc()).first()
    land_use = db.query(LandUse).filter(LandUse.ulpin == ulpin).first()
    building_permit = db.query(BuildingPermit).filter(BuildingPermit.ulpin == ulpin).first()
    court_case = db.query(CourtCase).filter(CourtCase.ulpin == ulpin).first()

    anomalies, risk_summary = detect_anomalies_and_risk(
        parcel=parcel,
        ror=ror,
        tax=tax,
        encumbrance=encumbrance,
        land_use=land_use,
        building_permit=building_permit,
        court_case=court_case,
    )

    return UnifiedParcelProfile(
        ulpin=parcel.ulpin,
        parcel=ParcelResponse.model_validate(parcel),
        ror=RoRResponse.model_validate(ror) if ror else None,
        registration=RegistrationResponse.model_validate(registration) if registration else None,
        tax=TaxResponse.model_validate(tax) if tax else None,
        encumbrance=EncumbranceResponse.model_validate(encumbrance) if encumbrance else None,
        land_use=LandUseResponse.model_validate(land_use) if land_use else None,
        building_permit=BuildingPermitResponse.model_validate(building_permit) if building_permit else None,
        court_case=CourtCaseResponse.model_validate(court_case) if court_case else None,
        anomalies=anomalies,
        risk_summary=risk_summary,
    )

def perform_area_analysis(ulpins: List[str], db: Session) -> AreaAnalysisResponse:
    """Analyze a batch of ULPINs (e.g. from Member 1's GIS selection) and return complete profiles + summary."""
    profiles: List[UnifiedParcelProfile] = []
    
    total_gis_area = 0.0
    total_doc_area = 0.0
    disputed_count = 0
    encumbered_count = 0
    tax_default_count = 0
    total_tax_dues = 0.0
    zoning_breakdown: Dict[str, int] = {}
    total_risk_score = 0

    for ulpin in ulpins:
        clean_ulpin = ulpin.strip()
        try:
            profile = get_unified_parcel_profile(clean_ulpin, db)
            profiles.append(profile)

            # Summaries
            total_gis_area += profile.parcel.gis_area_acres
            if profile.ror:
                total_doc_area += profile.ror.document_area_acres

            if profile.court_case and (profile.court_case.stay_order_active or profile.court_case.case_status == CourtCaseStatus.STAY_GRANTED or profile.court_case.has_litigation):
                disputed_count += 1

            if profile.encumbrance and profile.encumbrance.status == EncumbranceStatus.ACTIVE:
                encumbered_count += 1

            if profile.tax and profile.tax.payment_status in [TaxPaymentStatus.DEFAULTED, TaxPaymentStatus.DUE]:
                tax_default_count += 1
                tax_due = (profile.tax.property_tax_due or 0.0) + (profile.tax.cess_amount or 0.0) + (profile.tax.penalties or 0.0) - (profile.tax.total_paid or 0.0)
                total_tax_dues += max(0.0, tax_due)

            if profile.land_use:
                zone_name = profile.land_use.master_plan_zone.value
                zoning_breakdown[zone_name] = zoning_breakdown.get(zone_name, 0) + 1

            total_risk_score += profile.risk_summary.score
        except HTTPException:
            continue

    total_parcels = len(profiles)
    area_discrepancy = round(abs(total_gis_area - total_doc_area), 2)
    avg_risk = int(total_risk_score / total_parcels) if total_parcels > 0 else 0
    health_score = max(0, 100 - avg_risk)

    summary = AreaAnalysisSummary(
        total_parcels=total_parcels,
        total_gis_area_acres=round(total_gis_area, 2),
        total_doc_area_acres=round(total_doc_area, 2),
        area_discrepancy_acres=area_discrepancy,
        disputed_parcels_count=disputed_count,
        encumbered_parcels_count=encumbered_count,
        tax_default_count=tax_default_count,
        total_tax_dues=round(total_tax_dues, 2),
        zoning_breakdown=zoning_breakdown,
        overall_health_score=health_score,
    )

    return AreaAnalysisResponse(summary=summary, parcels=profiles)
