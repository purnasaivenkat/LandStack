"""Synthetic demonstration data for the LandStack Member 3 AI Agent.

This file intentionally contains clearly labeled synthetic mock data only.
No real land registry records or government data are represented here.
"""

SYNTHETIC_DEMONSTRATION_DATA = "SYNTHETIC DEMONSTRATION DATA — DO NOT TREAT AS OFFICIAL GOVERNMENT DATA"

SELECTED_AREA_ID = "AREA_001"
SELECTED_AREA = {
    "area_id": SELECTED_AREA_ID,
    "name": "North Agricultural Block",
    "status": "synthetic-demo",
    "note": "Synthetic demonstration data only.",
}

AREA_PARCELS = {
    SELECTED_AREA_ID: ["UL001", "UL002", "UL003", "UL004"],
}

MOCK_PARCELS = {
    "UL001": {
        "ulpin": "UL001",
        "owner": "Ravi Kumar",
        "area_acres": 3.20,
        "document_area_acres": 2.80,
        "survey_number": "SV-101/17A",
        "land_use": "Agriculture",
        "ror_status": "Registered",
        "registration_status": "Active",
        "tax_status": "Paid",
        "encumbrance_status": "None",
        "building_permission": "Approved",
        "verification_status": "Verified",
        "verification_issues": [],
        "risk_score": 22,
        "satellite_alerts": ["No material change detected"],
        "notes": "Synthetic parcel record. GIS area differs from document area; this is a demonstration mismatch.",
        "area_id": SELECTED_AREA_ID,
    },
    "UL002": {
        "ulpin": "UL002",
        "owner": "Anita Sharma",
        "area_acres": 4.50,
        "document_area_acres": 5.30,
        "survey_number": "SV-205/18B",
        "land_use": "Agriculture",
        "ror_status": "Registered",
        "registration_status": "Active",
        "tax_status": "Paid",
        "encumbrance_status": "Active",
        "building_permission": "Pending",
        "verification_status": "Mismatch",
        "verification_issues": ["Area mismatch", "Owner mismatch"],
        "risk_score": 78,
        "satellite_alerts": ["Vegetation change detected", "New structure suspected"],
        "notes": "Synthetic parcel record. Area mismatch and owner mismatch are intentional for demonstration.",
        "area_id": SELECTED_AREA_ID,
    },
    "UL003": {
        "ulpin": "UL003",
        "owner": "Rahul Patil",
        "area_acres": 2.10,
        "document_area_acres": 2.10,
        "survey_number": "SV-310/23C",
        "land_use": "Residential",
        "ror_status": "Pending review",
        "registration_status": "Inactive",
        "tax_status": "Pending",
        "encumbrance_status": "Closed",
        "building_permission": "Granted",
        "verification_status": "Verified",
        "verification_issues": [],
        "risk_score": 35,
        "satellite_alerts": ["No material change detected"],
        "notes": "Synthetic parcel record. Encumbrance is closed and the verification record is stable.",
        "area_id": SELECTED_AREA_ID,
    },
    "UL004": {
        "ulpin": "UL004",
        "owner": "Priya Singh",
        "area_acres": 5.00,
        "document_area_acres": 4.20,
        "survey_number": "SV-404/11D",
        "land_use": "Agriculture",
        "ror_status": "Registered",
        "registration_status": "Active",
        "tax_status": "Paid",
        "encumbrance_status": "Active",
        "building_permission": "Rejected",
        "verification_status": "Mismatch",
        "verification_issues": ["Owner mismatch", "Survey mismatch"],
        "risk_score": 82,
        "satellite_alerts": ["New access road detected", "Crop pattern drift observed"],
        "notes": "Synthetic parcel record. Active encumbrance and verification mismatch are deliberate.",
        "area_id": SELECTED_AREA_ID,
    },
}

MOCK_OWNER_DETAILS = {
    "UL001": {"ulpin": "UL001", "owner": "Ravi Kumar", "source": SYNTHETIC_DEMONSTRATION_DATA},
    "UL002": {"ulpin": "UL002", "owner": "Anita Sharma", "source": SYNTHETIC_DEMONSTRATION_DATA},
    "UL003": {"ulpin": "UL003", "owner": "Rahul Patil", "source": SYNTHETIC_DEMONSTRATION_DATA},
    "UL004": {"ulpin": "UL004", "owner": "Priya Singh", "source": SYNTHETIC_DEMONSTRATION_DATA},
}

MOCK_LAND_USE = {
    "UL001": {"ulpin": "UL001", "land_use": "Agriculture", "source": SYNTHETIC_DEMONSTRATION_DATA},
    "UL002": {"ulpin": "UL002", "land_use": "Agriculture", "source": SYNTHETIC_DEMONSTRATION_DATA},
    "UL003": {"ulpin": "UL003", "land_use": "Residential", "source": SYNTHETIC_DEMONSTRATION_DATA},
    "UL004": {"ulpin": "UL004", "land_use": "Agriculture", "source": SYNTHETIC_DEMONSTRATION_DATA},
}

