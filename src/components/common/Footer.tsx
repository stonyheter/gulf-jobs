/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GCC_COUNTRIES } from '../../data/geoHierarchy';
import { countryNameToSlug } from '../../utils/slugUtils';

interface FooterProps {
  onSelectCountry: (countryName: string) => void;
  onSelectSpecialty: (skill: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onSelectCountry, onSelectSpecialty }) => {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & Mission */}
          <div className="md:col-span-1 space-y-4">
            <div className="text-xl font-bold text-white tracking-tight">وظائف الخليج</div>
            <p className="text-sm text-slate-400 leading-relaxed">
              المنصة الحديثة والموثوقة لاكتشاف الفرص الوظيفية في دول مجلس التعاون الخليجي، بتصميم عربي أولاً وبنية بيانات جغرافية دقيقة.
            </p>
            <div className="text-xs text-slate-500 pt-2">
              بنية SEO تقنية متطورة مهيأة لمحركات البحث وأرشفة الشواغر.
            </div>
          </div>

          {/* GCC Countries Directory */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white tracking-wider">وظائف حسب الدولة</h4>
            <ul className="space-y-2 text-sm">
              {GCC_COUNTRIES.map((country) => {
                const cSlug = countryNameToSlug(country.nameAr);
                return (
                  <li key={country.code}>
                    <a
                      href={`/jobs/${cSlug}`}
                      onClick={(e) => {
                        e.preventDefault();
                        onSelectCountry(country.commonNameAr);
                      }}
                      className="hover:text-emerald-400 transition-colors flex items-center gap-2"
                    >
                      <span>{country.flagEmoji}</span>
                      <span>وظائف {country.commonNameAr}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Quick Specialties */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white tracking-wider">تخصصات شائعة</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <button onClick={() => onSelectSpecialty('برمجيات')} className="hover:text-emerald-400 transition-colors">
                  هندسة البرمجيات والذكاء الاصطناعي
                </button>
              </li>
              <li>
                <button onClick={() => onSelectSpecialty('طاقة')} className="hover:text-emerald-400 transition-colors">
                  النفط، الغاز، والطاقة المتجددة
                </button>
              </li>
              <li>
                <button onClick={() => onSelectSpecialty('مالية')} className="hover:text-emerald-400 transition-colors">
                  المالية والمصارف الإسلامية
                </button>
              </li>
              <li>
                <button onClick={() => onSelectSpecialty('سلاسل إمداد')} className="hover:text-emerald-400 transition-colors">
                  اللوجستيات وإدارة الموانئ
                </button>
              </li>
              <li>
                <button onClick={() => onSelectSpecialty('إنشاءات')} className="hover:text-emerald-400 transition-colors">
                  الهندسة الإنشائية والبنية التحتية
                </button>
              </li>
            </ul>
          </div>

          {/* Architectural Notes */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white tracking-wider">الأساس المعماري للنظام</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              تم بناء هذه المنصة بنمط معماري معياري يفصل بين طبقة البيانات، الخدمات البرمجية، والمكونات المرئية، مما يسمح بالربط المباشر مع قواعد البيانات السحابية (Cloud SQL / Firestore) وأنظمة التقديم في المراحل القادمة.
            </p>
            <div className="pt-2 text-xs text-slate-500">
              جميع الحقوق محفوظة © {new Date().getFullYear()} وظائف الخليج
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
