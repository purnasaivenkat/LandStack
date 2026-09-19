from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class RegistrationBase(BaseModel):
    ulpin: str
    deed_number: str
    registration_date: str
    sro_name: str
    party_seller: str
    party_buyer: str
    consideration_amount: float
    stamp_duty_paid: float
    market_value: float
    document_url: Optional[str] = None

class RegistrationCreate(RegistrationBase):
    pass

class RegistrationResponse(RegistrationBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: Optional[datetime] = None
