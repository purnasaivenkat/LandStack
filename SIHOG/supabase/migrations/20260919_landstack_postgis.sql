-- LandStack PostGIS Engine Migration
-- Safe, idempotent schema adaptation without modifying or deleting existing team data

-- 1. Ensure PostGIS extension is enabled
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Safely add all required columns to existing `parcels` table if not present
ALTER TABLE parcels ADD COLUMN IF NOT EXISTS parcel_id VARCHAR(50);
ALTER TABLE parcels ADD COLUMN IF NOT EXISTS ulpin VARCHAR(50);
ALTER TABLE parcels ADD COLUMN IF NOT EXISTS survey_no VARCHAR(50);
ALTER TABLE parcels ADD COLUMN IF NOT EXISTS survey_number VARCHAR(50);
ALTER TABLE parcels ADD COLUMN IF NOT EXISTS area_acres DOUBLE PRECISION;
ALTER TABLE parcels ADD COLUMN IF NOT EXISTS village VARCHAR(255);
ALTER TABLE parcels ADD COLUMN IF NOT EXISTS district VARCHAR(255);
ALTER TABLE parcels ADD COLUMN IF NOT EXISTS state VARCHAR(255);
ALTER TABLE parcels ADD COLUMN IF NOT EXISTS zone_id VARCHAR(50);
ALTER TABLE parcels ADD COLUMN IF NOT EXISTS geometry GEOMETRY(Polygon, 4326);

-- 3. Add Unique constraint on ULPIN if not present (required for idempotent upsert)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'parcels_ulpin_key'
    ) THEN
        ALTER TABLE parcels ADD CONSTRAINT parcels_ulpin_key UNIQUE (ulpin);
    END IF;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- 4. Enable Row Level Security (RLS) on parcels
ALTER TABLE parcels ENABLE ROW LEVEL SECURITY;

-- 5. Strict Security RLS Policies:
-- Allow PUBLIC SELECT access for the frontend map
DROP POLICY IF EXISTS "Allow public select on parcels" ON parcels;
CREATE POLICY "Allow public select on parcels" ON parcels FOR SELECT USING (true);

-- Remove public insert/update policies to prevent unauthorized writes from the frontend.
-- Database seeding and admin scripts will use SUPABASE_SERVICE_ROLE_KEY (bypasses RLS).
DROP POLICY IF EXISTS "Allow public insert on parcels" ON parcels;
DROP POLICY IF EXISTS "Allow public update on parcels" ON parcels;

-- 6. Spatial Indexes (GiST)
CREATE INDEX IF NOT EXISTS parcels_geometry_idx ON parcels USING GIST (geometry);

-- 7. Attribute Indexes for Fast Search
CREATE INDEX IF NOT EXISTS parcels_parcel_id_idx ON parcels (parcel_id);
CREATE INDEX IF NOT EXISTS parcels_ulpin_idx ON parcels (ulpin);
CREATE INDEX IF NOT EXISTS parcels_survey_no_idx ON parcels (survey_no);
CREATE INDEX IF NOT EXISTS parcels_survey_number_idx ON parcels (survey_number);

-- 8. Supporting tables definitions if missing
CREATE TABLE IF NOT EXISTS study_areas (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    village VARCHAR(255) NOT NULL,
    district VARCHAR(255) NOT NULL,
    state VARCHAR(255) NOT NULL,
    country VARCHAR(100) DEFAULT 'India',
    geometry GEOMETRY(Polygon, 4326) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS zones (
    id SERIAL PRIMARY KEY,
    zone_id VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    study_area_name VARCHAR(255) DEFAULT 'Karjat Study Area',
    geometry GEOMETRY(Polygon, 4326) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS buildings (
    id SERIAL PRIMARY KEY,
    building_id VARCHAR(50) NOT NULL UNIQUE,
    parcel_id VARCHAR(50),
    building_type VARCHAR(100) DEFAULT 'Residential',
    area_sq_m DOUBLE PRECISION NOT NULL,
    geometry GEOMETRY(Polygon, 4326) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS roads (
    id SERIAL PRIMARY KEY,
    road_id VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    road_type VARCHAR(100) DEFAULT 'Secondary Road',
    geometry GEOMETRY(LineString, 4326) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS and public SELECT on supporting tables
ALTER TABLE study_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE roads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public select on study_areas" ON study_areas;
CREATE POLICY "Allow public select on study_areas" ON study_areas FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public select on zones" ON zones;
CREATE POLICY "Allow public select on zones" ON zones FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public select on buildings" ON buildings;
CREATE POLICY "Allow public select on buildings" ON buildings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public select on roads" ON roads;
CREATE POLICY "Allow public select on roads" ON roads FOR SELECT USING (true);
