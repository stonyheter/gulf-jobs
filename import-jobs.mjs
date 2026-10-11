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
  console.error('❌ Missing env vars');
  process.exit(1);
}

const RSS_SOURCES = [
  { url: 'https://jadarat.news/feed/', name: 'جدارات نيوز' },
  { url: 'https://saudij.news/feed/', name: 'سعودي جوبز' },
  { url: 'https://wazayef2.com/feed/', name: 'وظائف 2' },
  { url: 'https://wathifat.com/feed/', name: 'وظائف' },
];

const SB_HEADERS = {
  'apikey': SERVICE_KEY,
  'Authorization': 'Bearer ' + SERVICE_KEY,
  'Content-Type': 'application/json',
};

console.log('\n=== استيراد وظائف من RSS عربي ===\n');

function parseRSS(xml, sourceName) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const item = match[1];
    const get = (tag) => {
      const m = item.match(new RegExp(`<${tag}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>|<${tag}>([\\s\\S]*?)</${tag}>`));
      return m ? (m[1] || m[2] || '').trim() : '';
    };
    const title = get('title');
    const link = get('link');
    const description = get('description');
    const pubDate = get('pubDate');
    const category = get('category');
    if (title && link) {
      items.push({ title: title.replace(/<[^>]+>/g, '').trim(), link, description, pubDate, category, sourceName });
    }
  }
  return items;
}

function extractCity(text) {
  const cities = ['الرياض', 'جدة', 'الدمام', 'مكة', 'المدينة', 'الخبر', 'الظهران', 'دبي', 'أبوظبي', 'الدوحة', 'الكويت', 'المنامة', 'مسقط'];
  for (const c of cities) if (text.includes(c)) return c;
  return 'غير محدد';
}

function mapItem(item) {
  const now = new Date().toISOString();
  const datePosted = item.pubDate ? new Date(item.pubDate).toISOString() : now;
  const legacyId = 'rss-' + Buffer.from(item.link).toString('base64').slice(0, 16).replace(/[+/=]/g, '') + '-' + Date.now().toString(36).slice(-4);
  const slug = item.title.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);

  return {
    legacy_id: legacyId,
    title: item.title,
    company_name: 'شركة',
    company_logo: null,
    category: (item.category || 'general').toLowerCase().replace(/\s+/g, '_'),
    country: 'المملكة العربية السعودية',
    region: null,
    city: extractCity(item.title + ' ' + (item.description || '')),
    district: null,
    address: null,
    work_mode: 'on_site',
    employment_type: 'full_time',
    experience_min: null,
    experience_max: null,
    education: null,
    salary_min: null,
    salary_max: null,
    salary_currency: 'SAR',
    description: (item.description || item.title).replace(/<[^>]+>/g, '').trim().slice(0, 5000),
    responsibilities: [],
    requirements: [],
    skills: [],
    languages: ['ar'],
    benefits: [],
    application_method: 'external_url',
    application_url: item.link,
    source_name: item.sourceName,
    source_url: item.link,
    original_job_url: item.link,
    date_posted: datePosted,
    valid_through: null,
    status: 'published',
    status_new: 'active',
    first_seen_at: now,
    last_seen_at: now,
    source_board: item.sourceName,
    slug: slug + '-' + legacyId.slice(-6),
    imported_at: now,
    last_checked_at: now,
  };
}

// فحص كل رابط على حدة (أكثر دقة من IN)
async function checkExists(url) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/jobs?select=id&source_url=eq.${encodeURIComponent(url)}&limit=1`, {
    headers: { 'apikey': SERVICE_KEY, 'Authorization': 'Bearer ' + SERVICE_KEY },
  });
  if (!res.ok) return false;
  const data = await res.json();
  return data.length > 0;
}

async function insertJobs(jobs) {
  let inserted = 0;
  for (let i = 0; i < jobs.length; i += 20) {
    const batch = jobs.slice(i, i + 20);
    const res = await fetch(`${SUPABASE_URL}/rest/v1/jobs`, {
      method: 'POST',
      headers: { ...SB_HEADERS, 'Prefer': 'return=minimal' },
      body: JSON.stringify(batch),
    });
    if (res.ok) {
      inserted += batch.length;
      console.log(`      ✅ ${batch.length} وظيفة`);
    } else {
      console.error(`      ❌ ${res.status}:`, (await res.text()).slice(0, 200));
    }
  }
  return inserted;
}

async function main() {
  const start = Date.now();
  let totalFetched = 0, totalNew = 0, totalInserted = 0;

  for (const source of RSS_SOURCES) {
    console.log(`\n📡 [${source.name}]`);
    try {
      const res = await fetch(source.url, { headers: { 'User-Agent': 'GulfJobs-Bot/1.0' } });
      if (!res.ok) { console.log(`   ❌ فشل: ${res.status}`); continue; }

      const xml = await res.text();
      const items = parseRSS(xml, source.name);
      totalFetched += items.length;
      console.log(`   ✅ ${items.length} وظيفة`);

      if (!items.length) continue;

      // فحص كل رابط على حدة (موثوق)
      const fresh = [];
      for (const item of items) {
        const exists = await checkExists(item.link);
        if (!exists) fresh.push(mapItem(item));
      }

      totalNew += fresh.length;
      console.log(`   ✅ ${fresh.length} جديدة`);

      if (fresh.length) {
        const ins = await insertJobs(fresh);
        totalInserted += ins;
      }
    } catch (err) {
      console.log(`   ❌ ${err.message}`);
    }
  }

  console.log(`\n=== 🎉 اكتمل ===`);
  console.log(`📊 من المصادر: ${totalFetched}`);
  console.log(`✅ جديدة: ${totalNew}`);
  console.log(`✅ أُضيفت: ${totalInserted}`);
  console.log(`⏱️ ${((Date.now() - start) / 1000).toFixed(1)}s\n`);
}

main().catch(e => { console.error('❌', e); process.exit(1); });