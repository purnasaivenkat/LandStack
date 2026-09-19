import enum
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class CourtCaseStatus(str, enum.Enum):
    PENDING = "PENDING"
    STAY_GRANTED = "STAY_GRANTED"
    DISPOSED_FAVOURABLE = "DISPOSED_FAVOURABLE"
    DISPOSED_DISMISSED = "DISPOSED_DISMISSED"
    NO_LITIGATION = "NO_LITIGATION"

class CourtCase(Base):
    """Litigation, Title Disputes, Injunctions and High Court / Civil Court Cases"""
    __tablename__ = "court_cases"

    id = Column(Integer, primary_key=True, index=True)
    ulpin = Column(String(50), ForeignKey("parcels.ulpin", ondelete="CASCADE"), nullable=False, index=True)
    has_litigation = Column(Boolean, default=False, nullable=False)
    case_number = Column(String(100), nullable=True)  # e.g., "OS No 412/2022" or "WP 8912/2023"
    court_name = Column(String(150), nullable=True)  # e.g., "High Court of Karnataka", "City Civil Court"
    case_type = Column(String(100), nullable=True)  # "Title Suit", "Injunction", "Partition Suit"
    petitioner = Column(String(150), nullable=True)
    respondent = Column(String(150), nullable=True)
    stay_order_active = Column(Boolean, default=False, nullable=False)  # If True, land alienation/sale is frozen
    case_status = Column(Enum(CourtCaseStatus), default=CourtCaseStatus.NO_LITIGATION, nullable=False)
    filing_date = Column(String(50), nullable=True)
    next_hearing_date = Column(String(50), nullable=True)
    case_summary = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    parcel = relationship("Parcel", back_populates="court_cases")
