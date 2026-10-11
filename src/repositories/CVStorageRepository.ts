/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ============================================================================
 * PRODUCTION CV STORAGE REPOSITORY IMPLEMENTATION (PHASE 6)
 * ============================================================================
 * Securely manages private CV files with metadata persistence and strict
 * identity-based authorization checks.
 */

import { ICVStorageRepository } from './ICVStorageRepository';
import { CVFile } from '../types/storage';
import { User } from '../types/auth';
import { secureStorageProvider } from '../lib/storage/secureStorage';

export class ProductionCVStorageRepository implements ICVStorageRepository {
  async uploadCV(
    user: User,
    fileName: string,
    mimeType: string,
    fileSize: number,
    base64Data?: string
  ): Promise<CVFile> {
    const res = await secureStorageProvider.uploadFile(
      user,
      'private-cvs',
      fileName,
      mimeType,
      fileSize,
      base64Data
    );

    if (!res.success || !res.file) {
      throw new Error(res.error || 'فشل في رفع ملف السيرة الذاتية.');
    }

    return {
      id: res.file.id,
      userId: user.id,
      fileName: res.file.fileName,
      storagePath: res.file.storagePath,
      mimeType: res.file.mimeType,
      fileSize: res.file.fileSize,
      createdAt: res.file.createdAt,
      updatedAt: res.file.updatedAt,
    };
  }

  async getCVMetadata(user: User, id: string): Promise<CVFile | null> {
    const file = await secureStorageProvider.getFileMetadata(user, id);
    if (!file || file.bucket !== 'private-cvs') {
      return null;
    }

    return {
      id: file.id,
      userId: file.ownerUserId,
      fileName: file.fileName,
      storagePath: file.storagePath,
      mimeType: file.mimeType,
      fileSize: file.fileSize,
      createdAt: file.createdAt,
      updatedAt: file.updatedAt,
    };
  }

  async getCVDownloadUrl(
    user: User,
    id: string
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    return secureStorageProvider.getFileDownloadUrl(user, id);
  }

  async getUserCVs(user: User): Promise<CVFile[]> {
    return secureStorageProvider.listUserCvFiles(user);
  }

  async deleteCV(user: User, id: string): Promise<boolean> {
    const res = await secureStorageProvider.deleteFile(user, id);
    return res.success;
  }
}

export const cvStorageRepository: ICVStorageRepository = new ProductionCVStorageRepository();
