from agent.agent import run_agent


def test_agent_handles_ulpin_details_request():
    response = run_agent("Show me the details of UL001.")
    assert response.parcel_ids == ["UL001"] or "UL001" in response.answer
    assert response.answer


def test_agent_handles_active_encumbrances_in_selected_area():
    response = run_agent("Which parcels in the selected area have active encumbrances?")
    assert "UL002" in response.parcel_ids
    assert "UL004" in response.parcel_ids


def test_agent_handles_agricultural_parcel_request():
    response = run_agent("Show me agricultural parcels in this selected area.")
    assert "UL001" in response.parcel_ids
    assert "UL002" in response.parcel_ids
    assert "UL004" in response.parcel_ids


def test_agent_handles_unknown_ulpin_gracefully():
    response = run_agent("Give me details of UL999.")
    assert "UL999" in response.parcel_ids or "UL999" in response.answer
    assert response.warnings
