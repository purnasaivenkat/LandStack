import enum
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class EncumbranceStatus(str, enum.Enum):
    NONE = "NONE"
    ACTIVE = "ACTIVE"
    RELEASED = "RELEASED"

class Encumbrance(Base):
    """Encumbrance Certificate (EC), Mortgages, Bank Liens and Charges"""
    __tablename__ = "encumbrance"

    id = Column(Integer, primary_key=True, index=True)
    ulpin = Column(String(50), ForeignKey("parcels.ulpin", ondelete="CASCADE"), nullable=False, index=True)
    has_encumbrance = Column(Boolean, default=False, nullable=False)
    bank_name = Column(String(150), nullable=True)  # e.g., "State Bank of India", "HDFC Bank"
    loan_account_no = Column(String(100), nullable=True)
    mortgage_amount = Column(Float, nullable=True, default=0.0)
    date_of_mortgage = Column(String(50), nullable=True)
    status = Column(Enum(EncumbranceStatus), default=EncumbranceStatus.NONE, nullable=False)
    ec_certificate_number = Column(String(100), nullable=True)
    period_from = Column(String(50), nullable=True)
    period_to = Column(String(50), nullable=True)
    remarks = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    parcel = relationship("Parcel", back_populates="encumbrances")
