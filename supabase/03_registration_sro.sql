-- ============================================================================
-- LandStack: 03_registration_sro.sql
-- Department: Department of Stamps & Registration (Sub-Registrar Deeds)
-- ============================================================================

DROP TABLE IF EXISTS dept_registration.deeds CASCADE;

CREATE TABLE dept_registration.deeds (
    id SERIAL PRIMARY KEY,
    ulpin VARCHAR(50) NOT NULL REFERENCES dept_gis.parcels(ulpin) ON DELETE CASCADE,
    deed_number VARCHAR(100) NOT NULL UNIQUE,
    registration_date DATE NOT NULL,
    sro_name VARCHAR(100) NOT NULL, -- e.g. "SRO Kengeri"
    party_seller VARCHAR(150) NOT NULL,
    party_buyer VARCHAR(150) NOT NULL,
    consideration_amount NUMERIC(14, 2) NOT NULL, -- Transaction amount in INR
    stamp_duty_paid NUMERIC(14, 2) NOT NULL,
    market_value NUMERIC(14, 2) NOT NULL, -- Government Circle rate / Guideline value
    document_url VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_deeds_ulpin ON dept_registration.deeds (ulpin);
CREATE INDEX IF NOT EXISTS idx_deeds_number ON dept_registration.deeds (deed_number);
