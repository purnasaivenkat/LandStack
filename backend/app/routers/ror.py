from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.ror import RoR
from app.schemas.ror import RoRResponse, RoRCreate
from app.security.rbac import require_officer_or_above

router = APIRouter(prefix="/ror", tags=["Record of Rights (RoR / Pahani)"])

@router.get("/{ulpin}", response_model=RoRResponse)
def get_ror_by_ulpin(ulpin: str, db: Session = Depends(get_db)):
    """Retrieve the legal Record of Rights (RoR) for a given ULPIN."""
    record = db.query(RoR).filter(RoR.ulpin == ulpin.strip()).first()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Record of Rights not found for ULPIN '{ulpin}'."
        )
    return record

@router.post("", response_model=RoRResponse, status_code=status.HTTP_201_CREATED)
def create_ror_record(
    ror_in: RoRCreate,
    db: Session = Depends(get_db),
    _user=Depends(require_officer_or_above)
):
    """Create or update Record of Rights (Officer/Admin required)."""
    record = RoR(**ror_in.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    return record
