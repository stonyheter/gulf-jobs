/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Job } from '../types/job';
import { PageMetadata } from '../types/seo';
import { generateJobSlug, countryNameToSlug, cityNameToSlug, specialtyToSlug } from './slugUtils';
import { evaluateJobIndexability, evaluateLocationPageIndexability, evaluateSystemViewIndexability } from '../services/seoIndexabilityService';
import { getEmploymentTypeLabel, formatExperience } from './formatters';
export { applyPageMetadata } from './seoHeadService';

const SITE_BRAND_AR = 'وظائف الخليج';
const DEFAULT_ORIGIN = typeof window !== 'undefined' ? window.location.origin : 'https://gulfjobs.app';

/**
 * Returns canonical origin URL without trailing slash.
 */
export function getBaseUrl(): string {
  if (typeof window !== 'undefined' && window.location.origin) {
    return window.location.origin.replace(/\/+$/, '');
  }
  return DEFAULT_ORIGIN;
}

/**
 * Generates SEO metadata for an individual Job posting.
 * Strictly respects real job data without fabricating missing details.
 */
export function generateJobMetadata(job: Job, existingJobs?: Job[]): PageMetadata {
  const indexability = evaluateJobIndexability(job);
  const slug = generateJobSlug(job, existingJobs);
  const canonicalUrl = `${getBaseUrl()}/job/${slug}`;

  // Title pattern: "{Job Title} في {City} | وظائف الخليج"
  const locationPart = job.city ? `في ${job.city}` : job.country ? `في ${job.country}` : '';
  const title = locationPart
    ? `${job.title} ${locationPart} | ${SITE_BRAND_AR}`
    : `${job.title} | ${SITE_BRAND_AR}`;

  // Build accurate, concise description from verified data only
  const empType = getEmploymentTypeLabel(job.employmentType);
  const expText = formatExperience(job.experienceMin, job.experienceMax);

  const descParts: string[] = [];
  descParts.push(`وظيفة ${job.title} لدى ${job.companyName}`);
  if (job.city && job.country) {
    descParts.push(`في ${job.city}، ${job.country}`);
  } else if (job.city) {
    descParts.push(`في ${job.city}`);
  }
  if (empType) {
    descParts.push(`بدام ${empType}`);
  }
  if (expText && expText !== 'الخبرة غير محددة') {
    descParts.push(`(الخبرة: ${expText})`);
  }
  descParts.push(`تقدم الآن عبر منصة ${SITE_BRAND_AR}.`);

  const description = descParts.join(' ').replace(/\s+/g, ' ').trim().slice(0, 160);

  return {
    title,
    description,
    canonicalUrl,
    robots: indexability.robotsDirective,
    ogTitle: title,
    ogDescription: description,
    ogType: 'article',
    ogUrl: canonicalUrl,
    twitterCard: 'summary_large_image',
  };
}

/**
 * Generates SEO metadata for Country / City / Specialty public landing pages.
 */
export function generateLocationLandingMetadata(params: {
  countryName?: string;
  cityName?: string;
  specialtyName?: string;
  publishedJobCount: number;
}): PageMetadata {
  const { countryName, cityName, specialtyName, publishedJobCount } = params;
  const indexability = evaluateLocationPageIndexability(publishedJobCount);

  // Construct clean canonical path
  let path = '/jobs';
  if (countryName) {
    const cSlug = countryNameToSlug(countryName);
    path += `/${cSlug}`;

    if (cityName) {
      const citySlug = cityNameToSlug(cityName);
      path += `/${citySlug}`;

      if (specialtyName) {
        const specSlug = specialtyToSlug(specialtyName);
        path += `/${specSlug}`;
      }
    }
  }

  const canonicalUrl = `${getBaseUrl()}${path}`;

  // Title generation
  let title = `الوظائف المتاحة | ${SITE_BRAND_AR}`;
  if (specialtyName && cityName) {
    title = `وظائف ${specialtyName} في ${cityName} | ${SITE_BRAND_AR}`;
  } else if (cityName && countryName) {
    title = `وظائف في ${cityName}، ${countryName} | ${SITE_BRAND_AR}`;
  } else if (cityName) {
    title = `وظائف في ${cityName} | ${SITE_BRAND_AR}`;
  } else if (countryName) {
    title = `وظائف في ${countryName} | ${SITE_BRAND_AR}`;
  }

  // Description generation
  let description = `تصفح أحدث الوظائف المعتمدة في دول الخليج العربي وتقدم مباشرة عبر منصة ${SITE_BRAND_AR}.`;
  if (specialtyName && cityName) {
    description = `استكشف أحدث شواغر ${specialtyName} في ${cityName}. اعثر على وظائف معتمدة ومحدثة وتقدم بسهولة.`;
  } else if (cityName) {
    description = `اكتشف أفضل فرص العمل والوظائف الشاغرة في ${cityName}. وظائف محدثة يومياً للكوادر الوطنية والمهنية.`;
  } else if (countryName) {
    description = `دليل الوظائف والفرص الوظيفية الشاغرة في ${countryName}. ابحث وتقدم مباشرة لأكبر الشركات والمؤسسات.`;
  }

  return {
    title,
    description,
    canonicalUrl,
    robots: indexability.robotsDirective,
    ogTitle: title,
    ogDescription: description,
    ogType: 'website',
    ogUrl: canonicalUrl,
    twitterCard: 'summary_large_image',
  };
}

