/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ============================================================================
 * ARCHITECTURAL SERVICE & REPOSITORY LAYER (PHASE 2)
 * ============================================================================
 * Defines the abstract contract (IJobRepository) decoupling UI from the
 * underlying data storage.
 * 
 * Current Implementation: LocalDevStorageJobRepository
 * - Persists all CRUD operations, status changes, and drafts to browser localStorage.
 * - Seeds from MOCK_JOBS on first boot or on manual reset.
 * - Strictly separated development persistence layer.
 * 
 * Future Implementation (Phase 3 / Production Database):
 * - Swap out LocalDevStorageJobRepository with CloudSqlJobRepository (PostgreSQL),
 *   FirestoreJobRepository, or SupabaseJobRepository without touching any UI component.
 */

import { Job, JobCategory, JobStatus } from '../types/job';
import { JobFilterState } from '../types/filters';
import { FEATURED_CATEGORIES } from '../config/categories';
import { GCC_COUNTRIES } from '../data/geoHierarchy';
import { validateJob, isJobExpiredByDate } from './jobValidationService';
import { checkJobForDuplicates } from './duplicateDetectionService';

export interface JobQueryResult {
  jobs: Job[];
  total: number;
}

export interface CountryStat {
  code: string;
  nameAr: string;
  commonNameAr: string;
  flagEmoji: string;
  currencyAr: string;
  jobCount: number;
}

export interface AdminStats {
  total: number;
  published: number;
  pendingReview: number;
  drafts: number;
  expired: number;
  rejected: number;
  duplicate: number;
  paused: number;
}

export interface JobQueryOptions {
  includeAllStatuses?: boolean; // When true (Admin mode), returns draft, pending, expired, etc.
  statusFilter?: JobStatus | 'all';
  categoryFilter?: string;
}

export interface PublishResult {
  success: boolean;
  job?: Job;
  errors?: string[];
  warnings?: string[];
}

/**
 * Interface that every data source adapter must satisfy.
 */
export interface IJobRepository {
  // Discovery & Search
  getJobs(filters?: Partial<JobFilterState>, options?: JobQueryOptions): Promise<JobQueryResult>;
  getJobById(id: string): Promise<Job | null>;
  getLatestJobs(limit?: number): Promise<Job[]>;
  getTodayJobs(): Promise<Job[]>;
  getRemoteJobs(): Promise<Job[]>;
  getEntryLevelJobs(): Promise<Job[]>;
  getCategories(): Promise<JobCategory[]>;
  getCountryStats(): Promise<CountryStat[]>;

  // Admin Management & Mutation
  createJob(jobData: Omit<Job, 'id' | 'createdAt' | 'updatedAt'>): Promise<Job>;
  updateJob(id: string, updates: Partial<Job>): Promise<Job>;
  deleteJob(id: string): Promise<boolean>;
  publishJob(id: string): Promise<PublishResult>;
  pauseJob(id: string): Promise<Job>;
  expireJob(id: string): Promise<Job>;
  rejectJob(id: string, reason?: string): Promise<Job>;
  duplicateJob(id: string): Promise<Job>;
  getAdminStats(): Promise<AdminStats>;

  // Development utilities
  resetToMockData(): Promise<void>;
  isDevelopmentPersistence(): boolean;
}

const STORAGE_KEY = 'gulf_jobs_dev_persistence_v2';

/**
 * Development persistence repository using browser localStorage.
 * Automatically handles expired job detection and quality rules.
 */
class LocalDevStorageJobRepository implements IJobRepository {
  private cache: Job[] | null = null;

  isDevelopmentPersistence(): boolean {
    return true;
  }

