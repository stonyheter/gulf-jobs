/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ============================================================================
 * ADMIN LAYOUT & NAVIGATION STRUCTURE
 * ============================================================================
 * Houses the clean admin sidebar, top bar, and active view switcher.
 */

import React, { useState } from 'react';
import {
  LayoutDashboard,
  Briefcase,
  Building2,
  Share2,
  Tag,
  Globe2,
  Map,
  Compass,
  Copy,
  AlertTriangle,
  Settings,
  ArrowRight,
  Database,
  RotateCcw,
  Menu,
  X,
  ExternalLink,
  Send,
} from 'lucide-react';
import { JobStatus } from '../../types/job';

export type AdminTab =
  | 'dashboard'
  | 'jobs'
  | 'applications'
  | 'companies'
  | 'sources'
  | 'categories'
  | 'countries'
  | 'regions'
  | 'cities'
  | 'duplicates'
  | 'expired'
  | 'settings';

interface AdminLayoutProps {
  currentTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  onExitAdmin: () => void;
  onResetData: () => Promise<void>;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentTab,
  onSelectTab,
  onExitAdmin,
  onResetData,
  children,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const navItems: { id: AdminTab; label: string; icon: React.ElementType; isPlanned?: boolean }[] = [
    { id: 'dashboard', label: 'لوحة المعلومات (Dashboard)', icon: LayoutDashboard },
    { id: 'jobs', label: 'إدارة الوظائف (Jobs)', icon: Briefcase },
    { id: 'applications', label: 'طلبات التوظيف (Applications)', icon: Send },
    { id: 'duplicates', label: 'الوظائف المكررة (Duplicates)', icon: Copy },
    { id: 'expired', label: 'الوظائف المنتهية (Expired)', icon: AlertTriangle },
    { id: 'companies', label: 'الشركات (Companies)', icon: Building2, isPlanned: true },
    { id: 'sources', label: 'المصادر (Sources)', icon: Share2, isPlanned: true },
    { id: 'categories', label: 'التصنيفات (Categories)', icon: Tag, isPlanned: true },
    { id: 'countries', label: 'الدول (Countries)', icon: Globe2, isPlanned: true },
    { id: 'regions', label: 'المناطق (Regions)', icon: Map, isPlanned: true },
    { id: 'cities', label: 'المدن (Cities)', icon: Compass, isPlanned: true },
    { id: 'settings', label: 'الإعدادات (Settings)', icon: Settings, isPlanned: true },
  ];

  const handleResetClick = async () => {
    if (
      window.confirm(
        'هل تريد إعادة تعيين قاعدة البيانات التطويرية إلى البيانات التجريبية الافتراضية؟\n(سيتم التراجع عن أي إضافات أو تعديلات محلية تجريبية)'
      )
    ) {
      setIsResetting(true);
      await onResetData();
      setIsResetting(false);
    }
  };

  const navContent = (
    <div className="flex flex-col h-full">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow-xs">
            <Briefcase className="w-4 h-4" />
          </div>
          <div>
            <div className="text-white font-bold text-sm">لوحة تحكم وظائف الخليج</div>
            <div className="text-slate-400 text-[11px]">نظام الإدارة الداخلي (Admin)</div>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => {
                onSelectTab(item.id);
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.isPlanned && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-normal">
                  مخطط
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Persistence & Reset Box */}
      <div className="p-3 border-t border-slate-800 space-y-2">
        <div className="p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/60 text-[11px] text-slate-300">
          <div className="flex items-center gap-1.5 text-emerald-400 font-bold mb-1">
            <Database className="w-3.5 h-3.5" />
            <span>حفظ محلي تجريبي (Active)</span>
          </div>
          <p className="text-slate-400 text-[10px] leading-relaxed">
            العمليات تسجل محلياً في المتصفح وجاهزة للربط مع قاعدة بيانات سحابية حقيقية.
          </p>
        </div>

        <button
          onClick={handleResetClick}
          disabled={isResetting}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{isResetting ? 'جارٍ إعادة التعيين...' : 'استعادة البيانات التجريبية'}</span>
        </button>

        <button
          onClick={onExitAdmin}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 hover:text-emerald-100 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
        >
          <ArrowRight className="w-3.5 h-3.5" />
          <span>العودة للمنصة العامة (الباحثين)</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row text-slate-900 font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-slate-900 border-l border-slate-800 shrink-0 flex-col sticky top-0 h-screen">
        {navContent}
      </aside>

      {/* Mobile Header Bar */}
      <div className="md:hidden bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-bold text-sm">لوحة تحكم وظائف الخليج</span>
        </div>

        <button
          onClick={onExitAdmin}
          className="text-xs text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
        >
          <span>الموقع العام</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-72 max-w-full bg-slate-900 h-full z-10">
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="absolute left-3 top-4 p-1 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            {navContent}
          </div>
        </div>
      )}

      {/* Main Admin View Content */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Top Breadcrumb/Notice Bar */}
        <header className="bg-white border-b border-slate-200 px-6 py-3.5 hidden md:flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>لوحة التحكم</span>
            <span>/</span>
            <span className="font-bold text-slate-800">
              {navItems.find((n) => n.id === currentTab)?.label.split('(')[0] || 'الرئيسية'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>المرحلة 2: نظام إدارة الوظائف والبيانات</span>
            </span>

            <button
              onClick={onExitAdmin}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-700 transition-colors cursor-pointer"
            >
              <span>معاينة واجهة الباحثين</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        {/* Dynamic View Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};
