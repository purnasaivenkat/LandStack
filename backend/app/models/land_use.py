import enum
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class MasterPlanZone(str, enum.Enum):
    AGRICULTURAL = "AGRICULTURAL"
    RESIDENTIAL = "RESIDENTIAL"
    COMMERCIAL = "COMMERCIAL"
    INDUSTRIAL = "INDUSTRIAL"
    GREEN_BELT = "GREEN_BELT"
    PUBLIC_UTILITY = "PUBLIC_UTILITY"

class LandUse(Base):
    """Zoning master plan, statutory land use classification and conversion orders (CLU)"""
    __tablename__ = "land_use"

    id = Column(Integer, primary_key=True, index=True)
    ulpin = Column(String(50), ForeignKey("parcels.ulpin", ondelete="CASCADE"), nullable=False, index=True)
    master_plan_zone = Column(Enum(MasterPlanZone), default=MasterPlanZone.AGRICULTURAL, nullable=False)
    current_usage = Column(String(100), nullable=False)  # e.g., "Paddy Cultivation", "Commercial Warehouse"
    is_converted = Column(Boolean, default=False, nullable=False)  # Statutory agricultural to non-agricultural conversion
    conversion_order_no = Column(String(100), nullable=True)  # DC Conversion Order #
    conversion_date = Column(String(50), nullable=True)
    zoning_authority = Column(String(100), nullable=False, default="BMRDA / BDA")
    flood_zone_risk = Column(String(50), default="LOW")  # LOW, MODERATE, HIGH
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    parcel = relationship("Parcel", back_populates="land_uses")
