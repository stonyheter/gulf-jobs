/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ============================================================================
 * JOB REPOSITORY CONTRACT (PHASE 6)
 * ============================================================================
 * Standardized repository interface decoupling data source from UI views.
 */

import { Job, JobCategory, JobStatus } from '../types/job';
import { JobFilterState } from '../types/filters';
import { User } from '../types/auth';

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
  includeAllStatuses?: boolean;
  statusFilter?: JobStatus | 'all';
  categoryFilter?: string;
  user?: User | null;
}

export interface PublishResult {
  success: boolean;
  job?: Job;
  errors?: string[];
  warnings?: string[];
}

export interface IJobRepository {
  // Discovery & Search
  getJobs(filters?: Partial<JobFilterState>, options?: JobQueryOptions): Promise<JobQueryResult>;
  getJobById(id: string, user?: User | null): Promise<Job | null>;
  getLatestJobs(limit?: number): Promise<Job[]>;
  getTodayJobs(): Promise<Job[]>;
  getRemoteJobs(): Promise<Job[]>;
  getEntryLevelJobs(): Promise<Job[]>;
  getCategories(): Promise<JobCategory[]>;
  getCountryStats(): Promise<CountryStat[]>;

  // Admin Management & Mutation with RBAC
  createJob(jobData: Omit<Job, 'id' | 'createdAt' | 'updatedAt'>, user?: User | null): Promise<Job>;
  updateJob(id: string, updates: Partial<Job>, user?: User | null): Promise<Job>;
  deleteJob(id: string, user?: User | null): Promise<boolean>;
  publishJob(id: string, user?: User | null): Promise<PublishResult>;
  pauseJob(id: string, user?: User | null): Promise<Job>;
  expireJob(id: string, user?: User | null): Promise<Job>;
  rejectJob(id: string, reason?: string, user?: User | null): Promise<Job>;
  duplicateJob(id: string, user?: User | null): Promise<Job>;
  getAdminStats(): Promise<AdminStats>;

  // Lifecycle & environment utilities
  resetToMockData(): Promise<void>;
  isDevelopmentPersistence(): boolean;
}
