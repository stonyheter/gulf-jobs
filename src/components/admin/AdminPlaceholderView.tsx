/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ============================================================================
 * ADMIN PLACEHOLDER VIEW (PLANNED SECTIONS)
 * ============================================================================
 * Clean placeholder view for planned admin modules (Companies, Sources,
 * Categories, Countries, Regions, Cities, Settings).
 */

import React from 'react';
import { Layers, ArrowRight, Database, Sparkles } from 'lucide-react';

interface AdminPlaceholderViewProps {
  titleAr: string;
  descriptionAr: string;
  plannedPhase: string;
  onBackToDashboard: () => void;
  onGoToJobs?: () => void;
}

export const AdminPlaceholderView: React.FC<AdminPlaceholderViewProps> = ({
  titleAr,
  descriptionAr,
  plannedPhase,
  onBackToDashboard,
  onGoToJobs,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center max-w-2xl mx-auto space-y-5">
      <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-100 shadow-xs">
        <Layers className="w-7 h-7" />
      </div>

      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100/70 text-emerald-800">
          <Sparkles className="w-3.5 h-3.5" />
          <span>مخطط للمرحلة: {plannedPhase}</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">{titleAr}</h2>
        <p className="text-sm text-slate-500 leading-relaxed max-w-md mx-auto">
          {descriptionAr}
        </p>
      </div>

      <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-600 text-right leading-relaxed space-y-1.5">
        <div className="font-bold text-slate-800 flex items-center gap-1.5">
          <Database className="w-4 h-4 text-emerald-700" />
          <span>الأساس المعماري جاهز</span>
        </div>
        <p>
          تم تجهيز الموديلات والأنماط المعمارية المناسبة لهذا القسم ضمن البنية الهيكلية لـ «وظائف الخليج». في هذه المرحلة (المرحلة الثانية)، تم التركيز على إدارة الوظائف والتحقق وحالات النشر لتثبيت الأساس.
        </p>
      </div>

      <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={onBackToDashboard}
          className="px-5 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
        >
          العودة للوحة القيادة (Dashboard)
        </button>
        {onGoToJobs && (
          <button
            onClick={onGoToJobs}
            className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer"
          >
            الانتقال إلى جدول الوظائف
          </button>
        )}
      </div>
    </div>
  );
};
