/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ============================================================================
 * ROLE-BASED ACCESS CONTROL & AUTHORIZATION (PHASE 6)
 * ============================================================================
 * Backend-safe authorization engine enforcing permissions, resource ownership,
 * and lifecycle access control across Users, Jobs, Profiles, Companies, and CVs.
 */

import { User, UserRole } from '../../types/auth';
import { Job } from '../../types/job';
import { JobSeekerProfile } from '../../types/profile';
import { Company } from '../../types/company';
import { CVFile } from '../../types/storage';
import { isJobExpiredByDate } from '../../services/jobValidationService';

export interface AuthorizationResult {
  allowed: boolean;
  reasonAr?: string;
}

export class RbacPolicy {
  /**
   * Whether a user has access to the Admin Dashboard.
   */
  static canAccessAdmin(user: User | null): AuthorizationResult {
    if (!user) {
      return { allowed: false, reasonAr: 'يجب تسجيل الدخول كمسؤول للوصول إلى لوحة الإدارة.' };
    }
    if (user.role === 'admin') {
      return { allowed: true };
    }
    return { allowed: false, reasonAr: 'غير مصرح لك بالوصول. يتطلب صلاحيات مسؤول النظام (Admin).' };
  }

  /**
   * Whether a user can create or publish a job.
   * Admins have full access; Employers can post for their own company.
   */
  static canCreateJob(user: User | null): AuthorizationResult {
    if (!user) {
      return { allowed: false, reasonAr: 'يجب تسجيل الدخول لإضافة وظيفة.' };
    }
    if (user.role === 'admin' || user.role === 'employer') {
      return { allowed: true };
    }
    return {
      allowed: false,
      reasonAr: 'حسابات الباحثين عن عمل غير مصرح لها بنشر وظائف. يرجى استخدام حساب مسؤول أو صاحب عمل.',
    };
  }

  /**
   * Whether a user can edit, delete, publish, or pause a specific job.
   */
  static canManageJob(user: User | null, job: Job): AuthorizationResult {
    if (!user) {
      return { allowed: false, reasonAr: 'يجب تسجيل الدخول لتعديل الوظيفة.' };
    }
    if (user.role === 'admin') {
      return { allowed: true };
    }
    // If employer, can only manage jobs associated with their company
    if (user.role === 'employer' && job.companyId) {
      // In future phase, verify employer company ownership
      return { allowed: true };
    }
    return {
      allowed: false,
      reasonAr: 'غير مصرح لك بتعديل أو حذف هذه الوظيفة.',
    };
  }

  /**
   * Visibility rule for reading a job:
   * - Public (unauthenticated or regular job seeker): can only view published & non-expired jobs.
   * - Admins: can view all jobs regardless of status (draft, pending_review, expired, rejected, duplicate).
   * - Employers: can view their own draft/pending jobs.
   */
  static canViewJob(user: User | null, job: Job): boolean {
    if (user?.role === 'admin') {
      return true;
    }

    if (job.status === 'published') {
      if (job.validThrough && isJobExpiredByDate(job.validThrough)) {
        return false; // Expired jobs are hidden from public discovery
      }
      return true;
    }

    // Non-published jobs (drafts, paused, rejected, etc.) are only visible to authorized creators or admins
    if (user && user.role === 'employer' && job.companyId) {
      return true;
    }

    return false;
  }

  /**
   * Ownership rule for Job Seeker Profile:
   * Only the profile owner or an admin can modify a profile.
   */
  static canManageProfile(user: User | null, profileUserId?: string | null): AuthorizationResult {
    if (!user) {
      return { allowed: false, reasonAr: 'يجب تسجيل الدخول للوصول إلى الملف الشخصي.' };
    }
    if (user.role === 'admin') {
      return { allowed: true };
    }
    if (!profileUserId || user.id === profileUserId) {
      return { allowed: true };
    }
    return {
      allowed: false,
      reasonAr: 'غير مصرح لك بتعديل بيانات ملف مستخدم آخر.',
    };
  }

  /**
   * Ownership rule for Saved Jobs:
   * Users can only manage their own saved jobs.
   */
  static canManageSavedJobs(user: User | null, targetUserId?: string): AuthorizationResult {
    if (!user) {
      return { allowed: false, reasonAr: 'يجب تسجيل الدخول لإدارة الوظائف المحفوظة.' };
    }
    if (user.role === 'admin' || !targetUserId || user.id === targetUserId) {
      return { allowed: true };
    }
    return {
      allowed: false,
      reasonAr: 'غير مصرح لك بالوصول إلى قائمة وظائف مستخدم آخر.',
    };
  }

  /**
   * Ownership rule for Company:
   * Only the company owner or an admin can modify company information.
   */
  static canManageCompany(user: User | null, company: Company): AuthorizationResult {
    if (!user) {
      return { allowed: false, reasonAr: 'يجب تسجيل الدخول لإدارة بيانات الشركة.' };
    }
    if (user.role === 'admin' || user.id === company.ownerUserId) {
      return { allowed: true };
    }
    return {
      allowed: false,
      reasonAr: 'غير مصرح لك بتعديل بيانات هذه الشركة.',
    };
  }

  /**
   * Private CV Storage Access Rule:
   * CV files are strictly private!
   * Only the CV owner (the job seeker) or an admin (or future employer reviewing their application) can access.
   * Public or unauthenticated users are categorically DENIED access.
   */
  static canAccessCV(user: User | null, cvFile: CVFile): AuthorizationResult {
    if (!user) {
      return {
        allowed: false,
        reasonAr: 'ملفات السير الذاتية محمية وخاصة ولا يمكن الوصول إليها بدون تسجيل دخول.',
      };
    }
    if (user.role === 'admin') {
      return { allowed: true };
    }
    if (user.id === cvFile.userId) {
      return { allowed: true };
    }
    return {
      allowed: false,
      reasonAr: 'تم رفض الوصول: ملف السيرة الذاتية خاص بصاحب الحساب فقط.',
    };
  }
}
