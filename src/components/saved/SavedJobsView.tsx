/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ============================================================================
 * SAVED JOBS VIEW (وظائفي المحفوظة) - PHASE 3
 * ============================================================================
 * Allows job seekers to review, filter, and manage bookmarked jobs.
 * Shows status changes (e.g. if an opportunity has expired or been paused).
 */

import React, { useState } from 'react';
import {
  Bookmark,
  Trash2,
  Search,
  ExternalLink,
  ChevronLeft,
  AlertCircle,
  Building2,
  ArrowRight,
  Filter,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { Job, JobStatus } from '../../types/job';
import {
  formatLocation,
  getWorkModeLabel,
  getEmploymentTypeLabel,
  formatExperience,
  formatSalary,
} from '../../utils/formatters';
import { formatArabicRelativeDate, formatArabicFullDate } from '../../utils/date';
import { isJobExpiredByDate } from '../../services/jobValidationService';

interface SavedJobsViewProps {
  savedJobs: Job[];
  onSelectJob: (job: Job) => void;
  onUnsaveJob: (jobId: string) => Promise<void>;
  onClearAllSaved: () => Promise<void>;
  onExploreJobs: () => void;
}

export const SavedJobsView: React.FC<SavedJobsViewProps> = ({
  savedJobs,
  onSelectJob,
  onUnsaveJob,
  onClearAllSaved,
  onExploreJobs,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired'>('all');
  const [isRemovingId, setIsRemovingId] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Filter jobs by search term and status
  const filteredJobs = savedJobs.filter((job) => {
    const isExpired = job.status === 'expired' || isJobExpiredByDate(job.validThrough);

    if (statusFilter === 'active' && isExpired) return false;
    if (statusFilter === 'expired' && !isExpired) return false;

    if (!searchTerm.trim()) return true;

    const term = searchTerm.toLowerCase().trim();
    return (
      job.title.toLowerCase().includes(term) ||
      job.companyName.toLowerCase().includes(term) ||
      job.country.toLowerCase().includes(term) ||
      (job.city && job.city.toLowerCase().includes(term)) ||
      (job.skills && job.skills.some((s) => s.toLowerCase().includes(term)))
    );
  });

  const handleUnsave = async (e: React.MouseEvent, jobId: string) => {
    e.stopPropagation();
    setIsRemovingId(jobId);
    try {
      await onUnsaveJob(jobId);
    } finally {
      setIsRemovingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shadow-xs">
            <Bookmark className="w-6 h-6 fill-emerald-700" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">الوظائف المحفوظة</h1>
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">
                {savedJobs.length} {savedJobs.length === 1 ? 'وظيفة' : 'وظائف'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              قائمة الفرص التي قمت بحفظها للرجوع إليها أو التقديم عليها لاحقاً
            </p>
          </div>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-3">
          {savedJobs.length > 0 && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>إفراغ القائمة</span>
            </button>
          )}

          <button
            onClick={onExploreJobs}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            <span>استعراض المزيد من الوظائف</span>
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Clear Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-xl border border-slate-200 space-y-4 text-right">
            <div className="flex items-center gap-3 text-rose-700">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">إفراغ الوظائف المحفوظة؟</h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              سيتم حذف جميع الوظائف المحفوظة ({savedJobs.length} وظيفة) من متصفحك. يمكنك إعادة حفظ أي وظيفة في أي وقت.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={async () => {
                  await onClearAllSaved();
                  setShowClearConfirm(false);
                }}
                className="px-4 py-2 text-xs font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors cursor-pointer"
              >
                تأكيد الإفراغ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {savedJobs.length === 0 ? (
        /* Empty State */
        <div className="mt-12 bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center max-w-xl mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-100">
            <Bookmark className="w-8 h-8 stroke-[1.5]" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">لا توجد وظائف محفوظة حتى الآن</h2>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-md mx-auto">
            أثناء تصفحك لأحدث الوظائف الشاغرة في السعودية ودول الخليج، اضغط على أيقونة الحفظ (🔖) في أي بطاقة وظيفية للاحتفاظ بها هنا ومراجعتها متى شئت.
          </p>
          <div className="pt-2">
            <button
              onClick={onExploreJobs}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              <span>تصفح أحدث الوظائف الآن</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {/* Search & Filter Bar */}
          <div className="bg-white rounded-xl border border-slate-200 p-3.5 flex flex-col md:flex-row items-center justify-between gap-3 shadow-2xs">
            {/* Search input */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ابحث في وظائفك المحفوظة..."
                className="w-full pl-3 pr-10 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-slate-800"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                >
                  مسح
                </button>
              )}
            </div>

            {/* Filter pills */}
            <div className="flex items-center gap-2 w-full md:w-auto text-xs">
              <span className="text-slate-500 hidden sm:inline-block">تصفية:</span>
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                الكل ({savedJobs.length})
              </button>
              <button
                onClick={() => setStatusFilter('active')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  statusFilter === 'active'
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                سارية ومتاحة
              </button>
              <button
                onClick={() => setStatusFilter('expired')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  statusFilter === 'expired'
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                منتهية الصلاحية
              </button>
            </div>
          </div>

          {/* Cards Grid */}
          {filteredJobs.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500 text-sm">
              لم يتم العثور على وظائف مطابقة لبحثك في قائمة المحفوظات.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredJobs.map((job) => {
                const isExpired = job.status === 'expired' || isJobExpiredByDate(job.validThrough);
                const isPaused = job.status === 'paused';
                const salaryInfo = formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency);
                const locationText = formatLocation(job);
                const workModeText = getWorkModeLabel(job.workMode);
                const employmentTypeText = getEmploymentTypeLabel(job.employmentType);
                const experienceText = formatExperience(job.experienceMin, job.experienceMax);

                return (
                  <article
                    key={job.id}
                    onClick={() => onSelectJob(job)}
                    className="group relative bg-white border border-slate-200 hover:border-emerald-600 rounded-xl p-5 transition-all duration-200 hover:shadow-sm cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-lg bg-slate-100 border border-slate-200/60 flex items-center justify-center text-slate-600 font-semibold text-base shrink-0 group-hover:border-emerald-200 group-hover:bg-emerald-50/50 transition-colors">
                            {job.companyLogo ? (
                              <img
                                src={job.companyLogo}
                                alt={job.companyName}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-contain rounded-lg"
                              />
                            ) : (
                              <Building2 className="w-5 h-5 text-slate-500 group-hover:text-emerald-700 transition-colors" />
                            )}
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors">
                              {job.companyName}
                            </h4>
                            <div className="text-xs text-slate-500 mt-0.5">
                              {locationText}
                            </div>
                          </div>
                        </div>

                        {/* Unsave button */}
                        <button
                          type="button"
                          onClick={(e) => handleUnsave(e, job.id)}
                          disabled={isRemovingId === job.id}
                          title="إزالة من المحفوظات"
                          aria-label="إزالة من المحفوظات"
                          className="p-2 rounded-lg text-emerald-700 bg-emerald-50 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer shrink-0"
                        >
                          <Bookmark className="w-4 h-4 fill-emerald-700 hover:fill-rose-600 transition-colors" />
                        </button>
                      </div>

                      {/* Status Alerts if Expired or Paused */}
                      {isExpired && (
                        <div className="mb-2.5 px-2.5 py-1 rounded bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 shrink-0" />
                          <span>انتهت فترة التقديم على هذه الوظيفة</span>
                        </div>
                      )}

                      {isPaused && (
                        <div className="mb-2.5 px-2.5 py-1 rounded bg-slate-100 border border-slate-200 text-slate-700 text-xs flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>الوظيفة معلقة مؤقتاً من قِبل جهة التوظيف</span>
                        </div>
                      )}

                      {/* Job Title */}
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors mb-2 leading-snug">
                        {job.title}
                      </h3>

                      {/* Meta Pills / Zero-Pill Specs */}
                      <div className="flex flex-wrap items-center gap-y-1 text-xs text-slate-600 mb-3">
                        <span className="font-medium text-slate-800">{workModeText}</span>
                        <span className="text-slate-300 mx-2">·</span>
                        <span>{employmentTypeText}</span>
                        <span className="text-slate-300 mx-2">·</span>
                        <span>{experienceText}</span>
                      </div>

                      {/* Snippet */}
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4">
                        {job.description}
                      </p>
                    </div>

                    {/* Bottom Metadata & CTA */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold ${salaryInfo.isDisclosed ? 'text-emerald-800' : 'text-slate-500'}`}>
                          {salaryInfo.text}
                        </span>
                        <span className="text-slate-300">·</span>
                        <span className="text-slate-500">{formatArabicRelativeDate(job.datePosted)}</span>
                      </div>

                      <div className="flex items-center gap-1 text-emerald-700 font-semibold group-hover:text-emerald-800">
                        <span>عرض التفاصيل</span>
                        <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
