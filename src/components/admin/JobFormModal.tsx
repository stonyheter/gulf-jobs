/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ============================================================================
 * JOB CREATION & EDITING FORM (7 LOGICAL SECTIONS)
 * ============================================================================
 * Meets all Phase 2 requirements with:
 * A. Basic information
 * B. Location (Strict cascading hierarchy: Country → Region → City → District)
 * C. Employment & Compensation
 * D. Job content (Description, Responsibilities, Requirements, Skills, Languages, Benefits)
 * E. Application & Sources
 * F. Dates (Posted, Valid through)
 * G. Status
 * 
 * Validates in real-time with clear Arabic error and warning messages.
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  AlertCircle,
  CheckCircle2,
  Plus,
  Trash2,
  Building2,
  MapPin,
  Briefcase,
  FileText,
  Link as LinkIcon,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { Job, JobStatus, WorkMode, EmploymentType, ApplicationMethod } from '../../types/job';
import { GCC_COUNTRIES } from '../../data/geoHierarchy';
import { CountryNode, RegionNode, CityNode } from '../../types/geo';
import { FEATURED_CATEGORIES } from '../../config/categories';
import { validateJob, JobValidationResult } from '../../services/jobValidationService';

interface JobFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (jobData: Omit<Job, 'id' | 'createdAt' | 'updatedAt'>, id?: string) => Promise<void>;
  initialJob?: Job | null;
}

