import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  getDigestUsers,
  getSentJobIds,
  findMatchesForUser,
  getJobDetails,
  sendDigestEmail,
  markDigestSent,
} from './lib/digest-service.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '.env.import');
const env = {};
fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim();
});

const DRY_RUN = process.argv.includes('--dry-run');
const MIN_MATCHES = 1; // أرسل حتى لو وظيفة واحدة
const MIN_SIMILARITY = 0.55;

async function main() {
  const start = Date.now();
  console.log('\n═══════════════════════════════════════════');
  console.log('  📬 تشغيل التنبيهات البريدية الأسبوعية');
  console.log('═══════════════════════════════════════════\n');
  if (DRY_RUN) console.log('🧪 وضع التجربة (DRY RUN) — لن يتم إرسال إيميلات\n');

  // 1. جلب المستخدمين
  console.log('📋 جلب المستخدمين المؤهلين...');
  const users = await getDigestUsers(env);
  console.log(`✅ ${users.length} مستخدم\n`);

  if (!users.length) {
    console.log('لا يوجد مستخدمون مؤهلون. تأكد من إدخال البريد عند التسجيل.\n');
    return;
  }

  let sent = 0, skipped = 0, errors = 0;

  // 2. معالجة كل مستخدم
  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    console.log(`\n👤 [${i + 1}/${users.length}] ${user.full_name} <${user.email}>`);

    try {
      // أ) الوظائف المُرسلة سابقًا
      const sentIds = await getSentJobIds(env, user.user_id);
      console.log(`   📜 سبق إرسال ${sentIds.size} وظيفة له`);

      // ب) الوظائف المطابقة
      const matches = await findMatchesForUser(env, user, MIN_SIMILARITY, 30);
      console.log(`   🎯 ${matches.length} وظيفة مطابقة (≥ ${Math.round(MIN_SIMILARITY * 100)}%)`);

      // ج) استبعاد المُرسل
      const fresh = matches.filter(m => !sentIds.has(m.id));
      console.log(`   ✨ ${fresh.length} وظيفة جديدة`);

      if (fresh.length < MIN_MATCHES) {
        console.log(`   ⏭️ تخطي (لا وظائف جديدة)`);
        skipped++;
        continue;
      }

      // د) أفضل 5 وظائف
      const top5 = fresh.slice(0, 5);

      // هـ) جلب التفاصيل الكاملة
      const jobDetails = await getJobDetails(env, top5.map(j => j.id));

      // و) تحضير البيانات للإيميل
      const jobsForEmail = top5.map(m => {
        const details = jobDetails[m.id] || {};
        return {
          id: m.id,
          title: m.title,
          company_name: m.company_name,
          city: m.city || details.city,
          country: m.country || details.country,
          similarity: m.similarity,
          originalUrl: details.application_url || details.source_url || '#',
          applyUrl: `https://gulf-jobs.com/cv/${user.user_id}/${m.id}`,
        };
      });

      // ز) إرسال
      if (DRY_RUN) {
        console.log(`   🧪 [DRY] سيتم إرسال ${jobsForEmail.length} وظائف`);
        jobsForEmail.forEach(j => console.log(`      - ${j.title} (${Math.round(j.similarity * 100)}%)`));
      } else {
        const result = await sendDigestEmail(env, user, jobsForEmail);
        console.log(`   ✅ أُرسل (${result.id})`);
        await markDigestSent(env, user, top5.map(j => j.id));
        console.log(`   💾 تم التسجيل`);
      }

      sent++;

      // تأخير بسيط لتجنب Rate Limit
      await new Promise(r => setTimeout(r, 500));

    } catch (err) {
      console.log(`   ❌ خطأ: ${err.message}`);
      errors++;
    }
  }

  // 3. ملخص
  const duration = ((Date.now() - start) / 1000).toFixed(1);
  console.log('\n═══════════════════════════════════════════');
  console.log(`  ✅ اكتمل في ${duration}s`);
  console.log(`  📤 مُرسل:     ${sent}`);
  console.log(`  ⏭️ مُتخطّى:    ${skipped}`);
  console.log(`  ❌ أخطاء:     ${errors}`);
  console.log('═══════════════════════════════════════════\n');
}

main().catch(e => { console.error('❌', e); process.exit(1); });