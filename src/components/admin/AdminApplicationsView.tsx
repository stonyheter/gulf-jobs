/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ============================================================================
 * ADMIN JOB APPLICATIONS MANAGEMENT VIEW (PHASE 7)
 * ============================================================================
 * Allows authorized employers and admins to review candidate submissions,
 * download verified private CVs, inspect cover letters, and update recruitment statuses.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Send,
  Briefcase,
  Search,
  Filter,
  User as UserIcon,
  Download,
  FileText,
  Clock,
  Sparkles,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Eye,
  AlertCircle,
  Building2,
  Calendar,
  ChevronDown,
  RefreshCw,
  Mail,
} from 'lucide-react';
import { User } from '../../types/auth';
import { Job } from '../../types/job';
import { Application, ApplicationStatus } from '../../types/application';
import { applicationService, JobApplicantSummary } from '../../services/applicationService';
import { formatArabicFullDate, formatArabicRelativeDate } from '../../utils/date';
import { formatLocation } from '../../utils/formatters';

interface AdminApplicationsViewProps {
  currentUser: User | null;
  jobs: Job[];
  onSelectJob?: (job: Job) => void;
}

export const AdminApplicationsView: React.FC<AdminApplicationsViewProps> = ({
  currentUser,
  jobs,
  onSelectJob,
}) => {
  const [allApplications, setAllApplications] = useState<
    Array<{
      application: Application;
      applicant: User | null;
      cvFile: any | null;
      cvDownloadUrl?: string;
      job: Job | null;
    }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCoverLetter, setSelectedCoverLetter] = useState<{
    candidateName: string;
    jobTitle: string;
    text: string;
  } | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load all applications across jobs
  const loadApplications = async () => {
    if (!currentUser) return;
    setLoading(true);
    setFeedbackMsg(null);

    try {
      // Gather applications for all jobs
      const jobsMap = new Map<string, Job>();
      jobs.forEach((j) => jobsMap.set(j.id, j));

      const aggregated: Array<{
        application: Application;
        applicant: User | null;
        cvFile: any | null;
        cvDownloadUrl?: string;
        job: Job | null;
      }> = [];

      for (const job of jobs) {
        try {
          const jobApps = await applicationService.getJobApplications(currentUser, job.id);
          jobApps.forEach((item) => {
            aggregated.push({
              ...item,
              job,
            });
          });
        } catch (e) {
          // Ignore individual job permission errors
        }
      }

      setAllApplications(aggregated);
    } catch (err: any) {
      console.warn('Failed to load applications', err);
      setFeedbackMsg({ type: 'error', text: err.message || 'فشل في استرجاع طلبات التوظيف.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, [currentUser, jobs]);

  // Handle status update
  const handleStatusChange = async (appId: string, newStatus: ApplicationStatus) => {
    if (!currentUser) return;
    setUpdatingId(appId);
    setFeedbackMsg(null);

    try {
      await applicationService.updateApplicationStatus(currentUser, appId, newStatus);
      setFeedbackMsg({ type: 'success', text: `تم تحديث حالة الطلب إلى "${getStatusLabel(newStatus)}" بنجاح.` });
      // Update local state directly for speed
      setAllApplications((prev) =>
        prev.map((item) =>
          item.application.id === appId
            ? { ...item, application: { ...item.application, status: newStatus } }
            : item
        )
      );
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'فشل في تحديث حالة الطلب.' });
    } finally {
      setUpdatingId(null);
    }
  };

  // Helper for status label
  const getStatusLabel = (status: ApplicationStatus) => {
    switch (status) {
      case 'pending':
        return 'قيد الانتظار';
      case 'reviewing':
        return 'جاري التدقيق';
      case 'shortlisted':
        return 'القائمة المختصرة';
      case 'interview':
        return 'مرشح للمقابلة';
      case 'accepted':
        return 'مقبول';
      case 'rejected':
        return 'تم الاعتذار';
      case 'withdrawn':
        return 'تم السحب من المتقدم';
      default:
        return status;
    }
  };

  // Status badge styling
  const getStatusBadgeClass = (status: ApplicationStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'reviewing':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'shortlisted':
        return 'bg-teal-50 text-teal-800 border-teal-200';
      case 'interview':
        return 'bg-purple-50 text-purple-800 border-purple-200 font-bold';
      case 'accepted':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200 font-bold';
      case 'rejected':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      case 'withdrawn':
        return 'bg-slate-100 text-slate-600 border-slate-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  // Filtered applications
  const filteredList = useMemo(() => {
    return allApplications.filter((item) => {
      // Filter by job
      if (selectedJobId !== 'all' && item.application.jobId !== selectedJobId) {
        return false;
      }
      // Filter by status
      if (selectedStatus !== 'all' && item.application.status !== selectedStatus) {
        return false;
      }
      // Filter by search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const applicantName = item.applicant?.displayName?.toLowerCase() || '';
        const applicantEmail = item.applicant?.email?.toLowerCase() || '';
        const jobTitle = item.job?.title?.toLowerCase() || '';
        const companyName = item.job?.companyName?.toLowerCase() || '';
        const matches =
          applicantName.includes(q) ||
          applicantEmail.includes(q) ||
          jobTitle.includes(q) ||
          companyName.includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [allApplications, selectedJobId, selectedStatus, searchQuery]);

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Send className="w-5 h-5 text-emerald-700" />
            <span>إدارة طلبات التوظيف والسير الذاتية (Applications & ATS)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            متابعة طلبات المرشحين، فحص السير الذاتية المرفقة، وتحديث مراحل الفرز والمقابلة.
          </p>
        </div>

        <button
          onClick={loadApplications}
          disabled={loading}
          className="self-start sm:self-center px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>تحديث القائمة</span>
        </button>
      </div>

      {/* Feedback Alert */}
      {feedbackMsg && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 animate-in fade-in ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          {feedbackMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Search */}
        <div className="relative md:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute top-3 right-3" />
          <input
            type="text"
            placeholder="البحث باسم المرشح، البريد، أو مسمى الوظيفة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-3 pr-9 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-800 placeholder:text-slate-400"
          />
        </div>

        {/* Filter by Job */}
        <div>
          <select
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
            className="w-full p-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-800 cursor-pointer bg-white"
          >
            <option value="all">كافة الوظائف المعلنة ({jobs.length})</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title} ({j.companyName})
              </option>
            ))}
          </select>
        </div>

        {/* Filter by Status */}
        <div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full p-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-800 cursor-pointer bg-white"
          >
            <option value="all">كافة الحالات</option>
            <option value="pending">قيد الانتظار (pending)</option>
            <option value="reviewing">جاري التدقيق (reviewing)</option>
            <option value="shortlisted">القائمة المختصرة (shortlisted)</option>
            <option value="interview">مرشح للمقابلة (interview)</option>
            <option value="accepted">مقبول (accepted)</option>
            <option value="rejected">تم الاعتذار (rejected)</option>
            <option value="withdrawn">مسحوب (withdrawn)</option>
          </select>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            جاري فحص واسترجاع طلبات التوظيف...
          </div>
        ) : filteredList.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Send className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-700">لا توجد طلبات توظيف تطابق معايير الفلترة الحالية</p>
            <p className="text-xs text-slate-400">ستظهر الطلبات الجديدة تلقائياً فور تقديم المرشحين عبر المنصة.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-3.5 px-4">مقدم الطلب</th>
                  <th className="py-3.5 px-4">الوظيفة والمنشأة</th>
                  <th className="py-3.5 px-4">السيرة الذاتية</th>
                  <th className="py-3.5 px-4">خطاب التقديم</th>
                  <th className="py-3.5 px-4">تاريخ التقديم</th>
                  <th className="py-3.5 px-4">الحالة والمرحلة</th>
                  <th className="py-3.5 px-4">تغيير الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredList.map((item) => {
                  const { application, applicant, cvFile, cvDownloadUrl, job } = item;
                  return (
                    <tr key={application.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Applicant info */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <UserIcon className="w-3.5 h-3.5 text-emerald-700" />
                            <span>{applicant?.displayName || 'مرشح'}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span>{applicant?.email || application.applicantUserId}</span>
                          </div>
                        </div>
                      </td>

                      {/* Job info */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5 max-w-xs">
                          <span className="font-bold text-slate-900 block truncate" title={job?.title}>
                            {job?.title || `معرف #${application.jobId}`}
                          </span>
                          <span className="text-[11px] text-slate-500 block truncate">
                            {job?.companyName} • {job ? formatLocation(job) : ''}
                          </span>
                        </div>
                      </td>

                      {/* Attached CV */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {cvDownloadUrl ? (
                          <a
                            href={cvDownloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 hover:bg-emerald-100 font-semibold transition-colors cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5 text-emerald-700" />
                            <span>{cvFile?.fileName || 'تحميل CV'}</span>
                          </a>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">غير مرفق</span>
                        )}
                      </td>

                      {/* Cover letter */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {application.coverLetter ? (
                          <button
                            onClick={() =>
                              setSelectedCoverLetter({
                                candidateName: applicant?.displayName || 'المرشح',
                                jobTitle: job?.title || 'الوظيفة',
                                text: application.coverLetter!,
                              })
                            }
                            className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-900 font-medium hover:underline cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>قراءة الخطاب</span>
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[11px]">-</span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="text-slate-700 block font-medium">
                          {formatArabicRelativeDate(application.createdAt)}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(application.createdAt).toLocaleDateString('ar-SA')}
                        </span>
                      </td>

                      {/* Current Status Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-semibold border ${getStatusBadgeClass(
                            application.status
                          )}`}
                        >
                          {getStatusLabel(application.status)}
                        </span>
                      </td>

                      {/* Quick Status Change Dropdown */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <select
                          value={application.status}
                          disabled={updatingId === application.id}
                          onChange={(e) =>
                            handleStatusChange(application.id, e.target.value as ApplicationStatus)
                          }
                          className="p-1.5 text-[11px] border border-slate-200 rounded-lg bg-white text-slate-800 font-medium focus:ring-1 focus:ring-emerald-600 focus:outline-none cursor-pointer disabled:opacity-50"
                        >
                          <option value="pending">قيد الانتظار</option>
                          <option value="reviewing">جاري التدقيق</option>
                          <option value="shortlisted">قائمة مختصرة</option>
                          <option value="interview">مقابلة عمل</option>
                          <option value="accepted">مقبول</option>
                          <option value="rejected">اعتذار</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Cover Letter Modal View */}
      {selectedCoverLetter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">خطاب التقديم والرسالة التعريفية</h3>
                <p className="text-xs text-slate-500">
                  من: <span className="font-semibold text-slate-700">{selectedCoverLetter.candidateName}</span> للوظيفة:{' '}
                  <span className="font-semibold text-slate-700">{selectedCoverLetter.jobTitle}</span>
                </p>
              </div>
              <button
                onClick={() => setSelectedCoverLetter(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-700 leading-relaxed whitespace-pre-wrap max-h-80 overflow-y-auto font-sans">
              {selectedCoverLetter.text}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedCoverLetter(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
