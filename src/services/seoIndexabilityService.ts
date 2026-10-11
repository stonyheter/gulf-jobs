/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Job } from '../types/job';
import { isJobExpiredByDate } from './jobValidationService';

export interface IndexabilityDecision {
  isIndexable: boolean;
  robotsDirective: 'index, follow' | 'noindex, follow' | 'noindex, nofollow';
  reason: string;
}

/**
 * Minimum number of meaningful published jobs required for a location or category page
 * to be considered indexable and avoid thin/doorway pages.
 */
export const MIN_JOBS_FOR_INDEXABLE_LOCATION_PAGE = 1;

/**
 * Determines whether an individual job posting is indexable by search engines.
 *
 * Rules:
 * - Published status ONLY
 * - Not expired (by status or by validThrough date)
 * - Required content fields present (title, companyName, description, city, country, datePosted)
 * - Non-indexable statuses: draft, pending_review, rejected, duplicate, paused, expired
 */
export function evaluateJobIndexability(job: Job | null | undefined): IndexabilityDecision {
  if (!job) {
    return {
      isIndexable: false,
      robotsDirective: 'noindex, nofollow',
      reason: 'Job not found',
    };
  }

  // Check expired status or date
  if (job.status === 'expired' || isJobExpiredByDate(job.validThrough)) {
    return {
      isIndexable: false,
      robotsDirective: 'noindex, follow',
      reason: 'Job posting is expired',
    };
  }

  // Check job status
  if (job.status !== 'published') {
    return {
      isIndexable: false,
      robotsDirective: 'noindex, nofollow',
      reason: `Job status is "${job.status}" (only "published" jobs are indexable)`,
    };
  }

  // Validate required fields
  if (!job.title?.trim() || !job.companyName?.trim() || !job.description?.trim()) {
    return {
      isIndexable: false,
      robotsDirective: 'noindex, follow',
      reason: 'Job is missing essential content fields (title, company, or description)',
    };
  }

  if (!job.country?.trim() || !job.city?.trim() || !job.datePosted) {
    return {
      isIndexable: false,
      robotsDirective: 'noindex, follow',
      reason: 'Job is missing essential location or posting date fields',
    };
  }

  return {
    isIndexable: true,
    robotsDirective: 'index, follow',
    reason: 'Job is actively published with complete required content',
  };
}

/**
 * Determines whether a location or specialty landing page is indexable.
 * Protects against thin, empty, or doorway SEO pages.
 */
export function evaluateLocationPageIndexability(publishedJobCount: number): IndexabilityDecision {
  if (publishedJobCount >= MIN_JOBS_FOR_INDEXABLE_LOCATION_PAGE) {
    return {
      isIndexable: true,
      robotsDirective: 'index, follow',
      reason: `Page contains ${publishedJobCount} meaningful published job(s)`,
    };
  }

  return {
    isIndexable: false,
    robotsDirective: 'noindex, follow',
    reason: 'Page has no published jobs (thin/empty page protection)',
  };
}

/**
 * Indexability decision for system views:
 * - Admin: never indexable (noindex, nofollow)
 * - Profile: never indexable (noindex, nofollow)
 * - Saved jobs: never indexable (noindex, nofollow)
 * - Suitable jobs: never indexable (personalized, noindex, nofollow)
 * - Search results / faceted filters: never indexable by default (noindex, follow)
 */
export function evaluateSystemViewIndexability(
  view: 'admin' | 'profile' | 'saved_jobs' | 'suitable_jobs' | 'search_filter_state'
): IndexabilityDecision {
  switch (view) {
    case 'admin':
      return {
        isIndexable: false,
        robotsDirective: 'noindex, nofollow',
        reason: 'Administrative control panels are strictly private',
      };
    case 'profile':
      return {
        isIndexable: false,
        robotsDirective: 'noindex, nofollow',
        reason: 'User profile pages contain private personal data',
      };
    case 'saved_jobs':
      return {
        isIndexable: false,
        robotsDirective: 'noindex, nofollow',
        reason: 'Saved jobs list is user-specific session data',
      };
    case 'suitable_jobs':
      return {
        isIndexable: false,
        robotsDirective: 'noindex, nofollow',
        reason: 'Personalized matching view is dynamic and user-profile dependent',
      };
    case 'search_filter_state':
      return {
        isIndexable: false,
        robotsDirective: 'noindex, follow',
        reason: 'Dynamic filter combinations should not create duplicate indexable pages',
      };
  }
}
