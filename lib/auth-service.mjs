import { createClient } from '@supabase/supabase-js';

// ═══════════════════════════════════════════════════════════════
// Auth Service — Supabase OTP + Session
// ═══════════════════════════════════════════════════════════════

function authClient(env) {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

export async function sendOtp(env, email) {
  const client = authClient(env);
  const { data, error } = await client.auth.signInWithOtp({
    email: email.toLowerCase().trim(),
    options: { shouldCreateUser: true },
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function verifyOtp(env, email, token) {
  const client = authClient(env);
  const { data, error } = await client.auth.verifyOtp({
    email: email.toLowerCase().trim(),
    token: String(token).trim(),
    type: 'email',
  });
  if (error) throw new Error(error.message);
  return data; // { session, user }
}

export async function getUserFromToken(env, accessToken) {
  if (!accessToken) return null;
  try {
    const res = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
      headers: {
        'apikey': env.SUPABASE_ANON_KEY,
        'Authorization': 'Bearer ' + accessToken,
      },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════
// Cookie Helpers
// ═══════════════════════════════════════════════════════════════

export function parseCookies(req) {
  const header = req.headers.cookie || '';
  const cookies = {};
  header.split(';').forEach(c => {
    const [k, ...v] = c.trim().split('=');
    if (k) cookies[k] = decodeURIComponent(v.join('='));
  });
  return cookies;
}

export function appendCookie(res, name, value, options = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  if (options.maxAge !== undefined) parts.push(`Max-Age=${options.maxAge}`);
  if (options.httpOnly) parts.push('HttpOnly');
  if (options.path) parts.push(`Path=${options.path}`);
  if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);
  if (options.secure) parts.push('Secure');

  const prev = res.getHeader('Set-Cookie');
  const cookie = parts.join('; ');
  if (prev) {
    res.setHeader('Set-Cookie', Array.isArray(prev) ? [...prev, cookie] : [prev, cookie]);
  } else {
    res.setHeader('Set-Cookie', cookie);
  }
}

export async function getCurrentUser(req, env) {
  const cookies = parseCookies(req);
  const token = cookies.sb_token;
  if (!token) return null;
  return await getUserFromToken(env, token);
}