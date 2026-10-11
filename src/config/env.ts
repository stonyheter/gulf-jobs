/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ============================================================================
 * ENVIRONMENT CONFIGURATION (PHASE 6.1)
 * ============================================================================
 * Strongly-typed access to public Supabase client configuration.
 * Only client-safe environment variables are exposed (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY).
 * 
 * SECURITY:
 * NEVER expose SUPABASE_SERVICE_ROLE_KEY, database passwords, or server secrets in this module.
 */

export interface AppEnvConfig {
  appName: string;
  appEnv: 'production' | 'development' | 'test';
  appUrl: string;
  apiBaseUrl: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  isSupabaseConfigured: boolean;
  storageBucket: string;
  maxCvFileSizeMb: number;
}

export function getEnvConfig(): AppEnvConfig {
  const metaEnv = (typeof import.meta !== 'undefined' && (import.meta as any).env) || {};
  const env = (typeof process !== 'undefined' && process.env) ? process.env : {};

  const getVar = (name: string, fallback: string = ''): string => {
    return (
      metaEnv[name] ||
      metaEnv[`VITE_${name}`] ||
      (env as any)[name] ||
      (env as any)[`VITE_${name}`] ||
      fallback
    );
  };

  const supabaseUrl = getVar('VITE_SUPABASE_URL', getVar('SUPABASE_URL', ''));
  const supabaseAnonKey = getVar('VITE_SUPABASE_ANON_KEY', getVar('SUPABASE_ANON_KEY', ''));

  // Validates if real credentials are provided (non-empty, valid URL pattern, not placeholder)
  const isSupabaseConfigured = Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('http') &&
    !supabaseUrl.includes('placeholder') &&
    !supabaseAnonKey.includes('placeholder') &&
    supabaseAnonKey.length > 20
  );

  const appEnv = (getVar('APP_ENV', 'development') as 'production' | 'development' | 'test');

  return {
    appName: getVar('APP_NAME', 'وظائف الخليج - Gulf Jobs'),
    appEnv,
    appUrl: getVar('APP_URL', 'http://localhost:3000'),
    apiBaseUrl: getVar('API_BASE_URL', '/api'),
    supabaseUrl,
    supabaseAnonKey,
    isSupabaseConfigured,
    storageBucket: getVar('STORAGE_BUCKET', 'private-cvs'),
    maxCvFileSizeMb: parseInt(getVar('MAX_CV_FILE_SIZE_MB', '5'), 10) || 5,
  };
}

export const envConfig = getEnvConfig();
