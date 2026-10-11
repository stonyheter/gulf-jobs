/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ============================================================================
 * JOB APPLICATION DATA MODEL (PHASE 6)
 * ============================================================================
 * Prepares the schema for future applications / ATS without activating ATS UI yet.
 */

export type ApplicationStatus =
  | 'pending'
  | 'reviewing'
  | 'shortlisted'
  | 'interview'
  | 'accepted'
  | 'rejected'
  | 'withdrawn';

export interface Application {
  id: string;
  jobId: string;
  applicantUserId: string;
  status: ApplicationStatus;
  coverLetter: string | null;
  cvFileId: string | null;
  createdAt: string;
  updatedAt: string;
}