/**
 * Generates SEO metadata for main views: Home, Directory, Search, Suitable, Saved, Profile, Admin.
 */
export function generateDefaultMetadata(
  view: 'home' | 'search' | 'suitable_jobs' | 'saved_jobs' | 'profile' | 'admin'
): PageMetadata {
  const baseUrl = getBaseUrl();

  switch (view) {
    case 'home':
      return {
        title: 'وظائف الخليج | Gulf Jobs - منصة الوظائف في دول مجلس التعاون',
        description: 'وظائف حديثة في السعودية والإمارات وقطر والكويت والبحرين وعُمان. ابحث عن وظيفتك القادمة بكل سهولة وشفافية.',
        canonicalUrl: `${baseUrl}/`,
        robots: 'index, follow',
        ogTitle: 'وظائف الخليج | Gulf Jobs',
        ogDescription: 'منصة الوظائف والفرص المهنية في دول مجلس التعاون الخليجي.',
        ogType: 'website',
        ogUrl: `${baseUrl}/`,
        twitterCard: 'summary_large_image',
      };
    case 'search':
      return {
        title: `دليل الوظائف والبحث المتقدم | ${SITE_BRAND_AR}`,
        description: 'ابحث في آلاف الوظائف الشاغرة المعتمدة في دول الخليج. صَفّ حسب الدولة، المدينة، نمط العمل، والراتب.',
        canonicalUrl: `${baseUrl}/jobs`,
        robots: evaluateSystemViewIndexability('search_filter_state').robotsDirective,
        ogTitle: `دليل الوظائف | ${SITE_BRAND_AR}`,
        ogDescription: 'ابحث في الوظائف المعتمدة في دول الخليج.',
        ogType: 'website',
        ogUrl: `${baseUrl}/jobs`,
        twitterCard: 'summary',
      };
    case 'suitable_jobs':
      return {
        title: `وظائف مناسبة لي | ${SITE_BRAND_AR}`,
        description: 'وظائف مرتبة حسب درجة توافقها مع ملفك المهني عبر محرك المطابقة الحتمي.',
        canonicalUrl: `${baseUrl}/suitable`,
        robots: evaluateSystemViewIndexability('suitable_jobs').robotsDirective,
        ogTitle: `وظائف مناسبة لي | ${SITE_BRAND_AR}`,
        ogDescription: 'اكتشف الوظائف الأكثر توافقاً مع خبراتك ومهاراتك.',
        ogType: 'website',
        ogUrl: `${baseUrl}/suitable`,
        twitterCard: 'summary',
      };
    case 'saved_jobs':
      return {
        title: `الوظائف المحفوظة | ${SITE_BRAND_AR}`,
        description: 'قائمة الوظائف التي قمت بحفظها للرجوع إليها والتقديم عليها لاحقاً.',
        canonicalUrl: `${baseUrl}/saved`,
        robots: evaluateSystemViewIndexability('saved_jobs').robotsDirective,
        ogTitle: `الوظائف المحفوظة | ${SITE_BRAND_AR}`,
        ogDescription: 'الوظائف المحفوظة في حسابك الشخصي.',
        ogType: 'website',
        ogUrl: `${baseUrl}/saved`,
        twitterCard: 'summary',
      };
    case 'profile':
      return {
        title: `الملف المهني | ${SITE_BRAND_AR}`,
        description: 'إدارة وتحديث بيانات ملفك المهني لتحسين التوافق والترشيحات الوظيفية.',
        canonicalUrl: `${baseUrl}/profile`,
        robots: evaluateSystemViewIndexability('profile').robotsDirective,
        ogTitle: `الملف المهني | ${SITE_BRAND_AR}`,
        ogDescription: 'الملف المهني للباحث عن عمل.',
        ogType: 'website',
        ogUrl: `${baseUrl}/profile`,
        twitterCard: 'summary',
      };
    case 'admin':
      return {
        title: `لوحة تحكم الإدارة | ${SITE_BRAND_AR}`,
        description: 'نظام إدارة ونشر الوظائف ومراجعة الإعلانات وإجراءات التدقيق.',
        canonicalUrl: `${baseUrl}/admin`,
        robots: evaluateSystemViewIndexability('admin').robotsDirective,
        ogTitle: `لوحة تحكم الإدارة | ${SITE_BRAND_AR}`,
        ogDescription: 'إدارة منصة وظائف الخليج.',
        ogType: 'website',
        ogUrl: `${baseUrl}/admin`,
        twitterCard: 'summary',
      };
  }
}
