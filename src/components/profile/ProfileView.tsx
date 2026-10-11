/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ============================================================================
 * JOB SEEKER PROFILE VIEW (ملفي المهني) - PHASE 3
 * ============================================================================
 * Structured profile editor and completion dashboard.
 * Prepares the job seeker's career data to power the upcoming Phase 4 AI matching
 * ("هل هذه الوظيفة مناسبة لي؟").
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  User,
  Briefcase,
  GraduationCap,
  Sparkles,
  Languages,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Save,
  RotateCcw,
  Plus,
  X,
  FileCheck,
  ChevronLeft,
  Info,
  Clock,
  MapPin,
  Building,
} from 'lucide-react';
import { JobSeekerProfile, LanguageProficiency, LanguageLevel, RemotePreference } from '../../types/profile';
import { EducationLevel, WorkMode, EmploymentType } from '../../types/job';
import { profileService, calculateProfileCompletion, SAMPLE_PROFILE } from '../../services/profileService';
import { GCC_COUNTRIES } from '../../data/geoHierarchy';

interface ProfileViewProps {
  onProfileUpdated?: (profile: JobSeekerProfile) => void;
  onExploreJobs?: () => void;
}

const LANGUAGE_LEVELS: { id: LanguageLevel; labelAr: string }[] = [
  { id: 'native', labelAr: 'لغة أم (Native)' },
  { id: 'fluent', labelAr: 'طلق / احترافي (Fluent)' },
  { id: 'advanced', labelAr: 'متقدم (Advanced)' },
  { id: 'intermediate', labelAr: 'متوسط (Intermediate)' },
  { id: 'beginner', labelAr: 'مبتدئ (Beginner)' },
];

const EDUCATION_LEVELS: { id: EducationLevel; labelAr: string }[] = [
  { id: 'high_school', labelAr: 'ثانوية عامة' },
  { id: 'diploma', labelAr: 'دبلوم' },
  { id: 'bachelor', labelAr: 'بكالوريوس' },
  { id: 'master', labelAr: 'ماجستير' },
  { id: 'phd', labelAr: 'دكتوراه' },
  { id: 'not_specified', labelAr: 'بدون مؤهل محدد' },
];

const WORK_MODES: { id: WorkMode; labelAr: string }[] = [
  { id: 'on_site', labelAr: 'حضوري بالمنشأة' },
  { id: 'hybrid', labelAr: 'هجين (حضوري وعن بُعد)' },
  { id: 'remote', labelAr: 'عن بُعد بالكامل' },
];

const EMPLOYMENT_TYPES: { id: EmploymentType; labelAr: string }[] = [
  { id: 'full_time', labelAr: 'دوام كامل' },
  { id: 'part_time', labelAr: 'دوام جزئي' },
  { id: 'contract', labelAr: 'عقد محدد المدة' },
  { id: 'temporary', labelAr: 'مؤقت' },
  { id: 'internship', labelAr: 'تدريب تعاوني' },
];

const REMOTE_PREFERENCES: { id: RemotePreference; labelAr: string; desc: string }[] = [
  { id: 'flexible', labelAr: 'مرن للغاية', desc: 'منفتح للعمل الحضوري، الهجين، أو عن بُعد' },
  { id: 'remote_only', labelAr: 'عن بُعد فقط', desc: 'أبحث حصرياً عن وظائف تتيح العمل عن بُعد' },
  { id: 'open_to_remote', labelAr: 'أفضل عن بُعد', desc: 'أفضل العمل عن بُعد مع الاستعداد للهجين' },
  { id: 'on_site_only', labelAr: 'حضوري فقط', desc: 'أفضل العمل الميداني أو داخل مقر الشركة' },
];

