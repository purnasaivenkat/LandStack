def test_ai_tools_manifest(client):
    response = client.get("/api/ai-agent/tools")
    assert response.status_code == 200
    data = response.json()
    assert "tools" in data
    assert data["tools_count"] >= 5

def test_execute_ai_tool_unified_profile(client):
    response = client.post(
        "/api/ai-agent/execute-tool",
        json={
            "tool_name": "get_unified_parcel_profile",
            "arguments": {"ulpin": "UL001"}
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "result" in data
    assert data["result"]["ulpin"] == "UL001"

def test_execute_ai_tool_ror(client):
    response = client.post(
        "/api/ai-agent/execute-tool",
        json={
            "tool_name": "get_ror",
            "arguments": {"ulpin": "UL001"}
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["primary_owner"] == "Ravi Kumar"

def test_execute_ai_tool_multi_parcel_unified_profile(client):
    response = client.post(
        "/api/ai-agent/execute-tool",
        json={
            "tool_name": "get_unified_parcel_profile",
            "arguments": {"ulpins": ["UL001", "UL002"]}
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["count"] == 2
    assert "parcels" in data
    assert any(p.get("ulpin") == "UL001" for p in data["parcels"])
    assert any(p.get("ulpin") == "UL002" for p in data["parcels"])

def test_execute_ai_tool_get_multiple_parcels_details(client):
    response = client.post(
        "/api/ai-agent/execute-tool",
        json={
            "tool_name": "get_multiple_parcels_details",
            "arguments": {"ulpins": ["UL001", "UL002", "UL003"]}
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["count"] == 3
    assert len(data["parcels"]) == 3

def test_execute_ai_tool_multi_parcel_details(client):
    response = client.post(
        "/api/ai-agent/execute-tool",
        json={
            "tool_name": "get_parcel_details",
            "arguments": {"ulpins": ["UL001", "UL002"]}
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["count"] == 2
    assert len(data["parcels"]) == 2

def test_agent_chat_multi_parcel(client):
    response = client.post(
        "/api/ai-agent/chat",
        json={"question": "Compare UL001 and UL002 and show their details"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "UL001" in data["parcel_ids"]
    assert "UL002" in data["parcel_ids"]
    assert len(data["parcel_ids"]) == 2
    assert "UL001" in data["answer"]
    assert "UL002" in data["answer"]
    assert len(data["parcels_data"]) == 2

def test_agent_chat_single_parcel(client):
    response = client.post(
        "/api/ai-agent/chat",
        json={"question": "What is the status of UL001?"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["parcel_ids"] == ["UL001"]
    assert "UL001" in data["answer"]

