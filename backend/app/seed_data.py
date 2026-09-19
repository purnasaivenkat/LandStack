import json
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, Base
from app.models.user import User, UserRole
from app.models.parcel import Parcel
from app.models.ror import RoR
from app.models.registration import Registration
from app.models.tax import Tax, TaxPaymentStatus
from app.models.encumbrance import Encumbrance, EncumbranceStatus
from app.models.land_use import LandUse, MasterPlanZone
from app.models.building_permit import BuildingPermit, PermitApprovalStatus
from app.models.court_case import CourtCase, CourtCaseStatus
from app.security.auth_handler import get_password_hash

def seed_database(db: Session = None):
    close_db = False
    if db is None:
        Base.metadata.create_all(bind=engine)
        db = SessionLocal()
        close_db = True

    try:
        # Check if already seeded
        if db.query(Parcel).count() > 0:
            print("✓ Database already seeded. Skipping initial seeding.")
            return

        print("⚡ Seeding LandStack Relational Land-Record Database with Realistic Mock Data...")

        # 1. Seed Users (RBAC)
        users = [
            User(
                username="citizen",
                email="citizen@landstack.gov.in",
                hashed_password=get_password_hash("citizen123"),
                full_name="Purna Sai (Citizen)",
                role=UserRole.CITIZEN,
                department="Public Citizen",
                is_active=True
            ),
            User(
                username="officer",
                email="officer@landstack.gov.in",
                hashed_password=get_password_hash("officer123"),
                full_name="Dr. K. Ananth (Revenue Inspector)",
                role=UserRole.OFFICER,
                department="Department of Survey Settlement and Land Records",
                is_active=True
            ),
            User(
                username="admin",
                email="admin@landstack.gov.in",
                hashed_password=get_password_hash("admin123"),
                full_name="System Administrator",
                role=UserRole.ADMIN,
                department="LandStack Core Tech Team",
                is_active=True
            ),
        ]
        db.add_all(users)
        db.commit()

        # 2. Seed Mock Parcels with Realistic Discrepancies & Scenarios
        parcels_data = [
            # UL001: Clean Agricultural Parcel
            {
                "parcel": Parcel(
                    ulpin="UL001",
                    state="Karnataka",
                    district="Bengaluru Urban",
                    taluk="Bengaluru South",
                    village="Kengeri",
                    survey_number="104/1",
                    sub_division="A",
                    gis_area_acres=3.20,
                    centroid_lat=12.9125,
                    centroid_lng=77.4850,
                    geometry_geojson=json.dumps({"type": "Polygon", "coordinates": [[[77.484, 12.911], [77.486, 12.911], [77.486, 12.914], [77.484, 12.914], [77.484, 12.911]]]})
                ),
                "ror": RoR(
                    ulpin="UL001",
                    khata_number="KH-2021-8901",
                    primary_owner="Ravi Kumar",
                    father_name="Muniswamy Gowda",
                    joint_owners=None,
                    document_area_acres=3.20,
                    land_type="Dry Crop",
                    soil_type="Red Loamy",
                    mutation_number="MR-2018-0912",
                    mutated_date="2018-06-15"
                ),
                "registration": Registration(
                    ulpin="UL001",
                    deed_number="DEED-BNG-2018-4412",
                    registration_date="2018-05-10",
                    sro_name="SRO Kengeri",
                    party_seller="Krishnappa Gowda",
                    party_buyer="Ravi Kumar",
                    consideration_amount=4500000.0,
                    stamp_duty_paid=270000.0,
                    market_value=4800000.0,
                    document_url="https://landstack.gov.in/docs/deeds/UL001.pdf"
                ),
                "tax": Tax(
                    ulpin="UL001",
                    assessment_year="2024-2025",
                    property_tax_due=4500.0,
                    cess_amount=450.0,
                    penalties=0.0,
                    total_paid=4950.0,
                    payment_status=TaxPaymentStatus.PAID,
                    last_payment_date="2024-04-12",
                    receipt_number="TAX-REC-2024-0981"
                ),
                "encumbrance": Encumbrance(
                    ulpin="UL001",
                    has_encumbrance=False,
                    bank_name=None,
                    loan_account_no=None,
                    mortgage_amount=0.0,
                    date_of_mortgage=None,
                    status=EncumbranceStatus.NONE,
                    ec_certificate_number="EC-KNG-2024-5541",
                    period_from="2010-01-01",
                    period_to="2024-12-31",
                    remarks="Nil Encumbrance Certificate issued."
                ),
                "land_use": LandUse(
                    ulpin="UL001",
                    master_plan_zone=MasterPlanZone.AGRICULTURAL,
                    current_usage="Paddy & Ragi Cultivation",
                    is_converted=False,
                    conversion_order_no=None,
                    zoning_authority="BMRDA",
                    flood_zone_risk="LOW"
                ),
                "building_permit": BuildingPermit(
                    ulpin="UL001",
                    permit_number=None,
                    sanctioning_authority="Panchayat",
                    sanctioned_floors=0,
                    actual_floors=0,
                    sanctioned_builtup_area_sqft=0.0,
                    actual_builtup_area_sqft=0.0,
                    approval_status=PermitApprovalStatus.NO_PERMIT,
                    occupancy_certificate_issued=False,
                    deviation_detected=False
                ),
                "court_case": CourtCase(
                    ulpin="UL001",
                    has_litigation=False,
                    stay_order_active=False,
                    case_status=CourtCaseStatus.NO_LITIGATION,
                    case_summary="No active civil litigation."
                )
            },

            # UL002: AREA MISMATCH DEMO (GIS Area: 3.20 vs Document Area: 2.80)
            {
                "parcel": Parcel(
                    ulpin="UL002",
                    state="Karnataka",
                    district="Bengaluru Urban",
                    taluk="Bengaluru South",
                    village="Kengeri",
                    survey_number="104/2",
                    sub_division="B",
                    gis_area_acres=3.20,  # GIS Area = 3.20 Acres
                    centroid_lat=12.9135,
                    centroid_lng=77.4870,
                    geometry_geojson=json.dumps({"type": "Polygon", "coordinates": [[[77.486, 12.911], [77.488, 12.911], [77.488, 12.915], [77.486, 12.915], [77.486, 12.911]]]})
                ),
                "ror": RoR(
                    ulpin="UL002",
                    khata_number="KH-2020-5621",
                    primary_owner="Smt. Lakshmi Devi",
                    father_name="W/o Venkataraman",
                    joint_owners="Anand V, Deepa V",
                    document_area_acres=2.80,  # Document Area = 2.80 Acres (0.40 Acre Mismatch!)
                    land_type="Garden Land",
                    soil_type="Black Cotton",
                    mutation_number="MR-2015-1102",
                    mutated_date="2015-09-20"
                ),
                "registration": Registration(
                    ulpin="UL002",
                    deed_number="DEED-BNG-2015-1823",
                    registration_date="2015-08-14",
                    sro_name="SRO Kengeri",
                    party_seller="Narayan Swamy",
                    party_buyer="Smt. Lakshmi Devi",
                    consideration_amount=3800000.0,
                    stamp_duty_paid=228000.0,
                    market_value=4100000.0,
                    document_url="https://landstack.gov.in/docs/deeds/UL002.pdf"
                ),
                "tax": Tax(
                    ulpin="UL002",
                    assessment_year="2024-2025",
                    property_tax_due=5200.0,
                    cess_amount=520.0,
                    penalties=0.0,
                    total_paid=5720.0,
                    payment_status=TaxPaymentStatus.PAID,
                    last_payment_date="2024-05-19",
                    receipt_number="TAX-REC-2024-1184"
                ),
                "encumbrance": Encumbrance(
                    ulpin="UL002",
                    has_encumbrance=False,
                    status=EncumbranceStatus.NONE,
                    ec_certificate_number="EC-KNG-2024-6623",
                    period_from="2012-01-01",
                    period_to="2024-12-31",
                    remarks="Nil Encumbrance"
                ),
                "land_use": LandUse(
                    ulpin="UL002",
                    master_plan_zone=MasterPlanZone.AGRICULTURAL,
                    current_usage="Arecanut & Coconut Plantation",
                    is_converted=False,
                    zoning_authority="BMRDA",
                    flood_zone_risk="LOW"
                ),
                "building_permit": BuildingPermit(
                    ulpin="UL002",
                    permit_number=None,
                    approval_status=PermitApprovalStatus.NO_PERMIT,
                    deviation_detected=False
                ),
                "court_case": CourtCase(
                    ulpin="UL002",
                    has_litigation=False,
                    stay_order_active=False,
                    case_status=CourtCaseStatus.NO_LITIGATION
                )
            },

            # UL003: ACTIVE LITIGATION & STAY ORDER DEMO
            {
                "parcel": Parcel(
                    ulpin="UL003",
                    state="Karnataka",
                    district="Bengaluru Urban",
                    taluk="Bengaluru South",
                    village="Kengeri",
                    survey_number="105",
                    sub_division="1",
                    gis_area_acres=4.50,
                    centroid_lat=12.9150,
                    centroid_lng=77.4900,
                    geometry_geojson=json.dumps({"type": "Polygon", "coordinates": [[[77.489, 12.913], [77.492, 12.913], [77.492, 12.917], [77.489, 12.917], [77.489, 12.913]]]})
                ),
                "ror": RoR(
                    ulpin="UL003",
                    khata_number="KH-2019-3312",
                    primary_owner="Ramesh Gowda",
                    father_name="Late Byregowda",
                    joint_owners="Suresh Gowda, Manjunath Gowda",
                    document_area_acres=4.50,
                    land_type="Dry",
                    soil_type="Red Soil",
                    mutation_number="MR-2019-0418",
                    mutated_date="2019-03-10"
                ),
                "registration": Registration(
                    ulpin="UL003",
                    deed_number="DEED-BNG-2019-9941",
                    registration_date="2019-02-28",
                    sro_name="SRO Kengeri",
                    party_seller="Byregowda Heirs",
                    party_buyer="Ramesh Gowda",
                    consideration_amount=7200000.0,
                    stamp_duty_paid=432000.0,
                    market_value=7500000.0,
                    document_url="https://landstack.gov.in/docs/deeds/UL003.pdf"
                ),
                "tax": Tax(
                    ulpin="UL003",
                    assessment_year="2024-2025",
                    property_tax_due=6800.0,
                    cess_amount=680.0,
                    penalties=0.0,
                    total_paid=7480.0,
                    payment_status=TaxPaymentStatus.PAID,
                    last_payment_date="2024-03-30",
                    receipt_number="TAX-REC-2024-2201"
                ),
                "encumbrance": Encumbrance(
                    ulpin="UL003",
                    has_encumbrance=False,
                    status=EncumbranceStatus.NONE,
                    ec_certificate_number="EC-KNG-2024-7712",
                    remarks="Title dispute reported."
                ),
                "land_use": LandUse(
                    ulpin="UL003",
                    master_plan_zone=MasterPlanZone.AGRICULTURAL,
                    current_usage="Fallow / Disputed Land",
                    is_converted=False,
                    zoning_authority="BMRDA"
                ),
                "building_permit": BuildingPermit(
                    ulpin="UL003",
                    approval_status=PermitApprovalStatus.NO_PERMIT
                ),
                "court_case": CourtCase(
                    ulpin="UL003",
                    has_litigation=True,
                    case_number="OS No 412/2023",
                    court_name="City Civil Court, Bengaluru",
                    case_type="Partition & Title Injunction Suit",
                    petitioner="Manjunath Gowda",
                    respondent="Ramesh Gowda & Sub-Registrar",
                    stay_order_active=True,  # Active Judicial Stay Order!
                    case_status=CourtCaseStatus.STAY_GRANTED,
                    filing_date="2023-04-14",
                    next_hearing_date="2026-10-15",
                    case_summary="Stay order operating against alienation or creating third-party rights pending partition of ancestral assets."
                )
            },

            # UL004: ACTIVE HEAVY MORTGAGE ENCUMBRANCE DEMO
            {
                "parcel": Parcel(
                    ulpin="UL004",
                    state="Karnataka",
                    district="Bengaluru Urban",
                    taluk="Bengaluru South",
                    village="Kengeri",
                    survey_number="106/1",
                    sub_division="C",
                    gis_area_acres=1.50,
                    centroid_lat=12.9180,
                    centroid_lng=77.4930,
                    geometry_geojson=json.dumps({"type": "Polygon", "coordinates": [[[77.491, 12.916], [77.494, 12.916], [77.494, 12.919], [77.491, 12.919], [77.491, 12.916]]]})
                ),
                "ror": RoR(
                    ulpin="UL004",
                    khata_number="KH-2022-7719",
                    primary_owner="Venkatesh Prasad",
                    father_name="Rama Rao",
                    joint_owners=None,
                    document_area_acres=1.50,
                    land_type="Converted Commercial",
                    soil_type="Red Loamy",
                    mutation_number="MR-2021-0819",
                    mutated_date="2021-07-22"
                ),
                "registration": Registration(
                    ulpin="UL004",
                    deed_number="DEED-BNG-2021-6541",
                    registration_date="2021-06-18",
                    sro_name="SRO Kengeri",
                    party_seller="Devraj Developers",
                    party_buyer="Venkatesh Prasad",
                    consideration_amount=12500000.0,
                    stamp_duty_paid=750000.0,
                    market_value=13000000.0,
                    document_url="https://landstack.gov.in/docs/deeds/UL004.pdf"
                ),
                "tax": Tax(
                    ulpin="UL004",
                    assessment_year="2024-2025",
                    property_tax_due=18500.0,
                    cess_amount=1850.0,
                    total_paid=20350.0,
                    payment_status=TaxPaymentStatus.PAID,
                    last_payment_date="2024-04-05",
                    receipt_number="TAX-REC-2024-3310"
                ),
                "encumbrance": Encumbrance(
                    ulpin="UL004",
                    has_encumbrance=True,
                    bank_name="State Bank of India (Commercial Branch)",
                    loan_account_no="SBI-TERM-89912049",
                    mortgage_amount=45000000.0,  # ₹4.5 Crore Active Mortgage Lien
                    date_of_mortgage="2022-01-15",
                    status=EncumbranceStatus.ACTIVE,
                    ec_certificate_number="EC-KNG-2024-9912",
                    period_from="2020-01-01",
                    period_to="2024-12-31",
                    remarks="Active registered simple mortgage in favor of State Bank of India."
                ),
                "land_use": LandUse(
                    ulpin="UL004",
                    master_plan_zone=MasterPlanZone.COMMERCIAL,
                    current_usage="Commercial Auto Showroom",
                    is_converted=True,
                    conversion_order_no="DC/REV/CLU/2021/892",
                    conversion_date="2021-04-12",
                    zoning_authority="BDA"
                ),
                "building_permit": BuildingPermit(
                    ulpin="UL004",
                    permit_number="BBMP/BP/2021/0451",
                    sanctioning_authority="BBMP",
                    sanctioned_floors=2,
                    actual_floors=2,
                    sanctioned_builtup_area_sqft=14000.0,
                    actual_builtup_area_sqft=13800.0,
                    approval_status=PermitApprovalStatus.APPROVED,
                    occupancy_certificate_issued=True,
                    deviation_detected=False
                ),
                "court_case": CourtCase(
                    ulpin="UL004",
                    has_litigation=False,
                    stay_order_active=False,
                    case_status=CourtCaseStatus.NO_LITIGATION
                )
            },

            # UL005: TAX DEFAULTER DEMO
            {
                "parcel": Parcel(
                    ulpin="UL005",
                    state="Karnataka",
                    district="Bengaluru Urban",
                    taluk="Bengaluru South",
                    village="Kengeri",
                    survey_number="107",
                    sub_division="2",
                    gis_area_acres=2.10,
                    centroid_lat=12.9210,
                    centroid_lng=77.4960,
                    geometry_geojson=json.dumps({"type": "Polygon", "coordinates": [[[77.494, 12.919], [77.498, 12.919], [77.498, 12.923], [77.494, 12.923], [77.494, 12.919]]]})
                ),
                "ror": RoR(
                    ulpin="UL005",
                    khata_number="KH-2018-9940",
                    primary_owner="Anand Rao",
                    father_name="K. N. Rao",
                    joint_owners=None,
                    document_area_acres=2.10,
                    land_type="Dry",
                    soil_type="Red Gravel",
                    mutation_number="MR-2014-0312",
                    mutated_date="2014-04-10"
                ),
                "registration": Registration(
                    ulpin="UL005",
                    deed_number="DEED-BNG-2014-4112",
                    registration_date="2014-03-22",
                    sro_name="SRO Kengeri",
                    party_seller="Prakash Developers",
                    party_buyer="Anand Rao",
                    consideration_amount=3500000.0,
                    stamp_duty_paid=210000.0,
                    market_value=3600000.0,
                    document_url="https://landstack.gov.in/docs/deeds/UL005.pdf"
                ),
                "tax": Tax(
                    ulpin="UL005",
                    assessment_year="2024-2025",
                    property_tax_due=65000.0,
                    cess_amount=6500.0,
                    penalties=6500.0,
                    total_paid=0.0,
                    payment_status=TaxPaymentStatus.DEFAULTED,  # 3 Years Defaulted Taxes
                    last_payment_date=None,
                    receipt_number=None
                ),
                "encumbrance": Encumbrance(
                    ulpin="UL005",
                    has_encumbrance=False,
                    status=EncumbranceStatus.NONE,
                    ec_certificate_number="EC-KNG-2024-1109"
                ),
                "land_use": LandUse(
                    ulpin="UL005",
                    master_plan_zone=MasterPlanZone.RESIDENTIAL,
                    current_usage="Vacant Plot Layout",
                    is_converted=True,
                    conversion_order_no="DC/CLU/2016/401",
                    zoning_authority="BDA"
                ),
                "building_permit": BuildingPermit(
                    ulpin="UL005",
                    approval_status=PermitApprovalStatus.NO_PERMIT
                ),
                "court_case": CourtCase(
                    ulpin="UL005",
                    has_litigation=False,
                    stay_order_active=False,
                    case_status=CourtCaseStatus.NO_LITIGATION
                )
            },

            # UL006: UNAUTHORIZED CONSTRUCTION & ZONING CONFLICT DEMO
            {
                "parcel": Parcel(
                    ulpin="UL006",
                    state="Karnataka",
                    district="Bengaluru Urban",
                    taluk="Bengaluru South",
                    village="Kengeri",
                    survey_number="108",
                    sub_division="A",
                    gis_area_acres=1.80,
                    centroid_lat=12.9230,
                    centroid_lng=77.4990,
                    geometry_geojson=json.dumps({"type": "Polygon", "coordinates": [[[77.497, 12.921], [77.501, 12.921], [77.501, 12.925], [77.497, 12.925], [77.497, 12.921]]]})
                ),
                "ror": RoR(
                    ulpin="UL006",
                    khata_number="KH-2021-4431",
                    primary_owner="Horizon Logistics LLP",
                    father_name="Rep by Partner M. Jain",
                    document_area_acres=1.80,
                    land_type="Dry",
                    mutation_number="MR-2021-1209"
                ),
                "registration": Registration(
                    ulpin="UL006",
                    deed_number="DEED-BNG-2021-9988",
                    registration_date="2021-11-15",
                    sro_name="SRO Kengeri",
                    party_seller="Chennappa Heirs",
                    party_buyer="Horizon Logistics LLP",
                    consideration_amount=9500000.0,
                    stamp_duty_paid=570000.0,
                    market_value=10000000.0
                ),
                "tax": Tax(
                    ulpin="UL006",
                    assessment_year="2024-2025",
                    property_tax_due=12000.0,
                    cess_amount=1200.0,
                    total_paid=13200.0,
                    payment_status=TaxPaymentStatus.PAID,
                    receipt_number="TAX-REC-2024-4421"
                ),
                "encumbrance": Encumbrance(
                    ulpin="UL006",
                    has_encumbrance=False,
                    status=EncumbranceStatus.NONE
                ),
                "land_use": LandUse(
                    ulpin="UL006",
                    master_plan_zone=MasterPlanZone.GREEN_BELT,  # Statutory Green Belt / Agricultural!
                    current_usage="Commercial Logistics Hub & Heavy Warehouse",  # Unlawful conversion!
                    is_converted=False,  # No conversion order
                    zoning_authority="BMRDA"
                ),
                "building_permit": BuildingPermit(
                    ulpin="UL006",
                    permit_number="BMA/DEV/2022/90",
                    sanctioning_authority="Panchayat",
                    sanctioned_floors=1,
                    actual_floors=4,  # +3 Unauthorized floors!
                    sanctioned_builtup_area_sqft=4000.0,
                    actual_builtup_area_sqft=18000.0,
                    approval_status=PermitApprovalStatus.APPROVED,
                    occupancy_certificate_issued=False,
                    deviation_detected=True,
                    violation_remarks="Major structural floor deviation: 4 floors constructed against G+0 sanction in Green Belt."
                ),
                "court_case": CourtCase(
                    ulpin="UL006",
                    has_litigation=False,
                    stay_order_active=False,
                    case_status=CourtCaseStatus.NO_LITIGATION
                )
            }
        ]

        # Additional standard parcels (UL007 to UL012)
        for i in range(7, 13):
            ulpin_id = f"UL00{i:02d}" if i < 10 else f"UL0{i:02d}"
            parcels_data.append({
                "parcel": Parcel(
                    ulpin=ulpin_id,
                    state="Karnataka",
                    district="Bengaluru Urban",
                    taluk="Bengaluru South",
                    village="Kengeri",
                    survey_number=f"{108 + i}/{i%3 + 1}",
                    sub_division="A",
                    gis_area_acres=round(1.0 + (i * 0.35), 2),
                    centroid_lat=round(12.9200 + (i * 0.003), 4),
                    centroid_lng=round(77.4950 + (i * 0.003), 4),
                    geometry_geojson=json.dumps({"type": "Polygon", "coordinates": [[[77.495 + i*0.003, 12.920 + i*0.003], [77.497 + i*0.003, 12.920 + i*0.003], [77.497 + i*0.003, 12.922 + i*0.003], [77.495 + i*0.003, 12.922 + i*0.003], [77.495 + i*0.003, 12.920 + i*0.003]]]})
                ),
                "ror": RoR(
                    ulpin=ulpin_id,
                    khata_number=f"KH-2023-{5000 + i}",
                    primary_owner=f"Landowner {i} (Bengaluru)",
                    document_area_acres=round(1.0 + (i * 0.35), 2),
                    land_type="Dry",
                    mutation_number=f"MR-2020-{1000 + i}"
                ),
                "registration": Registration(
                    ulpin=ulpin_id,
                    deed_number=f"DEED-BNG-2020-{3000 + i}",
                    registration_date="2020-07-15",
                    sro_name="SRO Kengeri",
                    party_seller="Prior Owner",
                    party_buyer=f"Landowner {i} (Bengaluru)",
                    consideration_amount=5000000.0 + (i * 500000),
                    stamp_duty_paid=300000.0 + (i * 30000),
                    market_value=5500000.0 + (i * 500000)
                ),
                "tax": Tax(
                    ulpin=ulpin_id,
                    assessment_year="2024-2025",
                    property_tax_due=5000.0 + (i * 400),
                    cess_amount=500.0,
                    total_paid=5500.0 + (i * 400),
                    payment_status=TaxPaymentStatus.PAID,
                    receipt_number=f"TAX-REC-2024-{8000 + i}"
                ),
                "encumbrance": Encumbrance(
                    ulpin=ulpin_id,
                    has_encumbrance=False,
                    status=EncumbranceStatus.NONE
                ),
                "land_use": LandUse(
                    ulpin=ulpin_id,
                    master_plan_zone=MasterPlanZone.RESIDENTIAL if i % 2 == 0 else MasterPlanZone.AGRICULTURAL,
                    current_usage="Residential Housing" if i % 2 == 0 else "Farming",
                    is_converted=True if i % 2 == 0 else False,
                    zoning_authority="BDA"
                ),
                "building_permit": BuildingPermit(
                    ulpin=ulpin_id,
                    sanctioned_floors=2 if i % 2 == 0 else 0,
                    actual_floors=2 if i % 2 == 0 else 0,
                    approval_status=PermitApprovalStatus.APPROVED if i % 2 == 0 else PermitApprovalStatus.NO_PERMIT,
                    deviation_detected=False
                ),
                "court_case": CourtCase(
                    ulpin=ulpin_id,
                    has_litigation=False,
                    stay_order_active=False,
                    case_status=CourtCaseStatus.NO_LITIGATION
                )
            })

        for p_set in parcels_data:
            db.add(p_set["parcel"])
            db.add(p_set["ror"])
            db.add(p_set["registration"])
            db.add(p_set["tax"])
            db.add(p_set["encumbrance"])
            db.add(p_set["land_use"])
            db.add(p_set["building_permit"])
            db.add(p_set["court_case"])

        db.commit()
        print("✓ Successfully seeded 12 comprehensive parcels with realistic demo discrepancies!")
    except Exception as e:
        db.rollback()
        print(f"✗ Failed to seed database: {e}")
        raise
    finally:
        if close_db:
            db.close()

if __name__ == "__main__":
    seed_database()
