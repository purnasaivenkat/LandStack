-- ============================================================================
-- LandStack: public_schema_setup.sql (DEFAULT PUBLIC SCHEMA FOR SUPABASE TABLE EDITOR)
-- Run this in Supabase SQL Editor to make all tables show up directly in the default Table Editor!
-- Project: slrjtctvyhhbwwcgomcy
-- ============================================================================

-- 1. Enable PostGIS Extension
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Drop existing tables if re-running
DROP TABLE IF EXISTS court_cases CASCADE;
DROP TABLE IF EXISTS building_permits CASCADE;
DROP TABLE IF EXISTS land_use CASCADE;
DROP TABLE IF EXISTS encumbrances CASCADE;
DROP TABLE IF EXISTS property_tax CASCADE;
DROP TABLE IF EXISTS deeds CASCADE;
DROP TABLE IF EXISTS ror_records CASCADE;
DROP TABLE IF EXISTS parcels CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 3. Core Department Tables in public schema

-- Users (RBAC)
DROP TYPE IF EXISTS user_role_enum CASCADE;
CREATE TYPE user_role_enum AS ENUM ('CITIZEN', 'OFFICER', 'ADMIN');

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role user_role_enum NOT NULL DEFAULT 'CITIZEN',
    department VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- GIS Parcels Table
