/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  MapPin,
  Briefcase,
  GraduationCap,
  Clock,
  ExternalLink,
  Mail,
  ArrowRight,
  Share2,
  Bookmark,
  CheckCircle2,
  Calendar,
  Globe,
  Sparkles,
  AlertCircle,
  HelpCircle,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  ShieldCheck,
  Scale,
  Languages,
  Sliders,
  Layers,
  FileQuestion,
  FileUp,
  Send,
} from 'lucide-react';
import { Job } from '../../types/job';
import { JobSeekerProfile } from '../../types/profile';
import { CompatibilityResult } from '../../types/jobMatch';
import { User } from '../../types/auth';
import { Application } from '../../types/application';
import { applicationService } from '../../services/applicationService';
import { ApplyModal } from './ApplyModal';
import {
  formatLocation,
  formatFullLocation,
  getWorkModeLabel,
  getEmploymentTypeLabel,
  formatExperience,
  formatSalary,
} from '../../utils/formatters';
import { formatArabicRelativeDate, formatArabicFullDate } from '../../utils/date';
import { isJobExpiredByDate } from '../../services/jobValidationService';
import { profileService } from '../../services/profileService';
import { analyzeJobCompatibility } from '../../services/matchingService';
import { Breadcrumbs } from '../common/Breadcrumbs';
import { BreadcrumbItem } from '../../types/seo';
import { generateJobMetadata, getBaseUrl } from '../../utils/seoMetadataService';
import { generateJobPostingSchema } from '../../utils/structuredData';
import { applyPageMetadata, setStructuredData } from '../../utils/seoHeadService';
import { generateJobSlug, countryNameToSlug, cityNameToSlug, specialtyToSlug } from '../../utils/slugUtils';
import { JobCard } from './JobCard';

interface JobDetailsViewProps {
  job: Job;
  onBack: () => void;
  isAdminPreview?: boolean;
  onEditFromPreview?: (job: Job) => void;
  isSaved?: boolean;
  onToggleSave?: (jobId: string) => void;
  onOpenProfile?: () => void;
  allJobs?: Job[];
  onSelectJob?: (job: Job) => void;
  onNavigateUrl?: (url: string) => void;
  currentUser?: User | null;
  onOpenAuthModal?: () => void;
  onViewMyApplications?: () => void;
}