export const ProfileView: React.FC<ProfileViewProps> = ({
  onProfileUpdated,
  onExploreJobs,
}) => {
  const [profile, setProfile] = useState<JobSeekerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'personal' | 'education' | 'skills' | 'preferences'>('personal');

  // Tag inputs state
  const [techInput, setTechInput] = useState('');
  const [softInput, setSoftInput] = useState('');
  const [industryInput, setIndustryInput] = useState('');

  // Language inputs state
  const [newLangName, setNewLangName] = useState('');
  const [newLangLevel, setNewLangLevel] = useState<LanguageLevel>('intermediate');

  // Load profile on mount
  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const loaded = await profileService.getProfile();
        if (loaded) {
          setProfile(loaded);
        } else {
          // Initialize empty profile structure
          setProfile({
            id: `prof-${Date.now()}`,
            fullName: '',
            country: 'المملكة العربية السعودية',
            region: null,
            city: null,
            targetJobTitle: '',
            specialties: [],
            secondarySpecialties: [],
            educationLevel: 'bachelor',
            fieldOfStudy: '',
            institution: '',
            graduationYear: null,
            yearsOfExperience: 0,
            currentJobTitle: '',
            experienceSummary: '',
            technicalSkills: [],
            softSkills: [],
            industrySkills: [],
            languages: [{ language: 'العربية', level: 'native' }],
            preferredEmploymentTypes: ['full_time'],
            preferredWorkModes: ['hybrid', 'on_site'],
            preferredCountries: ['المملكة العربية السعودية'],
            preferredRegions: [],
            preferredCities: [],
            remotePreference: 'flexible',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  // Compute metrics in real-time
  const metrics = useMemo(() => {
    return calculateProfileCompletion(profile);
  }, [profile]);

  // Handle nested geo updates
  const selectedCountryObj = useMemo(() => {
    if (!profile?.country) return null;
    return (
      GCC_COUNTRIES.find(
        (c) => c.nameAr === profile.country || c.commonNameAr === profile.country
      ) || null
    );
  }, [profile?.country]);

  const availableRegions = selectedCountryObj?.regions || [];

  const selectedRegionObj = useMemo(() => {
    if (!profile?.region) return null;
    return availableRegions.find((r) => r.nameAr === profile.region) || null;
  }, [availableRegions, profile?.region]);

  const availableCities = selectedRegionObj?.cities || [];

  // Form field mutators
  const updateField = <K extends keyof JobSeekerProfile>(
    field: K,
    value: JobSeekerProfile[K]
  ) => {
    setProfile((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [field]: value,
      };
    });
  };

  const handleCountryChange = (countryName: string) => {
    setProfile((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        country: countryName,
        region: null,
        city: null,
      };
    });
  };

  const handleRegionChange = (regionName: string) => {
    setProfile((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        region: regionName || null,
        city: null,
      };
    });
  };

  // Add / remove tags
  const addTag = (
    field: 'technicalSkills' | 'softSkills' | 'industrySkills',
    tag: string,
    resetFn: (v: string) => void
  ) => {
    const clean = tag.trim();
    if (!clean || !profile) return;
    if (!profile[field].includes(clean)) {
      updateField(field, [...profile[field], clean]);
    }
    resetFn('');
  };

  const removeTag = (
    field: 'technicalSkills' | 'softSkills' | 'industrySkills',
    tagToRemove: string
  ) => {
    if (!profile) return;
    updateField(
      field,
      profile[field].filter((t) => t !== tagToRemove)
    );
  };

  // Language management
  const addLanguage = () => {
    const clean = newLangName.trim();
    if (!clean || !profile) return;
    if (!profile.languages.some((l) => l.language.toLowerCase() === clean.toLowerCase())) {
      updateField('languages', [
        ...profile.languages,
        { language: clean, level: newLangLevel },
      ]);
      setNewLangName('');
    }
  };

  const removeLanguage = (langName: string) => {
    if (!profile) return;
    updateField(
      'languages',
      profile.languages.filter((l) => l.language !== langName)
    );
  };

  // Save profile
  const handleSave = async () => {
    if (!profile) return;
    setIsSaving(true);
    try {
      const saved = await profileService.saveProfile(profile);
      setProfile(saved);
      if (onProfileUpdated) {
        onProfileUpdated(saved);
      }
      setSaveSuccessNotice('تم حفظ بيانات ملفك المهني بنجاح! تم تحديث مؤشرات التوافق والمطابقة.');
      setTimeout(() => setSaveSuccessNotice(null), 4000);
    } catch (e) {
      console.error('Failed to save profile', e);
    } finally {
      setIsSaving(false);
    }
  };

  // Quick fill with sample data
  const handleFillSample = async () => {
    setIsSaving(true);
    try {
      const sample = await profileService.loadSampleProfile();
      setProfile(sample);
      if (onProfileUpdated) {
        onProfileUpdated(sample);
      }
      setSaveSuccessNotice('تم تحميل الملف التجريبي بنجاح (مهندس برمجيات أول - 100% اكتمال)');
      setTimeout(() => setSaveSuccessNotice(null), 4000);
    } finally {
      setIsSaving(false);
    }
  };

  // Reset profile
  const handleReset = async () => {
    if (window.confirm('هل أنت متأكد من رغبتك في مسح كافة بيانات الملف المهني؟')) {
      await profileService.clearProfile();
      const empty: JobSeekerProfile = {
        id: `prof-${Date.now()}`,
        fullName: '',
        country: 'المملكة العربية السعودية',
        region: null,
        city: null,
        targetJobTitle: '',
        specialties: [],
        secondarySpecialties: [],
        educationLevel: null,
        fieldOfStudy: '',
        institution: '',
        graduationYear: null,
        yearsOfExperience: null,
        currentJobTitle: '',
        experienceSummary: '',
        technicalSkills: [],
        softSkills: [],
        industrySkills: [],
        languages: [],
        preferredEmploymentTypes: [],
        preferredWorkModes: [],
        preferredCountries: [],
        preferredRegions: [],
        preferredCities: [],
        remotePreference: 'flexible',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setProfile(empty);
      if (onProfileUpdated) {
        onProfileUpdated(empty);
      }
      setSaveSuccessNotice('تمت إعادة ضبط الملف');
      setTimeout(() => setSaveSuccessNotice(null), 3000);
    }
  };

  if (isLoading || !profile) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center text-slate-500">
        جاري تحميل ملفك المهني...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Banner: AI Matching Readiness Context */}
      <div className="bg-emerald-900 text-white rounded-2xl p-6 sm:p-7 shadow-sm border border-emerald-800 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-800/80 text-emerald-200 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>أساس المطابقة الذكية للمرحلة الرابعة</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold">ملفي المهني وتفضيلات التوظيف</h1>
            <p className="text-xs sm:text-sm text-emerald-100 max-w-2xl leading-relaxed">
              هذا الملف المنظم يمثل بصمتك المهنية في منصة وظائف الخليج. بياناتك ستكون المدخل المباشر لمحرك المطابقة الذكية <span className="font-semibold text-white">«هل هذه الوظيفة مناسبة لي؟»</span> لتقديم تحليلات دقيقة بنقاط القوة ونواقص المتطلبات لكل فرصة شاغرة.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto">
            <button
              onClick={handleFillSample}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold rounded-lg bg-emerald-800 hover:bg-emerald-700 text-emerald-100 transition-colors cursor-pointer border border-emerald-700"
              title="تعبئة نموذج تجريبي جاهز لتجربة المطابقة فوراً"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>تحميل نموذج تجريبي</span>
            </button>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 transition-colors shadow-sm cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'جاري الحفظ...' : 'حفظ التعديلات'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Success Notification Banner */}
      {saveSuccessNotice && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center justify-between gap-3 text-sm animate-fade-in">
          <div className="flex items-center gap-2.5 font-medium">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{saveSuccessNotice}</span>
          </div>
          <button
            onClick={() => setSaveSuccessNotice(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs"
          >
            إغلاق
          </button>
        </div>
      )}

      {/* Profile Completion Metrics Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-lg font-bold text-slate-900">نسبة اكتمال الملف المهني:</span>
              <span className="text-2xl font-black text-emerald-700 tabular-nums">
                {metrics.percentage}%
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-slate-100 text-slate-700 border border-slate-200">
                {metrics.statusLabelAr}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              اكتمال ملفك يرفع من دقة التحليل التوافقي ويقلل من البنود غير المحددة عند تصفح إعلانات الوظائف.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onExploreJobs && (
              <button
                onClick={onExploreJobs}
                className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold inline-flex items-center gap-1 cursor-pointer"
              >
                <span>تصفح الوظائف واختبر المطابقة</span>
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              metrics.percentage >= 80
                ? 'bg-emerald-600'
                : metrics.percentage >= 50
                ? 'bg-amber-500'
                : 'bg-rose-500'
            }`}
            style={{ width: `${metrics.percentage}%` }}
          />
        </div>

        {/* Missing Recommendations */}
        {(metrics.missingRequired.length > 0 || metrics.missingRecommended.length > 0) && (
          <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
            {metrics.missingRequired.length > 0 && (
              <div className="flex items-center gap-1.5 text-rose-700 bg-rose-50 border border-rose-200/80 px-2.5 py-1 rounded-md">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>حقول أساسية متبقية: {metrics.missingRequired.join(' · ')}</span>
              </div>
            )}
            {metrics.missingRecommended.length > 0 && (
              <div className="flex items-center gap-1.5 text-amber-800 bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-md">
                <Info className="w-3.5 h-3.5 shrink-0" />
                <span>ينصح بإضافة: {metrics.missingRecommended.join(' · ')}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Tab Navigation */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto text-xs sm:text-sm font-semibold">
        <button
          onClick={() => setActiveTab('personal')}
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'personal'
              ? 'border-emerald-700 text-emerald-800 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <User className="w-4 h-4" />
          <span>البيانات الشخصية والهدف المهني</span>
        </button>
        <button
          onClick={() => setActiveTab('education')}
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'education'
              ? 'border-emerald-700 text-emerald-800 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>التعليم والخبرة العملية</span>
        </button>
        <button
          onClick={() => setActiveTab('skills')}
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'skills'
              ? 'border-emerald-700 text-emerald-800 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>المهارات واللغات</span>
        </button>
        <button
          onClick={() => setActiveTab('preferences')}
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'preferences'
              ? 'border-emerald-700 text-emerald-800 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>تفضيلات العمل ونمط الدوام</span>
        </button>
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: PERSONAL & CAREER TARGET */}
      {/* ==================================================================== */}
      {activeTab === 'personal' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 border-r-3 border-emerald-700 pr-3">
              أ. المعلومات الشخصية
            </h2>
            <p className="text-xs text-slate-500 mt-1">الاسم ونطاق الإقامة الجغرافية الحالي</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                الاسم الكامل <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={profile.fullName}
                onChange={(e) => updateField('fullName', e.target.value)}
                placeholder="مثال: محمد بن عبدالله القحطاني"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                الدولة <span className="text-rose-500">*</span>
              </label>
              <select
                value={profile.country}
                onChange={(e) => handleCountryChange(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              >
                {GCC_COUNTRIES.map((c) => (
                  <option key={c.code} value={c.nameAr}>
                    {c.flagEmoji} {c.nameAr}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                المنطقة / الإمارة / المحافظة
              </label>
              <select
                value={profile.region || ''}
                onChange={(e) => handleRegionChange(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              >
                <option value="">-- اختر المنطقة --</option>
                {availableRegions.map((r) => (
                  <option key={r.id} value={r.nameAr}>
                    {r.nameAr}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                المدينة
              </label>
              <select
                value={profile.city || ''}
                onChange={(e) => updateField('city', e.target.value || null)}
                disabled={!profile.region}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white disabled:opacity-50"
              >
                <option value="">-- اختر المدينة --</option>
                {availableCities.map((city) => (
                  <option key={city.id} value={city.nameAr}>
                    {city.nameAr}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <h2 className="text-base font-bold text-slate-900 border-r-3 border-emerald-700 pr-3">
              ب. الهدف المهني والتخصص
            </h2>
            <p className="text-xs text-slate-500 mt-1">المسمى الوظيفي المستهدف والمجالات التي ترغب بالعمل فيها</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                المسمى الوظيفي المستهدف <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={profile.targetJobTitle}
                onChange={(e) => updateField('targetJobTitle', e.target.value)}
                placeholder="مثال: مطور ويب، مهندس مدني، مدير مشاريع، محاسب قانوني"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                التخصص المهني الرئيسي (تصنيف عام)
              </label>
              <input
                type="text"
                value={profile.specialties.join('، ')}
                onChange={(e) => {
                  const arr = e.target.value
                    .split(/[،,]/)
                    .map((s) => s.trim())
                    .filter(Boolean);
                  updateField('specialties', arr);
                }}
                placeholder="مثال: تقنية المعلومات، الهندسة، المالية"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                افصل بين التخصصات بفاصلة (،)
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                تخصصات فرعية أو موازية
              </label>
              <input
                type="text"
                value={profile.secondarySpecialties.join('، ')}
                onChange={(e) => {
                  const arr = e.target.value
                    .split(/[،,]/)
                    .map((s) => s.trim())
                    .filter(Boolean);
                  updateField('secondarySpecialties', arr);
                }}
                placeholder="مثال: علم البيانات، إدارة أمن المعلومات"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: EDUCATION & EXPERIENCE */}
      {/* ==================================================================== */}
      {activeTab === 'education' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 border-r-3 border-emerald-700 pr-3">
              ج. المؤهل العلمي والتعليم
            </h2>
            <p className="text-xs text-slate-500 mt-1">أعلى مستوى تعليمي حاصل عليه والتخصص الأكاديمي</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                المستوى التعليمي
              </label>
              <select
                value={profile.educationLevel || ''}
                onChange={(e) =>
                  updateField(
                    'educationLevel',
                    (e.target.value as EducationLevel) || null
                  )
                }
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              >
                <option value="">-- غير محدد --</option>
                {EDUCATION_LEVELS.map((ed) => (
                  <option key={ed.id} value={ed.id}>
                    {ed.labelAr}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                مجال الدراسة / التخصص
              </label>
              <input
                type="text"
                value={profile.fieldOfStudy || ''}
                onChange={(e) => updateField('fieldOfStudy', e.target.value || null)}
                placeholder="مثال: علوم الحاسب، هندسة كهربائية، إدارة أعمال"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                الجامعة أو المؤسسة التعليمية
              </label>
              <input
                type="text"
                value={profile.institution || ''}
                onChange={(e) => updateField('institution', e.target.value || null)}
                placeholder="مثال: جامعة الملك فهد للبترول والمعادن"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                سنة التخرج (اختياري)
              </label>
              <input
                type="number"
                min="1970"
                max="2035"
                value={profile.graduationYear || ''}
                onChange={(e) =>
                  updateField(
                    'graduationYear',
                    e.target.value ? parseInt(e.target.value, 10) : null
                  )
                }
                placeholder="مثال: 2021"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <h2 className="text-base font-bold text-slate-900 border-r-3 border-emerald-700 pr-3">
              د. الخبرة المهنية
            </h2>
            <p className="text-xs text-slate-500 mt-1">تحديد سنوات الخبرة والمسمى الأخير وملخص الخبرات</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                إجمالي سنوات الخبرة <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                max="50"
                value={profile.yearsOfExperience ?? ''}
                onChange={(e) =>
                  updateField(
                    'yearsOfExperience',
                    e.target.value === '' ? null : Math.max(0, parseInt(e.target.value, 10))
                  )
                }
                placeholder="مثال: 0 لحديثي التخرج، 3، 5"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                أدخل 0 إذا كنت خريجاً جديداً بدون خبرة عملية سابقة.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                المسمى الوظيفي الحالي أو الأخير
              </label>
              <input
                type="text"
                value={profile.currentJobTitle || ''}
                onChange={(e) => updateField('currentJobTitle', e.target.value || null)}
                placeholder="مثال: مطور برمجيات، محاسب عام، أخصائي تسويق"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                نبذة موجزة عن الخبرة العملية السابقة
              </label>
              <textarea
                rows={3}
                value={profile.experienceSummary || ''}
                onChange={(e) => updateField('experienceSummary', e.target.value || null)}
                placeholder="اكتب فقرة موجزة توضح أهم المشاريع والمسؤوليات التي قمت بها في مسيرتك المهنية..."
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white leading-relaxed"
              />
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: SKILLS & LANGUAGES */}
      {/* ==================================================================== */}
      {activeTab === 'skills' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 border-r-3 border-emerald-700 pr-3">
              هـ. المهارات المهنية (قيم مهيكلة)
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              يتم تخزين المهارات كعناصر مهيكلة ومفردة لتسهيل مطابقتها الدقيقة مع متطلبات الوظائف
            </p>
          </div>

          {/* Technical Skills */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              المهارات التقنية والبرمجية (Technical Skills) <span className="text-rose-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={techInput}
                onChange={(e) => setTechInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag('technicalSkills', techInput, setTechInput);
                  }
                }}
                placeholder="اكتب المهارة واضغط إضافة (مثل: React, Python, SQL, Excel)"
                className="flex-1 px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
              <button
                type="button"
                onClick={() => addTag('technicalSkills', techInput, setTechInput)}
                className="px-4 py-2 text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg cursor-pointer"
              >
                إضافة
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {profile.technicalSkills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium rounded-md"
                >
                  <span>{skill}</span>
                  <button
                    type="button"
                    onClick={() => removeTag('technicalSkills', skill)}
                    className="hover:text-rose-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
              {profile.technicalSkills.length === 0 && (
                <span className="text-xs text-slate-400 italic">
                  لم يتم إضافة مهارات تقنية بعد. أضف مهاراتك لمقارنتها آلياً مع الوظائف.
                </span>
              )}
            </div>
          </div>

          {/* Soft Skills */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-700">
              المهارات الشخصية والقيادية (Soft Skills)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={softInput}
                onChange={(e) => setSoftInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag('softSkills', softInput, setSoftInput);
                  }
                }}
                placeholder="اكتب المهارة (مثل: التواصل، إدارة الوقت، حل المشكلات)"
                className="flex-1 px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
              <button
                type="button"
                onClick={() => addTag('softSkills', softInput, setSoftInput)}
                className="px-4 py-2 text-xs font-semibold bg-slate-700 hover:bg-slate-800 text-white rounded-lg cursor-pointer"
              >
                إضافة
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {profile.softSkills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 border border-slate-200 text-slate-800 text-xs font-medium rounded-md"
                >
                  <span>{skill}</span>
                  <button
                    type="button"
                    onClick={() => removeTag('softSkills', skill)}
                    className="hover:text-rose-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Industry Skills */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-700">
              المهارات القطاعية والتخصصية (Industry-specific Skills)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={industryInput}
                onChange={(e) => setIndustryInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag('industrySkills', industryInput, setIndustryInput);
                  }
                }}
                placeholder="اكتب المهارة القطاعية (مثل: التكنولوجيا المالية FinTech، التجارة الإلكترونية، الرعاية الصحية)"
                className="flex-1 px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
              <button
                type="button"
                onClick={() => addTag('industrySkills', industryInput, setIndustryInput)}
                className="px-4 py-2 text-xs font-semibold bg-slate-700 hover:bg-slate-800 text-white rounded-lg cursor-pointer"
              >
                إضافة
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {profile.industrySkills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-cyan-50 border border-cyan-200 text-cyan-800 text-xs font-medium rounded-md"
                >
                  <span>{skill}</span>
                  <button
                    type="button"
                    onClick={() => removeTag('industrySkills', skill)}
                    className="hover:text-rose-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Languages Section */}
          <div className="pt-4 border-t border-slate-100 space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 border-r-3 border-emerald-700 pr-3">
                و. اللغات ومستوى الإتقان
              </h2>
              <p className="text-xs text-slate-500 mt-1">تحديد اللغات ومستواك في كل لغة</p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col sm:flex-row items-center gap-3">
              <input
                type="text"
                value={newLangName}
                onChange={(e) => setNewLangName(e.target.value)}
                placeholder="اسم اللغة (مثال: العربية، الإنجليزية، الفرنسية)"
                className="flex-1 w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg"
              />

              <select
                value={newLangLevel}
                onChange={(e) => setNewLangLevel(e.target.value as LanguageLevel)}
                className="w-full sm:w-56 px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg"
              >
                {LANGUAGE_LEVELS.map((lvl) => (
                  <option key={lvl.id} value={lvl.id}>
                    {lvl.labelAr}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={addLanguage}
                className="w-full sm:w-auto px-4 py-2 text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg cursor-pointer whitespace-nowrap"
              >
                إضافة لغة
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {profile.languages.map((l) => (
                <div
                  key={l.language}
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-white"
                >
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">{l.language}</h4>
                    <span className="text-xs text-emerald-700 font-medium">
                      {LANGUAGE_LEVELS.find((lvl) => lvl.id === l.level)?.labelAr || l.level}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeLanguage(l.language)}
                    className="text-slate-400 hover:text-rose-600 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 4: WORK PREFERENCES */}
      {/* ==================================================================== */}
      {activeTab === 'preferences' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 border-r-3 border-emerald-700 pr-3">
              ز. تفضيلات العمل ونمط الدوام
            </h2>
            <p className="text-xs text-slate-500 mt-1">تحديد بيئات العمل والدول والمدن المفضلة لديك</p>
          </div>

          {/* Remote Preference Radio */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-slate-800">
              تفضيل العمل عن بُعد (Remote Preference)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {REMOTE_PREFERENCES.map((pref) => {
                const isSelected = profile.remotePreference === pref.id;
                return (
                  <div
                    key={pref.id}
                    onClick={() => updateField('remotePreference', pref.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/50 shadow-2xs'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-600 text-white'
                            : 'border-slate-400'
                        }`}
                      >
                        {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                      </div>
                      <span className="text-sm font-bold text-slate-900">{pref.labelAr}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 pr-6 leading-relaxed">
                      {pref.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Preferred Work Modes */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-800">
              أنماط العمل المقبولة (اختر نمطاً أو أكثر)
            </label>
            <div className="flex flex-wrap gap-2">
              {WORK_MODES.map((wm) => {
                const isSelected = profile.preferredWorkModes.includes(wm.id);
                return (
                  <button
                    key={wm.id}
                    type="button"
                    onClick={() => {
                      const updated = isSelected
                        ? profile.preferredWorkModes.filter((m) => m !== wm.id)
                        : [...profile.preferredWorkModes, wm.id];
                      updateField('preferredWorkModes', updated);
                    }}
                    className={`px-3.5 py-2 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {wm.labelAr}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preferred Employment Types */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-800">
              أنواع العقود والتوظيف المقبولة
            </label>
            <div className="flex flex-wrap gap-2">
              {EMPLOYMENT_TYPES.map((et) => {
                const isSelected = profile.preferredEmploymentTypes.includes(et.id);
                return (
                  <button
                    key={et.id}
                    type="button"
                    onClick={() => {
                      const updated = isSelected
                        ? profile.preferredEmploymentTypes.filter((t) => t !== et.id)
                        : [...profile.preferredEmploymentTypes, et.id];
                      updateField('preferredEmploymentTypes', updated);
                    }}
                    className={`px-3.5 py-2 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {et.labelAr}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preferred GCC Countries */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-800">
              دول الخليج المفضلة للعمل
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {GCC_COUNTRIES.map((c) => {
                const isSelected = profile.preferredCountries.includes(c.nameAr);
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => {
                      const updated = isSelected
                        ? profile.preferredCountries.filter((cnt) => cnt !== c.nameAr)
                        : [...profile.preferredCountries, c.nameAr];
                      updateField('preferredCountries', updated);
                    }}
                    className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs font-semibold transition-colors text-right cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-base">{c.flagEmoji}</span>
                    <span className="truncate">{c.commonNameAr}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Actions Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
        <button
          onClick={handleReset}
          className="text-xs text-slate-500 hover:text-rose-600 inline-flex items-center gap-1 cursor-pointer order-2 sm:order-1"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>مسح كافة بيانات الملف</span>
        </button>

        <div className="flex items-center gap-3 w-full sm:w-auto order-1 sm:order-2">
          {onExploreJobs && (
            <button
              onClick={onExploreJobs}
              className="flex-1 sm:flex-initial px-4 py-2.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              العودة لتصفح الوظائف
            </button>
          )}

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white transition-colors shadow-xs cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'جاري الحفظ...' : 'حفظ التعديلات'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
