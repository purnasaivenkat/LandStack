from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.models.tax import TaxPaymentStatus

class TaxBase(BaseModel):
    ulpin: str
    assessment_year: str
    property_tax_due: float = 0.0
    cess_amount: float = 0.0
    penalties: float = 0.0
    total_paid: float = 0.0
    payment_status: TaxPaymentStatus = TaxPaymentStatus.PAID
    last_payment_date: Optional[str] = None
    receipt_number: Optional[str] = None

class TaxCreate(TaxBase):
    pass

class TaxResponse(TaxBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: Optional[datetime] = None
