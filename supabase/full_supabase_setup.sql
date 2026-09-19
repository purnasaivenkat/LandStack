-- ============================================================================
-- LandStack: full_supabase_setup.sql (ALL-IN-ONE INITIALIZER)
-- Copy and paste this entire script into the Supabase SQL Editor and click RUN
-- Project ID: slrjtctvyhhbwwcgomcy
-- ============================================================================

-- 1. Enable PostGIS Extension
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Isolated Department Schemas (Government Department Silos)
CREATE SCHEMA IF NOT EXISTS dept_gis;           -- Survey Settlement & Land Records (GIS)
CREATE SCHEMA IF NOT EXISTS dept_ror;           -- Revenue Dept (Bhoomi / Jamabandi / Record of Rights)
CREATE SCHEMA IF NOT EXISTS dept_registration;  -- Stamps & Registration (Kaveri / SRO Deeds)
CREATE SCHEMA IF NOT EXISTS dept_tax;           -- Municipal Revenue & Property Tax Dept
CREATE SCHEMA IF NOT EXISTS dept_banking;       -- Banking Registry & Encumbrance (CERSAI / Sub-Registrar EC)
CREATE SCHEMA IF NOT EXISTS dept_urban_plan;    -- Urban Development Authority / Zoning Master Plan
CREATE SCHEMA IF NOT EXISTS dept_municipal;     -- Municipal Corporation Building Permits (BBMP / BDA)
CREATE SCHEMA IF NOT EXISTS dept_judiciary;     -- High Court & District Civil Courts (e-Courts)
CREATE SCHEMA IF NOT EXISTS dept_auth;          -- LandStack Identity, Roles & RBAC

-- 3. Create Department Tables

