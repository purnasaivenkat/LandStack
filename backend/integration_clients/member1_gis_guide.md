# 🗺️ Member 1 (GIS & PostGIS) Integration Guide

Welcome Member 1! As the GIS Specialist in LandStack, you generate land parcel spatial layers, boundaries, and spatial selections. This guide shows how to connect your GIS module with Member 2's backend.

---

## 1. How GIS Connects to Land Records

```
GIS Map Selection (User draws polygon or clicks parcels)
     ↓
Extracted ULPINs (e.g. ["UL001", "UL002", "UL003"])
     ↓
POST /api/area-analysis/by-ulpins
     ↓
LandStack Relational Database
     ↓
Complete Enriched Dataset + Anomaly Report
```

---

## 2. Key APIs for Member 1

### A. Batch Area Analysis by ULPINs
When a user selects multiple parcels on your map (via rectangle, lasso, or layer selection), call this endpoint:

- **Endpoint**: `POST /api/area-analysis/by-ulpins`
- **Request Body**:
```json
{
  "ulpins": ["UL001", "UL002", "UL003"]
}
```
- **Response**:
```json
{
  "summary": {
    "total_parcels": 3,
    "total_gis_area_acres": 10.9,
    "total_doc_area_acres": 10.5,
    "area_discrepancy_acres": 0.4,
    "disputed_parcels_count": 1,
    "encumbered_parcels_count": 0,
    "tax_default_count": 0,
    "total_tax_dues": 0.0,
    "zoning_breakdown": {
      "AGRICULTURAL": 3
    },
    "overall_health_score": 65
  },
  "parcels": [ ...detailed unified profiles... ]
}
```

---

### B. Spatial Bounding Box Query
When your map pans or zooms and you want to fetch parcels in the viewport:

- **Endpoint**: `POST /api/area-analysis/spatial`
- **Request Body**:
```json
{
  "min_lat": 12.9100,
  "max_lat": 12.9250,
  "min_lng": 77.4800,
  "max_lng": 77.5100
}
```

---

### C. Single Parcel Details
When a user clicks on a single parcel on the map:

- **Endpoint**: `GET /api/parcel-profile/{ulpin}`
- Example: `GET /api/parcel-profile/UL002`

---

## 3. Python Integration Snippet for Member 1
```python
import requests

BACKEND_URL = "http://127.0.0.1:8000"

def fetch_area_records(selected_ulpins: list[str]):
    response = requests.post(
        f"{BACKEND_URL}/api/area-analysis/by-ulpins",
        json={"ulpins": selected_ulpins}
    )
    if response.status_code == 200:
        data = response.json()
        print(f"Total GIS Area: {data['summary']['total_gis_area_acres']} acres")
        print(f"Disputed parcels: {data['summary']['disputed_parcels_count']}")
        return data
    else:
        print("Error:", response.text)

# Example call:
# fetch_area_records(["UL001", "UL002", "UL003"])
```
