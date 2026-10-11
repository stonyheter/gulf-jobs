/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Job } from '../types/job';
import { GCC_COUNTRIES } from '../data/geoHierarchy';
import { FEATURED_CATEGORIES } from '../config/categories';

/**
 * Normalizes text for URL slugs.
 * Supports Arabic and Latin characters, removes diacritics and punctuation,
 * and converts whitespace to single hyphens.
 */
export function normalizeSlugText(text: string): string {
  if (!text) return '';

  return (
    text
      // Remove Arabic diacritics / tashkeel
      .replace(/[\u064B-\u065F\u0670]/g, '')
      // Normalize Arabic letters
      .replace(/[أإآٱ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي')
      // Remove special characters, brackets, punctuation except letters and numbers
      .replace(/[^\p{L}\p{N}\s-]/gu, '')
      // Replace whitespace and underscores with a single hyphen
      .replace(/[\s_]+/g, '-')
      // Remove repeated hyphens
      .replace(/-+/g, '-')
      // Lowercase latin characters
      .toLowerCase()
      // Remove leading and trailing hyphens
      .replace(/^-+|-+$/g, '')
  );
}

/**
 * Creates a deterministic short hash from string for collision avoidance.
 */
function createShortHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36).slice(0, 4);
}

function getRawJobSlug(job: Pick<Job, 'title' | 'city' | 'companyName'>): string {
  const titlePart = normalizeSlugText(job.title) || 'job';
  const cityPart = normalizeSlugText(job.city);
  const companyPart = normalizeSlugText(job.companyName);

  let base = titlePart;
  if (cityPart) base += `-${cityPart}`;
  if (companyPart) base += `-${companyPart}`;
  if (base.length > 80) {
    base = base.slice(0, 80).replace(/-+$/, '');
  }
  return base;
}

/**
 * Generates a clean, stable SEO-friendly slug for a job.
 * Pattern: {title}-{city}-{company}
 * Falls back to deterministic suffix if title/city/company are identical to avoid collisions.
 */
export function generateJobSlug(job: Pick<Job, 'id' | 'title' | 'city' | 'companyName'>, existingJobs?: Job[]): string {
  const baseSlug = getRawJobSlug(job);

  // If existingJobs provided, check for slug collisions
  if (existingJobs && existingJobs.length > 0) {
    const hasCollision = existingJobs.some((other) => {
      if (other.id === job.id) return false;
      return getRawJobSlug(other) === baseSlug;
    });

    if (hasCollision) {
      const suffix = createShortHash(job.id);
      return `${baseSlug}-${suffix}`;
    }
  }

  return baseSlug;
}

/**
 * Standard country slug mapping
 */
export const COUNTRY_SLUG_MAP: Record<string, { ar: string; en: string; code: string }> = {
  'saudi-arabia': { ar: 'المملكة العربية السعودية', en: 'Saudi Arabia', code: 'SA' },
  'uae': { ar: 'الإمارات العربية المتحدة', en: 'United Arab Emirates', code: 'AE' },
  'united-arab-emirates': { ar: 'الإمارات العربية المتحدة', en: 'United Arab Emirates', code: 'AE' },
  'qatar': { ar: 'دولة قطر', en: 'Qatar', code: 'QA' },
  'kuwait': { ar: 'دولة الكويت', en: 'Kuwait', code: 'KW' },
  'bahrain': { ar: 'مملكة البحرين', en: 'Bahrain', code: 'BH' },
  'oman': { ar: 'سلطنة عُمان', en: 'Oman', code: 'OM' },
};

/**
 * Maps country name / ISO code to standard canonical slug.
 */
