-- ============================================================================
-- LandStack: 05_encumbrance_banking.sql
-- Department: Banking & Encumbrance (EC / Central Registry / Liens)
-- ============================================================================

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
CREATE INDEX IF NOT EXISTS idx_encumbrance_status ON dept_banking.encumbrances (status);
