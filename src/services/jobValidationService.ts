/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ============================================================================
 * JOB QUALITY & VALIDATION SERVICE
 * ============================================================================
 * Enforces quality standards for jobs before publication or persistence.
 * Returns structured validation results with clear Arabic messages.
 */

import { Job, ApplicationMethod } from '../types/job';
import { GCC_COUNTRIES } from '../data/geoHierarchy';

export interface ValidationError {
  field: string;
  messageAr: string;
}

export interface ValidationWarning {
  field: string;
  messageAr: string;
}

export interface JobValidationResult {
  isValid: boolean; // Schema and basic completeness valid
  canPublish: boolean; // Strict criteria required for public visibility
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

/**
 * Checks whether a URL is structurally valid
 */
export function isValidUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string' || url.trim() === '') return false;
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Checks whether an email or mailto link is valid
 */
export function isValidEmailOrMailto(val: string | null | undefined): boolean {
  if (!val || typeof val !== 'string' || val.trim() === '') return false;
  const clean = val.trim().replace(/^mailto:/i, '');
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(clean);
}

/**
 * Helper to test whether a job's validThrough is in the past
 */
export function isJobExpiredByDate(validThrough: string | null | undefined): boolean {
  if (!validThrough) return false;
  try {
    const validDate = new Date(validThrough);
    const now = new Date();
    return validDate.getTime() < now.getTime();
  } catch {
    return false;
  }
}

/**
 * Validates a job object comprehensively.
 * Supports partial drafts and strict publication rules.
 */
export function validateJob(job: Partial<Job>, targetStatus: Job['status'] = job.status || 'draft'): JobValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // 1. Title validation
  if (!job.title || job.title.trim().length === 0) {
    errors.push({ field: 'title', messageAr: 'المسمى الوظيفي مطلوب.' });
  } else if (job.title.trim().length < 3) {
    errors.push({ field: 'title', messageAr: 'المسمى الوظيفي قصير جداً (3 أحرف على الأقل).' });
  }

  // 2. Company name validation
  if (!job.companyName || job.companyName.trim().length === 0) {
    errors.push({ field: 'companyName', messageAr: 'اسم المنشأة أو الشركة مطلوب.' });
  }

  // 3. Country validation
  if (!job.country || job.country.trim().length === 0) {
    errors.push({ field: 'country', messageAr: 'الدولة مطلوبة.' });
  } else {
    // Check if country matches GCC list
    const matchedCountry = GCC_COUNTRIES.find(
      (c) => c.commonNameAr === job.country || c.nameAr === job.country || c.code === job.country
    );

    if (matchedCountry) {
      // Check region requirement for GCC countries
      if (job.workMode !== 'remote' && (!job.region || job.region.trim().length === 0)) {
        errors.push({
          field: 'region',
          messageAr: `يرجى تحديد المنطقة أو الإمارة أو المحافظة التابعة لـ ${matchedCountry.commonNameAr}.`,
        });
      } else if (job.region) {
        const matchedRegion = matchedCountry.regions.find(
          (r) => r.nameAr === job.region || r.id === job.region
        );

        if (!matchedRegion && job.workMode !== 'remote') {
          errors.push({
            field: 'region',
            messageAr: `المنطقة المختارة «${job.region}» لا تنتمي إلى دولة ${matchedCountry.commonNameAr}.`,
          });
        } else if (matchedRegion && job.city && job.city.trim().length > 0) {
          const matchedCity = matchedRegion.cities.find(
            (city) => city.nameAr === job.city || city.id === job.city
          );

          if (!matchedCity && job.workMode !== 'remote') {
            errors.push({
              field: 'city',
              messageAr: `المدينة المختارة «${job.city}» لا تنتمي إلى منطقة «${matchedRegion.nameAr}».`,
            });
          }
        }
      }
    }
  }

  // 4. Application method validation
  if (!job.applicationMethod) {
    errors.push({ field: 'applicationMethod', messageAr: 'طريقة التقديم على الوظيفة مطلوبة.' });
  } else {
    if (job.applicationMethod === 'external_url') {
      if (!job.applicationUrl || job.applicationUrl.trim().length === 0) {
        errors.push({ field: 'applicationUrl', messageAr: 'رابط التقديم الخارجي مطلوب عند اختيار التقديم عبر رابط.' });
      } else if (!isValidUrl(job.applicationUrl)) {
        errors.push({ field: 'applicationUrl', messageAr: 'رابط التقديم غير صالح، يجب أن يبدأ بـ http:// أو https://' });
      }
    } else if (job.applicationMethod === 'email') {
      if (!job.applicationUrl || job.applicationUrl.trim().length === 0) {
        errors.push({ field: 'applicationUrl', messageAr: 'البريد الإلكتروني للتقديم مطلوب.' });
      } else if (!isValidEmailOrMailto(job.applicationUrl)) {
        errors.push({ field: 'applicationUrl', messageAr: 'صيغة البريد الإلكتروني للتقديم غير صحيحة.' });
      }
    }
  }

