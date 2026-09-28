from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.tax import Tax
from app.schemas.tax import TaxResponse, TaxCreate
from app.security.rbac import require_officer_or_above

router = APIRouter(prefix="/tax", tags=["Property Tax & Revenue"])

@router.get("/{ulpin}", response_model=TaxResponse)
def get_tax_by_ulpin(ulpin: str, db: Session = Depends(get_db)):
    """Retrieve property tax assessment and dues status for a given ULPIN."""
    record = db.query(Tax).filter(Tax.ulpin == ulpin.strip()).order_by(Tax.id.desc()).first()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tax assessment record not found for ULPIN '{ulpin}'."
        )
    return record

@router.post("", response_model=TaxResponse, status_code=status.HTTP_201_CREATED)
def create_tax_record(
    tax_in: TaxCreate,
    db: Session = Depends(get_db),
    _user=Depends(require_officer_or_above)
):
    """Post a tax assessment or receipt record (Officer/Admin required)."""
    record = Tax(**tax_in.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    return record
