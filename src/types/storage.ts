/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ============================================================================
 * SECURE STORAGE DATA MODEL (PHASE 6)
 * ============================================================================
 * Defines private CV files and asset storage metadata and permissions.
 */

export interface CVFile {
  id: string;
  userId: string;
  fileName: string;
  storagePath: string;
  mimeType: string;
  fileSize: number; // in bytes
  createdAt: string;
  updatedAt: string;
}

export type StorageBucket = 'private-cvs' | 'company-logos' | 'job-assets';

export interface StorageFile {
  id: string;
  ownerUserId: string;
  bucket: StorageBucket;
  fileName: string;
  storagePath: string;
  mimeType: string;
  fileSize: number;
  isPublic: boolean;
  contentData?: string; // Base64 data or storage reference
  createdAt: string;
  updatedAt: string;
}

export interface FileUploadRequest {
  bucket: StorageBucket;
  fileName: string;
  mimeType: string;
  fileSize: number;
  dataBase64: string;
}

export interface StorageUploadResult {
  success: boolean;
  file?: StorageFile;
  error?: string;
}
