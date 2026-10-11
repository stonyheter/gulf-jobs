/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ============================================================================
 * EXPLAINABLE DETERMINISTIC COMPATIBILITY ENGINE (PHASE 4)
 * ============================================================================
 * Evaluates the factual compatibility between a JobSeekerProfile and a Job.
 * 
 * Strict Architectural Rules:
 * 1. 100% Deterministic: No randomness, no LLM calls, no probabilistic guessing.
 * 2. Exact 100-point weight distribution:
 *    - التخصص والمسمى (Specialty / Target Role): 20 pts
 *    - المهارات (Skills): 25 pts
 *    - الخبرة (Experience): 15 pts
 *    - التعليم (Education): 10 pts
 *    - الموقع الجغرافي (Location): 10 pts
 *    - اللغات (Languages): 10 pts
 *    - نمط العمل (Work Mode): 5 pts
 *    - نوع الوظيفة (Employment Type): 5 pts
 * 3. Strict distinction between "Missing Requirement" and "Unknown/Unspecified Information":
 *    - Missing Requirement: The job explicitly requires something absent from the profile.
 *    - Unknown Information: Either the job or the user does not provide data for that criterion.
 *    - Unknown info is NEVER penalized as a mismatch, nor awarded unearned points.
 * 4. Factual, non-misleading language only (no predictions of hiring or advice to apply).
 * 5. Confidence rating indicates information completeness, NOT hiring chances.
 */

import { Job, WorkMode, EmploymentType } from '../types/job';
import { JobSeekerProfile } from '../types/profile';
import {
  CompatibilityResult,
  CompatibilityLevel,
  ConfidenceLevel,
  DimensionScore,
  DimensionStatus,
} from '../types/jobMatch';
import {
  getEducationLevelLabel,
  getWorkModeLabel,
  getEmploymentTypeLabel,
} from '../utils/formatters';

// ----------------------------------------------------------------------------
// STRING NORMALIZATION UTILITIES
// ----------------------------------------------------------------------------

export function normalizeArabicAndEnglish(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .trim()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[ًٌٍَُِّْ]/g, '') // remove Arabic diacritics
    .replace(/[^\p{L}\p{N}\s]/gu, ' ') // replace punctuation with spaces
    .replace(/\s+/g, ' ')
    .trim();
}

// ----------------------------------------------------------------------------
// MAINTAINABLE ROLE & SPECIALTY CLUSTERS
// ----------------------------------------------------------------------------

interface RoleCluster {
  id: string;
  nameAr: string;
  keywords: string[];
}

export const ROLE_CLUSTERS: RoleCluster[] = [
  {
    id: 'software_engineering',
    nameAr: 'تطوير البرمجيات وهندسة الويب',
    keywords: [
      'مهندس برمجيات',
      'مطور برمجيات',
      'مبرمج',
      'مطور ويب',
      'تطوير البرمجيات',
      'واجهات اماميه',
      'واجهات خلفيه',
      'فل ستاك',
      'تطبيقات',
      'برمجه',
      'software engineer',
      'software developer',
      'frontend',
      'backend',
      'full stack',
      'fullstack',
      'web developer',
      'mobile developer',
      'programmer',
      'software development',
    ],
  },
  {
    id: 'data_and_ai',
    nameAr: 'علوم البيانات والذكاء الاصطناعي',
    keywords: [
      'علم البيانات',
      'عالم بيانات',
      'محلل بيانات',
      'مهندس بيانات',
      'ذكاء اصطناعي',
      'تعلم الاله',
      'ذكاء الاعمال',
      'تحليل البيانات',
      'data scientist',
      'data analyst',
      'data engineer',
      'ai engineer',
      'machine learning',
      'business intelligence',
      'big data',
    ],
  },
  {
    id: 'cloud_and_infrastructure',
    nameAr: 'الحوسبة السحابية والبنية التحتية',
    keywords: [
      'حوسبه سحابيه',
      'مهندس سحابي',
      'ديف اوبس',
      'بنية تحتية',
      'امن سيبراني',
      'امن المعلومات',
      'شبكات',
      'سحابه',
      'cloud engineer',
      'devops',
      'infrastructure',
      'cybersecurity',
      'infosec',
      'systems administrator',
      'network engineer',
    ],
  },
  {
    id: 'product_and_projects',
    nameAr: 'إدارة المشاريع والمنتجات',
    keywords: [
      'مدير مشروع',
      'ادارة مشاريع',
      'مدير منتج',
      'ادارة منتجات',
      'سكرام ماستر',
      'رشاقه اعمال',
      'تخطيط مشاريع',
      'project manager',
      'product manager',
      'scrum master',
      'agile coach',
      'pmp',
      'product owner',
    ],
  },
  {
    id: 'finance_and_accounting',
    nameAr: 'المحاسبة والمالية',
    keywords: [
      'محاسب',
      'محاسبه',
      'ماليه',
      'مدير مالي',
      'تدقيق',
      'محاسب قانوني',
      'تمويل',
      'محلل مالي',
      'accountant',
      'accounting',
      'finance',
      'financial analyst',
      'auditor',
      'cpa',
      'treasury',
    ],
  },
  {
    id: 'marketing_and_sales',
    nameAr: 'التسويق والمبيعات',
    keywords: [
      'تسويق',
      'تسويق رقمي',
      'مبيعات',
      'ادارة مبيعات',
      'تسويق الكتروني',
      'علاقات عامه',
      'صناع محتوى',
      'تطوير اعمال',
      'marketing',
      'digital marketing',
      'sales',
      'business development',
      'seo',
      'social media',
    ],
  },
  {
    id: 'human_resources',
    nameAr: 'الموارد البشرية والتوظيف',
    keywords: [
      'موارد بشريه',
      'اخصائي توظيف',
      'ادارة مواهب',
      'شؤون موظفين',
      'استقطاب كفاءات',
      'تدريب وتطوير',
      'human resources',
      'hr',
      'recruiter',
      'talent acquisition',
      'people operations',
    ],
  },
  {
    id: 'engineering_general',
    nameAr: 'الهندسة العامة والمعمارية',
    keywords: [
      'مهندس مدني',
      'مهندس ميكانيكي',
      'مهندس كهربائي',
      'هندسه معماريه',
      'مهندس صناعي',
      'هندسه',
      'مهندس موقع',
      'civil engineer',
      'mechanical engineer',
      'electrical engineer',
      'architect',
      'industrial engineer',
    ],
  },
  {
    id: 'healthcare',
    nameAr: 'الرعاية الصحية والطب',
    keywords: [
      'طبيب',
      'تمريض',
      'صيدلي',
      'رعايه صحيه',
      'مختبرات',
      'صحه',
      'علاج طبيعي',
      'doctor',
      'nurse',
      'pharmacist',
      'healthcare',
      'physician',
    ],
  },
];

