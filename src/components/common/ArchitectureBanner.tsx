/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Database,
  Layers,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  User,
  Bookmark,
  Sparkles,
  Scale,
  KeyRound,
  Server,
} from 'lucide-react';
import { User as UserType } from '../../types/auth';

interface ArchitectureBannerProps {
  onOpenAdmin?: () => void;
  onOpenProfile?: () => void;
  onOpenSaved?: () => void;
  onOpenTestRunner?: () => void;
  onOpenSuitableJobs?: () => void;
  onOpenSeoRunner?: () => void;
  onOpenBackendRunner?: () => void;
  onOpenAuthModal?: () => void;
  currentUser?: UserType | null;
}

export const ArchitectureBanner: React.FC<ArchitectureBannerProps> = ({
  onOpenAdmin,
  onOpenProfile,
  onOpenSaved,
  onOpenTestRunner,
  onOpenSuitableJobs,
  onOpenSeoRunner,
  onOpenBackendRunner,
  onOpenAuthModal,
  currentUser,
}) => {
  // Production guard: hide this dev-tools banner in production builds
  if (import.meta.env.VITE_APP_ENV === 'production' || import.meta.env.PROD) {
    return null;
  }

  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-slate-900 border-b border-slate-800 text-slate-300 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse"></span>
              المرحلة 6.1: تكامل Supabase والبنية التحتية الخلفية (Active)
            </span>
            <span className="text-slate-400 hidden lg:inline">
              قاعدة بيانات PostgreSQL · نظام Supabase Auth · تخزين سيرة ذاتية خاص · سياسات أمان الصفوف RLS
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onOpenBackendRunner && (
              <button
                onClick={onOpenBackendRunner}
                className="px-2.5 py-1 bg-purple-800/90 hover:bg-purple-700 text-purple-200 border border-purple-600 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer font-semibold shadow-xs"
                title="تشغيل فحص البنية التحتية الخلفية وقواعد البيانات (20 فحصاً تكاملياً)"
              >
                <Server className="w-3.5 h-3.5 text-purple-300" />
                <span>فحص Backend (20 فحصاً)</span>
              </button>
            )}

            {onOpenAuthModal && (
              <button
                onClick={onOpenAuthModal}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer"
                title="إدارة الحساب وتبديل الأدوار"
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">
                  {currentUser ? `${currentUser.displayName} (${currentUser.role})` : 'تسجيل الدخول'}
                </span>
              </button>
            )}

            {onOpenSuitableJobs && (
              <button
                onClick={onOpenSuitableJobs}
                className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded-md transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs font-semibold"
                title="عرض الوظائف المناسبة لملفي"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>وظائف مناسبة لي</span>
              </button>
            )}

            {onOpenSeoRunner && (
              <button
                onClick={onOpenSeoRunner}
                className="px-2.5 py-1 bg-blue-900/80 hover:bg-blue-800 text-blue-200 border border-blue-700 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer"
                title="تشغيل فحص ومعايرة بنية الـ SEO التقنية (Phase 5.1)"
              >
                <Database className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden sm:inline">فحص SEO (16)</span>
              </button>
            )}

            {onOpenTestRunner && (
              <button
                onClick={onOpenTestRunner}
                className="px-2.5 py-1 bg-emerald-800/80 hover:bg-emerald-700 text-emerald-200 border border-emerald-700 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer"
                title="تشغيل فحص حالات الاختبار السبعة للمحرك"
              >
                <Scale className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">فحص المحرك (7)</span>
              </button>
            )}

            {onOpenProfile && (
              <button
                onClick={onOpenProfile}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer"
                title="فتح ملف الباحث عن عمل"
              >
                <User className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">ملفي المهني</span>
              </button>
            )}

            {onOpenSaved && (
              <button
                onClick={onOpenSaved}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer"
                title="فتح الوظائف المحفوظة"
              >
                <Bookmark className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">المحفوظات</span>
              </button>
            )}

            {onOpenAdmin && (
              <button
                onClick={onOpenAdmin}
                className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold rounded-md transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>لوحة الإدارة</span>
              </button>
            )}

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors cursor-pointer mr-1"
            >
              <span>تفاصيل المعمارية</span>
              {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {isOpen && (
          <div className="mt-3 pt-3 border-t border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4 text-slate-300">
            <div className="bg-slate-800/60 p-3 rounded border border-slate-700/60">
              <div className="flex items-center gap-1.5 font-semibold text-white mb-1.5">
                <Database className="w-4 h-4 text-purple-400" />
                <span>المستودعات المعيارية وفصل قاعدة البيانات</span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                الواجهات مفصولة بالكامل عبر Repository Interfaces (IJobRepository, IUserRepository, IProfileRepository, ISavedJobsRepository, ICVStorageRepository). جاهزة للتوصيل المباشر بـ PostgreSQL أو Cloud SQL أو Supabase.
              </p>
            </div>

            <div className="bg-slate-800/60 p-3 rounded border border-slate-700/60">
              <div className="flex items-center gap-1.5 font-semibold text-white mb-1.5">
                <KeyRound className="w-4 h-4 text-emerald-400" />
                <span>المصادقة والتجزئة الآمنة (SHA-256 + Salt)</span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                لا يتم تخزين كلمات المرور بصيغة نصية إطلاقاً. توليد أملاح تشفير مستقلة لكل مستخدم، مع رموز جلسات آمنة وإمكانية استعادة كلمة المرور وإدارة الأدوار (job_seeker, employer, admin).
              </p>
            </div>

            <div className="bg-slate-800/60 p-3 rounded border border-slate-700/60">
              <div className="flex items-center gap-1.5 font-semibold text-white mb-1.5">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span>الحماية الصارمة للملفات والسير الذاتية (Private CV)</span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                ملفات السير الذاتية محمية بخاصية الوصول الحصري للمالك فقط. منع أي محاولة وصول عامة أو عابرة للحسابات، مع التحقق من نوع الملف (PDF/DOCX) والحد الأقصى للحجم (5MB).
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
