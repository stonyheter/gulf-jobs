/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { CountryStat } from '../../services/jobService';

interface CountriesSectionProps {
  stats: CountryStat[];
  onSelectCountry: (countryName: string) => void;
}

export const CountriesSection: React.FC<CountriesSectionProps> = ({
  stats,
  onSelectCountry,
}) => {
  return (
    <section className="py-12 bg-slate-50 border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            وظائف دول مجلس التعاون الخليجي
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            اختر الدولة لاستعراض الشواغر الوظيفية المتاحة مصنفة حسب المناطق والمحافظات
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats.map((stat) => (
            <div
              key={stat.code}
              onClick={() => onSelectCountry(stat.commonNameAr)}
              className="group bg-white p-5 rounded-xl border border-slate-200/90 hover:border-emerald-600/60 shadow-xs hover:shadow-sm transition-all cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center gap-3.5">
                <span className="text-3xl filter drop-shadow-xs" role="img" aria-label={stat.commonNameAr}>
                  {stat.flagEmoji}
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors text-base">
                    {stat.nameAr}
                  </h3>
                  <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                    <span className="font-semibold text-emerald-800">{stat.jobCount}</span>
                    <span>وظائف متاحة حالياً</span>
                    <span className="text-slate-300">·</span>
                    <span>العملة: {stat.currencyAr}</span>
                  </div>
                </div>
              </div>

              <div className="w-8 h-8 rounded-full bg-slate-50 group-hover:bg-emerald-50 flex items-center justify-center text-slate-400 group-hover:text-emerald-700 transition-colors">
                <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
