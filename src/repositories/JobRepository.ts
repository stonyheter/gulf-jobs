/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * SUPABASE JOB REPOSITORY (PHASE 8)
 * Supabase is the ONLY data source. No localStorage, no mock data.
 */

import {
  IJobRepository,
  JobQueryResult,
  JobQueryOptions,
  PublishResult,
  AdminStats,
  CountryStat,
} from './IJobRepository';
import { Job, JobCategory, JobStatus } from '../types/job';
import { JobFilterState } from '../types/filters';
import { User } from '../types/auth';
import { GCC_COUNTRIES } from '../data/geoHierarchy';
import { FEATURED_CATEGORIES } from '../config/categories';
import { validateJobBackend } from '../lib/validation/jobValidationBackend';
import { validateJob, isJobExpiredByDate } from '../services/jobValidationService';
import { checkJobForDuplicates } from '../services/duplicateDetectionService';
import { generateJobSlug } from '../utils/slugUtils';
import { RbacPolicy } from '../lib/security/rbac';
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase/client';

function mapDbRowToJob(row: any): Job {
  return {
    id: row.legacy_id || row.id,
    title: row.title,
    companyId: row.company_id ?? null,
    companyName: row.company_name,
    companyLogo: row.company_logo ?? null,
    category: row.category ?? null,
    country: row.country,
    region: row.region ?? null,
    city: row.city,
    district: row.district ?? null,
    address: row.address ?? null,
    workMode: row.work_mode,
    employmentType: row.employment_type,
    experienceMin: row.experience_min !== null ? Number(row.experience_min) : null,
    experienceMax: row.experience_max !== null ? Number(row.experience_max) : null,
    education: row.education ?? null,
    salaryMin: row.salary_min !== null ? Number(row.salary_min) : null,
    salaryMax: row.salary_max !== null ? Number(row.salary_max) : null,
    salaryCurrency: row.salary_currency || 'SAR',
    description: row.description,
    responsibilities: Array.isArray(row.responsibilities) ? row.responsibilities : [],
    requirements: Array.isArray(row.requirements) ? row.requirements : [],
    skills: Array.isArray(row.skills) ? row.skills : [],
    languages: Array.isArray(row.languages) ? row.languages : [],
    benefits: Array.isArray(row.benefits) ? row.benefits : [],
    applicationMethod: row.application_method,
    applicationUrl: row.application_url ?? null,
    sourceName: row.source_name ?? null,
    sourceUrl: row.source_url ?? null,
    originalJobUrl: row.original_job_url ?? null,
    datePosted: row.date_posted,
    validThrough: row.valid_through ?? null,
    status: row.status,
    slug: row.slug ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    importedAt: row.imported_at ?? null,
    lastCheckedAt: row.last_checked_at ?? null,
  };
}

function mapJobToDbRow(job: Job) {
  return {
    legacy_id: job.id,
    title: job.title,
    company_id: job.companyId && job.companyId.includes('-') && job.companyId.length === 36 ? job.companyId : null,
    company_name: job.companyName,
    company_logo: job.companyLogo ?? null,
    category: job.category ?? null,
    country: job.country,
    region: job.region ?? null,
    city: job.city,
    district: job.district ?? null,
    address: job.address ?? null,
    work_mode: job.workMode,
    employment_type: job.employmentType,
    experience_min: job.experienceMin ?? null,
    experience_max: job.experienceMax ?? null,
    education: job.education ?? null,
    salary_min: job.salaryMin ?? null,
    salary_max: job.salaryMax ?? null,
    salary_currency: job.salaryCurrency || 'SAR',
    description: job.description,
    responsibilities: job.responsibilities,
    requirements: job.requirements,
    skills: job.skills,
    languages: job.languages,
    benefits: job.benefits,
    application_method: job.applicationMethod,
    application_url: job.applicationUrl ?? null,
    source_name: job.sourceName ?? null,
    source_url: job.sourceUrl ?? null,
    original_job_url: job.originalJobUrl ?? null,
    date_posted: job.datePosted,
    valid_through: job.validThrough ?? null,
    status: job.status,
    slug: job.slug ?? null,
    imported_at: job.importedAt ?? null,
    last_checked_at: job.lastCheckedAt ?? null,
  };
}

export class ProductionJobRepository implements IJobRepository {
  isDevelopmentPersistence(): boolean { return false; }

