/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ============================================================================
 * PRODUCTION PROFILE REPOSITORY IMPLEMENTATION (PHASE 6)
 * ============================================================================
 * Manages user-bound job seeker profiles with ownership authorization,
 * backend validation, and legacy profile migration.
 */

import { IProfileRepository } from './IProfileRepository';
import { JobSeekerProfile, ProfileCompletionMetrics } from '../types/profile';
import { User } from '../types/auth';
import { calculateProfileCompletion, SAMPLE_PROFILE } from '../data/sampleProfile';
import { validateProfileBackend } from '../lib/validation/profileValidation';
import { RbacPolicy } from '../lib/security/rbac';
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase/client';

const PROD_PROFILES_STORAGE_KEY = 'gulf_jobs_prod_profiles_v1';
const LEGACY_PROFILE_KEY = 'gulf_jobs_dev_profile_v3';

function mapDbRowToProfile(row: any): JobSeekerProfile {
  return {
    id: row.id,
    userId: row.user_id,
    fullName: row.full_name,
    country: row.country,
    region: row.region ?? null,
    city: row.city ?? null,
    targetJobTitle: row.target_job_title,
    specialties: row.specialties || [],
    secondarySpecialties: row.secondary_specialties || [],
    educationLevel: row.education_level ?? null,
    fieldOfStudy: row.field_of_study ?? null,
    institution: row.institution ?? null,
    graduationYear: row.graduation_year ?? null,
    yearsOfExperience: row.years_of_experience ?? null,
    currentJobTitle: row.current_job_title ?? null,
    experienceSummary: row.experience_summary ?? null,
    technicalSkills: row.technical_skills || [],
    softSkills: row.soft_skills || [],
    industrySkills: row.industry_skills || [],
    languages: row.languages || [],
    preferredEmploymentTypes: row.preferred_employment_types || [],
    preferredWorkModes: row.preferred_work_modes || [],
    preferredCountries: row.preferred_countries || [],
    preferredRegions: row.preferred_regions || [],
    preferredCities: row.preferred_cities || [],
    remotePreference: row.remote_preference || 'flexible',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapProfileToDbRow(profile: JobSeekerProfile, userId: string) {
  return {
    user_id: userId,
    full_name: profile.fullName,
    country: profile.country,
    region: profile.region,
    city: profile.city,
    target_job_title: profile.targetJobTitle,
    specialties: profile.specialties,
    secondary_specialties: profile.secondarySpecialties,
    education_level: profile.educationLevel,
    field_of_study: profile.fieldOfStudy,
    institution: profile.institution,
    graduation_year: profile.graduationYear,
    years_of_experience: profile.yearsOfExperience,
    current_job_title: profile.currentJobTitle,
    experience_summary: profile.experienceSummary,
    technical_skills: profile.technicalSkills,
    soft_skills: profile.softSkills,
    industry_skills: profile.industrySkills,
    languages: profile.languages,
    preferred_employment_types: profile.preferredEmploymentTypes,
    preferred_work_modes: profile.preferredWorkModes,
    preferred_countries: profile.preferredCountries,
    preferred_regions: profile.preferredRegions,
    preferred_cities: profile.preferredCities,
    remote_preference: profile.remotePreference,
  };
}

export class ProductionProfileRepository implements IProfileRepository {
  private profiles: Map<string, JobSeekerProfile> = new Map();
  private initialized = false;

  constructor() {
    this.init();
  }

  private init(): void {
    if (this.initialized) return;

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const raw = window.localStorage.getItem(PROD_PROFILES_STORAGE_KEY);
        if (raw) {
          const parsed: JobSeekerProfile[] = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            parsed.forEach((p) => this.profiles.set(p.userId || p.id, p));
          }
        }

        // Migrate legacy profile if present and not yet in prod
        const legacyRaw = window.localStorage.getItem(LEGACY_PROFILE_KEY);
        if (legacyRaw && this.profiles.size === 0) {
          const legacyParsed = JSON.parse(legacyRaw);
          if (legacyParsed && legacyParsed.id) {
            const migrated: JobSeekerProfile = {
              ...legacyParsed,
              userId: legacyParsed.userId || 'user-seeker-001',
            };
            this.profiles.set(migrated.userId!, migrated);
            this.persist();
          }
        }
      } catch (e) {
        console.warn('Failed to load profiles from persistence', e);
      }
    }

    if (this.profiles.size === 0) {
      // Seed default sample profile bound to user-seeker-001
      const sample = {
        ...SAMPLE_PROFILE,
        userId: 'user-seeker-001',
      };
      this.profiles.set('user-seeker-001', sample);
      this.persist();
    }

    this.initialized = true;
  }

  private persist(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const list = Array.from(this.profiles.values());
        window.localStorage.setItem(PROD_PROFILES_STORAGE_KEY, JSON.stringify(list));
      } catch (e) {
        console.warn('Failed to persist profiles', e);
      }
    }
  }

  async getProfile(userId?: string): Promise<JobSeekerProfile | null> {
    this.init();

    // Supabase query if configured
    const client = getSupabaseClient();
    if (client && isSupabaseConfigured() && userId) {
      try {
        const { data, error } = await client
          .from('job_seeker_profiles')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (!error && data) {
          const mapped = mapDbRowToProfile(data);
          this.profiles.set(userId, mapped);
          this.persist();
          return mapped;
        }
      } catch (err) {
        console.warn('Supabase getProfile sync notice:', err);
      }
    }

    if (!userId) {
      // If no specific userId given, return first profile or default sample
      const first = Array.from(this.profiles.values())[0];
      return first ? { ...first } : null;
    }
    const found = this.profiles.get(userId);
    return found ? { ...found } : null;
  }

  async saveProfile(
    profileData: Partial<JobSeekerProfile>,
    user?: User | null
  ): Promise<JobSeekerProfile> {
    this.init();

    const targetUserId = user?.id || profileData.userId || 'user-seeker-001';

    // 1. RBAC ownership check
    if (user) {
      const auth = RbacPolicy.canManageProfile(user, targetUserId);
      if (!auth.allowed) {
        throw new Error(auth.reasonAr || 'غير مصرح لك بتعديل هذا الملف.');
      }
    }

    // 2. Backend validation
    const validation = validateProfileBackend(profileData);
    if (!validation.isValid) {
      throw new Error(`خطأ في التحقق من الملف الشخصي: ${validation.errors.join(' | ')}`);
    }

    const existing = this.profiles.get(targetUserId);
    const now = new Date().toISOString();

    const merged: JobSeekerProfile = {
      id: existing?.id || `prof-${Date.now()}`,
      userId: targetUserId,
      fullName: profileData.fullName ?? existing?.fullName ?? '',
      country: profileData.country ?? existing?.country ?? '',
      region: profileData.region !== undefined ? profileData.region : (existing?.region ?? null),
      city: profileData.city !== undefined ? profileData.city : (existing?.city ?? null),
      targetJobTitle: profileData.targetJobTitle ?? existing?.targetJobTitle ?? '',
      specialties: profileData.specialties ?? existing?.specialties ?? [],
      secondarySpecialties: profileData.secondarySpecialties ?? existing?.secondarySpecialties ?? [],
      educationLevel:
        profileData.educationLevel !== undefined
          ? profileData.educationLevel
          : (existing?.educationLevel ?? null),
      fieldOfStudy:
        profileData.fieldOfStudy !== undefined
          ? profileData.fieldOfStudy
          : (existing?.fieldOfStudy ?? null),
      institution:
        profileData.institution !== undefined ? profileData.institution : (existing?.institution ?? null),
      graduationYear:
        profileData.graduationYear !== undefined
          ? profileData.graduationYear
          : (existing?.graduationYear ?? null),
      yearsOfExperience:
        profileData.yearsOfExperience !== undefined
          ? profileData.yearsOfExperience
          : (existing?.yearsOfExperience ?? null),
      currentJobTitle:
        profileData.currentJobTitle !== undefined
          ? profileData.currentJobTitle
          : (existing?.currentJobTitle ?? null),
      experienceSummary:
        profileData.experienceSummary !== undefined
          ? profileData.experienceSummary
          : (existing?.experienceSummary ?? null),
      technicalSkills: profileData.technicalSkills ?? existing?.technicalSkills ?? [],
      softSkills: profileData.softSkills ?? existing?.softSkills ?? [],
      industrySkills: profileData.industrySkills ?? existing?.industrySkills ?? [],
      languages: profileData.languages ?? existing?.languages ?? [],
      preferredEmploymentTypes:
        profileData.preferredEmploymentTypes ?? existing?.preferredEmploymentTypes ?? [],
      preferredWorkModes: profileData.preferredWorkModes ?? existing?.preferredWorkModes ?? [],
      preferredCountries: profileData.preferredCountries ?? existing?.preferredCountries ?? [],
      preferredRegions: profileData.preferredRegions ?? existing?.preferredRegions ?? [],
      preferredCities: profileData.preferredCities ?? existing?.preferredCities ?? [],
      remotePreference: profileData.remotePreference ?? existing?.remotePreference ?? 'flexible',
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    this.profiles.set(targetUserId, merged);
    this.persist();

    // Supabase upsert
    const client = getSupabaseClient();
    if (client && isSupabaseConfigured() && targetUserId) {
      try {
        const row = mapProfileToDbRow(merged, targetUserId);
        const { error } = await client
          .from('job_seeker_profiles')
          .upsert(row, { onConflict: 'user_id' });
        if (error) {
          console.warn('Supabase saveProfile sync notice:', error.message);
        }
      } catch (err) {
        console.warn('Supabase saveProfile sync notice:', err);
      }
    }

    return { ...merged };
  }

  async clearProfile(userId?: string, user?: User | null): Promise<void> {
    this.init();
    const targetUserId = user?.id || userId || 'user-seeker-001';

    if (user) {
      const auth = RbacPolicy.canManageProfile(user, targetUserId);
      if (!auth.allowed) {
        throw new Error(auth.reasonAr || 'غير مصرح لك بمسح هذا الملف.');
      }
    }

    this.profiles.delete(targetUserId);
    this.persist();

    // Supabase delete
    const client = getSupabaseClient();
    if (client && isSupabaseConfigured()) {
      try {
        await client.from('job_seeker_profiles').delete().eq('user_id', targetUserId);
      } catch (err) {
        console.warn('Supabase clearProfile sync notice:', err);
      }
    }
  }

  getMetrics(profile: JobSeekerProfile | null): ProfileCompletionMetrics {
    return calculateProfileCompletion(profile);
  }

  async loadSampleProfile(user?: User | null): Promise<JobSeekerProfile> {
    this.init();
    const targetUserId = user?.id || 'user-seeker-001';
    const sample: JobSeekerProfile = {
      ...SAMPLE_PROFILE,
      userId: targetUserId,
      updatedAt: new Date().toISOString(),
    };
    this.profiles.set(targetUserId, sample);
    this.persist();
    return { ...sample };
  }
}

export const productionProfileRepository: IProfileRepository = new ProductionProfileRepository();
