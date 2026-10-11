/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ============================================================================
 * BACKEND-SAFE JOB VALIDATION (PHASE 6)
 * ============================================================================
 * Enforces backend schema rules, GCC geographic hierarchy, salary ranges,
 * date integrity, and application routing methods.
 */

import { Job, JobStatus, WorkMode, EmploymentType, ApplicationMethod } from '../../types/job';
import { GCC_COUNTRIES } from '../../data/geoHierarchy';

const VALID_STATUSES: JobStatus[] = [
  'draft',
  'pending_review',
  'published',
  'paused',
  'expired',
  'rejected',
  'duplicate',
];

const VALID_WORK_MODES: WorkMode[] = ['on_site', 'remote', 'hybrid'];

const VALID_EMPLOYMENT_TYPES: EmploymentType[] = [
  'full_time',
  'part_time',
  'contract',
  'temporary',
  'internship',
];

const VALID_APPLICATION_METHODS: ApplicationMethod[] = ['external_url', 'email', 'direct'];

export interface JobBackendValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateJobBackend(job: Partial<Job>): JobBackendValidationResult {
  const errors: string[] = [];

  // 1. Required text fields
  if (!job.title || typeof job.title !== 'string' || job.title.trim().length < 3) {
    errors.push('عنوان الوظيفة مطلوب ويجب أن يحتوي على 3 أحرف على الأقل.');
  }

  if (!job.companyName || typeof job.companyName !== 'string' || job.companyName.trim().length < 2) {
    errors.push('اسم الشركة مطلوب.');
  }

  if (!job.description || typeof job.description !== 'string' || job.description.trim().length < 20) {
    errors.push('الوصف الوظيفي مطلوب ويجب ألا يقل عن 20 حرفاً.');
  }

  // 2. Geographic hierarchy (GCC Countries)
  if (!job.country || typeof job.country !== 'string' || job.country.trim() === '') {
    errors.push('الدولة مطلوبة.');
  } else {
    const recognized = GCC_COUNTRIES.some(
      (c) =>
        c.nameAr === job.country ||
        c.commonNameAr === job.country ||
        c.code.toLowerCase() === job.country?.toLowerCase() ||
        job.country?.includes(c.commonNameAr) ||
        job.country?.includes(c.nameAr)
    );
    if (!recognized) {
      errors.push('الدولة يجب أن تكون إحدى دول مجلس التعاون الخليجي (السعودية، الإمارات، قطر، الكويت، البحرين، عُمان).');
    }
  }

  if (!job.city || typeof job.city !== 'string' || job.city.trim() === '') {
    errors.push('المدينة مطلوبة.');
  }

  // 3. Work Mode & Employment Type
  if (job.workMode && !VALID_WORK_MODES.includes(job.workMode)) {
    errors.push(`نمط العمل غير صالح (${job.workMode}).`);
  }

  if (job.employmentType && !VALID_EMPLOYMENT_TYPES.includes(job.employmentType)) {
    errors.push(`نوع التوظيف غير صالح (${job.employmentType}).`);
  }

  // 4. Job Status
  if (job.status && !VALID_STATUSES.includes(job.status)) {
    errors.push(`حالة الوظيفة غير صالحة (${job.status}).`);
  }

  // 5. Dates
  if (job.datePosted) {
    const postedTime = new Date(job.datePosted).getTime();
    if (isNaN(postedTime)) {
      errors.push('تاريخ النشر غير صالح.');
    }
  }

  if (job.validThrough) {
    const validTime = new Date(job.validThrough).getTime();
    if (isNaN(validTime)) {
      errors.push('تاريخ انتهاء الصلاحية غير صالح.');
    } else if (job.datePosted) {
      const postedTime = new Date(job.datePosted).getTime();
      if (!isNaN(postedTime) && validTime < postedTime) {
        errors.push('تاريخ انتهاء الصلاحية لا يمكن أن يسبق تاريخ النشر.');
      }
    }
  }

  // 6. Salary values
  if (job.salaryMin !== null && job.salaryMin !== undefined) {
    if (typeof job.salaryMin !== 'number' || job.salaryMin < 0) {
      errors.push('الحد الأدنى للراتب يجب أن يكون رقماً موجباً.');
    }
  }

  if (job.salaryMax !== null && job.salaryMax !== undefined) {
    if (typeof job.salaryMax !== 'number' || job.salaryMax < 0) {
      errors.push('الحد الأقصى للراتب يجب أن يكون رقماً موجباً.');
    }
  }

  if (
    job.salaryMin !== null &&
    job.salaryMin !== undefined &&
    job.salaryMax !== null &&
    job.salaryMax !== undefined
  ) {
    if (job.salaryMax < job.salaryMin) {
      errors.push('الحد الأقصى للراتب لا يمكن أن يكون أقل من الحد الأدنى.');
    }
  }

  // 7. Experience values
  if (job.experienceMin !== null && job.experienceMin !== undefined) {
    if (typeof job.experienceMin !== 'number' || job.experienceMin < 0) {
      errors.push('الحد الأدنى لسنوات الخبرة يجب أن يكون رقماً موجباً.');
    }
  }

  if (job.experienceMax !== null && job.experienceMax !== undefined) {
    if (typeof job.experienceMax !== 'number' || job.experienceMax < 0) {
      errors.push('الحد الأقصى لسنوات الخبرة يجب أن يكون رقماً موجباً.');
    }
  }

  if (
    job.experienceMin !== null &&
    job.experienceMin !== undefined &&
    job.experienceMax !== null &&
    job.experienceMax !== undefined
  ) {
    if (job.experienceMax < job.experienceMin) {
      errors.push('الحد الأقصى لسنوات الخبرة لا يمكن أن يقل عن الحد الأدنى.');
    }
  }

  // 8. Application Method
  if (job.applicationMethod && !VALID_APPLICATION_METHODS.includes(job.applicationMethod)) {
    errors.push(`طريقة التقديم غير صالحة (${job.applicationMethod}).`);
  }

  if (job.applicationMethod === 'external_url') {
    if (!job.applicationUrl || typeof job.applicationUrl !== 'string') {
      errors.push('رابط التقديم الخارجي مطلوب عند اختيار التقديم عبر رابط.');
    } else {
      const trimmed = job.applicationUrl.trim();
      if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
        errors.push('رابط التقديم يجب أن يبدأ بـ http:// أو https://.');
      }
    }
  } else if (job.applicationMethod === 'email') {
    if (!job.applicationUrl || !job.applicationUrl.includes('@')) {
      errors.push('البريد الإلكتروني للتقديم مطلوب عند اختيار التقديم عبر البريد.');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
