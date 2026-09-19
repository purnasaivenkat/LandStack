from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.encumbrance import Encumbrance
from app.schemas.encumbrance import EncumbranceResponse, EncumbranceCreate
from app.security.rbac import require_officer_or_above

router = APIRouter(prefix="/encumbrance", tags=["Encumbrance & Bank Liens"])

@router.get("/{ulpin}", response_model=EncumbranceResponse)
def get_encumbrance_by_ulpin(ulpin: str, db: Session = Depends(get_db)):
    """Retrieve Encumbrance Certificate (EC) and bank lien status for a given ULPIN."""
    record = db.query(Encumbrance).filter(Encumbrance.ulpin == ulpin.strip()).order_by(Encumbrance.id.desc()).first()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Encumbrance certificate record not found for ULPIN '{ulpin}'."
        )
    return record

@router.post("", response_model=EncumbranceResponse, status_code=status.HTTP_201_CREATED)
def create_encumbrance_record(
    enc_in: EncumbranceCreate,
    db: Session = Depends(get_db),
    _user=Depends(require_officer_or_above)
):
    """Add a mortgage/encumbrance entry (Officer/Admin required)."""
    record = Encumbrance(**enc_in.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    return record
