from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.court_case import CourtCase
from app.schemas.court_case import CourtCaseResponse, CourtCaseCreate
from app.security.rbac import require_officer_or_above

router = APIRouter(prefix="/court-cases", tags=["Court Cases & Stay Orders"])

@router.get("/{ulpin}", response_model=CourtCaseResponse)
def get_court_cases_by_ulpin(ulpin: str, db: Session = Depends(get_db)):
    """Retrieve litigation status, civil disputes, and stay orders for a given ULPIN."""
    record = db.query(CourtCase).filter(CourtCase.ulpin == ulpin.strip()).first()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Court case records not found for ULPIN '{ulpin}'."
        )
    return record

@router.post("", response_model=CourtCaseResponse, status_code=status.HTTP_201_CREATED)
def create_court_case_record(
    case_in: CourtCaseCreate,
    db: Session = Depends(get_db),
    _user=Depends(require_officer_or_above)
):
    """Register a litigation or court injunction record (Officer/Admin required)."""
    record = CourtCase(**case_in.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    return record
