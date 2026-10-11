/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ============================================================================
 * USER REPOSITORY CONTRACT (PHASE 6)
 * ============================================================================
 */

import { User, AuthSession, AuthCredentials, RegisterData } from '../types/auth';

export interface IUserRepository {
  register(data: RegisterData): Promise<{ user: User; session: AuthSession }>;
  authenticate(credentials: AuthCredentials): Promise<{ user: User; session: AuthSession }>;
  getUserById(id: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  createSession(userId: string): Promise<AuthSession>;
  validateSession(token: string): Promise<AuthSession | null>;
  deleteSession(token: string): Promise<void>;
  requestPasswordReset(email: string): Promise<{ success: boolean; resetToken?: string }>;
  resetPassword(token: string, newPassword: string): Promise<{ success: boolean; error?: string }>;
  getAllUsers(): Promise<User[]>;
  seedInitialUsers(): Promise<void>;
}
