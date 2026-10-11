/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ============================================================================
 * JOB SEEKER PROFILE DATA MODEL (PHASE 3)
 * ============================================================================
 * Defines the structured profile representation for job seekers in the Gulf region.
 * Designed as the standardized input layer for future AI Job Matching ("هل هذه الوظيفة مناسبة لي؟").
 */

import { WorkMode, EmploymentType, EducationLevel } from './job';

export type LanguageLevel =
  | 'beginner' // مبتدئ
  | 'intermediate' // متوسط
  | 'advanced' // متقدم
  | 'fluent' // طلق / محترف
  | 'native'; // لغة أم

export interface LanguageProficiency {
  language: string;
  level: LanguageLevel;
}

export type RemotePreference =
  | 'remote_only' // عن بُعد فقط
  | 'open_to_remote' // منفتح للعمل عن بُعد
  | 'on_site_only' // حضوري بالمنشأة فقط
  | 'flexible'; // مرن (حضوري أو هجين أو عن بُعد)

export interface JobSeekerProfile {
  id: string;
  userId?: string;

  // A. Personal Information
  fullName: string;
  country: string;
  region: string | null;
  city: string | null;

  // B. Career Target
  targetJobTitle: string;
  specialties: string[]; // Primary professional categories
  secondarySpecialties: string[];

  // C. Education
  educationLevel: EducationLevel | null;
  fieldOfStudy: string | null;
  institution: string | null;
  graduationYear: number | null;

  // D. Experience
  yearsOfExperience: number | null;
  currentJobTitle: string | null;
  experienceSummary: string | null;

  // E. Skills
  technicalSkills: string[];
  softSkills: string[];
  industrySkills: string[];

  // F. Languages
  languages: LanguageProficiency[];

  // G. Work Preferences
  preferredEmploymentTypes: EmploymentType[];
  preferredWorkModes: WorkMode[];
  preferredCountries: string[];
  preferredRegions: string[];
  preferredCities: string[];
  remotePreference: RemotePreference;

  // Audit timestamps
  createdAt: string;
  updatedAt: string;
}

export interface ProfileCompletionMetrics {
  percentage: number;
  completedWeight: number;
  totalWeight: number;
  missingRequired: string[];
  missingRecommended: string[];
  statusLabelAr: string;
}
