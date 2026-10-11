/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ============================================================================
 * NORMALIZED PRODUCTION DATABASE SCHEMA (PHASE 6)
 * ============================================================================
 * Full production data model definition with PostgreSQL / Cloud SQL DDL,
 * indexes, foreign key constraints, and JSON-ready interfaces.
 */

export const POSTGRES_SCHEMA_SQL = `
-- ============================================================================
-- GULF JOBS PLATFORM (وظائف الخليج) - PRODUCTION RELATIONAL SCHEMA (POSTGRESQL)
-- ============================================================================

-- Enable UUID extension if supported
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    display_name VARCHAR(120) NOT NULL,
    role VARCHAR(32) NOT NULL CHECK (role IN ('job_seeker', 'employer', 'admin')),
    password_hash VARCHAR(255) NOT NULL,
    password_salt VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 2. JOB SEEKER PROFILES TABLE
CREATE TABLE IF NOT EXISTS job_seeker_profiles (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(150) NOT NULL,
    country VARCHAR(100) NOT NULL,
    region VARCHAR(100),
    city VARCHAR(100),
    target_job_title VARCHAR(150) NOT NULL,
    specialties JSONB NOT NULL DEFAULT '[]',
    education JSONB,
    experience JSONB,
    skills JSONB NOT NULL DEFAULT '[]',
    languages JSONB NOT NULL DEFAULT '[]',
    preferences JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON job_seeker_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_country_city ON job_seeker_profiles(country, city);

-- 3. COMPANIES TABLE
CREATE TABLE IF NOT EXISTS companies (
    id VARCHAR(64) PRIMARY KEY,
    owner_user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    name VARCHAR(200) NOT NULL,
    logo TEXT,
    description TEXT NOT NULL,
    website VARCHAR(255),
    country VARCHAR(100) NOT NULL,
    region VARCHAR(100),
    city VARCHAR(100) NOT NULL,
    address TEXT,
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_companies_owner ON companies(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_companies_country ON companies(country);

-- 4. JOBS TABLE
CREATE TABLE IF NOT EXISTS jobs (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    company_id VARCHAR(64) REFERENCES companies(id) ON DELETE SET NULL,
    company_name VARCHAR(200) NOT NULL,
    company_logo TEXT,
    category VARCHAR(80),
    country VARCHAR(100) NOT NULL,
    region VARCHAR(100),
    city VARCHAR(100) NOT NULL,
    district VARCHAR(100),
    address TEXT,
    work_mode VARCHAR(32) NOT NULL CHECK (work_mode IN ('on_site', 'remote', 'hybrid')),
    employment_type VARCHAR(32) NOT NULL CHECK (employment_type IN ('full_time', 'part_time', 'contract', 'temporary', 'internship')),
    experience_min INT,
    experience_max INT,
    education VARCHAR(100),
    salary_min NUMERIC(12, 2),
    salary_max NUMERIC(12, 2),
    salary_currency VARCHAR(8) DEFAULT 'SAR',
    description TEXT NOT NULL,
    responsibilities JSONB NOT NULL DEFAULT '[]',
    requirements JSONB NOT NULL DEFAULT '[]',
    skills JSONB NOT NULL DEFAULT '[]',
    languages JSONB NOT NULL DEFAULT '[]',
    benefits JSONB NOT NULL DEFAULT '[]',
    application_method VARCHAR(32) NOT NULL CHECK (application_method IN ('external_url', 'email', 'direct')),
    application_url TEXT,
    source_name VARCHAR(120),
    source_url TEXT,
    original_job_url TEXT,
    date_posted TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    valid_through TIMESTAMPTZ,
    status VARCHAR(32) NOT NULL CHECK (status IN ('draft', 'pending_review', 'published', 'paused', 'expired', 'rejected', 'duplicate')),
    slug VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    imported_at TIMESTAMPTZ,
    last_checked_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_jobs_status_date ON jobs(status, date_posted DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_country_city ON jobs(country, city);
CREATE INDEX IF NOT EXISTS idx_jobs_slug ON jobs(slug);
CREATE INDEX IF NOT EXISTS idx_jobs_category ON jobs(category);

-- 5. SAVED JOBS TABLE
CREATE TABLE IF NOT EXISTS saved_jobs (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id VARCHAR(64) NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_saved_job UNIQUE (user_id, job_id)
);
CREATE INDEX IF NOT EXISTS idx_saved_jobs_user ON saved_jobs(user_id);

-- 6. APPLICATIONS TABLE
CREATE TABLE IF NOT EXISTS applications (
    id VARCHAR(64) PRIMARY KEY,
    job_id VARCHAR(64) NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    applicant_user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(32) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'shortlisted', 'interview', 'accepted', 'rejected', 'withdrawn')),
    cover_letter TEXT,
    cv_file_id VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_apps_job ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_apps_user ON applications(applicant_user_id);

-- 7. CV FILES METADATA TABLE
CREATE TABLE IF NOT EXISTS cv_files (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    storage_path VARCHAR(512) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_cv_files_user ON cv_files(user_id);

-- 8. AUTH SESSIONS TABLE
CREATE TABLE IF NOT EXISTS auth_sessions (
    token VARCHAR(128) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON auth_sessions(user_id);
`;
