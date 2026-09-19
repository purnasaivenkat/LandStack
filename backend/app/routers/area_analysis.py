from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.parcel import Parcel
from app.schemas.area_analysis import (
    AreaAnalysisByUlpinsRequest,
    AreaAnalysisSpatialRequest,
    AreaAnalysisResponse,
)
from app.services.profile_service import perform_area_analysis

router = APIRouter(prefix="/area-analysis", tags=["Area Analysis (Member 1 GIS Integration)"])

@router.post(
    "/by-ulpins",
    response_model=AreaAnalysisResponse,
    summary="Batch area analysis for GIS-selected ULPINs",
    response_description="Complete parcel profiles and aggregate risk/area statistics for the selected ULPIN list."
)
def analyze_selected_ulpins(
    payload: AreaAnalysisByUlpinsRequest,
    db: Session = Depends(get_db)
):
    """
    **Area-Analysis Integration for Member 1 (GIS Specialist)**
    
    Receives an array of ULPINs from GIS map selection (e.g., `["UL001", "UL002", "UL003", "UL004"]`),
    retrieves their full relational records, calculates discrepancies, and returns aggregate statistics:
    - Total GIS Area vs Total Document Area
    - Discrepancy Extent
    - Disputed Parcel Count (Court stays)
    - Encumbered / Mortgaged Count
    - Tax Default Count & Total Dues
    - Zoning breakdown
    - Health Score (0-100)
    """
    if not payload.ulpins:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ULPIN list cannot be empty."
        )
    return perform_area_analysis(payload.ulpins, db)

@router.post(
    "/spatial",
    response_model=AreaAnalysisResponse,
    summary="Spatial Bounding Box Area Query",
    response_description="All parcels intersecting the bounding box coordinates."
)
def analyze_spatial_bounding_box(
    bounds: AreaAnalysisSpatialRequest,
    db: Session = Depends(get_db)
):
    """Query parcels within a geographic bounding box [min_lat, max_lat, min_lng, max_lng]."""
    parcels = db.query(Parcel).filter(
        Parcel.centroid_lat >= bounds.min_lat,
        Parcel.centroid_lat <= bounds.max_lat,
        Parcel.centroid_lng >= bounds.min_lng,
        Parcel.centroid_lng <= bounds.max_lng
    ).all()

    ulpins = [p.ulpin for p in parcels]
    return perform_area_analysis(ulpins, db)
