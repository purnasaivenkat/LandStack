from sqlalchemy import Column, String, Float, DateTime, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class Parcel(Base):
    __tablename__ = "parcels"

    ulpin = Column(String(50), primary_key=True, index=True)  # Unique Land Parcel Identification Number
    state = Column(String(100), nullable=False, default="Karnataka")
    district = Column(String(100), nullable=False, default="Bengaluru Urban")
    taluk = Column(String(100), nullable=False, default="Bengaluru South")
    village = Column(String(100), nullable=False, default="Kengeri")
    survey_number = Column(String(50), nullable=False)
    sub_division = Column(String(50), nullable=True)
    gis_area_acres = Column(Float, nullable=False)  # Area measured from GIS boundary / PostGIS
    centroid_lat = Column(Float, nullable=True)
    centroid_lng = Column(Float, nullable=True)
    geometry_geojson = Column(Text, nullable=True)  # GeoJSON polygon/multipolygon string
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships to child land record datasets
    ror_records = relationship("RoR", back_populates="parcel", cascade="all, delete-orphan")
    registrations = relationship("Registration", back_populates="parcel", cascade="all, delete-orphan")
    taxes = relationship("Tax", back_populates="parcel", cascade="all, delete-orphan")
    encumbrances = relationship("Encumbrance", back_populates="parcel", cascade="all, delete-orphan")
    land_uses = relationship("LandUse", back_populates="parcel", cascade="all, delete-orphan")
    building_permits = relationship("BuildingPermit", back_populates="parcel", cascade="all, delete-orphan")
    court_cases = relationship("CourtCase", back_populates="parcel", cascade="all, delete-orphan")