export function countryNameToSlug(countryName: string): string {
  const normalized = (countryName || '').trim();
  if (!normalized) return '';

  if (normalized.includes('سعود') || normalized === 'SA' || normalized.toLowerCase() === 'saudi arabia') {
    return 'saudi-arabia';
  }
  if (normalized.includes('إمارات') || normalized.includes('امارات') || normalized === 'AE' || normalized.toLowerCase().includes('emirates')) {
    return 'uae';
  }
  if (normalized.includes('قطر') || normalized === 'QA' || normalized.toLowerCase() === 'qatar') {
    return 'qatar';
  }
  if (normalized.includes('كويت') || normalized === 'KW' || normalized.toLowerCase() === 'kuwait') {
    return 'kuwait';
  }
  if (normalized.includes('بحرين') || normalized === 'BH' || normalized.toLowerCase() === 'bahrain') {
    return 'bahrain';
  }
  if (normalized.includes('عمان') || normalized.includes('عُمان') || normalized === 'OM' || normalized.toLowerCase() === 'oman') {
    return 'oman';
  }

  return normalizeSlugText(normalized);
}

/**
 * Resolves country canonical Arabic name from slug.
 */
export function slugToCountryName(slug: string): string | null {
  const found = COUNTRY_SLUG_MAP[slug.toLowerCase()];
  if (found) return found.ar;

  // Search in GCC_COUNTRIES
  const match = GCC_COUNTRIES.find(
    (c) =>
      c.code.toLowerCase() === slug.toLowerCase() ||
      normalizeSlugText(c.nameEn) === slug.toLowerCase() ||
      normalizeSlugText(c.commonNameAr) === slug.toLowerCase()
  );
  return match ? match.nameAr : null;
}

/**
 * Standard city slugs dictionary (common GCC cities)
 */
export const COMMON_CITY_SLUGS: Record<string, { ar: string; countryCode: string; countrySlug: string }> = {
  'riyadh': { ar: 'الرياض', countryCode: 'SA', countrySlug: 'saudi-arabia' },
  'dammam': { ar: 'الدمام', countryCode: 'SA', countrySlug: 'saudi-arabia' },
  'khobar': { ar: 'الخبر', countryCode: 'SA', countrySlug: 'saudi-arabia' },
  'dhahran': { ar: 'الظهران', countryCode: 'SA', countrySlug: 'saudi-arabia' },
  'jubail': { ar: 'الجبيل', countryCode: 'SA', countrySlug: 'saudi-arabia' },
  'jeddah': { ar: 'جدة', countryCode: 'SA', countrySlug: 'saudi-arabia' },
  'makkah': { ar: 'مكة المكرمة', countryCode: 'SA', countrySlug: 'saudi-arabia' },
  'kharj': { ar: 'الخرج', countryCode: 'SA', countrySlug: 'saudi-arabia' },
  'dubai': { ar: 'دبي', countryCode: 'AE', countrySlug: 'uae' },
  'abu-dhabi': { ar: 'أبوظبي', countryCode: 'AE', countrySlug: 'uae' },
  'al-ain': { ar: 'العين', countryCode: 'AE', countrySlug: 'uae' },
  'doha': { ar: 'الدوحة', countryCode: 'QA', countrySlug: 'qatar' },
  'al-rayyan': { ar: 'الريان', countryCode: 'QA', countrySlug: 'qatar' },
  'kuwait-city': { ar: 'مدينة الكويت', countryCode: 'KW', countrySlug: 'kuwait' },
  'manama': { ar: 'المنامة', countryCode: 'BH', countrySlug: 'bahrain' },
  'muscat': { ar: 'مسقط', countryCode: 'OM', countrySlug: 'oman' },
};

/**
 * Maps city name to clean slug.
 */
export function cityNameToSlug(cityName: string): string {
  const norm = (cityName || '').trim();
  for (const [slug, data] of Object.entries(COMMON_CITY_SLUGS)) {
    if (data.ar === norm || norm.includes(data.ar)) {
      return slug;
    }
  }

  // Also check GCC_COUNTRIES hierarchy
  for (const country of GCC_COUNTRIES) {
    for (const region of country.regions) {
      for (const city of region.cities) {
        if (city.nameAr === norm || norm.includes(city.nameAr)) {
          return normalizeSlugText(city.nameEn || city.id);
        }
      }
    }
  }

  return normalizeSlugText(norm);
}

/**
 * Resolves city Arabic name from slug.
 */