-- A. GIS Parcels
DROP TABLE IF EXISTS dept_gis.parcels CASCADE;
CREATE TABLE dept_gis.parcels (
    ulpin VARCHAR(50) PRIMARY KEY,
    state VARCHAR(100) NOT NULL DEFAULT 'Karnataka',
    district VARCHAR(100) NOT NULL DEFAULT 'Bengaluru Urban',
    taluk VARCHAR(100) NOT NULL DEFAULT 'Bengaluru South',
    village VARCHAR(100) NOT NULL DEFAULT 'Kengeri',
    survey_number VARCHAR(50) NOT NULL,
    sub_division VARCHAR(50),
    gis_area_acres NUMERIC(10, 2) NOT NULL,
    centroid_lat NUMERIC(10, 6),
    centroid_lng NUMERIC(10, 6),
    geometry_geojson TEXT,
    geom geometry(Polygon, 4326),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_parcels_survey ON dept_gis.parcels (survey_number);
CREATE INDEX IF NOT EXISTS idx_parcels_geom ON dept_gis.parcels USING GIST (geom);

-- B. Record of Rights (RoR / Pahani)
DROP TABLE IF EXISTS dept_ror.ror_records CASCADE;
CREATE TABLE dept_ror.ror_records (
    id SERIAL PRIMARY KEY,
    ulpin VARCHAR(50) NOT NULL REFERENCES dept_gis.parcels(ulpin) ON DELETE CASCADE,
    khata_number VARCHAR(50) NOT NULL,
    primary_owner VARCHAR(150) NOT NULL,
    father_name VARCHAR(150),
    joint_owners TEXT,
    document_area_acres NUMERIC(10, 2) NOT NULL,
    land_type VARCHAR(50) NOT NULL DEFAULT 'Dry Crop',
    soil_type VARCHAR(50),
    mutation_number VARCHAR(50),
    mutated_date DATE,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_ror_ulpin ON dept_ror.ror_records (ulpin);
CREATE INDEX IF NOT EXISTS idx_ror_owner ON dept_ror.ror_records (primary_owner);

-- C. Deed Registration (SRO)
DROP TABLE IF EXISTS dept_registration.deeds CASCADE;
CREATE TABLE dept_registration.deeds (
    id SERIAL PRIMARY KEY,
    ulpin VARCHAR(50) NOT NULL REFERENCES dept_gis.parcels(ulpin) ON DELETE CASCADE,
    deed_number VARCHAR(100) NOT NULL UNIQUE,
    registration_date DATE NOT NULL,
    sro_name VARCHAR(100) NOT NULL,
    party_seller VARCHAR(150) NOT NULL,
    party_buyer VARCHAR(150) NOT NULL,
    consideration_amount NUMERIC(14, 2) NOT NULL,
    stamp_duty_paid NUMERIC(14, 2) NOT NULL,
    market_value NUMERIC(14, 2) NOT NULL,
    document_url VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_deeds_ulpin ON dept_registration.deeds (ulpin);

-- D. Property Tax Department
DROP TYPE IF EXISTS dept_tax.tax_status_enum CASCADE;
CREATE TYPE dept_tax.tax_status_enum AS ENUM ('PAID', 'PARTIAL', 'DUE', 'DEFAULTED');

DROP TABLE IF EXISTS dept_tax.property_tax CASCADE;
CREATE TABLE dept_tax.property_tax (
    id SERIAL PRIMARY KEY,
    ulpin VARCHAR(50) NOT NULL REFERENCES dept_gis.parcels(ulpin) ON DELETE CASCADE,
    assessment_year VARCHAR(20) NOT NULL,
    property_tax_due NUMERIC(12, 2) NOT NULL DEFAULT 0.0,
    cess_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.0,
    penalties NUMERIC(12, 2) NOT NULL DEFAULT 0.0,
    total_paid NUMERIC(12, 2) NOT NULL DEFAULT 0.0,
    payment_status dept_tax.tax_status_enum NOT NULL DEFAULT 'PAID',
    last_payment_date DATE,
    receipt_number VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_tax_ulpin ON dept_tax.property_tax (ulpin);

-- E. Banking & Encumbrances (EC)
DROP TYPE IF EXISTS dept_banking.encumbrance_status_enum CASCADE;
CREATE TYPE dept_banking.encumbrance_status_enum AS ENUM ('NONE', 'ACTIVE', 'RELEASED');

DROP TABLE IF EXISTS dept_banking.encumbrances CASCADE;
CREATE TABLE dept_banking.encumbrances (
    id SERIAL PRIMARY KEY,
    ulpin VARCHAR(50) NOT NULL REFERENCES dept_gis.parcels(ulpin) ON DELETE CASCADE,
    has_encumbrance BOOLEAN NOT NULL DEFAULT FALSE,
    bank_name VARCHAR(150),
    loan_account_no VARCHAR(100),
    mortgage_amount NUMERIC(14, 2) DEFAULT 0.0,
    date_of_mortgage DATE,
    status dept_banking.encumbrance_status_enum NOT NULL DEFAULT 'NONE',
    ec_certificate_number VARCHAR(100),
    period_from DATE,
    period_to DATE,
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_encumbrance_ulpin ON dept_banking.encumbrances (ulpin);

-- F. Urban Planning & Land Use Zoning
DROP TYPE IF EXISTS dept_urban_plan.zone_type_enum CASCADE;
CREATE TYPE dept_urban_plan.zone_type_enum AS ENUM (
    'AGRICULTURAL',
    'RESIDENTIAL',
    'COMMERCIAL',
    'INDUSTRIAL',
    'GREEN_BELT',
    'PUBLIC_UTILITY'
);

DROP TABLE IF EXISTS dept_urban_plan.land_use CASCADE;
CREATE TABLE dept_urban_plan.land_use (
    id SERIAL PRIMARY KEY,
    ulpin VARCHAR(50) NOT NULL REFERENCES dept_gis.parcels(ulpin) ON DELETE CASCADE,
    master_plan_zone dept_urban_plan.zone_type_enum NOT NULL DEFAULT 'AGRICULTURAL',
    current_usage VARCHAR(100) NOT NULL,
    is_converted BOOLEAN NOT NULL DEFAULT FALSE,
    conversion_order_no VARCHAR(100),
    conversion_date DATE,
    zoning_authority VARCHAR(100) NOT NULL DEFAULT 'BMRDA / BDA',
    flood_zone_risk VARCHAR(50) DEFAULT 'LOW',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_landuse_ulpin ON dept_urban_plan.land_use (ulpin);

-- G. Municipal Building Permits
DROP TYPE IF EXISTS dept_municipal.permit_status_enum CASCADE;
CREATE TYPE dept_municipal.permit_status_enum AS ENUM (
    'APPROVED',
    'PENDING',
    'REJECTED',
    'NO_PERMIT',
    'REVOKED'
);

DROP TABLE IF EXISTS dept_municipal.building_permits CASCADE;
CREATE TABLE dept_municipal.building_permits (
    id SERIAL PRIMARY KEY,
    ulpin VARCHAR(50) NOT NULL REFERENCES dept_gis.parcels(ulpin) ON DELETE CASCADE,
    permit_number VARCHAR(100),
    sanctioning_authority VARCHAR(100) NOT NULL DEFAULT 'BBMP / BDA',
    sanctioned_floors INTEGER DEFAULT 0,
    actual_floors INTEGER DEFAULT 0,
    sanctioned_builtup_area_sqft NUMERIC(12, 2) DEFAULT 0.0,
    actual_builtup_area_sqft NUMERIC(12, 2) DEFAULT 0.0,
    approval_status dept_municipal.permit_status_enum NOT NULL DEFAULT 'NO_PERMIT',
    approval_date DATE,
    expiry_date DATE,
    occupancy_certificate_issued BOOLEAN DEFAULT FALSE,
    deviation_detected BOOLEAN DEFAULT FALSE,
    violation_remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_permits_ulpin ON dept_municipal.building_permits (ulpin);

-- H. Judiciary Court Cases (Litigation & Injunctions)
DROP TYPE IF EXISTS dept_judiciary.case_status_enum CASCADE;
CREATE TYPE dept_judiciary.case_status_enum AS ENUM (
    'PENDING',
    'STAY_GRANTED',
    'DISPOSED_FAVOURABLE',
    'DISPOSED_DISMISSED',
    'NO_LITIGATION'
);

DROP TABLE IF EXISTS dept_judiciary.court_cases CASCADE;
CREATE TABLE dept_judiciary.court_cases (
    id SERIAL PRIMARY KEY,
    ulpin VARCHAR(50) NOT NULL REFERENCES dept_gis.parcels(ulpin) ON DELETE CASCADE,
    has_litigation BOOLEAN NOT NULL DEFAULT FALSE,
    case_number VARCHAR(100),
    court_name VARCHAR(150),
    case_type VARCHAR(100),
    petitioner VARCHAR(150),
    respondent VARCHAR(150),
    stay_order_active BOOLEAN NOT NULL DEFAULT FALSE,
    case_status dept_judiciary.case_status_enum NOT NULL DEFAULT 'NO_LITIGATION',
    filing_date DATE,
    next_hearing_date DATE,
    case_summary TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_court_ulpin ON dept_judiciary.court_cases (ulpin);

-- I. RBAC User Accounts
DROP TYPE IF EXISTS dept_auth.user_role_enum CASCADE;
CREATE TYPE dept_auth.user_role_enum AS ENUM ('CITIZEN', 'OFFICER', 'ADMIN');

DROP TABLE IF EXISTS dept_auth.users CASCADE;
CREATE TABLE dept_auth.users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role dept_auth.user_role_enum NOT NULL DEFAULT 'CITIZEN',
    department VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. Seed Multi-Department Mock Data

-- Users
INSERT INTO dept_auth.users (username, email, hashed_password, full_name, role, department)
VALUES
('citizen', 'citizen@landstack.gov.in', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'Purna Sai (Citizen)', 'CITIZEN', 'Public Citizen'),
('officer', 'officer@landstack.gov.in', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'Dr. K. Ananth (Revenue Inspector)', 'OFFICER', 'Dept of Survey Settlement & Land Records'),
('admin', 'admin@landstack.gov.in', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'System Administrator', 'ADMIN', 'LandStack Core Tech Team')
ON CONFLICT (username) DO NOTHING;

-- GIS Parcels
INSERT INTO dept_gis.parcels (ulpin, survey_number, sub_division, gis_area_acres, centroid_lat, centroid_lng, geometry_geojson, geom)
VALUES
('UL001', '104/1', 'A', 3.20, 12.9125, 77.4850, '{"type":"Polygon","coordinates":[[[77.484,12.911],[77.486,12.911],[77.486,12.914],[77.484,12.914],[77.484,12.911]]]}', ST_SetSRID(ST_MakePolygon(ST_GeomFromText('LINESTRING(77.484 12.911, 77.486 12.911, 77.486 12.914, 77.484 12.914, 77.484 12.911)')), 4326)),
('UL002', '104/2', 'B', 3.20, 12.9135, 77.4870, '{"type":"Polygon","coordinates":[[[77.486,12.911],[77.488,12.911],[77.488,12.915],[77.486,12.915],[77.486,12.911]]]}', ST_SetSRID(ST_MakePolygon(ST_GeomFromText('LINESTRING(77.486 12.911, 77.488 12.911, 77.488 12.915, 77.486 12.915, 77.486 12.911)')), 4326)),
('UL003', '105', '1', 4.50, 12.9150, 77.4900, '{"type":"Polygon","coordinates":[[[77.489,12.913],[77.492,12.913],[77.492,12.917],[77.489,12.917],[77.489,12.913]]]}', ST_SetSRID(ST_MakePolygon(ST_GeomFromText('LINESTRING(77.489 12.913, 77.492 12.913, 77.492 12.917, 77.489 12.917, 77.489 12.913)')), 4326)),
('UL004', '106/1', 'C', 1.50, 12.9180, 77.4930, '{"type":"Polygon","coordinates":[[[77.491,12.916],[77.494,12.916],[77.494,12.919],[77.491,12.919],[77.491,12.916]]]}', ST_SetSRID(ST_MakePolygon(ST_GeomFromText('LINESTRING(77.491 12.916, 77.494 12.916, 77.494 12.919, 77.491 12.919, 77.491 12.916)')), 4326)),
('UL005', '107', '2', 2.10, 12.9210, 77.4960, '{"type":"Polygon","coordinates":[[[77.494,12.919],[77.498,12.919],[77.498,12.923],[77.494,12.923],[77.494,12.919]]]}', ST_SetSRID(ST_MakePolygon(ST_GeomFromText('LINESTRING(77.494 12.919, 77.498 12.919, 77.498 12.923, 77.494 12.923, 77.494 12.919)')), 4326)),
('UL006', '108', 'A', 1.80, 12.9230, 77.4990, '{"type":"Polygon","coordinates":[[[77.497,12.921],[77.501,12.921],[77.501,12.925],[77.497,12.925],[77.497,12.921]]]}', ST_SetSRID(ST_MakePolygon(ST_GeomFromText('LINESTRING(77.497 12.921, 77.501 12.921, 77.501 12.925, 77.497 12.925, 77.497 12.921)')), 4326))
ON CONFLICT (ulpin) DO NOTHING;

-- RoR
INSERT INTO dept_ror.ror_records (ulpin, khata_number, primary_owner, father_name, joint_owners, document_area_acres, land_type, mutation_number, mutated_date)
VALUES
('UL001', 'KH-2021-8901', 'Ravi Kumar', 'Muniswamy Gowda', NULL, 3.20, 'Dry Crop', 'MR-2018-0912', '2018-06-15'),
('UL002', 'KH-2020-5621', 'Smt. Lakshmi Devi', 'W/o Venkataraman', 'Anand V, Deepa V', 2.80, 'Garden Land', 'MR-2015-1102', '2015-09-20'),
('UL003', 'KH-2019-3312', 'Ramesh Gowda', 'Late Byregowda', 'Suresh Gowda, Manjunath Gowda', 4.50, 'Dry', 'MR-2019-0418', '2019-03-10'),
('UL004', 'KH-2022-7719', 'Venkatesh Prasad', 'Rama Rao', NULL, 1.50, 'Converted Commercial', 'MR-2021-0819', '2021-07-22'),
('UL005', 'KH-2018-9940', 'Anand Rao', 'K. N. Rao', NULL, 2.10, 'Dry', 'MR-2014-0312', '2014-04-10'),
('UL006', 'KH-2021-4431', 'Horizon Logistics LLP', 'Rep by Partner M. Jain', NULL, 1.80, 'Dry', 'MR-2021-1209', '2021-11-15')
ON CONFLICT DO NOTHING;

-- Deeds
INSERT INTO dept_registration.deeds (ulpin, deed_number, registration_date, sro_name, party_seller, party_buyer, consideration_amount, stamp_duty_paid, market_value)
VALUES
('UL001', 'DEED-BNG-2018-4412', '2018-05-10', 'SRO Kengeri', 'Krishnappa Gowda', 'Ravi Kumar', 4500000.0, 270000.0, 4800000.0),
('UL002', 'DEED-BNG-2015-1823', '2015-08-14', 'SRO Kengeri', 'Narayan Swamy', 'Smt. Lakshmi Devi', 3800000.0, 228000.0, 4100000.0),
('UL003', 'DEED-BNG-2019-9941', '2019-02-28', 'SRO Kengeri', 'Byregowda Heirs', 'Ramesh Gowda', 7200000.0, 432000.0, 7500000.0),
('UL004', 'DEED-BNG-2021-6541', '2021-06-18', 'SRO Kengeri', 'Devraj Developers', 'Venkatesh Prasad', 12500000.0, 750000.0, 13000000.0),
('UL005', 'DEED-BNG-2014-4112', '2014-03-22', 'SRO Kengeri', 'Prakash Developers', 'Anand Rao', 3500000.0, 210000.0, 3600000.0),
('UL006', 'DEED-BNG-2021-9988', '2021-11-15', 'SRO Kengeri', 'Chennappa Heirs', 'Horizon Logistics LLP', 9500000.0, 570000.0, 10000000.0)
ON CONFLICT DO NOTHING;

-- Property Tax
INSERT INTO dept_tax.property_tax (ulpin, assessment_year, property_tax_due, cess_amount, penalties, total_paid, payment_status, last_payment_date, receipt_number)
VALUES
('UL001', '2024-2025', 4500.0, 450.0, 0.0, 4950.0, 'PAID', '2024-04-12', 'TAX-REC-2024-0981'),
('UL002', '2024-2025', 5200.0, 520.0, 0.0, 5720.0, 'PAID', '2024-05-19', 'TAX-REC-2024-1184'),
('UL003', '2024-2025', 6800.0, 680.0, 0.0, 7480.0, 'PAID', '2024-03-30', 'TAX-REC-2024-2201'),
('UL004', '2024-2025', 18500.0, 1850.0, 0.0, 20350.0, 'PAID', '2024-04-05', 'TAX-REC-2024-3310'),
('UL005', '2024-2025', 65000.0, 6500.0, 6500.0, 0.0, 'DEFAULTED', NULL, NULL),
('UL006', '2024-2025', 12000.0, 1200.0, 0.0, 13200.0, 'PAID', '2024-06-11', 'TAX-REC-2024-4421')
ON CONFLICT DO NOTHING;

-- Encumbrances
INSERT INTO dept_banking.encumbrances (ulpin, has_encumbrance, bank_name, loan_account_no, mortgage_amount, date_of_mortgage, status, ec_certificate_number, remarks)
VALUES
('UL001', FALSE, NULL, NULL, 0.0, NULL, 'NONE', 'EC-KNG-2024-5541', 'Nil Encumbrance Certificate issued.'),
('UL002', FALSE, NULL, NULL, 0.0, NULL, 'NONE', 'EC-KNG-2024-6623', 'Nil Encumbrance'),
('UL003', FALSE, NULL, NULL, 0.0, NULL, 'NONE', 'EC-KNG-2024-7712', 'Title dispute reported in court.'),
('UL004', TRUE, 'State Bank of India (Commercial Branch)', 'SBI-TERM-89912049', 45000000.0, '2022-01-15', 'ACTIVE', 'EC-KNG-2024-9912', 'Active simple mortgage in favor of State Bank of India.'),
('UL005', FALSE, NULL, NULL, 0.0, NULL, 'NONE', 'EC-KNG-2024-1109', 'Nil Encumbrance'),
('UL006', FALSE, NULL, NULL, 0.0, NULL, 'NONE', 'EC-KNG-2024-3321', 'Nil Encumbrance')
ON CONFLICT DO NOTHING;

-- Land Use
INSERT INTO dept_urban_plan.land_use (ulpin, master_plan_zone, current_usage, is_converted, conversion_order_no, conversion_date, zoning_authority)
VALUES
('UL001', 'AGRICULTURAL', 'Paddy & Ragi Cultivation', FALSE, NULL, NULL, 'BMRDA'),
('UL002', 'AGRICULTURAL', 'Arecanut & Coconut Plantation', FALSE, NULL, NULL, 'BMRDA'),
('UL003', 'AGRICULTURAL', 'Fallow / Disputed Land', FALSE, NULL, NULL, 'BMRDA'),
('UL004', 'COMMERCIAL', 'Commercial Auto Showroom', TRUE, 'DC/REV/CLU/2021/892', '2021-04-12', 'BDA'),
('UL005', 'RESIDENTIAL', 'Vacant Plot Layout', TRUE, 'DC/CLU/2016/401', '2016-08-19', 'BDA'),
('UL006', 'GREEN_BELT', 'Commercial Logistics Hub & Heavy Warehouse', FALSE, NULL, NULL, 'BMRDA')
ON CONFLICT DO NOTHING;

-- Building Permits
INSERT INTO dept_municipal.building_permits (ulpin, permit_number, sanctioning_authority, sanctioned_floors, actual_floors, sanctioned_builtup_area_sqft, actual_builtup_area_sqft, approval_status, deviation_detected, violation_remarks)
VALUES
('UL001', NULL, 'Panchayat', 0, 0, 0.0, 0.0, 'NO_PERMIT', FALSE, NULL),
('UL002', NULL, 'Panchayat', 0, 0, 0.0, 0.0, 'NO_PERMIT', FALSE, NULL),
('UL003', NULL, 'Panchayat', 0, 0, 0.0, 0.0, 'NO_PERMIT', FALSE, NULL),
('UL004', 'BBMP/BP/2021/0451', 'BBMP', 2, 2, 14000.0, 13800.0, 'APPROVED', FALSE, 'Constructed within sanctioned parameters.'),
('UL005', NULL, 'BDA', 0, 0, 0.0, 0.0, 'NO_PERMIT', FALSE, NULL),
('UL006', 'BMA/DEV/2022/90', 'Panchayat', 1, 4, 4000.0, 18000.0, 'APPROVED', TRUE, 'Major floor deviation: 4 floors built vs 1 floor sanctioned in Green Belt.')
ON CONFLICT DO NOTHING;

-- Court Cases
INSERT INTO dept_judiciary.court_cases (ulpin, has_litigation, case_number, court_name, case_type, petitioner, respondent, stay_order_active, case_status, filing_date, next_hearing_date, case_summary)
VALUES
('UL001', FALSE, NULL, NULL, NULL, NULL, NULL, FALSE, 'NO_LITIGATION', NULL, NULL, 'No active litigation.'),
('UL002', FALSE, NULL, NULL, NULL, NULL, NULL, FALSE, 'NO_LITIGATION', NULL, NULL, 'No active litigation.'),
('UL003', TRUE, 'OS No 412/2023', 'City Civil Court, Bengaluru', 'Partition & Title Injunction Suit', 'Manjunath Gowda', 'Ramesh Gowda & Sub-Registrar', TRUE, 'STAY_GRANTED', '2023-04-14', '2026-10-15', 'Stay order operating against alienation or creating third-party rights pending partition of ancestral assets.'),
('UL004', FALSE, NULL, NULL, NULL, NULL, NULL, FALSE, 'NO_LITIGATION', NULL, NULL, 'No active litigation.'),
('UL005', FALSE, NULL, NULL, NULL, NULL, NULL, FALSE, 'NO_LITIGATION', NULL, NULL, 'No active litigation.'),
('UL006', FALSE, NULL, NULL, NULL, NULL, NULL, FALSE, 'NO_LITIGATION', NULL, NULL, 'No active litigation.')
ON CONFLICT DO NOTHING;
