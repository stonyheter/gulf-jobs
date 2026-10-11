/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ============================================================================
 * COMPATIBILITY ENGINE TEST SCENARIOS (PHASE 4 - REQUIREMENT 18)
 * ============================================================================
 * Provides 7 rigorous, deterministic test cases verifying all compatibility rules:
 * - CASE 1: Strongly matching software engineer profile and job.
 * - CASE 2: Correct specialty but insufficient experience.
 * - CASE 3: Correct experience but several missing required skills.
 * - CASE 4: Remote-preference profile and remote job.
 * - CASE 5: Different country with no remote option.
 * - CASE 6: Job with many unspecified requirements (unknown info != mismatch).
 * - CASE 7: Profile with incomplete information (insufficient data handling).
 */

import { Job } from '../types/job';
import { JobSeekerProfile } from '../types/profile';
import { analyzeJobCompatibility } from './matchingService';
import { CompatibilityResult } from '../types/jobMatch';

export interface TestCaseResult {
  caseId: string;
  titleAr: string;
  descriptionAr: string;
  passed: boolean;
  score: number;
  overallLevel: string;
  confidence: string;
  assertionNotes: string[];
  compatibilityResult: CompatibilityResult | null;
}

// ----------------------------------------------------------------------------
// BASE TEMPLATES
// ----------------------------------------------------------------------------

const BASE_SOFTWARE_PROFILE: JobSeekerProfile = {
  id: 'test-prof-sw-01',
  fullName: 'فيصل عبدالرحمن الشمري',
  country: 'المملكة العربية السعودية',
  region: 'منطقة الرياض',
  city: 'الرياض',
  targetJobTitle: 'مهندس برمجيات أول',
  specialties: ['تقنية المعلومات', 'تطوير البرمجيات'],
  secondarySpecialties: ['هندسة السحابة'],
  educationLevel: 'bachelor',
  fieldOfStudy: 'علوم الحاسب',
  institution: 'جامعة الملك سعود',
  graduationYear: 2019,
  yearsOfExperience: 6,
  currentJobTitle: 'مهندس برمجيات أول',
  experienceSummary: 'تطوير تطبيقات الويب السحابية وقواعد البيانات',
  technicalSkills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Docker'],
  softSkills: ['العمل الجماعي', 'حل المشكلات'],
  industrySkills: ['التكنولوجيا المالية'],
  languages: [
    { language: 'العربية', level: 'native' },
    { language: 'الإنجليزية', level: 'fluent' },
  ],
  preferredEmploymentTypes: ['full_time'],
  preferredWorkModes: ['hybrid', 'on_site'],
  preferredCountries: ['المملكة العربية السعودية'],
  preferredRegions: ['منطقة الرياض'],
  preferredCities: ['الرياض'],
  remotePreference: 'flexible',
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-01T00:00:00.000Z',
};

const BASE_SOFTWARE_JOB: Job = {
  id: 'test-job-sw-01',
  title: 'مهندس برمجيات (Software Engineer)',
  companyName: 'شركة تقنية الخليج',
  companyLogo: null,
  category: 'تقنية المعلومات',
  country: 'المملكة العربية السعودية',
  region: 'منطقة الرياض',
  city: 'الرياض',
  district: 'حي العليا',
  address: 'طريق الملك فهد',
  workMode: 'hybrid',
  employmentType: 'full_time',
  experienceMin: 4,
  experienceMax: 8,
  education: 'بكالوريوس في علوم الحاسب أو هندسة البرمجيات',
  salaryMin: 18000,
  salaryMax: 25000,
  salaryCurrency: 'SAR',
  description: 'مطلوب مهندس برمجيات لتطوير منصات الويب الحديثة.',
  responsibilities: ['بناء الواجهات', 'تصميم قواعد البيانات'],
  requirements: ['خبرة 4 سنوات', 'إتقان React وNode.js'],
  skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL'],
  languages: ['العربية', 'الإنجليزية'],
  benefits: ['تأمين صحي شامل', 'مكافآت سنوية'],
  applicationMethod: 'external_url',
  applicationUrl: 'https://example.com/apply',
  sourceName: 'توظيف مباشر',
  sourceUrl: null,
  originalJobUrl: null,
  datePosted: '2026-09-20',
  validThrough: '2026-11-20',
  status: 'published',
  createdAt: '2026-09-20T00:00:00.000Z',
  updatedAt: '2026-09-20T00:00:00.000Z',
};

