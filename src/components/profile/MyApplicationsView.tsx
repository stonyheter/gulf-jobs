/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ============================================================================
 * CANDIDATE APPLICATIONS TRACKING VIEW (PHASE 7)
 * ============================================================================
 * Dedicated portal view for job seekers to track their submitted applications,
 * status updates, attached CVs, and cover letters.
 */

import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Building2,
  MapPin,
  Calendar,
  FileText,
  Download,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Send,
} from 'lucide-react';
import { User } from '../../types/auth';
import { Job } from '../../types/job';
import { Application, ApplicationStatus } from '../../types/application';
import { applicationService, UserApplicationSummary } from '../../services/applicationService';
import { formatArabicFullDate, formatArabicRelativeDate } from '../../utils/date';
import { formatLocation } from '../../utils/formatters';

interface MyApplicationsViewProps {
  currentUser: User | null;
  onOpenAuthModal: () => void;
  onExploreJobs: () => void;
  onSelectJob: (job: Job) => void;
}

export const MyApplicationsView: React.FC<MyApplicationsViewProps> = ({
  currentUser,
  onOpenAuthModal,
  onExploreJobs,
  onSelectJob,
}) => {
  const [applications, setApplications] = useState<UserApplicationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCoverLetters, setExpandedCoverLetters] = useState<Record<string, boolean>>({});
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'archived'>('all');

  // Load user applications
  const loadApplications = async () => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setActionError(null);
    try {
      const data = await applicationService.getMyApplications(currentUser);
      setApplications(data);
    } catch (err: any) {
      console.warn('Failed to load applications', err);
      setActionError(err.message || 'فشل في تحميل قائمة طلباتك.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, [currentUser]);

  // Handle withdrawing an application
  const handleWithdraw = async (applicationId: string) => {
    if (!currentUser) return;
    if (!window.confirm('هل أنت متأكد من رغبتك في سحب طلب التوظيف؟ لن يتمكن صاحب العمل من مراجعته بعد ذلك.')) {
      return;
    }

    setWithdrawingId(applicationId);
    setActionError(null);
    try {
      await applicationService.withdrawApplication(currentUser, applicationId);
      await loadApplications();
    } catch (err: any) {
      setActionError(err.message || 'فشل في سحب الطلب.');
    } finally {
      setWithdrawingId(null);
    }
  };

  // Toggle cover letter expansion
  const toggleCoverLetter = (appId: string) => {
    setExpandedCoverLetters((prev) => ({
      ...prev,
      [appId]: !prev[appId],
    }));
  };

  // Status badge styling helper
  const getStatusBadge = (status: ApplicationStatus) => {
    switch (status) {
      case 'pending':
        return {
          label: 'قيد المراجعة',
          bg: 'bg-amber-50 text-amber-800 border-amber-200',
          icon: Clock,
        };
      case 'reviewing':
        return {
          label: 'جاري التدقيق والفرز',
          bg: 'bg-blue-50 text-blue-800 border-blue-200',
          icon: Clock,
        };
      case 'shortlisted':
        return {
          label: 'في القائمة المختصرة',
          bg: 'bg-teal-50 text-teal-800 border-teal-200',
          icon: CheckCircle2,
        };
      case 'interview':
        return {
          label: 'مرشح للمقابلة',
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold',
          icon: Sparkles,
        };
      case 'accepted':
        return {
          label: 'مقبول مبدئياً',
          bg: 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold',
          icon: CheckCircle2,
        };
      case 'rejected':
        return {
          label: 'تم الاعتذار',
          bg: 'bg-rose-50 text-rose-800 border-rose-200',
          icon: XCircle,
        };
      case 'withdrawn':
        return {
          label: 'تم سحب الطلب',
          bg: 'bg-slate-100 text-slate-600 border-slate-200',
          icon: RotateCcw,
        };
      default:
        return {
          label: status,
          bg: 'bg-slate-100 text-slate-700 border-slate-200',
          icon: HelpCircle,
        };
    }
  };

  // Filter applications
  const filteredApplications = applications.filter((app) => {
    if (activeFilter === 'active') {
      return ['pending', 'reviewing', 'shortlisted', 'interview'].includes(app.application.status);
    }
    if (activeFilter === 'archived') {
      return ['accepted', 'rejected', 'withdrawn'].includes(app.application.status);
    }
    return true;
  });

  // Calculate stats
  const totalCount = applications.length;
  const activeCount = applications.filter((a) =>
    ['pending', 'reviewing', 'shortlisted', 'interview'].includes(a.application.status)
  ).length;
  const interviewCount = applications.filter((a) =>
    ['interview', 'accepted'].includes(a.application.status)
  ).length;

  if (!currentUser) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-5" dir="rtl">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
          <Briefcase className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-900">متابعة طلبات التوظيف (طلباتي)</h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            يرجى تسجيل الدخول إلى حسابك لعرض وتتبع جميع طلبات التوظيف التي قمت بتقديمها وحالتها المحدثة.
          </p>
        </div>
        <button
          onClick={onOpenAuthModal}
          className="px-6 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-sm transition-colors cursor-pointer"
        >
          تسجيل الدخول الآن
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6" dir="rtl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Send className="w-6 h-6 text-emerald-700" />
            <span>طلبات التوظيف الخاصة بي</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            سجل موثق بالفرص التي تقدمت لها، مع إمكانية تحميل سيرتك الذاتية ومتابعة ردود جهات العمل.
          </p>
        </div>

        <button
          onClick={onExploreJobs}
          className="self-start sm:self-center px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors cursor-pointer shadow-2xs flex items-center gap-1.5"
        >
          <span>تصفح وظائف جديدة</span>
          <ArrowRight className="w-4 h-4 rtl:rotate-180" />
        </button>
      </div>

      {/* Error Alert */}
      {actionError && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-medium">إجمالي الطلبات المقدمة</span>
            <span className="text-2xl font-black text-slate-900 tabular-nums">{totalCount}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-medium">قيد المراجعة والمتابعة</span>
            <span className="text-2xl font-black text-amber-800 tabular-nums">{activeCount}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-medium">المقابلات والترشيحات</span>
            <span className="text-2xl font-black text-emerald-700 tabular-nums">{interviewCount}</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 text-xs">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-3.5 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
            activeFilter === 'all'
              ? 'bg-slate-900 text-white'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          كافة الطلبات ({totalCount})
        </button>
        <button
          onClick={() => setActiveFilter('active')}
          className={`px-3.5 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
            activeFilter === 'active'
              ? 'bg-slate-900 text-white'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          الطلبات النشطة ({activeCount})
        </button>
        <button
          onClick={() => setActiveFilter('archived')}
          className={`px-3.5 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
            activeFilter === 'archived'
              ? 'bg-slate-900 text-white'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          المكتملة والمسحوبة ({totalCount - activeCount})
        </button>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-sm">
          جاري استرجاع سجل طلبات التوظيف...
        </div>
      ) : filteredApplications.length === 0 ? (
        /* Empty State */
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <FileText className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-800">
              {activeFilter === 'all'
                ? 'لم تقم بتقديم أي طلبات توظيف حتى الآن'
                : 'لا توجد طلبات تطابق هذا التصنيف'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              اكتشف مئات الفرص الوظيفية المعتمدة في دول الخليج وقدّم مباشرة باستخدام سيرتك الذاتية.
            </p>
          </div>
          <button
            onClick={onExploreJobs}
            className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs inline-flex items-center gap-1.5"
          >
            <span>استعراض الوظائف الشاغرة</span>
            <ArrowRight className="w-4 h-4 rtl:rotate-180" />
          </button>
        </div>
      ) : (
        /* Applications List */
        <div className="space-y-4">
          {filteredApplications.map(({ application, job, cvFile, cvDownloadUrl }) => {
            const statusConfig = getStatusBadge(application.status);
            const StatusIcon = statusConfig.icon;
            const isCoverExpanded = !!expandedCoverLetters[application.id];

            return (
              <div
                key={application.id}
                className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs hover:border-slate-300 transition-all space-y-4"
              >
                {/* Top Row: Job Title, Status Badge, Application ID */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${statusConfig.bg}`}
                      >
                        <StatusIcon className="w-3.5 h-3.5" />
                        <span>{statusConfig.label}</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        معرّف: {application.id}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-slate-900 hover:text-emerald-700 transition-colors">
                      {job ? (
                        <button
                          onClick={() => onSelectJob(job)}
                          className="text-right hover:underline cursor-pointer"
                        >
                          {job.title}
                        </button>
                      ) : (
                        <span>وظيفة رقم #{application.jobId} (غير متاحة حالياً)</span>
                      )}
                    </h3>

                    {job && (
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-0.5">
                        <span className="flex items-center gap-1 font-medium text-slate-700">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>{job.companyName}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatLocation(job)}</span>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Submission date */}
                  <div className="text-left sm:text-right shrink-0">
                    <span className="text-[11px] text-slate-400 block">تاريخ التقديم:</span>
                    <span className="text-xs font-semibold text-slate-700 block">
                      {formatArabicRelativeDate(application.createdAt)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(application.createdAt).toLocaleDateString('ar-SA')}
                    </span>
                  </div>
                </div>

                {/* Middle Row: Attached CV details and Cover Letter */}
                <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 text-xs space-y-3">
                  {/* CV file row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-semibold text-slate-800 block">
                          {cvFile ? cvFile.fileName : 'ملف السيرة الذاتية المرفق'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          حاوية التخزين الخاصة المحمية
                        </span>
                      </div>
                    </div>

                    {cvDownloadUrl ? (
                      <a
                        href={cvDownloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-colors cursor-pointer self-start sm:self-auto shadow-2xs"
                      >
                        <Download className="w-3.5 h-3.5 text-emerald-700" />
                        <span>تحميل السيرة الذاتية</span>
                      </a>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">
                        السيرة الذاتية محفوظة ومتاحة لجهة العمل
                      </span>
                    )}
                  </div>

                  {/* Cover letter toggle */}
                  {application.coverLetter && (
                    <div className="pt-2 border-t border-slate-200/70">
                      <button
                        onClick={() => toggleCoverLetter(application.id)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-emerald-700 transition-colors cursor-pointer"
                      >
                        <span>رسالة / خطاب التقديم المرفق</span>
                        {isCoverExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {isCoverExpanded && (
                        <div className="mt-2 p-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                          {application.coverLetter}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom Row Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    {job && (
                      <button
                        onClick={() => onSelectJob(job)}
                        className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline inline-flex items-center gap-1 cursor-pointer"
                      >
                        <span>عرض تفاصيل الإعلان الوظيفي</span>
                        <ExternalLink className="w-3.5 h-3.5 rtl:rotate-180" />
                      </button>
                    )}
                  </div>

                  {/* Withdraw action */}
                  {['pending', 'reviewing'].includes(application.status) && (
                    <button
                      onClick={() => handleWithdraw(application.id)}
                      disabled={withdrawingId === application.id}
                      className="text-xs font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-2.5 py-1 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {withdrawingId === application.id ? 'جاري السحب...' : 'سحب الطلب'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
