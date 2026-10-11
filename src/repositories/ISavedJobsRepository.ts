/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ============================================================================
 * SAVED JOBS REPOSITORY CONTRACT (PHASE 6)
 * ============================================================================
 */

import { Job } from '../types/job';
import { User } from '../types/auth';

export interface ISavedJobsRepository {
  saveJob(jobId: string, user?: User | null): Promise<boolean>;
  unsaveJob(jobId: string, user?: User | null): Promise<boolean>;
  isJobSaved(jobId: string, user?: User | null): Promise<boolean>;
  getSavedJobIds(user?: User | null): Promise<string[]>;
  getSavedJobs(user?: User | null): Promise<Job[]>;
  clearSavedJobs(user?: User | null): Promise<void>;
}
