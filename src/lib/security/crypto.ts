/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ============================================================================
 * CRYPTO & TOKEN UTILITIES (PHASE 6)
 * ============================================================================
 * Uses standard Web Crypto API (SHA-256) for secure salted password hashing,
 * verification, and cryptographically random session tokens.
 */

/**
 * Generates a random cryptographic salt.
 */
export function generateSalt(length = 16): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
  }
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Hashes a plaintext password combined with a salt using SHA-256.
 */
export async function hashPassword(password: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(`${salt}:${password}:gulf_jobs_secret_salt_v1`);

  if (typeof crypto !== 'undefined' && crypto.subtle && crypto.subtle.digest) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  // Fallback deterministic hash if subtle crypto is somehow unavailable
  let hash = 0;
  const str = `${salt}:${password}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(32, '0');
}

/**
 * Verifies a candidate password against an existing hash and salt.
 */
export async function verifyPassword(
  candidate: string,
  storedHash: string,
  salt: string
): Promise<boolean> {
  const candidateHash = await hashPassword(candidate, salt);
  return candidateHash === storedHash;
}

/**
 * Generates a secure session token.
 */
export function generateSessionToken(): string {
  const salt = generateSalt(24);
  const timestamp = Date.now().toString(36);
  return `gj_sess_${timestamp}_${salt}`;
}
