from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.land_use import LandUse
from app.schemas.land_use import LandUseResponse, LandUseCreate
from app.security.rbac import require_officer_or_above

router = APIRouter(prefix="/land-use", tags=["Land Use & Master Plan Zoning"])

@router.get("/{ulpin}", response_model=LandUseResponse)
def get_land_use_by_ulpin(ulpin: str, db: Session = Depends(get_db)):
    """Retrieve statutory master plan zoning and agricultural conversion status for a given ULPIN."""
    record = db.query(LandUse).filter(LandUse.ulpin == ulpin.strip()).first()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Land use record not found for ULPIN '{ulpin}'."
        )
    return record

@router.post("", response_model=LandUseResponse, status_code=status.HTTP_201_CREATED)
def create_land_use_record(
    lu_in: LandUseCreate,
    db: Session = Depends(get_db),
    _user=Depends(require_officer_or_above)
):
    """Post land use and zoning classification (Officer/Admin required)."""
    record = LandUse(**lu_in.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    return record
