/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Filter, X, RotateCcw, Sparkles } from 'lucide-react';
import { JobFilterState } from '../../types/filters';
import { GCC_COUNTRIES } from '../../data/geoHierarchy';

interface FilterSidebarProps {
  filters: JobFilterState;
  onChange: (updated: Partial<JobFilterState>) => void;
  onReset: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  totalResults: number;
  hasProfile?: boolean;
  onOpenProfile?: () => void;
}

export const FilterSidebar: React.FC<FilterSidebarProps> = ({
  filters,
  onChange,
  onReset,
  isOpenMobile,
  onCloseMobile,
  totalResults,
  hasProfile = false,
  onOpenProfile,
}) => {
  const content = (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-emerald-700" />
          <h3 className="font-bold text-slate-900 text-base">تصفية النتائج</h3>
          <span className="text-xs text-slate-500 font-medium">({totalResults} وظيفة)</span>
        </div>
        <button
          onClick={onReset}
          className="text-xs text-slate-500 hover:text-emerald-700 flex items-center gap-1 transition-colors cursor-pointer"
          title="إعادة تعيين كافة الفلاتر"
        >
          <RotateCcw className="w-3 h-3" />
          <span>تصفير</span>
        </button>
      </div>

      {/* Entry Point 1: Personalized Suitable Jobs Toggle (Phase 4.1) */}
      <div className={`p-3.5 rounded-xl border transition-all ${
        filters.onlySuitable
          ? 'bg-emerald-50/90 border-emerald-300 ring-1 ring-emerald-400/40 shadow-xs'
          : 'bg-slate-50 border-slate-200 hover:border-slate-300'
      }`}>
        <label className="flex items-start gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={!!filters.onlySuitable}
            onChange={(e) => onChange({ onlySuitable: e.target.checked })}
            className="w-4 h-4 mt-0.5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
          />
          <div className="flex-1 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
              <span>الوظائف المناسبة لي</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              ترتيب النتائج تنازلياً حسب درجة التوافق الفعلي مع ملفك المهني
            </p>
            {!hasProfile && (
              <div className="mt-2 pt-2 border-t border-slate-200/60 text-[11px] text-amber-800 flex items-center justify-between">
                <span>لم يتم العثور على ملف مهني</span>
                {onOpenProfile && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onOpenProfile();
                    }}
                    className="font-bold underline hover:text-amber-900 cursor-pointer"
                  >
                    إنشاء الملف
                  </button>
                )}
              </div>
            )}
          </div>
        </label>
      </div>

      {/* Sorting */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-800 block">الترتيب حسب</label>
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-lg">
          <button
            type="button"
            onClick={() => onChange({ sortBy: 'newest' })}
            className={`py-1.5 text-xs font-medium rounded-md transition-colors ${
              filters.sortBy === 'newest'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            الأحدث أولاً
          </button>
          <button
            type="button"
            onClick={() => onChange({ sortBy: 'oldest' })}
            className={`py-1.5 text-xs font-medium rounded-md transition-colors ${
              filters.sortBy === 'oldest'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            الأقدم أولاً
          </button>
        </div>
      </div>

      {/* Work Mode */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-800 block">طبيعة ومكان العمل</label>
        <div className="space-y-1.5 text-xs text-slate-700">
          {[
            { id: 'all', label: 'الكل' },
            { id: 'on_site', label: 'حضوري بالمنشأة' },
            { id: 'remote', label: 'عن بُعد بالكامل' },
            { id: 'hybrid', label: 'هجين (حضوري + عن بُعد)' },
          ].map((mode) => (
            <label key={mode.id} className="flex items-center gap-2 cursor-pointer hover:text-slate-900">
              <input
                type="radio"
                name="workMode"
                checked={filters.workMode === mode.id}
                onChange={() => onChange({ workMode: mode.id })}
                className="w-3.5 h-3.5 text-emerald-600 focus:ring-emerald-500 border-slate-300"
              />
              <span>{mode.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Employment Type */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-800 block">نوع العقد والدوام</label>
        <div className="space-y-1.5 text-xs text-slate-700">
          {[
            { id: 'all', label: 'الكل' },
            { id: 'full_time', label: 'دوام كامل' },
            { id: 'part_time', label: 'دوام جزئي' },
            { id: 'contract', label: 'عقد محدد / استشاري' },
            { id: 'internship', label: 'تدريب تعاوني / خريج' },
          ].map((type) => (
            <label key={type.id} className="flex items-center gap-2 cursor-pointer hover:text-slate-900">
              <input
                type="radio"
                name="employmentType"
                checked={filters.employmentType === type.id}
                onChange={() => onChange({ employmentType: type.id })}
                className="w-3.5 h-3.5 text-emerald-600 focus:ring-emerald-500 border-slate-300"
              />
              <span>{type.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Experience */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-800 block">سنوات الخبرة</label>
        <div className="space-y-1.5 text-xs text-slate-700">
          {[
            { id: 'all', label: 'الكل (أي خبرة)' },
            { id: 'no_exp', label: 'بدون خبرة (خريجون جدد)' },
            { id: '1-3', label: '1 - 3 سنوات' },
            { id: '3-5', label: '3 - 5 سنوات' },
            { id: '5+', label: 'أكثر من 5 سنوات' },
          ].map((exp) => (
            <label key={exp.id} className="flex items-center gap-2 cursor-pointer hover:text-slate-900">
              <input
                type="radio"
                name="experience"
                checked={filters.experience === exp.id}
                onChange={() => onChange({ experience: exp.id })}
                className="w-3.5 h-3.5 text-emerald-600 focus:ring-emerald-500 border-slate-300"
              />
              <span>{exp.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Education */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-800 block">المؤهل الأكاديمي</label>
        <select
          value={filters.education}
          onChange={(e) => onChange({ education: e.target.value })}
          className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600"
        >
          <option value="all">الكل (كافة المؤهلات)</option>
          <option value="ثانوية">ثانوية عامة أو ما يعادلها</option>
          <option value="دبلوم">دبلوم فني / متوسط</option>
          <option value="بكالوريوس">بكالوريوس</option>
          <option value="ماجستير">ماجستير أو أعلى</option>
        </select>
      </div>

      {/* Salary Filter */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-800 block">الراتب</label>
        <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer mb-2">
          <input
            type="checkbox"
            checked={filters.hasSalaryOnly}
            onChange={(e) => onChange({ hasSalaryOnly: e.target.checked })}
            className="w-3.5 h-3.5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
          />
          <span>عرض الوظائف ذات الرواتب المعلنة فقط</span>
        </label>
      </div>

      {/* Posted Date */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-800 block">تاريخ النشر</label>
        <div className="space-y-1.5 text-xs text-slate-700">
          {[
            { id: 'all', label: 'أي وقت' },
            { id: 'today', label: 'اليوم (خلال 24 ساعة)' },
            { id: '3days', label: 'خلال آخر 3 أيام' },
            { id: '7days', label: 'خلال آخر أسبوع' },
            { id: '30days', label: 'خلال آخر شهر' },
          ].map((d) => (
            <label key={d.id} className="flex items-center gap-2 cursor-pointer hover:text-slate-900">
              <input
                type="radio"
                name="postedDate"
                checked={filters.postedDate === d.id}
                onChange={() => onChange({ postedDate: d.id })}
                className="w-3.5 h-3.5 text-emerald-600 focus:ring-emerald-500 border-slate-300"
              />
              <span>{d.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-72 shrink-0 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs h-fit sticky top-20">
        {content}
      </aside>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="fixed inset-y-0 right-0 max-w-xs w-full bg-white shadow-xl p-6 overflow-y-auto z-10">
            <div className="flex justify-end mb-4">
              <button
                onClick={onCloseMobile}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {content}
          </div>
        </div>
      )}
    </>
  );
};
