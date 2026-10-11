/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ============================================================================
 * SUPABASE AUTHENTICATION SERVICE (PHASE 6.1)
 * ============================================================================
 * Manages Supabase Auth lifecycle, session persistence, auth state listeners,
 * and canonical profile retrieval from `public.profiles`.
 * 
 * SECURITY:
 * 1. Passwords are never handled or stored in application tables.
 * 2. Supabase Auth session token is used directly.
 * 3. Client-side role escalation is strictly prohibited.
 */

import { User, AuthSession, AuthCredentials, RegisterData, UserRole } from '../types/auth';
import { userRepository } from '../repositories/UserRepository';
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase/client';

export class AuthService {
  private currentSession: AuthSession | null = null;
  private currentUser: User | null = null;
  private listeners: Set<(user: User | null) => void> = new Set();
  private initPromise: Promise<User | null> | null = null;

  constructor() {
    this.initSession();
    this.setupSupabaseAuthListener();
  }

  private setupSupabaseAuthListener(): void {
    const client = getSupabaseClient();
    if (client && isSupabaseConfigured()) {
      client.auth.onAuthStateChange(async (event, session) => {
        if (session && session.user) {
          const profile = await userRepository.getUserById(session.user.id);
          this.currentUser = profile || {
            id: session.user.id,
            email: session.user.email || '',
            displayName: (session.user.user_metadata?.display_name as string) || 'مستخدم',
            role: (session.user.user_metadata?.role as any) || 'job_seeker',
            createdAt: session.user.created_at || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          this.currentSession = {
            token: session.access_token,
            userId: session.user.id,
            user: this.currentUser,
            expiresAt: new Date(session.expires_at! * 1000).toISOString(),
          };
        } else if (event === 'SIGNED_OUT') {
          this.currentUser = null;
          this.currentSession = null;
        }
        this.notifyListeners();
      });
    }
  }

  private async initSession(): Promise<User | null> {
    if (this.currentUser) return this.currentUser;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      const client = getSupabaseClient();

      if (client && isSupabaseConfigured()) {
        try {
          const { data } = await client.auth.getSession();
          if (data.session && data.session.user) {
            const profile = await userRepository.getUserById(data.session.user.id);
            this.currentUser = profile || {
              id: data.session.user.id,
              email: data.session.user.email || '',
              displayName: (data.session.user.user_metadata?.display_name as string) || 'مستخدم',
              role: (data.session.user.user_metadata?.role as any) || 'job_seeker',
              createdAt: data.session.user.created_at || new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            this.currentSession = {
              token: data.session.access_token,
              userId: data.session.user.id,
              user: this.currentUser,
              expiresAt: new Date(data.session.expires_at! * 1000).toISOString(),
            };
            this.notifyListeners();
            return this.currentUser;
          }
        } catch (e) {
          console.warn('Supabase getSession failed, continuing without session:', e);
        }
        return null;
      }

      // Offline / Development Demo default user (فيصل الشمري - Job Seeker)
      const defaultUser = await userRepository.getUserById('d0e8b1a2-3c4d-4e5f-a6b7-c8d9e0f1a2b3');
      if (defaultUser) {
        const session = await userRepository.createSession(defaultUser.id);
        this.currentSession = session;
        this.currentUser = defaultUser;
        this.notifyListeners();
        return this.currentUser;
      }

      return null;
    })();

    return this.initPromise;
  }

  private notifyListeners(): void {
    this.listeners.forEach((callback) => {
      try {
        callback(this.currentUser);
      } catch (e) {
        console.error('Error in auth listener:', e);
      }
    });
  }

  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    this.listeners.add(callback);
    callback(this.currentUser);
    return () => {
      this.listeners.delete(callback);
    };
  }

  async getCurrentUser(): Promise<User | null> {
    if (!this.currentUser) {
      await this.initSession();
    }
    return this.currentUser;
  }

  async getCurrentSession(): Promise<AuthSession | null> {
    if (!this.currentSession) {
      await this.initSession();
    }
    return this.currentSession;
  }

  async register(data: RegisterData): Promise<User> {
    const { user, session } = await userRepository.register(data);
    this.currentUser = user;
    this.currentSession = session;
    this.notifyListeners();
    return user;
  }

  async login(credentials: AuthCredentials): Promise<User> {
    const { user, session } = await userRepository.authenticate(credentials);
    this.currentUser = user;
    this.currentSession = session;
    this.notifyListeners();
    return user;
  }

  async logout(): Promise<void> {
    if (this.currentSession) {
      await userRepository.deleteSession(this.currentSession.token);
    }
    this.currentUser = null;
    this.currentSession = null;
    this.notifyListeners();
  }

  async requestPasswordReset(email: string): Promise<{ success: boolean; resetToken?: string }> {
    return userRepository.requestPasswordReset(email);
  }

  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    return userRepository.resetPassword(token, newPassword);
  }

  /**
   * Development demo role switcher:
   * Only active in offline/demo mode without live Supabase.
   * When live Supabase is configured, role escalation from client is strictly prevented.
   */
  async switchRoleForTesting(targetRole: UserRole): Promise<User> {
    if (isSupabaseConfigured()) {
      throw new Error(
        'في بيئة الإنتاج المتصلة بـ Supabase، لا يُسمح بتعديل دور الحساب من المتصفح. ترقية المشرفين تتم عبر استعلام SQL في لوحة التحكم.'
      );
    }

    let targetUserId = 'd0e8b1a2-3c4d-4e5f-a6b7-c8d9e0f1a2b3'; // Seeker
    if (targetRole === 'admin') targetUserId = 'f2a3b4c5-6d7e-8f9a-0b1c-2d3e4f5a6b7c';
    else if (targetRole === 'employer') targetUserId = 'e1f2a3b4-5c6d-7e8f-9a0b-1c2d3e4f5a6b';

    const user = await userRepository.getUserById(targetUserId);
    if (!user) {
      throw new Error(`لم يتم العثور على حساب تجريبي للدور ${targetRole}.`);
    }

    const session = await userRepository.createSession(user.id);
    this.currentUser = user;
    this.currentSession = session;
    this.notifyListeners();
    return user;
  }
}

export const authService = new AuthService();
