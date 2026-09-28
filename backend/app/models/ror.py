from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class RoR(Base):
    """Record of Rights (Pahani / Jamabandi / 7/12 extract)"""
    __tablename__ = "ror"

    id = Column(Integer, primary_key=True, index=True)
    ulpin = Column(String(50), ForeignKey("parcels.ulpin", ondelete="CASCADE"), nullable=False, index=True)
    khata_number = Column(String(50), nullable=False)
    primary_owner = Column(String(150), nullable=False)
    father_name = Column(String(150), nullable=True)
    joint_owners = Column(String(255), nullable=True)  # Comma-separated or JSON list
    document_area_acres = Column(Float, nullable=False)  # Area legally recorded in RoR
    land_type = Column(String(50), nullable=False, default="Dry")  # Dry, Wet, Garden, Commercial
    soil_type = Column(String(50), nullable=True)
    mutation_number = Column(String(50), nullable=True)
    mutated_date = Column(String(50), nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    parcel = relationship("Parcel", back_populates="ror_records")
