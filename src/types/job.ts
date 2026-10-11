/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type WorkMode = 'on_site' | 'remote' | 'hybrid';

export type EmploymentType =
  | 'full_time'
  | 'part_time'
  | 'contract'
  | 'temporary'
  | 'internship';

export type ApplicationMethod = 'external_url' | 'email' | 'direct';

export type JobStatus =
  | 'draft'
  | 'pending_review'
  | 'published'
  | 'paused'
  | 'expired'
  | 'rejected'
  | 'duplicate';

export type EducationLevel =
  | 'high_school'
  | 'diploma'
  | 'bachelor'
  | 'master'
  | 'phd'
  | 'not_specified';

/**
 * Standard Job Model for Gulf Jobs (وظائف الخليج)
 * Meets all 32 required core fields plus source audit metadata.
 */
export interface Job {
  id: string;
  title: string;
  companyId?: string | null;
  companyName: string;
  companyLogo: string | null;
  category: string | null; // e.g. "tech", "engineering", "oil_gas", "finance"
  country: string; // e.g. "المملكة العربية السعودية" or ISO code
  region: string | null; // e.g. "المنطقة الشرقية", "إمارة دبي"
  city: string; // e.g. "الدمام", "الرياض", "دبي"
  district: string | null; // e.g. "حي الشاطئ" or null
  address: string | null; // specific street address if available, or null
  workMode: WorkMode;
  employmentType: EmploymentType;
  experienceMin: number | null; // minimum years, 0 for entry level, null if not specified
  experienceMax: number | null; // maximum years, null if not specified
  education: string | null; // e.g. "بكالوريوس", "دبلوم", or null
  salaryMin: number | null; // minimum salary, null if not disclosed
  salaryMax: number | null; // maximum salary, null if not disclosed
  salaryCurrency: string | null; // "SAR", "AED", "QAR", "KWD", "BHD", "OMR"
  description: string;
  responsibilities: string[];
  requirements: string[];
  skills: string[];
  languages: string[];
  benefits: string[];
  applicationMethod: ApplicationMethod;
  applicationUrl: string | null;
  sourceName: string | null;
  sourceUrl: string | null;
  originalJobUrl: string | null;
  datePosted: string; // ISO 8601 date string e.g. "2026-09-25T10:00:00Z"
  validThrough: string | null;
  status: JobStatus;
  slug?: string | null;
  createdAt: string;
  updatedAt: string;
  importedAt?: string | null;
  lastCheckedAt?: string | null;
}

export interface JobCategory {
  id: string;
  nameAr: string;
  nameEn: string;
  iconName: string;
  jobCount?: number;
}
