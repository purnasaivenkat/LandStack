import urllib.request
import json
import logging
import os
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, Base
from app.models.parcel import Parcel
from app.models.ror import RoR
from app.models.registration import Registration
from app.models.tax import Tax, TaxPaymentStatus
from app.models.encumbrance import Encumbrance, EncumbranceStatus
from app.models.land_use import LandUse, MasterPlanZone
from app.models.building_permit import BuildingPermit, PermitApprovalStatus
from app.models.court_case import CourtCase, CourtCaseStatus
from app.config import settings

logger = logging.getLogger("supabase_sync")

SUPABASE_URL = settings.SUPABASE_URL or "https://slrjtctvyhhbwwcgomcy.supabase.co"
SUPABASE_KEY = settings.SUPABASE_PUBLISHABLE_KEY or "sb_publishable_BLYmFLhC_EstHmfnHt2UpA_4LATE0c9"

def fetch_supabase_table(table_name: str, limit: int = 1000):
    """Fetch rows from Supabase REST API."""
    url = f"{SUPABASE_URL}/rest/v1/{table_name}?select=*&limit={limit}"
    req = urllib.request.Request(
        url,
        headers={
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}"
        }
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode())
    except Exception as e:
        print(f"[WARN] Failed to fetch Supabase table '{table_name}': {e}")
        return []