  private loadFromStorage(): Job[] {
    if (this.cache !== null) {
      return this.cache;
    }

    if (typeof window === 'undefined' || !window.localStorage) {
      this.cache = [];
      return this.cache;
    }

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.cache = parsed;
          return this.cache!;
        }
      }
    } catch (e) {
      console.warn('Could not read from localStorage, using default mock data.', e);
    }

    // First time init: seed with MOCK_JOBS
    this.cache = [];
    this.saveToStorage(this.cache);
    return this.cache;
  }

  private saveToStorage(jobs: Job[]): void {
    this.cache = jobs;
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
      } catch (e) {
        console.warn('Failed to save to localStorage', e);
      }
    }
  }

  async resetToMockData(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    this.saveToStorage([]);
  }

  async getJobs(
    filters?: Partial<JobFilterState>,
    options: JobQueryOptions = {}
  ): Promise<JobQueryResult> {
    await new Promise((resolve) => setTimeout(resolve, 40));
    let allJobs = this.loadFromStorage();

    // In public mode (options.includeAllStatuses !== true):
    // Only return 'published' jobs whose validThrough is not expired!
    if (!options.includeAllStatuses) {
      allJobs = allJobs.filter((j) => {
        if (j.status !== 'published') return false;
        if (j.validThrough && isJobExpiredByDate(j.validThrough)) return false;
        return true;
      });
    }

    let filtered = [...allJobs];

    // Status filter (mostly for admin)
    if (options.statusFilter && options.statusFilter !== 'all') {
      filtered = filtered.filter((j) => j.status === options.statusFilter);
    }

    // Category filter
    if (options.categoryFilter && options.categoryFilter !== 'all') {
      filtered = filtered.filter((j) => j.category === options.categoryFilter);
    }

    if (!filters) {
      return { jobs: filtered, total: filtered.length };
    }

    // 1. Keyword search (title, companyName, skills, description)
    if (filters.keyword && filters.keyword.trim() !== '') {
      const q = filters.keyword.toLowerCase().trim();
      filtered = filtered.filter((j) => {
        return (
          j.title.toLowerCase().includes(q) ||
          j.companyName.toLowerCase().includes(q) ||
          j.description.toLowerCase().includes(q) ||
          (j.skills && j.skills.some((s) => s.toLowerCase().includes(q)))
        );
      });
    }

    // 2. Country filter
    if (filters.country && filters.country !== '' && filters.country !== 'all') {
      const c = filters.country.toLowerCase();
      filtered = filtered.filter((j) => {
        const countryMeta = GCC_COUNTRIES.find(
          (item) =>
            item.code.toLowerCase() === c ||
            item.nameAr.toLowerCase().includes(c) ||
            item.commonNameAr.toLowerCase().includes(c)
        );
        if (countryMeta) {
          return (
            j.country.includes(countryMeta.commonNameAr) ||
            j.country.includes(countryMeta.nameAr)
          );
        }
        return j.country.toLowerCase().includes(c);
      });
    }

    // 3. Region filter
    if (filters.region && filters.region !== '' && filters.region !== 'all') {
      filtered = filtered.filter((j) => j.region && j.region.includes(filters.region!));
    }

    // 4. City filter
    if (filters.city && filters.city !== '' && filters.city !== 'all') {
      filtered = filtered.filter((j) => j.city && j.city.includes(filters.city!));
    }

    // 5. Work Mode
    if (filters.workMode && filters.workMode !== 'all') {
      filtered = filtered.filter((j) => j.workMode === filters.workMode);
    }

    // 6. Employment Type
    if (filters.employmentType && filters.employmentType !== 'all') {
      filtered = filtered.filter((j) => j.employmentType === filters.employmentType);
    }

    // 7. Experience
    if (filters.experience && filters.experience !== 'all') {
      if (filters.experience === 'no_exp') {
        filtered = filtered.filter((j) => j.experienceMin === 0 || j.experienceMin === null);
      } else if (filters.experience === '1-3') {
        filtered = filtered.filter(
          (j) => j.experienceMin !== null && j.experienceMin >= 1 && j.experienceMin <= 3
        );
      } else if (filters.experience === '3-5') {
        filtered = filtered.filter(
          (j) => j.experienceMin !== null && j.experienceMin >= 3 && j.experienceMin <= 5
        );
      } else if (filters.experience === '5+') {
        filtered = filtered.filter((j) => j.experienceMin !== null && j.experienceMin >= 5);
      }
    }

    // 8. Education
    if (filters.education && filters.education !== 'all') {
      filtered = filtered.filter((j) => j.education && j.education.includes(filters.education!));
    }

    // 9. Salary filter
    if (filters.hasSalaryOnly) {
      filtered = filtered.filter((j) => j.salaryMin !== null || j.salaryMax !== null);
    }
    if (filters.minSalary && filters.minSalary > 0) {
      filtered = filtered.filter((j) => (j.salaryMin ?? 0) >= filters.minSalary!);
    }

    // 10. Date posted filter
    if (filters.postedDate && filters.postedDate !== 'all') {
      const now = new Date().getTime();
      filtered = filtered.filter((j) => {
        const posted = new Date(j.datePosted).getTime();
        const diffHours = (now - posted) / (1000 * 60 * 60);

        if (filters.postedDate === 'today') return diffHours <= 24;
        if (filters.postedDate === '3days') return diffHours <= 72;
        if (filters.postedDate === '7days') return diffHours <= 168;
        if (filters.postedDate === '30days') return diffHours <= 720;
        return true;
      });
    }

    // 11. Sorting
    const isOldest = filters.sortBy === 'oldest';
    filtered.sort((a, b) => {
      const dateA = new Date(a.datePosted).getTime();
      const dateB = new Date(b.datePosted).getTime();
      return isOldest ? dateA - dateB : dateB - dateA;
    });

    return {
      jobs: filtered,
      total: filtered.length,
    };
  }

  async getJobById(id: string): Promise<Job | null> {
    await new Promise((resolve) => setTimeout(resolve, 30));
    const all = this.loadFromStorage();
    const found = all.find((j) => j.id === id);
    return found ? { ...found } : null;
  }

  async getLatestJobs(limit: number = 6): Promise<Job[]> {
    const res = await this.getJobs({ sortBy: 'newest' }, { includeAllStatuses: false });
    return res.jobs.slice(0, limit);
  }

  async getTodayJobs(): Promise<Job[]> {
    const res = await this.getJobs(
      { postedDate: 'today', sortBy: 'newest' },
      { includeAllStatuses: false }
    );
    return res.jobs;
  }

  async getRemoteJobs(): Promise<Job[]> {
    const res = await this.getJobs(
      { workMode: 'remote', sortBy: 'newest' },
      { includeAllStatuses: false }
    );
    return res.jobs;
  }

  async getEntryLevelJobs(): Promise<Job[]> {
    const res = await this.getJobs(
      { experience: 'no_exp', sortBy: 'newest' },
      { includeAllStatuses: false }
    );
    return res.jobs;
  }

  async getCategories(): Promise<JobCategory[]> {
    return [...FEATURED_CATEGORIES];
  }

  async getCountryStats(): Promise<CountryStat[]> {
    const all = this.loadFromStorage().filter((j) => j.status === 'published');
    return GCC_COUNTRIES.map((country) => {
      const count = all.filter(
        (j) => j.country.includes(country.commonNameAr) || j.country.includes(country.nameAr)
      ).length;

      return {
        code: country.code,
        nameAr: country.nameAr,
        commonNameAr: country.commonNameAr,
        flagEmoji: country.flagEmoji,
        currencyAr: country.currencyAr,
        jobCount: count,
      };
    });
  }

  // ==========================================================================
  // ADMIN & MUTATION METHODS
  // ==========================================================================

  async createJob(jobData: Omit<Job, 'id' | 'createdAt' | 'updatedAt'>): Promise<Job> {
    await new Promise((resolve) => setTimeout(resolve, 60));
    const jobs = this.loadFromStorage();

    // Check for duplicates before creation
    const dupCheck = checkJobForDuplicates(jobData, jobs);
    let finalStatus: JobStatus = jobData.status || 'draft';
    if (dupCheck.isDuplicate && finalStatus === 'published') {
      // Mark as duplicate if high confidence
      finalStatus = 'duplicate';
    }

    const nowIso = new Date().toISOString();
    const newJob: Job = {
      ...jobData,
      id: `job-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      status: finalStatus,
      createdAt: nowIso,
      updatedAt: nowIso,
      importedAt: jobData.importedAt ?? null,
      lastCheckedAt: nowIso,
    };

    const updatedList = [newJob, ...jobs];
    this.saveToStorage(updatedList);
    return newJob;
  }

  async updateJob(id: string, updates: Partial<Job>): Promise<Job> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    const jobs = this.loadFromStorage();
    const index = jobs.findIndex((j) => j.id === id);
    if (index === -1) {
      throw new Error(`الوظيفة بالمعرّف ${id} غير موجودة.`);
    }

    const existing = jobs[index];
    const nowIso = new Date().toISOString();

    const updatedJob: Job = {
      ...existing,
      ...updates,
      id: existing.id, // Immutable ID
      createdAt: existing.createdAt, // Preserve creation timestamp
      updatedAt: nowIso,
      lastCheckedAt: nowIso,
    };

    jobs[index] = updatedJob;
    this.saveToStorage([...jobs]);
    return updatedJob;
  }

  async deleteJob(id: string): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 40));
    const jobs = this.loadFromStorage();
    const filtered = jobs.filter((j) => j.id !== id);
    if (filtered.length === jobs.length) {
      return false;
    }
    this.saveToStorage(filtered);
    return true;
  }

  async publishJob(id: string): Promise<PublishResult> {
    const job = await this.getJobById(id);
    if (!job) {
      return { success: false, errors: ['الوظيفة غير موجودة.'] };
    }

    // Run quality validation rules
    const validation = validateJob(job, 'published');
    if (!validation.canPublish) {
      return {
        success: false,
        errors: validation.errors.map((e) => e.messageAr),
        warnings: validation.warnings.map((w) => w.messageAr),
      };
    }

    const updated = await this.updateJob(id, {
      status: 'published',
      updatedAt: new Date().toISOString(),
    });

    return {
      success: true,
      job: updated,
      warnings: validation.warnings.map((w) => w.messageAr),
    };
  }

  async pauseJob(id: string): Promise<Job> {
    return this.updateJob(id, { status: 'paused' });
  }

  async expireJob(id: string): Promise<Job> {
    return this.updateJob(id, { status: 'expired' });
  }

  async rejectJob(id: string, reason?: string): Promise<Job> {
    return this.updateJob(id, { status: 'rejected' });
  }

  async duplicateJob(id: string): Promise<Job> {
    const original = await this.getJobById(id);
    if (!original) {
      throw new Error(`الوظيفة بالمعرّف ${id} غير موجودة لنسخها.`);
    }

    const nowIso = new Date().toISOString();
    const clonedData: Omit<Job, 'id' | 'createdAt' | 'updatedAt'> = {
      ...original,
      title: `نسخة من ${original.title}`,
      status: 'draft', // Cloned jobs start as drafts
      datePosted: nowIso,
      validThrough: null,
      importedAt: null,
      lastCheckedAt: null,
    };

    return this.createJob(clonedData);
  }

  async getAdminStats(): Promise<AdminStats> {
    const all = this.loadFromStorage();
    const stats: AdminStats = {
      total: all.length,
      published: 0,
      pendingReview: 0,
      drafts: 0,
      expired: 0,
      rejected: 0,
      duplicate: 0,
      paused: 0,
    };

    for (const job of all) {
      if (job.status === 'published') {
        // Also check if actually expired by date
        if (job.validThrough && isJobExpiredByDate(job.validThrough)) {
          stats.expired++;
        } else {
          stats.published++;
        }
      } else if (job.status === 'pending_review') {
        stats.pendingReview++;
      } else if (job.status === 'draft') {
        stats.drafts++;
      } else if (job.status === 'expired') {
        stats.expired++;
      } else if (job.status === 'rejected') {
        stats.rejected++;
      } else if (job.status === 'duplicate') {
        stats.duplicate++;
      } else if (job.status === 'paused') {
        stats.paused++;
      }
    }

    return stats;
  }
}

import { productionJobRepository } from '../repositories/JobRepository';

/**
 * Service Factory (Phase 6):
 * Wires the application to the production JobRepository.
 * LocalDevStorageJobRepository remains available as an isolated fallback adapter.
 */
export const jobService: IJobRepository = productionJobRepository;
export { LocalDevStorageJobRepository };
