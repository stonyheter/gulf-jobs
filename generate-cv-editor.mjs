import fs from 'fs';
import path from 'path';
import http from 'http';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import { htmlToPdf } from './lib/pdf.mjs';
import { renderAtsHtml, renderVisualHtml } from './lib/templates.mjs';
import { generateCV, generateTips } from './lib/gemini.mjs';
import { buildEditorPage } from './lib/editor-page.mjs';
import { buildSuccessPage } from './lib/success-page.mjs';
import { buildStartPage } from './lib/start-page.mjs';
import { buildMatchesPage } from './lib/matches-page.mjs';
import { buildAuthPage } from './lib/auth-page.mjs';
import { generateUserEmbedding, buildUserMatchText, saveUserProfile, getUserProfile, getMatchingJobs, generateUserId } from './lib/user-service.mjs';
import { sendOtp, verifyOtp, getCurrentUser, appendCookie, parseCookies } from './lib/auth-service.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '.env.import');
const env = {};
fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim();
});

const PORT = 3456;

async function getJobById(jobId) {
  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/jobs?select=*&id=eq.${jobId}`,
    { headers: { 'apikey': env.SUPABASE_SERVICE_ROLE_KEY, 'Authorization': 'Bearer ' + env.SUPABASE_SERVICE_ROLE_KEY } }
  );
  const data = await res.json();
  return data[0];
}

async function sendFeedbackEmail(payload) {
  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) return;
  const stars = '★'.repeat(payload.rating) + '☆'.repeat(5 - payload.rating);
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'onboarding@resend.dev',
        to: 'stonyheter@gmail.com',
        subject: `${stars} فيدباك (${payload.rating}/5) — ${payload.category}`,
        html: `<h2>فيدباك جديد</h2><p><strong>${stars}</strong> ${payload.rating}/5</p><p>المستخدم: ${payload.user_name}</p><p>الفئة: ${payload.category}</p>${payload.message ? '<p>الرسالة: ' + payload.message + '</p>' : ''}`,
      }),
    });
  } catch {}
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}
function sendJson(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(obj));
}
function sendHtml(res, html) {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
}

async function main() {
  console.log('\n=== منصة وظائف الخليج — سيرفر محلي ===\n');
  console.log('📋 فحص قاعدة البيانات...');
  const testRes = await fetch(
    `${env.SUPABASE_URL}/rest/v1/jobs?select=id&status_new=eq.active&limit=1`,
    { headers: { 'apikey': env.SUPABASE_SERVICE_ROLE_KEY, 'Authorization': 'Bearer ' + env.SUPABASE_SERVICE_ROLE_KEY } }
  );
  const jobs = await testRes.json();
  console.log(`✅ الاتصال ناجح\n`);

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const pathname = url.pathname;

    try {
      // ═══ الصفحة الرئيسية ═══
      if (req.method === 'GET' && (pathname === '/' || pathname === '/start')) {
        return sendHtml(res, buildStartPage());
      }

      // ═══ صفحة تسجيل الدخول ═══
      if (req.method === 'GET' && pathname === '/login') {
        const returnUrl = url.searchParams.get('return') || '/';
        return sendHtml(res, buildAuthPage(returnUrl));
      }

      // ═══ API: إرسال OTP ═══
      if (req.method === 'POST' && pathname === '/api/auth/send-otp') {
        const body = await readBody(req);
        const { email } = JSON.parse(body);
        if (!email) return sendJson(res, 400, { error: 'البريد مطلوب' });

        console.log(`\n📧 إرسال OTP إلى: ${email}`);
        try {
          await sendOtp(env, email);
          console.log(`   ✅ تم الإرسال\n`);
          return sendJson(res, 200, { success: true });
        } catch (err) {
          console.log(`   ❌ فشل: ${err.message}\n`);
          return sendJson(res, 400, { error: err.message });
        }
      }

      // ═══ API: التحقق من OTP ═══
      if (req.method === 'POST' && pathname === '/api/auth/verify-otp') {
        const body = await readBody(req);
        const { email, token } = JSON.parse(body);
        if (!email || !token) return sendJson(res, 400, { error: 'البريد والرمز مطلوبان' });

        console.log(`\n🔐 تحقق من OTP لـ ${email}`);
        try {
          const { session, user } = await verifyOtp(env, email, token);
          if (!session) return sendJson(res, 400, { error: 'لم يتم إنشاء جلسة' });

          // تخزين التوكن في cookie
          appendCookie(res, 'sb_token', session.access_token, {
            maxAge: 3600,
            httpOnly: true,
            path: '/',
            sameSite: 'Lax',
          });
          appendCookie(res, 'sb_email', user.email, {
            maxAge: 3600,
            path: '/',
            sameSite: 'Lax',
          });

          console.log(`   ✅ تم الدخول: ${user.email}\n`);
          return sendJson(res, 200, { success: true, user: { id: user.id, email: user.email } });
        } catch (err) {
          console.log(`   ❌ فشل: ${err.message}\n`);
          return sendJson(res, 400, { error: err.message });
        }
      }

      // ═══ API: تسجيل الخروج ═══
      if (req.method === 'POST' && pathname === '/api/auth/logout') {
        appendCookie(res, 'sb_token', '', { maxAge: 0, path: '/' });
        appendCookie(res, 'sb_email', '', { maxAge: 0, path: '/' });
        return sendJson(res, 200, { success: true });
      }

      // ═══ API: معلومات المستخدم الحالي ═══
      if (req.method === 'GET' && pathname === '/api/auth/me') {
        const user = await getCurrentUser(req, env);
        return sendJson(res, 200, { user });
      }

      // ═══ POST /api/start: حفظ الملف المهني ═══
      if (req.method === 'POST' && pathname === '/api/start') {
        const body = await readBody(req);
        const profile = JSON.parse(body);

        console.log(`\n📥 مستخدم جديد: ${profile.fullName} — ${profile.targetJobTitle}`);
        const userId = generateUserId();
        const matchText = buildUserMatchText(profile);
        const embedding = await generateUserEmbedding(env.GEMINI_API_KEY, matchText);
        if (!embedding) throw new Error('Embedding failed');

        const saved = await saveUserProfile(env, { ...profile, user_id: userId }, embedding);
        console.log(`   ✅ تم الحفظ (${userId})\n`);
        return sendJson(res, 200, { userId, profile: saved });
      }

      // ═══ صفحة التوصيات ═══
      if (req.method === 'GET' && pathname === '/matches') {
        const userId = url.searchParams.get('u');
        if (!userId) { res.writeHead(302, { Location: '/' }); return res.end(); }

        console.log(`\n🔍 جلب التوصيات لـ ${userId}...`);
        const profile = await getUserProfile(env, userId);
        if (!profile) { res.writeHead(302, { Location: '/' }); return res.end(); }

        const embedding = typeof profile.embedding === 'string'
          ? JSON.parse(profile.embedding)
          : profile.embedding;

        const matches = await getMatchingJobs(env, embedding, 0.3, 20);
        console.log(`   ✅ ${matches.length} مطابقة\n`);
        return sendHtml(res, buildMatchesPage(profile, matches));
      }

      // ═══ محرر السيرة (يتطلب تسجيل دخول) ═══
      if (req.method === 'GET' && pathname.startsWith('/cv/')) {
        const user = await getCurrentUser(req, env);
        if (!user) {
          const returnUrl = encodeURIComponent(pathname);
          res.writeHead(302, { Location: `/login?return=${returnUrl}` });
          return res.end();
        }

        const parts = pathname.split('/').filter(Boolean);
        const [, userId, jobId] = parts;
        if (!userId || !jobId) { res.writeHead(400); return res.end('Missing params'); }

        const [profile, job] = await Promise.all([getUserProfile(env, userId), getJobById(jobId)]);
        if (!profile || !job) { res.writeHead(404); return res.end('Not found'); }

        const userData = {
          fullName: profile.full_name || profile.target_job_title,
          email: user.email,
          phone: '',
          city: (profile.preferred_cities || [])[0] || '',
          country: (profile.preferred_countries || [])[0] || 'المملكة العربية السعودية',
          targetJobTitle: profile.target_job_title,
          yearsOfExperience: profile.years_of_experience || 0,
          education: profile.education_level || '',
          skills: profile.technical_skills || [],
          languages: [{ name: 'العربية', level: 'اللغة الأم' }],
          experience: [],
        };

        console.log(`\n🎨 توليد CV لـ ${user.email} → ${job.title}`);
        const cvData = await generateCV(env.GEMINI_API_KEY, userData, job);
        return sendHtml(res, buildEditorPage(cvData, userData, job));
      }

      // ═══ صفحة النجاح ═══
      if (req.method === 'GET' && pathname === '/success') {
        const jobId = url.searchParams.get('job');
        const userId = url.searchParams.get('u');
        let job = jobId ? await getJobById(jobId) : null;
        if (!job) {
          const r = await fetch(`${env.SUPABASE_URL}/rest/v1/jobs?select=*&status_new=eq.active&order=created_at.desc&limit=1`,
            { headers: { 'apikey': env.SUPABASE_SERVICE_ROLE_KEY, 'Authorization': 'Bearer ' + env.SUPABASE_SERVICE_ROLE_KEY } });
          job = (await r.json())[0];
        }
        const profile = userId ? await getUserProfile(env, userId) : null;
        const userData = profile ? { fullName: profile.full_name || 'مستخدم', email: profile.email || '', targetJobTitle: profile.target_job_title } : { fullName: 'مستخدم', email: '', targetJobTitle: '' };
        let tips = { tips: [] };
        try { tips = await generateTips(env.GEMINI_API_KEY, userData, job); } catch {}
        return sendHtml(res, buildSuccessPage(tips, job, userData, {}));
      }

      // ═══ API: PDF ═══
      if (req.method === 'POST' && pathname === '/api/pdf') {
        const body = await readBody(req);
        const { data, mode, user } = JSON.parse(body);
        const html = mode === 'ats' ? renderAtsHtml(user, data) : renderVisualHtml(user, data);
        const pdfPath = path.join(__dirname, `.tmp-pdf-${Date.now()}.pdf`);
        htmlToPdf(html, pdfPath);
        const buf = fs.readFileSync(pdfPath);
        try { fs.unlinkSync(pdfPath); } catch {}
        res.writeHead(200, { 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="cv.pdf"' });
        return res.end(buf);
      }

      // ═══ API: فيدباك ═══
      if (req.method === 'POST' && pathname === '/api/feedback') {
        const body = await readBody(req);
        const payload = JSON.parse(body);
        const fbRes = await fetch(`${env.SUPABASE_URL}/rest/v1/feedback`, {
          method: 'POST',
          headers: { 'apikey': env.SUPABASE_SERVICE_ROLE_KEY, 'Authorization': 'Bearer ' + env.SUPABASE_SERVICE_ROLE_KEY, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
          body: JSON.stringify(payload),
        });
        if (!fbRes.ok) return sendJson(res, 500, { error: await fbRes.text() });
        sendFeedbackEmail(payload).catch(() => {});
        return sendJson(res, 200, { success: true });
      }

      // ═══ API: redirect ═══
      if (req.method === 'GET' && pathname === '/api/job-redirect') {
        const jobId = url.searchParams.get('id');
        const job = await getJobById(jobId);
        if (job?.application_url) { res.writeHead(302, { Location: job.application_url }); return res.end(); }
        res.writeHead(404); return res.end();
      }

      res.writeHead(404); res.end('Not found');
    } catch (err) {
      console.error('❌ Server error:', err);
      res.writeHead(500); res.end('Server error: ' + err.message);
    }
  });

  server.listen(PORT, () => {
    console.log(`🌐 السيرفر يعمل على http://localhost:${PORT}`);
    console.log(`   🏠 الرئيسية:  http://localhost:${PORT}/`);
    console.log(`   🔐 الدخول:   http://localhost:${PORT}/login`);
    console.log('🚀 فتح المتصفح...\n');
    exec(`start http://localhost:${PORT}/`);
  });
}

main().catch(e => { console.error('❌', e); process.exit(1); });