def test_login_officer(client):
    response = client.post(
        "/api/auth/login",
        data={"username": "officer", "password": "officer123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["role"] == "OFFICER"

def test_login_citizen(client):
    response = client.post(
        "/api/auth/login",
        data={"username": "citizen", "password": "citizen123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["role"] == "CITIZEN"

def test_demo_tokens_endpoint(client):
    response = client.get("/api/auth/demo-tokens")
    assert response.status_code == 200
    data = response.json()
    assert "CITIZEN_TOKEN" in data
    assert "OFFICER_TOKEN" in data
    assert "ADMIN_TOKEN" in data

def test_rbac_officer_required_protection(client):
    # Citizen trying to create parcel should be 403 Forbidden
    login_res = client.post(
        "/api/auth/login",
        data={"username": "citizen", "password": "citizen123"}
    )
    citizen_token = login_res.json()["access_token"]

    response = client.post(
        "/api/parcels",
        headers={"Authorization": f"Bearer {citizen_token}"},
        json={
            "ulpin": "UL999",
            "state": "Karnataka",
            "district": "Bengaluru Urban",
            "taluk": "Bengaluru South",
            "village": "Kengeri",
            "survey_number": "999",
            "gis_area_acres": 2.5
        }
    )
    assert response.status_code == 403
