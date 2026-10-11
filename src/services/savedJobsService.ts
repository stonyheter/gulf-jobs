/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ============================================================================
 * SAVED JOBS SERVICE & REPOSITORY LAYER (PHASE 3)
 * ============================================================================
 * Manages the job seeker's bookmarked/saved opportunities.
 * Stores saved job IDs separately from full job entities.
 * 
 * Current Implementation: LocalDevStorageSavedJobsRepository (browser localStorage).
 * Future: Easily replaceable by a real database table (e.g. `user_saved_jobs` in PostgreSQL / Cloud SQL).
 */

import { Job } from '../types/job';
import { jobService } from './jobService';

export interface ISavedJobsRepository {
  saveJob(jobId: string): Promise<boolean>;
  unsaveJob(jobId: string): Promise<boolean>;
  isJobSaved(jobId: string): Promise<boolean>;
  getSavedJobIds(): Promise<string[]>;
  getSavedJobs(): Promise<Job[]>;
  clearSavedJobs(): Promise<void>;
}

const SAVED_STORAGE_KEY = 'gulf_jobs_dev_saved_jobs_v3';

class LocalDevStorageSavedJobsRepository implements ISavedJobsRepository {
  private cache: string[] | null = null;

  private loadIds(): string[] {
    if (this.cache !== null) {
      return this.cache;
    }

    if (typeof window === 'undefined' || !window.localStorage) {
      this.cache = [];
      return this.cache;
    }

    try {
      const raw = window.localStorage.getItem(SAVED_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.cache = parsed;
          return this.cache!;
        }
      }
    } catch (e) {
      console.warn('Failed to read saved jobs from localStorage', e);
    }

    this.cache = [];
    return this.cache;
  }

  private saveIds(ids: string[]): void {
    this.cache = ids;
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify(ids));
      } catch (e) {
        console.warn('Failed to save job IDs to localStorage', e);
      }
    }
  }

  async saveJob(jobId: string): Promise<boolean> {
    await new Promise((res) => setTimeout(res, 20));
    const ids = this.loadIds();
    if (!ids.includes(jobId)) {
      const updated = [jobId, ...ids];
      this.saveIds(updated);
      return true;
    }
    return false;
  }

  async unsaveJob(jobId: string): Promise<boolean> {
    await new Promise((res) => setTimeout(res, 20));
    const ids = this.loadIds();
    const updated = ids.filter((id) => id !== jobId);
    if (updated.length !== ids.length) {
      this.saveIds(updated);
      return true;
    }
    return false;
  }

  async isJobSaved(jobId: string): Promise<boolean> {
    const ids = this.loadIds();
    return ids.includes(jobId);
  }

  async getSavedJobIds(): Promise<string[]> {
    return [...this.loadIds()];
  }

  async getSavedJobs(): Promise<Job[]> {
    const ids = this.loadIds();
    if (ids.length === 0) return [];

    // Fetch individual job objects concurrently via jobService repository
    const jobs: Job[] = [];
    for (const id of ids) {
      const job = await jobService.getJobById(id);
      if (job) {
        jobs.push(job);
      }
    }
    return jobs;
  }

  async clearSavedJobs(): Promise<void> {
    this.saveIds([]);
  }
}

import { productionSavedJobsRepository } from '../repositories/SavedJobsRepository';

/**
 * Service Factory (Phase 6):
 * Wires the application to the production SavedJobsRepository.
 * LocalDevStorageSavedJobsRepository remains available as an isolated fallback adapter.
 */
export const savedJobsService: ISavedJobsRepository = productionSavedJobsRepository;
export { LocalDevStorageSavedJobsRepository };
