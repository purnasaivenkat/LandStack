def test_unified_profile_clean_ul001(client):
    response = client.get("/api/parcel-profile/UL001")
    assert response.status_code == 200
    data = response.json()
    assert data["ulpin"] == "UL001"
    assert data["parcel"]["gis_area_acres"] == 3.20
    assert data["ror"]["primary_owner"] == "Ravi Kumar"
    assert data["tax"]["payment_status"] == "PAID"
    assert data["risk_summary"]["score"] == 0
    assert data["risk_summary"]["level"] == "CLEAN"
    assert len(data["anomalies"]) == 0

def test_unified_profile_area_mismatch_ul002(client):
    """Verifies deliberate demonstration anomaly: GIS Area (3.20) vs Document Area (2.80)."""
    response = client.get("/api/parcel-profile/UL002")
    assert response.status_code == 200
    data = response.json()
    assert data["ulpin"] == "UL002"
    assert data["parcel"]["gis_area_acres"] == 3.20
    assert data["ror"]["document_area_acres"] == 2.80
    
    # Check that the anomaly detector caught the discrepancy
    categories = [a["category"] for a in data["anomalies"]]
    assert "AREA_MISMATCH" in categories
    assert data["risk_summary"]["score"] > 0

def test_unified_profile_court_stay_ul003(client):
    """Verifies deliberate litigation stay order demo on UL003."""
    response = client.get("/api/parcel-profile/UL003")
    assert response.status_code == 200
    data = response.json()
    assert data["ulpin"] == "UL003"
    assert data["court_case"]["stay_order_active"] is True
    assert data["risk_summary"]["level"] in ["HIGH_RISK", "BLOCKED"]
    categories = [a["category"] for a in data["anomalies"]]
    assert "LEGAL_STAY" in categories

def test_unified_profile_encumbrance_ul004(client):
    """Verifies active bank mortgage lien on UL004."""
    response = client.get("/api/parcel-profile/UL004")
    assert response.status_code == 200
    data = response.json()
    assert data["ulpin"] == "UL004"
    assert data["encumbrance"]["status"] == "ACTIVE"
    categories = [a["category"] for a in data["anomalies"]]
    assert "ENCUMBRANCE_LIEN" in categories

def test_unified_profile_tax_defaulter_ul005(client):
    """Verifies tax default detection on UL005."""
    response = client.get("/api/parcel-profile/UL005")
    assert response.status_code == 200
    data = response.json()
    assert data["ulpin"] == "UL005"
    assert data["tax"]["payment_status"] == "DEFAULTED"
    categories = [a["category"] for a in data["anomalies"]]
    assert "TAX_ARREARS" in categories

def test_unified_profile_zoning_and_floor_violation_ul006(client):
    """Verifies Green Belt unauthorized warehouse and 4 vs 1 floor deviation on UL006."""
    response = client.get("/api/parcel-profile/UL006")
    assert response.status_code == 200
    data = response.json()
    assert data["ulpin"] == "UL006"
    assert data["building_permit"]["deviation_detected"] is True
    categories = [a["category"] for a in data["anomalies"]]
    assert "ZONING_VIOLATION" in categories
    assert "BUILDING_VIOLATION" in categories
