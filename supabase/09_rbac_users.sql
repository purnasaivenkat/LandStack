-- ============================================================================
-- LandStack: 09_rbac_users.sql
-- Department: LandStack Auth & Role-Based Access Control
-- ============================================================================

DROP TYPE IF EXISTS dept_auth.user_role_enum CASCADE;
CREATE TYPE dept_auth.user_role_enum AS ENUM ('CITIZEN', 'OFFICER', 'ADMIN');

DROP TABLE IF EXISTS dept_auth.users CASCADE;

CREATE TABLE dept_auth.users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role dept_auth.user_role_enum NOT NULL DEFAULT 'CITIZEN',
    department VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_username ON dept_auth.users (username);
CREATE INDEX IF NOT EXISTS idx_users_role ON dept_auth.users (role);
