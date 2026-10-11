/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ============================================================================
 * SUITABLE JOBS VIEW (وظائف مناسبة لي) - PHASE 4.1
 * ============================================================================
 * Dedicated personalized jobs view ranking public opportunities by deterministic
 * compatibility against the job seeker's professional profile.
 */

import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  User,
  Sliders,
  ChevronLeft,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Scale,
  ArrowRight,
} from 'lucide-react';
import { Job } from '../../types/job';
import { JobSeekerProfile } from '../../types/profile';
import { getSuitableJobs, SuitableJobItem } from '../../services/suitableJobsService';
import { generateJobSlug } from '../../utils/slugUtils';
import { JobCard } from './JobCard';

interface SuitableJobsViewProps {
  profile: JobSeekerProfile | null;
  jobs: Job[];
  savedJobIds: string[];
  onSelectJob: (job: Job) => void;
  onToggleSaveJob: (jobId: string) => void;
  onOpenProfile: () => void;
  onExploreAll: () => void;
}

export const SuitableJobsView: React.FC<SuitableJobsViewProps> = ({
  profile,
  jobs,
  savedJobIds,
  onSelectJob,
  onToggleSaveJob,
  onOpenProfile,
  onExploreAll,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState<'all' | 'strong' | 'good' | 'partial'>('all');

  // Compute suitable jobs deterministically using existing matching service
  const suitableItems = useMemo(() => {
    return getSuitableJobs(profile, jobs);
  }, [profile, jobs]);

  // Filter items by local search and tier
  const filteredItems = useMemo(() => {
    return suitableItems.filter((item) => {
      // Tier filter
      if (tierFilter === 'strong' && item.compatibility.matchPercentage < 80) return false;
      if (tierFilter === 'good' && (item.compatibility.matchPercentage < 60 || item.compatibility.matchPercentage >= 80)) return false;
      if (tierFilter === 'partial' && (item.compatibility.matchPercentage < 40 || item.compatibility.matchPercentage >= 60)) return false;

      // Search term
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase().trim();
      return (
        item.job.title.toLowerCase().includes(term) ||
        item.job.companyName.toLowerCase().includes(term) ||
        item.job.country.toLowerCase().includes(term) ||
        (item.job.city && item.job.city.toLowerCase().includes(term)) ||
        (item.job.skills && item.job.skills.some((s) => s.toLowerCase().includes(term)))
      );
    });
  }, [suitableItems, searchTerm, tierFilter]);

  // Quick stats
  const strongMatchesCount = useMemo(() => {
    return suitableItems.filter((i) => i.compatibility.matchPercentage >= 80).length;
  }, [suitableItems]);

  const goodMatchesCount = useMemo(() => {
    return suitableItems.filter((i) => i.compatibility.matchPercentage >= 60 && i.compatibility.matchPercentage < 80).length;
  }, [suitableItems]);

  // If user has NO profile
  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center space-y-6 animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto border border-amber-200 shadow-xs">
          <Sparkles className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">وظائف مناسبة لي</h1>
          <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
            أنشئ ملفك المهني أولاً لتحصل على وظائف متوافقة مع خبراتك ومهاراتك.
          </p>
        </div>

        <div className="p-6 bg-white rounded-2xl border border-slate-200 max-w-md mx-auto space-y-4 shadow-xs text-right text-xs text-slate-600">
          <div className="font-semibold text-slate-800 text-sm border-b border-slate-100 pb-2">
            ماذا يقدم لك محرك التوافق الوظيفي؟
          </div>
          <ul className="space-y-2 pr-4 list-disc">
            <li>مقارنة موضوعية دقيقة بين مهاراتك وشروط الوظائف المعلنة.</li>
            <li>ترتيب تلقائي للفرص حسب نسبة التوافق الفعلي دون تخمين.</li>
            <li>تحديد نقاط القوة والنواقص لكل وظيفة وفق نظام 100 نقطة الشفاف.</li>
          </ul>

          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={onOpenProfile}
              className="w-full py-2.5 text-sm font-semibold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white transition-colors cursor-pointer shadow-xs"
            >
              إنشاء ملفي المهني
            </button>
            <button
              onClick={onExploreAll}
              className="w-full py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              تصفح الوظائف العامة أولاً
            </button>
          </div>
        </div>
      </div>
    );
  }

  // User HAS profile -> Show personalized ranked list
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header Banner */}
      <div className="bg-linear-to-l from-emerald-900 via-emerald-800 to-teal-900 text-white rounded-2xl p-6 sm:p-7 shadow-sm border border-emerald-800 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-800/90 text-emerald-200 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>محرك التوافق الحتمي (Phase 4.1)</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold">وظائف مناسبة لي</h1>
            <p className="text-xs sm:text-sm text-emerald-100 max-w-2xl leading-relaxed">
              وظائف مرتبة حسب درجة توافقها مع ملفك المهني (<span className="font-semibold text-white">{profile.fullName}</span>).
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={onOpenProfile}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold rounded-lg bg-emerald-800 hover:bg-emerald-700 text-emerald-100 transition-colors cursor-pointer border border-emerald-700"
            >
              <User className="w-3.5 h-3.5 text-emerald-300" />
              <span>تحديث بيانات ملفي</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Highlights Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-slate-400 block mb-1">إجمالي الوظائف المحللة</span>
          <span className="text-2xl font-bold text-slate-900 tabular-nums">
            {suitableItems.length}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-slate-400 block mb-1">توافق قوي (80%+ )</span>
          <span className="text-2xl font-bold text-emerald-700 tabular-nums">
            {strongMatchesCount}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-slate-400 block mb-1">توافق جيد (60% - 79%)</span>
          <span className="text-2xl font-bold text-teal-700 tabular-nums">
            {goodMatchesCount}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-slate-400 block mb-1">أعلى درجة توافق</span>
          <span className="text-2xl font-bold text-emerald-800 tabular-nums">
            {suitableItems.length > 0 ? `${suitableItems[0].compatibility.matchPercentage}%` : '0%'}
          </span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-3.5 flex flex-col md:flex-row items-center justify-between gap-3 shadow-2xs">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ابحث في الوظائف المناسبة..."
            className="w-full pl-3 pr-10 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-800"
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

        {/* Tier Filter Buttons */}
        <div className="flex items-center gap-2 w-full md:w-auto text-xs overflow-x-auto">
          <span className="text-slate-500 shrink-0 hidden sm:inline">درجة التوافق:</span>
          <button
            onClick={() => setTierFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
              tierFilter === 'all'
                ? 'bg-emerald-700 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            الكل ({suitableItems.length})
          </button>
          <button
            onClick={() => setTierFilter('strong')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
              tierFilter === 'strong'
                ? 'bg-emerald-700 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            توافق قوي (80%+ )
          </button>
          <button
            onClick={() => setTierFilter('good')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
              tierFilter === 'good'
                ? 'bg-emerald-700 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            توافق جيد (60% - 79%)
          </button>
          <button
            onClick={() => setTierFilter('partial')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
              tierFilter === 'partial'
                ? 'bg-emerald-700 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            توافق جزئي (40% - 59%)
          </button>
        </div>
      </div>

      {/* Ranked Job Cards Feed */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4 max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">
            لم يتم العثور على وظائف مطابقة لهذا الفلتر
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            جرّب تخفيف معايير التصفية أو مراجعة كافة الوظائف المناسبة بدون حصر على درجة توافق معينة.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setTierFilter('all');
            }}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            إعادة ضبط الفلاتر
          </button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredItems.map((item) => (
            <JobCard
              key={item.job.id}
              job={item.job}
              onSelect={onSelectJob}
              isSaved={savedJobIds.includes(item.job.id)}
              onToggleSave={(jobId) => onToggleSaveJob(jobId)}
              compatibilityScore={item.compatibility.matchPercentage}
              compatibilityLevelLabel={item.compatibility.overallLevelLabelAr}
              slug={generateJobSlug(item.job, jobs)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
