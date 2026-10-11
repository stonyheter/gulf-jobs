/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ============================================================================
 * PRODUCTION APPLICATION REPOSITORY IMPLEMENTATION (PHASE 6)
 * ============================================================================
 */

import { IApplicationRepository } from './IApplicationRepository';
import { Application } from '../types/application';
import { User } from '../types/auth';
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase/client';

const APPLICATIONS_STORAGE_KEY = 'gulf_jobs_prod_applications_v1';

export class ProductionApplicationRepository implements IApplicationRepository {
  private applications: Map<string, Application> = new Map();
  private initialized = false;

  constructor() {
    this.init();
  }

  private init(): void {
    if (this.initialized) return;

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const raw = window.localStorage.getItem(APPLICATIONS_STORAGE_KEY);
        if (raw) {
          const parsed: Application[] = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            parsed.forEach((a) => this.applications.set(a.id, a));
          }
        }
      } catch (e) {
        console.warn('Failed to load applications from persistence', e);
      }
    }

    this.initialized = true;
  }

  private persist(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const list = Array.from(this.applications.values());
        window.localStorage.setItem(APPLICATIONS_STORAGE_KEY, JSON.stringify(list));
      } catch (e) {
        console.warn('Failed to persist applications', e);
      }
    }
  }

  async createApplication(
    user: User,
    data: { jobId: string; coverLetter?: string; cvFileId?: string }
  ): Promise<Application> {
    this.init();
    if (!data.jobId) {
      throw new Error('معرف الوظيفة مطلوب لتقديم الطلب.');
    }

    const now = new Date().toISOString();
    const appId = `app-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

    const newApp: Application = {
      id: appId,
      jobId: data.jobId,
      applicantUserId: user.id,
      status: 'pending',
      coverLetter: data.coverLetter || null,
      cvFileId: data.cvFileId || null,
      createdAt: now,
      updatedAt: now,
    };

    this.applications.set(appId, newApp);
    this.persist();

    // Supabase sync
    const client = getSupabaseClient();
    if (client && isSupabaseConfigured()) {
      try {
        await client.from('applications').insert({
          job_id: data.jobId,
          applicant_user_id: user.id,
          status: 'pending',
          cover_letter: data.coverLetter || null,
          cv_file_id: data.cvFileId || null,
        });
      } catch (err) {
        console.warn('Supabase createApplication sync notice:', err);
      }
    }

    return { ...newApp };
  }

  async getApplicationById(user: User, id: string): Promise<Application | null> {
    this.init();
    const app = this.applications.get(id);
    if (!app) return null;

    // RBAC: only applicant, employer for that job, or admin
    if (user.role !== 'admin' && user.id !== app.applicantUserId) {
      return null;
    }

    return { ...app };
  }

  async getUserApplications(user: User): Promise<Application[]> {
    this.init();

    // Supabase sync
    const client = getSupabaseClient();
    if (client && isSupabaseConfigured()) {
      try {
        const { data, error } = await client
          .from('applications')
          .select('*')
          .eq('applicant_user_id', user.id);
        if (!error && data) {
          return data.map((a: any) => ({
            id: a.id,
            jobId: a.job_id,
            applicantUserId: a.applicant_user_id,
            status: a.status,
            coverLetter: a.cover_letter ?? null,
            cvFileId: a.cv_file_id ?? null,
            createdAt: a.created_at,
            updatedAt: a.updated_at,
          }));
        }
      } catch (err) {
        console.warn('Supabase getUserApplications sync notice:', err);
      }
    }

    return Array.from(this.applications.values())
      .filter((a) => a.applicantUserId === user.id)
      .map((a) => ({ ...a }));
  }

  async getJobApplications(user: User, jobId: string): Promise<Application[]> {
    this.init();
    // Only employer or admin can see all applications for a job
    if (user.role !== 'admin' && user.role !== 'employer') {
      return [];
    }

    // Supabase sync
    const client = getSupabaseClient();
    if (client && isSupabaseConfigured()) {
      try {
        const { data, error } = await client
          .from('applications')
          .select('*')
          .eq('job_id', jobId);
        if (!error && data) {
          return data.map((a: any) => ({
            id: a.id,
            jobId: a.job_id,
            applicantUserId: a.applicant_user_id,
            status: a.status,
            coverLetter: a.cover_letter ?? null,
            cvFileId: a.cv_file_id ?? null,
            createdAt: a.created_at,
            updatedAt: a.updated_at,
          }));
        }
      } catch (err) {
        console.warn('Supabase getJobApplications sync notice:', err);
      }
    }

    return Array.from(this.applications.values())
      .filter((a) => a.jobId === jobId)
      .map((a) => ({ ...a }));
  }

  async updateApplicationStatus(
    user: User,
    id: string,
    status: Application['status']
  ): Promise<Application> {
    this.init();
    const existing = this.applications.get(id);
    if (!existing) {
      throw new Error('الطلب غير موجود.');
    }

    // Admin or employer can update any status; applicant can withdraw their own application
    const isApplicantWithdrawing = status === 'withdrawn' && user.id === existing.applicantUserId;
    if (user.role !== 'admin' && user.role !== 'employer' && !isApplicantWithdrawing) {
      throw new Error('غير مصرح لك بتحديث حالة الطلب.');
    }

    const updated: Application = {
      ...existing,
      status,
      updatedAt: new Date().toISOString(),
    };

    this.applications.set(id, updated);
    this.persist();

    // Supabase sync
    const client = getSupabaseClient();
    if (client && isSupabaseConfigured()) {
      try {
        await client
          .from('applications')
          .update({ status })
          .eq('id', id);
      } catch (err) {
        console.warn('Supabase updateApplicationStatus sync notice:', err);
      }
    }

    return { ...updated };
  }
}

export const applicationRepository: IApplicationRepository = new ProductionApplicationRepository();
