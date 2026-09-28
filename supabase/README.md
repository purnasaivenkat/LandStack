# 🐘 Supabase PostgreSQL Multi-Department Database Guide

This directory contains pure PostgreSQL DDL and DML scripts designed for **Supabase (Project ID: `slrjtctvyhhbwwcgomcy`)** and PostGIS.

---

## 🏛️ Departmental Silo Architecture

In real-world government governance, each department operates in its own isolated database or schema:

```
┌─────────────────────────────────────────────────────────────┐
│                    LandStack PostgreSQL                     │
├───────────────────┬───────────────────┬─────────────────────┤
│ dept_gis          │ dept_ror          │ dept_registration   │
│ (Survey & PostGIS)│ (Bhoomi Pahani)   │ (Kaveri Deeds)      │
├───────────────────┼───────────────────┼─────────────────────┤
│ dept_tax          │ dept_banking      │ dept_urban_plan     │
│ (Property Taxes)  │ (Liens & EC)      │ (Master Plan Zoning)│
├───────────────────┼───────────────────┼─────────────────────┤
│ dept_municipal    │ dept_judiciary    │ dept_auth           │
│ (Building Permits)│ (e-Courts Stays)  │ (RBAC Users)        │
└───────────────────┴───────────────────┴─────────────────────┘
```

All department records are linked via the statutory **`ULPIN`** (Unique Land Parcel Identification Number).

---

## 🚀 How to Execute on Supabase (1-Click)

1. Open your Supabase project dashboard:
   👉 **[https://supabase.com/dashboard/project/slrjtctvyhhbwwcgomcy/sql](https://supabase.com/dashboard/project/slrjtctvyhhbwwcgomcy/sql)**
2. Click **"New Query"**.
3. Open [`supabase/full_supabase_setup.sql`](./full_supabase_setup.sql), copy the entire content, and paste it into the Supabase SQL editor.
4. Click **"Run"** (or press `Ctrl+Enter`).

---

## 📁 Individual SQL Scripts by Department

If you prefer to run or modify departments individually:

| Script | Department / Function | Schema | Key Tables |
| :--- | :--- | :--- | :--- |
| `00_init_schemas_and_extensions.sql` | PostGIS & Schemas Setup | `public` | `postgis`, `uuid-ossp` |
| `01_gis_parcels.sql` | Survey Settlement & GIS | `dept_gis` | `parcels` + PostGIS geometry |
| `02_ror_pahani.sql` | Revenue (Record of Rights) | `dept_ror` | `ror_records` |
| `03_registration_sro.sql` | Stamps & Sub-Registrar Deeds | `dept_registration` | `deeds` |
| `04_tax_revenue.sql` | Municipal Property Tax | `dept_tax` | `property_tax` |
| `05_encumbrance_banking.sql` | Banking Mortgages & Liens | `dept_banking` | `encumbrances` |
| `06_land_use_zoning.sql` | Urban Planning Master Plan | `dept_urban_plan` | `land_use` |
| `07_building_permits.sql` | Municipal Building Sanctions | `dept_municipal` | `building_permits` |
| `08_judiciary_court_cases.sql` | Civil Courts & Stays | `dept_judiciary` | `court_cases` |
| `09_rbac_users.sql` | Auth & Access Control | `dept_auth` | `users` |
| `10_seed_all_departments_data.sql`| Synthetic Mock Data & Inconsistencies | All Schemas | `UL001` to `UL006` |

---

## ❓ Why Python + PostgreSQL?

- **PostgreSQL / Supabase**: Acts as the authoritative **relational multi-department database**, handling storage, PostGIS spatial queries, foreign key constraints, indexes, and schema isolation.
- **Python (FastAPI)**: Acts as the **Central Connection Layer (Member 2)**. Government databases cannot be directly exposed to public frontends or LLM AI agents for security reasons. Python validates JWT tokens, calculates cross-department anomaly risk scores in real-time, provides REST endpoints for Member 4's Frontend, and provides safe tool-calling APIs for Member 3's AI Agent.
