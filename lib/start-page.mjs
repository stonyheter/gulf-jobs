export function buildStartPage() {
  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<title>ابدأ رحلتك — وظائف الخليج</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Segoe UI', Tahoma, sans-serif; }
  body {
    background: linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 50%, #ecfeff 100%);
    min-height: 100vh; padding: 40px 20px; color: #1e293b; line-height: 1.7;
  }
  .container { max-width: 640px; margin: 0 auto; }
  .hero { text-align: center; margin-bottom: 30px; }
  .hero h1 { color: #065f46; font-size: 32px; margin-bottom: 8px; }
  .hero p { color: #64748b; font-size: 15px; }
  .card { background: white; border-radius: 16px; padding: 35px; box-shadow: 0 8px 30px rgba(5,150,105,0.1); }
  .progress { display: flex; gap: 8px; justify-content: center; margin-bottom: 25px; }
  .progress-dot { width: 40px; height: 4px; background: #e2e8f0; border-radius: 2px; transition: background 0.3s; }
  .progress-dot.active { background: #059669; }

  .field { margin-bottom: 20px; }
  .field label { display: block; font-size: 14px; font-weight: 700; color: #334155; margin-bottom: 6px; }
  .field label .hint { font-weight: 400; color: #94a3b8; font-size: 12px; }
  .field input, .field textarea, .field select {
    width: 100%; padding: 12px 14px; border: 2px solid #e2e8f0; border-radius: 10px;
    font-family: inherit; font-size: 14px; background: #fafbfc; transition: border 0.15s;
  }
  .field input:focus, .field textarea:focus, .field select:focus {
    outline: none; border-color: #059669; background: white;
  }
  .field textarea { min-height: 80px; resize: vertical; line-height: 1.7; }

  .skills-input-wrapper { position: relative; }
  .skills-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; min-height: 34px; padding: 6px; background: #f8fafc; border-radius: 10px; border: 2px dashed #e2e8f0; }
  .skills-tags:empty::before { content: 'أضف مهاراتك (Excel، SAP، React...)'; color: #94a3b8; font-size: 13px; padding: 4px; }
  .skill-chip { display: inline-flex; align-items: center; gap: 6px; background: #d1fae5; color: #065f46; padding: 6px 10px 6px 12px; border-radius: 20px; font-size: 13px; font-weight: 500; }
  .skill-chip button { background: none; border: none; color: #065f46; cursor: pointer; font-size: 16px; line-height: 1; padding: 0 2px; }

  .row { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
  @media (max-width: 600px) { .row { grid-template-columns: 1fr; } }

  .submit-btn {
    width: 100%; background: #059669; color: white; border: none; padding: 16px;
    border-radius: 12px; font-size: 16px; font-weight: 700; cursor: pointer;
    margin-top: 10px; transition: all 0.2s; box-shadow: 0 4px 15px rgba(5,150,105,0.3);
  }
  .submit-btn:hover { background: #047857; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(5,150,105,0.4); }
  .submit-btn:disabled { background: #94a3b8; cursor: not-allowed; transform: none; box-shadow: none; }

  .status { padding: 14px 20px; border-radius: 10px; margin-top: 15px; text-align: center; font-size: 14px; display: none; }
  .status.loading { background: #dbeafe; color: #1e40af; display: block; }
  .status.error { background: #fee2e2; color: #991b1b; display: block; }

  .features { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 25px; }
  @media (max-width: 600px) { .features { grid-template-columns: 1fr; } }
  .feature { text-align: center; padding: 12px; background: #f8fafc; border-radius: 10px; font-size: 12px; color: #64748b; }
  .feature .icon { font-size: 22px; display: block; margin-bottom: 4px; }
</style>
</head>
<body>
<div class="container">
  <div class="hero">
    <h1>🎯 اعثر على وظيفتك في 60 ثانية</h1>
    <p>أدخل مهاراتك، ودع الذكاء الاصطناعي يجد الوظائف المناسبة لك</p>
  </div>

  <div class="card">
    <div class="progress">
      <div class="progress-dot active"></div>
      <div class="progress-dot"></div>
      <div class="progress-dot"></div>
    </div>

    <form id="startForm">
      <div class="row">
        <div class="field">
          <label>الاسم الكامل</label>
          <input type="text" id="fullName" placeholder="أحمد محمد" required>
        </div>
        <div class="field">
          <label>البريد الإلكتروني <span class="hint">(للتنبيهات)</span></label>
          <input type="email" id="email" placeholder="name@example.com">
        </div>
      </div>

      <div class="field">
        <label>المسمى الوظيفي المستهدف</label>
        <input type="text" id="targetJob" placeholder="مثال: محاسب، مهندس برمجيات، محلل بيانات..." required>
      </div>

      <div class="field">
        <label>مهاراتك <span class="hint">(اكتب واضغط Enter)</span></label>
        <div class="skills-tags" id="skillsTags"></div>
        <input type="text" id="skillInput" placeholder="أضف مهارة..." autocomplete="off">
      </div>

      <div class="row">
        <div class="field">
          <label>سنوات الخبرة</label>
          <input type="number" id="years" min="0" max="40" value="0">
        </div>
        <div class="field">
          <label>المدينة المفضلة</label>
          <input type="text" id="city" placeholder="الرياض، جدة، دبي...">
        </div>
      </div>

      <div class="field">
        <label>التعليم</label>
        <select id="education">
          <option value="">— اختر —</option>
          <option value="ثانوي">ثانوي</option>
          <option value="دبلوم">دبلوم</option>
          <option value="بكالوريوس">بكالوريوس</option>
          <option value="ماجستير">ماجستير</option>
          <option value="دكتوراه">دكتوراه</option>
        </select>
      </div>

      <button type="submit" class="submit-btn" id="submitBtn">
        🚀 اعرض لي الوظائف المناسبة
      </button>
      <div class="status" id="status"></div>
    </form>
  </div>

  <div class="features">
    <div class="feature"><span class="icon">🤖</span>مطابقة ذكية بـ AI</div>
    <div class="feature"><span class="icon">📄</span>سيرة ذاتية مخصصة لكل وظيفة</div>
    <div class="feature"><span class="icon">💡</span>نصائح للتقديم من خبراء</div>
  </div>
</div>

<script>
  const skills = [];

  function renderSkills() {
    const el = document.getElementById('skillsTags');
    el.innerHTML = skills.map((s, i) =>
      '<span class="skill-chip">' + escapeHtml(s) + '<button type="button" onclick="removeSkill(' + i + ')">×</button></span>'
    ).join('');
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
  }

  function removeSkill(i) {
    skills.splice(i, 1);
    renderSkills();
  }

  document.getElementById('skillInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = e.target.value.trim();
      if (val && !skills.includes(val)) {
        skills.push(val);
        e.target.value = '';
        renderSkills();
      }
    }
  });

  document.getElementById('skillInput').addEventListener('blur', (e) => {
    const val = e.target.value.trim();
    if (val && !skills.includes(val)) {
      skills.push(val);
      e.target.value = '';
      renderSkills();
    }
  });

  document.getElementById('startForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('submitBtn');
    const status = document.getElementById('status');

    const profile = {
      fullName: document.getElementById('fullName').value.trim(),
      email: document.getElementById('email').value.trim(),
      targetJobTitle: document.getElementById('targetJob').value.trim(),
      skills: skills,
      yearsOfExperience: parseInt(document.getElementById('years').value) || 0,
      city: document.getElementById('city').value.trim(),
      country: 'المملكة العربية السعودية',
      education: document.getElementById('education').value,
    };

    if (!profile.fullName || !profile.targetJobTitle) {
      status.className = 'status error';
      status.textContent = '⚠️ الرجاء إدخال الاسم والمسمى الوظيفي';
      return;
    }

    if (skills.length === 0) {
      status.className = 'status error';
      status.textContent = '⚠️ أضف مهارة واحدة على الأقل';
      return;
    }

    btn.disabled = true;
    btn.textContent = '⏳ جاري تحليل مهاراتك...';
    status.className = 'status loading';
    status.textContent = '🤖 نبحث عن أفضل الوظائف المطابقة...';

    try {
      const res = await fetch('/api/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const { userId } = await res.json();
      window.location.href = '/matches?u=' + userId;
    } catch (err) {
      status.className = 'status error';
      status.textContent = '❌ فشل: ' + err.message;
      btn.disabled = false;
      btn.textContent = '🚀 اعرض لي الوظائف المناسبة';
    }
  });
</script>
</body>
</html>`;
}