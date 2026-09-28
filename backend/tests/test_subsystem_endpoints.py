def test_get_parcel(client):
    response = client.get("/api/parcels/UL001")
    assert response.status_code == 200
    data = response.json()
    assert data["ulpin"] == "UL001"
    assert data["survey_number"] == "104/1"
    assert data["gis_area_acres"] == 3.20

def test_get_ror(client):
    response = client.get("/api/ror/UL001")
    assert response.status_code == 200
    data = response.json()
    assert data["ulpin"] == "UL001"
    assert data["primary_owner"] == "Ravi Kumar"
    assert data["document_area_acres"] == 3.20

def test_get_registration(client):
    response = client.get("/api/registration/UL001")
    assert response.status_code == 200
    data = response.json()
    assert data["ulpin"] == "UL001"
    assert data["deed_number"] == "DEED-BNG-2018-4412"

def test_get_tax(client):
    response = client.get("/api/tax/UL001")
    assert response.status_code == 200
    data = response.json()
    assert data["ulpin"] == "UL001"
    assert data["payment_status"] == "PAID"

def test_get_encumbrance(client):
    response = client.get("/api/encumbrance/UL001")
    assert response.status_code == 200
    data = response.json()
    assert data["ulpin"] == "UL001"
    assert data["has_encumbrance"] is False

def test_get_land_use(client):
    response = client.get("/api/land-use/UL001")
    assert response.status_code == 200
    data = response.json()
    assert data["ulpin"] == "UL001"
    assert data["master_plan_zone"] == "AGRICULTURAL"

def test_get_building_permit(client):
    response = client.get("/api/building-permit/UL001")
    assert response.status_code == 200
    data = response.json()
    assert data["ulpin"] == "UL001"

def test_get_court_cases(client):
    response = client.get("/api/court-cases/UL001")
    assert response.status_code == 200
    data = response.json()
    assert data["ulpin"] == "UL001"
    assert data["stay_order_active"] is False