export function slugToCityName(slug: string, countrySlug?: string): string | null {
  const lower = slug.toLowerCase();
  if (COMMON_CITY_SLUGS[lower]) {
    return COMMON_CITY_SLUGS[lower].ar;
  }

  // Search hierarchy
  for (const country of GCC_COUNTRIES) {
    if (countrySlug && countryNameToSlug(country.nameAr) !== countrySlug) {
      continue;
    }
    for (const region of country.regions) {
      for (const city of region.cities) {
        if (
          city.id.toLowerCase() === lower ||
          normalizeSlugText(city.nameEn) === lower ||
          normalizeSlugText(city.nameAr) === lower
        ) {
          return city.nameAr;
        }
      }
    }
  }

  return null;
}

/**
 * Category/Specialty slug mappings
 */
export const SPECIALTY_SLUG_MAP: Record<string, { id: string; ar: string; en: string }> = {
  'tech': { id: 'tech', ar: 'تقنية المعلومات والبرمجة', en: 'Technology & Software' },
  'technology': { id: 'tech', ar: 'تقنية المعلومات والبرمجة', en: 'Technology & Software' },
  'software': { id: 'tech', ar: 'تقنية المعلومات والبرمجة', en: 'Technology & Software' },
  'engineering': { id: 'engineering', ar: 'الهندسة والإنشاءات', en: 'Engineering & Construction' },
  'oil-gas': { id: 'oil_gas', ar: 'النفط، الغاز والطاقة', en: 'Oil, Gas & Energy' },
  'energy': { id: 'oil_gas', ar: 'النفط، الغاز والطاقة', en: 'Oil, Gas & Energy' },
  'finance': { id: 'finance', ar: 'المالية والمصارف والمحاسبة', en: 'Finance & Banking' },
  'accounting': { id: 'finance', ar: 'المالية والمصارف والمحاسبة', en: 'Finance & Banking' },
  'healthcare': { id: 'healthcare', ar: 'الرعاية الصحية والطب', en: 'Healthcare & Medicine' },
  'medical': { id: 'healthcare', ar: 'الرعاية الصحية والطب', en: 'Healthcare & Medicine' },
  'logistics': { id: 'logistics', ar: 'اللوجستيات وسلاسل الإمداد', en: 'Logistics & Supply Chain' },
  'supply-chain': { id: 'logistics', ar: 'اللوجستيات وسلاسل الإمداد', en: 'Logistics & Supply Chain' },
  'sales-marketing': { id: 'sales_marketing', ar: 'التسويق والمبيعات الرقمية', en: 'Sales & Marketing' },
  'marketing': { id: 'sales_marketing', ar: 'التسويق والمبيعات الرقمية', en: 'Sales & Marketing' },
  'sales': { id: 'sales_marketing', ar: 'التسويق والمبيعات الرقمية', en: 'Sales & Marketing' },
  'admin': { id: 'admin', ar: 'الإدارة والموارد البشرية', en: 'Administration & HR' },
  'hr': { id: 'admin', ar: 'الإدارة والموارد البشرية', en: 'Administration & HR' },
};

/**
 * Maps category/specialty ID or text to URL-safe slug.
 */
export function specialtyToSlug(specialtyIdOrName: string): string {
  const input = (specialtyIdOrName || '').toLowerCase().trim();
  if (SPECIALTY_SLUG_MAP[input]) {
    return input.replace(/_/g, '-');
  }

  // Check matching category
  const match = FEATURED_CATEGORIES.find(
    (c) => c.id === input || c.nameAr === specialtyIdOrName || c.nameEn.toLowerCase() === input
  );
  if (match) {
    return match.id.replace(/_/g, '-');
  }

  return normalizeSlugText(specialtyIdOrName);
}

/**
 * Resolves category from slug.
 */
export function slugToSpecialty(slug: string): { id: string; nameAr: string; nameEn: string } | null {
  const norm = slug.toLowerCase().replace(/_/g, '-');
  const found = SPECIALTY_SLUG_MAP[norm];
  if (found) {
    return { id: found.id, nameAr: found.ar, nameEn: found.en };
  }

  const category = FEATURED_CATEGORIES.find(
    (c) => c.id.replace(/_/g, '-') === norm || normalizeSlugText(c.nameEn) === norm
  );
  if (category) {
    return { id: category.id, nameAr: category.nameAr, nameEn: category.nameEn };
  }

  return null;
}
