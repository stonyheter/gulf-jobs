/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ============================================================================
 * JOB APPLICATION SERVICE (PHASE 7)
 * ============================================================================
 * Orchestrates job applications, CV file uploads, application statuses,
 * candidate submissions, and employer review workflows.
 */

import { applicationRepository } from '../repositories/ApplicationRepository';
import { cvStorageRepository } from '../repositories/CVStorageRepository';
import { userRepository } from '../repositories/UserRepository';
import { jobService } from './jobService';
import { Application, ApplicationStatus } from '../types/application';
import { CVFile } from '../types/storage';
import { Job } from '../types/job';
import { User } from '../types/auth';

export interface UserApplicationSummary {
  application: Application;
  job: Job | null;
  cvFile: CVFile | null;
  cvDownloadUrl?: string;
}

export interface JobApplicantSummary {
  application: Application;
  applicant: User | null;
  cvFile: CVFile | null;
  cvDownloadUrl?: string;
}

export interface SubmitApplicationPayload {
  jobId: string;
  coverLetter?: string;
  cvFile?: {
    name: string;
    mimeType: string;
    size: number;
    base64Data?: string;
  };
  existingCvFileId?: string;
}

export class ApplicationService {
  /**
   * Submits a new job application for the current user.
   * Handles CV upload or existing CV file association.
   */
  async submitApplication(
    user: User,
    payload: SubmitApplicationPayload
  ): Promise<Application> {
    if (!user || !user.id) {
      throw new Error('يجب تسجيل الدخول لتقديم طلب التوظيف.');
    }

    if (!payload.jobId) {
      throw new Error('معرف الوظيفة مطلوب.');
    }

    // Verify job exists
    const job = await jobService.getJobById(payload.jobId);
    if (!job) {
      throw new Error('الوظيفة المطلوبة غير موجودة أو تم حذفها.');
    }

    // Check if user has already submitted an active application
    const existingApps = await applicationRepository.getUserApplications(user);
    const activeApp = existingApps.find(
      (a) => a.jobId === payload.jobId && a.status !== 'withdrawn'
    );
    if (activeApp) {
      throw new Error('لقد قمت مسبقاً بتقديم طلب لهذه الوظيفة وهو قيد المتابعة.');
    }

    let cvFileId: string | undefined = payload.existingCvFileId;

    // Handle new CV upload if provided
    if (payload.cvFile) {
      const uploaded = await cvStorageRepository.uploadCV(
        user,
        payload.cvFile.name,
        payload.cvFile.mimeType,
        payload.cvFile.size,
        payload.cvFile.base64Data
      );
      cvFileId = uploaded.id;
    }

    // Create the application record
    const application = await applicationRepository.createApplication(user, {
      jobId: payload.jobId,
      coverLetter: payload.coverLetter?.trim(),
      cvFileId,
    });

    return application;
  }

  /**
   * Retrieves all applications submitted by the current user with job & CV metadata.
   */
  async getMyApplications(user: User): Promise<UserApplicationSummary[]> {
    if (!user || !user.id) return [];

    const apps = await applicationRepository.getUserApplications(user);

    const summaries: UserApplicationSummary[] = await Promise.all(
      apps.map(async (app) => {
        let job: Job | null = null;
        try {
          job = await jobService.getJobById(app.jobId);
        } catch (e) {
          console.warn('Failed to load job for application', app.jobId, e);
        }

        let cvFile: CVFile | null = null;
        let cvDownloadUrl: string | undefined = undefined;

        if (app.cvFileId) {
          try {
            cvFile = await cvStorageRepository.getCVMetadata(user, app.cvFileId);
            const downloadRes = await cvStorageRepository.getCVDownloadUrl(user, app.cvFileId);
            if (downloadRes.success && downloadRes.url) {
              cvDownloadUrl = downloadRes.url;
            }
          } catch (e) {
            console.warn('Failed to load CV metadata for application', app.cvFileId, e);
          }
        }

        return {
          application: app,
          job,
          cvFile,
          cvDownloadUrl,
        };
      })
    );

    // Sort by creation date (newest first)
    return summaries.sort(
      (a, b) => new Date(b.application.createdAt).getTime() - new Date(a.application.createdAt).getTime()
    );
  }

  /**
   * Checks if user has an active application for a specific job.
   */
  async hasUserApplied(user: User | null, jobId: string): Promise<boolean> {
    if (!user || !jobId) return false;
    const apps = await applicationRepository.getUserApplications(user);
    return apps.some((a) => a.jobId === jobId && a.status !== 'withdrawn');
  }

  /**
   * Gets specific application of the user for a job.
   */
  async getUserApplicationForJob(user: User | null, jobId: string): Promise<Application | null> {
    if (!user || !jobId) return null;
    const apps = await applicationRepository.getUserApplications(user);
    return apps.find((a) => a.jobId === jobId && a.status !== 'withdrawn') || null;
  }

  /**
   * Allows an applicant to withdraw their submitted application.
   */
  async withdrawApplication(user: User, applicationId: string): Promise<Application> {
    if (!user || !user.id) {
      throw new Error('يجب تسجيل الدخول لإلغاء أو سحب الطلب.');
    }

    return applicationRepository.updateApplicationStatus(user, applicationId, 'withdrawn');
  }

  /**
   * Retrieves applications for a job (Employer/Admin).
   */
  async getJobApplications(user: User, jobId: string): Promise<JobApplicantSummary[]> {
    if (!user) return [];
    const apps = await applicationRepository.getJobApplications(user, jobId);

    const summaries: JobApplicantSummary[] = await Promise.all(
      apps.map(async (app) => {
        let applicant: User | null = null;
        try {
          applicant = await userRepository.getUserById(app.applicantUserId);
        } catch (e) {
          console.warn('Failed to load applicant', app.applicantUserId, e);
        }

        let cvFile: CVFile | null = null;
        let cvDownloadUrl: string | undefined = undefined;

        if (app.cvFileId) {
          try {
            cvFile = await cvStorageRepository.getCVMetadata(user, app.cvFileId);
            const downloadRes = await cvStorageRepository.getCVDownloadUrl(user, app.cvFileId);
            if (downloadRes.success && downloadRes.url) {
              cvDownloadUrl = downloadRes.url;
            }
          } catch (e) {
            console.warn('Failed to load CV for applicant', app.cvFileId, e);
          }
        }

        return {
          application: app,
          applicant,
          cvFile,
          cvDownloadUrl,
        };
      })
    );

    return summaries.sort(
      (a, b) => new Date(b.application.createdAt).getTime() - new Date(a.application.createdAt).getTime()
    );
  }

  /**
   * Updates application status (Employer/Admin).
   */
  async updateApplicationStatus(
    user: User,
    applicationId: string,
    status: ApplicationStatus
  ): Promise<Application> {
    if (!user || (user.role !== 'admin' && user.role !== 'employer')) {
      throw new Error('غير مصرح لك بتحديث حالة طلب التوظيف.');
    }

    return applicationRepository.updateApplicationStatus(user, applicationId, status);
  }
}

export const applicationService = new ApplicationService();
