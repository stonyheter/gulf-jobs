// ═══════════════════════════════════════════════════════════════
// CV Templates: ATS (بسيط) + Visual (جميل)
// ═══════════════════════════════════════════════════════════════

export function renderAtsHtml(user, cvData) {
  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, Calibri, sans-serif; background: white; padding: 40px; color: #1a1a1a; line-height: 1.6; direction: rtl; font-size: 12pt; }
  .cv { max-width: 800px; margin: 0 auto; }
  header { border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 25px; }
  h1 { font-size: 20pt; color: #000; margin-bottom: 6px; }
  .target-role { font-size: 13pt; color: #333; margin-bottom: 10px; }
  .contact-info { font-size: 11pt; color: #333; }
  .contact-info span { margin-left: 20px; }
  section { margin-bottom: 22px; }
  h2 { font-size: 13pt; color: #000; border-bottom: 1px solid #666; padding-bottom: 4px; margin-bottom: 12px; }
  .summary { font-size: 11.5pt; text-align: justify; }
  .skills-list { font-size: 11.5pt; }
  .skill-tag { display: inline-block; margin-left: 8px; }
  .skill-tag::after { content: '،'; }
  .skill-tag:last-child::after { content: ''; }
  .experience-item { margin-bottom: 18px; }
  .exp-title { font-weight: bold; font-size: 12pt; }
  .exp-period { color: #555; font-size: 11pt; margin-right: 15px; }
  .exp-company { font-style: italic; color: #333; font-size: 11.5pt; margin-bottom: 6px; }
  ul { padding-right: 20px; margin: 5px 0; }
  li { font-size: 11.5pt; margin-bottom: 4px; }
  .languages, .education { font-size: 11.5pt; }
  .language-item { display: inline-block; margin-left: 15px; }
</style>
</head>
<body><div class="cv">
  <header>
    <h1>${user.fullName}</h1>
    <div class="target-role">${user.targetJobTitle}</div>
    <div class="contact-info">
      <span>${user.email}</span><span>${user.phone}</span>
      <span>${user.city}، ${user.country}</span>
    </div>
  </header>
  <section><h2>الملخص المهني</h2><div class="summary">${cvData.professional_summary}</div></section>
  <section><h2>المهارات</h2><div class="skills-list">${cvData.highlighted_skills.map(s => `<span class="skill-tag">${s}</span>`).join('')}</div></section>
  <section><h2>الخبرة العملية</h2>
    ${cvData.experience_enhanced.map(exp => `
      <div class="experience-item">
        <div><span class="exp-title">${exp.position}</span><span class="exp-period">${exp.period}</span></div>
        <div class="exp-company">${exp.company}</div>
        <ul>${exp.achievements.map(a => `<li>${a}</li>`).join('')}</ul>
      </div>`).join('')}
  </section>
  <section><h2>التعليم</h2><div class="education">${cvData.education}</div></section>
  <section><h2>اللغات</h2><div class="languages">${cvData.languages.map(l => `<span class="language-item">${l}</span>`).join('')}</div></section>
  <section><h2>نقاط القوة</h2><ul>${cvData.key_strengths.map(s => `<li>${s}</li>`).join('')}</ul></section>
</div></body></html>`;
}

export function renderVisualHtml(user, cvData) {
  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Tahoma, sans-serif; background: #f5f5f5; padding: 30px; color: #2c3e50; line-height: 1.7; direction: rtl; }
  .cv { max-width: 900px; margin: 0 auto; background: white; padding: 50px; border-radius: 8px; }
  header { border-bottom: 3px solid #059669; padding-bottom: 20px; margin-bottom: 30px; }
  h1 { font-size: 32px; color: #065f46; margin-bottom: 8px; }
  .target-role { font-size: 18px; color: #059669; font-weight: 600; margin-bottom: 15px; }
  .contact-info { display: flex; flex-wrap: wrap; gap: 20px; font-size: 14px; color: #64748b; }
  .contact-info span::before { content: '● '; color: #059669; }
  section { margin-bottom: 30px; }
  h2 { font-size: 20px; color: #065f46; border-right: 4px solid #059669; padding-right: 12px; margin-bottom: 15px; }
  .summary { background: #f0fdf4; padding: 18px; border-radius: 6px; border-right: 4px solid #059669; font-size: 15px; }
  .skills-grid { display: flex; flex-wrap: wrap; gap: 8px; }
  .skill-tag { background: #d1fae5; color: #065f46; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 500; }
  .experience-item { margin-bottom: 22px; padding-right: 15px; border-right: 2px solid #e2e8f0; }
  .exp-header { display: flex; justify-content: space-between; margin-bottom: 8px; }
  .exp-title { font-weight: 700; font-size: 16px; color: #065f46; }
  .exp-period { color: #64748b; font-size: 13px; }
  .exp-company { color: #059669; font-size: 14px; margin-bottom: 8px; font-weight: 600; }
  .exp-achievements { list-style: none; padding-right: 0; }
  .exp-achievements li { font-size: 14px; padding-right: 20px; position: relative; margin-bottom: 5px; }
  .exp-achievements li::before { content: '✓'; position: absolute; right: 0; color: #059669; font-weight: bold; }
  .strengths { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
  .strength-item { padding: 10px 14px; background: #f8fafc; border-radius: 6px; font-size: 14px; border-right: 3px solid #059669; }
  .languages { display: flex; gap: 15px; flex-wrap: wrap; }
  .language-item { background: #ecfdf5; padding: 8px 16px; border-radius: 6px; font-size: 14px; }
</style>
</head>
<body><div class="cv">
  <header>
    <h1>${user.fullName}</h1>
    <div class="target-role">${user.targetJobTitle}</div>
    <div class="contact-info">
      <span>${user.email}</span><span>${user.phone}</span>
      <span>${user.city}، ${user.country}</span>
    </div>
  </header>
  <section><h2>الملخص المهني</h2><div class="summary">${cvData.professional_summary}</div></section>
  <section><h2>المهارات الرئيسية</h2><div class="skills-grid">${cvData.highlighted_skills.map(s => `<span class="skill-tag">${s}</span>`).join('')}</div></section>
  <section><h2>الخبرة العملية</h2>
    ${cvData.experience_enhanced.map(exp => `
      <div class="experience-item">
        <div class="exp-header"><div class="exp-title">${exp.position}</div><div class="exp-period">${exp.period}</div></div>
        <div class="exp-company">${exp.company}</div>
        <ul class="exp-achievements">${exp.achievements.map(a => `<li>${a}</li>`).join('')}</ul>
      </div>`).join('')}
  </section>
  <section><h2>المؤهل العلمي</h2><p>${cvData.education}</p></section>
  <section><h2>اللغات</h2><div class="languages">${cvData.languages.map(l => `<div class="language-item">${l}</div>`).join('')}</div></section>
  <section><h2>نقاط القوة</h2><div class="strengths">${cvData.key_strengths.map(s => `<div class="strength-item">${s}</div>`).join('')}</div></section>
</div></body></html>`;
}