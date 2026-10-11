/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ============================================================================
 * AUTHENTICATION & IDENTITY DATA MODEL (PHASE 6.1 - SUPABASE AUTH)
 * ============================================================================
 * Defines user roles, identities, and session contracts for Gulf Jobs.
 * Passwords are NEVER stored, hashed, or processed in application tables.
 * Supabase Auth is the authoritative authentication and credential provider.
 */

export type UserRole = 'job_seeker' | 'employer' | 'admin';

export interface User {
  id: string; // Matches auth.users.id
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface AuthSession {
  token: string;
  userId: string;
  user: User;
  expiresAt: string;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  displayName: string;
  role?: UserRole;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token?: string;
  newPassword: string;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  session?: AuthSession;
  error?: string;
}
