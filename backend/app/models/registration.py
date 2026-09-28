from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class Registration(Base):
    """Sub-Registrar Deed Registration and Stamp Duty records"""
    __tablename__ = "registration"

    id = Column(Integer, primary_key=True, index=True)
    ulpin = Column(String(50), ForeignKey("parcels.ulpin", ondelete="CASCADE"), nullable=False, index=True)
    deed_number = Column(String(100), nullable=False, unique=True)
    registration_date = Column(String(50), nullable=False)
    sro_name = Column(String(100), nullable=False)  # e.g., "SRO Kengeri"
    party_seller = Column(String(150), nullable=False)
    party_buyer = Column(String(150), nullable=False)
    consideration_amount = Column(Float, nullable=False)  # Transaction price in INR
    stamp_duty_paid = Column(Float, nullable=False)
    market_value = Column(Float, nullable=False)  # Guideline / Circle rate value
    document_url = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    parcel = relationship("Parcel", back_populates="registrations")