function identifyCluster(text: string): RoleCluster | null {
  const norm = normalizeArabicAndEnglish(text);
  for (const cluster of ROLE_CLUSTERS) {
    for (const kw of cluster.keywords) {
      const normKw = normalizeArabicAndEnglish(kw);
      if (norm.includes(normKw) || normKw.includes(norm)) {
        return cluster;
      }
    }
  }
  return null;
}

// ----------------------------------------------------------------------------
// EDUCATION RANKING HIERARCHY
// ----------------------------------------------------------------------------

function getEducationRank(edu: string | null | undefined): number {
  if (!edu) return 0;
  const s = edu.toLowerCase();
  if (s === 'not_specified' || s.includes('بدون')) return 0;
  if (s === 'high_school' || s.includes('ثانوي')) return 1;
  if (s === 'diploma' || s.includes('دبلوم')) return 2;
  if (s === 'bachelor' || s.includes('بكالوريوس')) return 3;
  if (s === 'master' || s.includes('ماجستير')) return 4;
  if (s === 'phd' || s.includes('دكتوراه')) return 5;
  return 0;
}

// ----------------------------------------------------------------------------
// MAIN EXPLAINABLE COMPATIBILITY ENGINE
// ----------------------------------------------------------------------------

export function analyzeJobCompatibility(
  job: Job,
  profile: JobSeekerProfile | null
): CompatibilityResult | null {
  if (!profile) return null;

  const strengths: string[] = [];
  const missingRequirements: string[] = [];
  const unclearInformation: string[] = [];

  // Track evaluable criteria for confidence scoring
  let evaluableCriteriaCount = 0;
  let unspecifiedJobFieldsCount = 0;
  let insufficientProfileFieldsCount = 0;

  // ==========================================================================
  // 1. SPECIALTY / TARGET ROLE (WEIGHT: 20 POINTS)
  // ==========================================================================
  let specialtyEarned = 0;
  let specialtyStatus: DimensionStatus = 'mismatch';
  let specialtyStatusLabel = 'غير متطابق';
  let specialtyDetails = '';

  const userTargetNorm = normalizeArabicAndEnglish(profile.targetJobTitle);
  const userSpecialtiesNorm = profile.specialties.map(normalizeArabicAndEnglish);
  const jobTitleNorm = normalizeArabicAndEnglish(job.title);
  const jobCategoryNorm = normalizeArabicAndEnglish(job.category ?? '');

  if (!userTargetNorm && userSpecialtiesNorm.length === 0) {
    specialtyStatus = 'insufficient_in_profile';
    specialtyStatusLabel = 'معلومات غير كافية بالملف';
    specialtyDetails = 'لم تحدد المسمى الوظيفي المستهدف أو التخصص المهني في ملفك المهني.';
    unclearInformation.push('المسمى الوظيفي المستهدف غير محدد في ملف المستخدم.');
    insufficientProfileFieldsCount++;
  } else {
    evaluableCriteriaCount++;
    const userCluster = identifyCluster(userTargetNorm) ||
      (profile.specialties.length > 0 ? identifyCluster(profile.specialties[0]) : null);
    const jobCluster = identifyCluster(jobTitleNorm) ||
      (job.category ? identifyCluster(job.category) : null);

    // Direct / Substring Title Match
    const isDirectTitleMatch =
      userTargetNorm &&
      jobTitleNorm &&
      (jobTitleNorm.includes(userTargetNorm) || userTargetNorm.includes(jobTitleNorm));

    if (isDirectTitleMatch) {
      specialtyEarned = 20;
      specialtyStatus = 'compatible';
      specialtyStatusLabel = 'متوافق تماماً';
      specialtyDetails = `تطابق تام ومباشر بين مسماك المستهدف (${profile.targetJobTitle}) وعنوان الوظيفة (${job.title}).`;
      strengths.push(`تطابق المسمى الوظيفي المستهدف (${profile.targetJobTitle}) مع عنوان الوظيفة.`);
    } else if (userCluster && jobCluster && userCluster.id === jobCluster.id) {
      specialtyEarned = 18;
      specialtyStatus = 'compatible';
      specialtyStatusLabel = 'توافق في المجال';
      specialtyDetails = `المسمى المستهدف (${profile.targetJobTitle}) يقع ضمن نفس المجال التخصصي للوظيفة (${userCluster.nameAr}).`;
      strengths.push(`توافق تخصصي مباشر ضمن قطاع: ${userCluster.nameAr}.`);
    } else if (
      jobCategoryNorm &&
      userSpecialtiesNorm.some((s) => s && (jobCategoryNorm.includes(s) || s.includes(jobCategoryNorm)))
    ) {
      specialtyEarned = 14;
      specialtyStatus = 'partial';
      specialtyStatusLabel = 'توافق جزئي';
      specialtyDetails = `تخصصك المسجل يتطابق مع التصنيف العام للوظيفة (${job.category}).`;
      strengths.push(`تطابق في التصنيف العام للوظيفة (${job.category}).`);
    } else {
      specialtyEarned = 0;
      specialtyStatus = 'mismatch';
      specialtyStatusLabel = 'اختلاف في التخصص';
      specialtyDetails = `المسمى المستهدف (${profile.targetJobTitle || 'غير محدد'}) يختلف عن عنوان الوظيفة (${job.title}).`;
      missingRequirements.push(`المسمى الوظيفي المطلوب (${job.title}) لا يطابق هدفك المهني المسجل.`);
    }
  }

  const specialtyCompatibility = {
    criterionId: 'specialty' as const,
    nameAr: 'التخصص والمسمى المستهدف',
    weight: 20,
    earnedPoints: specialtyEarned,
    status: specialtyStatus,
    statusLabelAr: specialtyStatusLabel,
    detailsAr: specialtyDetails,
    userRole: profile.targetJobTitle || 'غير محدد',
    jobRole: job.title,
    jobCategory: job.category,
  };

  // ==========================================================================
  // 2. SKILLS EVALUATION (WEIGHT: 25 POINTS)
  // ==========================================================================
  let skillsEarned = 0;
  let skillsStatus: DimensionStatus = 'mismatch';
  let skillsStatusLabel = 'غير متطابق';
  let skillsDetails = '';
  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  const allUserSkills = [
    ...profile.technicalSkills,
    ...profile.industrySkills,
    ...profile.softSkills,
  ];
  const userSkillsNorm = allUserSkills.map((s) => ({
    original: s,
    norm: normalizeArabicAndEnglish(s),
  }));

  if (!job.skills || job.skills.length === 0) {
    skillsStatus = 'unspecified_in_job';
    skillsStatusLabel = 'غير محددة بالإعلان';
    skillsDetails = 'لم يحدد إعلان الوظيفة قائمة مهارات تفصيلية لتقييمها بشكل مستقل.';
    unclearInformation.push('قائمة المهارات المطلوبة غير مفصلة في إعلان الوظيفة.');
    unspecifiedJobFieldsCount++;
  } else if (allUserSkills.length === 0) {
    skillsStatus = 'insufficient_in_profile';
    skillsStatusLabel = 'معلومات غير كافية بالملف';
    skillsDetails = 'لم تسجل مهارات تقنية أو مهنية في ملفك المهني لمقارنتها مع الوظيفة.';
    missingSkills.push(...job.skills);
    missingRequirements.push(`الوظيفة تشترط مهارات محددة (${job.skills.slice(0, 3).join('، ')}) غير مسجلة في ملفك.`);
    insufficientProfileFieldsCount++;
  } else {
    evaluableCriteriaCount++;
    job.skills.forEach((skill) => {
      const normJobSkill = normalizeArabicAndEnglish(skill);
      const isMatched = userSkillsNorm.some(
        (u) =>
          u.norm === normJobSkill ||
          (u.norm.length > 2 && normJobSkill.includes(u.norm)) ||
          (normJobSkill.length > 2 && u.norm.includes(normJobSkill))
      );

      if (isMatched) {
        matchedSkills.push(skill);
      } else {
        missingSkills.push(skill);
      }
    });

    const ratio = matchedSkills.length / Math.max(1, job.skills.length);
    skillsEarned = Math.round(ratio * 25);

    if (matchedSkills.length === job.skills.length) {
      skillsStatus = 'compatible';
      skillsStatusLabel = 'تطابق كامل';
      skillsDetails = `تطابق تام لكافة المهارات المعلنة بالوظيفة (${matchedSkills.length} من أصل ${job.skills.length}).`;
      strengths.push(`تطابق تام في المهارات المطلوبة (${matchedSkills.join('، ')}).`);
    } else if (matchedSkills.length > 0) {
      skillsStatus = 'partial';
      skillsStatusLabel = 'تطابق جزئي';
      skillsDetails = `تطابق في ${matchedSkills.length} من أصل ${job.skills.length} مهارات معلنة.`;
      strengths.push(`تطابق في المهارات: ${matchedSkills.join('، ')}.`);
      if (missingSkills.length > 0) {
        missingRequirements.push(`مهارات مطلوبة غير مسجلة في ملفك: ${missingSkills.join('، ')}.`);
      }
    } else {
      skillsStatus = 'mismatch';
      skillsStatusLabel = 'لا يوجد تطابق';
      skillsDetails = `لم يتم العثور على أي من مهارات الوظيفة المطلوبة (${job.skills.join('، ')}) في ملفك.`;
      missingRequirements.push(`المهارات المطلوبة للوظيفة (${job.skills.join('، ')}) غير مدونة في ملفك.`);
    }
  }

  const skillsCompatibility = {
    criterionId: 'skills' as const,
    nameAr: 'المهارات المطلوبة',
    weight: 25,
    earnedPoints: skillsEarned,
    status: skillsStatus,
    statusLabelAr: skillsStatusLabel,
    detailsAr: skillsDetails,
    matchedCount: matchedSkills.length,
    totalJobSkills: job.skills ? job.skills.length : 0,
  };

  // ==========================================================================
  // 3. EXPERIENCE EVALUATION (WEIGHT: 15 POINTS)
  // ==========================================================================
  let expEarned = 0;
  let expStatus: DimensionStatus = 'mismatch';
  let expStatusLabel = 'غير متطابق';
  let expDetails = '';
  const userYears = profile.yearsOfExperience;
  const reqMin = job.experienceMin;
  const reqMax = job.experienceMax;

  if (reqMin === null && reqMax === null) {
    expStatus = 'unspecified_in_job';
    expStatusLabel = 'غير محددة بالإعلان';
    expDetails = 'لا يشترط إعلان الوظيفة حداً أدنى أو أقصى لسنوات الخبرة.';
    unclearInformation.push('شروط سنوات الخبرة غير محددة في إعلان الوظيفة.');
    unspecifiedJobFieldsCount++;
  } else if (userYears === null) {
    expStatus = 'insufficient_in_profile';
    expStatusLabel = 'معلومات غير كافية بالملف';
    expDetails = 'سنوات خبرتك العملية غير مسجلة في ملفك المهني.';
    unclearInformation.push('لم تسجل سنوات خبرتك في ملفك المهني للمقارنة مع متطلبات الوظيفة.');
    insufficientProfileFieldsCount++;
  } else {
    evaluableCriteriaCount++;
    const minRequired = reqMin ?? 0;

    if (userYears >= minRequired) {
      if (reqMax !== null && userYears > reqMax + 4) {
        expEarned = 11;
        expStatus = 'partial';
        expStatusLabel = 'تجاوز الحد الأقصى';
        expDetails = `خبرتك المسجلة (${userYears} سنوات) تتجاوز الحد الأقصى المطلوب (${reqMax} سنوات)، ما قد يعني أنك أعلى تأهيلاً (Overqualified).`;
      } else {
        expEarned = 15;
        expStatus = 'compatible';
        expStatusLabel = 'متوافق تماماً';
        expDetails = `سنوات خبرتك (${userYears} سنوات) تفي بالحد المطلوب المعلن (${minRequired} سنوات).`;
        strengths.push(`سنوات الخبرة المسجلة (${userYears} سنوات) تلبي الشروط المطلوبة.`);
      }
    } else {
      expEarned = 0;
      expStatus = 'mismatch';
      expStatusLabel = 'أقل من المطلوب';
      const gap = minRequired - userYears;
      expDetails = `تتطلب الوظيفة خبرة لا تقل عن ${minRequired} سنوات، بينما خبرتك المسجلة هي ${userYears} سنوات (فارق ${gap} سنوات).`;
      missingRequirements.push(`نقص في سنوات الخبرة المطلوبة (مطلوب ${minRequired} سنوات، والمسجل ${userYears} سنوات).`);
    }
  }

  const experienceCompatibility = {
    criterionId: 'experience' as const,
    nameAr: 'سنوات الخبرة العملية',
    weight: 15,
    earnedPoints: expEarned,
    status: expStatus,
    statusLabelAr: expStatusLabel,
    detailsAr: expDetails,
    userYears,
    requiredMin: reqMin,
    requiredMax: reqMax,
  };

  // ==========================================================================
  // 4. EDUCATION EVALUATION (WEIGHT: 10 POINTS)
  // ==========================================================================
  let eduEarned = 0;
  let eduStatus: DimensionStatus = 'mismatch';
  let eduStatusLabel = 'غير متطابق';
  let eduDetails = '';
  let fieldMatch = false;

  const userEduRank = profile.educationLevel ? getEducationRank(profile.educationLevel) : null;
  const jobEduRank = getEducationRank(job.education);

  if (!job.education || jobEduRank === 0) {
    eduStatus = 'unspecified_in_job';
    eduStatusLabel = 'غير محدد بالإعلان';
    eduDetails = 'المؤهل التعليمي غير محدد كشرط إلزامي في إعلان الوظيفة.';
    unclearInformation.push('المؤهل التعليمي المطلوب غير محدد في إعلان الوظيفة.');
    unspecifiedJobFieldsCount++;
  } else if (userEduRank === null || userEduRank === 0) {
    eduStatus = 'insufficient_in_profile';
    eduStatusLabel = 'معلومات غير كافية بالملف';
    eduDetails = 'المؤهل العلمي غير مسجل في ملفك المهني.';
    unclearInformation.push('المؤهل العلمي غير مدون في ملف المستخدم.');
    insufficientProfileFieldsCount++;
  } else {
    evaluableCriteriaCount++;
    const reqLabel = getEducationLevelLabel(job.education);
    const userLabel = getEducationLevelLabel(profile.educationLevel);

    // Check field of study if job specifies specialized field
    const jobEduNorm = normalizeArabicAndEnglish(job.education);
    const userFieldNorm = normalizeArabicAndEnglish(profile.fieldOfStudy ?? '');
    if (userFieldNorm && (jobEduNorm.includes(userFieldNorm) || userFieldNorm.includes(jobEduNorm))) {
      fieldMatch = true;
    }

    if (userEduRank >= jobEduRank) {
      eduEarned = 10;
      eduStatus = 'compatible';
      eduStatusLabel = 'متوافق تماماً';
      eduDetails = `مؤهلك العلمي (${userLabel}) يعادل أو يتجاوز الحد المطلوب (${reqLabel}).`;
      strengths.push(`المؤهل العلمي المسجل (${userLabel}) يطابق أو يتجاوز الدرجة المطلوبة (${reqLabel}).`);
    } else {
      eduEarned = 0;
      eduStatus = 'mismatch';
      eduStatusLabel = 'أقل من المطلوب';
      eduDetails = `تتطلب الوظيفة مؤهل (${reqLabel}) بينما مؤهلك المسجل هو (${userLabel}).`;
      missingRequirements.push(`الدرجة العلمية المطلوبة للوظيفة هي (${reqLabel}).`);
    }
  }

  const educationCompatibility = {
    criterionId: 'education' as const,
    nameAr: 'المؤهل العلمي والتعليم',
    weight: 10,
    earnedPoints: eduEarned,
    status: eduStatus,
    statusLabelAr: eduStatusLabel,
    detailsAr: eduDetails,
    userEducation: profile.educationLevel ? getEducationLevelLabel(profile.educationLevel) : null,
    requiredEducation: job.education ? getEducationLevelLabel(job.education) : null,
    fieldMatch,
  };

  // ==========================================================================
  // 5. LOCATION EVALUATION (WEIGHT: 10 POINTS)
  // ==========================================================================
  let locEarned = 0;
  let locStatus: DimensionStatus = 'mismatch';
  let locStatusLabel = 'غير متطابق';
  let locDetails = '';
  const isRemoteJob = job.workMode === 'remote';

  const acceptsRemote =
    profile.remotePreference === 'remote_only' ||
    profile.remotePreference === 'open_to_remote' ||
    profile.remotePreference === 'flexible' ||
    profile.preferredWorkModes.includes('remote');

  evaluableCriteriaCount++;

  if (isRemoteJob) {
    if (acceptsRemote) {
      locEarned = 10;
      locStatus = 'compatible';
      locStatusLabel = 'متطابق (عن بُعد)';
      locDetails = 'الوظيفة عن بُعد بالكامل وتتوافق مع تفضيلاتك للعمل المرن.';
      strengths.push('طبيعة العمل عن بُعد تتطابق مع تفضيلاتك.');
    } else {
      locEarned = 3;
      locStatus = 'partial';
      locStatusLabel = 'توافق جزئي';
      locDetails = 'الوظيفة عن بُعد بينما تفضيلك المسجل هو العمل الميداني أو الحضوري فقط.';
    }
  } else {
    // On-site or Hybrid: Exact geographic evaluation
    const countryMatch =
      profile.country === job.country ||
      profile.preferredCountries.includes(job.country);

    const cityMatch =
      (profile.city && job.city && profile.city === job.city) ||
      (job.city && profile.preferredCities.includes(job.city));

    const regionMatch =
      (profile.region && job.region && profile.region === job.region) ||
      (job.region && profile.preferredRegions.includes(job.region));

    if (countryMatch && cityMatch) {
      locEarned = 10;
      locStatus = 'compatible';
      locStatusLabel = 'تطابق تام بالمدينة';
      locDetails = `مقر الوظيفة (${job.city}، ${job.country}) يطابق مدينتك وتفضيلاتك الجغرافية بدقة.`;
      strengths.push(`تطابق تام في الموقع الجغرافي (${job.city}، ${job.country}).`);
    } else if (countryMatch && regionMatch) {
      locEarned = 8;
      locStatus = 'partial';
      locStatusLabel = 'تطابق في المنطقة';
      locDetails = `مقر الوظيفة في نفس المنطقة (${job.region}، ${job.country}) مع اختلاف المدينة المحددة.`;
      strengths.push(`توافق إقليمي في نفس المنطقة (${job.region}).`);
    } else if (countryMatch) {
      locEarned = 6;
      locStatus = 'partial';
      locStatusLabel = 'تطابق في الدولة';
      locDetails = `مقر الوظيفة في نفس الدولة (${job.country}) ولكن خارج مدينتك أو نطاق تفضيلاتك المباشرة.`;
    } else {
      locEarned = 0;
      locStatus = 'mismatch';
      locStatusLabel = 'دولة مختلفة';
      locDetails = `مقر الوظيفة (${job.country}) يقع خارج نطاق دولتك وتفضيلاتك الجغرافية المسجلة.`;
      missingRequirements.push(`موقع العمل (${job.country}) يقع خارج نطاق الدول والتفضيلات المحددة بملفك.`);
    }
  }

  const locationCompatibility = {
    criterionId: 'location' as const,
    nameAr: 'الموقع الجغرافي ونطاق العمل',
    weight: 10,
    earnedPoints: locEarned,
    status: locStatus,
    statusLabelAr: locStatusLabel,
    detailsAr: locDetails,
    userLocation: profile.city ? `${profile.city}، ${profile.country}` : profile.country,
    jobLocation: job.city ? `${job.city}، ${job.country}` : job.country,
    isRemote: isRemoteJob,
  };

  // ==========================================================================
  // 6. LANGUAGES EVALUATION (WEIGHT: 10 POINTS)
  // ==========================================================================
  let langEarned = 0;
  let langStatus: DimensionStatus = 'mismatch';
  let langStatusLabel = 'غير متطابق';
  let langDetails = '';
  const matchedLanguages: string[] = [];
  const missingLanguages: string[] = [];

  const userLanguagesNorm = profile.languages.map((l) => ({
    name: l.language,
    norm: normalizeArabicAndEnglish(l.language),
    level: l.level,
  }));

  if (!job.languages || job.languages.length === 0) {
    langStatus = 'unspecified_in_job';
    langStatusLabel = 'غير محددة بالإعلان';
    langDetails = 'لا توجد متطلبات لغوية خاصة محددة في إعلان الوظيفة.';
    unclearInformation.push('اللغات المطلوبة غير محددة في إعلان الوظيفة.');
    unspecifiedJobFieldsCount++;
  } else if (profile.languages.length === 0) {
    langStatus = 'insufficient_in_profile';
    langStatusLabel = 'معلومات غير كافية بالملف';
    langDetails = 'لم تسجل أي لغات في ملفك المهني.';
    missingLanguages.push(...job.languages);
    missingRequirements.push(`اللغات المشترطة للوظيفة (${job.languages.join('، ')}) غير مسجلة بملفك.`);
    insufficientProfileFieldsCount++;
  } else {
    evaluableCriteriaCount++;
    job.languages.forEach((lang) => {
      const normJobLang = normalizeArabicAndEnglish(lang);
      const isMatched = userLanguagesNorm.some(
        (u) => u.norm.includes(normJobLang) || normJobLang.includes(u.norm)
      );

      if (isMatched) {
        matchedLanguages.push(lang);
      } else {
        missingLanguages.push(lang);
      }
    });

    const ratio = matchedLanguages.length / Math.max(1, job.languages.length);
    langEarned = Math.round(ratio * 10);

    if (matchedLanguages.length === job.languages.length) {
      langStatus = 'compatible';
      langStatusLabel = 'متطابق تماماً';
      langDetails = `إتقان كافة اللغات المطلوبة (${matchedLanguages.join('، ')}).`;
      strengths.push(`إتقان اللغات المشروطة: ${matchedLanguages.join('، ')}.`);
    } else if (matchedLanguages.length > 0) {
      langStatus = 'partial';
      langStatusLabel = 'توافق جزئي';
      langDetails = `إتقان بعض اللغات المطلوبة (${matchedLanguages.join('، ')}) ونقص في (${missingLanguages.join('، ')}).`;
      missingRequirements.push(`لغات مطلوبة غير مسجلة في ملفك: ${missingLanguages.join('، ')}.`);
    } else {
      langStatus = 'mismatch';
      langStatusLabel = 'غير متطابق';
      langDetails = `اللغات المطلوبة للوظيفة (${job.languages.join('، ')}) غير متوفرة في ملفك.`;
      missingRequirements.push(`اللغات المطلوبة للوظيفة (${job.languages.join('، ')}) غير مسجلة بملفك.`);
    }
  }

  const languageCompatibility = {
    criterionId: 'languages' as const,
    nameAr: 'اللغات ومستوى الإتقان',
    weight: 10,
    earnedPoints: langEarned,
    status: langStatus,
    statusLabelAr: langStatusLabel,
    detailsAr: langDetails,
    matchedLanguages,
    missingLanguages,
  };

  // ==========================================================================
  // 7. WORK MODE (WEIGHT: 5 POINTS)
  // ==========================================================================
  let wmEarned = 0;
  let wmStatus: DimensionStatus = 'compatible';
  let wmStatusLabel = 'متوافق';
  let wmDetails = '';

  evaluableCriteriaCount++;
  const jobWmLabel = getWorkModeLabel(job.workMode);

  if (profile.preferredWorkModes.length === 0) {
    wmEarned = 5;
    wmStatus = 'compatible';
    wmStatusLabel = 'متوافق (بدون قيود)';
    wmDetails = 'لم تسجل قيوداً على نمط العمل، وبالتالي يعتبر النمط المعلن متوافقاً.';
  } else if (
    profile.preferredWorkModes.includes(job.workMode) ||
    profile.remotePreference === 'flexible'
  ) {
    wmEarned = 5;
    wmStatus = 'compatible';
    wmStatusLabel = 'متوافق تماماً';
    wmDetails = `نمط العمل المعلن (${jobWmLabel}) يطابق تفضيلاتك المسجلة بدقة.`;
    strengths.push(`نمط العمل المعلن (${jobWmLabel}) يطابق تفضيلاتك.`);
  } else {
    wmEarned = 1;
    wmStatus = 'partial';
    wmStatusLabel = 'يختلف عن المفضل';
    wmDetails = `نمط العمل المعلن هو (${jobWmLabel}) بينما تفضيلك المسجل هو (${profile.preferredWorkModes.map(getWorkModeLabel).join('، ')}).`;
  }

  const workModeCompatibility = {
    criterionId: 'workMode' as const,
    nameAr: 'نمط العمل وبيئته',
    weight: 5,
    earnedPoints: wmEarned,
    status: wmStatus,
    statusLabelAr: wmStatusLabel,
    detailsAr: wmDetails,
    userPreference: profile.preferredWorkModes.length > 0
      ? profile.preferredWorkModes.map(getWorkModeLabel).join('، ')
      : 'مرن بدون تفضيل محدد',
    jobWorkMode: jobWmLabel,
  };

  // ==========================================================================
  // 8. EMPLOYMENT TYPE (WEIGHT: 5 POINTS)
  // ==========================================================================
  let etEarned = 0;
  let etStatus: DimensionStatus = 'compatible';
  let etStatusLabel = 'متوافق';
  let etDetails = '';

  evaluableCriteriaCount++;
  const jobEtLabel = getEmploymentTypeLabel(job.employmentType);

  if (profile.preferredEmploymentTypes.length === 0) {
    etEarned = 5;
    etStatus = 'compatible';
    etStatusLabel = 'متوافق (بدون قيود)';
    etDetails = 'لم تحدد نوع عقد معين، وبالتالي يعتبر نوع التعاقد المعلن متوافقاً.';
  } else if (profile.preferredEmploymentTypes.includes(job.employmentType)) {
    etEarned = 5;
    etStatus = 'compatible';
    etStatusLabel = 'متوافق تماماً';
    etDetails = `نوع التوظيف المعلن (${jobEtLabel}) يطابق نوع العقد المفضل لديك.`;
    strengths.push(`نوع التوظيف المعلن (${jobEtLabel}) يطابق رغباتك.`);
  } else {
    etEarned = 1;
    etStatus = 'partial';
    etStatusLabel = 'يختلف عن المفضل';
    etDetails = `نوع التوظيف المعلن هو (${jobEtLabel}) بينما رغبتك المسجلة هي (${profile.preferredEmploymentTypes.map(getEmploymentTypeLabel).join('، ')}).`;
  }

  const employmentTypeCompatibility = {
    criterionId: 'employmentType' as const,
    nameAr: 'نوع التوظيف والعقد',
    weight: 5,
    earnedPoints: etEarned,
    status: etStatus,
    statusLabelAr: etStatusLabel,
    detailsAr: etDetails,
    userPreference: profile.preferredEmploymentTypes.length > 0
      ? profile.preferredEmploymentTypes.map(getEmploymentTypeLabel).join('، ')
      : 'مرن بدون تحديد',
    jobEmploymentType: jobEtLabel,
  };

  // ==========================================================================
  // SCORE BREAKDOWN & TOTAL CALCULATION (SUM = 100)
  // ==========================================================================
  const scoreBreakdown: DimensionScore[] = [
    specialtyCompatibility,
    skillsCompatibility,
    experienceCompatibility,
    educationCompatibility,
    locationCompatibility,
    languageCompatibility,
    workModeCompatibility,
    employmentTypeCompatibility,
  ];

  const totalScore = scoreBreakdown.reduce((acc, curr) => acc + curr.earnedPoints, 0);
  const matchPercentage = Math.min(100, Math.max(0, Math.round(totalScore)));

  // ==========================================================================
  // CONFIDENCE RATING (INFORMATION QUALITY INDICATOR)
  // ==========================================================================
  let confidence: ConfidenceLevel = 'high';
  let confidenceLabel = 'موثوقية عالية';
  let confidenceReason = 'تتوفر بيانات كافية ومفصلة من إعلان الوظيفة والملف المهني لإجراء تحليل موضوعي شامل.';

  const unspecCount = unspecifiedJobFieldsCount + insufficientProfileFieldsCount;
  if (unspecCount >= 4 || evaluableCriteriaCount <= 3) {
    confidence = 'low';
    confidenceLabel = 'موثوقية منخفضة';
    confidenceReason = 'تفتقر الوظيفة أو الملف المهني للعديد من البيانات الأساسية (مثل المهارات أو سنوات الخبرة أو المؤهل)، ما يحد من دقة التقييم.';
  } else if (unspecCount >= 2) {
    confidence = 'medium';
    confidenceLabel = 'موثوقية متوسطة';
    confidenceReason = 'بعض بنود الوظيفة أو الملف المهني غير محددة بدقة، وتم حصر التقييم بالمعلومات المصرح عنها فقط.';
  }

  // ==========================================================================
  // OVERALL LEVEL (COMPATIBILITY TIERS - NOT RANKINGS OF PEOPLE)
  // ==========================================================================
  let overallLevel: CompatibilityLevel = 'limited_match';
  let overallLevelLabel = 'توافق محدود';

  if (confidence === 'low' && matchPercentage < 40) {
    overallLevel = 'insufficient_information';
    overallLevelLabel = 'معلومات غير كافية للتقييم';
  } else if (matchPercentage >= 80) {
    overallLevel = 'strong_match';
    overallLevelLabel = 'توافق قوي';
  } else if (matchPercentage >= 60) {
    overallLevel = 'good_match';
    overallLevelLabel = 'توافق جيد';
  } else if (matchPercentage >= 40) {
    overallLevel = 'partial_match';
    overallLevelLabel = 'توافق جزئي';
  } else {
    overallLevel = 'limited_match';
    overallLevelLabel = 'توافق محدود';
  }

  // Factual objective summary
  let summary = '';
  if (overallLevel === 'strong_match') {
    summary = `تطابق إيجابي ملحوظ في التخصص الأساسي والمهارات ونطاق العمل، حيث حقق ملفك المهني ${matchPercentage} نقطة من أصل 100 في المعايير المشروطة.`;
  } else if (overallLevel === 'good_match') {
    summary = `يوجد توافق جيد مع معظم متطلبات الوظيفة مع وجود بعض التباينات في متطلبات محددة أو عدم ذكر تفاصيل في الإعلان.`;
  } else if (overallLevel === 'partial_match') {
    summary = `يتوفر توافق في جوانب معينة (مثل المجال أو بيئة العمل) بينما تظهر فروقات أو نواقص في معايير أخرى كسنوات الخبرة أو المهارات المتخصصة.`;
  } else if (overallLevel === 'insufficient_information') {
    summary = `البيانات المصرح عنها في إعلان الوظيفة أو الملف المهني غير كافية لإجراء مقارنة توافقية كاملة.`;
  } else {
    summary = `تشير المقارنة إلى فروقات واضحة في التخصص الرئيسي أو المهارات المشروطة أو سنوات الخبرة المطلوبة.`;
  }

  return {
    matchPercentage,
    overallLevel,
    overallLevelLabelAr: overallLevelLabel,
    confidence,
    confidenceLabelAr: confidenceLabel,
    confidenceReasonAr: confidenceReason,
    summary,
    strengths,
    missingRequirements,
    unclearInformation,
    matchedSkills,
    missingSkills,
    specialtyCompatibility,
    skillsCompatibility,
    experienceCompatibility,
    educationCompatibility,
    locationCompatibility,
    languageCompatibility,
    workModeCompatibility,
    employmentTypeCompatibility,
    scoreBreakdown,
    disclaimerAr:
      'تنبيه استرشادي: هذا التقرير تحليلي وتوافقي مبني بدقة وموضوعية على مطابقة البيانات المتاحة فقط في إعلان الوظيفة وملفك المهني. لا يعتبر توصية بالتقديم أو عدمه، ولا يضمن أو يتنبأ بنتيجة القبول الوظيفي لدى صاحب العمل.',
  };
}
