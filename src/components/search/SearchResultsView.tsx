/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Filter, X, Search, MapPin, Briefcase, Sparkles } from 'lucide-react';
import { Job } from '../../types/job';
import { JobFilterState } from '../../types/filters';
import { JobSeekerProfile } from '../../types/profile';
import { analyzeJobCompatibility } from '../../services/matchingService';
import { generateJobSlug } from '../../utils/slugUtils';
import { JobCard } from '../jobs/JobCard';
import { FilterSidebar } from './FilterSidebar';

interface SearchResultsViewProps {
  jobs: Job[];
  totalResults: number;
  filters: JobFilterState;
  onFilterChange: (updates: Partial<JobFilterState>) => void;
  onResetFilters: () => void;
  onSelectJob: (job: Job) => void;
  savedJobIds?: string[];
  onToggleSave?: (jobId: string) => void;
  userProfile?: JobSeekerProfile | null;
  onOpenProfile?: () => void;
}

export const SearchResultsView: React.FC<SearchResultsViewProps> = ({
  jobs,
  totalResults,
  filters,
  onFilterChange,
  onResetFilters,
  onSelectJob,
  savedJobIds = [],
  onToggleSave,
  userProfile,
  onOpenProfile,
}) => {
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Active filter items for quick removal badges
  const activeTags: { label: string; clear: () => void }[] = [];

  if (filters.onlySuitable) {
    activeTags.push({
      label: 'الوظائف المناسبة لي',
      clear: () => onFilterChange({ onlySuitable: false }),
    });
  }

  if (filters.keyword) {
    activeTags.push({
      label: `الكلمة: "${filters.keyword}"`,
      clear: () => onFilterChange({ keyword: '' }),
    });
  }
  if (filters.country) {
    activeTags.push({
      label: `الدولة: ${filters.country}`,
      clear: () => onFilterChange({ country: '', region: '', city: '' }),
    });
  }
  if (filters.region) {
    activeTags.push({
      label: `المنطقة: ${filters.region}`,
      clear: () => onFilterChange({ region: '', city: '' }),
    });
  }
  if (filters.city) {
    activeTags.push({
      label: `المدينة: ${filters.city}`,
      clear: () => onFilterChange({ city: '' }),
    });
  }
  if (filters.workMode && filters.workMode !== 'all') {
    const map: Record<string, string> = {
      on_site: 'حضوري',
      remote: 'عن بُعد',
      hybrid: 'هجين',
    };
    activeTags.push({
      label: `طبيعة العمل: ${map[filters.workMode] || filters.workMode}`,
      clear: () => onFilterChange({ workMode: 'all' }),
    });
  }
  if (filters.experience && filters.experience !== 'all') {
    const map: Record<string, string> = {
      no_exp: 'بدون خبرة',
      '1-3': '1-3 سنوات',
      '3-5': '3-5 سنوات',
      '5+': '5+ سنوات',
    };
    activeTags.push({
      label: `الخبرة: ${map[filters.experience] || filters.experience}`,
      clear: () => onFilterChange({ experience: 'all' }),
    });
  }
  if (filters.hasSalaryOnly) {
    activeTags.push({
      label: 'رواتب معلنة فقط',
      clear: () => onFilterChange({ hasSalaryOnly: false }),
    });
  }

  // When 'onlySuitable' filter is enabled, calculate deterministic compatibility for each job
  // against the user's profile and sort by compatibility percentage descending.
  const suitableItems = useMemo(() => {
    if (!filters.onlySuitable || !userProfile) return null;
    const list = jobs
      .map((job) => {
        const comp = analyzeJobCompatibility(job, userProfile);
        return comp ? { job, comp } : null;
      })
      .filter((item): item is { job: Job; comp: NonNullable<ReturnType<typeof analyzeJobCompatibility>> } => item !== null);

    // Sort by compatibility percentage descending (highest first)
    list.sort((a, b) => b.comp.matchPercentage - a.comp.matchPercentage);
    return list;
  }, [jobs, filters.onlySuitable, userProfile]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Bar for Results View: Search Keyword Input + Results count + Mobile filter button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            نتائج البحث والشواغر المتاحة
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            تم العثور على <span className="font-semibold text-emerald-800">{filters.onlySuitable && suitableItems ? suitableItems.length : totalResults}</span> وظيفة مطابقة لمعايير البحث
            {filters.onlySuitable && ' (مرتبة حسب درجة التوافق)'}
          </p>
        </div>

        {/* Mobile Filter Button */}
        <div className="flex items-center gap-2 lg:hidden">
          <button
            onClick={() => setMobileFilterOpen(true)}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 shadow-xs cursor-pointer"
          >
            <Filter className="w-4 h-4 text-emerald-700" />
            <span>تصفية وتحديد ({totalResults})</span>
          </button>
        </div>
      </div>

      {/* Active Tags Strip */}
      {activeTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-6 p-3 bg-slate-100/70 rounded-xl border border-slate-200/60">
          <span className="text-xs text-slate-500 font-medium">التصفيات المطبقة:</span>
          {activeTags.map((tag, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-xs text-slate-700 shadow-2xs"
            >
              <span>{tag.label}</span>
              <button
                type="button"
                onClick={tag.clear}
                className="text-slate-400 hover:text-red-600 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={onResetFilters}
            className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold mr-auto cursor-pointer"
          >
            مسح الكل
          </button>
        </div>
      )}

      {/* Layout Grid: Sidebar + Results List */}
      <div className="flex flex-col lg:flex-row items-start gap-8">
        {/* Sidebar */}
        <FilterSidebar
          filters={filters}
          onChange={onFilterChange}
          onReset={onResetFilters}
          isOpenMobile={mobileFilterOpen}
          onCloseMobile={() => setMobileFilterOpen(false)}
          totalResults={totalResults}
          hasProfile={!!userProfile}
          onOpenProfile={onOpenProfile}
        />

        {/* Main Job Cards Feed */}
        <div className="flex-1 w-full space-y-4">
          {/* Missing profile banner if onlySuitable toggle is on without a profile */}
          {filters.onlySuitable && !userProfile && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs mb-4 shadow-2xs">
              <div className="flex items-center gap-2.5 text-amber-900 font-medium">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                <span>أنشئ ملفك المهني أولاً لتحصل على وظائف متوافقة مع خبراتك ومهاراتك.</span>
              </div>
              {onOpenProfile && (
                <button
                  onClick={onOpenProfile}
                  className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-lg shrink-0 transition-colors cursor-pointer shadow-2xs"
                >
                  إنشاء ملفي المهني
                </button>
              )}
            </div>
          )}

          {/* Render jobs list: Either suitableItems (when onlySuitable is active and user has profile) or normal jobs */}
          {filters.onlySuitable && suitableItems ? (
            suitableItems.length > 0 ? (
              <div className="space-y-3.5">
                {suitableItems.map((item) => (
                  <JobCard
                    key={item.job.id}
                    job={item.job}
                    onSelect={onSelectJob}
                    isSaved={savedJobIds.includes(item.job.id)}
                    onToggleSave={(jobId) => onToggleSave && onToggleSave(jobId)}
                    compatibilityScore={item.comp.matchPercentage}
                    compatibilityLevelLabel={item.comp.overallLevelLabelAr}
                    slug={generateJobSlug(item.job, jobs)}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
                  <Search className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">
                  لم يتم العثور على وظائف مطابقة
                </h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                  لا توجد وظائف مطابقة لمعايير البحث الحالية وخوارزمية التوافق. جرّب تخفيف الفلاتر أو مراجعة معايير ملفك المهني.
                </p>
                <button
                  onClick={onResetFilters}
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  إعادة ضبط خيارات البحث
                </button>
              </div>
            )
          ) : jobs.length > 0 ? (
            <div className="space-y-3.5">
              {jobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onSelect={onSelectJob}
                  isSaved={savedJobIds.includes(job.id)}
                  onToggleSave={(jobId) => onToggleSave && onToggleSave(jobId)}
                  slug={generateJobSlug(job, jobs)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">
                لم يتم العثور على وظائف مطابقة
              </h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                جرّب تخفيف معايير التصفية، اختيار مدينة أو دولة أخرى، أو مسح الكلمات الدلالية للوصول إلى كافة الشواغر.
              </p>
              <button
                onClick={onResetFilters}
                className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                إعادة ضبط خيارات البحث
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