export const JobFormModal: React.FC<JobFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialJob,
}) => {
  const isEditing = Boolean(initialJob);

  // Form State
  const [title, setTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyLogo, setCompanyLogo] = useState('');
  const [category, setCategory] = useState('tech');

  // Location State
  const [country, setCountry] = useState('المملكة العربية السعودية');
  const [region, setRegion] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [address, setAddress] = useState('');
  const [workMode, setWorkMode] = useState<WorkMode>('on_site');

  // Employment State
  const [employmentType, setEmploymentType] = useState<EmploymentType>('full_time');
  const [experienceMin, setExperienceMin] = useState<number | ''>(0);
  const [experienceMax, setExperienceMax] = useState<number | ''>('');
  const [education, setEducation] = useState('بكالوريوس');
  const [salaryMin, setSalaryMin] = useState<number | ''>('');
  const [salaryMax, setSalaryMax] = useState<number | ''>('');
  const [salaryCurrency, setSalaryCurrency] = useState('SAR');

  // Job Content State
  const [description, setDescription] = useState('');
  const [responsibilities, setResponsibilities] = useState<string[]>(['']);
  const [requirements, setRequirements] = useState<string[]>(['']);
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [languages, setLanguages] = useState<string[]>(['العربية', 'الإنجليزية']);
  const [benefits, setBenefits] = useState<string[]>([]);
  const [newBenefitInput, setNewBenefitInput] = useState('');

  // Application & Source State
  const [applicationMethod, setApplicationMethod] = useState<ApplicationMethod>('external_url');
  const [applicationUrl, setApplicationUrl] = useState('');
  const [sourceName, setSourceName] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [originalJobUrl, setOriginalJobUrl] = useState('');

  // Dates State
  const [datePosted, setDatePosted] = useState('');
  const [validThrough, setValidThrough] = useState('');

  // Status State
  const [status, setStatus] = useState<JobStatus>('published');

  // Submission & Validation
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationResult, setValidationResult] = useState<JobValidationResult | null>(null);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  // Sync state when editing or resetting
  useEffect(() => {
    if (initialJob) {
      setTitle(initialJob.title || '');
      setCompanyName(initialJob.companyName || '');
      setCompanyLogo(initialJob.companyLogo || '');
      setCategory(initialJob.category || 'tech');
      setCountry(initialJob.country || 'المملكة العربية السعودية');
      setRegion(initialJob.region || '');
      setCity(initialJob.city || '');
      setDistrict(initialJob.district || '');
      setAddress(initialJob.address || '');
      setWorkMode(initialJob.workMode || 'on_site');
      setEmploymentType(initialJob.employmentType || 'full_time');
      setExperienceMin(initialJob.experienceMin ?? '');
      setExperienceMax(initialJob.experienceMax ?? '');
      setEducation(initialJob.education || 'بكالوريوس');
      setSalaryMin(initialJob.salaryMin ?? '');
      setSalaryMax(initialJob.salaryMax ?? '');
      setSalaryCurrency(initialJob.salaryCurrency || 'SAR');
      setDescription(initialJob.description || '');
      setResponsibilities(
        initialJob.responsibilities && initialJob.responsibilities.length > 0
          ? [...initialJob.responsibilities]
          : ['']
      );
      setRequirements(
        initialJob.requirements && initialJob.requirements.length > 0
          ? [...initialJob.requirements]
          : ['']
      );
      setSkills(initialJob.skills ? [...initialJob.skills] : []);
      setLanguages(
        initialJob.languages && initialJob.languages.length > 0
          ? [...initialJob.languages]
          : ['العربية', 'الإنجليزية']
      );
      setBenefits(initialJob.benefits ? [...initialJob.benefits] : []);
      setApplicationMethod(initialJob.applicationMethod || 'external_url');
      setApplicationUrl(initialJob.applicationUrl || '');
      setSourceName(initialJob.sourceName || '');
      setSourceUrl(initialJob.sourceUrl || '');
      setOriginalJobUrl(initialJob.originalJobUrl || '');

      setDatePosted(
        initialJob.datePosted
          ? initialJob.datePosted.slice(0, 10)
          : new Date().toISOString().slice(0, 10)
      );
      setValidThrough(
        initialJob.validThrough ? initialJob.validThrough.slice(0, 10) : ''
      );
      setStatus(initialJob.status || 'published');
    } else {
      // Default new job values
      setTitle('');
      setCompanyName('');
      setCompanyLogo('');
      setCategory('tech');
      setCountry('المملكة العربية السعودية');
      setRegion('المنطقة الشرقية');
      setCity('الدمام');
      setDistrict('');
      setAddress('');
      setWorkMode('on_site');
      setEmploymentType('full_time');
      setExperienceMin(2);
      setExperienceMax(5);
      setEducation('بكالوريوس');
      setSalaryMin(12000);
      setSalaryMax(18000);
      setSalaryCurrency('SAR');
      setDescription('');
      setResponsibilities(['']);
      setRequirements(['']);
      setSkills([]);
      setLanguages(['العربية', 'الإنجليزية']);
      setBenefits(['تأمين طبي شامل', 'بدل سكن ومواصلات']);
      setApplicationMethod('external_url');
      setApplicationUrl('');
      setSourceName('إدخال مباشر من إدارة المنصة');
      setSourceUrl('');
      setOriginalJobUrl('');
      setDatePosted(new Date().toISOString().slice(0, 10));

      const thirtyDays = new Date();
      thirtyDays.setDate(thirtyDays.getDate() + 30);
      setValidThrough(thirtyDays.toISOString().slice(0, 10));
      setStatus('published');
    }
    setAttemptedSubmit(false);
    setValidationResult(null);
  }, [initialJob, isOpen]);

  // Hierarchical Location Dropdown Logic
  const selectedCountryObj: CountryNode | undefined = GCC_COUNTRIES.find(
    (c) => c.commonNameAr === country || c.nameAr === country || c.code === country
  );
  const availableRegions: RegionNode[] = selectedCountryObj ? selectedCountryObj.regions : [];

  const selectedRegionObj: RegionNode | undefined = availableRegions.find(
    (r) => r.nameAr === region || r.id === region
  );
  const availableCities: CityNode[] = selectedRegionObj ? selectedRegionObj.cities : [];

  const selectedCityObj: CityNode | undefined = availableCities.find(
    (c) => c.nameAr === city || c.id === city
  );
  const availableDistricts: string[] = selectedCityObj?.districts || [];

  // Update currency default when country changes
  const handleCountryChange = (cName: string) => {
    setCountry(cName);
    const cObj = GCC_COUNTRIES.find((c) => c.commonNameAr === cName || c.nameAr === cName);
    if (cObj) {
      setSalaryCurrency(cObj.currency);
      if (cObj.regions.length > 0) {
        setRegion(cObj.regions[0].nameAr);
        if (cObj.regions[0].cities.length > 0) {
          setCity(cObj.regions[0].cities[0].nameAr);
          setDistrict('');
        } else {
          setCity('');
          setDistrict('');
        }
      } else {
        setRegion('');
        setCity('');
        setDistrict('');
      }
    }
  };

  const handleRegionChange = (rName: string) => {
    setRegion(rName);
    const rObj = availableRegions.find((r) => r.nameAr === rName);
    if (rObj && rObj.cities.length > 0) {
      setCity(rObj.cities[0].nameAr);
      setDistrict('');
    } else {
      setCity('');
      setDistrict('');
    }
  };

  const handleCityChange = (cityName: string) => {
    setCity(cityName);
    setDistrict('');
  };

  // Build candidate job object for validation
  const buildCandidateJob = (targetStatus: JobStatus): Omit<Job, 'id' | 'createdAt' | 'updatedAt'> => {
    const cleanResponsibilities = responsibilities.map((s) => s.trim()).filter(Boolean);
    const cleanRequirements = requirements.map((s) => s.trim()).filter(Boolean);

    return {
      title: title.trim(),
      companyName: companyName.trim(),
      companyLogo: companyLogo.trim() || null,
      category: category || null,
      country,
      region: workMode === 'remote' ? null : region || null,
      city: workMode === 'remote' ? 'عن بُعد' : city,
      district: district.trim() || null,
      address: address.trim() || null,
      workMode,
      employmentType,
      experienceMin: experienceMin === '' ? null : Number(experienceMin),
      experienceMax: experienceMax === '' ? null : Number(experienceMax),
      education: education || null,
      salaryMin: salaryMin === '' ? null : Number(salaryMin),
      salaryMax: salaryMax === '' ? null : Number(salaryMax),
      salaryCurrency: salaryCurrency || 'SAR',
      description: description.trim(),
      responsibilities: cleanResponsibilities,
      requirements: cleanRequirements,
      skills,
      languages,
      benefits,
      applicationMethod,
      applicationUrl: applicationUrl.trim() || null,
      sourceName: sourceName.trim() || null,
      sourceUrl: sourceUrl.trim() || null,
      originalJobUrl: originalJobUrl.trim() || null,
      datePosted: datePosted ? new Date(datePosted).toISOString() : new Date().toISOString(),
      validThrough: validThrough ? new Date(validThrough).toISOString() : null,
      status: targetStatus,
      importedAt: initialJob?.importedAt ?? null,
      lastCheckedAt: new Date().toISOString(),
    };
  };

  const handleSubmit = async (targetStatus: JobStatus) => {
    setAttemptedSubmit(true);
    const candidate = buildCandidateJob(targetStatus);
    const validation = validateJob(candidate, targetStatus);
    setValidationResult(validation);

    if (targetStatus === 'published' && !validation.canPublish) {
      return;
    }
    if (targetStatus !== 'published' && !validation.isValid) {
      return;
    }

    try {
      setIsSubmitting(true);
      await onSave(candidate, initialJob?.id);
      onClose();
    } catch (err: any) {
      alert(`حدث خطأ أثناء الحفظ: ${err?.message || 'يرجى المحاولة مجدداً'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper arrays methods
  const addResponsibility = () => setResponsibilities([...responsibilities, '']);
  const updateResponsibility = (index: number, val: string) => {
    const updated = [...responsibilities];
    updated[index] = val;
    setResponsibilities(updated);
  };
  const removeResponsibility = (index: number) => {
    if (responsibilities.length > 1) {
      setResponsibilities(responsibilities.filter((_, i) => i !== index));
    }
  };

  const addRequirement = () => setRequirements([...requirements, '']);
  const updateRequirement = (index: number, val: string) => {
    const updated = [...requirements];
    updated[index] = val;
    setRequirements(updated);
  };
  const removeRequirement = (index: number) => {
    if (requirements.length > 1) {
      setRequirements(requirements.filter((_, i) => i !== index));
    }
  };

  const addSkill = () => {
    const s = newSkillInput.trim();
    if (s && !skills.includes(s)) {
      setSkills([...skills, s]);
      setNewSkillInput('');
    }
  };

  const removeSkill = (s: string) => {
    setSkills(skills.filter((item) => item !== s));
  };

  const addBenefit = () => {
    const b = newBenefitInput.trim();
    if (b && !benefits.includes(b)) {
      setBenefits([...benefits, b]);
      setNewBenefitInput('');
    }
  };

  const removeBenefit = (b: string) => {
    setBenefits(benefits.filter((item) => item !== b));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 text-right">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              {isEditing ? 'تعديل بيانات الوظيفة' : 'إضافة وظيفة جديدة'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              نموذج إدارة الوظائف المتكامل (المرحلة الثانية — متوافق مع كافة معايير الجودة والتحقق)
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Validation Errors Top Alert */}
        {attemptedSubmit && validationResult && validationResult.errors.length > 0 && (
          <div className="px-6 py-3 bg-red-50 border-b border-red-200 text-red-900 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-red-800">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>يرجى تصحيح الأخطاء التالية قبل الاستمرار:</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 pr-5 text-red-700">
              {validationResult.errors.map((err, i) => (
                <li key={i}>{err.messageAr}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 text-sm">
          {/* ========================================================================= */}
          {/* SECTION A: Basic Information */}
          {/* ========================================================================= */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-slate-900 font-bold">
              <Building2 className="w-4 h-4 text-emerald-700" />
              <h3>أ. المعلومات الأساسية (Basic Information)</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  المسمى الوظيفي <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: مهندس برمجيات أول، أخصائي سلامة صناعية"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-600 rounded-xl text-sm outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  اسم المنشأة / الشركة <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="مثال: الشركة الخليجية للتقنية المتقدمة"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-600 rounded-xl text-sm outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  التصنيف المهني (Category)
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-600 rounded-xl text-sm outline-none transition-all cursor-pointer"
                >
                  {FEATURED_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nameAr} ({cat.nameEn})
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  رابط شعار الشركة (Company Logo URL - اختياري)
                </label>
                <input
                  type="url"
                  value={companyLogo}
                  onChange={(e) => setCompanyLogo(e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-600 rounded-xl text-sm outline-none transition-all text-left"
                  dir="ltr"
                />
              </div>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* SECTION B: Location (Hierarchical Cascading Selectors) */}
          {/* ========================================================================= */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-slate-900 font-bold">
              <MapPin className="w-4 h-4 text-emerald-700" />
              <h3>ب. الموقع الجغرافي ونمط العمل (Location & Work Mode)</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  الدولة <span className="text-red-500">*</span>
                </label>
                <select
                  value={country}
                  onChange={(e) => handleCountryChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-600 rounded-xl text-sm outline-none transition-all cursor-pointer"
                >
                  {GCC_COUNTRIES.map((c) => (
                    <option key={c.code} value={c.commonNameAr}>
                      {c.flagEmoji} {c.commonNameAr}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  المنطقة / الإمارة / المحافظة <span className="text-red-500">*</span>
                </label>
                <select
                  value={region}
                  disabled={workMode === 'remote' || availableRegions.length === 0}
                  onChange={(e) => handleRegionChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-600 rounded-xl text-sm outline-none transition-all cursor-pointer disabled:opacity-50"
                >
                  {availableRegions.map((r) => (
                    <option key={r.id} value={r.nameAr}>
                      {r.nameAr}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  المدينة <span className="text-red-500">*</span>
                </label>
                <select
                  value={city}
                  disabled={workMode === 'remote' || availableCities.length === 0}
                  onChange={(e) => handleCityChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-600 rounded-xl text-sm outline-none transition-all cursor-pointer disabled:opacity-50"
                >
                  {availableCities.map((c) => (
                    <option key={c.id} value={c.nameAr}>
                      {c.nameAr}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  الحي (District - اختياري)
                </label>
                {availableDistricts.length > 0 ? (
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-600 rounded-xl text-sm outline-none transition-all cursor-pointer"
                  >
                    <option value="">غير محدد</option>
                    {availableDistricts.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="مثال: حي الشاطئ"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-600 rounded-xl text-sm outline-none transition-all"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  طبيعة ومكان العمل (Work Mode) <span className="text-red-500">*</span>
                </label>
                <select
                  value={workMode}
                  onChange={(e) => setWorkMode(e.target.value as WorkMode)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-600 rounded-xl text-sm outline-none transition-all cursor-pointer font-medium"
                >
                  <option value="on_site">حضوري بالمنشأة (On-site)</option>
                  <option value="remote">عن بُعد بالكامل (Remote)</option>
                  <option value="hybrid">عمل هجين (Hybrid)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  العنوان التفصيلي (اختياري)
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="مثال: طريق الملك فهد، برج الابتكار"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-600 rounded-xl text-sm outline-none transition-all"
                />
              </div>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* SECTION C: Employment & Compensation */}
          {/* ========================================================================= */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-slate-900 font-bold">
              <Briefcase className="w-4 h-4 text-emerald-700" />
              <h3>ج. التوظيف والخبرة والراتب (Employment & Compensation)</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  نوع العقد والدوام
                </label>
                <select
                  value={employmentType}
                  onChange={(e) => setEmploymentType(e.target.value as EmploymentType)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-600 rounded-xl text-sm outline-none transition-all cursor-pointer"
                >
                  <option value="full_time">دوام كامل</option>
                  <option value="part_time">دوام جزئي</option>
                  <option value="contract">عقد محدد المدة</option>
                  <option value="temporary">مؤقت</option>
                  <option value="internship">تدريب تعاوني / خريج</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  الحد الأدنى للخبرة (سنوات)
                </label>
                <input
                  type="number"
                  min="0"
                  max="40"
                  value={experienceMin}
                  onChange={(e) =>
                    setExperienceMin(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  placeholder="0 لخريج جديد"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-600 rounded-xl text-sm outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  الحد الأقصى للخبرة (اختياري)
                </label>
                <input
                  type="number"
                  min="0"
                  max="40"
                  value={experienceMax}
                  onChange={(e) =>
                    setExperienceMax(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  placeholder="اتركه فارغاً إذا كان غير محدد"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-600 rounded-xl text-sm outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  المؤهل الأكاديمي
                </label>
                <select
                  value={education}
                  onChange={(e) => setEducation(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-600 rounded-xl text-sm outline-none transition-all cursor-pointer"
                >
                  <option value="ثانوية عامة">ثانوية عامة</option>
                  <option value="دبلوم">دبلوم متوسط / فني</option>
                  <option value="بكالوريوس">بكالوريوس</option>
                  <option value="ماجستير">ماجستير</option>
                  <option value="دكتوراه">دكتوراه</option>
                  <option value="غير محدد">غير محدد</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  الحد الأدنى للراتب (شهرياً)
                </label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={salaryMin}
                  onChange={(e) =>
                    setSalaryMin(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  placeholder="غير معلن إذا تُرِك فارغاً"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-600 rounded-xl text-sm outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  الحد الأقصى للراتب (شهرياً)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={salaryMax}
                    onChange={(e) =>
                      setSalaryMax(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    placeholder="الحد الأعلى"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-600 rounded-xl text-sm outline-none transition-all"
                  />
                  <select
                    value={salaryCurrency}
                    onChange={(e) => setSalaryCurrency(e.target.value)}
                    className="w-24 px-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  >
                    <option value="SAR">SAR (ر.س)</option>
                    <option value="AED">AED (د.إ)</option>
                    <option value="QAR">QAR (ر.ق)</option>
                    <option value="KWD">KWD (د.ك)</option>
                    <option value="BHD">BHD (د.ب)</option>
                    <option value="OMR">OMR (ر.ع)</option>
                    <option value="USD">USD ($)</option>
                  </select>
                </div>
              </div>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* SECTION D: Job Content */}
          {/* ========================================================================= */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-slate-900 font-bold">
              <FileText className="w-4 h-4 text-emerald-700" />
              <h3>د. تفاصيل ومحتوى الإعلان (Job Content)</h3>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                نبذة عن الوظيفة (Description) <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="اكتب نبذة واضحة ومباشرة عن طبيعة الدور والمهام العامة..."
                className="w-full p-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-600 rounded-xl text-sm outline-none transition-all leading-relaxed"
              />
            </div>

            {/* Responsibilities list */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  المسؤوليات والمهام (Responsibilities)
                </label>
                <button
                  type="button"
                  onClick={addResponsibility}
                  className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>إضافة مهمة</span>
                </button>
              </div>
              <div className="space-y-2">
                {responsibilities.map((resp, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={resp}
                      onChange={(e) => updateResponsibility(idx, e.target.value)}
                      placeholder={`المهمة ${idx + 1}...`}
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-600 rounded-lg text-xs outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => removeResponsibility(idx)}
                      disabled={responsibilities.length <= 1}
                      className="p-2 text-slate-400 hover:text-red-600 disabled:opacity-30 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Requirements list */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  المتطلبات والشروط (Requirements)
                </label>
                <button
                  type="button"
                  onClick={addRequirement}
                  className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>إضافة متطلب</span>
                </button>
              </div>
              <div className="space-y-2">
                {requirements.map((req, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={req}
                      onChange={(e) => updateRequirement(idx, e.target.value)}
                      placeholder={`المتطلب ${idx + 1}...`}
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-600 rounded-lg text-xs outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => removeRequirement(idx)}
                      disabled={requirements.length <= 1}
                      className="p-2 text-slate-400 hover:text-red-600 disabled:opacity-30 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Skills Tags */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                المهارات المطلوبة (Skills)
              </label>
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  value={newSkillInput}
                  onChange={(e) => setNewSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addSkill();
                    }
                  }}
                  placeholder="أدخل مهارة واضغط إضافة..."
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none"
                />
                <button
                  type="button"
                  onClick={addSkill}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  إضافة
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {skills.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md text-xs font-medium"
                  >
                    <span>{s}</span>
                    <button
                      type="button"
                      onClick={() => removeSkill(s)}
                      className="hover:text-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Benefits Tags */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                المزايا والبدلات (Benefits)
              </label>
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  value={newBenefitInput}
                  onChange={(e) => setNewBenefitInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addBenefit();
                    }
                  }}
                  placeholder="أدخل ميزة (مثال: تأمين عائلي، تذاكر سنوية) واضغط إضافة..."
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none"
                />
                <button
                  type="button"
                  onClick={addBenefit}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  إضافة
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {benefits.map((b) => (
                  <span
                    key={b}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-800 border border-slate-200 rounded-md text-xs font-medium"
                  >
                    <span>{b}</span>
                    <button
                      type="button"
                      onClick={() => removeBenefit(b)}
                      className="hover:text-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* SECTION E: Application & Sources */}
          {/* ========================================================================= */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-slate-900 font-bold">
              <LinkIcon className="w-4 h-4 text-emerald-700" />
              <h3>هـ. التقديم ومصادر الإعلان (Application & Sources)</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  طريقة التقديم <span className="text-red-500">*</span>
                </label>
                <select
                  value={applicationMethod}
                  onChange={(e) => setApplicationMethod(e.target.value as ApplicationMethod)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-600 rounded-xl text-sm outline-none transition-all cursor-pointer font-medium"
                >
                  <option value="external_url">رابط خارجي (بوابة التوظيف الرسمية)</option>
                  <option value="email">بريد إلكتروني رسمي (Email)</option>
                  <option value="direct">تقديم مباشر في مقر المنشأة</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {applicationMethod === 'email'
                    ? 'البريد الإلكتروني للتقديم *'
                    : 'رابط التقديم (Application URL) *'}
                </label>
                <input
                  type={applicationMethod === 'email' ? 'email' : 'url'}
                  value={applicationUrl}
                  onChange={(e) => setApplicationUrl(e.target.value)}
                  placeholder={
                    applicationMethod === 'email'
                      ? 'careers@example.com'
                      : 'https://careers.example.com/apply'
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-600 rounded-xl text-sm outline-none transition-all text-left"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  اسم المصدر (Source Name - اختياري)
                </label>
                <input
                  type="text"
                  value={sourceName}
                  onChange={(e) => setSourceName(e.target.value)}
                  placeholder="مثال: لينكد إن، بوابة التوظيف الحكومية"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-600 rounded-xl text-sm outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  رابط المصدر (Source URL - اختياري)
                </label>
                <input
                  type="url"
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  placeholder="https://example.com/source"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-600 rounded-xl text-sm outline-none transition-all text-left"
                  dir="ltr"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  رابط الإعلان الأصلي (Original Job URL - اختياري لتوثيق التكرار)
                </label>
                <input
                  type="url"
                  value={originalJobUrl}
                  onChange={(e) => setOriginalJobUrl(e.target.value)}
                  placeholder="https://example.com/original-posting"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-600 rounded-xl text-sm outline-none transition-all text-left"
                  dir="ltr"
                />
              </div>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* SECTION F & G: Dates & Status */}
          {/* ========================================================================= */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-slate-900 font-bold">
              <Calendar className="w-4 h-4 text-emerald-700" />
              <h3>و. التواريخ وحالة الوظيفة (Dates & Status)</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  تاريخ النشر (Date Posted) <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={datePosted}
                  onChange={(e) => setDatePosted(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-600 rounded-xl text-sm outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  تاريخ انتهاء الصلاحية (Valid Through)
                </label>
                <input
                  type="date"
                  value={validThrough}
                  onChange={(e) => setValidThrough(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-600 rounded-xl text-sm outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  حالة الوظيفة (Job Status) <span className="text-red-500">*</span>
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as JobStatus)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-600 rounded-xl text-sm outline-none transition-all cursor-pointer font-bold"
                >
                  <option value="published">منشورة (Published)</option>
                  <option value="pending_review">بانتظار المراجعة (Pending Review)</option>
                  <option value="draft">مسودة (Draft)</option>
                  <option value="paused">متوقفة مؤقتاً (Paused)</option>
                  <option value="expired">منتهية الصلاحية (Expired)</option>
                  <option value="rejected">مرفوضة (Rejected)</option>
                  <option value="duplicate">مكررة (Duplicate)</option>
                </select>
              </div>
            </div>
          </section>
        </div>

        {/* Modal Actions Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            إلغاء التراجع
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmit('draft')}
              className="px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              حفظ كمسودة (Draft)
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmit('published')}
              className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-xl text-xs transition-colors shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isEditing ? 'حفظ ونشر التعديل' : 'نشر الوظيفة مباشرة'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
