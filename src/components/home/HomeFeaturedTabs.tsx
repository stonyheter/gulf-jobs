/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sparkles, Calendar, Globe, GraduationCap, ArrowLeft } from 'lucide-react';
import { Job } from '../../types/job';
import { JobCard } from '../jobs/JobCard';
import { generateJobSlug } from '../../utils/slugUtils';

interface HomeFeaturedTabsProps {
  latestJobs: Job[];
  todayJobs: Job[];
  remoteJobs: Job[];
  entryLevelJobs: Job[];
  onSelectJob: (job: Job) => void;
  onViewMore: (categoryKey: string) => void;
  savedJobIds?: string[];
  onToggleSave?: (jobId: string) => void;
  onOpenSuitableJobs?: () => void;
}

export const HomeFeaturedTabs: React.FC<HomeFeaturedTabsProps> = ({
  latestJobs,
  todayJobs,
  remoteJobs,
  entryLevelJobs,
  onSelectJob,
  onViewMore,
  savedJobIds = [],
  onToggleSave,
  onOpenSuitableJobs,
}) => {
  const [activeTab, setActiveTab] = useState<'latest' | 'today' | 'remote' | 'entry'>('latest');

  const tabs = [
    {
      id: 'latest',
      label: 'أحدث الوظائف',
      icon: Sparkles,
      count: latestJobs.length,
      data: latestJobs,
      description: 'أحدث الفرص الوظيفية المنشورة في جميع دول الخليج',
    },
    {
      id: 'today',
      label: 'وظائف اليوم',
      icon: Calendar,
      count: todayJobs.length,
      data: todayJobs,
      description: 'وظائف تم نشرها وتحديثها خلال الـ 24 ساعة الماضية',
    },
    {
      id: 'remote',
      label: 'وظائف عن بُعد',
      icon: Globe,
      count: remoteJobs.length,
      data: remoteJobs,
      description: 'فرص عمل رقمية وعن بُعد متاحة لكافة المقيمين في دول الخليج',
    },
    {
      id: 'entry',
      label: 'وظائف بدون خبرة',
      icon: GraduationCap,
      count: entryLevelJobs.length,
      data: entryLevelJobs,
      description: 'فرص عمل للخريجين الجدد والباحثين عن بداية مسارهم المهني',
    },
  ];

  const currentTabObj = tabs.find((t) => t.id === activeTab) || tabs[0];

  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                استكشف الفرص الوظيفية
              </h2>
              {onOpenSuitableJobs && (
                <button
                  onClick={onOpenSuitableJobs}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold transition-colors cursor-pointer"
                  title="عرض الوظائف المتوافقة مع ملفك المهني"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                  <span>وظائف مناسبة لي</span>
                </button>
              )}
            </div>
            <p className="text-sm text-slate-500 mt-1">
              تصفح الوظائف حسب التحديث، نمط العمل، وسنوات الخبرة
            </p>
          </div>

          {/* Clean Segmented Tab Buttons (anti-slop: functional buttons, clear styling) */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto self-start md:self-auto max-w-full">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-white text-emerald-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-700' : 'text-slate-500'}`} />
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold tabular-nums ${
                      isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Context Kicker */}
        <div className="mb-6 flex items-center justify-between text-xs text-slate-500 border-b border-slate-100 pb-3">
          <span>{currentTabObj.description}</span>
          <button
            onClick={() => onViewMore(activeTab)}
            className="text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>عرض كافة وظائف {currentTabObj.label}</span>
            <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
          </button>
        </div>

        {/* Jobs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentTabObj.data.slice(0, 6).map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onSelect={onSelectJob}
              isSaved={savedJobIds.includes(job.id)}
              onToggleSave={(jobId) => onToggleSave && onToggleSave(jobId)}
              slug={generateJobSlug(job, currentTabObj.data)}
            />
          ))}
        </div>

        {currentTabObj.data.length === 0 && (
          <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500 text-sm">
            لا توجد شواغر حالياً تحت هذا التصنيف.
          </div>
        )}
      </div>
    </section>
  );
};
