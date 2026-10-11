/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ============================================================================
 * SUITABLE JOBS SERVICE (PHASE 4.1)
 * ============================================================================
 * Provides deterministic ranking of public jobs personalized to a job seeker's
 * profile using the existing Phase 4 compatibility engine.
 * 
 * Rules:
 * 1. Strictly reuses existing analyzeJobCompatibility() from matchingService.
 * 2. Does NOT alter weights, scoring, or matching rules.
 * 3. Returns jobs paired with their structured CompatibilityResult.
 * 4. Sorts by matchPercentage descending (highest compatibility first).
 * 5. Deterministic and in-memory (no network requests).
 */

import { Job } from '../types/job';
import { JobSeekerProfile } from '../types/profile';
import { CompatibilityResult } from '../types/jobMatch';
import { analyzeJobCompatibility } from './matchingService';

export interface SuitableJobItem {
  job: Job;
  compatibility: CompatibilityResult;
}

/**
 * Calculates compatibility for all provided jobs against the given profile
 * and sorts them by compatibility percentage descending.
 */
export function getSuitableJobs(
  profile: JobSeekerProfile | null,
  jobs: Job[]
): SuitableJobItem[] {
  if (!profile || !jobs || jobs.length === 0) {
    return [];
  }

  const results: SuitableJobItem[] = [];

  for (const job of jobs) {
    const analysis = analyzeJobCompatibility(job, profile);
    if (analysis) {
      results.push({
        job,
        compatibility: analysis,
      });
    }
  }

  // Sort descending by matchPercentage
  results.sort((a, b) => b.compatibility.matchPercentage - a.compatibility.matchPercentage);

  return results;
}
