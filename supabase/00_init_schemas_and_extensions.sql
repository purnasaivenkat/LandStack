-- ============================================================================
-- LandStack: 00_init_schemas_and_extensions.sql
-- Multi-Department Government Silo Architecture for Supabase PostgreSQL
-- ============================================================================

-- 1. Enable PostGIS for Spatial and Geometry Analytics (Member 1 GIS)
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Isolated Department Schemas (Simulating Government Silos)
CREATE SCHEMA IF NOT EXISTS dept_gis;           -- Department of Survey Settlement and Land Records
CREATE SCHEMA IF NOT EXISTS dept_ror;           -- Revenue Dept (Bhoomi / Jamabandi / Record of Rights)
CREATE SCHEMA IF NOT EXISTS dept_registration;  -- Stamps & Registration (Kaveri / SRO Deeds)
CREATE SCHEMA IF NOT EXISTS dept_tax;           -- Municipal Revenue & Property Tax Dept
CREATE SCHEMA IF NOT EXISTS dept_banking;       -- Banking Registry & Encumbrance (CERSAI / Sub-Registrar EC)
CREATE SCHEMA IF NOT EXISTS dept_urban_plan;    -- Urban Development Authority / Zoning Master Plan
CREATE SCHEMA IF NOT EXISTS dept_municipal;     -- Municipal Corporation Building Permits (BBMP / BDA)
CREATE SCHEMA IF NOT EXISTS dept_judiciary;     -- High Court & District Civil Courts (e-Courts)
CREATE SCHEMA IF NOT EXISTS dept_auth;          -- LandStack Identity, Roles & RBAC

COMMENT ON SCHEMA dept_gis IS 'GIS Survey boundaries and spatial geometry';
COMMENT ON SCHEMA dept_ror IS 'Revenue Record of Rights, Khata, and Ownership Titles';
COMMENT ON SCHEMA dept_registration IS 'Deed Registrations, Consideration Amounts, Stamp Duties';
COMMENT ON SCHEMA dept_tax IS 'Municipal Tax Assessments, Cess, and Payment Status';
COMMENT ON SCHEMA dept_banking IS 'Registered Mortgages, Liens, and Encumbrance Certificates';
COMMENT ON SCHEMA dept_urban_plan IS 'Statutory Master Plan Zoning and Land Conversion Orders';
COMMENT ON SCHEMA dept_municipal IS 'Building Sanction Plans, Sanctioned Floors, and Violations';
COMMENT ON SCHEMA dept_judiciary IS 'Active Injunctions, Judicial Stays, and Civil Title Disputes';
COMMENT ON SCHEMA dept_auth IS 'System Authentication and Role-Based Access Control';