  async resetToMockData(): Promise<void> {
    console.warn('resetToMockData() is a no-op in production.');
  }

  private getClient() {
    const client = getSupabaseClient();
    if (!client || !isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Check .env.local for VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
    }
    return client;
  }

  private applyFilters(jobs: Job[], filters: Partial<JobFilterState>): Job[] {
    let filtered = [...jobs];
    if (filters.keyword && filters.keyword.trim() !== '') {
      const q = filters.keyword.toLowerCase().trim();
      filtered = filtered.filter((j) => j.title.toLowerCase().includes(q) || j.companyName.toLowerCase().includes(q) || j.description.toLowerCase().includes(q) || (j.skills && j.skills.some((s: string) => s.toLowerCase().includes(q))));
    }
    if (filters.country && filters.country !== '' && filters.country !== 'all') {
      const c = filters.country.toLowerCase();
      filtered = filtered.filter((j) => {
        const meta = GCC_COUNTRIES.find((item) => item.code.toLowerCase() === c || item.nameAr.toLowerCase().includes(c) || item.commonNameAr.toLowerCase().includes(c));
        if (meta) return j.country.includes(meta.commonNameAr) || j.country.includes(meta.nameAr);
        return j.country.toLowerCase().includes(c);
      });
    }
    if (filters.region && filters.region !== '' && filters.region !== 'all') filtered = filtered.filter((j) => j.region && j.region.includes(filters.region!));
    if (filters.city && filters.city !== '' && filters.city !== 'all') filtered = filtered.filter((j) => j.city && j.city.includes(filters.city!));
    if (filters.workMode && filters.workMode !== 'all') filtered = filtered.filter((j) => j.workMode === filters.workMode);
    if (filters.employmentType && filters.employmentType !== 'all') filtered = filtered.filter((j) => j.employmentType === filters.employmentType);
    if (filters.experience && filters.experience !== 'all') {
      if (filters.experience === 'no_exp') filtered = filtered.filter((j) => j.experienceMin === 0 || j.experienceMin === null);
      else if (filters.experience === '1-3') filtered = filtered.filter((j) => j.experienceMin !== null && j.experienceMin >= 1 && j.experienceMin <= 3);
      else if (filters.experience === '3-5') filtered = filtered.filter((j) => j.experienceMin !== null && j.experienceMin >= 3 && j.experienceMin <= 5);
      else if (filters.experience === '5+') filtered = filtered.filter((j) => j.experienceMin !== null && j.experienceMin >= 5);
    }
    if (filters.education && filters.education !== 'all') filtered = filtered.filter((j) => j.education && j.education.includes(filters.education!));
    if (filters.hasSalaryOnly) filtered = filtered.filter((j) => j.salaryMin !== null || j.salaryMax !== null);
    if (filters.minSalary && filters.minSalary > 0) filtered = filtered.filter((j) => (j.salaryMin ?? 0) >= filters.minSalary!);
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
    const isOldest = filters.sortBy === 'oldest';
    filtered.sort((a, b) => {
      const dateA = new Date(a.datePosted).getTime();
      const dateB = new Date(b.datePosted).getTime();
      return isOldest ? dateA - dateB : dateB - dateA;
    });
    return filtered;
  }

  async getJobs(filters?: Partial<JobFilterState>, options: JobQueryOptions = {}): Promise<JobQueryResult> {
    const client = this.getClient();
    let query = client.from('jobs').select('*');
    if (!options.includeAllStatuses) query = query.eq('status', 'published');
    else if (options.statusFilter && options.statusFilter !== 'all') query = query.eq('status', options.statusFilter);
    if (options.categoryFilter && options.categoryFilter !== 'all') query = query.eq('category', options.categoryFilter);
    const { data, error } = await query;
    if (error) { console.error('Supabase getJobs error:', error); throw new Error('Failed to fetch jobs: ' + error.message); }
    let jobs = (data || []).map(mapDbRowToJob);
    if (filters) jobs = this.applyFilters(jobs, filters);
    else jobs.sort((a, b) => new Date(b.datePosted).getTime() - new Date(a.datePosted).getTime());
    if (!options.includeAllStatuses && options.user) jobs = jobs.filter((job) => RbacPolicy.canViewJob(options.user!, job));
    return { jobs, total: jobs.length };
  }

