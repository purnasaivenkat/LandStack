-- ============================================================================
-- LandStack: 07_building_permits.sql
-- Department: Municipal Corporation Building Permits (BBMP / Town Planning)
-- ============================================================================

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
    deviation_detected BOOLEAN DEFAULT FALSE, -- Violation flag
    violation_remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_permits_ulpin ON dept_municipal.building_permits (ulpin);
CREATE INDEX IF NOT EXISTS idx_permits_status ON dept_municipal.building_permits (approval_status);
