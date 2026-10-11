/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RouteMatch } from '../types/seo';
import { Job } from '../types/job';
import { generateJobSlug } from './slugUtils';

/**
 * Parses the current pathname into a structured RouteMatch.
 */
export function parseRoute(pathname: string): RouteMatch {
  // Normalize pathname: remove multiple slashes, trailing slash
  const clean = pathname.replace(/\/+/g, '/').replace(/\/+$/, '') || '/';

  if (clean === '/' || clean === '') {
    return { type: 'home' };
  }

  if (clean === '/jobs') {
    return { type: 'jobs_index' };
  }

  if (clean === '/profile') {
    return { type: 'profile' };
  }

  if (clean === '/saved' || clean === '/saved-jobs') {
    return { type: 'saved_jobs' };
  }

  if (clean === '/suitable' || clean === '/suitable-jobs') {
    return { type: 'suitable_jobs' };
  }

  if (clean === '/my-applications' || clean === '/applications') {
    return { type: 'my_applications' };
  }

  if (clean === '/admin' || clean.startsWith('/admin/')) {
    return { type: 'admin' };
  }

  // Individual Job page: /job/{job-slug}
  if (clean.startsWith('/job/')) {
    const slug = clean.slice('/job/'.length).trim();
    if (slug) {
      return { type: 'job_detail', jobSlug: slug };
    }
  }

  // Location / Category pages:
  // /jobs/{country}
  // /jobs/{country}/{city}
  // /jobs/{country}/{city}/{specialty}
  if (clean.startsWith('/jobs/')) {
    const segments = clean.slice('/jobs/'.length).split('/').filter(Boolean);

    if (segments.length === 1) {
      if (segments[0] === 'suitable') {
        return { type: 'suitable_jobs' };
      }
      return { type: 'jobs_country', countrySlug: segments[0] };
    }

    if (segments.length === 2) {
      return {
        type: 'jobs_city',
        countrySlug: segments[0],
        citySlug: segments[1],
      };
    }

    if (segments.length >= 3) {
      return {
        type: 'jobs_specialty',
        countrySlug: segments[0],
        citySlug: segments[1],
        specialtySlug: segments[2],
      };
    }
  }

  return { type: 'unknown' };
}

/**
 * Finds a matching job from the dataset given a URL slug.
 */
export function findJobBySlug(slug: string, jobs: Job[]): Job | null {
  if (!slug || !jobs || jobs.length === 0) return null;

  // 1. Direct match on generated slug
  const directMatch = jobs.find((j) => generateJobSlug(j, jobs) === slug);
  if (directMatch) return directMatch;

  // 2. Case-insensitive or normalized match
  const lowerSlug = slug.toLowerCase();
  const caseMatch = jobs.find((j) => generateJobSlug(j, jobs).toLowerCase() === lowerSlug);
  if (caseMatch) return caseMatch;

  // 3. Fallback: match by ID if slug ends with job ID suffix or equals job ID
  const idMatch = jobs.find((j) => j.id === slug || lowerSlug.endsWith(j.id.toLowerCase()));
  if (idMatch) return idMatch;

  return null;
}
