/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ============================================================================
 * BACKEND-SAFE STORAGE VALIDATION (PHASE 6)
 * ============================================================================
 * Enforces file size limits, MIME type policies, and path sanitization for
 * CV uploads and company assets.
 */

import { StorageBucket } from '../../types/storage';

export const ALLOWED_CV_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export const ALLOWED_LOGO_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/svg+xml',
];

export const MAX_CV_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
export const MAX_LOGO_FILE_SIZE = 2 * 1024 * 1024; // 2 MB

export interface StorageValidationResult {
  isValid: boolean;
  errors: string[];
}

export function sanitizeFileName(fileName: string): string {
  // Prevent path traversal
  const baseName = fileName.replace(/[/\\?%*:|"<>]/g, '_');
  // Avoid leading dots or hidden files
  return baseName.replace(/^\.+/, '');
}

export function validateStorageUpload(
  bucket: StorageBucket,
  fileName: string,
  mimeType: string,
  fileSize: number
): StorageValidationResult {
  const errors: string[] = [];

  if (!fileName || fileName.trim() === '') {
    errors.push('اسم الملف مطلوب.');
  }

  if (fileSize <= 0) {
    errors.push('حجم الملف غير صالح.');
  }

  if (bucket === 'private-cvs') {
    if (!ALLOWED_CV_MIME_TYPES.includes(mimeType.toLowerCase())) {
      errors.push('صيغة ملف السيرة الذاتية غير مقبولة. الصيغ المدعومة: PDF أو Word (DOC / DOCX).');
    }
    if (fileSize > MAX_CV_FILE_SIZE) {
      errors.push(`حجم ملف السيرة الذاتية يتجاوز الحد الأقصى المسموح (${MAX_CV_FILE_SIZE / (1024 * 1024)} ميغابايت).`);
    }
  } else if (bucket === 'company-logos') {
    if (!ALLOWED_LOGO_MIME_TYPES.includes(mimeType.toLowerCase())) {
      errors.push('صيغة شعار الشركة غير صالحة. الصيغ المدعومة: PNG, JPEG, WebP, SVG.');
    }
    if (fileSize > MAX_LOGO_FILE_SIZE) {
      errors.push('حجم شعار الشركة يتجاوز الحد الأقصى المسموح (2 ميغابايت).');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
