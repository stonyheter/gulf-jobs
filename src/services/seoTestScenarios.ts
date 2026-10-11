/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Job } from '../types/job';
import {
  generateJobSlug,
  normalizeSlugText,
  countryNameToSlug,
  slugToCountryName,
  cityNameToSlug,
  slugToCityName,
  specialtyToSlug,
  slugToSpecialty,
} from '../utils/slugUtils';
import {
  evaluateJobIndexability,
  evaluateLocationPageIndexability,
  evaluateSystemViewIndexability,
} from './seoIndexabilityService';
import {
  generateJobPostingSchema,
  generateBreadcrumbSchema,
} from '../utils/structuredData';
import {
  generateJobMetadata,
  generateLocationLandingMetadata,
  generateDefaultMetadata,
} from '../utils/seoMetadataService';
import { paginateItems } from '../utils/paginationUtils';
import { parseRoute, findJobBySlug } from '../utils/routeUtils';

export interface SeoTestResult {
  id: string;
  name: string;
  category: 'slug' | 'indexability' | 'structured_data' | 'metadata' | 'routing' | 'pagination';
  passed: boolean;
  expected: string;
  actual: string;
  notes?: string;
}

export function runSeoTests(sampleJobs: Job[]): {
  total: number;
  passed: number;
  failed: number;
  results: SeoTestResult[];
} {
  const results: SeoTestResult[] = [];

  const sampleJob: Job = sampleJobs[0] || {
    id: 'test-job-01',
    title: 'مهندس برمجيات أول (Senior Software Engineer)',
    companyName: 'شركة الحلول السحابية المتقدمة',
    companyLogo: null,
    category: 'tech',
    country: 'المملكة العربية السعودية',
    region: 'منطقة الرياض',
    city: 'الرياض',
    district: 'حي العليا',
    address: 'طريق الملك فهد',
    workMode: 'on_site',
    employmentType: 'full_time',
    experienceMin: 5,
    experienceMax: 8,
    education: 'بكالوريوس علوم حاسب',
    salaryMin: 22000,
    salaryMax: 28000,
    salaryCurrency: 'SAR',
    description: 'تطوير وتصميم الحلول السحابية الحديثة.',
    responsibilities: ['بناء الواجهات', 'تصميم قواعد البيانات'],
    requirements: ['خبرة 5 سنوات في React و Node.js'],
    skills: ['React', 'TypeScript', 'Node.js'],
    languages: ['العربية', 'الإنجليزية'],
    benefits: ['تأمين صحي شامل', 'مكافأة سنوية'],
    applicationMethod: 'external_url',
    applicationUrl: 'https://example.com/apply',
    sourceName: 'الموقع الرسمي',
    sourceUrl: 'https://example.com',
    originalJobUrl: null,
    datePosted: '2026-09-25T10:00:00Z',
    validThrough: '2026-12-31T23:59:59Z',
    status: 'published',
    createdAt: '2026-09-25T10:00:00Z',
    updatedAt: '2026-09-25T10:00:00Z',
  };

  // Test 1: Slug text normalization & removal of diacritics/punctuation
  const rawText = 'أخصائي أول / سلامة العمليات! (HAZOP) - الدمام؛';
  const normalized = normalizeSlugText(rawText);
  results.push({
    id: 'seo-slug-01',
    name: 'تطبيع النص وتجريد التشكيل والرموز الخاصة في الـ Slug',
    category: 'slug',
    passed: !normalized.includes('!') && !normalized.includes('/') && !normalized.includes('('),
    expected: 'اخصائي-اول-سلامة-العمليات-hazop-الدمام',
    actual: normalized,
  });

  // Test 2: Stable job slug generation
  const slug = generateJobSlug(sampleJob);
  results.push({
    id: 'seo-slug-02',
    name: 'توليد Slug ثابت ومتوافق مع SEO للوظيفة',
    category: 'slug',
    passed: slug.length > 5 && !slug.includes(' ') && !slug.includes('_'),
    expected: 'Slug نظيف بدون مسافات أو رموز خاصة',
    actual: slug,
  });

  // Test 3: Slug collision avoidance
  const duplicateSample = { ...sampleJob, id: 'test-job-02' };
  const collisionSlug = generateJobSlug(duplicateSample, [sampleJob]);
  results.push({
    id: 'seo-slug-03',
    name: 'معالجة تصادم الـ Slugs بلاحقة حتمية فريدة دون كشف معرّفات حساسة',
    category: 'slug',
    passed: collisionSlug !== slug && collisionSlug.startsWith(slug.slice(0, 30)),
    expected: 'Slug ينتهي بلاحقة حتمية مميزة',
    actual: collisionSlug,
  });

  // Test 4: Country name mapping to slug and reverse
  const saSlug = countryNameToSlug('المملكة العربية السعودية');
  const resolvedCountry = slugToCountryName(saSlug);
  results.push({
    id: 'seo-slug-04',
    name: 'مطابقة اسم الدولة مع الـ Slug واسترجاع الاسم العربي بدقة',
    category: 'slug',
    passed: saSlug === 'saudi-arabia' && resolvedCountry === 'المملكة العربية السعودية',
    expected: 'slug: saudi-arabia -> المملكة العربية السعودية',
    actual: `slug: ${saSlug} -> ${resolvedCountry}`,
  });

  // Test 5: City name mapping to slug and reverse
  const dmmSlug = cityNameToSlug('الدمام');
  const resolvedCity = slugToCityName(dmmSlug);
  results.push({
    id: 'seo-slug-05',
    name: 'مطابقة اسم المدينة مع الـ Slug واسترجاع الاسم العربي بدقة',
    category: 'slug',
    passed: dmmSlug === 'dammam' && resolvedCity === 'الدمام',
    expected: 'slug: dammam -> الدمام',
    actual: `slug: ${dmmSlug} -> ${resolvedCity}`,
  });

  // Test 6: Indexability - Active Published Job
  const pubDecision = evaluateJobIndexability(sampleJob);
  results.push({
    id: 'seo-idx-01',
    name: 'قابلية أرشفة الوظيفة المنشورة والمكتملة (Published)',
    category: 'indexability',
    passed: pubDecision.isIndexable && pubDecision.robotsDirective === 'index, follow',
    expected: 'index, follow (isIndexable: true)',
    actual: `${pubDecision.robotsDirective} (isIndexable: ${pubDecision.isIndexable})`,
  });

  // Test 7: Indexability - Expired Job
  const expiredJob: Job = { ...sampleJob, status: 'expired' };
  const expDecision = evaluateJobIndexability(expiredJob);
  results.push({
    id: 'seo-idx-02',
    name: 'منع أرشفة الوظائف منتهية الصلاحية (Expired)',
    category: 'indexability',
    passed: !expDecision.isIndexable && expDecision.robotsDirective === 'noindex, follow',
    expected: 'noindex, follow (isIndexable: false)',
    actual: `${expDecision.robotsDirective} (isIndexable: ${expDecision.isIndexable})`,
  });

  // Test 8: Indexability - Draft / Paused / Rejected
  const draftJob: Job = { ...sampleJob, status: 'draft' };
  const draftDecision = evaluateJobIndexability(draftJob);
  results.push({
    id: 'seo-idx-03',
    name: 'منع أرشفة المسودات والوظائف المعلقة وغير المعتمدة',
    category: 'indexability',
    passed: !draftDecision.isIndexable && draftDecision.robotsDirective === 'noindex, nofollow',
    expected: 'noindex, nofollow',
    actual: draftDecision.robotsDirective,
  });

  // Test 9: Thin page protection for location pages
  const thinDecision = evaluateLocationPageIndexability(0);
  const validLocDecision = evaluateLocationPageIndexability(5);
  results.push({
    id: 'seo-idx-04',
    name: 'حماية الصفحات الهزيلة (Thin Page Protection) لصفحات المدن الفارغة',
    category: 'indexability',
    passed: !thinDecision.isIndexable && validLocDecision.isIndexable,
    expected: '0 jobs -> noindex | >= 1 jobs -> index',
    actual: `0 jobs: ${thinDecision.robotsDirective} | 5 jobs: ${validLocDecision.robotsDirective}`,
  });

  // Test 10: Private system views indexability
  const adminIdx = evaluateSystemViewIndexability('admin');
  const profileIdx = evaluateSystemViewIndexability('profile');
  results.push({
    id: 'seo-idx-05',
    name: 'منع أرشفة لوحة الإدارة والملفات الشخصية الخاصة قطيعاً',
    category: 'indexability',
    passed: adminIdx.robotsDirective === 'noindex, nofollow' && profileIdx.robotsDirective === 'noindex, nofollow',
    expected: 'noindex, nofollow لكافة الصفحات الإدارية والشخصية',
    actual: `Admin: ${adminIdx.robotsDirective}, Profile: ${profileIdx.robotsDirective}`,
  });

  // Test 11: Schema.org JobPosting structured data
  const postingSchema = generateJobPostingSchema(sampleJob, 'https://gulfjobs.app/job/test');
  results.push({
    id: 'seo-schema-01',
    name: 'صحة بيانات Schema.org JobPosting المنظمة (عدم اختلاق رواتب أو شعارات مفقودة)',
    category: 'structured_data',
    passed:
      postingSchema['@type'] === 'JobPosting' &&
      postingSchema.title === sampleJob.title &&
      typeof postingSchema.baseSalary === 'object' &&
      (postingSchema.hiringOrganization as Record<string, unknown>).logo === undefined,
    expected: 'JobPosting صالح مع راتب حقيقي وبدون شعار مختلق',
    actual: `type: ${postingSchema['@type']}, hasSalary: ${Boolean(postingSchema.baseSalary)}, hasLogo: ${Boolean((postingSchema.hiringOrganization as Record<string, unknown>).logo)}`,
  });

  // Test 12: Remote job handling in Schema.org
  const remoteJob: Job = { ...sampleJob, workMode: 'remote' };
  const remoteSchema = generateJobPostingSchema(remoteJob, 'https://gulfjobs.app/job/remote');
  results.push({
    id: 'seo-schema-02',
    name: 'معالجة الوظائف عن بُعد وتحديد القيود الجغرافية الصريحة دون تعميم عالمي عشوائي',
    category: 'structured_data',
    passed:
      remoteSchema.jobLocationType === 'TELECOMMUTE' &&
      (remoteSchema.applicantLocationRequirements as Record<string, unknown>)?.name === sampleJob.country,
    expected: 'jobLocationType: TELECOMMUTE مع متطلبات الموقع الصريحة للدولة',
    actual: `jobLocationType: ${remoteSchema.jobLocationType}, req: ${(remoteSchema.applicantLocationRequirements as Record<string, unknown>)?.name}`,
  });

  // Test 13: Schema.org BreadcrumbList
  const breadcrumbSchema = generateBreadcrumbSchema(
    [
      { name: 'الرئيسية', url: '/' },
      { name: 'الوظائف', url: '/jobs' },
      { name: 'السعودية', url: '/jobs/saudi-arabia' },
      { name: 'الرياض', url: '/jobs/saudi-arabia/riyadh' },
    ],
    'https://gulfjobs.app'
  );
  results.push({
    id: 'seo-schema-03',
    name: 'توليد مسار التنقل المهيكل Schema.org BreadcrumbList',
    category: 'structured_data',
    passed:
      breadcrumbSchema['@type'] === 'BreadcrumbList' &&
      Array.isArray(breadcrumbSchema.itemListElement) &&
      breadcrumbSchema.itemListElement.length === 4,
    expected: 'BreadcrumbList بأربعة عناصر ومواقع مرتبة (1..4)',
    actual: `type: ${breadcrumbSchema['@type']}, count: ${(breadcrumbSchema.itemListElement as unknown[])?.length}`,
  });

  // Test 14: Canonical URL purity (no query parameters in canonical)
  const jobMeta = generateJobMetadata(sampleJob);
  results.push({
    id: 'seo-meta-01',
    name: 'نقاء الرابط الأساسي Canonical URL وخلوه من معايير التصفية والفرز',
    category: 'metadata',
    passed: !jobMeta.canonicalUrl.includes('?') && !jobMeta.canonicalUrl.includes('&') && jobMeta.canonicalUrl.includes('/job/'),
    expected: 'https://.../job/{slug} بدون معاملات استعلام',
    actual: jobMeta.canonicalUrl,
  });

  // Test 15: Route parser
  const parsedJobRoute = parseRoute('/job/senior-software-engineer-riyadh-acme');
  const parsedLocRoute = parseRoute('/jobs/saudi-arabia/dammam/engineering');
  results.push({
    id: 'seo-route-01',
    name: 'تحليل المسارات البرمجية النظيفة لمطابقة صفحات الوظائف والدول والمدن والتخصصات',
    category: 'routing',
    passed:
      parsedJobRoute.type === 'job_detail' &&
      parsedJobRoute.jobSlug === 'senior-software-engineer-riyadh-acme' &&
      parsedLocRoute.type === 'jobs_specialty' &&
      parsedLocRoute.countrySlug === 'saudi-arabia' &&
      parsedLocRoute.citySlug === 'dammam' &&
      parsedLocRoute.specialtySlug === 'engineering',
    expected: 'job_detail + jobs_specialty',
    actual: `${parsedJobRoute.type} + ${parsedLocRoute.type}`,
  });

  // Test 16: Pagination readiness
  const sampleList = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
  const p1 = paginateItems(sampleList, 1, 5, 'https://gulfjobs.app/jobs/saudi-arabia/riyadh');
  const p2 = paginateItems(sampleList, 2, 5, 'https://gulfjobs.app/jobs/saudi-arabia/riyadh');
  results.push({
    id: 'seo-page-01',
    name: 'جاهزية الترقيم (Pagination Readiness) والالتزام بعدم وضع ?page=1 في الصفحة الأولى',
    category: 'pagination',
    passed:
      p1.canonicalUrl === 'https://gulfjobs.app/jobs/saudi-arabia/riyadh' &&
      p2.canonicalUrl === 'https://gulfjobs.app/jobs/saudi-arabia/riyadh?page=2' &&
      p2.prevPageUrl === 'https://gulfjobs.app/jobs/saudi-arabia/riyadh',
    expected: 'Page 1 canonical بدون ?page=1، و rel=prev للصفحة 2 يشير للرابط النظيف',
    actual: `P1 canonical: ${p1.canonicalUrl}, P2 prev: ${p2.prevPageUrl}`,
  });

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  return {
    total: results.length,
    passed,
    failed,
    results,
  };
}
