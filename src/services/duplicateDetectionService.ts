/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ============================================================================
 * DUPLICATE DETECTION SERVICE (DETERMINISTIC ARCHITECTURE)
 * ============================================================================
 * Provides deterministic deduplication logic comparing:
 * - Application URLs & Original Job URLs
 * - Company Name (normalized)
 * - Job Title (normalized)
 * - Geographic location (Country, Region, City)
 * 
 * Extensible for future AI/vector semantic deduplication without changing
 * the calling interface.
 */

import { Job } from '../types/job';

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  matchType: 'exact_application_url' | 'exact_original_url' | 'exact_title_company_location' | 'none';
  matchedJobId: string | null;
  matchedJobTitle: string | null;
  confidenceScore: number; // 0 to 1
  detailsAr: string;
}

/**
 * Normalizes Arabic and alphanumeric text for deterministic matching
 */
export function normalizeText(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    // Normalize Arabic alef variants
    .replace(/[أإآ]/g, 'ا')
    // Normalize taa marbuta to haa
    .replace(/ة/g, 'ه')
    // Normalize yaa variants
    .replace(/[ىي]/g, 'ي')
    // Remove diacritics / tashkeel
    .replace(/[\u064B-\u065F\u0670]/g, '')
    // Collapse whitespace and punctuation
    .replace(/[^\w\u0600-\u06FF]+/g, ' ')
    .trim();
}

/**
 * Normalizes URLs for matching (removes trailing slashes, fragments, tracking params)
 */
export function normalizeUrl(url: string | null | undefined): string {
  if (!url || typeof url !== 'string' || url.trim() === '') return '';
  try {
    const parsed = new URL(url.trim());
    // remove hash and common marketing UTM tracking parameters
    parsed.hash = '';
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'ref'].forEach((param) => {
      parsed.searchParams.delete(param);
    });
    let cleaned = parsed.toString().toLowerCase();
    if (cleaned.endsWith('/')) {
      cleaned = cleaned.slice(0, -1);
    }
    return cleaned;
  } catch {
    return url.trim().toLowerCase();
  }
}

/**
 * Checks a job candidate against an existing collection of jobs
 */
export function checkJobForDuplicates(
  candidate: Partial<Job>,
  existingJobs: Job[],
  excludeJobId?: string
): DuplicateCheckResult {
  const normTitle = normalizeText(candidate.title);
  const normCompany = normalizeText(candidate.companyName);
  const normAppUrl = normalizeUrl(candidate.applicationUrl);
  const normOrigUrl = normalizeUrl(candidate.originalJobUrl);
  const candidateCity = normalizeText(candidate.city);
  const candidateCountry = normalizeText(candidate.country);

  for (const existing of existingJobs) {
    if (excludeJobId && existing.id === excludeJobId) {
      continue;
    }

    // 1. Exact match on normalized originalJobUrl
    if (normOrigUrl && normOrigUrl.length > 10) {
      const existingOrigUrl = normalizeUrl(existing.originalJobUrl);
      if (existingOrigUrl && existingOrigUrl === normOrigUrl) {
        return {
          isDuplicate: true,
          matchType: 'exact_original_url',
          matchedJobId: existing.id,
          matchedJobTitle: existing.title,
          confidenceScore: 0.99,
          detailsAr: `تطابق كامل في رابط الإعلان الأصلي مع الوظيفة: «${existing.title}» (${existing.companyName}).`,
        };
      }
    }

    // 2. Exact match on normalized applicationUrl (if non-email external url)
    if (normAppUrl && normAppUrl.length > 10 && !normAppUrl.startsWith('mailto:')) {
      const existingAppUrl = normalizeUrl(existing.applicationUrl);
      if (existingAppUrl && existingAppUrl === normAppUrl) {
        return {
          isDuplicate: true,
          matchType: 'exact_application_url',
          matchedJobId: existing.id,
          matchedJobTitle: existing.title,
          confidenceScore: 0.95,
          detailsAr: `تطابق كامل في رابط التقديم الخارجي مع الوظيفة: «${existing.title}» (${existing.companyName}).`,
        };
      }
    }

    // 3. Exact match on Title + Company + Location
    if (normTitle && normCompany) {
      const existingTitle = normalizeText(existing.title);
      const existingCompany = normalizeText(existing.companyName);
      const existingCity = normalizeText(existing.city);
      const existingCountry = normalizeText(existing.country);

      const titleMatches = existingTitle === normTitle;
      const companyMatches = existingCompany === normCompany;
      const locationMatches =
        candidate.workMode === 'remote' ||
        (existingCountry === candidateCountry && (!candidateCity || existingCity === candidateCity));

      if (titleMatches && companyMatches && locationMatches) {
        return {
          isDuplicate: true,
          matchType: 'exact_title_company_location',
          matchedJobId: existing.id,
          matchedJobTitle: existing.title,
          confidenceScore: 0.9,
          detailsAr: `تطابق في المسمى والمنشأة والموقع مع الوظيفة المسجلة مسبقاً: «${existing.title}» (${existing.companyName}).`,
        };
      }
    }
  }

  return {
    isDuplicate: false,
    matchType: 'none',
    matchedJobId: null,
    matchedJobTitle: null,
    confidenceScore: 0,
    detailsAr: 'لم يتم العثور على أي تطابق مكرر مع الوظائف المسجلة.',
  };
}
