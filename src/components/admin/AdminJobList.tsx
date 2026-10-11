/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ============================================================================
 * ADMIN JOB LIST & MANAGEMENT INTERFACE
 * ============================================================================
 * Supports comprehensive filtering (status, country, region, city, category),
 * search, sorting, and full row-level management actions.
 */

import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Plus,
  Eye,
  FileEdit,
  PauseCircle,
  PlayCircle,
  AlertTriangle,
  Copy,
  Trash2,
  RotateCcw,
  CheckCircle2,
  Clock,
  Building2,
  Calendar,
} from 'lucide-react';
import { Job, JobStatus } from '../../types/job';
import { GCC_COUNTRIES } from '../../data/geoHierarchy';
import { CountryNode, RegionNode, CityNode } from '../../types/geo';
import { FEATURED_CATEGORIES } from '../../config/categories';
import { formatLocation, formatSalary } from '../../utils/formatters';
import { formatArabicRelativeDate, formatArabicFullDate } from '../../utils/date';

interface AdminJobListProps {
  jobs: Job[];
  initialStatusFilter?: JobStatus | 'all';
  onAddNewJob: () => void;
  onPreviewJob: (job: Job) => void;
  onEditJob: (job: Job) => void;
  onPublishJob: (id: string) => Promise<void>;
  onPauseJob: (id: string) => Promise<void>;
  onExpireJob: (id: string) => Promise<void>;
  onDuplicateJob: (id: string) => Promise<void>;
  onDeleteJob: (id: string) => Promise<void>;
}

