/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ============================================================================
 * BACKEND-SAFE AUTHENTICATION VALIDATION (PHASE 6)
 * ============================================================================
 * Enforces email syntax, password strength, display name, and role validation.
 */

import { UserRole, RegisterData, AuthCredentials } from '../../types/auth';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const VALID_ROLES: UserRole[] = ['job_seeker', 'employer', 'admin'];

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateEmail(email: string): { isValid: boolean; error?: string } {
  if (!email || typeof email !== 'string') {
    return { isValid: false, error: 'البريد الإلكتروني مطلوب.' };
  }
  const cleanEmail = email.trim();
  if (cleanEmail.length > 254) {
    return { isValid: false, error: 'البريد الإلكتروني طويل جداً.' };
  }
  if (!EMAIL_REGEX.test(cleanEmail)) {
    return { isValid: false, error: 'صيغة البريد الإلكتروني غير صالحة.' };
  }
  return { isValid: true };
}

export function validatePassword(password: string): { isValid: boolean; error?: string } {
  if (!password || typeof password !== 'string') {
    return { isValid: false, error: 'كلمة المرور مطلوبة.' };
  }
  if (password.length < 8) {
    return { isValid: false, error: 'يجب ألا تقل كلمة المرور عن 8 أحرف.' };
  }
  if (password.length > 128) {
    return { isValid: false, error: 'كلمة المرور تتجاوز الحد الأقصى المسموح (128 حرفاً).' };
  }
  return { isValid: true };
}

export function validateUserRole(role: string): { isValid: boolean; error?: string } {
  if (!VALID_ROLES.includes(role as UserRole)) {
    return {
      isValid: false,
      error: `الدور المختار غير صالح. الأدوار المتاحة: ${VALID_ROLES.join(', ')}`,
    };
  }
  return { isValid: true };
}

export function validateRegistrationData(data: RegisterData): ValidationResult {
  const errors: string[] = [];

  const emailRes = validateEmail(data.email);
  if (!emailRes.isValid && emailRes.error) {
    errors.push(emailRes.error);
  }

  const passRes = validatePassword(data.password);
  if (!passRes.isValid && passRes.error) {
    errors.push(passRes.error);
  }

  if (!data.displayName || typeof data.displayName !== 'string' || data.displayName.trim().length < 2) {
    errors.push('الاسم الكامل يجب أن يتكون من حرفين على الأقل.');
  }

  if (data.role) {
    const roleRes = validateUserRole(data.role);
    if (!roleRes.isValid && roleRes.error) {
      errors.push(roleRes.error);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateLoginCredentials(credentials: AuthCredentials): ValidationResult {
  const errors: string[] = [];

  const emailRes = validateEmail(credentials.email);
  if (!emailRes.isValid && emailRes.error) {
    errors.push(emailRes.error);
  }

  if (!credentials.password || typeof credentials.password !== 'string') {
    errors.push('كلمة المرور مطلوبة.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
