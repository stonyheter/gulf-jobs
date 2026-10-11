/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ============================================================================
 * PRODUCTION SAVED JOBS REPOSITORY IMPLEMENTATION (PHASE 6)
 * ============================================================================
 * Stores saved jobs bound to user identity, with legacy bookmark migration
 * and RBAC ownership verification.
 */

import { ISavedJobsRepository } from './ISavedJobsRepository';
import { Job } from '../types/job';
import { User } from '../types/auth';
import { productionJobRepository } from './JobRepository';
import { RbacPolicy } from '../lib/security/rbac';
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase/client';

const PROD_SAVED_KEY = 'gulf_jobs_prod_saved_jobs_v1';
const LEGACY_SAVED_KEY = 'gulf_jobs_dev_saved_jobs_v3';

export class ProductionSavedJobsRepository implements ISavedJobsRepository {
  // Map of userId -> Set of jobIds
  private userBookmarks: Map<string, Set<string>> = new Map();
  private initialized = false;

  constructor() {
    this.init();
  }

  private init(): void {
    if (this.initialized) return;

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const raw = window.localStorage.getItem(PROD_SAVED_KEY);
        if (raw) {
          const parsed: Record<string, string[]> = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            Object.entries(parsed).forEach(([uid, ids]) => {
              this.userBookmarks.set(uid, new Set(ids));
            });
          }
        }

        // Migrate legacy saved jobs
        const legacyRaw = window.localStorage.getItem(LEGACY_SAVED_KEY);
        if (legacyRaw && this.userBookmarks.size === 0) {
          const legacyIds: string[] = JSON.parse(legacyRaw);
          if (Array.isArray(legacyIds) && legacyIds.length > 0) {
            this.userBookmarks.set('user-seeker-001', new Set(legacyIds));
            this.persist();
          }
        }
      } catch (e) {
        console.warn('Failed to load saved jobs from persistence', e);
      }
    }

    this.initialized = true;
  }

  private persist(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const obj: Record<string, string[]> = {};
        this.userBookmarks.forEach((set, uid) => {
          obj[uid] = Array.from(set);
        });
        window.localStorage.setItem(PROD_SAVED_KEY, JSON.stringify(obj));
      } catch (e) {
        console.warn('Failed to persist saved jobs', e);
      }
    }
  }

  private getEffectiveUserId(user?: User | null): string {
    return user?.id || 'user-seeker-001';
  }

  async saveJob(jobId: string, user?: User | null): Promise<boolean> {
    this.init();
    const uid = this.getEffectiveUserId(user);

    if (user) {
      const auth = RbacPolicy.canManageSavedJobs(user, uid);
      if (!auth.allowed) {
        throw new Error(auth.reasonAr || 'غير مصرح لك بإدارة الوظائف المحفوظة.');
      }
    }

    let set = this.userBookmarks.get(uid);
    if (!set) {
      set = new Set();
      this.userBookmarks.set(uid, set);
    }

    if (!set.has(jobId)) {
      set.add(jobId);
      this.persist();

      // Supabase synchronization
      const client = getSupabaseClient();
      if (client && isSupabaseConfigured() && user) {
        try {
          await client.from('saved_jobs').insert({
            user_id: user.id,
            job_id: jobId,
          });
        } catch (err) {
          console.warn('Supabase saveJob sync notice:', err);
        }
      }

      return true;
    }

    return false;
  }

  async unsaveJob(jobId: string, user?: User | null): Promise<boolean> {
    this.init();
    const uid = this.getEffectiveUserId(user);

    if (user) {
      const auth = RbacPolicy.canManageSavedJobs(user, uid);
      if (!auth.allowed) {
        throw new Error(auth.reasonAr || 'غير مصرح لك بإدارة الوظائف المحفوظة.');
      }
    }

    const set = this.userBookmarks.get(uid);
    if (set && set.has(jobId)) {
      set.delete(jobId);
      this.persist();

      // Supabase synchronization
      const client = getSupabaseClient();
      if (client && isSupabaseConfigured() && user) {
        try {
          await client
            .from('saved_jobs')
            .delete()
            .eq('user_id', user.id)
            .eq('job_id', jobId);
        } catch (err) {
          console.warn('Supabase unsaveJob sync notice:', err);
        }
      }

      return true;
    }

    return false;
  }

  async isJobSaved(jobId: string, user?: User | null): Promise<boolean> {
    this.init();
    const uid = this.getEffectiveUserId(user);
    const set = this.userBookmarks.get(uid);
    return set ? set.has(jobId) : false;
  }

  async getSavedJobIds(user?: User | null): Promise<string[]> {
    this.init();
    const uid = this.getEffectiveUserId(user);

    // If Supabase is connected, synchronize saved jobs list
    const client = getSupabaseClient();
    if (client && isSupabaseConfigured() && user) {
      try {
        const { data, error } = await client
          .from('saved_jobs')
          .select('job_id')
          .eq('user_id', user.id);
        if (!error && data) {
          const ids = data.map((r: any) => r.job_id);
          this.userBookmarks.set(uid, new Set(ids));
          this.persist();
          return ids;
        }
      } catch (err) {
        console.warn('Supabase getSavedJobIds sync notice:', err);
      }
    }

    const set = this.userBookmarks.get(uid);
    return set ? Array.from(set) : [];
  }

  async getSavedJobs(user?: User | null): Promise<Job[]> {
    const ids = await this.getSavedJobIds(user);
    if (ids.length === 0) return [];

    const jobs: Job[] = [];
    for (const id of ids) {
      const j = await productionJobRepository.getJobById(id, user);
      if (j) jobs.push(j);
    }
    return jobs;
  }

  async clearSavedJobs(user?: User | null): Promise<void> {
    this.init();
    const uid = this.getEffectiveUserId(user);
    if (user) {
      const auth = RbacPolicy.canManageSavedJobs(user, uid);
      if (!auth.allowed) {
        throw new Error(auth.reasonAr || 'غير مصرح لك بمسح الوظائف المحفوظة.');
      }
    }

    this.userBookmarks.delete(uid);
    this.persist();

    // Supabase sync
    const client = getSupabaseClient();
    if (client && isSupabaseConfigured() && user) {
      try {
        await client.from('saved_jobs').delete().eq('user_id', user.id);
      } catch (err) {
        console.warn('Supabase clearSavedJobs sync notice:', err);
      }
    }
  }
}

export const productionSavedJobsRepository: ISavedJobsRepository = new ProductionSavedJobsRepository();
