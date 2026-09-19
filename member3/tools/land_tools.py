from __future__ import annotations

from tools.mock_data import (
    AREA_PARCELS,
    MOCK_BUILDING_PERMISSION,
    MOCK_ENCUMBRANCES,
    MOCK_LAND_USE,
    MOCK_OWNER_DETAILS,
    MOCK_PARCELS,
    MOCK_RISK_SCORE,
    MOCK_REGISTRATION_STATUS,
    MOCK_ROR_STATUS,
    MOCK_SATELLITE_ALERTS,
    MOCK_TAX_STATUS,
    MOCK_VERIFICATION,
    SELECTED_AREA_ID,
    SYNTHETIC_DEMONSTRATION_DATA,
)


def _missing_record(ulpin: str, label: str) -> dict:
    return {
        "ulpin": ulpin,
        "status": "unavailable",
        "message": f"{label} information is unavailable for {ulpin}.",
        "source": SYNTHETIC_DEMONSTRATION_DATA,
    }


def get_selected_area() -> str:
    """Return the current selected GIS area ID for the mock LandStack environment.

    This is synthetic demonstration data only. Member 1 GIS integration will replace this later.
    """
    return SELECTED_AREA_ID


def get_parcels_in_area(area_id: str) -> list[str]:
    """Return parcel IDs from the selected mock GIS area.

    Spatial calculations are intentionally delegated to the GIS/backend layer in the real architecture.
    """
    area_parcels = AREA_PARCELS.get(area_id, [])
    if not area_parcels:
        return []
    return area_parcels


def get_parcel_details(ulpin: str) -> dict:
    """Return parcel details for a parcel ID from synthetic mock records."""
    parcel = MOCK_PARCELS.get(ulpin)
    if parcel is None:
        return {
            "ulpin": ulpin,
            "status": "unavailable",
            "message": f"Parcel record not found for {ulpin}.",
            "source": SYNTHETIC_DEMONSTRATION_DATA,
        }
    return {
        "ulpin": parcel["ulpin"],
        "owner": parcel["owner"],
        "area_acres": parcel["area_acres"],
        "document_area_acres": parcel.get("document_area_acres"),
        "survey_number": parcel.get("survey_number"),
        "land_use": parcel["land_use"],
        "ror_status": parcel["ror_status"],
        "registration_status": parcel["registration_status"],
        "tax_status": parcel["tax_status"],
        "encumbrance_status": parcel["encumbrance_status"],
        "building_permission": parcel["building_permission"],
        "verification_status": parcel["verification_status"],
        "verification_issues": parcel.get("verification_issues", []),
        "risk_score": parcel.get("risk_score"),
        "satellite_alerts": parcel.get("satellite_alerts", []),
        "notes": parcel["notes"],
        "source": SYNTHETIC_DEMONSTRATION_DATA,
    }


def get_owner_details(ulpin: str) -> dict:
    """Return owner information for a parcel from synthetic data."""
    owner_record = MOCK_OWNER_DETAILS.get(ulpin)
    if owner_record is None:
        return _missing_record(ulpin, "Owner")
    return {**owner_record, "source": SYNTHETIC_DEMONSTRATION_DATA}


def get_land_use(ulpin: str) -> dict:
    """Return land use information for a parcel from synthetic data."""
    land_use_record = MOCK_LAND_USE.get(ulpin)
    if land_use_record is None:
        return _missing_record(ulpin, "Land use")
    return {**land_use_record, "source": SYNTHETIC_DEMONSTRATION_DATA}


def get_ror_status(ulpin: str) -> dict:
    """Return RoR status information for a parcel from synthetic data."""
    ror_record = MOCK_ROR_STATUS.get(ulpin)
    if ror_record is None:
        return _missing_record(ulpin, "RoR")
    return {**ror_record, "source": SYNTHETIC_DEMONSTRATION_DATA}


def get_registration_status(ulpin: str) -> dict:
    """Return registration status information for a parcel from synthetic data."""
    registration_record = MOCK_REGISTRATION_STATUS.get(ulpin)
    if registration_record is None:
        return _missing_record(ulpin, "Registration")
    return {**registration_record, "source": SYNTHETIC_DEMONSTRATION_DATA}


def get_tax_status(ulpin: str) -> dict:
    """Return tax status for a parcel from synthetic data."""
    tax_record = MOCK_TAX_STATUS.get(ulpin)
    if tax_record is None:
        return _missing_record(ulpin, "Tax")
    return {**tax_record, "source": SYNTHETIC_DEMONSTRATION_DATA}


def get_encumbrance(ulpin: str) -> dict:
    """Return encumbrance status for a given ULPIN from synthetic mock data."""
    encumbrance = MOCK_ENCUMBRANCES.get(ulpin)
    if encumbrance is None:
        return _missing_record(ulpin, "Encumbrance")
    return {
        **encumbrance,
        "source": SYNTHETIC_DEMONSTRATION_DATA,
    }


def get_building_permission(ulpin: str) -> dict:
    """Return building-permission status for a parcel from synthetic data."""
    permission_record = MOCK_BUILDING_PERMISSION.get(ulpin)
    if permission_record is None:
        return _missing_record(ulpin, "Building permission")
    return {**permission_record, "source": SYNTHETIC_DEMONSTRATION_DATA}


def get_verification_status(ulpin: str) -> dict:
    """Return verification status for a given ULPIN from synthetic mock data."""
    status = MOCK_VERIFICATION.get(ulpin)
    if status is None:
        return _missing_record(ulpin, "Verification")
    return {
        **status,
        "source": SYNTHETIC_DEMONSTRATION_DATA,
    }


def get_risk_score(ulpin: str) -> dict:
    """Return the risk score for a parcel from synthetic data."""
    risk_record = MOCK_RISK_SCORE.get(ulpin)
    if risk_record is None:
        return _missing_record(ulpin, "Risk")
    return {**risk_record, "source": SYNTHETIC_DEMONSTRATION_DATA}


def get_satellite_alerts(ulpin: str) -> dict:
    """Return satellite alerts for a parcel from synthetic data."""
    alerts_record = MOCK_SATELLITE_ALERTS.get(ulpin)
    if alerts_record is None:
        return _missing_record(ulpin, "Satellite alert")
    return {**alerts_record, "source": SYNTHETIC_DEMONSTRATION_DATA}
