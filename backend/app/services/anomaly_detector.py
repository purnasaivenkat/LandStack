from typing import List, Tuple, Optional
from app.models.parcel import Parcel
from app.models.ror import RoR
from app.models.tax import Tax, TaxPaymentStatus
from app.models.encumbrance import Encumbrance, EncumbranceStatus
from app.models.land_use import LandUse, MasterPlanZone
from app.models.building_permit import BuildingPermit, PermitApprovalStatus
from app.models.court_case import CourtCase, CourtCaseStatus
from app.schemas.unified_profile import AnomalyItem, SeverityLevel, RiskSummary, RiskLevel

def detect_anomalies_and_risk(
    parcel: Parcel,
    ror: Optional[RoR] = None,
    tax: Optional[Tax] = None,
    encumbrance: Optional[Encumbrance] = None,
    land_use: Optional[LandUse] = None,
    building_permit: Optional[BuildingPermit] = None,
    court_case: Optional[CourtCase] = None,
) -> Tuple[List[AnomalyItem], RiskSummary]:
    anomalies: List[AnomalyItem] = []
    penalty_score = 0

    # 1. Area Mismatch Check (GIS Boundary vs RoR Legal Record)
    if ror is not None and parcel.gis_area_acres > 0:
        gis_area = round(parcel.gis_area_acres, 2)
        doc_area = round(ror.document_area_acres, 2)
        diff = round(gis_area - doc_area, 2)
        abs_diff = abs(diff)

        if abs_diff >= 0.05:  # Tolerance threshold of 0.05 acres
            severity = SeverityLevel.HIGH if abs_diff > 0.25 else SeverityLevel.MEDIUM
            penalty = 35 if abs_diff > 0.25 else 20
            penalty_score += penalty
            
            direction = "Encroachment/Excess GIS extent" if diff > 0 else "Physical boundary shortfall"
            anomalies.append(
                AnomalyItem(
                    category="AREA_MISMATCH",
                    severity=severity,
                    title="GIS vs Legal Document Area Mismatch",
                    description=(
                        f"Physical GIS boundary ({gis_area} acres) differs from RoR registered area "
                        f"({doc_area} acres) by {abs_diff:+.2f} acres ({direction})."
                    ),
                    gis_value=f"{gis_area} Acres",
                    record_value=f"{doc_area} Acres",
                    delta=f"{diff:+.2f} Acres"
                )
            )

    # 2. Court Case & Stay Orders Check
    if court_case is not None:
        if court_case.stay_order_active or court_case.case_status == CourtCaseStatus.STAY_GRANTED:
            penalty_score += 80  # Stay order freezes property transaction
            anomalies.append(
                AnomalyItem(
                    category="LEGAL_STAY",
                    severity=SeverityLevel.CRITICAL,
                    title="Active Judicial Injunction / Stay Order",
                    description=(
                        f"Court stay order active under {court_case.case_number or 'Court Case'} "
                        f"({court_case.court_name or 'Judiciary'}). Property transactions legally prohibited."
                    ),
                    gis_value=None,
                    record_value=court_case.case_status.value,
                    delta="Transaction Frozen"
                )
            )
        elif court_case.has_litigation and court_case.case_status == CourtCaseStatus.PENDING:
            penalty_score += 40
            anomalies.append(
                AnomalyItem(
                    category="PENDING_LITIGATION",
                    severity=SeverityLevel.HIGH,
                    title="Pending Court Litigation",
                    description=f"Active dispute pending in {court_case.court_name}: {court_case.case_summary or 'Title Suit'}",
                    gis_value=None,
                    record_value="PENDING",
                    delta=None
                )
            )

    # 3. Encumbrance & Mortgage Check
    if encumbrance is not None and encumbrance.status == EncumbranceStatus.ACTIVE:
        penalty_score += 30
        anomalies.append(
            AnomalyItem(
                category="ENCUMBRANCE_LIEN",
                severity=SeverityLevel.HIGH,
                title="Active Bank Mortgage / Financial Lien",
                description=(
                    f"Active charge registered by {encumbrance.bank_name or 'Financial Institution'} "
                    f"for ₹{encumbrance.mortgage_amount:,.2f}. NOC required before transfer."
                ),
                gis_value=None,
                record_value=f"₹{encumbrance.mortgage_amount:,.2f}",
                delta="Lien Active"
            )
        )

    # 4. Property Tax Arrears Check
    if tax is not None:
        if tax.payment_status in [TaxPaymentStatus.DEFAULTED, TaxPaymentStatus.DUE]:
            tax_due_total = (tax.property_tax_due or 0.0) + (tax.cess_amount or 0.0) + (tax.penalties or 0.0) - (tax.total_paid or 0.0)
            severity = SeverityLevel.HIGH if tax.payment_status == TaxPaymentStatus.DEFAULTED else SeverityLevel.MEDIUM
            penalty_score += 25 if tax.payment_status == TaxPaymentStatus.DEFAULTED else 15
            anomalies.append(
                AnomalyItem(
                    category="TAX_ARREARS",
                    severity=severity,
                    title="Outstanding Municipal Tax Arrears",
                    description=f"Unpaid property taxes of ₹{tax_due_total:,.2f} for Assessment Year {tax.assessment_year}.",
                    gis_value=None,
                    record_value=tax.payment_status.value,
                    delta=f"₹{tax_due_total:,.2f} Due"
                )
            )

    # 5. Master Plan Zoning vs Actual Usage
    if land_use is not None:
        zone = land_use.master_plan_zone
        curr_use = (land_use.current_usage or "").lower()
        
        if zone in [MasterPlanZone.AGRICULTURAL, MasterPlanZone.GREEN_BELT]:
            if not land_use.is_converted and any(w in curr_use for w in ["commercial", "industrial", "warehouse", "factory", "residential complex"]):
                penalty_score += 40
                anomalies.append(
                    AnomalyItem(
                        category="ZONING_VIOLATION",
                        severity=SeverityLevel.HIGH,
                        title="Unauthorized Non-Agricultural Usage (No Conversion Order)",
                        description=(
                            f"Land is zoned as {zone.value} but currently used for '{land_use.current_usage}' "
                            f"without statutory DC conversion order."
                        ),
                        gis_value=land_use.current_usage,
                        record_value=zone.value,
                        delta="Unlawful Conversion"
                    )
                )

    # 6. Building Permit Deviations
    if building_permit is not None:
        if building_permit.deviation_detected or (building_permit.actual_floors > building_permit.sanctioned_floors):
            penalty_score += 30
            floor_diff = building_permit.actual_floors - building_permit.sanctioned_floors
            anomalies.append(
                AnomalyItem(
                    category="BUILDING_VIOLATION",
                    severity=SeverityLevel.HIGH,
                    title="Building Plan Floor Deviation Detected",
                    description=(
                        f"Actual structure has {building_permit.actual_floors} floors vs "
                        f"{building_permit.sanctioned_floors} sanctioned floors ({floor_diff:+d} unauthorized floors)."
                    ),
                    gis_value=f"{building_permit.actual_floors} Floors",
                    record_value=f"{building_permit.sanctioned_floors} Floors",
                    delta=f"{floor_diff:+d} Unauthorized Floors"
                )
            )
        elif building_permit.approval_status == PermitApprovalStatus.REJECTED:
            penalty_score += 20
            anomalies.append(
                AnomalyItem(
                    category="PERMIT_REJECTED",
                    severity=SeverityLevel.MEDIUM,
                    title="Building Permit Plan Rejected",
                    description=f"Building plan was rejected by {building_permit.sanctioning_authority}.",
                    gis_value=None,
                    record_value="REJECTED",
                    delta=None
                )
            )

    # Calculate Composite Risk Score (bounded 0 to 100)
    composite_score = min(100, penalty_score)

    if composite_score == 0:
        risk_level = RiskLevel.CLEAN
        is_safe = True
        summary_msg = "Clear Title: No discrepancies, encumbrances, tax dues, or litigations detected."
    elif composite_score <= 25:
        risk_level = RiskLevel.LOW_RISK
        is_safe = True
        summary_msg = "Low Risk: Minor notices or negligible discrepancies detected."
    elif composite_score <= 50:
        risk_level = RiskLevel.MODERATE_RISK
        is_safe = False
        summary_msg = "Moderate Risk: Identified tax arrears, active encumbrance, or moderate area deviations."
    elif composite_score <= 75:
        risk_level = RiskLevel.HIGH_RISK
        is_safe = False
        summary_msg = "High Risk: Significant anomalies, pending litigation, or unapproved land-use."
    else:
        risk_level = RiskLevel.BLOCKED
        is_safe = False
        summary_msg = "Critical Alert / Blocked: Active court stay order or critical violations. Alienation prohibited."

    risk_summary = RiskSummary(
        score=composite_score,
        level=risk_level,
        anomaly_count=len(anomalies),
        is_safe_for_transaction=is_safe,
        summary=summary_msg
    )

    return anomalies, risk_summary
