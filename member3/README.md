# LandStack Member 3 AI Agent

This project contains the LandStack AI Agent developed by Member 3.

## Purpose

The AI Agent sits on top of the existing LandStack system and is responsible for:

- understanding natural-language questions from authorized officers
- selecting the correct tools
- retrieving parcel facts from mock or future backend services
- summarizing relevant findings
- returning structured results for the frontend or officer workflow

This version intentionally uses synthetic mock data. It does not connect to PostgreSQL, PostGIS, or a production government database.

## Architecture

Officer
  ↓
LandStack AI Agent
  ↓
LLM interpretation and orchestration
  ↓
Tool layer
  ↓
Backend APIs later
  ↓
Database/PostGIS later
  ↓
Structured response

## Scope of this project

Member 3 is responsible for:

- AI agent orchestration
- tool selection and routing
- guardrails and read-only behavior
- mock land data
- backend API abstraction for future integration
- structured responses for the frontend map/highlight workflow

## Project structure

```text
LandStack/
└── member3/
    ├── agent/
    │   ├── __init__.py
    │   ├── agent.py
    │   ├── prompts.py
    │   └── router.py
    ├── api/
    │   ├── __init__.py
    │   └── backend_client.py
    ├── config/
    │   ├── __init__.py
    │   └── settings.py
    ├── schemas/
    │   ├── __init__.py
    │   └── response.py
    ├── tools/
    │   ├── __init__.py
    │   ├── land_tools.py
    │   └── mock_data.py
    ├── tests/
    │   ├── test_agent.py
    │   ├── test_guardrails.py
    │   └── test_tools.py
    ├── .env.example
    ├── .gitignore
    ├── main.py
    ├── README.md
    ├── requirements.txt
    └── .venv/
```

## Synthetic mock data

All records are clearly labeled as synthetic demonstration data only.

Examples included here:

- UL001: Ravi Kumar, 3.20 acres, agriculture, tax paid, no encumbrance, verified
- UL002: Anita Sharma, 4.50 acres, agriculture, active encumbrance, mismatch
- UL003: Rahul Patil, 2.10 acres, residential, closed encumbrance, verified
- UL004: Priya Singh, 5.00 acres, agriculture, active encumbrance, mismatch

## Tool set

This version includes these initial tools:

- get_selected_area()
- get_parcels_in_area(area_id)
- get_parcel_details(ulpin)
- get_encumbrance(ulpin)
- get_verification_status(ulpin)

These tools operate on mock data only and are designed to be replaced by real backend APIs later.

## Guardrails

The agent is explicitly read-only and enforces the following rules:

- never invent ULPINs, owners, or land areas
- use tools for factual information
- distinguish unavailable records from negative findings
- no unsupported legal conclusions
- no database access from the LLM
- no GIS geometry calculations from the LLM
- synthetic data must not be treated as official data

## Local setup

From the project root:

```powershell
cd LandStack\member3
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

## Ollama setup

This project is designed to use a local Ollama model.

1. Install Ollama from https://ollama.com
2. Start the service locally.
3. Make sure the model exists.

Example:

```powershell
ollama pull llama3.2
```

Set the environment variables in `.env` based on `.env.example`.

Example:

```env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
```

## Running the agent

```powershell
cd LandStack\member3
.\.venv\Scripts\Activate.ps1
python main.py
```

Example questions:

- Show me the details of UL001.
- Which parcels in the selected area have active encumbrances?
- Show me agricultural parcels in this selected area.
- Which parcels have verification mismatches?
- Highlight agricultural parcels with active encumbrances.

## Running tests

```powershell
cd LandStack\member3
.\.venv\Scripts\Activate.ps1
pytest -q
```

## Future Member 1 integration

Member 1 will later provide the GIS/selection context. This project abstracts that concept through:

- get_selected_area()
- area_id
- get_parcels_in_area(area_id)

No real GIS API or PostGIS integration is included yet.

## Future Member 2 integration

Member 2 will later provide backend land-record services. The abstraction layer is in:

- api/backend_client.py

This file intentionally contains placeholder functions and no fake URLs.

## Future frontend integration

The agent returns a structured response with:

- answer
- parcel_ids
- action
- sources
- warnings

This supports map highlighting and future UI integration.

## Important note

This project uses synthetic mock data because the real Member 1 and Member 2 APIs are not yet connected.