export const AdminJobList: React.FC<AdminJobListProps> = ({
  jobs,
  initialStatusFilter = 'all',
  onAddNewJob,
  onPreviewJob,
  onEditJob,
  onPublishJob,
  onPauseJob,
  onExpireJob,
  onDuplicateJob,
  onDeleteJob,
}) => {
  // Local Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<JobStatus | 'all'>(initialStatusFilter);
  const [countryFilter, setCountryFilter] = useState<string>('');
  const [regionFilter, setRegionFilter] = useState<string>('');
  const [cityFilter, setCityFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');

  // Country -> Region -> City cascades
  const currentCountryObj: CountryNode | undefined = GCC_COUNTRIES.find(
    (c) =>
      c.code === countryFilter ||
      c.commonNameAr === countryFilter ||
      c.nameAr === countryFilter
  );
  const availableRegions: RegionNode[] = currentCountryObj ? currentCountryObj.regions : [];

  const currentRegionObj: RegionNode | undefined = availableRegions.find(
    (r) => r.nameAr === regionFilter || r.id === regionFilter
  );
  const availableCities: CityNode[] = currentRegionObj ? currentRegionObj.cities : [];

  const handleCountryChange = (c: string) => {
    setCountryFilter(c);
    setRegionFilter('');
    setCityFilter('');
  };

  const handleRegionChange = (r: string) => {
    setRegionFilter(r);
    setCityFilter('');
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setCountryFilter('');
    setRegionFilter('');
    setCityFilter('');
    setCategoryFilter('all');
    setSortBy('newest');
  };

  // Filter and sort jobs in-memory
  const filteredJobs = useMemo(() => {
    let result = [...jobs];

    // Search query
    if (searchTerm.trim() !== '') {
      const q = searchTerm.toLowerCase().trim();
      result = result.filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          j.companyName.toLowerCase().includes(q) ||
          j.description.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((j) => j.status === statusFilter);
    }

    // Country filter
    if (countryFilter) {
      result = result.filter(
        (j) =>
          j.country.includes(countryFilter) ||
          (currentCountryObj && j.country.includes(currentCountryObj.commonNameAr))
      );
    }

    // Region filter
    if (regionFilter) {
      result = result.filter((j) => j.region && j.region.includes(regionFilter));
    }

    // City filter
    if (cityFilter) {
      result = result.filter((j) => j.city && j.city.includes(cityFilter));
    }

    // Category filter
    if (categoryFilter !== 'all') {
      result = result.filter((j) => j.category === categoryFilter);
    }

    // Sort
    result.sort((a, b) => {
      const dateA = new Date(a.datePosted).getTime();
      const dateB = new Date(b.datePosted).getTime();
      return sortBy === 'oldest' ? dateA - dateB : dateB - dateA;
    });

    return result;
  }, [
    jobs,
    searchTerm,
    statusFilter,
    countryFilter,
    regionFilter,
    cityFilter,
    categoryFilter,
    sortBy,
    currentCountryObj,
  ]);

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
    <div className="space-y-6">
      {/* Page Title & Add Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            إدارة الوظائف (Jobs Management)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            إجمالي {jobs.length} وظيفة مسجلة في قاعدة التطوير — عرض {filteredJobs.length} مطابقة للتصفية
          </p>
        </div>

        <button
          onClick={onAddNewJob}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة وظيفة جديدة</span>
        </button>
      </div>

      {/* Filter & Search Bar Card */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Keyword Search */}
          <div className="relative">
            <div className="absolute right-3.5 top-3 text-slate-400 pointer-events-none">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="البحث بالوظيفة أو المنشأة..."
              className="w-full pr-10 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-600"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-600 font-medium"
            >
              <option value="all">كافة الحالات (All Statuses)</option>
              <option value="published">منشورة (Published)</option>
              <option value="pending_review">بانتظار المراجعة (Pending Review)</option>
              <option value="draft">مسودة (Draft)</option>
              <option value="paused">متوقفة مؤقتاً (Paused)</option>
              <option value="expired">منتهية (Expired)</option>
              <option value="rejected">مرفوضة (Rejected)</option>
              <option value="duplicate">مكررة (Duplicate)</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-600"
            >
              <option value="all">كافة التخصصات (All Categories)</option>
              {FEATURED_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nameAr}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-600 font-medium"
            >
              <option value="newest">الترتيب: الأحدث أولاً</option>
              <option value="oldest">الترتيب: الأقدم أولاً</option>
            </select>
          </div>
        </div>

        {/* Second Row: Geographic Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
          {/* Country */}
          <div>
            <select
              value={countryFilter}
              onChange={(e) => handleCountryChange(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-600"
            >
              <option value="">كافة الدول (All Countries)</option>
              {GCC_COUNTRIES.map((c) => (
                <option key={c.code} value={c.commonNameAr}>
                  {c.flagEmoji} {c.commonNameAr}
                </option>
              ))}
            </select>
          </div>

          {/* Region */}
          <div>
            <select
              value={regionFilter}
              disabled={availableRegions.length === 0}
              onChange={(e) => handleRegionChange(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-600 disabled:opacity-50"
            >
              <option value="">
                {countryFilter ? 'كافة المناطق / المحافظات' : 'اختر الدولة أولاً'}
              </option>
              {availableRegions.map((r) => (
                <option key={r.id} value={r.nameAr}>
                  {r.nameAr}
                </option>
              ))}
            </select>
          </div>

          {/* City & Reset button */}
          <div className="flex items-center gap-2">
            <select
              value={cityFilter}
              disabled={availableCities.length === 0}
              onChange={(e) => setCityFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-600 disabled:opacity-50"
            >
              <option value="">
                {regionFilter ? 'كافة المدن' : 'اختر المنطقة'}
              </option>
              {availableCities.map((c) => (
                <option key={c.id} value={c.nameAr}>
                  {c.nameAr}
                </option>
              ))}
            </select>

            <button
              onClick={handleResetFilters}
              title="إعادة ضبط الفلاتر"
              className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-emerald-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer shrink-0 flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>تصفير</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50/80 text-slate-600 border-b border-slate-200 font-semibold">
              <tr>
                <th className="px-6 py-3.5">المسمى الوظيفي والمنشأة</th>
                <th className="px-4 py-3.5">الموقع والتدرج الجغرافي</th>
                <th className="px-4 py-3.5">الحالة</th>
                <th className="px-4 py-3.5">طريقة التقديم</th>
                <th className="px-4 py-3.5">تاريخ النشر</th>
                <th className="px-4 py-3.5">تاريخ الانتهاء</th>
                <th className="px-6 py-3.5 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredJobs.length > 0 ? (
                filteredJobs.map((job) => {
                  const locationText = formatLocation(job);
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

                      <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap">
                        {job.applicationMethod === 'external_url' && 'رابط خارجي'}
                        {job.applicationMethod === 'email' && 'بريد إلكتروني'}
                        {job.applicationMethod === 'direct' && 'تقديم مباشر'}
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
                            title="معاينة الوظيفة في العرض العام"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => onEditJob(job)}
                            title="تعديل بيانات الوظيفة"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-700 hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            <FileEdit className="w-4 h-4" />
                          </button>

                          {/* Publish / Pause */}
                          {job.status === 'published' ? (
                            <button
                              onClick={() => onPauseJob(job.id)}
                              title="إيقاف النشر مؤقتاً"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-amber-700 hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                              <PauseCircle className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => onPublishJob(job.id)}
                              title="نشر الوظيفة بعد التحقق"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                              <PlayCircle className="w-4 h-4" />
                            </button>
                          )}

                          {/* Expire */}
                          {job.status !== 'expired' && (
                            <button
                              onClick={() => onExpireJob(job.id)}
                              title="وسم الوظيفة كمنتهية الصلاحية"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-purple-700 hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                              <AlertTriangle className="w-4 h-4" />
                            </button>
                          )}

                          {/* Duplicate */}
                          <button
                            onClick={() => onDuplicateJob(job.id)}
                            title="نسخ وتكرار الوظيفة كمسودة جديدة"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-700 hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            <Copy className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => {
                              if (window.confirm(`هل أنت متأكد من حذف الوظيفة «${job.title}»؟`)) {
                                onDeleteJob(job.id);
                              }
                            }}
                            title="حذف السجل"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-700 hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500 text-xs">
                    لم يتم العثور على أي وظائف مطابقة لمعايير البحث والتصفية المختارة.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
