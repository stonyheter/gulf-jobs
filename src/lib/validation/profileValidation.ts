/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ============================================================================
 * BACKEND-SAFE PROFILE VALIDATION (PHASE 6)
 * ============================================================================
 */

import { JobSeekerProfile } from '../../types/profile';
import { GCC_COUNTRIES } from '../../data/geoHierarchy';

export interface ProfileValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateProfileBackend(profile: Partial<JobSeekerProfile>): ProfileValidationResult {
  const errors: string[] = [];

  if (profile.fullName !== undefined) {
    if (!profile.fullName || typeof profile.fullName !== 'string' || profile.fullName.trim().length < 2) {
      errors.push('الاسم الكامل يجب أن يتكون من حرفين على الأقل.');
    }
  }

  if (profile.country !== undefined && profile.country !== '') {
    const recognized = GCC_COUNTRIES.some(
      (c) =>
        c.nameAr === profile.country ||
        c.commonNameAr === profile.country ||
        c.code.toLowerCase() === profile.country?.toLowerCase() ||
        profile.country?.includes(c.commonNameAr) ||
        profile.country?.includes(c.nameAr)
    );
    if (!recognized) {
      errors.push('دولة الإقامة يجب أن تكون ضمن دول مجلس التعاون الخليجي.');
    }
  }

  if (profile.yearsOfExperience !== null && profile.yearsOfExperience !== undefined) {
    if (typeof profile.yearsOfExperience !== 'number' || profile.yearsOfExperience < 0) {
      errors.push('سنوات الخبرة يجب أن تكون رقماً موجباً.');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
