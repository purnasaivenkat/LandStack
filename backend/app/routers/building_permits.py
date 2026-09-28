from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.building_permit import BuildingPermit
from app.schemas.building_permit import BuildingPermitResponse, BuildingPermitCreate
from app.security.rbac import require_officer_or_above

router = APIRouter(prefix="/building-permit", tags=["Building Permits & Sanctions"])

@router.get("/{ulpin}", response_model=BuildingPermitResponse)
def get_building_permit_by_ulpin(ulpin: str, db: Session = Depends(get_db)):
    """Retrieve municipal building permit, sanctioned floors, and deviation detection for a given ULPIN."""
    record = db.query(BuildingPermit).filter(BuildingPermit.ulpin == ulpin.strip()).first()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Building permit record not found for ULPIN '{ulpin}'."
        )
    return record

@router.post("", response_model=BuildingPermitResponse, status_code=status.HTTP_201_CREATED)
def create_building_permit_record(
    permit_in: BuildingPermitCreate,
    db: Session = Depends(get_db),
    _user=Depends(require_officer_or_above)
):
    """Post building permit sanction details (Officer/Admin required)."""
    record = BuildingPermit(**permit_in.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    return record
