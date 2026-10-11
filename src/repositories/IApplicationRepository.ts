/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ============================================================================
 * APPLICATION REPOSITORY CONTRACT (PHASE 6)
 * ============================================================================
 */

import { Application } from '../types/application';
import { User } from '../types/auth';

export interface IApplicationRepository {
  createApplication(
    user: User,
    data: { jobId: string; coverLetter?: string; cvFileId?: string }
  ): Promise<Application>;
  getApplicationById(user: User, id: string): Promise<Application | null>;
  getUserApplications(user: User): Promise<Application[]>;
  getJobApplications(user: User, jobId: string): Promise<Application[]>;
  updateApplicationStatus(
    user: User,
    id: string,
    status: Application['status']
  ): Promise<Application>;
}
