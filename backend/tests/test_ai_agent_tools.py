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
