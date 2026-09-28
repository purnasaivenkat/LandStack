-- ============================================================================
-- LandStack: 08_judiciary_court_cases.sql
-- Department: Judiciary & Civil Courts (e-Courts / High Court of Karnataka)
-- ============================================================================

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
    case_number VARCHAR(100), -- e.g. "OS No 412/2023"
    court_name VARCHAR(150), -- e.g. "City Civil Court, Bengaluru"
    case_type VARCHAR(100), -- "Partition Suit", "Title Dispute", "Injunction"
    petitioner VARCHAR(150),
    respondent VARCHAR(150),
    stay_order_active BOOLEAN NOT NULL DEFAULT FALSE, -- Freezes alienation
    case_status dept_judiciary.case_status_enum NOT NULL DEFAULT 'NO_LITIGATION',
    filing_date DATE,
    next_hearing_date DATE,
    case_summary TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_court_ulpin ON dept_judiciary.court_cases (ulpin);
CREATE INDEX IF NOT EXISTS idx_court_stay ON dept_judiciary.court_cases (stay_order_active);
CREATE INDEX IF NOT EXISTS idx_court_status ON dept_judiciary.court_cases (case_status);
