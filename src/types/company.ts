/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ============================================================================
 * COMPANY DATA MODEL (PHASE 6)
 * ============================================================================
 * Normalized company entity supporting future employer features and job associations.
 */

export interface Company {
  id: string;
  ownerUserId: string; // Associated employer or admin user ID
  name: string;
  logo: string | null;
  description: string;
  website: string | null;
  country: string;
  region: string | null;
  city: string;
  address: string | null;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
}
