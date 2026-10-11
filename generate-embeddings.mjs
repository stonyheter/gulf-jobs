import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '.env.import');
const env = {};
fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim();
});

const SUPABASE_URL = env.SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const GEMINI_KEY = env.GEMINI_API_KEY;

const ai = new GoogleGenAI({ apiKey: GEMINI_KEY });
const MODEL = 'gemini-embedding-001';

console.log('\n=== توليد Embeddings للوظائف ===\n');
console.log(`🤖 الموديل: ${MODEL}\n`);

async function getJobsWithoutEmbedding(limit = 100) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/jobs?select=id,title,company_name,description,city,country&embedding=is.null&limit=${limit}`,
    { headers: { 'apikey': SERVICE_KEY, 'Authorization': 'Bearer ' + SERVICE_KEY } }
  );
  return res.ok ? await res.json() : [];
}

function buildMatchText(job) {
  const parts = [
    job.title,
    job.company_name,
    job.city && job.country ? `${job.city}, ${job.country}` : null,
    job.description ? job.description.slice(0, 2000) : null,
  ];
  return parts.filter(Boolean).join(' | ');
}

async function generateEmbedding(text) {
  try {
    const response = await ai.models.embedContent({
      model: MODEL,
      contents: text,
      config: {
        taskType: 'RETRIEVAL_DOCUMENT',
        outputDimensionality: 768,
      },
    });

    // Handle both response formats (embedding singular or embeddings plural)
    const values = response.embedding?.values 
                || response.embeddings?.[0]?.values 
                || null;

    if (!values || values.length === 0) throw new Error('No embedding values in response');
    return values;
  } catch (err) {
    const msg = err.message || String(err);
    console.error(`\n   ⚠️ ${msg.slice(0, 150)}`);
    return null;
  }
}

async function updateJobEmbedding(jobId, embedding, matchText) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/jobs?id=eq.${jobId}`, {
    method: 'PATCH',
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': 'Bearer ' + SERVICE_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify({
      embedding,
      match_text: matchText,
      embedded_at: new Date().toISOString(),
    }),
  });
  return res.ok;
}

async function main() {
  const start = Date.now();
  const jobs = await getJobsWithoutEmbedding(100);
  console.log(`📊 وظائف بحاجة إلى Embedding: ${jobs.length}\n`);

  if (!jobs.length) {
    console.log('✅ جميع الوظائف لديها Embedding بالفعل.');
    return;
  }

  let success = 0, failed = 0;

  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i];
    const matchText = buildMatchText(job);
    
    process.stdout.write(`   [${i + 1}/${jobs.length}] ${(job.title || '').slice(0, 45)}... `);
    
    const embedding = await generateEmbedding(matchText);
    if (embedding) {
      const ok = await updateJobEmbedding(job.id, embedding, matchText);
      if (ok) {
        success++;
        console.log(`✅ (${embedding.length}d)`);
      } else {
        failed++;
        console.log('❌ DB update');
      }
    } else {
      failed++;
    }

    await new Promise(r => setTimeout(r, 700));
  }

  console.log(`\n=== 🎉 اكتمل ===`);
  console.log(`✅ نجح: ${success}`);
  console.log(`❌ فشل: ${failed}`);
  console.log(`⏱️ ${((Date.now() - start) / 1000).toFixed(1)}s\n`);
}

main().catch(e => { console.error('❌', e); process.exit(1); });