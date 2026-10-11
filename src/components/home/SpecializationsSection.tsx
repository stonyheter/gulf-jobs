/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Laptop,
  HardHat,
  Flame,
  Landmark,
  HeartPulse,
  Truck,
  Megaphone,
  Users,
} from 'lucide-react';
import { JobCategory } from '../../types/job';

interface SpecializationsSectionProps {
  categories: JobCategory[];
  onSelectCategory: (keyword: string) => void;
}

export const SpecializationsSection: React.FC<SpecializationsSectionProps> = ({
  categories,
  onSelectCategory,
}) => {
  const getIcon = (name: string) => {
    switch (name) {
      case 'Laptop':
        return <Laptop className="w-5 h-5" />;
      case 'HardHat':
        return <HardHat className="w-5 h-5" />;
      case 'Flame':
        return <Flame className="w-5 h-5" />;
      case 'Landmark':
        return <Landmark className="w-5 h-5" />;
      case 'HeartPulse':
        return <HeartPulse className="w-5 h-5" />;
      case 'Truck':
        return <Truck className="w-5 h-5" />;
      case 'Megaphone':
        return <Megaphone className="w-5 h-5" />;
      default:
        return <Users className="w-5 h-5" />;
    }
  };

  const getKeywordForCategory = (cat: JobCategory) => {
    switch (cat.id) {
      case 'tech':
        return 'برمجيات';
      case 'engineering':
        return 'هندسة';
      case 'oil_gas':
        return 'طاقة';
      case 'finance':
        return 'مالية';
      case 'healthcare':
        return 'صحة';
      case 'logistics':
        return 'لوجستيات';
      case 'sales_marketing':
        return 'تسويق';
      case 'admin':
        return 'إدارة';
      default:
        return cat.nameAr;
    }
  };

  return (
    <section className="py-12 bg-white border-y border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              التخصصات المهنية
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              استكشف الوظائف المصنفة حسب القطاعات الأكثر طلباً في دول الخليج
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(getKeywordForCategory(cat))}
              className="group p-4 bg-slate-50/70 hover:bg-emerald-50/40 border border-slate-200/80 hover:border-emerald-600/50 rounded-xl text-right transition-all flex flex-col justify-between gap-3 cursor-pointer"
            >
              <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 group-hover:text-emerald-700 group-hover:border-emerald-200 transition-colors shadow-xs">
                {getIcon(cat.iconName)}
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors">
                  {cat.nameAr}
                </h3>
                <span className="text-xs text-slate-400 mt-1 block">
                  {cat.nameEn}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
