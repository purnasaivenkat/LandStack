# LandStack Officer AI Agent

The Member 3 agent is integrated with the backend through controlled REST tools.

## Runtime implementation

- Router: `backend/app/routers/ai_agent_tools.py`
- Python SDK: `backend/integration_clients/member3_ai_agent_sdk.py`
- Tool schema: `backend/integration_clients/ai_tools_spec.json`
- Tests: `backend/tests/test_ai_agent_tools.py`

## Endpoints

- `GET /api/ai-agent/tools` returns the tool manifest.
- `POST /api/ai-agent/execute-tool` executes an approved tool.

## Frontend

The Officer AI Agent interface is available from the frontend sidebar and calls the backend tool hub. The agent never receives direct Supabase credentials.
