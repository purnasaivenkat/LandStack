-- ============================================================================
-- LandStack: 02_ror_pahani.sql
-- Department: Revenue Dept (Record of Rights / Bhoomi / Pahani / 7/12 Extract)
-- ============================================================================

DROP TABLE IF EXISTS dept_ror.ror_records CASCADE;

CREATE TABLE dept_ror.ror_records (
    id SERIAL PRIMARY KEY,
    ulpin VARCHAR(50) NOT NULL REFERENCES dept_gis.parcels(ulpin) ON DELETE CASCADE,
    khata_number VARCHAR(50) NOT NULL,
    primary_owner VARCHAR(150) NOT NULL,
    father_name VARCHAR(150),
    joint_owners TEXT, -- Comma-separated or JSON list of co-owners
    document_area_acres NUMERIC(10, 2) NOT NULL, -- Statutory area recorded in Pahani
    land_type VARCHAR(50) NOT NULL DEFAULT 'Dry Crop', -- Dry, Wet, Garden, Commercial
    soil_type VARCHAR(50),
    mutation_number VARCHAR(50),
    mutated_date DATE,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ror_ulpin ON dept_ror.ror_records (ulpin);
CREATE INDEX IF NOT EXISTS idx_ror_owner ON dept_ror.ror_records (primary_owner);
CREATE INDEX IF NOT EXISTS idx_ror_khata ON dept_ror.ror_records (khata_number);
