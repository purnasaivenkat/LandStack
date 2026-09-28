def test_area_analysis_by_ulpins(client):
    response = client.post(
        "/api/area-analysis/by-ulpins",
        json={"ulpins": ["UL001", "UL002", "UL003"]}
    )
    assert response.status_code == 200
    data = response.json()
    summary = data["summary"]
    assert summary["total_parcels"] == 3
    assert summary["total_gis_area_acres"] > 0
    assert summary["disputed_parcels_count"] == 1  # UL003
    assert len(data["parcels"]) == 3
