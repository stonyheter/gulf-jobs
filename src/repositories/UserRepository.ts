/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ============================================================================
 * SUPABASE USER REPOSITORY IMPLEMENTATION (PHASE 6.1)
 * ============================================================================
 * Delegates identity, registration, session persistence, and credential management
 * directly to Supabase Auth and the `public.profiles` PostgreSQL table.
 * 
 * SECURITY:
 * 1. User passwords are NEVER stored, hashed, or intercepted in application tables.
 * 2. Authenticated user ID (auth.users.id) is the canonical identity.
 * 3. Role updates are strictly guarded against browser-side tampering.
 */

import { IUserRepository } from './IUserRepository';
import { User, AuthSession, AuthCredentials, RegisterData } from '../types/auth';
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase/client';
import { SEED_USERS } from '../lib/database/seedData';
import { validateRegistrationData, validateLoginCredentials } from '../lib/validation/authValidation';

export class SupabaseUserRepository implements IUserRepository {
  private mockUsers: Map<string, User> = new Map();
  private mockSessions: Map<string, AuthSession> = new Map();

  constructor() {
    // Isolated in-memory dev fallback when Supabase is not configured
    SEED_USERS.forEach((u) => this.mockUsers.set(u.id, { ...u }));
  }

  async register(data: RegisterData): Promise<{ user: User; session: AuthSession }> {
    const validation = validateRegistrationData(data);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(' | '));
    }

    const client = getSupabaseClient();
    if (client && isSupabaseConfigured()) {
      // 1. Supabase Auth registration
      const { data: authData, error: authError } = await client.auth.signUp({
        email: data.email.toLowerCase().trim(),
        password: data.password,
        options: {
          data: {
            display_name: data.displayName.trim(),
            role: data.role || 'job_seeker',
          },
        },
      });

      if (authError || !authData.user) {
        throw new Error(authError?.message || 'فشل تسجيل المستخدم في Supabase Auth.');
      }

      const uid = authData.user.id;
      const now = new Date().toISOString();

      // 2. Fetch or guarantee corresponding profile row in public.profiles
      const { data: profileRow } = await client
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .maybeSingle();

      const user: User = profileRow
        ? {
            id: profileRow.id,
            email: profileRow.email,
            displayName: profileRow.display_name,
            role: profileRow.role,
            createdAt: profileRow.created_at,
            updatedAt: profileRow.updated_at,
          }
        : {
            id: uid,
            email: authData.user.email || data.email,
            displayName: data.displayName.trim(),
            role: (data.role as any) || 'job_seeker',
            createdAt: now,
            updatedAt: now,
          };

      const sessionToken = authData.session?.access_token || `sb_token_${Date.now()}`;
      const session: AuthSession = {
        token: sessionToken,
        userId: uid,
        user,
        expiresAt: authData.session?.expires_at
          ? new Date(authData.session.expires_at * 1000).toISOString()
          : new Date(Date.now() + 72 * 3600 * 1000).toISOString(),
      };

      return { user, session };
    }

    // Isolated In-Memory Dev Adapter (When credentials not set)
    const normalizedEmail = data.email.toLowerCase().trim();
    const existing = Array.from(this.mockUsers.values()).find((u) => u.email === normalizedEmail);
    if (existing) {
      throw new Error('البريد الإلكتروني مسجل مسبقاً.');
    }

    const now = new Date().toISOString();
    const userId = `d0e8b1a2-${Date.now().toString(16).padStart(4, '0')}-4e5f-a6b7-${Math.random().toString(16).substring(2, 14)}`;

    const newUser: User = {
      id: userId,
      email: normalizedEmail,
      displayName: data.displayName.trim(),
      role: data.role || 'job_seeker',
      createdAt: now,
      updatedAt: now,
    };

    this.mockUsers.set(userId, newUser);
    const token = `mock_session_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    const session: AuthSession = {
      token,
      userId,
      user: newUser,
      expiresAt: new Date(Date.now() + 72 * 3600 * 1000).toISOString(),
    };
    this.mockSessions.set(token, session);

    return { user: newUser, session };
  }

  async authenticate(credentials: AuthCredentials): Promise<{ user: User; session: AuthSession }> {
    const validation = validateLoginCredentials(credentials);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(' | '));
    }

    const client = getSupabaseClient();
    if (client && isSupabaseConfigured()) {
      const { data: authData, error: authError } = await client.auth.signInWithPassword({
        email: credentials.email.toLowerCase().trim(),
        password: credentials.password,
      });

      if (authError || !authData.user || !authData.session) {
        throw new Error(authError?.message || 'بيانات الدخول غير صحيحة.');
      }

      const uid = authData.user.id;
      const { data: profileRow } = await client
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .maybeSingle();

      const user: User = profileRow
        ? {
            id: profileRow.id,
            email: profileRow.email,
            displayName: profileRow.display_name,
            role: profileRow.role,
            createdAt: profileRow.created_at,
            updatedAt: profileRow.updated_at,
          }
        : {
            id: uid,
            email: authData.user.email || credentials.email,
            displayName: (authData.user.user_metadata?.display_name as string) || 'مستخدم',
            role: (authData.user.user_metadata?.role as any) || 'job_seeker',
            createdAt: authData.user.created_at || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

      const session: AuthSession = {
        token: authData.session.access_token,
        userId: uid,
        user,
        expiresAt: authData.session.expires_at
          ? new Date(authData.session.expires_at * 1000).toISOString()
          : new Date(Date.now() + 72 * 3600 * 1000).toISOString(),
      };

      return { user, session };
    }

    // Isolated In-Memory Dev Adapter
    const normalizedEmail = credentials.email.toLowerCase().trim();
    const user = Array.from(this.mockUsers.values()).find((u) => u.email === normalizedEmail);
    if (!user) {
      throw new Error('بيانات الدخول غير صحيحة.');
    }

    const token = `mock_session_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    const session: AuthSession = {
      token,
      userId: user.id,
      user,
      expiresAt: new Date(Date.now() + 72 * 3600 * 1000).toISOString(),
    };
    this.mockSessions.set(token, session);

    return { user, session };
  }

  async getUserById(id: string): Promise<User | null> {
    const client = getSupabaseClient();
    if (client && isSupabaseConfigured()) {
      const { data, error } = await client
        .from('profiles')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error || !data) return null;

      return {
        id: data.id,
        email: data.email,
        displayName: data.display_name,
        role: data.role,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    }

    const mock = this.mockUsers.get(id);
    return mock ? { ...mock } : null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const normalized = email.toLowerCase().trim();
    const client = getSupabaseClient();
    if (client && isSupabaseConfigured()) {
      const { data, error } = await client
        .from('profiles')
        .select('*')
        .eq('email', normalized)
        .maybeSingle();

      if (error || !data) return null;

      return {
        id: data.id,
        email: data.email,
        displayName: data.display_name,
        role: data.role,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    }

    const found = Array.from(this.mockUsers.values()).find((u) => u.email === normalized);
    return found ? { ...found } : null;
  }

  async createSession(userId: string): Promise<AuthSession> {
    const client = getSupabaseClient();
    if (client && isSupabaseConfigured()) {
      const { data } = await client.auth.getSession();
      if (data.session && data.session.user.id === userId) {
        const user = await this.getUserById(userId);
        return {
          token: data.session.access_token,
          userId,
          user: user || {
            id: userId,
            email: data.session.user.email || '',
            displayName: data.session.user.user_metadata?.display_name || '',
            role: data.session.user.user_metadata?.role || 'job_seeker',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          expiresAt: data.session.expires_at
            ? new Date(data.session.expires_at * 1000).toISOString()
            : new Date(Date.now() + 72 * 3600 * 1000).toISOString(),
        };
      }
    }

    const user = await this.getUserById(userId);
    if (!user) throw new Error('المستخدم غير موجود.');

    const token = `sb_token_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    const session: AuthSession = {
      token,
      userId,
      user,
      expiresAt: new Date(Date.now() + 72 * 3600 * 1000).toISOString(),
    };
    this.mockSessions.set(token, session);
    return session;
  }

  async validateSession(token: string): Promise<AuthSession | null> {
    if (!token) return null;

    const client = getSupabaseClient();
    if (client && isSupabaseConfigured()) {
      const { data, error } = await client.auth.getUser(token);
      if (error || !data.user) {
        return null;
      }

      const user = await this.getUserById(data.user.id);
      if (!user) return null;

      return {
        token,
        userId: user.id,
        user,
        expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
      };
    }

    const found = this.mockSessions.get(token);
    if (!found) return null;

    if (new Date(found.expiresAt).getTime() < Date.now()) {
      this.mockSessions.delete(token);
      return null;
    }

    return found;
  }

  async deleteSession(token: string): Promise<void> {
    const client = getSupabaseClient();
    if (client && isSupabaseConfigured()) {
      await client.auth.signOut();
    }
    this.mockSessions.delete(token);
  }

  async requestPasswordReset(email: string): Promise<{ success: boolean; resetToken?: string }> {
    const client = getSupabaseClient();
    if (client && isSupabaseConfigured()) {
      const { error } = await client.auth.resetPasswordForEmail(email.toLowerCase().trim());
      if (error) {
        return { success: false };
      }
      return { success: true };
    }
    return { success: true, resetToken: `reset_${Date.now()}` };
  }

  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    const client = getSupabaseClient();
    if (client && isSupabaseConfigured()) {
      const { error } = await client.auth.updateUser({ password: newPassword });
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    }
    return { success: true };
  }

  async getAllUsers(): Promise<User[]> {
    const client = getSupabaseClient();
    if (client && isSupabaseConfigured()) {
      const { data, error } = await client.from('profiles').select('*');
      if (error || !data) return [];
      return data.map((d: any) => ({
        id: d.id,
        email: d.email,
        displayName: d.display_name,
        role: d.role,
        createdAt: d.created_at,
        updatedAt: d.updated_at,
      }));
    }
    return Array.from(this.mockUsers.values());
  }

  async seedInitialUsers(): Promise<void> {
    SEED_USERS.forEach((u) => this.mockUsers.set(u.id, { ...u }));
  }
}

export const userRepository: IUserRepository = new SupabaseUserRepository();