  async getJobById(id: string, user?: User | null): Promise<Job | null> {
    const client = this.getClient();
    // Search by legacy_id first (custom string IDs like "job-xxx")
    let result = await client.from('jobs').select('*').eq('legacy_id', id).maybeSingle();
    if (!result.data) {
      // Fallback: search by UUID id
      result = await client.from('jobs').select('*').eq('id', id).maybeSingle();
    }
    if (result.error || !result.data) return null;
    const job = mapDbRowToJob(result.data);
    if (!RbacPolicy.canViewJob(user || null, job)) return null;
    return job;
  }

  async getLatestJobs(limit: number = 6): Promise<Job[]> {
    const res = await this.getJobs({ sortBy: 'newest' }, { includeAllStatuses: false });
    return res.jobs.slice(0, limit);
  }

  async getTodayJobs(): Promise<Job[]> {
    const res = await this.getJobs({ postedDate: 'today', sortBy: 'newest' }, { includeAllStatuses: false });
    return res.jobs;
  }

  async getRemoteJobs(): Promise<Job[]> {
    const res = await this.getJobs({ workMode: 'remote', sortBy: 'newest' }, { includeAllStatuses: false });
    return res.jobs;
  }

  async getEntryLevelJobs(): Promise<Job[]> {
    const res = await this.getJobs({ experience: 'no_exp', sortBy: 'newest' }, { includeAllStatuses: false });
    return res.jobs;
  }

  async getCategories(): Promise<JobCategory[]> { return [...FEATURED_CATEGORIES]; }

  async getCountryStats(): Promise<CountryStat[]> {
    const client = this.getClient();
    const { data, error } = await client.from('jobs').select('country, valid_through, status').eq('status', 'published');
    if (error) return [];
    const active = (data || []).filter((row) => !row.valid_through || !isJobExpiredByDate(row.valid_through));
    return GCC_COUNTRIES.map((country) => {
      const count = active.filter((j) => j.country.includes(country.commonNameAr) || j.country.includes(country.nameAr)).length;
      return { code: country.code, nameAr: country.nameAr, commonNameAr: country.commonNameAr, flagEmoji: country.flagEmoji, currencyAr: country.currencyAr, jobCount: count };
    });
  }

  async createJob(jobData: Omit<Job, 'id' | 'createdAt' | 'updatedAt'>, user?: User | null): Promise<Job> {
    const client = this.getClient();
    if (user) {
      const auth = RbacPolicy.canCreateJob(user);
      if (!auth.allowed) throw new Error(auth.reasonAr || 'Permission denied.');
    }
    const validation = validateJobBackend(jobData);
    if (!validation.isValid) throw new Error('Validation failed: ' + validation.errors.join(' | '));
    const { data: existing } = await client.from('jobs').select('*');
    const currentJobs = (existing || []).map(mapDbRowToJob);
    const dupCheck = checkJobForDuplicates(jobData, currentJobs);
    let finalStatus: JobStatus = jobData.status || 'draft';
    if (dupCheck.isDuplicate && finalStatus === 'published') finalStatus = 'duplicate';
    const nowIso = new Date().toISOString();
    const jobId = 'job-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6);
    const tempJob: Job = { ...jobData, id: jobId, status: finalStatus, createdAt: nowIso, updatedAt: nowIso };
    const slug = jobData.slug || generateJobSlug(tempJob, currentJobs);
    const newJob: Job = { ...tempJob, slug, importedAt: jobData.importedAt ?? null, lastCheckedAt: nowIso };
    const row = mapJobToDbRow(newJob);
    const { data, error } = await client.from('jobs').insert(row).select().single();
    if (error) { console.error('createJob error:', error); throw new Error('Failed to create job: ' + error.message); }
    return mapDbRowToJob(data);
  }

