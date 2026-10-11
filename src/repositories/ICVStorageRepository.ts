/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ============================================================================
 * CV STORAGE REPOSITORY CONTRACT (PHASE 6)
 * ============================================================================
 */

import { CVFile } from '../types/storage';
import { User } from '../types/auth';

export interface ICVStorageRepository {
  uploadCV(
    user: User,
    fileName: string,
    mimeType: string,
    fileSize: number,
    base64Data?: string
  ): Promise<CVFile>;
  getCVMetadata(user: User, id: string): Promise<CVFile | null>;
  getCVDownloadUrl(user: User, id: string): Promise<{ success: boolean; url?: string; error?: string }>;
  getUserCVs(user: User): Promise<CVFile[]>;
  deleteCV(user: User, id: string): Promise<boolean>;
}
