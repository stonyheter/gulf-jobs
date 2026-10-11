/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ============================================================================
 * JOB SEEKER PROFILE SERVICE & REPOSITORY LAYER (PHASE 3)
 * ============================================================================
 * Manages the job seeker's structured professional profile, preferences,
 * and completion metrics.
 * 
 * Current Implementation: LocalDevStorageProfileRepository (browser localStorage).
 * Future: Easily replaceable with PostgreSQL / Cloud SQL table `job_seeker_profiles`.
 */

import { JobSeekerProfile, ProfileCompletionMetrics } from '../types/profile';
import { SAMPLE_PROFILE, calculateProfileCompletion } from '../data/sampleProfile';
export { SAMPLE_PROFILE, calculateProfileCompletion };

export interface IProfileRepository {
  getProfile(): Promise<JobSeekerProfile | null>;
  saveProfile(profileData: Partial<JobSeekerProfile>): Promise<JobSeekerProfile>;
  clearProfile(): Promise<void>;
  getMetrics(profile: JobSeekerProfile | null): ProfileCompletionMetrics;
  loadSampleProfile(): Promise<JobSeekerProfile>;
}

const PROFILE_STORAGE_KEY = 'gulf_jobs_dev_profile_v3';

class LocalDevStorageProfileRepository implements IProfileRepository {
  private cache: JobSeekerProfile | null = null;
  private hasLoaded = false;

  private loadFromStorage(): JobSeekerProfile | null {
    if (this.hasLoaded && this.cache !== null) {
      return this.cache;
    }

    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }

    try {
      const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && parsed.id) {
          this.cache = parsed as JobSeekerProfile;
          this.hasLoaded = true;
          return this.cache;
        }
      }
    } catch (e) {
      console.warn('Failed to read profile from localStorage', e);
    }

    this.hasLoaded = true;
    this.cache = null;
    return null;
  }

  private writeToStorage(profile: JobSeekerProfile | null): void {
    this.cache = profile;
    this.hasLoaded = true;
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        if (profile) {
          window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
        } else {
          window.localStorage.removeItem(PROFILE_STORAGE_KEY);
        }
      } catch (e) {
        console.warn('Failed to write profile to localStorage', e);
      }
    }
  }

  async getProfile(): Promise<JobSeekerProfile | null> {
    await new Promise((res) => setTimeout(res, 10));
    return this.loadFromStorage();
  }

  async saveProfile(profileData: Partial<JobSeekerProfile>): Promise<JobSeekerProfile> {
    await new Promise((res) => setTimeout(res, 20));
    const existing = this.loadFromStorage();
    const now = new Date().toISOString();

    const merged: JobSeekerProfile = {
      id: existing?.id || `prof-${Date.now()}`,
      fullName: profileData.fullName ?? existing?.fullName ?? '',
      country: profileData.country ?? existing?.country ?? '',
      region: profileData.region !== undefined ? profileData.region : (existing?.region ?? null),
      city: profileData.city !== undefined ? profileData.city : (existing?.city ?? null),
      targetJobTitle: profileData.targetJobTitle ?? existing?.targetJobTitle ?? '',
      specialties: profileData.specialties ?? existing?.specialties ?? [],
      secondarySpecialties: profileData.secondarySpecialties ?? existing?.secondarySpecialties ?? [],
      educationLevel: profileData.educationLevel !== undefined ? profileData.educationLevel : (existing?.educationLevel ?? null),
      fieldOfStudy: profileData.fieldOfStudy !== undefined ? profileData.fieldOfStudy : (existing?.fieldOfStudy ?? null),
      institution: profileData.institution !== undefined ? profileData.institution : (existing?.institution ?? null),
      graduationYear: profileData.graduationYear !== undefined ? profileData.graduationYear : (existing?.graduationYear ?? null),
      yearsOfExperience: profileData.yearsOfExperience !== undefined ? profileData.yearsOfExperience : (existing?.yearsOfExperience ?? null),
      currentJobTitle: profileData.currentJobTitle !== undefined ? profileData.currentJobTitle : (existing?.currentJobTitle ?? null),
      experienceSummary: profileData.experienceSummary !== undefined ? profileData.experienceSummary : (existing?.experienceSummary ?? null),
      technicalSkills: profileData.technicalSkills ?? existing?.technicalSkills ?? [],
      softSkills: profileData.softSkills ?? existing?.softSkills ?? [],
      industrySkills: profileData.industrySkills ?? existing?.industrySkills ?? [],
      languages: profileData.languages ?? existing?.languages ?? [],
      preferredEmploymentTypes: profileData.preferredEmploymentTypes ?? existing?.preferredEmploymentTypes ?? [],
      preferredWorkModes: profileData.preferredWorkModes ?? existing?.preferredWorkModes ?? [],
      preferredCountries: profileData.preferredCountries ?? existing?.preferredCountries ?? [],
      preferredRegions: profileData.preferredRegions ?? existing?.preferredRegions ?? [],
      preferredCities: profileData.preferredCities ?? existing?.preferredCities ?? [],
      remotePreference: profileData.remotePreference ?? existing?.remotePreference ?? 'flexible',
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    this.writeToStorage(merged);
    return merged;
  }

  async clearProfile(): Promise<void> {
    await new Promise((res) => setTimeout(res, 10));
    this.writeToStorage(null);
  }

  getMetrics(profile: JobSeekerProfile | null): ProfileCompletionMetrics {
    return calculateProfileCompletion(profile);
  }

  async loadSampleProfile(): Promise<JobSeekerProfile> {
    await new Promise((res) => setTimeout(res, 20));
    const sample = { ...SAMPLE_PROFILE, updatedAt: new Date().toISOString() };
    this.writeToStorage(sample);
    return sample;
  }
}

import { productionProfileRepository } from '../repositories/ProfileRepository';

/**
 * Service Factory (Phase 6):
 * Wires the application to the production ProfileRepository.
 * LocalDevStorageProfileRepository remains available as an isolated fallback adapter.
 */
export const profileService: IProfileRepository = productionProfileRepository;
export { LocalDevStorageProfileRepository };
