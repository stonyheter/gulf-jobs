/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ============================================================================
 * EXPLAINABLE JOB COMPATIBILITY ENGINE TYPES (PHASE 4)
 * ============================================================================
 * Defines the structured, deterministic compatibility model between a
 * JobSeekerProfile and a Job opportunity for "هل هذه الوظيفة مناسبة لي؟".
 * 
 * Guarantees:
 * - 100% deterministic (no random/probabilistic hallucinations)
 * - Strict distinction between "Missing Requirement" and "Unknown Information"
 * - Fully explainable score breakdown with exact weights (Total = 100 points)
 * - Information completeness confidence rating (NOT hiring probability)
 */

export type CompatibilityLevel =
  | 'strong_match' // توافق قوي (80% - 100%)
  | 'good_match' // توافق جيد (60% - 79%)
  | 'partial_match' // توافق جزئي (40% - 59%)
  | 'limited_match' // توافق محدود (0% - 39%)
  | 'insufficient_information'; // معلومات غير كافية لتقييم موضوعي

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export type DimensionStatus =
  | 'compatible' // متوافق
  | 'partial' // توافق جزئي
  | 'mismatch' // متطلب غير متوافق
  | 'unspecified_in_job' // غير محدد في إعلان الوظيفة
  | 'insufficient_in_profile'; // غير محدد في ملف المستخدم

export interface DimensionScore {
  criterionId:
    | 'specialty'
    | 'skills'
    | 'experience'
    | 'education'
    | 'location'
    | 'languages'
    | 'workMode'
    | 'employmentType';
  nameAr: string;
  weight: number; // Max weight points
  earnedPoints: number; // Points awarded (0 - weight)
  status: DimensionStatus;
  statusLabelAr: string;
  detailsAr: string;
}

export interface CompatibilityResult {
  matchPercentage: number; // Final score 0 - 100
  overallLevel: CompatibilityLevel;
  overallLevelLabelAr: string;
  confidence: ConfidenceLevel;
  confidenceLabelAr: string;
  confidenceReasonAr: string;
  summary: string;
  strengths: string[];
  missingRequirements: string[];
  unclearInformation: string[];
  matchedSkills: string[];
  missingSkills: string[];

  // Detailed Dimension Evaluations
  specialtyCompatibility: DimensionScore & {
    userRole: string;
    jobRole: string;
    jobCategory: string | null;
  };
  skillsCompatibility: DimensionScore & {
    matchedCount: number;
    totalJobSkills: number;
  };
  experienceCompatibility: DimensionScore & {
    userYears: number | null;
    requiredMin: number | null;
    requiredMax: number | null;
  };
  educationCompatibility: DimensionScore & {
    userEducation: string | null;
    requiredEducation: string | null;
    fieldMatch: boolean;
  };
  locationCompatibility: DimensionScore & {
    userLocation: string;
    jobLocation: string;
    isRemote: boolean;
  };
  languageCompatibility: DimensionScore & {
    matchedLanguages: string[];
    missingLanguages: string[];
  };
  workModeCompatibility: DimensionScore & {
    userPreference: string;
    jobWorkMode: string;
  };
  employmentTypeCompatibility: DimensionScore & {
    userPreference: string;
    jobEmploymentType: string;
  };

  scoreBreakdown: DimensionScore[];
  disclaimerAr: string;
}

// Backward-compatibility alias
export type JobMatchAnalysis = CompatibilityResult;
