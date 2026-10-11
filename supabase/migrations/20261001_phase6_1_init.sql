-- ============================================================================
-- GULF JOBS PLATFORM (وظائف الخليج) - PHASE 6.1 SUPABASE MIGRATION
-- ============================================================================
-- Complete schema, triggers, automated profile creation, and Row Level Security (RLS)
-- ============================================================================

-- Enable pgcrypto / uuid-ossp for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. PROFILES TABLE (Associated with auth.users)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    display_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('job_seeker', 'employer', 'admin')) DEFAULT 'job_seeker',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Automatic updated_at trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Helper to check if current requesting user is an admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles WHERE id = user_id AND role = 'admin'
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Trigger to prevent regular users from escalating their own role in profiles
CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS trigger AS $$
BEGIN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
        IF NOT public.is_admin(auth.uid()) THEN
            RAISE EXCEPTION 'غير مصرح بتعديل دور المستخدم. ترقية الأدوار تتم فقط بواسطة المشرفين.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_protect_profile_role
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_profile_role();

-- Automatically create a public.profiles row when a user signs up via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, email, display_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'role', 'job_seeker')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if already exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 2. JOB SEEKER PROFILES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.job_seeker_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    country TEXT NOT NULL,
    region TEXT,
    city TEXT,
    target_job_title TEXT NOT NULL,
    specialties JSONB NOT NULL DEFAULT '[]'::jsonb,
    secondary_specialties JSONB DEFAULT '[]'::jsonb,
    education_level TEXT,
    field_of_study TEXT,
    institution TEXT,
    graduation_year INT,
    years_of_experience INT,
    current_job_title TEXT,
    experience_summary TEXT,
    technical_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
    soft_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
    industry_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
    languages JSONB NOT NULL DEFAULT '[]'::jsonb,
    preferred_employment_types JSONB DEFAULT '[]'::jsonb,
    preferred_work_modes JSONB DEFAULT '[]'::jsonb,
    preferred_countries JSONB DEFAULT '[]'::jsonb,
    preferred_regions JSONB DEFAULT '[]'::jsonb,
    preferred_cities JSONB DEFAULT '[]'::jsonb,
    remote_preference TEXT DEFAULT 'flexible',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_jsp_user_id ON public.job_seeker_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_jsp_country_city ON public.job_seeker_profiles(country, city);

