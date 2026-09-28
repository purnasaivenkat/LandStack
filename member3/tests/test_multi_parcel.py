from agent.agent import run_agent


def test_agent_handles_two_parcel_details():
    response = run_agent("Give me details of UL001 and UL002.")
    assert response.parcel_ids == ["UL001", "UL002"]
    assert "UL001" in response.answer
    assert "UL002" in response.answer
    assert "Ravi Kumar" in response.answer
    assert "Anita Sharma" in response.answer
    assert "parcel_details" in response.sources


def test_agent_handles_three_parcel_details():
    response = run_agent("Show details of UL001, UL002, and UL003.")
    assert response.parcel_ids == ["UL001", "UL002", "UL003"]
    assert "UL001" in response.answer
    assert "UL002" in response.answer
    assert "UL003" in response.answer
    assert "Ravi Kumar" in response.answer
    assert "Anita Sharma" in response.answer
    assert "Rahul Patil" in response.answer


def test_agent_handles_multi_parcel_ownership():
    response = run_agent("Who owns UL001 and UL002?")
    assert response.parcel_ids == ["UL001", "UL002"]
    assert "Ravi Kumar" in response.answer
    assert "Anita Sharma" in response.answer
    assert "owner" in response.sources


def test_agent_handles_multi_parcel_land_use():
    response = run_agent("What is the land use for UL001 and UL003?")
    assert response.parcel_ids == ["UL001", "UL003"]
    assert "Agriculture" in response.answer
    assert "Residential" in response.answer
    assert "land_use" in response.sources


def test_agent_handles_multi_parcel_tax():
    response = run_agent("Check tax status of UL001 and UL003.")
    assert response.parcel_ids == ["UL001", "UL003"]
    assert "Paid" in response.answer
    assert "Pending" in response.answer
    assert "tax_status" in response.sources


def test_agent_handles_multi_parcel_encumbrance():
    response = run_agent("Check encumbrance for UL001 and UL002.")
    assert response.parcel_ids == ["UL001", "UL002"]
    assert "none" in response.answer.lower()
    assert "active" in response.answer.lower()
    assert "encumbrance" in response.sources


def test_agent_handles_all_parcels_in_area_details():
    response = run_agent("Show details of all parcels in the selected area.")
    assert set(response.parcel_ids) == {"UL001", "UL002", "UL003", "UL004"}
    assert "UL001" in response.answer
    assert "UL002" in response.answer
    assert "UL003" in response.answer
    assert "UL004" in response.answer


def test_agent_handles_mixed_valid_and_unknown_parcels():
    response = run_agent("Give me details of UL001 and UL999.")
    assert response.parcel_ids == ["UL001", "UL999"]
    assert "Ravi Kumar" in response.answer
    assert "UL999" in response.answer
    assert len(response.warnings) > 0
    assert any("UL999" in w for w in response.warnings)
