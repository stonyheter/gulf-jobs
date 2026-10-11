export function buildMatchesPage(profile, matches) {
  const matchesJson = JSON.stringify(matches).replace(/</g, '\\u003c');

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<title>الوظائف المناسبة لك</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Segoe UI', Tahoma, sans-serif; }
  body { background: #f1f5f9; color: #1e293b; line-height: 1.7; padding: 30px 20px 60px; }
  .container { max-width: 900px; margin: 0 auto; }

  .hero { background: white; border-radius: 16px; padding: 30px; margin-bottom: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
  .hero h1 { color: #065f46; font-size: 26px; margin-bottom: 8px; }
  .hero .meta { color: #64748b; font-size: 14px; margin-bottom: 15px; }
  .skills-summary { display: flex; flex-wrap: wrap; gap: 6px; }
  .skill-tag { background: #d1fae5; color: #065f46; padding: 5px 12px; border-radius: 20px; font-size: 12.5px; font-weight: 500; }

  .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; }
  @media (max-width: 600px) { .stats { grid-template-columns: 1fr; } }
  .stat { background: white; padding: 15px 20px; border-radius: 12px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
  .stat .num { font-size: 24px; font-weight: 700; color: #059669; }
  .stat .label { font-size: 12.5px; color: #64748b; }

  .job-card { background: white; border-radius: 14px; padding: 22px; margin-bottom: 14px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); transition: all 0.2s; border-right: 5px solid #e2e8f0; position: relative; }
  .job-card:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(0,0,0,0.1); }
  .job-card.tier-excellent { border-right-color: #059669; }
  .job-card.tier-good { border-right-color: #10b981; }
  .job-card.tier-fair { border-right-color: #84cc16; }

  .match-badge { display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px; border-radius: 20px; font-size: 12.5px; font-weight: 700; position: absolute; top: 20px; left: 20px; }
  .match-excellent { background: #d1fae5; color: #065f46; }
  .match-good { background: #dbeafe; color: #1e40af; }
  .match-fair { background: #fef3c7; color: #78350f; }

  .job-title { font-size: 18px; font-weight: 700; color: #065f46; margin-bottom: 6px; padding-left: 90px; }
  .job-company { font-size: 14px; color: #059669; font-weight: 600; margin-bottom: 6px; }
  .job-meta { font-size: 13px; color: #64748b; display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 12px; }
  .job-description { font-size: 13.5px; color: #475569; line-height: 1.6; margin-bottom: 15px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

  .actions { display: flex; gap: 10px; flex-wrap: wrap; }
  .btn-primary { background: #059669; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600; border: none; cursor: pointer; transition: background 0.15s; }
  .btn-primary:hover { background: #047857; }
  .btn-secondary { background: #f1f5f9; color: #334155; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600; border: none; cursor: pointer; }
  .btn-secondary:hover { background: #e2e8f0; }

  .empty { text-align: center; padding: 60px 20px; background: white; border-radius: 16px; }
  .empty h2 { color: #64748b; font-size: 20px; margin-bottom: 10px; }
  .empty p { color: #94a3b8; font-size: 14px; }
</style>
</head>
<body>
<div class="container">

  <div class="hero">
    <h1>🎯 ${profile.target_job_title || 'الوظائف المناسبة لك'}</h1>
    <div class="meta">📌 وجدنا ${matches.length} وظيفة تطابق ملفك المهني</div>
    <div class="skills-summary">
      ${(profile.technical_skills || []).map(s => `<span class="skill-tag">${s}</span>`).join('')}
    </div>
  </div>

  <div class="stats">
    <div class="stat"><div class="num">${matches.length}</div><div class="label">وظيفة مطابقة</div></div>
    <div class="stat"><div class="num">${matches.length > 0 ? Math.round(matches[0].similarity * 100) + '%' : '—'}</div><div class="label">أعلى توافق</div></div>
    <div class="stat"><div class="num">${(profile.technical_skills || []).length}</div><div class="label">مهارات مسجلة</div></div>
  </div>

  <div id="jobsList"></div>

</div>

<script>
  const MATCHES = ${matchesJson};
  const USER_ID = '${profile.user_id}';

  function tierClass(similarity) {
    if (similarity >= 0.7) return { cls: 'tier-excellent', badge: 'match-excellent', icon: '🏆' };
    if (similarity >= 0.55) return { cls: 'tier-good', badge: 'match-good', icon: '⭐' };
    return { cls: 'tier-fair', badge: 'match-fair', icon: '✨' };
  }

  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
  }

  const container = document.getElementById('jobsList');

  if (MATCHES.length === 0) {
    container.innerHTML = '<div class="empty"><h2>😔 لا توجد وظائف مطابقة حاليًا</h2><p>جرّب إضافة مهارات أخرى أو تعديل المسمى الوظيفي</p></div>';
  } else {
    container.innerHTML = MATCHES.map((job, i) => {
      const similarity = (job.similarity * 100).toFixed(0);
      const tier = tierClass(job.similarity);
      return \`
        <div class="job-card \${tier.cls}">
          <div class="match-badge \${tier.badge}">\${tier.icon} \${similarity}% توافق</div>
          <div class="job-title">\${escapeHtml(job.title)}</div>
          <div class="job-company">🏢 \${escapeHtml(job.company_name)}</div>
          <div class="job-meta">
            <span>📍 \${escapeHtml(job.city || 'غير محدد')}</span>
            <span>🌍 \${escapeHtml(job.country || 'السعودية')}</span>
          </div>
          \${job.description ? '<div class="job-description">' + escapeHtml(job.description) + '</div>' : ''}
          <div class="actions">
            <button class="btn-primary" onclick="generateCV('\${job.id}')">📄 أنشئ سيرتي لهذه الوظيفة</button>
            <a class="btn-secondary" href="/api/job-redirect?id=\${job.id}" target="_blank">🔗 عرض الوظيفة الأصلية</a>
          </div>
        </div>
      \`;
    }).join('');
  }

  function generateCV(jobId) {
    window.location.href = '/cv/' + USER_ID + '/' + jobId;
  }
</script>
</body>
</html>`;
}