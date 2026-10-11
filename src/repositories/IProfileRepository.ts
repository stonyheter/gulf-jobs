/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ============================================================================
 * PROFILE REPOSITORY CONTRACT (PHASE 6)
 * ============================================================================
 */

import { JobSeekerProfile, ProfileCompletionMetrics } from '../types/profile';
import { User } from '../types/auth';

export interface IProfileRepository {
  getProfile(userId?: string): Promise<JobSeekerProfile | null>;
  saveProfile(profileData: Partial<JobSeekerProfile>, user?: User | null): Promise<JobSeekerProfile>;
  clearProfile(userId?: string, user?: User | null): Promise<void>;
  getMetrics(profile: JobSeekerProfile | null): ProfileCompletionMetrics;
  loadSampleProfile(user?: User | null): Promise<JobSeekerProfile>;
}