// ----------------------------------------------------------------------------
// TEST RUNNER
// ----------------------------------------------------------------------------

export function runCompatibilityTests(): TestCaseResult[] {
  const results: TestCaseResult[] = [];

  // ==========================================================================
  // CASE 1: Strongly matching software engineer profile and job
  // ==========================================================================
  {
    const res = analyzeJobCompatibility(BASE_SOFTWARE_JOB, BASE_SOFTWARE_PROFILE)!;
    const assertionNotes: string[] = [];
    let passed = true;

    if (res.matchPercentage >= 80) {
      assertionNotes.push(`✓ النسبة (${res.matchPercentage}%) تعكس توافقاً قوياً (>= 80%).`);
    } else {
      passed = false;
      assertionNotes.push(`✗ النسبة (${res.matchPercentage}%) أقل من المتوقع لتطابق كامل.`);
    }

    if (res.overallLevel === 'strong_match') {
      assertionNotes.push('✓ مستوى التوافق هو "توافق قوي" (strong_match).');
    } else {
      passed = false;
      assertionNotes.push(`✗ المستوى هو ${res.overallLevel}.`);
    }

    if (res.confidence === 'high') {
      assertionNotes.push('✓ موثوقية التحليل عالية (high confidence).');
    } else {
      passed = false;
      assertionNotes.push(`✗ الموثوقية هي ${res.confidence}.`);
    }

    if (res.missingRequirements.length === 0) {
      assertionNotes.push('✓ لا توجد متطلبات ناقصة (0 missing requirements).');
    } else {
      passed = false;
      assertionNotes.push(`✗ متطلبات ناقصة غير متوقعة: ${res.missingRequirements.join('، ')}.`);
    }

    results.push({
      caseId: 'CASE_1',
      titleAr: 'الحالة 1: تطابق قوي بين مهندس برمجيات ووظيفة برمجية',
      descriptionAr: 'ملف مهندس برمجيات مكتمل مع وظيفة تلبي كافة معايير المسمى والمهارات والخبرة والموقع.',
      passed,
      score: res.matchPercentage,
      overallLevel: res.overallLevelLabelAr,
      confidence: res.confidenceLabelAr,
      assertionNotes,
      compatibilityResult: res,
    });
  }

  // ==========================================================================
  // CASE 2: Correct specialty but insufficient experience
  // ==========================================================================
  {
    const lowExpProfile: JobSeekerProfile = {
      ...BASE_SOFTWARE_PROFILE,
      yearsOfExperience: 1, // Job requires 4-8 years
    };
    const res = analyzeJobCompatibility(BASE_SOFTWARE_JOB, lowExpProfile)!;
    const assertionNotes: string[] = [];
    let passed = true;

    if (res.experienceCompatibility.status === 'mismatch' && res.experienceCompatibility.earnedPoints === 0) {
      assertionNotes.push('✓ تم احتساب 0 نقاط لبند الخبرة بسبب نقص السنوات المطلوبة (سنة واحدة مقابل 4 سنوات).');
    } else {
      passed = false;
      assertionNotes.push(`✗ احتساب نقاط الخبرة غير صحيح: ${res.experienceCompatibility.earnedPoints}.`);
    }

    if (res.specialtyCompatibility.earnedPoints >= 18) {
      assertionNotes.push('✓ احتساب نقاط التخصص مكتمل ومستقل عن نقص الخبرة.');
    } else {
      passed = false;
      assertionNotes.push('✗ نقص في نقاط التخصص المتطابق.');
    }

    if (res.missingRequirements.some((m) => m.includes('الخبرة'))) {
      assertionNotes.push('✓ تم إدراج نقص الخبرة بوضوح في قائمة المتطلبات الناقصة.');
    } else {
      passed = false;
      assertionNotes.push('✗ لم يتم إدراج نقص الخبرة في المتطلبات الناقصة.');
    }

    results.push({
      caseId: 'CASE_2',
      titleAr: 'الحالة 2: تخصص متطابق مع نقص في سنوات الخبرة المطلوبة',
      descriptionAr: 'الوظيفة تطلب 4 إلى 8 سنوات خبرة والباحث لديه سنة واحدة فقط. يجب رصد نقص الخبرة دون المساس بنقاط التخصص.',
      passed,
      score: res.matchPercentage,
      overallLevel: res.overallLevelLabelAr,
      confidence: res.confidenceLabelAr,
      assertionNotes,
      compatibilityResult: res,
    });
  }

  // ==========================================================================
  // CASE 3: Correct experience but several missing required skills
  // ==========================================================================
  {
    const missingSkillsProfile: JobSeekerProfile = {
      ...BASE_SOFTWARE_PROFILE,
      technicalSkills: ['PHP', 'Laravel', 'MySQL'], // Job requires React, TypeScript, Node.js, PostgreSQL
    };
    const res = analyzeJobCompatibility(BASE_SOFTWARE_JOB, missingSkillsProfile)!;
    const assertionNotes: string[] = [];
    let passed = true;

    if (res.skillsCompatibility.matchedCount === 0 && res.skillsCompatibility.earnedPoints === 0) {
      assertionNotes.push('✓ تم احتساب 0 من 25 نقطة للمهارات لعدم وجود مهارات متطابقة.');
    } else {
      passed = false;
      assertionNotes.push(`✗ احتساب المهارات غير صحيح: ${res.skillsCompatibility.earnedPoints}.`);
    }

    if (res.experienceCompatibility.earnedPoints === 15) {
      assertionNotes.push('✓ تم منح نقاط الخبرة كاملة (15 نقطة) لاستيفاء السنوات المطلوبة.');
    } else {
      passed = false;
      assertionNotes.push('✗ خطأ في منح نقاط الخبرة المستوفاة.');
    }

    if (res.missingSkills.length === 4) {
      assertionNotes.push(`✓ تم حصر المهارات الأربع الناقصة بدقة (${res.missingSkills.join('، ')}).`);
    } else {
      passed = false;
      assertionNotes.push(`✗ عدد المهارات الناقصة: ${res.missingSkills.length}.`);
    }

    results.push({
      caseId: 'CASE_3',
      titleAr: 'الحالة 3: خبرة كافية مع نقص في المهارات البرمجية المطلوبة',
      descriptionAr: 'الباحث يمتلك سنوات الخبرة المطلوبة ولكنه لا يمتلك أياً من مهارات الوظيفة المعلنة.',
      passed,
      score: res.matchPercentage,
      overallLevel: res.overallLevelLabelAr,
      confidence: res.confidenceLabelAr,
      assertionNotes,
      compatibilityResult: res,
    });
  }

  // ==========================================================================
  // CASE 4: Remote-preference profile and remote job
  // ==========================================================================
  {
    const remoteJob: Job = {
      ...BASE_SOFTWARE_JOB,
      id: 'test-job-remote-01',
      workMode: 'remote',
      country: 'الإمارات العربية المتحدة',
      city: 'دبي',
    };
    const remoteProfile: JobSeekerProfile = {
      ...BASE_SOFTWARE_PROFILE,
      country: 'المملكة العربية السعودية',
      city: 'الدمام',
      remotePreference: 'remote_only',
      preferredWorkModes: ['remote'],
    };
    const res = analyzeJobCompatibility(remoteJob, remoteProfile)!;
    const assertionNotes: string[] = [];
    let passed = true;

    if (res.locationCompatibility.earnedPoints === 10 && res.locationCompatibility.status === 'compatible') {
      assertionNotes.push('✓ تم منح نقاط الموقع كاملة (10/10) لأن الوظيفة عن بُعد وتطابق تفضيل العمل عن بُعد.');
    } else {
      passed = false;
      assertionNotes.push(`✗ خطأ في تقييم العمل عن بُعد: ${res.locationCompatibility.earnedPoints}.`);
    }

    if (res.workModeCompatibility.earnedPoints === 5) {
      assertionNotes.push('✓ تم منح نقاط نمط العمل كاملة (5/5).');
    } else {
      passed = false;
      assertionNotes.push('✗ خطأ في تقييم نمط العمل.');
    }

    results.push({
      caseId: 'CASE_4',
      titleAr: 'الحالة 4: تفضيل العمل عن بُعد مع وظيفة عن بُعد في دولة أخرى',
      descriptionAr: 'الوظيفة في دبي عن بُعد والباحث في الدمام يفضل العمل عن بُعد حصرياً. التحقق من احتساب توافق الموقع بنجاح.',
      passed,
      score: res.matchPercentage,
      overallLevel: res.overallLevelLabelAr,
      confidence: res.confidenceLabelAr,
      assertionNotes,
      compatibilityResult: res,
    });
  }

  // ==========================================================================
  // CASE 5: Different country with no remote option
  // ==========================================================================
  {
    const onSiteOmanJob: Job = {
      ...BASE_SOFTWARE_JOB,
      id: 'test-job-oman-01',
      country: 'سلطنة عُمان',
      region: 'محافظة مسقط',
      city: 'مسقط',
      workMode: 'on_site',
    };
    const saudiProfile: JobSeekerProfile = {
      ...BASE_SOFTWARE_PROFILE,
      country: 'المملكة العربية السعودية',
      preferredCountries: ['المملكة العربية السعودية'],
      preferredWorkModes: ['on_site'],
    };
    const res = analyzeJobCompatibility(onSiteOmanJob, saudiProfile)!;
    const assertionNotes: string[] = [];
    let passed = true;

    if (res.locationCompatibility.earnedPoints === 0 && res.locationCompatibility.status === 'mismatch') {
      assertionNotes.push('✓ تم احتساب 0 نقاط للموقع لاختلاف الدولة مع العمل الحضوري.');
    } else {
      passed = false;
      assertionNotes.push(`✗ احتساب نقاط الموقع غير متوقع: ${res.locationCompatibility.earnedPoints}.`);
    }

    if (res.missingRequirements.some((m) => m.includes('عُمان'))) {
      assertionNotes.push('✓ إدراج اختلاف الدولة في قائمة النواقص الجغرافية.');
    } else {
      passed = false;
      assertionNotes.push('✗ لم يتم إدراج اختلاف الدولة في النواقص.');
    }

    results.push({
      caseId: 'CASE_5',
      titleAr: 'الحالة 5: وظيفة حضورية في دولة أخرى دون خيار عمل عن بُعد',
      descriptionAr: 'وظيفة في مسقط (حضورياً) والباحث في الرياض ولا تشمل تفضيلاته سلطنة عُمان. يجب رصد عدم توافق الموقع بدقة.',
      passed,
      score: res.matchPercentage,
      overallLevel: res.overallLevelLabelAr,
      confidence: res.confidenceLabelAr,
      assertionNotes,
      compatibilityResult: res,
    });
  }

  // ==========================================================================
  // CASE 6: Job with many unspecified requirements
  // ==========================================================================
  {
    const sparseJob: Job = {
      ...BASE_SOFTWARE_JOB,
      id: 'test-job-sparse-01',
      experienceMin: null,
      experienceMax: null,
      education: null,
      skills: [],
      languages: [],
      salaryMin: null,
      salaryMax: null,
    };
    const res = analyzeJobCompatibility(sparseJob, BASE_SOFTWARE_PROFILE)!;
    const assertionNotes: string[] = [];
    let passed = true;

    // Unknown info must NOT be marked as mismatch!
    if (res.experienceCompatibility.status === 'unspecified_in_job') {
      assertionNotes.push('✓ الخبرة غير المحددة بالإعلان صُنفت كـ "غير محددة بالإعلان" وليس "عدم تطابق".');
    } else {
      passed = false;
      assertionNotes.push(`✗ حالة الخبرة: ${res.experienceCompatibility.status}.`);
    }

    if (res.skillsCompatibility.status === 'unspecified_in_job') {
      assertionNotes.push('✓ المهارات غير المحددة بالإعلان صُنفت كـ "غير محددة بالإعلان" دون احتساب نقاط وهمية.');
    } else {
      passed = false;
      assertionNotes.push(`✗ حالة المهارات: ${res.skillsCompatibility.status}.`);
    }

    if (res.educationCompatibility.status === 'unspecified_in_job') {
      assertionNotes.push('✓ المؤهل غير المحدد صُنف كـ "غير محدد بالإعلان".');
    } else {
      passed = false;
      assertionNotes.push(`✗ حالة المؤهل: ${res.educationCompatibility.status}.`);
    }

    if (res.unclearInformation.length >= 3) {
      assertionNotes.push(`✓ تم حصر البنود غير المحددة بنجاح (${res.unclearInformation.length} بنود).`);
    } else {
      passed = false;
      assertionNotes.push(`✗ عدد البنود غير المحددة: ${res.unclearInformation.length}.`);
    }

    if (res.confidence !== 'high') {
      assertionNotes.push(`✓ انخفضت موثوقية التحليل إلى (${res.confidenceLabelAr}) لنقص بيانات الإعلان.`);
    } else {
      passed = false;
      assertionNotes.push('✗ موثوقية التحليل لم تتأثر بنقص البيانات.');
    }

    results.push({
      caseId: 'CASE_6',
      titleAr: 'الحالة 6: وظيفة ذات بنود غير محددة (الخبرة، المهارات، المؤهل، اللغات)',
      descriptionAr: 'التأكد الصارم من أن غياب شروط بالإعلان لا يُعامل كعدم توافق (mismatch) ولا تُمنح له نقاط عشوائية، بل يُدرج كمعلومات غير محددة مع خفض موثوقية التحليل.',
      passed,
      score: res.matchPercentage,
      overallLevel: res.overallLevelLabelAr,
      confidence: res.confidenceLabelAr,
      assertionNotes,
      compatibilityResult: res,
    });
  }

  // ==========================================================================
  // CASE 7: Profile with incomplete information
  // ==========================================================================
  {
    const incompleteProfile: JobSeekerProfile = {
      id: 'test-prof-incomplete-01',
      fullName: 'مستخدم تجريبي جديد',
      country: 'المملكة العربية السعودية',
      region: null,
      city: null,
      targetJobTitle: '', // Missing
      specialties: [],
      secondarySpecialties: [],
      educationLevel: null, // Missing
      fieldOfStudy: null,
      institution: null,
      graduationYear: null,
      yearsOfExperience: null, // Missing
      currentJobTitle: null,
      experienceSummary: null,
      technicalSkills: [], // Missing
      softSkills: [],
      industrySkills: [],
      languages: [],
      preferredEmploymentTypes: [],
      preferredWorkModes: [],
      preferredCountries: [],
      preferredRegions: [],
      preferredCities: [],
      remotePreference: 'flexible',
      createdAt: '2026-09-01T00:00:00.000Z',
      updatedAt: '2026-09-01T00:00:00.000Z',
    };

    const res = analyzeJobCompatibility(BASE_SOFTWARE_JOB, incompleteProfile)!;
    const assertionNotes: string[] = [];
    let passed = true;

    if (res.matchPercentage <= 30) {
      assertionNotes.push(`✓ النسبة منخفضة (${res.matchPercentage}%) ولا يتم منح نقاط للملفات غير المكتملة.`);
    } else {
      passed = false;
      assertionNotes.push(`✗ النسبة مرتفعة بشكل غير مبرر: ${res.matchPercentage}%.`);
    }

    if (res.confidence === 'low') {
      assertionNotes.push('✓ موثوقية التحليل منخفضة (low confidence) لنقص بيانات الملف.');
    } else {
      passed = false;
      assertionNotes.push(`✗ موثوقية التحليل: ${res.confidence}.`);
    }

    if (res.overallLevel === 'insufficient_information') {
      assertionNotes.push('✓ تصنيف التوافق العام هو "معلومات غير كافية للتقييم" (insufficient_information).');
    } else {
      passed = false;
      assertionNotes.push(`✗ تصنيف التوافق: ${res.overallLevel}.`);
    }

    results.push({
      caseId: 'CASE_7',
      titleAr: 'الحالة 7: ملف مهني فارغ أو غير مكتمل البيانات',
      descriptionAr: 'التحقق من أن الملفات غير المكتملة لا تحظى بنسب مصطنعة، وتصنف فوراً كمعلومات غير كافية بموثوقية منخفضة.',
      passed,
      score: res.matchPercentage,
      overallLevel: res.overallLevelLabelAr,
      confidence: res.confidenceLabelAr,
      assertionNotes,
      compatibilityResult: res,
    });
  }

  return results;
}