  // 5. Source URL validation (if provided)
  if (job.sourceUrl && job.sourceUrl.trim().length > 0 && !isValidUrl(job.sourceUrl)) {
    errors.push({ field: 'sourceUrl', messageAr: 'رابط المصدر غير صالح، يجب أن يبدأ بـ http:// أو https://' });
  }

  // 6. Original Job URL validation (if provided)
  if (job.originalJobUrl && job.originalJobUrl.trim().length > 0 && !isValidUrl(job.originalJobUrl)) {
    errors.push({ field: 'originalJobUrl', messageAr: 'رابط الإعلان الأصلي غير صالح، يجب أن يبدأ بـ http:// أو https://' });
  }

  // 7. Dates validation
  if (!job.datePosted) {
    errors.push({ field: 'datePosted', messageAr: 'تاريخ نشر الإعلان مطلوب.' });
  } else {
    const postedTime = new Date(job.datePosted).getTime();
    if (isNaN(postedTime)) {
      errors.push({ field: 'datePosted', messageAr: 'تاريخ نشر الإعلان غير صالح.' });
    } else if (job.validThrough) {
      const validThroughTime = new Date(job.validThrough).getTime();
      if (isNaN(validThroughTime)) {
        errors.push({ field: 'validThrough', messageAr: 'تاريخ انتهاء الصلاحية غير صالح.' });
      } else if (validThroughTime <= postedTime) {
        errors.push({ field: 'validThrough', messageAr: 'تاريخ انتهاء الصلاحية يجب أن يكون بعد تاريخ النشر.' });
      }
    }
  }

  // 8. Quality warnings (beneficial for publication readiness)
  if (!job.description || job.description.trim().length < 20) {
    warnings.push({ field: 'description', messageAr: 'الوصف الوظيفي مختصر جداً، يُفضل إضافة تفاصيل أوضح للمتقدمين.' });
  }

  if (!job.skills || job.skills.length === 0) {
    warnings.push({ field: 'skills', messageAr: 'لم يتم تحديد مهارات مطلوبة للوظيفة.' });
  }

  if (!job.category) {
    warnings.push({ field: 'category', messageAr: 'لم يتم تصنيف الوظيفة تحت قطاع مهني محدد.' });
  }

  // Check salary consistency
  if (job.salaryMin !== null && job.salaryMin !== undefined && job.salaryMax !== null && job.salaryMax !== undefined) {
    if (job.salaryMin > job.salaryMax) {
      errors.push({ field: 'salaryMin', messageAr: 'الحد الأدنى للراتب لا يمكن أن يكون أعلى من الحد الأقصى.' });
    }
  }

  // Check experience consistency
  if (job.experienceMin !== null && job.experienceMin !== undefined && job.experienceMax !== null && job.experienceMax !== undefined) {
    if (job.experienceMin > job.experienceMax) {
      errors.push({ field: 'experienceMin', messageAr: 'الحد الأدنى لسنوات الخبرة لا يمكن أن يتجاوز الحد الأقصى.' });
    }
  }

  // 9. Publication Readiness (Strict rules for targetStatus === 'published')
  let canPublish = errors.length === 0;

  if (targetStatus === 'published') {
    // Cannot publish if validThrough is already in the past
    if (job.validThrough && isJobExpiredByDate(job.validThrough)) {
      errors.push({
        field: 'validThrough',
        messageAr: 'لا يمكن نشر إعلان منتهي الصلاحية. يرجى تجديد تاريخ الصلاحية أو حفظه كمنتهي (expired).',
      });
      canPublish = false;
    }

    // Must have description
    if (!job.description || job.description.trim().length < 10) {
      errors.push({
        field: 'description',
        messageAr: 'الوصف الوظيفي إلزامي قبل نشر الإعلان للعامة.',
      });
      canPublish = false;
    }
  }

  return {
    isValid: errors.length === 0,
    canPublish: canPublish && errors.length === 0,
    errors,
    warnings,
  };
}