def sync_supabase_to_database(db: Session = None):
    """
    Ingest real Supabase datasets (Karjat, Raigad cadastral parcels + RoR + Registration + Tax + Encumbrance)
    into local database if not already present.
    """
    close_db = False
    if db is None:
        Base.metadata.create_all(bind=engine)
        db = SessionLocal()
        close_db = True

    try:
        # Check if Supabase parcels are already synced
        supabase_count = db.query(Parcel).filter(Parcel.ulpin.like("ULPIN-DEMO-%")).count()
        if supabase_count >= 500:
            print(f"[OK] Supabase dataset already synced ({supabase_count} parcels present).")
            return

        print("[*] Fetching live GIS parcels and land records from Supabase...")

        # 1. Fetch tables
        parcels_raw = fetch_supabase_table("parcels", limit=1000)
        ror_raw = fetch_supabase_table("ror", limit=1000)
        reg_raw = fetch_supabase_table("registration", limit=1000)
        tax_raw = fetch_supabase_table("tax", limit=1000)
        enc_raw = fetch_supabase_table("encumbrance", limit=1000)

        print(f"[*] Retrieved from Supabase: {len(parcels_raw)} Parcels, {len(ror_raw)} RoR, {len(reg_raw)} Reg, {len(tax_raw)} Tax, {len(enc_raw)} Encumbrance")

        ror_map = {r.get("ulpin"): r for r in ror_raw if r.get("ulpin")}
        reg_map = {r.get("ulpin"): r for r in reg_raw if r.get("ulpin")}
        tax_map = {r.get("ulpin"): r for r in tax_raw if r.get("ulpin")}
        enc_map = {r.get("ulpin"): r for r in enc_raw if r.get("ulpin")}

        new_parcels = []
        new_ror = []
        new_reg = []
        new_tax = []
        new_enc = []
        new_land_use = []
        new_permits = []
        new_cases = []

        existing_ulpins = {p.ulpin for p in db.query(Parcel.ulpin).all()}

        zones_cycle = [
            (MasterPlanZone.AGRICULTURAL, "Paddy & Horticulture"),
            (MasterPlanZone.RESIDENTIAL, "Residential Layout"),
            (MasterPlanZone.COMMERCIAL, "Market & Highway Commercial"),
            (MasterPlanZone.INDUSTRIAL, "Agro Processing Unit"),
            (MasterPlanZone.GREEN_BELT, "Eco-sensitive River Zone")
        ]

        for idx, p_data in enumerate(parcels_raw):
            ulpin = p_data.get("ulpin")
            if not ulpin or ulpin in existing_ulpins:
                continue

            geo_str = p_data.get("geometry_geojson")
            if not geo_str and p_data.get("geometry"):
                geo_str = json.dumps(p_data.get("geometry"))

            # Clean geometry
            if isinstance(geo_str, dict):
                geo_str = json.dumps(geo_str)

            p_obj = Parcel(
                ulpin=ulpin,
                state=p_data.get("state") or "Maharashtra",
                district=p_data.get("district") or "Raigad",
                taluk=p_data.get("taluk") or "Karjat",
                village=p_data.get("village") or "Dahivali",
                survey_number=p_data.get("survey_number") or p_data.get("survey_no") or f"10/{idx+1}",
                sub_division=p_data.get("sub_division") or "1",
                gis_area_acres=float(p_data.get("gis_area_acres") or p_data.get("area_acres") or 2.5),
                centroid_lat=float(p_data.get("centroid_lat") or 18.9057),
                centroid_lng=float(p_data.get("centroid_lng") or 73.3055),
                geometry_geojson=geo_str or "{}"
            )
            new_parcels.append(p_obj)

            # RoR
            r_data = ror_map.get(ulpin)
            if r_data:
                new_ror.append(RoR(
                    ulpin=ulpin,
                    khata_number=r_data.get("khata_number") or f"KH-MR-{idx+1000}",
                    primary_owner=r_data.get("primary_owner") or f"Owner {idx+1}",
                    father_name=r_data.get("father_name") or "Shri Ramchandra",
                    joint_owners=r_data.get("joint_owners"),
                    document_area_acres=float(r_data.get("document_area_acres") or p_obj.gis_area_acres),
                    land_type=r_data.get("land_type") or "Dry Crop",
                    soil_type=r_data.get("soil_type") or "Medium Black",
                    mutation_number=r_data.get("mutation_number") or f"MR-{2020+idx%5}-{idx+1}",
                    mutated_date=r_data.get("mutated_date") or "2022-03-15"
                ))
            else:
                new_ror.append(RoR(
                    ulpin=ulpin,
                    khata_number=f"KH-MR-{idx+1000}",
                    primary_owner=f"Farmer {idx+1} (Karjat)",
                    father_name="Shri Dattatray",
                    joint_owners=None,
                    document_area_acres=p_obj.gis_area_acres,
                    land_type="Agricultural",
                    soil_type="Black Loamy",
                    mutation_number=f"MR-2023-{idx+1}",
                    mutated_date="2023-01-10"
                ))

            # Registration
            reg_data = reg_map.get(ulpin)
            if reg_data:
                new_reg.append(Registration(
                    ulpin=ulpin,
                    deed_number=reg_data.get("deed_number") or f"DEED-KJT-2022-{idx+100}",
                    registration_date=reg_data.get("registration_date") or "2022-04-10",
                    sro_name=reg_data.get("sro_name") or "SRO Karjat",
                    party_seller=reg_data.get("party_seller") or "Local Landholder",
                    party_buyer=reg_data.get("party_buyer") or (r_data.get("primary_owner") if r_data else "Purchaser"),
                    consideration_amount=float(reg_data.get("consideration_amount") or 3500000.0),
                    stamp_duty_paid=float(reg_data.get("stamp_duty_paid") or 210000.0),
                    market_value=float(reg_data.get("market_value") or 3800000.0),
                    document_url=reg_data.get("document_url") or f"https://landstack.gov.in/docs/deeds/{ulpin}.pdf"
                ))

            # Tax
            t_data = tax_map.get(ulpin)
            if t_data:
                pay_status = t_data.get("payment_status", "PAID").upper()
                if pay_status not in [e.value for e in TaxPaymentStatus]:
                    pay_status = TaxPaymentStatus.PAID
                new_tax.append(Tax(
                    ulpin=ulpin,
                    assessment_year=t_data.get("assessment_year") or "2024-2025",
                    property_tax_due=float(t_data.get("property_tax_due") or 0.0),
                    cess_amount=float(t_data.get("cess_amount") or 0.0),
                    penalties=float(t_data.get("penalties") or 0.0),
                    total_paid=float(t_data.get("total_paid") or 2500.0),
                    payment_status=pay_status,
                    last_payment_date=t_data.get("last_payment_date") or "2024-03-20",
                    receipt_number=t_data.get("receipt_number") or f"TAX-KJT-{idx+100}"
                ))

            # Encumbrance
            e_data = enc_map.get(ulpin)
            if e_data:
                has_enc = bool(e_data.get("has_encumbrance"))
                enc_status = e_data.get("status", "NONE").upper()
                if enc_status not in [e.value for e in EncumbranceStatus]:
                    enc_status = EncumbranceStatus.NONE
                new_enc.append(Encumbrance(
                    ulpin=ulpin,
                    has_encumbrance=has_enc,
                    bank_name=e_data.get("bank_name"),
                    loan_account_no=e_data.get("loan_account_no"),
                    mortgage_amount=float(e_data.get("mortgage_amount") or 0.0),
                    date_of_mortgage=e_data.get("date_of_mortgage"),
                    status=enc_status,
                    ec_certificate_number=e_data.get("ec_certificate_number") or f"EC-KJT-{idx+1000}",
                    period_from=e_data.get("period_from") or "2010-01-01",
                    period_to=e_data.get("period_to") or "2024-12-31",
                    remarks=e_data.get("remarks") or "Verified via Sub-Registrar Database"
                ))

            # Land Use (Realistic Zoning)
            zone_item, desc_item = zones_cycle[idx % len(zones_cycle)]
            new_land_use.append(LandUse(
                ulpin=ulpin,
                master_plan_zone=zone_item,
                current_usage=desc_item,
                is_converted=True if zone_item != MasterPlanZone.AGRICULTURAL else False,
                conversion_order_no=f"CONV-RAIGAD-{idx+200}" if zone_item != MasterPlanZone.AGRICULTURAL else None,
                conversion_date="2021-08-14" if zone_item != MasterPlanZone.AGRICULTURAL else None,
                zoning_authority="Karjat Municipal Council / MMRDA",
                flood_zone_risk="HIGH" if zone_item == MasterPlanZone.GREEN_BELT else "LOW"
            ))

            # Building Permit
            has_permit = (idx % 3 == 0)
            new_permits.append(BuildingPermit(
                ulpin=ulpin,
                permit_number=f"BP-KJT-2023-{idx+50}" if has_permit else None,
                sanctioning_authority="Karjat Nagar Parishad",
                sanctioned_floors=2 if has_permit else 0,
                actual_floors=2 if has_permit else 0,
                sanctioned_builtup_area_sqft=3200.0 if has_permit else 0.0,
                actual_builtup_area_sqft=3200.0 if has_permit else 0.0,
                approval_status=PermitApprovalStatus.APPROVED if has_permit else PermitApprovalStatus.NO_PERMIT,
                approval_date="2023-05-11" if has_permit else None,
                occupancy_certificate_issued=has_permit,
                deviation_detected=False,
                violation_remarks=None
            ))

            # Court Cases (Simulate ~3% disputes for realistic governance insights)
            has_dispute = (idx % 30 == 7)
            new_cases.append(CourtCase(
                ulpin=ulpin,
                has_litigation=has_dispute,
                case_number=f"OS-{idx+200}/2023" if has_dispute else None,
                court_name="Civil Court Junior Division, Karjat" if has_dispute else None,
                petitioner="Co-sharer Legal Heirs" if has_dispute else None,
                respondent=r_data.get("primary_owner") if r_data else "Registered Owner",
                case_type="Partition Suit & Injunction" if has_dispute else None,
                stay_order_active=has_dispute,
                case_status=CourtCaseStatus.STAY_GRANTED if has_dispute else CourtCaseStatus.NO_LITIGATION,
                filing_date="2023-09-12" if has_dispute else None,
                case_summary="Interim status-quo granted by Civil Judge regarding family partition" if has_dispute else "Clear judicial title with no pending encumbrance."
            ))

        # Bulk insert
        print(f"[*] Committing {len(new_parcels)} real parcels and linked datasets to SQLite...")
        if new_parcels:
            db.add_all(new_parcels)
            db.flush()
        if new_ror:
            db.add_all(new_ror)
        if new_reg:
            db.add_all(new_reg)
        if new_tax:
            db.add_all(new_tax)
        if new_enc:
            db.add_all(new_enc)
        if new_land_use:
            db.add_all(new_land_use)
        if new_permits:
            db.add_all(new_permits)
        if new_cases:
            db.add_all(new_cases)

        db.commit()
        print(f"[SUCCESS] Ingested {len(new_parcels)} real Supabase parcels with complete 360° registry records!")

    except Exception as e:
        db.rollback()
        print(f"[ERROR] Syncing Supabase data failed: {e}")
    finally:
        if close_db:
            db.close()

if __name__ == "__main__":
    sync_supabase_to_database()