CREATE TRIGGER trg_jsp_updated_at
BEFORE UPDATE ON public.job_seeker_profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- 3. COMPANIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    logo TEXT,
    description TEXT NOT NULL,
    website TEXT,
    country TEXT NOT NULL,
    region TEXT,
    city TEXT NOT NULL,
    address TEXT,
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_companies_owner ON public.companies(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_companies_country_city ON public.companies(country, city);

CREATE TRIGGER trg_companies_updated_at
BEFORE UPDATE ON public.companies
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- 4. JOBS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    legacy_id TEXT,
    title TEXT NOT NULL,
    company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    company_name TEXT NOT NULL,
    company_logo TEXT,
    category TEXT,
    country TEXT NOT NULL,
    region TEXT,
    city TEXT NOT NULL,
    district TEXT,
    address TEXT,
    work_mode TEXT NOT NULL CHECK (work_mode IN ('on_site', 'remote', 'hybrid')),
    employment_type TEXT NOT NULL CHECK (employment_type IN ('full_time', 'part_time', 'contract', 'temporary', 'internship')),
    experience_min INT,
    experience_max INT,
    education TEXT,
    salary_min NUMERIC(12, 2),
    salary_max NUMERIC(12, 2),
    salary_currency TEXT DEFAULT 'SAR',
    description TEXT NOT NULL,
    responsibilities JSONB NOT NULL DEFAULT '[]'::jsonb,
    requirements JSONB NOT NULL DEFAULT '[]'::jsonb,
    skills JSONB NOT NULL DEFAULT '[]'::jsonb,
    languages JSONB NOT NULL DEFAULT '[]'::jsonb,
    benefits JSONB NOT NULL DEFAULT '[]'::jsonb,
    application_method TEXT NOT NULL CHECK (application_method IN ('external_url', 'email', 'direct')),
    application_url TEXT,
    source_name TEXT,
    source_url TEXT,
    original_job_url TEXT,
    date_posted TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    valid_through TIMESTAMPTZ,
    status TEXT NOT NULL CHECK (status IN ('draft', 'pending_review', 'published', 'paused', 'expired', 'rejected', 'duplicate')),
    slug TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    imported_at TIMESTAMPTZ,
    last_checked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_jobs_status_date ON public.jobs(status, date_posted DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_country_city ON public.jobs(country, city);
CREATE INDEX IF NOT EXISTS idx_jobs_slug ON public.jobs(slug);
CREATE INDEX IF NOT EXISTS idx_jobs_category ON public.jobs(category);
CREATE INDEX IF NOT EXISTS idx_jobs_company_id ON public.jobs(company_id);

CREATE TRIGGER trg_jobs_updated_at
BEFORE UPDATE ON public.jobs
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- 5. SAVED JOBS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.saved_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_user_saved_job UNIQUE (user_id, job_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_jobs_user ON public.saved_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_jobs_job ON public.saved_jobs(job_id);

-- ============================================================================
-- 6. APPLICATIONS TABLE (Prepared for future ATS)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    applicant_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'shortlisted', 'interview', 'accepted', 'rejected', 'withdrawn')),
    cover_letter TEXT,
    cv_file_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_apps_job ON public.applications(job_id);
CREATE INDEX IF NOT EXISTS idx_apps_user ON public.applications(applicant_user_id);

CREATE TRIGGER trg_apps_updated_at
BEFORE UPDATE ON public.applications
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- 7. CV FILES METADATA TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.cv_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_cv_files_user ON public.cv_files(user_id);

CREATE TRIGGER trg_cv_files_updated_at
BEFORE UPDATE ON public.cv_files
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS across all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_seeker_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cv_files ENABLE ROW LEVEL SECURITY;

-- 8.1 PROFILES POLICIES
CREATE POLICY "Public profiles are readable by authenticated users"
ON public.profiles FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "Admins have full access to profiles"
ON public.profiles FOR ALL
TO authenticated
USING (public.is_admin());

-- 8.2 JOB SEEKER PROFILES POLICIES
CREATE POLICY "Users can view own job seeker profile"
ON public.job_seeker_profiles FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users can create own job seeker profile"
ON public.job_seeker_profiles FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users can update own job seeker profile"
ON public.job_seeker_profiles FOR UPDATE
TO authenticated
USING (user_id = auth.uid() OR public.is_admin())
WITH CHECK (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users can delete own job seeker profile"
ON public.job_seeker_profiles FOR DELETE
TO authenticated
USING (user_id = auth.uid() OR public.is_admin());

-- 8.3 COMPANIES POLICIES
CREATE POLICY "Public can view verified companies"
ON public.companies FOR SELECT
TO authenticated, anon
USING (verified = true OR owner_user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Employers and Admins can create companies"
ON public.companies FOR INSERT
TO authenticated
WITH CHECK (
    public.is_admin() OR
    (owner_user_id = auth.uid() AND (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('employer', 'admin'))
);

CREATE POLICY "Owners and Admins can update companies"
ON public.companies FOR UPDATE
TO authenticated
USING (owner_user_id = auth.uid() OR public.is_admin())
WITH CHECK (owner_user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Admins can delete companies"
ON public.companies FOR DELETE
TO authenticated
USING (public.is_admin());

-- 8.4 JOBS POLICIES
CREATE POLICY "Public can view published and non-expired jobs"
ON public.jobs FOR SELECT
TO authenticated, anon
USING (
    (status = 'published' AND (valid_through IS NULL OR valid_through > timezone('utc'::text, now())))
    OR public.is_admin()
    OR (company_id IN (SELECT id FROM public.companies WHERE owner_user_id = auth.uid()))
);

CREATE POLICY "Admins can create jobs"
ON public.jobs FOR INSERT
TO authenticated
WITH CHECK (
    public.is_admin() OR
    (company_id IN (SELECT id FROM public.companies WHERE owner_user_id = auth.uid()))
);

CREATE POLICY "Admins can update jobs"
ON public.jobs FOR UPDATE
TO authenticated
USING (
    public.is_admin() OR
    (company_id IN (SELECT id FROM public.companies WHERE owner_user_id = auth.uid()))
)
WITH CHECK (
    public.is_admin() OR
    (company_id IN (SELECT id FROM public.companies WHERE owner_user_id = auth.uid()))
);

CREATE POLICY "Admins can delete jobs"
ON public.jobs FOR DELETE
TO authenticated
USING (public.is_admin());

-- 8.5 SAVED JOBS POLICIES
CREATE POLICY "Users can view own saved jobs"
ON public.saved_jobs FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users can insert own saved jobs"
ON public.saved_jobs FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own saved jobs"
ON public.saved_jobs FOR DELETE
TO authenticated
USING (user_id = auth.uid() OR public.is_admin());

-- 8.6 APPLICATIONS POLICIES
CREATE POLICY "Applicants and employers can view applications"
ON public.applications FOR SELECT
TO authenticated
USING (
    applicant_user_id = auth.uid()
    OR (job_id IN (SELECT j.id FROM public.jobs j JOIN public.companies c ON j.company_id = c.id WHERE c.owner_user_id = auth.uid()))
    OR public.is_admin()
);

CREATE POLICY "Applicants can create application"
ON public.applications FOR INSERT
TO authenticated
WITH CHECK (applicant_user_id = auth.uid());

CREATE POLICY "Employers and Admins can update application status"
ON public.applications FOR UPDATE
TO authenticated
USING (
    public.is_admin()
    OR (job_id IN (SELECT j.id FROM public.jobs j JOIN public.companies c ON j.company_id = c.id WHERE c.owner_user_id = auth.uid()))
)
WITH CHECK (
    public.is_admin()
    OR (job_id IN (SELECT j.id FROM public.jobs j JOIN public.companies c ON j.company_id = c.id WHERE c.owner_user_id = auth.uid()))
);

-- 8.7 CV FILES METADATA POLICIES
CREATE POLICY "Owner and Admins can view CV metadata"
ON public.cv_files FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Owner can insert CV metadata"
ON public.cv_files FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Owner can delete CV metadata"
ON public.cv_files FOR DELETE
TO authenticated
USING (user_id = auth.uid() OR public.is_admin());

-- ============================================================================
-- 9. SUPABASE STORAGE BUCKET & POLICIES FOR PRIVATE CVs
-- ============================================================================
-- Create bucket if storage extension is installed
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'private-cvs',
    'private-cvs',
    FALSE,
    5242880, -- 5 MB limit
    ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO UPDATE SET
    public = FALSE,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

-- Storage RLS: Users can only upload, read, and delete their own files in private-cvs
CREATE POLICY "Users can upload their own CV to private-cvs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'private-cvs' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can read their own CV from private-cvs"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'private-cvs' AND
    ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin())
);

CREATE POLICY "Users can delete their own CV from private-cvs"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'private-cvs' AND
    ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin())
);

-- ============================================================================
-- 10. ADMIN PROMOTION UTILITY (Documentation and Function)
-- ============================================================================
-- To promote any user to admin securely from SQL / Supabase SQL Editor:
-- SELECT public.promote_user_to_admin('target_user_email@example.com');
CREATE OR REPLACE FUNCTION public.promote_user_to_admin(target_email TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE public.profiles
    SET role = 'admin'
    WHERE email = target_email;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'المستخدم بالبريد % غير موجود في جدول profiles.', target_email;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
