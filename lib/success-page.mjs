export function buildSuccessPage(tips, job, user, cvData) {
  const tipsJson = JSON.stringify(tips).replace(/</g, '\\u003c');
  const jobUrl = job.application_url || job.source_url || '#';
  
  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<title>نجحت! - ${job.title}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Segoe UI', Tahoma, sans-serif; }
  body { background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%); color: #1e293b; line-height: 1.7; min-height: 100vh; padding: 30px 20px; }

  .container { max-width: 800px; margin: 0 auto; }
  .card { background: white; border-radius: 16px; padding: 32px; margin-bottom: 20px; box-shadow: 0 4px 20px rgba(5,150,105,0.08); }

  /* Header */
  .hero { text-align: center; }
  .hero .check { width: 80px; height: 80px; background: #d1fae5; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 18px; font-size: 42px; }
  .hero h1 { color: #065f46; font-size: 26px; margin-bottom: 8px; }
  .hero p { color: #64748b; font-size: 15px; }

  /* Apply Button */
  .apply-section { text-align: center; }
  .apply-btn { display: inline-block; background: #059669; color: white; padding: 18px 50px; border-radius: 12px; font-size: 18px; font-weight: 700; text-decoration: none; transition: all 0.2s; box-shadow: 0 6px 20px rgba(5,150,105,0.3); }
  .apply-btn:hover { background: #047857; transform: translateY(-2px); box-shadow: 0 8px 25px rgba(5,150,105,0.4); }
  .apply-note { color: #64748b; font-size: 13px; margin-top: 12px; }
  .job-info { background: #f8fafc; padding: 14px 18px; border-radius: 8px; margin-bottom: 20px; text-align: right; }
  .job-info .title { font-weight: 700; color: #065f46; font-size: 16px; margin-bottom: 4px; }
  .job-info .meta { color: #64748b; font-size: 13.5px; }

  /* Tips */
  h2 { color: #065f46; font-size: 20px; margin-bottom: 18px; display: flex; align-items: center; gap: 8px; }
  .tips-list { display: flex; flex-direction: column; gap: 12px; }
  .tip-item { display: flex; gap: 14px; padding: 14px 16px; background: #f8fafc; border-radius: 10px; border-right: 3px solid #059669; transition: transform 0.15s; }
  .tip-item:hover { transform: translateX(-4px); background: #f0fdf4; }
  .tip-icon { font-size: 22px; flex-shrink: 0; }
  .tip-content { flex: 1; }
  .tip-category { font-size: 11.5px; font-weight: 700; color: #059669; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
  .tip-text { font-size: 14px; color: #334155; line-height: 1.7; }

  /* Feedback */
  .feedback-card h2 { margin-bottom: 8px; }
  .feedback-subtitle { color: #64748b; font-size: 14px; margin-bottom: 20px; }
  .stars { display: flex; gap: 8px; justify-content: center; margin: 15px 0; direction: ltr; }
  .star { font-size: 40px; cursor: pointer; color: #cbd5e1; transition: all 0.15s; user-select: none; }
  .star:hover, .star.hover { color: #f59e0b; transform: scale(1.15); }
  .star.active { color: #f59e0b; }
  .rating-label { text-align: center; font-size: 14px; color: #64748b; min-height: 20px; font-weight: 600; }

  .category-chips { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin: 18px 0; }
  .cat-chip { padding: 8px 16px; border-radius: 20px; background: #f1f5f9; color: #475569; font-size: 13px; cursor: pointer; border: 2px solid transparent; transition: all 0.15s; font-weight: 600; }
  .cat-chip:hover { background: #e2e8f0; }
  .cat-chip.selected { background: #d1fae5; color: #065f46; border-color: #059669; }

  textarea { width: 100%; padding: 12px 14px; border: 1.5px solid #e2e8f0; border-radius: 10px; font-family: inherit; font-size: 14px; min-height: 100px; resize: vertical; background: #fafbfc; }
  textarea:focus { outline: none; border-color: #059669; background: white; }

  .submit-btn { background: #059669; color: white; border: none; padding: 14px; border-radius: 10px; font-size: 15px; font-weight: 700; cursor: pointer; width: 100%; margin-top: 15px; transition: background 0.15s; }
  .submit-btn:hover { background: #047857; }
  .submit-btn:disabled { background: #94a3b8; cursor: not-allowed; }

  .status { padding: 12px 20px; border-radius: 10px; margin-top: 15px; font-size: 14px; text-align: center; display: none; }
  .status.success { background: #d1fae5; color: #065f46; display: block; }
  .status.error { background: #fee2e2; color: #991b1b; display: block; }

  .footer { text-align: center; color: #94a3b8; font-size: 12px; padding: 20px; }
</style>
</head>
<body>
<div class="container">

  <!-- Hero -->
  <div class="card hero">
    <div class="check">✅</div>
    <h1>سيرتك الذاتية جاهزة!</h1>
    <p>مُخصصة لـ <strong>${job.title}</strong> ومحسّنة لاجتياز أنظمة الفرز</p>
  </div>

  <!-- Apply Section -->
  <div class="card apply-section">
    <div class="job-info">
      <div class="title">${job.title}</div>
      <div class="meta">🏢 ${job.company_name} • 📍 ${job.city || 'غير محدد'}</div>
    </div>
    <a href="${jobUrl}" target="_blank" rel="noopener" class="apply-btn" id="applyBtn">
      🚀 تقدّم على الوظيفة الآن
    </a>
    <p class="apply-note">سيُفتح رابط الوظيفة الأصلي في نافذة جديدة</p>
  </div>

  <!-- Tips -->
  <div class="card">
    <h2>💡 نصائح ذكية لهذه الوظيفة</h2>
    <div class="tips-list" id="tipsList"></div>
  </div>

  <!-- Feedback -->
  <div class="card feedback-card">
    <h2>⭐ كيف كانت تجربتك؟</h2>
    <p class="feedback-subtitle">رأيك يساعدنا على تحسين الأداة للجميع</p>

    <div class="stars" id="stars">
      <span class="star" data-v="1">★</span>
      <span class="star" data-v="2">★</span>
      <span class="star" data-v="3">★</span>
      <span class="star" data-v="4">★</span>
      <span class="star" data-v="5">★</span>
    </div>
    <div class="rating-label" id="ratingLabel">اختر تقييمًا</div>

    <div class="category-chips" id="catChips">
      <span class="cat-chip" data-cat="cv_quality">جودة السيرة</span>
      <span class="cat-chip" data-cat="ui">تجربة الموقع</span>
      <span class="cat-chip" data-cat="feature">اقتراح ميزة</span>
      <span class="cat-chip" data-cat="bug">مشكلة</span>
      <span class="cat-chip" data-cat="general">عام</span>
    </div>

    <textarea id="feedbackMsg" placeholder="أخبرنا بالتفاصيل... (اختياري)"></textarea>

    <button class="submit-btn" id="submitBtn" disabled onclick="submitFeedback()">إرسال الملاحظات</button>
    <div class="status" id="status"></div>
  </div>

  <div class="footer">
    منصة <strong>وظائف الخليج</strong> — سير ذاتية ذكية بالعربية
  </div>
</div>

<script>
  const TIPS = ${tipsJson};
  const JOB = ${JSON.stringify({ id: job.id, title: job.title, company: job.company_name })};
  const USER = ${JSON.stringify({ name: user.fullName, email: user.email })};

  // Render tips
  document.getElementById('tipsList').innerHTML = TIPS.tips.map(t =>
    '<div class="tip-item">' +
      '<div class="tip-icon">' + (t.icon || '💡') + '</div>' +
      '<div class="tip-content">' +
        '<div class="tip-category">' + t.category + '</div>' +
        '<div class="tip-text">' + t.text + '</div>' +
      '</div>' +
    '</div>'
  ).join('');

  // Rating
  let rating = 0;
  let category = null;
  const stars = document.querySelectorAll('.star');
  const ratingLabel = document.getElementById('ratingLabel');
  const submitBtn = document.getElementById('submitBtn');
  const LABELS = { 1: 'سيء جدًا 😞', 2: 'سيء 😕', 3: 'مقبول 😐', 4: 'جيد 😊', 5: 'ممتاز 🤩' };

  stars.forEach(s => {
    s.addEventListener('click', () => {
      rating = parseInt(s.dataset.v);
      stars.forEach(x => x.classList.toggle('active', parseInt(x.dataset.v) <= rating));
      ratingLabel.textContent = LABELS[rating];
      checkReady();
    });
    s.addEventListener('mouseenter', () => {
      stars.forEach(x => x.classList.toggle('hover', parseInt(x.dataset.v) <= parseInt(s.dataset.v)));
    });
    s.addEventListener('mouseleave', () => {
      stars.forEach(x => x.classList.remove('hover'));
    });
  });

  document.querySelectorAll('.cat-chip').forEach(c => {
    c.addEventListener('click', () => {
      document.querySelectorAll('.cat-chip').forEach(x => x.classList.remove('selected'));
      c.classList.add('selected');
      category = c.dataset.cat;
      checkReady();
    });
  });

  function checkReady() {
    submitBtn.disabled = !(rating > 0 && category);
  }

  async function submitFeedback() {
    submitBtn.disabled = true;
    submitBtn.textContent = '... جاري الإرسال';
    const status = document.getElementById('status');
    status.className = 'status';

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_email: USER.email,
          user_name: USER.name,
          job_id: JOB.id,
          job_title: JOB.title,
          rating,
          category,
          message: document.getElementById('feedbackMsg').value.trim(),
          context: { source: 'cv_generator', job_company: JOB.company },
        }),
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      status.className = 'status success';
      status.textContent = '🙏 شكرًا لك! ملاحظاتك تساعدنا على التحسين';
      submitBtn.textContent = '✅ تم الإرسال';
    } catch (err) {
      status.className = 'status error';
      status.textContent = '❌ فشل الإرسال: ' + err.message;
      submitBtn.disabled = false;
      submitBtn.textContent = 'إعادة المحاولة';
    }
  }
</script>
</body>
</html>`;
}