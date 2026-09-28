from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.parcel import Parcel
from app.models.user import UserRole
from app.schemas.parcel import ParcelResponse, ParcelCreate
from app.security.rbac import require_officer_or_above

router = APIRouter(prefix="/parcels", tags=["Parcels (GIS Core)"])

@router.get("", response_model=List[ParcelResponse])
def list_parcels(
    village: Optional[str] = Query(None, description="Filter by village name"),
    survey_number: Optional[str] = Query(None, description="Filter by survey number"),
    taluk: Optional[str] = Query(None, description="Filter by taluk name"),
    state: Optional[str] = Query(None, description="Filter by state name"),
    limit: int = Query(1500, ge=1, le=5000),
    db: Session = Depends(get_db)
):
    """Retrieve all land parcels with optional filters."""
    query = db.query(Parcel)
    if village:
        query = query.filter(Parcel.village.ilike(f"%{village}%"))
    if survey_number:
        query = query.filter(Parcel.survey_number == survey_number)
    if taluk:
        query = query.filter(Parcel.taluk.ilike(f"%{taluk}%"))
    if state:
        query = query.filter(Parcel.state.ilike(f"%{state}%"))
    return query.limit(limit).all()

@router.get("/enriched/all")
def list_enriched_parcels(
    region: Optional[str] = Query(None, description="Region: karjat or bengaluru"),
    limit: int = Query(1500, ge=1, le=5000),
    db: Session = Depends(get_db)
):
    """
    Optimized endpoint returning parcel spatial geometries together with RoR, Tax,
    Encumbrance, and Anomaly diagnostics in a single fast query.
    """
    from app.models.ror import RoR
    from app.models.tax import Tax, TaxPaymentStatus
    from app.models.encumbrance import Encumbrance, EncumbranceStatus
    from app.models.court_case import CourtCase, CourtCaseStatus
    from app.models.land_use import LandUse
    from app.models.building_permit import BuildingPermit

    p_query = db.query(Parcel)
    if region:
        r_lower = region.lower()
        if "karjat" in r_lower or "raigad" in r_lower or "maharashtra" in r_lower:
            p_query = p_query.filter(Parcel.district.ilike("%Raigad%"))
        elif "bengaluru" in r_lower or "karnataka" in r_lower:
            p_query = p_query.filter(Parcel.district.ilike("%Bengaluru%"))

    parcels = p_query.limit(limit).all()
    if not parcels:
        return []

    ulpins = [p.ulpin for p in parcels]
    
    # Bulk fetch related records
    rors = {r.ulpin: r for r in db.query(RoR).filter(RoR.ulpin.in_(ulpins)).all()}
    taxes = {t.ulpin: t for t in db.query(Tax).filter(Tax.ulpin.in_(ulpins)).all()}
    encs = {e.ulpin: e for e in db.query(Encumbrance).filter(Encumbrance.ulpin.in_(ulpins)).all()}
    cases = {c.ulpin: c for c in db.query(CourtCase).filter(CourtCase.ulpin.in_(ulpins)).all()}
    land_uses = {l.ulpin: l for l in db.query(LandUse).filter(LandUse.ulpin.in_(ulpins)).all()}
    permits = {bp.ulpin: bp for bp in db.query(BuildingPermit).filter(BuildingPermit.ulpin.in_(ulpins)).all()}

    results = []
    for p in parcels:
        u = p.ulpin
        r = rors.get(u)
        t = taxes.get(u)
        e = encs.get(u)
        c = cases.get(u)
        lu = land_uses.get(u)
        bp = permits.get(u)

        gis_area = round(float(p.gis_area_acres or 0), 2)
        doc_area = round(float(r.document_area_acres or gis_area), 2) if r else gis_area
        discrepancy = round(abs(gis_area - doc_area), 2)

        has_stay = bool(c and c.stay_order_active)
        has_litigation = bool(c and c.has_litigation)
        is_encumbered = bool(e and e.status == EncumbranceStatus.ACTIVE)
        is_tax_default = bool(t and t.payment_status in [TaxPaymentStatus.DEFAULTED, TaxPaymentStatus.DUE])

        # Risk scoring
        risk_score = 0
        if has_stay:
            risk_score += 80
        elif has_litigation:
            risk_score += 40
        if is_encumbered:
            risk_score += 30
        if is_tax_default:
            risk_score += 25
        if discrepancy > 0.05:
            risk_score += (35 if discrepancy > 0.25 else 20)

        if risk_score >= 80:
            risk_level = "BLOCKED"
        elif risk_score >= 60:
            risk_level = "HIGH_RISK"
        elif risk_score >= 30:
            risk_level = "MODERATE_RISK"
        elif risk_score > 0:
            risk_level = "LOW_RISK"
        else:
            risk_level = "CLEAN"

        tax_due = 0.0
        if t:
            tax_due = float((t.property_tax_due or 0) + (t.cess_amount or 0) + (t.penalties or 0) - (t.total_paid or 0))
            tax_due = max(0.0, tax_due)

        scenario = "Cadastral Parcel"
        if has_stay:
            scenario = "Judicial Stay Active"
        elif discrepancy > 0.05:
            scenario = f"Area Discrepancy ({discrepancy} Ac)"
        elif is_encumbered:
            scenario = f"Bank Lien ({e.bank_name or 'Mortgage'})"
        elif is_tax_default:
            scenario = f"Tax Arrears (₹{tax_due:,.0f})"
        elif risk_level == "CLEAN":
            scenario = "Clear Title"

        results.append({
            "ulpin": p.ulpin,
            "survey_number": p.survey_number,
            "sub_division": p.sub_division or "1",
            "village": p.village,
            "taluk": p.taluk,
            "district": p.district,
            "state": p.state,
            "gis_area_acres": gis_area,
            "document_area_acres": doc_area,
            "area_discrepancy": discrepancy,
            "centroid_lat": p.centroid_lat,
            "centroid_lng": p.centroid_lng,
            "geometry_geojson": p.geometry_geojson,
            "owner": r.primary_owner if r else "Registered Owner",
            "father_name": r.father_name if r else "",
            "khata_number": r.khata_number if r else "",
            "risk_level": risk_level,
            "risk_score": min(100, risk_score),
            "scenario_type": scenario,
            "tax_status": t.payment_status.value if t else "PAID",
            "tax_due": tax_due,
            "encumbrance_status": e.status.value if e else "NONE",
            "bank_name": e.bank_name if e else None,
            "mortgage_amount": float(e.mortgage_amount or 0) if e else 0.0,
            "court_status": c.case_status.value if c else "NO_LITIGATION",
            "stay_order_active": has_stay,
            "master_plan_zone": lu.master_plan_zone.value if lu else "AGRICULTURAL",
            "permit_status": bp.approval_status.value if bp else "NO_PERMIT",
        })

    return results

@router.get("/{ulpin}", response_model=ParcelResponse)
def get_parcel(ulpin: str, db: Session = Depends(get_db)):
    """Retrieve a single land parcel by its unique ULPIN."""
    parcel = db.query(Parcel).filter(Parcel.ulpin == ulpin.strip()).first()
    if not parcel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Parcel with ULPIN '{ulpin}' not found."
        )
    return parcel

@router.post("", response_model=ParcelResponse, status_code=status.HTTP_201_CREATED)
def create_parcel(
    parcel_in: ParcelCreate,
    db: Session = Depends(get_db),
    _user=Depends(require_officer_or_above)
):
    """Register a new land parcel (Officer / Admin privilege required)."""
    existing = db.query(Parcel).filter(Parcel.ulpin == parcel_in.ulpin).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Parcel with ULPIN '{parcel_in.ulpin}' already exists."
        )
    parcel = Parcel(**parcel_in.model_dump())
    db.add(parcel)
    db.commit()
    db.refresh(parcel)
    return parcel
