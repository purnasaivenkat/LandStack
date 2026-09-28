import enum
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class PermitApprovalStatus(str, enum.Enum):
    APPROVED = "APPROVED"
    PENDING = "PENDING"
    REJECTED = "REJECTED"
    NO_PERMIT = "NO_PERMIT"
    REVOKED = "REVOKED"

class BuildingPermit(Base):
    """Municipal Building Sanction Plans, Approvals and Occupancy Certificates"""
    __tablename__ = "building_permits"

    id = Column(Integer, primary_key=True, index=True)
    ulpin = Column(String(50), ForeignKey("parcels.ulpin", ondelete="CASCADE"), nullable=False, index=True)
    permit_number = Column(String(100), nullable=True)
    sanctioning_authority = Column(String(100), nullable=False, default="BBMP / BDA")
    sanctioned_floors = Column(Integer, default=0)
    actual_floors = Column(Integer, default=0)
    sanctioned_builtup_area_sqft = Column(Float, default=0.0)
    actual_builtup_area_sqft = Column(Float, default=0.0)
    approval_status = Column(Enum(PermitApprovalStatus), default=PermitApprovalStatus.NO_PERMIT, nullable=False)
    approval_date = Column(String(50), nullable=True)
    expiry_date = Column(String(50), nullable=True)
    occupancy_certificate_issued = Column(Boolean, default=False)
    deviation_detected = Column(Boolean, default=False)  # True if actual > sanctioned or unapproved floors
    violation_remarks = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    parcel = relationship("Parcel", back_populates="building_permits")
