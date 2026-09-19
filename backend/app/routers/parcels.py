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
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    """Retrieve all land parcels with optional filters."""
    query = db.query(Parcel)
    if village:
        query = query.filter(Parcel.village.ilike(f"%{village}%"))
    if survey_number:
        query = query.filter(Parcel.survey_number == survey_number)
    return query.limit(limit).all()

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