export const JobDetailsView: React.FC<JobDetailsViewProps> = ({
  job,
  onBack,
  isAdminPreview = false,
  onEditFromPreview,
  isSaved: isSavedProp = false,
  onToggleSave,
  onOpenProfile,
  allJobs = [],
  onSelectJob,
  onNavigateUrl,
  currentUser,
  onOpenAuthModal,
  onViewMyApplications,
}) => {
  const [internalSaved, setInternalSaved] = useState(isSavedProp);
  const [copySuccess, setCopySuccess] = useState(false);
  const [profile, setProfile] = useState<JobSeekerProfile | null>(null);
  const [compatibility, setCompatibility] = useState<CompatibilityResult | null>(null);
  const [showScoreExplanation, setShowScoreExplanation] = useState(false);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [userApplication, setUserApplication] = useState<Application | null>(null);

  // Sync saved state when prop changes
  useEffect(() => {
    setInternalSaved(isSavedProp);
  }, [isSavedProp]);

  // Check if current user has already submitted an application
  useEffect(() => {
    async function checkApplication() {
      if (currentUser) {
        try {
          const app = await applicationService.getUserApplicationForJob(currentUser, job.id);
          setUserApplication(app);
        } catch (e) {
          console.warn('Failed to check application status', e);
        }
      } else {
        setUserApplication(null);
      }
    }
    checkApplication();
  }, [currentUser, job.id]);

  // Load profile and compute compatibility
  useEffect(() => {
    async function loadProfile() {
      const p = await profileService.getProfile();
      setProfile(p);
      if (p) {
        const analysis = analyzeJobCompatibility(job, p);
        setCompatibility(analysis);
      } else {
        setCompatibility(null);
      }
    }
    loadProfile();
  }, [job]);

  const countrySlug = countryNameToSlug(job.country);
  const citySlug = cityNameToSlug(job.city);
  const specialtySlug = job.category ? specialtyToSlug(job.category) : '';
  const jobSlug = generateJobSlug(job, allJobs);

  // Sync Page SEO Metadata & Schema.org JobPosting
  useEffect(() => {
    if (!isAdminPreview) {
      const meta = generateJobMetadata(job, allJobs);
      applyPageMetadata(meta);

      const schema = generateJobPostingSchema(job, meta.canonicalUrl);
      setStructuredData(schema);
    }
    return () => {
      setStructuredData(null);
    };
  }, [job, isAdminPreview, allJobs]);

  // Construct Breadcrumbs
  const breadcrumbItems: BreadcrumbItem[] = useMemo(() => {
    const items: BreadcrumbItem[] = [
      { name: 'الرئيسية', url: '/' },
      { name: 'الوظائف', url: '/jobs' },
    ];
    if (job.country && countrySlug) {
      items.push({ name: job.country, url: `/jobs/${countrySlug}` });
    }
    if (job.city && countrySlug && citySlug) {
      items.push({ name: job.city, url: `/jobs/${countrySlug}/${citySlug}` });
    }
    items.push({ name: job.title, url: `/job/${jobSlug}`, isCurrent: true });
    return items;
  }, [job, countrySlug, citySlug, jobSlug]);

  // Related published jobs
  const relatedJobs = useMemo(() => {
    if (!allJobs || allJobs.length === 0) return [];
    return allJobs
      .filter(
        (j) =>
          j.id !== job.id &&
          j.status === 'published' &&
          (!j.validThrough || !isJobExpiredByDate(j.validThrough)) &&
          (j.city === job.city || (job.category && j.category === job.category))
      )
      .slice(0, 3);
  }, [allJobs, job]);

  const isExpired = job.status === 'expired' || isJobExpiredByDate(job.validThrough);

  const salaryInfo = formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency);
  const relativeDate = formatArabicRelativeDate(job.datePosted);
  const validUntilDate = formatArabicFullDate(job.validThrough);
  const workModeText = getWorkModeLabel(job.workMode);
  const employmentTypeText = getEmploymentTypeLabel(job.employmentType);
  const experienceText = formatExperience(job.experienceMin, job.experienceMax);
  const fullLocationText = formatFullLocation(job);
  const structuredBadgeLocation = formatLocation(job);

  const handleToggleSave = () => {
    setInternalSaved(!internalSaved);
    if (onToggleSave) {
      onToggleSave(job.id);
    }
  };

  const handleShare = async () => {
    const canonicalUrl = `${getBaseUrl()}/job/${jobSlug}`;
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(canonicalUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2500);
    }
  };

  const getApplicationCta = () => {
    if (isExpired) {
      return (
        <button
          disabled
          className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-7 py-3.5 rounded-lg bg-slate-200 text-slate-500 font-semibold text-sm cursor-not-allowed"
        >
          <Calendar className="w-4 h-4" />
          <span>انتهت فترة التقديم على هذه الوظيفة</span>
        </button>
      );
    }

    // If user has already submitted an application
    if (userApplication) {
      return (
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold shadow-2xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>تم تقديم طلبك بنجاح ({userApplication.status === 'pending' ? 'قيد المراجعة' : userApplication.status})</span>
          </div>
          {onViewMyApplications && (
            <button
              type="button"
              onClick={onViewMyApplications}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer shadow-2xs"
            >
              متابعة في طلباتي
            </button>
          )}
        </div>
      );
    }

    // Direct platform application with CV + external fallback
    return (
      <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
        <button
          type="button"
          onClick={() => {
            if (!currentUser && onOpenAuthModal) {
              onOpenAuthModal();
            } else {
              setIsApplyModalOpen(true);
            }
          }}
          className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-7 py-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-base transition-all shadow-sm hover:shadow-md cursor-pointer"
        >
          <FileUp className="w-5 h-5" />
          <span>تقديم مباشر بالسيرة الذاتية</span>
        </button>

        {job.applicationUrl && !job.applicationUrl.startsWith('mailto:') && (
          <a
            href={job.applicationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors"
          >
            <span>رابط المنشأة الخارجي</span>
            <ExternalLink className="w-3.5 h-3.5 rtl:rotate-180 text-slate-400" />
          </a>
        )}

        {(job.applicationMethod === 'email' || (job.applicationUrl && job.applicationUrl.startsWith('mailto:'))) && (
          <a
            href={job.applicationUrl || `mailto:careers@example.com?subject=${encodeURIComponent(job.title)}`}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors"
          >
            <Mail className="w-3.5 h-3.5 text-slate-500" />
            <span>تقديم بالبريد</span>
          </a>
        )}
      </div>
    );
  };

  // Helper styling for overall compatibility level
  const getLevelBadgeClass = (level: string) => {
    switch (level) {
      case 'strong_match':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      case 'good_match':
        return 'bg-teal-100 text-teal-900 border-teal-300';
      case 'partial_match':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'limited_match':
        return 'bg-rose-100 text-rose-900 border-rose-300';
      case 'insufficient_information':
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  // Helper styling for confidence level
  const getConfidenceBadgeClass = (conf: string) => {
    switch (conf) {
      case 'high':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'medium':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'low':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Admin Preview Mode Banner */}
      {isAdminPreview && (
        <div className="mb-4 p-3.5 bg-slate-900 text-white rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="font-bold">وضع معاينة الإدارة (Admin Preview Mode)</span>
            <span className="text-slate-400 hidden sm:inline">| الحالة الحالية: {job.status}</span>
          </div>
          {onEditFromPreview && (
            <button
              onClick={() => onEditFromPreview(job)}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-lg transition-colors cursor-pointer"
            >
              تعديل بيانات الوظيفة
            </button>
          )}
        </div>
      )}

      {/* Breadcrumb Navigation */}
      <div className="mb-3">
        <Breadcrumbs items={breadcrumbItems} onNavigate={onNavigateUrl} />
      </div>

      {/* Back button */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-emerald-700 transition-colors p-1 -mr-1 cursor-pointer"
        >
          <ArrowRight className="w-4 h-4" />
          <span>{isAdminPreview ? 'العودة إلى لوحة تحكم الإدارة' : 'العودة إلى قائمة الوظائف'}</span>
        </button>
      </div>

      {/* Expired Job Notice Banner */}
      {isExpired && (
        <div className="mb-6 p-4 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs sm:text-sm flex items-start gap-3">
          <div className="text-xl">⚠️</div>
          <div>
            <div className="font-bold mb-0.5">هذا الإعلان الوظيفي منتهي الصلاحية</div>
            <p className="text-purple-800 leading-relaxed text-xs">
              انتهت الفترة المحددة لاستقبال طلبات التقديم لهذه الوظيفة بتاريخ {validUntilDate}. تم حفظ تفاصيل هذا الإعلان كمرجع أرشيفي ولا يمكن تقديم طلبات جديدة حالياً.
            </p>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        {/* Header Hero Area */}
        <div className="p-6 sm:p-8 border-b border-slate-100 bg-linear-to-b from-slate-50/70 to-white">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-xl shadow-xs shrink-0">
                {job.companyLogo ? (
                  <img
                    src={job.companyLogo}
                    alt={job.companyName}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain rounded-xl"
                  />
                ) : (
                  <Building2 className="w-8 h-8 text-slate-500" />
                )}
              </div>
              <div className="space-y-1.5">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
                  {job.title}
                </h1>
                <div className="text-base font-medium text-slate-700">
                  {job.companyName}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-slate-600 pt-1">
                  {countrySlug && citySlug ? (
                    <a
                      href={`/jobs/${countrySlug}/${citySlug}`}
                      onClick={(e) => {
                        if (onNavigateUrl) {
                          e.preventDefault();
                          onNavigateUrl(`/jobs/${countrySlug}/${citySlug}`);
                        }
                      }}
                      className="font-semibold text-slate-800 hover:text-emerald-700 hover:underline transition-colors"
                    >
                      {structuredBadgeLocation}
                    </a>
                  ) : (
                    <span className="font-semibold text-slate-800">{structuredBadgeLocation}</span>
                  )}
                  <span className="text-slate-300" aria-hidden="true">·</span>
                  <span>{workModeText}</span>
                  <span className="text-slate-300" aria-hidden="true">·</span>
                  <span>{employmentTypeText}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions (Save, Share) */}
            <div className="flex items-center gap-2 self-start sm:self-center">
              <button
                type="button"
                onClick={handleToggleSave}
                className={`p-2.5 rounded-lg border text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer ${
                  internalSaved
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                    : 'border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
                title={internalSaved ? 'إلغاء حفظ الوظيفة' : 'حفظ الوظيفة'}
              >
                <Bookmark className={`w-4 h-4 ${internalSaved ? 'fill-emerald-700' : ''}`} />
                <span className="hidden sm:inline">{internalSaved ? 'محفوظة' : 'حفظ'}</span>
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="p-2.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer"
                title="مشاركة رابط الوظيفة"
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {copySuccess ? 'تم النسخ!' : 'مشاركة'}
                </span>
              </button>
            </div>
          </div>

          {/* Quick Facts Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-200/80 text-xs">
            <div>
              <span className="text-slate-400 block mb-1">الراتب المتوقع</span>
              <span className={`font-semibold text-sm ${salaryInfo.isDisclosed ? 'text-emerald-800' : 'text-slate-600'}`}>
                {salaryInfo.text}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block mb-1">الخبرة المطلوبة</span>
              <span className="font-semibold text-sm text-slate-800">
                {experienceText}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block mb-1">المؤهل التعليمي</span>
              <span className="font-semibold text-sm text-slate-800 truncate block" title={job.education ?? 'غير محدد'}>
                {job.education ?? 'غير محدد في الإعلان'}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block mb-1">تاريخ النشر</span>
              <span className="font-semibold text-sm text-slate-800">
                {relativeDate}
              </span>
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* COMPATIBILITY ENGINE SECTION ("هل هذه الوظيفة مناسبة لي؟") - PHASE 4 */}
        {/* ================================================================= */}
        <section className="border-b border-slate-200 bg-slate-50/70 p-6 sm:p-8 space-y-6">
          {compatibility ? (
            /* User Profile Exists -> Explainable Compatibility Report */
            <div className="space-y-6">
              {/* Header: Title, Level Badge, Confidence, Score */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                      هل هذه الوظيفة مناسبة لي؟
                    </h2>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold border ${getLevelBadgeClass(
                        compatibility.overallLevel
                      )}`}
                    >
                      {compatibility.overallLevelLabelAr}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-md text-[11px] font-medium border ${getConfidenceBadgeClass(
                        compatibility.confidence
                      )}`}
                      title={compatibility.confidenceReasonAr}
                    >
                      {compatibility.confidenceLabelAr}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500">
                    مقارنة توافقية موضوعية ومفسرة مبنية على بيانات ملفك المهني (<span className="font-semibold text-slate-700">{profile?.fullName}</span>).
                  </p>
                </div>

                {/* Score & Profile Link */}
                <div className="flex items-center gap-4 self-start md:self-center">
                  <div className="text-left">
                    <span className="text-xs text-slate-400 block">نسبة التوافق المحتسبة</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-emerald-700 tabular-nums">
                        {compatibility.matchPercentage}%
                      </span>
                      <span className="text-xs text-slate-400">/ 100</span>
                    </div>
                  </div>

                  {onOpenProfile && (
                    <button
                      onClick={onOpenProfile}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                    >
                      تعديل ملفي
                    </button>
                  )}
                </div>
              </div>

              {/* Progress Bar with Confidence Note */}
              <div className="space-y-1.5">
                <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      compatibility.matchPercentage >= 80
                        ? 'bg-emerald-600'
                        : compatibility.matchPercentage >= 60
                        ? 'bg-teal-600'
                        : compatibility.matchPercentage >= 40
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${compatibility.matchPercentage}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>{compatibility.summary}</span>
                  <span className="text-slate-400 hidden sm:inline">{compatibility.confidenceReasonAr}</span>
                </div>
              </div>

              {/* Category-by-Category Dimension Cards (All 8 Criteria) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                {/* 1. Specialty (20 pts) */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs space-y-1.5">
                  <div className="flex items-center justify-between font-bold text-slate-800">
                    <span className="flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-emerald-700" />
                      <span>التخصص والمسمى</span>
                    </span>
                    <span className="tabular-nums font-semibold text-slate-700">
                      {compatibility.specialtyCompatibility.earnedPoints} / 20
                    </span>
                  </div>
                  <div className="text-[11px] font-medium text-slate-600">
                    الحالة: <span className="text-emerald-800">{compatibility.specialtyCompatibility.statusLabelAr}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    {compatibility.specialtyCompatibility.detailsAr}
                  </p>
                </div>

                {/* 2. Skills (25 pts) */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs space-y-1.5">
                  <div className="flex items-center justify-between font-bold text-slate-800">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                      <span>المهارات المعلنة</span>
                    </span>
                    <span className="tabular-nums font-semibold text-slate-700">
                      {compatibility.skillsCompatibility.earnedPoints} / 25
                    </span>
                  </div>
                  <div className="text-[11px] font-medium text-slate-600">
                    الحالة: <span className="text-emerald-800">{compatibility.skillsCompatibility.statusLabelAr}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    {compatibility.skillsCompatibility.detailsAr}
                  </p>
                </div>

                {/* 3. Experience (15 pts) */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs space-y-1.5">
                  <div className="flex items-center justify-between font-bold text-slate-800">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-700" />
                      <span>سنوات الخبرة</span>
                    </span>
                    <span className="tabular-nums font-semibold text-slate-700">
                      {compatibility.experienceCompatibility.earnedPoints} / 15
                    </span>
                  </div>
                  <div className="text-[11px] font-medium text-slate-600">
                    الحالة: <span className="text-emerald-800">{compatibility.experienceCompatibility.statusLabelAr}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    {compatibility.experienceCompatibility.detailsAr}
                  </p>
                </div>

                {/* 4. Education (10 pts) */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs space-y-1.5">
                  <div className="flex items-center justify-between font-bold text-slate-800">
                    <span className="flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-emerald-700" />
                      <span>المؤهل العلمي</span>
                    </span>
                    <span className="tabular-nums font-semibold text-slate-700">
                      {compatibility.educationCompatibility.earnedPoints} / 10
                    </span>
                  </div>
                  <div className="text-[11px] font-medium text-slate-600">
                    الحالة: <span className="text-emerald-800">{compatibility.educationCompatibility.statusLabelAr}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    {compatibility.educationCompatibility.detailsAr}
                  </p>
                </div>

                {/* 5. Location (10 pts) */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs space-y-1.5">
                  <div className="flex items-center justify-between font-bold text-slate-800">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                      <span>الموقع الجغرافي</span>
                    </span>
                    <span className="tabular-nums font-semibold text-slate-700">
                      {compatibility.locationCompatibility.earnedPoints} / 10
                    </span>
                  </div>
                  <div className="text-[11px] font-medium text-slate-600">
                    الحالة: <span className="text-emerald-800">{compatibility.locationCompatibility.statusLabelAr}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    {compatibility.locationCompatibility.detailsAr}
                  </p>
                </div>

                {/* 6. Languages (10 pts) */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs space-y-1.5">
                  <div className="flex items-center justify-between font-bold text-slate-800">
                    <span className="flex items-center gap-1.5">
                      <Languages className="w-3.5 h-3.5 text-emerald-700" />
                      <span>اللغات المتقنة</span>
                    </span>
                    <span className="tabular-nums font-semibold text-slate-700">
                      {compatibility.languageCompatibility.earnedPoints} / 10
                    </span>
                  </div>
                  <div className="text-[11px] font-medium text-slate-600">
                    الحالة: <span className="text-emerald-800">{compatibility.languageCompatibility.statusLabelAr}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    {compatibility.languageCompatibility.detailsAr}
                  </p>
                </div>

                {/* 7. Work Mode (5 pts) */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs space-y-1.5">
                  <div className="flex items-center justify-between font-bold text-slate-800">
                    <span className="flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-emerald-700" />
                      <span>نمط العمل</span>
                    </span>
                    <span className="tabular-nums font-semibold text-slate-700">
                      {compatibility.workModeCompatibility.earnedPoints} / 5
                    </span>
                  </div>
                  <div className="text-[11px] font-medium text-slate-600">
                    الحالة: <span className="text-emerald-800">{compatibility.workModeCompatibility.statusLabelAr}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    {compatibility.workModeCompatibility.detailsAr}
                  </p>
                </div>

                {/* 8. Employment Type (5 pts) */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs space-y-1.5">
                  <div className="flex items-center justify-between font-bold text-slate-800">
                    <span className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-emerald-700" />
                      <span>نوع التوظيف</span>
                    </span>
                    <span className="tabular-nums font-semibold text-slate-700">
                      {compatibility.employmentTypeCompatibility.earnedPoints} / 5
                    </span>
                  </div>
                  <div className="text-[11px] font-medium text-slate-600">
                    الحالة: <span className="text-emerald-800">{compatibility.employmentTypeCompatibility.statusLabelAr}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    {compatibility.employmentTypeCompatibility.detailsAr}
                  </p>
                </div>
              </div>

              {/* Skills Overlap Badges: Matched vs Missing */}
              {job.skills && job.skills.length > 0 && (
                <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3 text-xs">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-700" />
                    <span>مقارنة المهارات المطلوبة:</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {compatibility.matchedSkills.map((s, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-900 font-medium flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{s}</span>
                        <span className="text-[10px] text-emerald-700 font-normal">(متوفرة بملفك)</span>
                      </span>
                    ))}

                    {compatibility.missingSkills.map((s, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-md bg-rose-50 border border-rose-200 text-rose-900 font-medium flex items-center gap-1.5"
                      >
                        <X className="w-3.5 h-3.5 text-rose-600" />
                        <span>{s}</span>
                        <span className="text-[10px] text-rose-600 font-normal">(غير مسجلة)</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Strengths & Missing Requirements Lists */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Strengths List */}
                {compatibility.strengths.length > 0 && (
                  <div className="p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 font-bold text-xs text-emerald-900">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>نقاط القوة والتطابق مع متطلبات الوظيفة:</span>
                    </div>
                    <ul className="space-y-1.5 text-xs text-emerald-950 pr-5 list-disc">
                      {compatibility.strengths.map((item, idx) => (
                        <li key={idx} className="leading-relaxed">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Missing Requirements List */}
                {compatibility.missingRequirements.length > 0 && (
                  <div className="p-4 bg-rose-50/60 border border-rose-200/80 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 font-bold text-xs text-rose-900">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>متطلبات معلنة غير متوفرة في ملفك المهني:</span>
                    </div>
                    <ul className="space-y-1.5 text-xs text-rose-950 pr-5 list-disc">
                      {compatibility.missingRequirements.map((item, idx) => (
                        <li key={idx} className="leading-relaxed">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Unclear / Unknown Information List (Strictly Separated from Missing) */}
              {compatibility.unclearInformation.length > 0 && (
                <div className="p-3.5 bg-slate-100/70 border border-slate-200 rounded-xl space-y-1.5 text-xs text-slate-700">
                  <div className="flex items-center gap-2 font-bold text-slate-800">
                    <HelpCircle className="w-4 h-4 text-slate-500 shrink-0" />
                    <span>بنود غير محددة (معلومات غير كافية بالإعلان أو الملف المهني):</span>
                  </div>
                  <ul className="space-y-1 pr-5 list-disc text-slate-600 text-[11px]">
                    {compatibility.unclearInformation.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                  <p className="text-[10px] text-slate-400 pt-1">
                    * ملاحظة معمارية: البنود غير المحددة لا تُحسب سلباً أو إيجاباً، ولا تؤثر على سلامة المعايير الأخرى.
                  </p>
                </div>
              )}

              {/* ============================================================= */}
              {/* SCORE EXPLANATION ACCORDION ("كيف تم حساب النسبة؟") - PHASE 4 */}
              {/* ============================================================= */}
              <div className="border border-slate-200 rounded-xl bg-white overflow-hidden shadow-2xs">
                <button
                  type="button"
                  onClick={() => setShowScoreExplanation(!showScoreExplanation)}
                  className="w-full p-4 flex items-center justify-between text-right text-xs sm:text-sm font-bold text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Scale className="w-4 h-4 text-emerald-700" />
                    <span>كيف تم حساب النسبة؟ (توزيع الأوزان والمعايير المحددة)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500 text-xs font-normal">
                    <span>{showScoreExplanation ? 'إخفاء التفاصيل' : 'عرض جدول التقييم التفصيلي'}</span>
                    {showScoreExplanation ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </button>

                {showScoreExplanation && (
                  <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50/50 space-y-4 animate-fade-in text-xs">
                    <p className="text-slate-600 leading-relaxed">
                      يعتمد المحرك على نظام نقاط وزني شفاف من <span className="font-bold text-slate-900">100 نقطة</span>، تُوزع على 8 معايير موضوعية قابلة للتتبع المباشر. لا يتم تخمين أي معلومات غير معلنة ولا يُعاقب الباحث على غياب بيانات في إعلان الوظيفة.
                    </p>

                    {/* Breakdown Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-right border-collapse bg-white rounded-lg border border-slate-200 overflow-hidden">
                        <thead>
                          <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-xs">
                            <th className="py-2.5 px-3">المعيار التوافقي</th>
                            <th className="py-2.5 px-3">الوزن الأقصى</th>
                            <th className="py-2.5 px-3">النقاط المحتسبة</th>
                            <th className="py-2.5 px-3">الحالة التوافقية</th>
                            <th className="py-2.5 px-3">تفسير النتيجة</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-[11px] text-slate-700">
                          {compatibility.scoreBreakdown.map((row) => (
                            <tr key={row.criterionId} className="hover:bg-slate-50/60">
                              <td className="py-2 px-3 font-semibold text-slate-900">{row.nameAr}</td>
                              <td className="py-2 px-3 tabular-nums font-medium text-slate-500">{row.weight}%</td>
                              <td className="py-2 px-3 tabular-nums font-bold text-emerald-800">{row.earnedPoints}</td>
                              <td className="py-2 px-3">
                                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-800">
                                  {row.statusLabelAr}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-slate-600 max-w-xs">{row.detailsAr}</td>
                            </tr>
                          ))}
                          <tr className="bg-emerald-50/70 font-bold text-slate-900 border-t-2 border-emerald-200">
                            <td className="py-2.5 px-3">المجموع الكلي النهائي</td>
                            <td className="py-2.5 px-3 tabular-nums">100%</td>
                            <td className="py-2.5 px-3 tabular-nums text-emerald-800 font-black text-sm">
                              {compatibility.matchPercentage} / 100
                            </td>
                            <td className="py-2.5 px-3 text-emerald-900">{compatibility.overallLevelLabelAr}</td>
                            <td className="py-2.5 px-3 text-[10px] text-slate-500">
                              تم التقييم وفق البيانات المتاحة مع استبعاد التكهن الوهمي.
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Factual Disclaimer Notice (Section 16 Compliant) */}
              <div className="p-3 bg-white rounded-lg border border-slate-200 text-[11px] text-slate-500 leading-relaxed text-center sm:text-right">
                <span className="font-semibold text-slate-700">تنويه قانوني وإجرائي: </span>
                {compatibility.disclaimerAr}
              </div>
            </div>
          ) : (
            /* User does NOT have profile -> Prompt to create profile */
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
              <div className="flex items-center gap-3 text-center sm:text-right">
                <div className="w-12 h-12 rounded-xl bg-amber-100/70 border border-amber-200 flex items-center justify-center text-amber-800 shrink-0 mx-auto sm:mx-0">
                  <Sparkles className="w-6 h-6 text-amber-700" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    هل هذه الوظيفة مناسبة لخبراتك ومؤهلاتك؟
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 max-w-xl leading-relaxed">
                    أنشئ ملفك المهني أولاً لتحصل على تقرير توافق مخصص ومفسر يقارن سنوات خبرتك ومهاراتك وموقعك الجغرافي مع معايير هذه الوظيفة بنظام النقاط الشفاف.
                  </p>
                </div>
              </div>

              {onOpenProfile && (
                <button
                  onClick={onOpenProfile}
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors cursor-pointer shrink-0 shadow-xs"
                >
                  إنشاء ملفي المهني
                </button>
              )}
            </div>
          )}
        </section>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-8">
          {/* Main Description */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 border-r-2 border-emerald-700 pr-3">
              الوصف الوظيفي
            </h2>
            <p className="text-sm sm:text-base text-slate-700 leading-relaxed whitespace-pre-line">
              {job.description}
            </p>
          </section>

          {/* Responsibilities */}
          {job.responsibilities && job.responsibilities.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 border-r-2 border-emerald-700 pr-3">
                المهام والمسؤوليات الرئيسية
              </h2>
              <ul className="space-y-2 pr-4 list-disc text-sm sm:text-base text-slate-700 leading-relaxed">
                {job.responsibilities.map((resp, idx) => (
                  <li key={idx} className="pr-1">
                    {resp}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Requirements */}
          {job.requirements && job.requirements.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 border-r-2 border-emerald-700 pr-3">
                المتطلبات والمؤهلات
              </h2>
              <ul className="space-y-2 pr-4 list-disc text-sm sm:text-base text-slate-700 leading-relaxed">
                {job.requirements.map((req, idx) => (
                  <li key={idx} className="pr-1">
                    {req}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Detailed Location Section */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 border-r-2 border-emerald-700 pr-3">
              الموقع الجغرافي والعمل
            </h2>
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 text-xs sm:text-sm text-slate-700 space-y-2">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-900">العنوان الإداري: </span>
                  <span>{fullLocationText}</span>
                </div>
              </div>
              {job.address && (
                <div className="pr-6 text-slate-500 text-xs">
                  تفاصيل العنوان: {job.address}
                </div>
              )}
              <div className="pr-6 text-slate-500 text-xs">
                نمط بيئة العمل: {workModeText} · نوع العقد: {employmentTypeText}
              </div>
            </div>
          </section>

          {/* Skills Required */}
          {job.skills && job.skills.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 border-r-2 border-emerald-700 pr-3">
                المهارات المطلوبة
              </h2>
              <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-slate-700">
                {job.skills.map((skill, idx) => {
                  const isMatched =
                    compatibility?.matchedSkills &&
                    compatibility.matchedSkills.includes(skill);
                  return (
                    <span
                      key={idx}
                      className={`px-3 py-1.5 rounded-md font-medium border ${
                        isMatched
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                          : 'bg-slate-100 border-slate-200 text-slate-800'
                      }`}
                    >
                      {skill}
                      {isMatched && (
                        <span className="mr-1.5 text-emerald-600 font-bold">✓</span>
                      )}
                    </span>
                  );
                })}
              </div>
            </section>
          )}

          {/* Languages */}
          {job.languages && job.languages.length > 0 && (
            <section className="space-y-2">
              <h3 className="text-sm font-bold text-slate-900">اللغات المطلوبة</h3>
              <p className="text-sm text-slate-700">
                {job.languages.join(' · ')}
              </p>
            </section>
          )}

          {/* Benefits */}
          {job.benefits && job.benefits.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 border-r-2 border-emerald-700 pr-3">
                المزايا والبدلات
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {job.benefits.map((benefit, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200/60 text-sm text-slate-700"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Source Attribution & Transparency */}
          <section className="pt-6 border-t border-slate-200 text-xs text-slate-500 space-y-1.5">
            <div>
              <span className="font-medium text-slate-600">مصدر الإعلان: </span>
              <span>{job.sourceName ?? 'تم الاستلام مباشرة من جهة العمل'}</span>
              {job.sourceUrl && (
                <a
                  href={job.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-700 hover:underline mr-2 inline-flex items-center gap-1"
                >
                  <Globe className="w-3 h-3" />
                  <span>الموقع المرجعي</span>
                </a>
              )}
            </div>
            {job.validThrough && (
              <div>
                <span className="font-medium text-slate-600">صلاحية الإعلان حتى: </span>
                <span>{validUntilDate}</span>
              </div>
            )}
            <div className="text-[11px] text-slate-400">
              معرّف الوظيفة: <span className="font-mono">{job.id}</span> · تاريخ التحديث: {formatArabicFullDate(job.updatedAt)}
            </div>
          </section>

          {/* Bottom Sticky-ready CTA */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-slate-600 text-center sm:text-right">
              رابط التقديم متاح ومباشر دون الحاجة إلى إنشاء حساب أو تسجيل دخول في هذه المرحلة.
            </div>
            {getApplicationCta()}
          </div>
        </div>
      </div>

      {/* Related Jobs Section (Contextual Internal Linking) */}
      {relatedJobs.length > 0 && onSelectJob && (
        <div className="mt-8 bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xs">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900">وظائف أخرى ذات صلة</h2>
              <p className="text-xs text-slate-500 mt-0.5">فرص وظيفية معتمدة في نفس المنطقة أو التخصص المهني</p>
            </div>
            {countrySlug && citySlug && (
              <a
                href={`/jobs/${countrySlug}/${citySlug}`}
                onClick={(e) => {
                  if (onNavigateUrl) {
                    e.preventDefault();
                    onNavigateUrl(`/jobs/${countrySlug}/${citySlug}`);
                  }
                }}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline inline-flex items-center gap-1"
              >
                <span>المزيد في {job.city}</span>
                <ChevronLeft className="w-3.5 h-3.5 rtl:rotate-0" />
              </a>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {relatedJobs.map((rJob: Job) => (
              <JobCard
                key={rJob.id}
                job={rJob}
                onSelect={onSelectJob}
                isSaved={internalSaved && rJob.id === job.id}
                onToggleSave={onToggleSave ? () => onToggleSave(rJob.id) : undefined}
                slug={generateJobSlug(rJob, allJobs)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Candidate Apply Modal */}
      <ApplyModal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        job={job}
        currentUser={currentUser || null}
        onOpenAuthModal={onOpenAuthModal || (() => {})}
        onSuccessApplication={async () => {
          if (currentUser) {
            const app = await applicationService.getUserApplicationForJob(currentUser, job.id);
            setUserApplication(app);
          }
        }}
        onViewMyApplications={onViewMyApplications}
        compatibilityScore={compatibility?.matchPercentage}
      />
    </div>
  );
};