CREATE TABLE parcels (
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
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Revenue Department (Record of Rights / Pahani)
CREATE TABLE ror_records (
    id SERIAL PRIMARY KEY,
    ulpin VARCHAR(50) NOT NULL REFERENCES parcels(ulpin) ON DELETE CASCADE,
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

-- Registration Department (Sub-Registrar Deeds)
CREATE TABLE deeds (
    id SERIAL PRIMARY KEY,
    ulpin VARCHAR(50) NOT NULL REFERENCES parcels(ulpin) ON DELETE CASCADE,
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

-- Property Tax Department
DROP TYPE IF EXISTS tax_status_enum CASCADE;
CREATE TYPE tax_status_enum AS ENUM ('PAID', 'PARTIAL', 'DUE', 'DEFAULTED');

CREATE TABLE property_tax (
    id SERIAL PRIMARY KEY,
    ulpin VARCHAR(50) NOT NULL REFERENCES parcels(ulpin) ON DELETE CASCADE,
    assessment_year VARCHAR(20) NOT NULL,
    property_tax_due NUMERIC(12, 2) NOT NULL DEFAULT 0.0,
    cess_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.0,
    penalties NUMERIC(12, 2) NOT NULL DEFAULT 0.0,
    total_paid NUMERIC(12, 2) NOT NULL DEFAULT 0.0,
    payment_status tax_status_enum NOT NULL DEFAULT 'PAID',
    last_payment_date DATE,
    receipt_number VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Banking & Encumbrances (EC / Mortgages)
DROP TYPE IF EXISTS encumbrance_status_enum CASCADE;
CREATE TYPE encumbrance_status_enum AS ENUM ('NONE', 'ACTIVE', 'RELEASED');

CREATE TABLE encumbrances (
    id SERIAL PRIMARY KEY,
    ulpin VARCHAR(50) NOT NULL REFERENCES parcels(ulpin) ON DELETE CASCADE,
    has_encumbrance BOOLEAN NOT NULL DEFAULT FALSE,
    bank_name VARCHAR(150),
    loan_account_no VARCHAR(100),
    mortgage_amount NUMERIC(14, 2) DEFAULT 0.0,
    date_of_mortgage DATE,
    status encumbrance_status_enum NOT NULL DEFAULT 'NONE',
    ec_certificate_number VARCHAR(100),
    period_from DATE,
    period_to DATE,
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Urban Planning (Master Plan Zoning & CLU)
DROP TYPE IF EXISTS zone_type_enum CASCADE;
CREATE TYPE zone_type_enum AS ENUM (
    'AGRICULTURAL',
    'RESIDENTIAL',
    'COMMERCIAL',
    'INDUSTRIAL',
    'GREEN_BELT',
    'PUBLIC_UTILITY'
);

CREATE TABLE land_use (
    id SERIAL PRIMARY KEY,
    ulpin VARCHAR(50) NOT NULL REFERENCES parcels(ulpin) ON DELETE CASCADE,
    master_plan_zone zone_type_enum NOT NULL DEFAULT 'AGRICULTURAL',
    current_usage VARCHAR(100) NOT NULL,
    is_converted BOOLEAN NOT NULL DEFAULT FALSE,
    conversion_order_no VARCHAR(100),
    conversion_date DATE,
    zoning_authority VARCHAR(100) NOT NULL DEFAULT 'BMRDA / BDA',
    flood_zone_risk VARCHAR(50) DEFAULT 'LOW',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Municipal Building Permits
DROP TYPE IF EXISTS permit_status_enum CASCADE;
CREATE TYPE permit_status_enum AS ENUM (
    'APPROVED',
    'PENDING',
    'REJECTED',
    'NO_PERMIT',
    'REVOKED'
);

CREATE TABLE building_permits (
    id SERIAL PRIMARY KEY,
    ulpin VARCHAR(50) NOT NULL REFERENCES parcels(ulpin) ON DELETE CASCADE,
    permit_number VARCHAR(100),
    sanctioning_authority VARCHAR(100) NOT NULL DEFAULT 'BBMP / BDA',
    sanctioned_floors INTEGER DEFAULT 0,
    actual_floors INTEGER DEFAULT 0,
    sanctioned_builtup_area_sqft NUMERIC(12, 2) DEFAULT 0.0,
    actual_builtup_area_sqft NUMERIC(12, 2) DEFAULT 0.0,
    approval_status permit_status_enum NOT NULL DEFAULT 'NO_PERMIT',
    approval_date DATE,
    expiry_date DATE,
    occupancy_certificate_issued BOOLEAN DEFAULT FALSE,
    deviation_detected BOOLEAN DEFAULT FALSE,
    violation_remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Judiciary Court Cases (Litigation & Stay Orders)
DROP TYPE IF EXISTS case_status_enum CASCADE;
CREATE TYPE case_status_enum AS ENUM (
    'PENDING',
    'STAY_GRANTED',
    'DISPOSED_FAVOURABLE',
    'DISPOSED_DISMISSED',
    'NO_LITIGATION'
);

CREATE TABLE court_cases (
    id SERIAL PRIMARY KEY,
    ulpin VARCHAR(50) NOT NULL REFERENCES parcels(ulpin) ON DELETE CASCADE,
    has_litigation BOOLEAN NOT NULL DEFAULT FALSE,
    case_number VARCHAR(100),
    court_name VARCHAR(150),
    case_type VARCHAR(100),
    petitioner VARCHAR(150),
    respondent VARCHAR(150),
    stay_order_active BOOLEAN NOT NULL DEFAULT FALSE,
    case_status case_status_enum NOT NULL DEFAULT 'NO_LITIGATION',
    filing_date DATE,
    next_hearing_date DATE,
    case_summary TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. Seed Mock Data (UL001 - UL006)

-- Users
INSERT INTO users (username, email, hashed_password, full_name, role, department)
VALUES
('citizen', 'citizen@landstack.gov.in', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'Purna Sai (Citizen)', 'CITIZEN', 'Public Citizen'),
('officer', 'officer@landstack.gov.in', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'Dr. K. Ananth (Revenue Inspector)', 'OFFICER', 'Dept of Survey Settlement & Land Records'),
('admin', 'admin@landstack.gov.in', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'System Administrator', 'ADMIN', 'LandStack Core Tech Team')
ON CONFLICT (username) DO NOTHING;

-- Parcels
INSERT INTO parcels (ulpin, survey_number, sub_division, gis_area_acres, centroid_lat, centroid_lng, geometry_geojson)
VALUES
('UL001', '104/1', 'A', 3.20, 12.9125, 77.4850, '{"type":"Polygon","coordinates":[[[77.484,12.911],[77.486,12.911],[77.486,12.914],[77.484,12.914],[77.484,12.911]]]}'),
('UL002', '104/2', 'B', 3.20, 12.9135, 77.4870, '{"type":"Polygon","coordinates":[[[77.486,12.911],[77.488,12.911],[77.488,12.915],[77.486,12.915],[77.486,12.911]]]}'),
('UL003', '105', '1', 4.50, 12.9150, 77.4900, '{"type":"Polygon","coordinates":[[[77.489,12.913],[77.492,12.913],[77.492,12.917],[77.489,12.917],[77.489,12.913]]]}'),
('UL004', '106/1', 'C', 1.50, 12.9180, 77.4930, '{"type":"Polygon","coordinates":[[[77.491,12.916],[77.494,12.916],[77.494,12.919],[77.491,12.919],[77.491,12.916]]]}'),
('UL005', '107', '2', 2.10, 12.9210, 77.4960, '{"type":"Polygon","coordinates":[[[77.494,12.919],[77.498,12.919],[77.498,12.923],[77.494,12.923],[77.494,12.919]]]}'),
('UL006', '108', 'A', 1.80, 12.9230, 77.4990, '{"type":"Polygon","coordinates":[[[77.497,12.921],[77.501,12.921],[77.501,12.925],[77.497,12.925],[77.497,12.921]]]}')
ON CONFLICT (ulpin) DO NOTHING;

-- RoR Records (UL002 has Area Mismatch: GIS 3.20 vs RoR 2.80)
INSERT INTO ror_records (ulpin, khata_number, primary_owner, father_name, joint_owners, document_area_acres, land_type, mutation_number, mutated_date)
VALUES
('UL001', 'KH-2021-8901', 'Ravi Kumar', 'Muniswamy Gowda', NULL, 3.20, 'Dry Crop', 'MR-2018-0912', '2018-06-15'),
('UL002', 'KH-2020-5621', 'Smt. Lakshmi Devi', 'W/o Venkataraman', 'Anand V, Deepa V', 2.80, 'Garden Land', 'MR-2015-1102', '2015-09-20'),
('UL003', 'KH-2019-3312', 'Ramesh Gowda', 'Late Byregowda', 'Suresh Gowda, Manjunath Gowda', 4.50, 'Dry', 'MR-2019-0418', '2019-03-10'),
('UL004', 'KH-2022-7719', 'Venkatesh Prasad', 'Rama Rao', NULL, 1.50, 'Converted Commercial', 'MR-2021-0819', '2021-07-22'),
('UL005', 'KH-2018-9940', 'Anand Rao', 'K. N. Rao', NULL, 2.10, 'Dry', 'MR-2014-0312', '2014-04-10'),
('UL006', 'KH-2021-4431', 'Horizon Logistics LLP', 'Rep by Partner M. Jain', NULL, 1.80, 'Dry', 'MR-2021-1209', '2021-11-15')
ON CONFLICT DO NOTHING;

-- Deeds
INSERT INTO deeds (ulpin, deed_number, registration_date, sro_name, party_seller, party_buyer, consideration_amount, stamp_duty_paid, market_value)
VALUES
('UL001', 'DEED-BNG-2018-4412', '2018-05-10', 'SRO Kengeri', 'Krishnappa Gowda', 'Ravi Kumar', 4500000.0, 270000.0, 4800000.0),
('UL002', 'DEED-BNG-2015-1823', '2015-08-14', 'SRO Kengeri', 'Narayan Swamy', 'Smt. Lakshmi Devi', 3800000.0, 228000.0, 4100000.0),
('UL003', 'DEED-BNG-2019-9941', '2019-02-28', 'SRO Kengeri', 'Byregowda Heirs', 'Ramesh Gowda', 7200000.0, 432000.0, 7500000.0),
('UL004', 'DEED-BNG-2021-6541', '2021-06-18', 'SRO Kengeri', 'Devraj Developers', 'Venkatesh Prasad', 12500000.0, 750000.0, 13000000.0),
('UL005', 'DEED-BNG-2014-4112', '2014-03-22', 'SRO Kengeri', 'Prakash Developers', 'Anand Rao', 3500000.0, 210000.0, 3600000.0),
('UL006', 'DEED-BNG-2021-9988', '2021-11-15', 'SRO Kengeri', 'Chennappa Heirs', 'Horizon Logistics LLP', 9500000.0, 570000.0, 10000000.0)
ON CONFLICT DO NOTHING;

-- Property Tax (UL005 is Tax Defaulter)
INSERT INTO property_tax (ulpin, assessment_year, property_tax_due, cess_amount, penalties, total_paid, payment_status, last_payment_date, receipt_number)
VALUES
('UL001', '2024-2025', 4500.0, 450.0, 0.0, 4950.0, 'PAID', '2024-04-12', 'TAX-REC-2024-0981'),
('UL002', '2024-2025', 5200.0, 520.0, 0.0, 5720.0, 'PAID', '2024-05-19', 'TAX-REC-2024-1184'),
('UL003', '2024-2025', 6800.0, 680.0, 0.0, 7480.0, 'PAID', '2024-03-30', 'TAX-REC-2024-2201'),
('UL004', '2024-2025', 18500.0, 1850.0, 0.0, 20350.0, 'PAID', '2024-04-05', 'TAX-REC-2024-3310'),
('UL005', '2024-2025', 65000.0, 6500.0, 6500.0, 0.0, 'DEFAULTED', NULL, NULL),
('UL006', '2024-2025', 12000.0, 1200.0, 0.0, 13200.0, 'PAID', '2024-06-11', 'TAX-REC-2024-4421')
ON CONFLICT DO NOTHING;

-- Encumbrances (UL004 has active SBI ₹4.5 Crore Mortgage)
INSERT INTO encumbrances (ulpin, has_encumbrance, bank_name, loan_account_no, mortgage_amount, date_of_mortgage, status, ec_certificate_number, remarks)
VALUES
('UL001', FALSE, NULL, NULL, 0.0, NULL, 'NONE', 'EC-KNG-2024-5541', 'Nil Encumbrance Certificate issued.'),
('UL002', FALSE, NULL, NULL, 0.0, NULL, 'NONE', 'EC-KNG-2024-6623', 'Nil Encumbrance'),
('UL003', FALSE, NULL, NULL, 0.0, NULL, 'NONE', 'EC-KNG-2024-7712', 'Title dispute reported in court.'),
('UL004', TRUE, 'State Bank of India (Commercial Branch)', 'SBI-TERM-89912049', 45000000.0, '2022-01-15', 'ACTIVE', 'EC-KNG-2024-9912', 'Active simple mortgage in favor of State Bank of India.'),
('UL005', FALSE, NULL, NULL, 0.0, NULL, 'NONE', 'EC-KNG-2024-1109', 'Nil Encumbrance'),
('UL006', FALSE, NULL, NULL, 0.0, NULL, 'NONE', 'EC-KNG-2024-3321', 'Nil Encumbrance')
ON CONFLICT DO NOTHING;

-- Land Use (UL006 has Green Belt unauthorized conversion)
INSERT INTO land_use (ulpin, master_plan_zone, current_usage, is_converted, conversion_order_no, conversion_date, zoning_authority)
VALUES
('UL001', 'AGRICULTURAL', 'Paddy & Ragi Cultivation', FALSE, NULL, NULL, 'BMRDA'),
('UL002', 'AGRICULTURAL', 'Arecanut & Coconut Plantation', FALSE, NULL, NULL, 'BMRDA'),
('UL003', 'AGRICULTURAL', 'Fallow / Disputed Land', FALSE, NULL, NULL, 'BMRDA'),
('UL004', 'COMMERCIAL', 'Commercial Auto Showroom', TRUE, 'DC/REV/CLU/2021/892', '2021-04-12', 'BDA'),
('UL005', 'RESIDENTIAL', 'Vacant Plot Layout', TRUE, 'DC/CLU/2016/401', '2016-08-19', 'BDA'),
('UL006', 'GREEN_BELT', 'Commercial Logistics Hub & Heavy Warehouse', FALSE, NULL, NULL, 'BMRDA')
ON CONFLICT DO NOTHING;

-- Building Permits (UL006 has 4 floors actual vs 1 sanctioned)
INSERT INTO building_permits (ulpin, permit_number, sanctioning_authority, sanctioned_floors, actual_floors, sanctioned_builtup_area_sqft, actual_builtup_area_sqft, approval_status, deviation_detected, violation_remarks)
VALUES
('UL001', NULL, 'Panchayat', 0, 0, 0.0, 0.0, 'NO_PERMIT', FALSE, NULL),
('UL002', NULL, 'Panchayat', 0, 0, 0.0, 0.0, 'NO_PERMIT', FALSE, NULL),
('UL003', NULL, 'Panchayat', 0, 0, 0.0, 0.0, 'NO_PERMIT', FALSE, NULL),
('UL004', 'BBMP/BP/2021/0451', 'BBMP', 2, 2, 14000.0, 13800.0, 'APPROVED', FALSE, 'Constructed within sanctioned parameters.'),
('UL005', NULL, 'BDA', 0, 0, 0.0, 0.0, 'NO_PERMIT', FALSE, NULL),
('UL006', 'BMA/DEV/2022/90', 'Panchayat', 1, 4, 4000.0, 18000.0, 'APPROVED', TRUE, 'Major floor deviation: 4 floors built vs 1 floor sanctioned in Green Belt.')
ON CONFLICT DO NOTHING;

-- Court Cases (UL003 has Active Judicial Injunction & Stay Order)
INSERT INTO court_cases (ulpin, has_litigation, case_number, court_name, case_type, petitioner, respondent, stay_order_active, case_status, filing_date, next_hearing_date, case_summary)
VALUES
('UL001', FALSE, NULL, NULL, NULL, NULL, NULL, FALSE, 'NO_LITIGATION', NULL, NULL, 'No active litigation.'),
('UL002', FALSE, NULL, NULL, NULL, NULL, NULL, FALSE, 'NO_LITIGATION', NULL, NULL, 'No active litigation.'),
('UL003', TRUE, 'OS No 412/2023', 'City Civil Court, Bengaluru', 'Partition & Title Injunction Suit', 'Manjunath Gowda', 'Ramesh Gowda & Sub-Registrar', TRUE, 'STAY_GRANTED', '2023-04-14', '2026-10-15', 'Stay order operating against alienation or creating third-party rights pending partition of ancestral assets.'),
('UL004', FALSE, NULL, NULL, NULL, NULL, NULL, FALSE, 'NO_LITIGATION', NULL, NULL, 'No active litigation.'),
('UL005', FALSE, NULL, NULL, NULL, NULL, NULL, FALSE, 'NO_LITIGATION', NULL, NULL, 'No active litigation.'),
('UL006', FALSE, NULL, NULL, NULL, NULL, NULL, FALSE, 'NO_LITIGATION', NULL, NULL, 'No active litigation.')
ON CONFLICT DO NOTHING;
