from tools.land_tools import (
    get_encumbrance,
    get_parcel_details,
    get_parcels_in_area,
    get_selected_area,
    get_verification_status,
)


def test_get_selected_area_returns_area_id():
    assert get_selected_area() == "AREA_001"


def test_get_parcels_in_area_returns_mock_parcels():
    result = get_parcels_in_area("AREA_001")
    assert result == ["UL001", "UL002", "UL003", "UL004"]


def test_get_parcel_details_for_known_ulpin():
    result = get_parcel_details("UL001")
    assert result["ulpin"] == "UL001"
    assert result["owner"] == "Ravi Kumar"


def test_unknown_ulpin_is_unavailable_not_negative():
    result = get_parcel_details("UL999")
    assert result["status"] == "unavailable"
    assert "not found" in result["message"].lower()


def test_active_encumbrance_filter_for_known_parcel():
    result = get_encumbrance("UL002")
    assert result["status"] == "active"


def test_verification_mismatch_for_known_parcel():
    result = get_verification_status("UL002")
    assert result["status"] == "mismatch"
