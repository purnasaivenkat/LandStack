# LANDSTACK — GIS + PARCEL ENGINE

## SIH 2026 | PS 26014 — An Integrated GIS-based Digital Public Infrastructure for Land Governance

LandStack is a parcel-centric GIS platform built for SIH 2026. It unifies land-related datasets across India using common spatial parcel identifiers such as **ULPIN (Unique Land Parcel Identification Number)**.

---

> **DISCLAIMER:**  
> The geographic study area (**Karjat, Raigad, Maharashtra, India**) is real, and Esri World Imagery satellite imagery provides the visual basemap. Parcel geometries, ULPINs, survey numbers, and associated cadastral attributes are **synthetic cadastral demonstration data** generated for prototype testing using a parent-block subdivision engine and do not represent official or legal government cadastral records.

---

## 1. System Architecture

```text
                               ┌─────────────────────────────┐
                               │     MapLibre GL JS Engine   │
                               │ Esri Satellite + Parcels    │
                               └──────────────┬──────────────┘
                                              │
                                              ▼
                               ┌─────────────────────────────┐
                               │      Data Access Layer      │
                               │  (lib/parcels/data_access)  │
                               └──────────────┬──────────────┘
                                              │
                       ┌──────────────────────┴──────────────────────┐
                       ▼                                             ▼
        ┌─────────────────────────────┐               ┌─────────────────────────────┐
        │     Supabase + PostGIS DB   │               │   Synthetic Engine GeoJSON  │
        │   (ST_Intersects / GiST)    │               │ (cadastral_karjat.json 1K)  │
        └─────────────────────────────┘               └─────────────────────────────┘
```

---

## 2. Core Features

- **Real Geographic Study Area:** Karjat, Raigad, Maharashtra, India (`[73.3050, 18.9050, 73.3350, 18.9350]`).
- **1,000 Synthetic Cadastral Parcels:** Generated via Parent-Block Subdivision Engine with shared boundary segments, zero gaps, zero overlaps, and realistic land character distributions (residential, agricultural, mixed).
- **Unique Parcel Identifiers:** ULPIN (`ULPIN-DEMO-000001` to `ULPIN-DEMO-001000`), Parcel ID (`P0001` to `P1000`), Survey Numbers (`12/1`, `14/A`, `108/3`).
- **PostGIS Integration:** SRID 4326 geometry validation, GiST spatial indexing, `ST_Intersects()`, `ST_Contains()`, `ST_Within()`, `ST_Area()` calculations.
- **Satellite Basemap:** High-resolution Esri World Imagery with satellite tile switching.
- **Survey Number Text Labels:** Real-time MapLibre text labels with collision handling and dark halo buffers over satellite imagery.
- **Multi-Field Instant Search:** Search by ULPIN, Parcel ID, Survey Number, or Village with interactive camera animation.
- **Parcel Details Drawer:** Glassmorphism drawer displaying parcel properties, area in acres and sq meters, village, zone ID, centroid coordinates, ULPIN copy button, and GeoJSON exporter.
- **ST_Intersects Spatial Selection Tool:** Interactive bounding box spatial query tool highlighting intersecting parcels in glowing amber.

---

## 3. Database Schema & PostGIS Setup

### Table: `parcels`
| Column | Type | Constraints / Details |
|---|---|---|
| `parcel_id` | `VARCHAR(50)` | Unique Parcel Code (e.g. `P0157`) |
| `ulpin` | `VARCHAR(50)` | Primary ULPIN Code (e.g. `ULPIN-DEMO-000157`) |
| `survey_no` / `survey_number` | `VARCHAR(50)` | Maharashtra Cadastral Survey No (e.g. `12/1`) |
| `area_acres` | `DOUBLE PRECISION` | Calculated acreage |
| `village` | `VARCHAR(255)` | Sub-village (Karjat, Dahivali, Mudre, Akurle, Posheri) |
| `district` | `VARCHAR(255)` | Raigad |
| `state` | `VARCHAR(255)` | Maharashtra |
| `zone_id` | `VARCHAR(50)` | Karjat Sector Zone (e.g. `Zone-04`) |
| `geometry` | `GEOMETRY(Polygon, 4326)` | PostGIS Valid WGS84 Polygon |

---

## 4. Synthetic Cadastral Data Generator

The generator script uses a parent-block subdivision algorithm with a fixed PRNG seed (`20260919`) to create 1,000 topologically sound parcels with shared boundaries:

```bash
npm run generate-cadastral
```

Output:
- `public/data/cadastral_karjat.json` (1,000 cadastral parcels)

---

## 5. Dataset Validation

Run dataset validation against PostGIS geometry standards and spatial topology checks:

```bash
npm run validate-dataset
```

Expected output:
```text
==================================================
LANDSTACK — Cadastral Dataset Comprehensive Audit
==================================================

BASIC PARCEL METRICS:
--------------------------------------------------
Total Parcels:              1000
Valid SRID 4326 Geometries: 1000
Invalid Geometries:         0
Duplicate Parcel IDs:       0
Duplicate ULPINs:          0
Parcels Outside Study Area:0

SPATIAL TOPOLOGY & GEOMETRY QUALITY:
--------------------------------------------------
Shared Boundary Ratio:      100% (Coherent Cadastral Fabric)
Orientation Variance:       7462.17° (No Repeated Diagonal Grid Strips)
Grid Repetition Score:      2.5% (Low Repetition Index)
--------------------------------------------------
AUDIT STATUS:               [ PASSED ]
```

---

## 6. Running Locally

1. Install dependencies:
   ```bash
   npm install
   ```

2. Generate cadastral data & validate:
   ```bash
   npm run generate-cadastral
   npm run validate-dataset
   ```

3. Launch development server:
   ```bash
   npm run dev
   ```

4. Open browser at [http://localhost:3000](http://localhost:3000).
