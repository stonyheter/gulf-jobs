/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Job, WorkMode, EmploymentType, EducationLevel } from '../types/job';

/**
 * Formats structured location according to project requirements:
 * "📍 المنطقة الشرقية — الدمام"
 * "📍 المنطقة الشرقية — الدمام — حي الشاطئ"
 * "🌐 عن بُعد"
 * "🏢 هجين — الرياض"
 */
export function formatLocation(job: Pick<Job, 'workMode' | 'country' | 'region' | 'city' | 'district'>): string {
  if (job.workMode === 'remote') {
    return '🌐 عن بُعد';
  }

  const parts: string[] = [];

  if (job.workMode === 'hybrid') {
    if (job.city) {
      return `🏢 هجين — ${job.city}`;
    }
    return '🏢 عمل هجين';
  }

  // on_site
  if (job.region) {
    parts.push(job.region);
  }
  if (job.city) {
    parts.push(job.city);
  }
  if (job.district) {
    parts.push(job.district);
  }

  if (parts.length > 0) {
    return `📍 ${parts.join(' — ')}`;
  }

  return `📍 ${job.country}`;
}

/**
 * Full hierarchical location for detailed views
 */
export function formatFullLocation(job: Pick<Job, 'country' | 'region' | 'city' | 'district' | 'address'>): string {
  const segments: string[] = [];
  if (job.country) segments.push(job.country);
  if (job.region) segments.push(job.region);
  if (job.city) segments.push(job.city);
  if (job.district) segments.push(job.district);
  if (job.address) segments.push(job.address);

  return segments.join(' — ');
}

/**
 * Work mode Arabic label
 */
export function getWorkModeLabel(mode: WorkMode): string {
  switch (mode) {
    case 'remote':
      return 'عن بُعد';
    case 'hybrid':
      return 'هجين';
    case 'on_site':
      return 'حضوري';
    default:
      return 'غير محدد';
  }
}

/**
 * Employment type Arabic label
 */
export function getEmploymentTypeLabel(type: EmploymentType): string {
  switch (type) {
    case 'full_time':
      return 'دوام كامل';
    case 'part_time':
      return 'دوام جزئي';
    case 'contract':
      return 'عقد محدد المدة';
    case 'temporary':
      return 'مؤقت';
    case 'internship':
      return 'تدريب تعاوني / خريج';
    default:
      return 'غير محدد';
  }
}

/**
 * Education level Arabic label
 */
export function getEducationLevelLabel(level: EducationLevel | string | null | undefined): string {
  switch (level) {
    case 'high_school':
      return 'ثانوية عامة';
    case 'diploma':
      return 'دبلوم';
    case 'bachelor':
      return 'بكالوريوس';
    case 'master':
      return 'ماجستير';
    case 'phd':
      return 'دكتوراه';
    case 'not_specified':
      return 'بدون مؤهل محدد';
    default:
      return level ?? 'غير محدد';
  }
}

/**
 * Formats experience requirements cleanly
 */
export function formatExperience(min: number | null, max: number | null): string {
  if (min === null && max === null) {
    return 'الخبرة غير محددة';
  }
  if (min === 0 && (max === null || max === 0)) {
    return 'بدون خبرة مطلوبة (خريج جديد)';
  }
  if (min !== null && min > 0 && max !== null && max > min) {
    return `من ${min} إلى ${max} سنوات خبرة`;
  }
  if (min !== null && min > 0 && !max) {
    return `${min}+ سنوات خبرة`;
  }
  if (min === 0 && max !== null) {
    return `حتى ${max} سنوات خبرة`;
  }
  return 'الخبرة غير محددة';
}

/**
 * Currency code to Arabic symbol
 */
export function formatCurrency(currency: string | null): string {
  if (!currency) return '';
  const map: Record<string, string> = {
    SAR: 'ر.س',
    AED: 'د.إ',
    QAR: 'ر.ق',
    KWD: 'د.ك',
    BHD: 'د.ب',
    OMR: 'ر.ع',
    USD: '$',
  };
  return map[currency] || currency;
}

/**
 * Salary display with currency
 */
export function formatSalary(
  min: number | null,
  max: number | null,
  currency: string | null
): { text: string; isDisclosed: boolean } {
  if (min === null && max === null) {
    return { text: 'الراتب غير معلن', isDisclosed: false };
  }

  const curr = formatCurrency(currency);

  if (min !== null && max !== null) {
    return {
      text: `${min.toLocaleString('ar-SA')} - ${max.toLocaleString('ar-SA')} ${curr} / شهرياً`,
      isDisclosed: true,
    };
  }

  if (min !== null) {
    return {
      text: `يبدأ من ${min.toLocaleString('ar-SA')} ${curr} / شهرياً`,
      isDisclosed: true,
    };
  }

  if (max !== null) {
    return {
      text: `حتى ${max.toLocaleString('ar-SA')} ${curr} / شهرياً`,
      isDisclosed: true,
    };
  }

  return { text: 'الراتب غير معلن', isDisclosed: false };
}
