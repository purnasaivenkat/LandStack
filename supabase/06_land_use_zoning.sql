-- ============================================================================
-- LandStack: 06_land_use_zoning.sql
-- Department: Urban Development Authority / Master Plan Zoning
-- ============================================================================

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
    is_converted BOOLEAN NOT NULL DEFAULT FALSE, -- Non-Agricultural DC Conversion
    conversion_order_no VARCHAR(100),
    conversion_date DATE,
    zoning_authority VARCHAR(100) NOT NULL DEFAULT 'BMRDA / BDA',
    flood_zone_risk VARCHAR(50) DEFAULT 'LOW',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_landuse_ulpin ON dept_urban_plan.land_use (ulpin);
CREATE INDEX IF NOT EXISTS idx_landuse_zone ON dept_urban_plan.land_use (master_plan_zone);
