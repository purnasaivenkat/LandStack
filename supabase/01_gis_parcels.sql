-- ============================================================================
-- LandStack: 01_gis_parcels.sql
-- Department: Survey Settlement and Land Records (GIS)
-- ============================================================================

DROP TABLE IF EXISTS dept_gis.parcels CASCADE;

CREATE TABLE dept_gis.parcels (
    ulpin VARCHAR(50) PRIMARY KEY, -- Unique Land Parcel Identification Number
    state VARCHAR(100) NOT NULL DEFAULT 'Karnataka',
    district VARCHAR(100) NOT NULL DEFAULT 'Bengaluru Urban',
    taluk VARCHAR(100) NOT NULL DEFAULT 'Bengaluru South',
    village VARCHAR(100) NOT NULL DEFAULT 'Kengeri',
    survey_number VARCHAR(50) NOT NULL,
    sub_division VARCHAR(50),
    gis_area_acres NUMERIC(10, 2) NOT NULL, -- Physical acreage computed from GIS polygon
    centroid_lat NUMERIC(10, 6),
    centroid_lng NUMERIC(10, 6),
    geometry_geojson TEXT,
    geom geometry(Polygon, 4326), -- PostGIS Spatial Geometry in WGS 84
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_parcels_survey ON dept_gis.parcels (survey_number);
CREATE INDEX IF NOT EXISTS idx_parcels_village ON dept_gis.parcels (village);
CREATE INDEX IF NOT EXISTS idx_parcels_geom ON dept_gis.parcels USING GIST (geom);
