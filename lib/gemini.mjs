import { GoogleGenAI } from '@google/genai';

// ═══════════════════════════════════════════════════════════════
// استخراج JSON متوازن من نص Gemini (يتعامل مع نص إضافي)
// ═══════════════════════════════════════════════════════════════
function extractJson(text) {
  if (!text || typeof text !== 'string') throw new Error('Empty response');

  // 1. إزالة markdown code fences إذا وُجدت
  let cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '');

  // 2. إيجاد أول `{`
  const start = cleaned.indexOf('{');
  if (start === -1) throw new Error('No JSON object found');

  // 3. عدّ الأقواس المتوازنة (مع تجاهل الأقواس داخل النصوص)
  let depth = 0;
  let inString = false;
  let escape = false;
  let end = -1;

  for (let i = start; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (escape) { escape = false; continue; }
    if (ch === '\\') { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) { end = i; break; }
    }
  }

  if (end === -1) throw new Error('Unbalanced JSON braces');

  const jsonStr = cleaned.substring(start, end + 1);
  return JSON.parse(jsonStr);
}

export function buildCVPrompt(user, job) {
  return `أنت خبير موارد بشرية محترف. اكتب محتوى سيرة ذاتية احترافية بالعربية الفصحى.

معلومات المرشح:
- الاسم: ${user.fullName}
- المدينة: ${user.city}، ${user.country}
- البريد: ${user.email}
- الهاتف: ${user.phone}
- المسمى المستهدف: ${user.targetJobTitle}
- سنوات الخبرة: ${user.yearsOfExperience}
- التعليم: ${user.education}
- المهارات: ${user.skills.join('، ')}
- اللغات: ${user.languages.map(l => `${l.name} (${l.level})`).join('، ')}

الخبرات:
${user.experience.map(e => `- ${e.position} في ${e.company} (${e.period}): ${e.description}`).join('\n')}

الوظيفة المستهدفة:
- العنوان: ${job.title}
- الشركة: ${job.company_name}
- الموقع: ${job.city}، ${job.country}
- الوصف: ${(job.description || '').slice(0, 800)}

المطلوب: اكتب محتوى السيرة الذاتية. ركّز على إبراز المهارات والخبرات التي تتناسب مع الوظيفة. استخدم صيغة النتائج بالأرقام.

أعد JSON فقط:
{
  "professional_summary": "ملخص مهني من 3-4 أسطر",
  "highlighted_skills": ["مهارة 1", "مهارة 2"],
  "experience_enhanced": [
    { "position": "...", "company": "...", "period": "...", "achievements": ["...", "..."] }
  ],
  "education": "...",
  "languages": ["...", "..."],
  "key_strengths": ["...", "...", "...", "..."]
}`;
}

export async function generateCV(apiKey, user, job) {
  const ai = new GoogleGenAI({ apiKey });
  const prompt = buildCVPrompt(user, job);
  const models = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.5-flash'];
  let lastError = null;

  for (const model of models) {
    for (let attempt = 1; attempt <= 4; attempt++) {
      try {
        console.log(`   🔄 ${model} (محاولة ${attempt})...`);
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: { temperature: 0.7, responseMimeType: 'application/json' },
        });
        console.log(`   ✅ نجح مع ${model}`);
        return extractJson(response.text);
      } catch (err) {
        lastError = err;
        const status = err.status || 0;
        if (status === 503 || status === 429 || status === 500) {
          await new Promise(r => setTimeout(r, 5000));
          continue;
        }
        throw err;
      }
    }
  }
  throw new Error(`فشل جميع الموديلات: ${lastError?.message}`);
}
// ═══════════════════════════════════════════════════════════════
// توليد نصائح مخصصة للتقديم على الوظيفة
// ═══════════════════════════════════════════════════════════════
export async function generateTips(apiKey, user, job) {
  const ai = new GoogleGenAI({ apiKey });
  const prompt = `أنت خبير توظيف في منطقة الخليج. قدّم 5 نصائح عملية ومحددة لمرشح يتقدم لوظيفة.

**المرشح:**
- الاسم: ${user.fullName}
- الخبرة: ${user.yearsOfExperience} سنوات في ${user.targetJobTitle}
- المهارات: ${user.skills.join('، ')}

**الوظيفة:**
- العنوان: ${job.title}
- الشركة: ${job.company_name}
- الموقع: ${job.city}، ${job.country}
- الوصف: ${(job.description || '').slice(0, 500)}

**المطلوب:**
اكتب 5 نصائح. كل نصيحة يجب أن تكون:
- محددة لهذه الوظيفة (ليس عامة)
- قابلة للتنفيذ فورًا
- قصيرة (سطر واحد إلى سطرين)
- مصنفة: (قبل التقديم / في السيرة / في المقابلة / متابعة / عام)

أعد JSON فقط:
{
  "tips": [
    { "category": "قبل التقديم", "icon": "📝", "text": "..." },
    { "category": "في السيرة", "icon": "📄", "text": "..." },
    { "category": "في المقابلة", "icon": "🎤", "text": "..." },
    { "category": "متابعة", "icon": "📧", "text": "..." },
    { "category": "عام", "icon": "💡", "text": "..." }
  ]
}`;

  const models = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.5-flash'];
  let lastError = null;

  for (const model of models) {
    for (let attempt = 1; attempt <= 4; attempt++) {
      try {
        console.log(`   🔄 ${model} (محاولة ${attempt})...`);
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: { temperature: 0.7, responseMimeType: 'application/json' },
        });
        console.log(`   ✅ نجح`);
        return extractJson(response.text);
      } catch (err) {
        lastError = err;
        if ([503, 429, 500].includes(err.status || 0)) {
          await new Promise(r => setTimeout(r, 5000));
          continue;
        }
        throw err;
      }
    }
  }
  throw new Error(`فشل: ${lastError?.message}`);
}
