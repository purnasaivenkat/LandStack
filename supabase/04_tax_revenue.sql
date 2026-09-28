-- ============================================================================
-- LandStack: 04_tax_revenue.sql
-- Department: Municipal Revenue & Property Tax Department
-- ============================================================================

DROP TYPE IF EXISTS dept_tax.tax_status_enum CASCADE;
CREATE TYPE dept_tax.tax_status_enum AS ENUM ('PAID', 'PARTIAL', 'DUE', 'DEFAULTED');

DROP TABLE IF EXISTS dept_tax.property_tax CASCADE;

CREATE TABLE dept_tax.property_tax (
    id SERIAL PRIMARY KEY,
    ulpin VARCHAR(50) NOT NULL REFERENCES dept_gis.parcels(ulpin) ON DELETE CASCADE,
    assessment_year VARCHAR(20) NOT NULL, -- e.g. "2024-2025"
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
CREATE INDEX IF NOT EXISTS idx_tax_status ON dept_tax.property_tax (payment_status);
