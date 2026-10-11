/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ============================================================================
 * PRODUCTION COMPANY REPOSITORY IMPLEMENTATION (PHASE 6)
 * ============================================================================
 * Enforces company ownership, validation, and persistence.
 */

import { ICompanyRepository } from './ICompanyRepository';
import { Company } from '../types/company';
import { User } from '../types/auth';
import { validateCompany } from '../lib/validation/companyValidation';
import { RbacPolicy } from '../lib/security/rbac';
import { SEED_COMPANIES } from '../lib/database/seedData';
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase/client';

const COMPANIES_STORAGE_KEY = 'gulf_jobs_prod_companies_v1';

export class ProductionCompanyRepository implements ICompanyRepository {
  private companies: Map<string, Company> = new Map();
  private initialized = false;

  constructor() {
    this.init();
  }

  private init(): void {
    if (this.initialized) return;

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const raw = window.localStorage.getItem(COMPANIES_STORAGE_KEY);
        if (raw) {
          const parsed: Company[] = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            parsed.forEach((c) => this.companies.set(c.id, c));
          }
        }
      } catch (e) {
        console.warn('Failed to load companies from persistence', e);
      }
    }

    if (this.companies.size === 0) {
      this.seedInitialCompaniesSync();
    }

    this.initialized = true;
  }

  private seedInitialCompaniesSync(): void {
    SEED_COMPANIES.forEach((c: any) => this.companies.set(c.id, c));
    this.persist();
  }

  private persist(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const list = Array.from(this.companies.values());
        window.localStorage.setItem(COMPANIES_STORAGE_KEY, JSON.stringify(list));
      } catch (e) {
        console.warn('Failed to persist companies', e);
      }
    }
  }

  async seedInitialCompanies(): Promise<void> {
    this.seedInitialCompaniesSync();
  }

  async getCompanyById(id: string): Promise<Company | null> {
    this.init();
    const c = this.companies.get(id);
    return c ? { ...c } : null;
  }

  async getAllCompanies(): Promise<Company[]> {
    this.init();
    return Array.from(this.companies.values()).map((c) => ({ ...c }));
  }

  async getCompaniesByOwner(ownerUserId: string): Promise<Company[]> {
    this.init();
    return Array.from(this.companies.values())
      .filter((c) => c.ownerUserId === ownerUserId)
      .map((c) => ({ ...c }));
  }

  async createCompany(
    user: User,
    data: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Company> {
    this.init();

    // Only admin or employer can register companies
    if (user.role !== 'admin' && user.role !== 'employer') {
      throw new Error('غير مصرح لك بإنشاء ملف شركة. يجب تسجيل الدخول كصاحب عمل أو مشرف.');
    }

    const payload: Partial<Company> = {
      ...data,
      ownerUserId: user.role === 'admin' && data.ownerUserId ? data.ownerUserId : user.id,
    };

    const validation = validateCompany(payload);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(' | '));
    }

    const now = new Date().toISOString();
    const companyId = `comp-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

    const newCompany: Company = {
      id: companyId,
      ownerUserId: payload.ownerUserId!,
      name: payload.name!.trim(),
      logo: payload.logo ?? null,
      description: payload.description!.trim(),
      website: payload.website ?? null,
      country: payload.country!,
      region: payload.region ?? null,
      city: payload.city!,
      address: payload.address ?? null,
      verified: user.role === 'admin' ? (payload.verified ?? false) : false,
      createdAt: now,
      updatedAt: now,
    };

    this.companies.set(companyId, newCompany);
    this.persist();

    // Supabase sync
    const client = getSupabaseClient();
    if (client && isSupabaseConfigured()) {
      try {
        await client.from('companies').insert({
          owner_user_id: newCompany.ownerUserId,
          name: newCompany.name,
          logo: newCompany.logo,
          description: newCompany.description,
          website: newCompany.website,
          country: newCompany.country,
          region: newCompany.region,
          city: newCompany.city,
          address: newCompany.address,
          verified: newCompany.verified,
        });
      } catch (err) {
        console.warn('Supabase createCompany sync notice:', err);
      }
    }

    return { ...newCompany };
  }

  async updateCompany(user: User, id: string, updates: Partial<Company>): Promise<Company> {
    this.init();
    const existing = this.companies.get(id);
    if (!existing) {
      throw new Error(`الشركة غير موجودة بالمعرف ${id}.`);
    }

    const authCheck = RbacPolicy.canManageCompany(user, existing);
    if (!authCheck.allowed) {
      throw new Error(authCheck.reasonAr || 'غير مصرح لك بتعديل بيانات الشركة.');
    }

    const now = new Date().toISOString();
    const merged: Company = {
      ...existing,
      ...updates,
      id: existing.id,
      ownerUserId: existing.ownerUserId, // owner immutable by standard update
      createdAt: existing.createdAt,
      updatedAt: now,
    };

    const validation = validateCompany(merged);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(' | '));
    }

    this.companies.set(id, merged);
    this.persist();

    // Supabase sync
    const client = getSupabaseClient();
    if (client && isSupabaseConfigured()) {
      try {
        await client
          .from('companies')
          .update({
            name: merged.name,
            logo: merged.logo,
            description: merged.description,
            website: merged.website,
            country: merged.country,
            region: merged.region,
            city: merged.city,
            address: merged.address,
            verified: merged.verified,
          })
          .eq('id', id);
      } catch (err) {
        console.warn('Supabase updateCompany sync notice:', err);
      }
    }

    return { ...merged };
  }

  async deleteCompany(user: User, id: string): Promise<boolean> {
    this.init();
    const existing = this.companies.get(id);
    if (!existing) return false;

    const authCheck = RbacPolicy.canManageCompany(user, existing);
    if (!authCheck.allowed) {
      throw new Error(authCheck.reasonAr || 'غير مصرح لك بحذف بيانات الشركة.');
    }

    const deleted = this.companies.delete(id);
    if (deleted) {
      this.persist();
    }

    // Supabase sync
    const client = getSupabaseClient();
    if (client && isSupabaseConfigured()) {
      try {
        await client.from('companies').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase deleteCompany sync notice:', err);
      }
    }

    return deleted;
  }
}

export const companyRepository: ICompanyRepository = new ProductionCompanyRepository();
