"""
🤖 LandStack AI Agent SDK (For Member 3 — AI Agent Lead)

Provides ready-to-use Python tool functions for LLM frameworks like:
- LangChain / LangGraph
- CrewAI
- LlamaIndex
- Google GenAI SDK (Gemini Function Calling)
- OpenAI Function Calling

The AI Agent never touches the database directly. Instead, it calls these tools
which safely query Member 2's backend.
"""

import requests
from typing import List, Dict, Any, Optional

DEFAULT_BACKEND_URL = "http://127.0.0.1:8000"

class LandStackAITools:
    def __init__(self, base_url: str = DEFAULT_BACKEND_URL, api_token: Optional[str] = None):
        self.base_url = base_url.rstrip("/")
        self.headers = {"Content-Type": "application/json"}
        if api_token:
            self.headers["Authorization"] = f"Bearer {api_token}"

    def get_unified_parcel_profile(self, ulpin: str) -> Dict[str, Any]:
        """
        Fetch the complete 360-degree unified profile for a parcel including
        GIS, RoR, Deed Registration, Tax, Encumbrance, Land Use, Building Permit,
        Court Cases, and computed Anomaly/Risk diagnosis.
        """
        url = f"{self.base_url}/api/parcel-profile/{ulpin.strip()}"
        res = requests.get(url, headers=self.headers)
        if res.status_code == 200:
            return res.json()
        return {"error": f"Failed to fetch profile: {res.text}", "status_code": res.status_code}

    def get_parcel_details(self, ulpin: str) -> Dict[str, Any]:
        """Retrieve physical GIS boundary details and acreage."""
        url = f"{self.base_url}/api/parcels/{ulpin.strip()}"
        res = requests.get(url, headers=self.headers)
        return res.json() if res.status_code == 200 else {"error": res.text}

    def get_ror(self, ulpin: str) -> Dict[str, Any]:
        """Retrieve legal Record of Rights (Pahani) ownership and registered area."""
        url = f"{self.base_url}/api/ror/{ulpin.strip()}"
        res = requests.get(url, headers=self.headers)
        return res.json() if res.status_code == 200 else {"error": res.text}

    def get_tax(self, ulpin: str) -> Dict[str, Any]:
        """Retrieve property tax assessment and dues."""
        url = f"{self.base_url}/api/tax/{ulpin.strip()}"
        res = requests.get(url, headers=self.headers)
        return res.json() if res.status_code == 200 else {"error": res.text}

    def get_encumbrance(self, ulpin: str) -> Dict[str, Any]:
        """Check active bank mortgages and financial liens."""
        url = f"{self.base_url}/api/encumbrance/{ulpin.strip()}"
        res = requests.get(url, headers=self.headers)
        return res.json() if res.status_code == 200 else {"error": res.text}

    def get_land_use(self, ulpin: str) -> Dict[str, Any]:
        """Check master plan zoning and DC conversion status."""
        url = f"{self.base_url}/api/land-use/{ulpin.strip()}"
        res = requests.get(url, headers=self.headers)
        return res.json() if res.status_code == 200 else {"error": res.text}

    def get_building_permit(self, ulpin: str) -> Dict[str, Any]:
        """Check building sanctions, floor approvals, and unauthorized deviations."""
        url = f"{self.base_url}/api/building-permit/{ulpin.strip()}"
        res = requests.get(url, headers=self.headers)
        return res.json() if res.status_code == 200 else {"error": res.text}

    def get_court_cases(self, ulpin: str) -> Dict[str, Any]:
        """Check civil court litigation, title disputes, and judicial stay orders."""
        url = f"{self.base_url}/api/court-cases/{ulpin.strip()}"
        res = requests.get(url, headers=self.headers)
        return res.json() if res.status_code == 200 else {"error": res.text}

    def get_parcels_in_area(self, ulpins: List[str]) -> Dict[str, Any]:
        """Batch analyze multiple parcels in a selected area."""
        url = f"{self.base_url}/api/area-analysis/by-ulpins"
        res = requests.post(url, json={"ulpins": ulpins}, headers=self.headers)
        return res.json() if res.status_code == 200 else {"error": res.text}

# Example LangChain / CrewAI tool wrapper declarations:
# @tool
# def land_parcel_lookup(ulpin: str) -> dict:
#     """Lookup land records and risk anomalies by ULPIN."""
#     tools = LandStackAITools()
#     return tools.get_unified_parcel_profile(ulpin)
