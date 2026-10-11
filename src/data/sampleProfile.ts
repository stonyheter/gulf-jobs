/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ============================================================================
 * SAMPLE JOB SEEKER PROFILE & COMPLETION CALCULATOR
 * ============================================================================
 */

import { JobSeekerProfile, ProfileCompletionMetrics } from '../types/profile';

// Sample prefilled profile for quick testing and demonstration
export const SAMPLE_PROFILE: JobSeekerProfile = {
  id: 'prof-sample-001',
  fullName: 'فيصل عبدالرحمن الشمري',
  country: 'المملكة العربية السعودية',
  region: 'منطقة الرياض',
  city: 'الرياض',
  targetJobTitle: 'مهندس برمجيات أول (Senior Software Engineer)',
  specialties: ['تقنية المعلومات', 'تطوير البرمجيات'],
  secondarySpecialties: ['الحوسبة السحابية', 'إدارة المشاريع التقنية'],
  educationLevel: 'bachelor',
  fieldOfStudy: 'علوم الحاسب والمعلومات',
  institution: 'جامعة الملك سعود',
  graduationYear: 2019,
  yearsOfExperience: 5,
  currentJobTitle: 'مهندس واجهات أمامية أول',
  experienceSummary:
    'خبرة تزيد عن 5 سنوات في بناء وتطوير منصات وتطبيقات الويب الحديثة الموجهة لأسواق الخليج العربي باستخدام React وTypeScript وNode.js. قيادة فرق تقنية وتحسين أداء النظم وقواعد البيانات.',
  technicalSkills: [
    'React',
    'TypeScript',
    'JavaScript',
    'Node.js',
    'Next.js',
    'Tailwind CSS',
    'PostgreSQL',
    'REST APIs',
    'Git',
    'Docker',
  ],
  softSkills: [
    'العمل الجماعي وقيادة الفرق',
    'حل المشكلات البرمجية المعقدة',
    'التواصل الفعال',
    'إدارة الأولويات والوقت',
  ],
  industrySkills: [
    'التجارة الإلكترونية والتكنولوجيا المالية (FinTech)',
    'أنظمة إدارة المحتوى والتطبيقات السحابية',
    'تصميم الواجهات الموجهة لأسواق دول الخليج (RTL)',
  ],
  languages: [
    { language: 'العربية', level: 'native' },
    { language: 'الإنجليزية', level: 'fluent' },
  ],
  preferredEmploymentTypes: ['full_time', 'contract'],
  preferredWorkModes: ['hybrid', 'remote', 'on_site'],
  preferredCountries: ['المملكة العربية السعودية', 'الإمارات العربية المتحدة', 'قطر'],
  preferredRegions: ['منطقة الرياض', 'المنطقة الشرقية', 'إمارة دبي'],
  preferredCities: ['الرياض', 'الخبر', 'دبي'],
  remotePreference: 'flexible',
  createdAt: '2026-09-01T10:00:00.000Z',
  updatedAt: new Date().toISOString(),
};

export function calculateProfileCompletion(profile: JobSeekerProfile | null): ProfileCompletionMetrics {
  if (!profile) {
    return {
      percentage: 0,
      completedWeight: 0,
      totalWeight: 100,
      missingRequired: [
        'الاسم الكامل',
        'المسمى الوظيفي المستهدف',
        'الدولة والمدينة',
        'المهارات التقنية',
        'سنوات الخبرة',
      ],
      missingRecommended: [
        'المؤهل العلمي',
        'اللغات',
        'تفضيلات العمل',
        'نبذة موجزة عن الخبرة',
      ],
      statusLabelAr: 'الملف غير منشأ بعد',
    };
  }

  let completed = 0;
  const missingReq: string[] = [];
  const missingRec: string[] = [];

  // A. Personal Information (20%)
  if (profile.fullName && profile.fullName.trim().length > 2) {
    completed += 10;
  } else {
    missingReq.push('الاسم الكامل');
  }

  if (profile.country && profile.country.trim().length > 0) {
    completed += 10;
  } else {
    missingReq.push('دولة الإقامة');
  }

  // B. Career Target (20%)
  if (profile.targetJobTitle && profile.targetJobTitle.trim().length > 2) {
    completed += 12;
  } else {
    missingReq.push('المسمى الوظيفي المستهدف');
  }

  if (profile.specialties && profile.specialties.length > 0) {
    completed += 8;
  } else {
    missingReq.push('التخصص المهني الرئيسي');
  }

  // C. Education (10%)
  if (profile.educationLevel) {
    completed += 6;
  } else {
    missingRec.push('المستوى التعليمي');
  }

  if (profile.fieldOfStudy && profile.fieldOfStudy.trim().length > 0) {
    completed += 4;
  } else {
    missingRec.push('مجال التخصص الدراسي');
  }

  // D. Experience (20%)
  if (profile.yearsOfExperience !== null && profile.yearsOfExperience !== undefined) {
    completed += 10;
  } else {
    missingReq.push('سنوات الخبرة');
  }

  if (profile.currentJobTitle && profile.currentJobTitle.trim().length > 0) {
    completed += 5;
  } else {
    missingRec.push('المسمى الوظيفي الحالي / الأخير');
  }

  if (profile.experienceSummary && profile.experienceSummary.trim().length > 15) {
    completed += 5;
  } else {
    missingRec.push('نبذة موجزة عن الخبرات السابقة');
  }

  // E. Skills (15%)
  if (profile.technicalSkills && profile.technicalSkills.length > 0) {
    completed += 10;
  } else {
    missingReq.push('المهارات التقنية');
  }

  if (profile.softSkills && profile.softSkills.length > 0) {
    completed += 5;
  } else {
    missingRec.push('المهارات الشخصية (Soft Skills)');
  }

  // F. Languages (5%)
  if (profile.languages && profile.languages.length > 0) {
    completed += 5;
  } else {
    missingRec.push('اللغات المتقنة');
  }

  // G. Preferences (10%)
  if (
    (profile.preferredWorkModes && profile.preferredWorkModes.length > 0) ||
    (profile.preferredCountries && profile.preferredCountries.length > 0) ||
    (profile.preferredEmploymentTypes && profile.preferredEmploymentTypes.length > 0)
  ) {
    completed += 10;
  } else {
    missingRec.push('تفضيلات العمل ونمط الدوام');
  }

  const percentage = Math.min(100, Math.round(completed));

  let statusLabelAr = 'ملف مكتمل ومثالي للمطابقة';
  if (percentage < 30) {
    statusLabelAr = 'ملف بحاجة لبيانات أساسية';
  } else if (percentage < 70) {
    statusLabelAr = 'ملف متوسط الاكتمال';
  } else if (percentage < 90) {
    statusLabelAr = 'ملف جيد جداً جاهز للمطابقة';
  }

  return {
    percentage,
    completedWeight: completed,
    totalWeight: 100,
    missingRequired: missingReq,
    missingRecommended: missingRec,
    statusLabelAr,
  };
}
