import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '.env.import');
const env = {};
fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim();
});

const SUPABASE_URL = env.SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Missing env vars in .env.import');
  process.exit(1);
}

const LIMIT = parseInt(process.argv[2] || '50');
const CONCURRENCY = 5;

console.log(`\n=== فحص حالة الوظائف ===`);
console.log(`📊 فحص حتى ${LIMIT} وظيفة | ⚡ التوازي: ${CONCURRENCY}\n`);

// 1. جلب الوظائف النشطة
async function getActiveJobs() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/jobs?select=id,application_url,source_name&status_new=eq.active&order=created_at.asc&limit=${LIMIT}`,
    { headers: { 'apikey': SERVICE_KEY, 'Authorization': 'Bearer ' + SERVICE_KEY } }
  );
  return res.ok ? await res.json() : [];
}

// 2. فحص رابط واحد
async function checkLiveness(job) {
  if (!job.application_url) return { status: 'unknown', reason: 'no_url' };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(job.application_url, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'manual',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
      },
    });
    clearTimeout(timeout);

    if (res.status === 404 || res.status === 410) {
      return { status: 'expired', reason: `HTTP ${res.status}` };
    }

    if ([301, 302, 307, 308].includes(res.status)) {
      const location = res.headers.get('location');
      // Redirect إلى home page = الوظيفة محذوفة
      if (location && (location.endsWith('/') || location.includes('/jobs/') === false)) {
        return { status: 'removed', reason: 'redirected' };
      }
    }

    if (res.status === 403 || res.status === 429) {
      return { status: 'unknown', reason: `HTTP ${res.status} (blocked)` };
    }

    if (res.status >= 200 && res.status < 400) {
      return { status: 'active', reason: `HTTP ${res.status}` };
    }

    return { status: 'unknown', reason: `HTTP ${res.status}` };
  } catch (err) {
    if (err.name === 'AbortError') return { status: 'unknown', reason: 'timeout' };
    if (err.message.includes('ENOTFOUND') || err.message.includes('getaddrinfo')) {
      return { status: 'removed', reason: 'DNS error' };
    }
    return { status: 'unknown', reason: err.message.slice(0, 50) };
  }
}

// 3. تحديث حالة الوظيفة
async function updateJobStatus(jobId, status, reason) {
  const body = status === 'active'
    ? { last_seen_at: new Date().toISOString() }
    : {
        status_new: status,
        removed_at: new Date().toISOString(),
      };

  const res = await fetch(`${SUPABASE_URL}/rest/v1/jobs?id=eq.${jobId}`, {
    method: 'PATCH',
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': 'Bearer ' + SERVICE_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify(body),
  });
  return res.ok;
}

// 4. المعالجة بالتوازي
async function processBatch(jobs, size) {
  const results = { active: 0, expired: 0, removed: 0, unknown: 0 };
  const deadJobs = [];

  for (let i = 0; i < jobs.length; i += size) {
    const batch = jobs.slice(i, i + size);
    const checks = await Promise.all(batch.map(job => checkLiveness(job)));

    for (let j = 0; j < batch.length; j++) {
      const job = batch[j];
      const result = checks[j];
      results[result.status]++;

      if (result.status !== 'unknown') {
        await updateJobStatus(job.id, result.status, result.reason);
      }

      if (result.status === 'expired' || result.status === 'removed') {
        deadJobs.push({ url: job.application_url, ...result });
      }

      const icon = result.status === 'active' ? '✅' : 
                   result.status === 'expired' ? '⏰' :
                   result.status === 'removed' ? '🗑️' : '❓';
      const shortUrl = (job.application_url || '').substring(0, 60);
      console.log(`   ${icon} ${result.status.padEnd(8)} ${result.reason.padEnd(15)} ${shortUrl}`);
    }

    // تأخير بين الدفعات
    if (i + size < jobs.length) await new Promise(r => setTimeout(r, 500));
  }

  return { results, deadJobs };
}

async function main() {
  const start = Date.now();
  const jobs = await getActiveJobs();
  console.log(`📋 عدد الوظائف للفحص: ${jobs.length}\n`);

  if (!jobs.length) {
    console.log('لا توجد وظائف نشطة.');
    return;
  }

  const { results, deadJobs } = await processBatch(jobs, CONCURRENCY);

  console.log(`\n=== 🎉 اكتمل الفحص ===`);
  console.log(`✅ نشطة:      ${results.active}`);
  console.log(`⏰ منتهية:    ${results.expired}`);
  console.log(`🗑️ محذوفة:    ${results.removed}`);
  console.log(`❓ غير معروفة: ${results.unknown}`);
  console.log(`⏱️ المدة: ${((Date.now() - start) / 1000).toFixed(1)}s\n`);
}

main().catch(e => { console.error('❌', e); process.exit(1); });