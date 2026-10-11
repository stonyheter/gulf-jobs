# إرشادات إعداد وربط منصة Supabase (Phase 6.1: Supabase Integration Guide)

يقدم هذا الدليل الخطوات الرسمية التفصيلية لربط منصة **وظائف الخليج (Gulf Jobs)** مع مشروع Supabase حقيقي (PostgreSQL + Supabase Auth + Supabase Storage + Row Level Security).

---

## 1. إنشاء مشروع جديد على Supabase (Create Supabase Project)
1. سجل الدخول إلى [لوحة تحكم Supabase](https://app.supabase.com).
2. انقر على **New Project**.
3. حدد اسم المشروع (مثلاً: `gulf-jobs-prod`)، وأدخل كلمة مرور قوية لقاعدة البيانات، واختر أقرب منطقة جغرافية للمستخدمين في الخليج (مثل `Central / West Europe` أو `Middle East`).
4. انتظر بضع ثوانٍ حتى يكتمل تجهيز قاعدة بيانات PostgreSQL.

---

## 2. نسخ عنوان المشروع (Copy Project URL)
1. من القائمة الجانبية في لوحة تحكم Supabase، توجه إلى **Project Settings** > **API**.
2. ستجد حقل **Project URL** (بصيغة `https://your-project-id.supabase.co`).
3. انسخ هذا العنوان.

---

## 3. نسخ المفتاح العام المجهول (Copy Anon / Publishable Key)
1. في نفس صفحة **API Settings**، ابحث عن قسم **Project API keys**.
2. انسخ المفتاح المسمى **`anon` `public`**.
3. ⚠️ **تحذير أمني صارم**: لا تنسخ أبداً مفتاح `service_role` أو تضعه في شيفرة المتصفح (Frontend). مفتاح `anon` فقط هو المسموح به للمتصفح ومحمي بالكامل عبر سياسات أمان الصفوف (RLS).

---

## 4 & 5. إعداد متغيرات البيئة (Configure Environment Variables)
أنشئ ملفاً باسم `.env.local` في مسار المشروع الرئيسي (أو أضف المتغيرات في لوحة نشر الحاوية / Cloud Run):

```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJh......your_anon_key_here
```

---

## 6. تشغيل ملف الترحيل وقواعد البيانات (Run SQL Migration)
1. في لوحة تحكم Supabase، توجه إلى قسم **SQL Editor**.
2. انقر على **New Query**.
3. انسخ محتويات الملف المرفق:
   `supabase/migrations/20261001_phase6_1_init.sql`
4. الصق الاستعلام واضغط **Run**.
5. سيتم تلقائياً إنشاء الجداول التالية مع سياسات أمان الصفوف (RLS):
   * `public.profiles`
   * `public.job_seeker_profiles`
   * `public.companies`
   * `public.jobs`
   * `public.saved_jobs`
   * `public.applications`
   * `public.cv_files`
   * دالة التحقق من المشرفين `public.is_admin()`
   * مشغل إنشاء الحسابات التلقائي `handle_new_user()`
   * مشغل منع تعديل الأدوار غير المصرح به `protect_profile_role()`

---

## 7. إعداد حاوية السير الذاتية الخاصة (Private Storage Bucket)
يقوم ملف الـ SQL تلقائياً بإنشاء الحاوية وإعداد سياسات الـ RLS، ولكن للتأكد يدوياً:
1. توجه إلى **Storage** في لوحة تحكم Supabase.
2. تأكد من وجود الحاوية المسماة `private-cvs`.
3. تأكد من أن حالة الحاوية هي **Private** (وليست Public).
4. يقتصر الوصول وقراءة الملفات فقط على مالك السيرة الذاتية (المستخدم المصرح) أو المشرف العام عبر سياسات `storage.objects` المحمية.

---

## 8. تهيئة المصادقة (Configure Supabase Auth)
1. في لوحة التحكم، توجه إلى **Authentication** > **Providers** > **Email**.
2. تأكد من تفعيل **Enable Email provider**.
3. (اختياري للبيئة التطويرية): قم بتعطيل **Confirm email** إذا كنت ترغب في تسجيل الدخول الفوري دون انتظار رابط التأكيد في البريد.

---

## 9. إنشاء أول مستخدم (Create the First User)
يمكنك إنشاء أول مستخدم من واجهة التطبيق عبر نافذة **إدارة الحساب والمصادقة** (AuthModal) بالنقر على **إنشاء حساب جديد**، أو من لوحة Supabase عبر **Authentication** > **Users** > **Add User**.

---

## 10. الترقية الآمنة لأول حساب مشرف (Promote First Admin)
لحماية النظام ومنع استغلال الواجهة في ترقية الحسابات، تتم ترقية المشرف العام بطريقة مسؤولة وآمنة من خلال قاعدة البيانات مباشرة:
1. افتح **SQL Editor** في Supabase.
2. نفّذ الاستعلام التالي باستبدال البريد ببريد المستخدم المراد ترقيته:

```sql
SELECT public.promote_user_to_admin('admin@gulfjobs.internal');
```

أو عبر التعديل المباشر:
```sql
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'your-admin-email@example.com';
```

---

## 11. تشغيل التطبيق (Start Application)
شغل خادم التطوير:
```bash
npm run dev
```
أو قم ببناء نسخة الإنتاج:
```bash
npm run build
```

---

## 12. التحقق من الاتصال المتكامل (Verify Live Connection)
1. افتح التطبيق في المتصفح.
2. انقر على زر **فحص Backend (20 فحصاً)** في الشريط المعماري العلوي أو في لوحة الإدارة.
3. ستتحقق المنظومة من سلامة الاتصال، واسترجاع الجلسات، وعمليات القراءة والكتابة، وسياسات RLS، وحماية السير الذاتية الخاصة.
