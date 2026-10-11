/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ============================================================================
 * ADMIN DASHBOARD (PHASE 2)
 * ============================================================================
 * Displays administrative KPIs, recent jobs table, and quick actions.
 */

import React from 'react';
import {
  Briefcase,
  CheckCircle2,
  Clock,
  FileEdit,
  AlertTriangle,
  XCircle,
  Copy,
  Plus,
  Eye,
  PauseCircle,
  PlayCircle,
  Trash2,
  ArrowLeft,
  Database,
  Building2,
  Scale,
} from 'lucide-react';
import { Job, JobStatus } from '../../types/job';
import { AdminStats } from '../../services/jobService';
import { formatLocation, formatSalary } from '../../utils/formatters';
import { formatArabicRelativeDate, formatArabicFullDate } from '../../utils/date';

interface AdminDashboardProps {
  stats: AdminStats;
  recentJobs: Job[];
  onAddNewJob: () => void;
  onPreviewJob: (job: Job) => void;
  onEditJob: (job: Job) => void;
  onPublishJob: (id: string) => Promise<void>;
  onPauseJob: (id: string) => Promise<void>;
  onExpireJob: (id: string) => Promise<void>;
  onDuplicateJob: (id: string) => Promise<void>;
  onDeleteJob: (id: string) => Promise<void>;
  onViewAllJobs: () => void;
  onFilterByStatus: (status: JobStatus) => void;
  onOpenTestRunner?: () => void;
  onOpenSeoRunner?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  stats,
  recentJobs,
  onAddNewJob,
  onPreviewJob,
  onEditJob,
  onPublishJob,
  onPauseJob,
  onExpireJob,
  onDuplicateJob,
  onDeleteJob,
  onViewAllJobs,
  onFilterByStatus,
  onOpenTestRunner,
  onOpenSeoRunner,
}) => {
  const getStatusBadge = (status: JobStatus) => {
    switch (status) {
      case 'published':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
            <span>منشورة</span>
          </span>
        );
      case 'pending_review':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
            <span>بانتظار المراجعة</span>
          </span>
        );
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
            <span>مسودة</span>
          </span>
        );
      case 'paused':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
            <span>متوقفة مؤقتاً</span>
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-800 border border-purple-200">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span>
            <span>منتهية الصلاحية</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-800 border border-red-200">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
            <span>مرفوضة</span>
          </span>
        );
      case 'duplicate':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-800 border border-orange-200">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-600"></span>
            <span>مكررة</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Banner Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-xs text-amber-900">
        <Database className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="font-bold">بيئة إدارة تطويرية (Development Persistence): </strong>
          البيانات الحالية تخضع لطبقة حفظ محلي (LocalStorage) مع معالجة كاملة لجميع حالات الوظائف (نشر، مسودة، انتهاء، تكرار). يتم التبديل إلى قاعدة بيانات سحابية (PostgreSQL / Cloud SQL / Firestore) لاحقاً عبر طبقة <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">jobService</code> دون تعديل الواجهات.
        </div>
      </div>

      {/* Header with Quick Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            لوحة قيادة إدارة الوظائف (Admin Dashboard)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            نظرة عامة على شواغر دول الخليج، وحالات الاعتماد والتحقق والتدقيق
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onOpenSeoRunner && (
            <button
              onClick={onOpenSeoRunner}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-900/90 hover:bg-blue-800 text-blue-100 text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer border border-blue-700"
              title="فحص ومعايرة بنية الـ SEO التقنية (Phase 5.1)"
            >
              <Database className="w-4 h-4 text-blue-400" />
              <span>فحص بنية SEO (16 فحص)</span>
            </button>
          )}

          {onOpenTestRunner && (
            <button
              onClick={onOpenTestRunner}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer border border-slate-700"
              title="فحص واختبار سيناريوهات محرك التوافق السبعة"
            >
              <Scale className="w-4 h-4 text-emerald-400" />
              <span>فحص محرك التوافق (7 حالات)</span>
            </button>
          )}

          <button
            onClick={onAddNewJob}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة وظيفة جديدة</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {/* 1. Total */}
        <div
          onClick={onViewAllJobs}
          className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:border-emerald-600 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">إجمالي الوظائف</span>
            <Briefcase className="w-4 h-4 text-slate-700" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums">{stats.total}</div>
          <div className="text-[11px] text-slate-400 mt-1">كافة السجلات</div>
        </div>

        {/* 2. Published */}
        <div
          onClick={() => onFilterByStatus('published')}
          className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:border-emerald-600 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-emerald-700 mb-2">
            <span className="text-xs font-semibold">منشورة نشطة</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-800 tabular-nums">{stats.published}</div>
          <div className="text-[11px] text-emerald-600 mt-1">تظهر للباحثين</div>
        </div>

        {/* 3. Pending Review */}
        <div
          onClick={() => onFilterByStatus('pending_review')}
          className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:border-amber-600 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-amber-700 mb-2">
            <span className="text-xs font-semibold">قيد المراجعة</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-800 tabular-nums">{stats.pendingReview}</div>
          <div className="text-[11px] text-amber-600 mt-1">تحتاج اعتماد</div>
        </div>

        {/* 4. Drafts */}
        <div
          onClick={() => onFilterByStatus('draft')}
          className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:border-slate-500 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-600 mb-2">
            <span className="text-xs font-semibold">المسودات</span>
            <FileEdit className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-bold text-slate-800 tabular-nums">{stats.drafts}</div>
          <div className="text-[11px] text-slate-400 mt-1">غير مكتملة</div>
        </div>

        {/* 5. Expired */}
        <div
          onClick={() => onFilterByStatus('expired')}
          className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:border-purple-600 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-purple-700 mb-2">
            <span className="text-xs font-semibold">منتهية الصلاحية</span>
            <AlertTriangle className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-purple-800 tabular-nums">{stats.expired}</div>
          <div className="text-[11px] text-purple-600 mt-1">محجوبة تلقائياً</div>
        </div>

        {/* 6. Rejected */}
        <div
          onClick={() => onFilterByStatus('rejected')}
          className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:border-red-600 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-red-700 mb-2">
            <span className="text-xs font-semibold">مرفوضة</span>
            <XCircle className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-bold text-red-800 tabular-nums">{stats.rejected}</div>
          <div className="text-[11px] text-red-600 mt-1">مخالفة للمعايير</div>
        </div>

        {/* 7. Duplicate */}
        <div
          onClick={() => onFilterByStatus('duplicate')}
          className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:border-orange-600 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-orange-700 mb-2">
            <span className="text-xs font-semibold">مكررة</span>
            <Copy className="w-4 h-4 text-orange-600" />
          </div>
          <div className="text-2xl font-bold text-orange-800 tabular-nums">{stats.duplicate}</div>
          <div className="text-[11px] text-orange-600 mt-1">مطابقة لوظيفة أخرى</div>
        </div>
      </div>

      {/* Recent Jobs Section */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">آخر الوظائف المحدثة</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              استعراض الإجراءات السريعة (معاينة، تعديل، نشر، إيقاف، تكرار، حذف)
            </p>
          </div>
          <button
            onClick={onViewAllJobs}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>عرض وإدارة كافة الوظائف</span>
            <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50/80 text-slate-600 border-b border-slate-200 font-semibold">
              <tr>
                <th className="px-6 py-3.5">الوظيفة والمنشأة</th>
                <th className="px-4 py-3.5">الموقع الجغرافي</th>
                <th className="px-4 py-3.5">الحالة</th>
                <th className="px-4 py-3.5">الراتب المتوقع</th>
                <th className="px-4 py-3.5">تاريخ النشر</th>
                <th className="px-4 py-3.5">الصلاحية</th>
                <th className="px-6 py-3.5 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {recentJobs.slice(0, 8).map((job) => {
                const locationText = formatLocation(job);
                const salary = formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency);

                return (
                  <tr key={job.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-3.5 font-medium">
                      <div className="font-bold text-slate-900 text-sm max-w-xs truncate" title={job.title}>
                        {job.title}
                      </div>
                      <div className="text-slate-500 text-[11px] mt-0.5">
                        {job.companyName}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap">
                      {locationText}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {getStatusBadge(job.status)}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-slate-700 tabular-nums">
                      {salary.text}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap">
                      {formatArabicRelativeDate(job.datePosted)}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap">
                      {job.validThrough ? formatArabicFullDate(job.validThrough) : 'مفتوح'}
                    </td>
                    <td className="px-6 py-3.5 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Preview */}
                        <button
                          onClick={() => onPreviewJob(job)}
                          title="معاينة الوظيفة"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => onEditJob(job)}
                          title="تعديل الوظيفة"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-700 hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          <FileEdit className="w-4 h-4" />
                        </button>

                        {/* Publish / Pause */}
                        {job.status === 'published' ? (
                          <button
                            onClick={() => onPauseJob(job.id)}
                            title="إيقاف مؤقت"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-amber-700 hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            <PauseCircle className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => onPublishJob(job.id)}
                            title="نشر الوظيفة"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            <PlayCircle className="w-4 h-4" />
                          </button>
                        )}

                        {/* Duplicate */}
                        <button
                          onClick={() => onDuplicateJob(job.id)}
                          title="تكرار الوظيفة كمسودة"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-purple-700 hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          <Copy className="w-4 h-4" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => {
                            if (window.confirm(`هل أنت متأكد من رغبتك في حذف الوظيفة: «${job.title}»؟`)) {
                              onDeleteJob(job.id);
                            }
                          }}
                          title="حذف الوظيفة"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-700 hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
