/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ============================================================================
 * COMPANY REPOSITORY CONTRACT (PHASE 6)
 * ============================================================================
 */

import { Company } from '../types/company';
import { User } from '../types/auth';

export interface ICompanyRepository {
  getCompanyById(id: string): Promise<Company | null>;
  getAllCompanies(): Promise<Company[]>;
  getCompaniesByOwner(ownerUserId: string): Promise<Company[]>;
  createCompany(user: User, data: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>): Promise<Company>;
  updateCompany(user: User, id: string, updates: Partial<Company>): Promise<Company>;
  deleteCompany(user: User, id: string): Promise<boolean>;
  seedInitialCompanies(): Promise<void>;
}
