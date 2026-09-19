from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.models.encumbrance import EncumbranceStatus

class EncumbranceBase(BaseModel):
    ulpin: str
    has_encumbrance: bool = False
    bank_name: Optional[str] = None
    loan_account_no: Optional[str] = None
    mortgage_amount: Optional[float] = 0.0
    date_of_mortgage: Optional[str] = None
    status: EncumbranceStatus = EncumbranceStatus.NONE
    ec_certificate_number: Optional[str] = None
    period_from: Optional[str] = None
    period_to: Optional[str] = None
    remarks: Optional[str] = None

class EncumbranceCreate(EncumbranceBase):
    pass

class EncumbranceResponse(EncumbranceBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: Optional[datetime] = None
