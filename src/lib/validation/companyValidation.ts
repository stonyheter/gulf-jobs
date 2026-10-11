/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ============================================================================
 * BACKEND-SAFE COMPANY VALIDATION (PHASE 6)
 * ============================================================================
 */

import { Company } from '../../types/company';

export interface CompanyValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateCompany(company: Partial<Company>): CompanyValidationResult {
  const errors: string[] = [];

  if (!company.name || typeof company.name !== 'string' || company.name.trim().length < 2) {
    errors.push('اسم الشركة مطلوب ويجب ألا يقل عن حرفين.');
  }

  if (!company.country || typeof company.country !== 'string' || company.country.trim() === '') {
    errors.push('دولة الشركة مطلوبة.');
  }

  if (!company.city || typeof company.city !== 'string' || company.city.trim() === '') {
    errors.push('مدينة الشركة مطلوبة.');
  }

  if (!company.ownerUserId || typeof company.ownerUserId !== 'string' || company.ownerUserId.trim() === '') {
    errors.push('المستخدم المالك للشركة مطلوب.');
  }

  if (company.website && typeof company.website === 'string' && company.website.trim() !== '') {
    const web = company.website.trim();
    if (!web.startsWith('http://') && !web.startsWith('https://')) {
      errors.push('رابط الموقع الإلكتروني للشركة يجب أن يبدأ بـ http:// أو https://.');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
