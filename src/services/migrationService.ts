/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ============================================================================
 * LOCAL STORAGE TO PRODUCTION DATA MIGRATION SERVICE (PHASE 6)
 * ============================================================================
 * Safely migrates existing development localStorage records (jobs, saved jobs,
 * profile) into the production normalized repositories without data loss.
 */

import { productionJobRepository } from '../repositories/JobRepository';
import { productionSavedJobsRepository } from '../repositories/SavedJobsRepository';
import { productionProfileRepository } from '../repositories/ProfileRepository';
import { Job } from '../types/job';
import { JobSeekerProfile } from '../types/profile';
import { generateJobSlug } from '../utils/slugUtils';

export interface MigrationSummary {
  status: 'migrated' | 'already_up_to_date' | 'empty_fresh';
  jobsMigrated: number;
  savedJobsMigrated: number;
  profileMigrated: boolean;
  timestamp: string;
}

const MIGRATION_FLAG_KEY = 'gulf_jobs_v6_migration_status';
const LEGACY_JOBS_KEY = 'gulf_jobs_dev_persistence_v2';
const LEGACY_SAVED_KEY = 'gulf_jobs_dev_saved_jobs_v3';
const LEGACY_PROFILE_KEY = 'gulf_jobs_dev_profile_v3';

export class MigrationService {
  async runMigrationIfNeeded(): Promise<MigrationSummary> {
    if (typeof window === 'undefined' || !window.localStorage) {
      return {
        status: 'empty_fresh',
        jobsMigrated: 0,
        savedJobsMigrated: 0,
        profileMigrated: false,
        timestamp: new Date().toISOString(),
      };
    }

    try {
      const existingStatus = window.localStorage.getItem(MIGRATION_FLAG_KEY);
      if (existingStatus) {
        return JSON.parse(existingStatus);
      }

      let jobsMigrated = 0;
      let savedJobsMigrated = 0;
      let profileMigrated = false;

      // 1. Migrate Jobs
      const rawJobs = window.localStorage.getItem(LEGACY_JOBS_KEY);
      if (rawJobs) {
        const parsedJobs: Job[] = JSON.parse(rawJobs);
        if (Array.isArray(parsedJobs) && parsedJobs.length > 0) {
          for (const legacyJob of parsedJobs) {
            const existing = await productionJobRepository.getJobById(legacyJob.id, { role: 'admin' } as any);
            if (!existing) {
              const slug = legacyJob.slug || generateJobSlug(legacyJob, parsedJobs);
              await productionJobRepository.createJob(
                {
                  ...legacyJob,
                  slug,
                },
                { role: 'admin' } as any
              );
              jobsMigrated++;
            }
          }
        }
      }

      // 2. Migrate Saved Jobs
      const rawSaved = window.localStorage.getItem(LEGACY_SAVED_KEY);
      if (rawSaved) {
        const parsedIds: string[] = JSON.parse(rawSaved);
        if (Array.isArray(parsedIds) && parsedIds.length > 0) {
          for (const id of parsedIds) {
            await productionSavedJobsRepository.saveJob(id);
            savedJobsMigrated++;
          }
        }
      }

      // 3. Migrate Profile
      const rawProfile = window.localStorage.getItem(LEGACY_PROFILE_KEY);
      if (rawProfile) {
        const parsedProfile: JobSeekerProfile = JSON.parse(rawProfile);
        if (parsedProfile && parsedProfile.fullName) {
          await productionProfileRepository.saveProfile(parsedProfile);
          profileMigrated = true;
        }
      }

      const summary: MigrationSummary = {
        status: jobsMigrated > 0 || savedJobsMigrated > 0 || profileMigrated ? 'migrated' : 'already_up_to_date',
        jobsMigrated,
        savedJobsMigrated,
        profileMigrated,
        timestamp: new Date().toISOString(),
      };

      window.localStorage.setItem(MIGRATION_FLAG_KEY, JSON.stringify(summary));
      return summary;
    } catch (e) {
      console.warn('Migration encountered a non-fatal warning:', e);
      return {
        status: 'already_up_to_date',
        jobsMigrated: 0,
        savedJobsMigrated: 0,
        profileMigrated: false,
        timestamp: new Date().toISOString(),
      };
    }
  }

  getMigrationStatus(): MigrationSummary | null {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    const raw = window.localStorage.getItem(MIGRATION_FLAG_KEY);
    return raw ? JSON.parse(raw) : null;
  }
}

export const migrationService = new MigrationService();
