export function buildEditorPage(cvData, user, job) {
  const dataJson = JSON.stringify(cvData).replace(/</g, '\\u003c');
  const userJson = JSON.stringify(user).replace(/</g, '\\u003c');

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<title>محرر السيرة الذاتية - ${user.fullName}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Segoe UI', Tahoma, sans-serif; }
  body { background: #f1f5f9; color: #1e293b; line-height: 1.6; }
  .hidden { display: none !important; }

  /* Modal */
  .modal { position: fixed; inset: 0; background: rgba(15,23,42,0.85); display: flex; align-items: center; justify-content: center; padding: 20px; z-index: 1000; overflow-y: auto; }
  .modal-content { background: white; border-radius: 16px; max-width: 720px; width: 100%; padding: 40px; box-shadow: 0 25px 60px rgba(0,0,0,0.3); max-height: 90vh; overflow-y: auto; }
  .modal-content h1 { color: #065f46; font-size: 26px; margin-bottom: 8px; text-align: center; }
  .modal-content .subtitle { color: #64748b; text-align: center; margin-bottom: 25px; font-size: 14px; }

  .info-card { background: #f0fdf4; border-right: 4px solid #059669; padding: 15px 18px; border-radius: 8px; margin-bottom: 15px; }
  .info-card h3 { color: #065f46; font-size: 15px; margin-bottom: 8px; display: flex; align-items: center; gap: 6px; }
  .info-card p, .info-card li { font-size: 13.5px; color: #334155; line-height: 1.7; }
  .info-card ul { padding-right: 20px; margin-top: 6px; }

  .modes-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
  @media (max-width: 600px) { .modes-grid { grid-template-columns: 1fr; } }
  .mode-card { border: 2px solid #e2e8f0; border-radius: 10px; padding: 18px; cursor: pointer; transition: all 0.2s; }
  .mode-card:hover { border-color: #059669; }
  .mode-card.selected { border-color: #059669; background: #f0fdf4; }
  .mode-card h3 { color: #065f46; font-size: 16px; margin-bottom: 8px; }
  .mode-card p { font-size: 13px; color: #64748b; }
  .mode-card ul { font-size: 12.5px; color: #475569; padding-right: 18px; margin-top: 8px; }

  .primary-btn { background: #059669; color: white; border: none; padding: 14px 30px; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; width: 100%; margin-top: 15px; transition: background 0.2s; }
  .primary-btn:hover { background: #047857; }
  .primary-btn:disabled { background: #94a3b8; cursor: not-allowed; }

  .fact-box { background: #fef3c7; border-right: 4px solid #f59e0b; padding: 15px 18px; border-radius: 8px; margin-bottom: 15px; font-size: 13.5px; color: #78350f; }

  /* Editor */
  .editor-container { max-width: 900px; margin: 0 auto; padding: 30px 20px 100px; }
  .editor-header { background: white; padding: 20px 25px; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px; }
  .editor-header h1 { font-size: 20px; color: #065f46; }
  .editor-header .job-ref { font-size: 13px; color: #64748b; }
  .mode-toggle { display: flex; gap: 8px; background: #f1f5f9; padding: 4px; border-radius: 8px; }
  .mode-toggle button { padding: 8px 16px; border: none; background: transparent; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600; color: #64748b; }
  .mode-toggle button.active { background: white; color: #059669; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }

  .section { background: white; padding: 22px 25px; border-radius: 12px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
  .section-title { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #f1f5f9; }
  .section-title h2 { font-size: 17px; color: #065f46; }
  .add-btn { background: #d1fae5; color: #065f46; border: none; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600; }
  .add-btn:hover { background: #a7f3d0; }
  .remove-btn { background: #fee2e2; color: #991b1b; border: none; padding: 5px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; }

  .field { margin-bottom: 12px; }
  .field label { display: block; font-size: 12.5px; font-weight: 600; color: #475569; margin-bottom: 5px; }
  .field input, .field textarea { width: 100%; padding: 10px 12px; border: 1.5px solid #e2e8f0; border-radius: 8px; font-family: inherit; font-size: 14px; transition: border 0.15s; background: #fafbfc; }
  .field input:focus, .field textarea:focus { outline: none; border-color: #059669; background: white; }
  .field textarea { min-height: 90px; resize: vertical; line-height: 1.7; }

  .skill-chip { display: inline-flex; align-items: center; gap: 6px; background: #d1fae5; color: #065f46; padding: 6px 10px 6px 12px; border-radius: 20px; font-size: 13px; margin: 4px 4px 4px 0; }
  .skill-chip button { background: none; border: none; color: #065f46; cursor: pointer; font-size: 16px; line-height: 1; padding: 0 2px; }
  .skill-input { display: flex; gap: 8px; margin-bottom: 10px; }
  .skill-input input { flex: 1; }
  .skill-input button { background: #059669; color: white; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-weight: 600; }

  .exp-card { background: #f8fafc; padding: 15px; border-radius: 10px; margin-bottom: 12px; border: 1px solid #e2e8f0; }
  .exp-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
  .exp-card-header span { font-weight: 600; color: #065f46; font-size: 14px; }

  .action-bar { position: fixed; bottom: 0; right: 0; left: 0; background: white; border-top: 1px solid #e2e8f0; padding: 15px 25px; display: flex; gap: 12px; justify-content: center; box-shadow: 0 -4px 12px rgba(0,0,0,0.05); z-index: 100; }
  .action-bar button { padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; border: none; }
  .btn-download { background: #059669; color: white; }
  .btn-download:hover { background: #047857; }
  .btn-regen { background: #f1f5f9; color: #475569; }
  .btn-regen:hover { background: #e2e8f0; }
  .btn-reset { background: #fef3c7; color: #78350f; }
  .btn-continue { background: #065f46; color: white; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 700; cursor: pointer; border: none; }
  .btn-continue:hover { background: #064e3b; }

  .status { padding: 10px 20px; border-radius: 8px; margin: 15px 0; font-size: 14px; text-align: center; display: none; }
  .status.loading { background: #dbeafe; color: #1e40af; display: block; }
  .status.success { background: #d1fae5; color: #065f46; display: block; }
  .status.error { background: #fee2e2; color: #991b1b; display: block; }
</style>
</head>
<body>

<!-- ═══ شاشة المقدمة ═══ -->
<div id="intro" class="modal">
  <div class="modal-content">
    <h1>🎯 أداة توليد السيرة الذاتية الذكية</h1>
    <p class="subtitle">سيرة ذاتية مخصصة لوظيفة محددة، جاهزة في 30 ثانية</p>

    <div class="info-card">
      <h3>🔬 كيف تعمل الأداة؟</h3>
      <ul>
        <li><strong>هندسة عكسية</strong> لإعلان الوظيفة: تحليل الكلمات المفتاحية والمهارات المطلوبة</li>
        <li><strong>مطابقة ذكية</strong> مع ملفك المهني وتجاربك</li>
        <li><strong>صياغة احترافية</strong> بصيغة النتائج (أرقام وإنجازات قابلة للقياس)</li>
        <li><strong>توليد فوري</strong> بصيغة PDF جاهزة للتقديم</li>
      </ul>
    </div>

    <div class="fact-box">
      💡 <strong>حقيقة مهمة:</strong> مسؤول التوظيف يقضي <strong>6-8 ثوانٍ فقط</strong> في المراجعة الأولى للسيرة. والأنظمة الآلية (ATS) تقرأ سيرتك <strong>قبل</strong> أن يراها الإنسان. لذلك الشركات اليوم <strong>لا تهتم بالسير المزخرفة</strong>، بل بالسير التي:
      <ul style="margin-top:8px; padding-right:20px;">
        <li>تُقرأ بوضوح من الأنظمة</li>
        <li>تحتوي كلمات الإعلان نفسها</li>
        <li>تُبرز النتائج بالأرقام</li>
      </ul>
    </div>

    <h3 style="font-size: 15px; color: #065f46; margin: 20px 0 10px;">اختر نمط السيرة:</h3>
    <div class="modes-grid">
      <div class="mode-card" data-mode="ats" onclick="selectMode('ats')">
        <h3>📋 ATS-Friendly</h3>
        <p>بسيط، رسمي، متوافق 100% مع أنظمة الفرز الآلي</p>
        <ul>
          <li>أسود/أبيض</li>
          <li>خطوط قياسية</li>
          <li>مثالي للشركات الكبرى</li>
        </ul>
      </div>
      <div class="mode-card" data-mode="visual" onclick="selectMode('visual')">
        <h3>🎨 Visual</h3>
        <p>حديث، بألوان احترافية، يجذب العين</p>
        <ul>
          <li>أخضر احترافي</li>
          <li>تصميم عصري</li>
          <li>مثالي للشركات الناشئة</li>
        </ul>
      </div>
    </div>

    <button id="startBtn" class="primary-btn" disabled onclick="startEditing()">
      اختر نمط السيرة للمتابعة
    </button>
  </div>
</div>

<!-- ═══ المحرر ═══ -->
<div id="editor" class="editor-container hidden">
  <div class="editor-header">
    <div>
      <h1>✏️ محرر السيرة الذاتية</h1>
      <div class="job-ref">📌 الوظيفة: ${job.title}</div>
    </div>
    <div class="mode-toggle">
      <button data-mode="ats" onclick="switchMode('ats')">ATS</button>
      <button data-mode="visual" onclick="switchMode('visual')">Visual</button>
    </div>
  </div>

  <div id="status" class="status"></div>

  <div class="section">
    <div class="section-title"><h2>الملخص المهني</h2></div>
    <div class="field">
      <textarea id="summary" rows="5"></textarea>
    </div>
  </div>

  <div class="section">
    <div class="section-title"><h2>المهارات الرئيسية</h2></div>
    <div id="skillsList"></div>
    <div class="skill-input">
      <input id="skillInput" placeholder="أضف مهارة جديدة..." onkeypress="if(event.key==='Enter'){event.preventDefault();addSkill();}">
      <button onclick="addSkill()">+ إضافة</button>
    </div>
  </div>

  <div class="section">
    <div class="section-title">
      <h2>الخبرة العملية</h2>
      <button class="add-btn" onclick="addExperience()">+ إضافة خبرة</button>
    </div>
    <div id="experienceList"></div>
  </div>

  <div class="section">
    <div class="section-title"><h2>المؤهل العلمي</h2></div>
    <div class="field">
      <input id="education" type="text">
    </div>
  </div>

  <div class="section">
    <div class="section-title"><h2>اللغات</h2></div>
    <div id="languagesList"></div>
    <div class="skill-input">
      <input id="langInput" placeholder="أضف لغة..." onkeypress="if(event.key==='Enter'){event.preventDefault();addLanguage();}">
      <button onclick="addLanguage()">+ إضافة</button>
    </div>
  </div>

  <div class="section">
    <div class="section-title"><h2>نقاط القوة</h2></div>
    <div id="strengthsList"></div>
    <div class="skill-input">
      <input id="strengthInput" placeholder="أضف نقطة قوة..." onkeypress="if(event.key==='Enter'){event.preventDefault();addStrength();}">
      <button onclick="addStrength()">+ إضافة</button>
    </div>
  </div>
</div>

<div id="actionBar" class="action-bar hidden">
  <button class="btn-reset" onclick="resetToOriginal()">🔄 استعادة الأصلية</button>
  <button class="btn-regen" onclick="location.reload()">↩️ رجوع</button>
  <button class="btn-download" onclick="downloadPDF()">📥 تنزيل PDF</button>
  <button class="btn-continue" id="continueBtn" style="display:none; background:#065f46; color:white;" onclick="location.href='/success'">✅ متابعة للتقديم →</button>
</div>

<script>
  const ORIGINAL = ${dataJson};
  const USER = ${userJson};
  let currentData = JSON.parse(JSON.stringify(ORIGINAL));
  let selectedMode = null;
  let viewMode = 'ats';

  function selectMode(mode) {
    selectedMode = mode;
    viewMode = mode;
    document.querySelectorAll('.mode-card').forEach(c => {
      c.classList.toggle('selected', c.dataset.mode === mode);
    });
    const btn = document.getElementById('startBtn');
    btn.disabled = false;
    btn.textContent = '✏️ ابدأ تحرير السيرة الذاتية';
  }

  function startEditing() {
    document.getElementById('intro').classList.add('hidden');
    document.getElementById('editor').classList.remove('hidden');
    document.getElementById('actionBar').classList.remove('hidden');
    document.querySelectorAll('.mode-toggle button').forEach(b => {
      b.classList.toggle('active', b.dataset.mode === viewMode);
    });
    renderAll();
  }

  function switchMode(mode) {
    viewMode = mode;
    document.querySelectorAll('.mode-toggle button').forEach(b => {
      b.classList.toggle('active', b.dataset.mode === mode);
    });
  }

  function renderAll() {
    document.getElementById('summary').value = currentData.professional_summary || '';
    document.getElementById('education').value = currentData.education || '';
    renderSkills();
    renderExperience();
    renderLanguages();
    renderStrengths();
  }

  function renderSkills() {
    const el = document.getElementById('skillsList');
    el.innerHTML = (currentData.highlighted_skills || []).map((s, i) =>
      '<span class="skill-chip">' + escapeHtml(s) + '<button onclick="removeSkill(' + i + ')">×</button></span>'
    ).join('') || '<p style="color:#94a3b8; font-size:13px;">لا توجد مهارات بعد</p>';
  }

  function addSkill() {
    const inp = document.getElementById('skillInput');
    const v = inp.value.trim();
    if (!v) return;
    if (!currentData.highlighted_skills) currentData.highlighted_skills = [];
    currentData.highlighted_skills.push(v);
    inp.value = '';
    renderSkills();
  }
  function removeSkill(i) {
    currentData.highlighted_skills.splice(i, 1);
    renderSkills();
  }

  function renderLanguages() {
    const el = document.getElementById('languagesList');
    el.innerHTML = (currentData.languages || []).map((l, i) =>
      '<span class="skill-chip">' + escapeHtml(l) + '<button onclick="removeLanguage(' + i + ')">×</button></span>'
    ).join('') || '<p style="color:#94a3b8; font-size:13px;">لا توجد لغات بعد</p>';
  }
  function addLanguage() {
    const inp = document.getElementById('langInput');
    const v = inp.value.trim();
    if (!v) return;
    if (!currentData.languages) currentData.languages = [];
    currentData.languages.push(v);
    inp.value = '';
    renderLanguages();
  }
  function removeLanguage(i) {
    currentData.languages.splice(i, 1);
    renderLanguages();
  }

  function renderStrengths() {
    const el = document.getElementById('strengthsList');
    el.innerHTML = (currentData.key_strengths || []).map((s, i) =>
      '<span class="skill-chip">' + escapeHtml(s) + '<button onclick="removeStrength(' + i + ')">×</button></span>'
    ).join('') || '<p style="color:#94a3b8; font-size:13px;">لا توجد نقاط قوة بعد</p>';
  }
  function addStrength() {
    const inp = document.getElementById('strengthInput');
    const v = inp.value.trim();
    if (!v) return;
    if (!currentData.key_strengths) currentData.key_strengths = [];
    currentData.key_strengths.push(v);
    inp.value = '';
    renderStrengths();
  }
  function removeStrength(i) {
    currentData.key_strengths.splice(i, 1);
    renderStrengths();
  }

  function renderExperience() {
    const el = document.getElementById('experienceList');
    const exp = currentData.experience_enhanced || [];
    el.innerHTML = exp.map((e, i) =>
      '<div class="exp-card">' +
        '<div class="exp-card-header"><span>خبرة ' + (i+1) + '</span>' +
        (exp.length > 1 ? '<button class="remove-btn" onclick="removeExperience(' + i + ')">حذف</button>' : '') +
        '</div>' +
        '<div class="field"><label>المسمى الوظيفي</label><input value="' + escapeAttr(e.position || '') + '" oninput="updateExp(' + i + ', \\'position\\', this.value)"></div>' +
        '<div class="field"><label>الشركة</label><input value="' + escapeAttr(e.company || '') + '" oninput="updateExp(' + i + ', \\'company\\', this.value)"></div>' +
        '<div class="field"><label>الفترة</label><input value="' + escapeAttr(e.period || '') + '" oninput="updateExp(' + i + ', \\'period\\', this.value)"></div>' +
        '<div class="field"><label>الإنجازات (سطر لكل إنجاز)</label><textarea oninput="updateExpAchievements(' + i + ', this.value)">' +
          (e.achievements || []).join('\\n') +
        '</textarea></div>' +
      '</div>'
    ).join('');
  }

  function updateExp(i, key, val) {
    if (!currentData.experience_enhanced) currentData.experience_enhanced = [];
    if (!currentData.experience_enhanced[i]) currentData.experience_enhanced[i] = {};
    currentData.experience_enhanced[i][key] = val;
  }
  function updateExpAchievements(i, val) {
    if (!currentData.experience_enhanced) currentData.experience_enhanced = [];
    if (!currentData.experience_enhanced[i]) currentData.experience_enhanced[i] = {};
    currentData.experience_enhanced[i].achievements = val.split('\\n').map(s => s.trim()).filter(Boolean);
  }
  function addExperience() {
    if (!currentData.experience_enhanced) currentData.experience_enhanced = [];
    currentData.experience_enhanced.push({ position: '', company: '', period: '', achievements: [] });
    renderExperience();
  }
  function removeExperience(i) {
    currentData.experience_enhanced.splice(i, 1);
    renderExperience();
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
  }
  function escapeAttr(s) { return escapeHtml(s).replace(/"/g, '&quot;'); }

  function updateSummaryAndEdu() {
    currentData.professional_summary = document.getElementById('summary').value;
    currentData.education = document.getElementById('education').value;
  }

  async function downloadPDF() {
    updateSummaryAndEdu();
    const status = document.getElementById('status');
    status.className = 'status loading';
    status.textContent = '⏳ جاري توليد PDF...';

    try {
      const res = await fetch('/api/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: currentData, mode: viewMode, user: USER }),
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'cv-' + viewMode + '-' + Date.now() + '.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      status.className = 'status success';
      status.textContent = '✅ تم تنزيل السيرة بنجاح!';
      document.getElementById('continueBtn').style.display = 'inline-block';
      setTimeout(() => { status.className = 'status'; }, 3000);
    } catch (err) {
      status.className = 'status error';
      status.textContent = '❌ فشل: ' + err.message;
    }
  }

  function resetToOriginal() {
    if (!confirm('سيتم استعادة النص الأصلي من Gemini. هل أنت متأكد؟')) return;
    currentData = JSON.parse(JSON.stringify(ORIGINAL));
    renderAll();
  }
</script>
</body>
</html>`;
}