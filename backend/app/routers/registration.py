from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.registration import Registration
from app.schemas.registration import RegistrationResponse, RegistrationCreate
from app.security.rbac import require_officer_or_above

router = APIRouter(prefix="/registration", tags=["Sub-Registrar Deeds & Stamp Duty"])

@router.get("/{ulpin}", response_model=RegistrationResponse)
def get_registration_by_ulpin(ulpin: str, db: Session = Depends(get_db)):
    """Retrieve registered sale deed and stamp duty details for a given ULPIN."""
    record = db.query(Registration).filter(Registration.ulpin == ulpin.strip()).first()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Registration deed not found for ULPIN '{ulpin}'."
        )
    return record

@router.post("", response_model=RegistrationResponse, status_code=status.HTTP_201_CREATED)
def create_registration_record(
    reg_in: RegistrationCreate,
    db: Session = Depends(get_db),
    _user=Depends(require_officer_or_above)
):
    """Record a deed registration entry (Officer/Admin required)."""
    record = Registration(**reg_in.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    return record
