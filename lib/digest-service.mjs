// ═══════════════════════════════════════════════════════════════
// خدمة التنبيهات البريدية
// ═══════════════════════════════════════════════════════════════

const SB = (env) => ({
  'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
  'Authorization': 'Bearer ' + env.SUPABASE_SERVICE_ROLE_KEY,
  'Content-Type': 'application/json',
});

// 1. جلب المستخدمين المؤهلين للتنبيهات
export async function getDigestUsers(env) {
  const url = `${env.SUPABASE_URL}/rest/v1/user_profiles` +
    `?select=user_id,email,full_name,city,digests_sent,last_digest_at,target_job_title,technical_skills,embedding` +
    `&email=not.is.null&email_digest=eq.weekly&embedding=not.is.null`;
  
  const res = await fetch(url, { headers: SB(env) });
  if (!res.ok) throw new Error('Fetch users failed: ' + res.status);
  return await res.json();
}

// 2. جلب الوظائف المُرسلة سابقًا لمستخدم
export async function getSentJobIds(env, userId) {
  const url = `${env.SUPABASE_URL}/rest/v1/digest_sent_jobs?select=job_id&user_id=eq.${userId}`;
  const res = await fetch(url, { headers: SB(env) });
  if (!res.ok) return new Set();
  const data = await res.json();
  return new Set(data.map(r => r.job_id));
}

// 3. إيجاد وظائف مطابقة للمستخدم
export async function findMatchesForUser(env, user, threshold = 0.55, limit = 5) {
  const embedding = typeof user.embedding === 'string'
    ? JSON.parse(user.embedding)
    : user.embedding;
  
  const vectorStr = '[' + embedding.join(',') + ']';

  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/match_jobs_for_user`, {
    method: 'POST',
    headers: SB(env),
    body: JSON.stringify({
      query_embedding: vectorStr,
      match_threshold: threshold,
      match_count: 30,
    }),
  });

  if (!res.ok) throw new Error('Match failed: ' + res.status);
  return await res.json();
}

// 4. جلب تفاصيل وظيفة كاملة
export async function getJobDetails(env, jobIds) {
  if (!jobIds.length) return {};
  const ids = jobIds.map(id => `"${id}"`).join(',');
  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/jobs?select=id,title,company_name,city,country,application_url,source_url&id=in.(${ids})`,
    { headers: SB(env) }
  );
  if (!res.ok) return {};
  const data = await res.json();
  return Object.fromEntries(data.map(j => [j.id, j]));
}

// 5. إرسال الإيميل عبر Resend
export async function sendDigestEmail(env, user, jobs) {
  const { buildDigestEmail } = await import('./digest-template.mjs');
  const html = buildDigestEmail(user, jobs);

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + env.RESEND_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'onboarding@resend.dev',
      to: user.email,
      subject: `🎯 ${jobs.length} وظائف جديدة تطابق مهاراتك`,
      html,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error('Email failed: ' + res.status + ' ' + err.slice(0, 200));
  }
  return await res.json();
}

// 6. تسجيل ما أُرسل + تحديث counters
export async function markDigestSent(env, user, jobIds) {
  // أ) سجّل الوظائف
  const rows = jobIds.map(jobId => ({ user_id: user.user_id, job_id: jobId }));
  await fetch(`${env.SUPABASE_URL}/rest/v1/digest_sent_jobs`, {
    method: 'POST',
    headers: { ...SB(env), 'Prefer': 'resolution=ignore-duplicates' },
    body: JSON.stringify(rows),
  });

  // ب) حدّث user_profiles
  await fetch(`${env.SUPABASE_URL}/rest/v1/user_profiles?user_id=eq.${user.user_id}`, {
    method: 'PATCH',
    headers: { ...SB(env), 'Prefer': 'return=minimal' },
    body: JSON.stringify({
      last_digest_at: new Date().toISOString(),
      digests_sent: (user.digests_sent || 0) + 1,
    }),
  });
}