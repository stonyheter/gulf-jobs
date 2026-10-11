/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ============================================================================
 * CENTRALIZED SUPABASE CLIENT (PHASE 6.1)
 * ============================================================================
 * Provides the official Supabase JavaScript client configured with client-safe
 * public credentials (VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY).
 * 
 * SECURITY RULES:
 * 1. ONLY public client-safe variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) are used.
 * 2. NEVER include SUPABASE_SERVICE_ROLE_KEY or database passwords.
 * 3. Client security and authorization are strictly enforced by Row Level Security (RLS).
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { envConfig } from '../../config/env';

let clientInstance: SupabaseClient | null = null;

/**
 * Checks if Supabase client-safe credentials are fully configured.
 */
export function isSupabaseConfigured(): boolean {
  return envConfig.isSupabaseConfigured;
}

/**
 * Returns the centralized Supabase client instance.
 * If credentials are missing, returns null so repositories can isolate fallback safely.
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (clientInstance) {
    return clientInstance;
  }

  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    clientInstance = createClient(envConfig.supabaseUrl, envConfig.supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
    return clientInstance;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}

/**
 * Exported singleton instance. If not configured, this will be null.
 */
export const supabase = getSupabaseClient();