MOCK_ROR_STATUS = {
    "UL001": {"ulpin": "UL001", "status": "Registered", "source": SYNTHETIC_DEMONSTRATION_DATA},
    "UL002": {"ulpin": "UL002", "status": "Registered", "source": SYNTHETIC_DEMONSTRATION_DATA},
    "UL003": {"ulpin": "UL003", "status": "Pending review", "source": SYNTHETIC_DEMONSTRATION_DATA},
    "UL004": {"ulpin": "UL004", "status": "Registered", "source": SYNTHETIC_DEMONSTRATION_DATA},
}

MOCK_REGISTRATION_STATUS = {
    "UL001": {"ulpin": "UL001", "status": "Active", "source": SYNTHETIC_DEMONSTRATION_DATA},
    "UL002": {"ulpin": "UL002", "status": "Active", "source": SYNTHETIC_DEMONSTRATION_DATA},
    "UL003": {"ulpin": "UL003", "status": "Inactive", "source": SYNTHETIC_DEMONSTRATION_DATA},
    "UL004": {"ulpin": "UL004", "status": "Active", "source": SYNTHETIC_DEMONSTRATION_DATA},
}

MOCK_TAX_STATUS = {
    "UL001": {"ulpin": "UL001", "status": "Paid", "source": SYNTHETIC_DEMONSTRATION_DATA},
    "UL002": {"ulpin": "UL002", "status": "Paid", "source": SYNTHETIC_DEMONSTRATION_DATA},
    "UL003": {"ulpin": "UL003", "status": "Pending", "source": SYNTHETIC_DEMONSTRATION_DATA},
    "UL004": {"ulpin": "UL004", "status": "Paid", "source": SYNTHETIC_DEMONSTRATION_DATA},
}

MOCK_ENCUMBRANCES = {
    "UL001": {
        "ulpin": "UL001",
        "status": "none",
        "record": "No encumbrance exists.",
        "source": SYNTHETIC_DEMONSTRATION_DATA,
    },
    "UL002": {
        "ulpin": "UL002",
        "status": "active",
        "record": "Active encumbrance found.",
        "source": SYNTHETIC_DEMONSTRATION_DATA,
    },
    "UL003": {
        "ulpin": "UL003",
        "status": "closed",
        "record": "Encumbrance was closed.",
        "source": SYNTHETIC_DEMONSTRATION_DATA,
    },
    "UL004": {
        "ulpin": "UL004",
        "status": "active",
        "record": "Active encumbrance found.",
        "source": SYNTHETIC_DEMONSTRATION_DATA,
    },
}

MOCK_BUILDING_PERMISSION = {
    "UL001": {"ulpin": "UL001", "status": "Approved", "source": SYNTHETIC_DEMONSTRATION_DATA},
    "UL002": {"ulpin": "UL002", "status": "Pending", "source": SYNTHETIC_DEMONSTRATION_DATA},
    "UL003": {"ulpin": "UL003", "status": "Granted", "source": SYNTHETIC_DEMONSTRATION_DATA},
    "UL004": {"ulpin": "UL004", "status": "Rejected", "source": SYNTHETIC_DEMONSTRATION_DATA},
}

MOCK_VERIFICATION = {
    "UL001": {
        "ulpin": "UL001",
        "status": "verified",
        "record": "Verification record is verified.",
        "source": SYNTHETIC_DEMONSTRATION_DATA,
    },
    "UL002": {
        "ulpin": "UL002",
        "status": "mismatch",
        "record": "Verification mismatch detected.",
        "source": SYNTHETIC_DEMONSTRATION_DATA,
    },
    "UL003": {
        "ulpin": "UL003",
        "status": "verified",
        "record": "Verification record is verified.",
        "source": SYNTHETIC_DEMONSTRATION_DATA,
    },
    "UL004": {
        "ulpin": "UL004",
        "status": "mismatch",
        "record": "Verification mismatch detected.",
        "source": SYNTHETIC_DEMONSTRATION_DATA,
    },
}

MOCK_RISK_SCORE = {
    "UL001": {"ulpin": "UL001", "risk_score": 22, "source": SYNTHETIC_DEMONSTRATION_DATA},
    "UL002": {"ulpin": "UL002", "risk_score": 78, "source": SYNTHETIC_DEMONSTRATION_DATA},
    "UL003": {"ulpin": "UL003", "risk_score": 35, "source": SYNTHETIC_DEMONSTRATION_DATA},
    "UL004": {"ulpin": "UL004", "risk_score": 82, "source": SYNTHETIC_DEMONSTRATION_DATA},
}

MOCK_SATELLITE_ALERTS = {
    "UL001": {"ulpin": "UL001", "alerts": ["No material change detected"], "source": SYNTHETIC_DEMONSTRATION_DATA},
    "UL002": {"ulpin": "UL002", "alerts": ["Vegetation change detected", "New structure suspected"], "source": SYNTHETIC_DEMONSTRATION_DATA},
    "UL003": {"ulpin": "UL003", "alerts": ["No material change detected"], "source": SYNTHETIC_DEMONSTRATION_DATA},
    "UL004": {"ulpin": "UL004", "alerts": ["New access road detected", "Crop pattern drift observed"], "source": SYNTHETIC_DEMONSTRATION_DATA},
}
