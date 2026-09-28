import enum
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class TaxPaymentStatus(str, enum.Enum):
    PAID = "PAID"
    PARTIAL = "PARTIAL"
    DUE = "DUE"
    DEFAULTED = "DEFAULTED"

class Tax(Base):
    """Property Tax, Cess and Municipal revenue assessment records"""
    __tablename__ = "tax"

    id = Column(Integer, primary_key=True, index=True)
    ulpin = Column(String(50), ForeignKey("parcels.ulpin", ondelete="CASCADE"), nullable=False, index=True)
    assessment_year = Column(String(20), nullable=False)  # e.g., "2024-2025"
    property_tax_due = Column(Float, nullable=False, default=0.0)
    cess_amount = Column(Float, nullable=False, default=0.0)
    penalties = Column(Float, nullable=False, default=0.0)
    total_paid = Column(Float, nullable=False, default=0.0)
    payment_status = Column(Enum(TaxPaymentStatus), default=TaxPaymentStatus.PAID, nullable=False)
    last_payment_date = Column(String(50), nullable=True)
    receipt_number = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    parcel = relationship("Parcel", back_populates="taxes")
