import { GoogleGenAI } from '@google/genai';

// ═══════════════════════════════════════════════════════════════
// خدمة المستخدم: Embeddings + حفظ + توصيات
// ═══════════════════════════════════════════════════════════════

export async function generateUserEmbedding(apiKey, userText) {
  const ai = new GoogleGenAI({ apiKey });
  const res = await ai.models.embedContent({
    model: 'gemini-embedding-001',
    contents: userText,
    config: { taskType: 'RETRIEVAL_QUERY', outputDimensionality: 768 },
  });
  return res.embedding?.values || res.embeddings?.[0]?.values;
}

export function buildUserMatchText(profile) {
  const parts = [
    profile.targetJobTitle,
    profile.skills?.length ? `مهارات: ${profile.skills.join('، ')}` : null,
    profile.yearsOfExperience ? `خبرة ${profile.yearsOfExperience} سنوات` : null,
    profile.education,
    profile.city && profile.country ? `${profile.city}، ${profile.country}` : null,
  ];
  return parts.filter(Boolean).join(' | ');
}

export async function saveUserProfile(env, profile, embedding) {
  const payload = {
    user_id: profile.user_id,
    full_name: profile.fullName || null,
    email: profile.email || null,
    city: profile.city || null,
    target_job_title: profile.targetJobTitle,
    technical_skills: profile.skills || [],
    years_of_experience: profile.yearsOfExperience || null,
    education_level: profile.education || null,
    preferred_cities: profile.city ? [profile.city] : [],
    preferred_countries: profile.country ? [profile.country] : [],
    preferred_language: 'ar',
    email_digest: profile.email ? 'weekly' : 'off',
    match_text: buildUserMatchText(profile),
    embedding: '[' + embedding.join(',') + ']',
    embedded_at: new Date().toISOString(),
  };

  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/user_profiles`, {
    method: 'POST',
    headers: {
      'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': 'Bearer ' + env.SUPABASE_SERVICE_ROLE_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates,return=representation',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error('Save failed: ' + res.status + ' ' + err.slice(0, 200));
  }
  return (await res.json())[0];
}

export async function getUserProfile(env, userId) {
  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/user_profiles?user_id=eq.${userId}&select=*`,
    { headers: { 'apikey': env.SUPABASE_SERVICE_ROLE_KEY, 'Authorization': 'Bearer ' + env.SUPABASE_SERVICE_ROLE_KEY } }
  );
  if (!res.ok) throw new Error('Fetch failed');
  const data = await res.json();
  return data[0];
}

export async function getMatchingJobs(env, embedding, threshold = 0.4, limit = 20) {
  const vectorStr = '[' + embedding.join(',') + ']';
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/match_jobs_for_user`, {
    method: 'POST',
    headers: {
      'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': 'Bearer ' + env.SUPABASE_SERVICE_ROLE_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query_embedding: vectorStr, match_threshold: threshold, match_count: limit }),
  });
  if (!res.ok) throw new Error('Match failed: ' + res.status);
  return await res.json();
}

export function generateUserId() {
  return 'u-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
}