  async updateJob(id: string, updates: Partial<Job>, user?: User | null): Promise<Job> {
    const client = this.getClient();
    const existing = await this.getJobById(id, user);
    if (!existing) throw new Error('Job ' + id + ' not found.');
    if (user) {
      const auth = RbacPolicy.canManageJob(user, existing);
      if (!auth.allowed) throw new Error(auth.reasonAr || 'Permission denied.');
    }
    const nowIso = new Date().toISOString();
    const merged: Job = { ...existing, ...updates, id: existing.id, createdAt: existing.createdAt, updatedAt: nowIso, lastCheckedAt: nowIso };
    const validation = validateJobBackend(merged);
    if (!validation.isValid) throw new Error('Validation failed: ' + validation.errors.join(' | '));
    if (updates.title || updates.city) {
      const { data: allJobs } = await client.from('jobs').select('*');
      const currentJobs = (allJobs || []).map(mapDbRowToJob);
      merged.slug = generateJobSlug(merged, currentJobs);
    }
    const row = mapJobToDbRow(merged);
    const { data, error } = await client.from('jobs').update(row).eq('legacy_id', id).select().single();
    if (error) { console.error('updateJob error:', error); throw new Error('Failed to update job: ' + error.message); }
    return mapDbRowToJob(data);
  }

  async deleteJob(id: string, user?: User | null): Promise<boolean> {
    const client = this.getClient();
    const existing = await this.getJobById(id, user);
    if (!existing) return false;
    if (user) {
      const auth = RbacPolicy.canManageJob(user, existing);
      if (!auth.allowed) throw new Error(auth.reasonAr || 'Permission denied.');
    }
    const { error } = await client.from('jobs').delete().eq('legacy_id', id);
    if (error) { console.error('deleteJob error:', error); throw new Error('Failed to delete job: ' + error.message); }
    return true;
  }

  async publishJob(id: string, user?: User | null): Promise<PublishResult> {
    const job = await this.getJobById(id, user);
    if (!job) return { success: false, errors: ['Job not found.'] };
    if (user) {
      const auth = RbacPolicy.canManageJob(user, job);
      if (!auth.allowed) return { success: false, errors: [auth.reasonAr || 'Permission denied.'] };
    }
    const validation = validateJob(job, 'published');
    if (!validation.canPublish) return { success: false, errors: validation.errors.map((e) => e.messageAr), warnings: validation.warnings.map((w) => w.messageAr) };
    const updated = await this.updateJob(id, { status: 'published' }, user);
    return { success: true, job: updated, warnings: validation.warnings.map((w) => w.messageAr) };
  }

  async pauseJob(id: string, user?: User | null): Promise<Job> { return this.updateJob(id, { status: 'paused' }, user); }
  async expireJob(id: string, user?: User | null): Promise<Job> { return this.updateJob(id, { status: 'expired' }, user); }
  async rejectJob(id: string, reason?: string, user?: User | null): Promise<Job> { return this.updateJob(id, { status: 'rejected' }, user); }

  async duplicateJob(id: string, user?: User | null): Promise<Job> {
    const original = await this.getJobById(id, user);
    if (!original) throw new Error('Job ' + id + ' not found.');
    if (user) {
      const auth = RbacPolicy.canCreateJob(user);
      if (!auth.allowed) throw new Error(auth.reasonAr || 'Permission denied.');
    }
    const nowIso = new Date().toISOString();
    const clonedData: Omit<Job, 'id' | 'createdAt' | 'updatedAt'> = { ...original, title: 'Copy of ' + original.title, status: 'draft', datePosted: nowIso, validThrough: null, importedAt: null, lastCheckedAt: null, slug: null };
    return this.createJob(clonedData, user);
  }

  async getAdminStats(): Promise<AdminStats> {
    const client = this.getClient();
    const { data, error } = await client.from('jobs').select('status, valid_through');
    if (error) return { total: 0, published: 0, pendingReview: 0, drafts: 0, expired: 0, rejected: 0, duplicate: 0, paused: 0 };
    const all = data || [];
    const stats: AdminStats = { total: all.length, published: 0, pendingReview: 0, drafts: 0, expired: 0, rejected: 0, duplicate: 0, paused: 0 };
    for (const job of all) {
      if (job.status === 'published') {
        if (job.valid_through && isJobExpiredByDate(job.valid_through)) stats.expired++;
        else stats.published++;
      } else if (job.status === 'pending_review') stats.pendingReview++;
      else if (job.status === 'draft') stats.drafts++;
      else if (job.status === 'expired') stats.expired++;
      else if (job.status === 'rejected') stats.rejected++;
      else if (job.status === 'duplicate') stats.duplicate++;
      else if (job.status === 'paused') stats.paused++;
    }
    return stats;
  }
}

export const productionJobRepository: IJobRepository = new ProductionJobRepository();