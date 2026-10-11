/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Briefcase,
  ShieldCheck,
  Bookmark,
  User,
  Menu,
  X,
  Sparkles,
  ChevronLeft,
  KeyRound,
  Send,
} from 'lucide-react';
import { User as UserType } from '../../types/auth';

interface HeaderProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onExploreAll: () => void;
  onOpenAdmin?: () => void;
  savedCount?: number;
  onOpenSavedJobs?: () => void;
  onOpenProfile?: () => void;
  profileCompletion?: number;
  onOpenSuitableJobs?: () => void;
  currentUser?: UserType | null;
  onOpenAuthModal?: () => void;
  onOpenApplications?: () => void;
  applicationsCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  onExploreAll,
  onOpenAdmin,
  savedCount = 0,
  onOpenSavedJobs,
  onOpenProfile,
  profileCompletion,
  onOpenSuitableJobs,
  currentUser,
  onOpenAuthModal,
  onOpenApplications,
  applicationsCount = 0,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (tabKey: string) => {
    onSelectTab(tabKey);
    setMobileMenuOpen(false);
  };

  const handleSuitableJobsClick = () => {
    if (onOpenSuitableJobs) {
      onOpenSuitableJobs();
    } else {
      onSelectTab('suitable_jobs');
    }
    setMobileMenuOpen(false);
  };

  const handleProfileClick = () => {
    if (onOpenProfile) onOpenProfile();
    setMobileMenuOpen(false);
  };

  const handleSavedClick = () => {
    if (onOpenSavedJobs) onOpenSavedJobs();
    setMobileMenuOpen(false);
  };

  const handleApplicationsClick = () => {
    if (onOpenApplications) onOpenApplications();
    setMobileMenuOpen(false);
  };

  const handleAdminClick = () => {
    if (onOpenAdmin) onOpenAdmin();
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Zone 1: Single text element wordmark */}
          <button
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-2.5 text-xl font-bold tracking-tight text-slate-900 hover:text-emerald-700 transition-colors focus:outline-none text-right cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center text-white shadow-xs">
              <Briefcase className="w-4 h-4" />
            </div>
            <span>وظائف الخليج</span>
          </button>

          {/* Zone 2: Clean text navigation links with subtle active states */}
          <nav className="hidden lg:flex items-center gap-4 text-sm font-medium text-slate-600">
            <button
              onClick={() => handleNavClick('home')}
              className={`hover:text-slate-900 transition-colors py-1 cursor-pointer ${
                currentTab === 'home' ? 'text-emerald-700 font-semibold border-b-2 border-emerald-700' : ''
              }`}
            >
              الرئيسية
            </button>
            <button
              onClick={handleSuitableJobsClick}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                currentTab === 'suitable_jobs'
                  ? 'bg-emerald-700 text-white font-bold border-emerald-700 shadow-xs'
                  : 'bg-emerald-50/80 text-emerald-900 font-semibold border-emerald-200/70 hover:bg-emerald-100'
              }`}
              title="عرض الوظائف المتوافقة مع ملفك المهني"
            >
              <Sparkles className={`w-3.5 h-3.5 ${currentTab === 'suitable_jobs' ? 'text-amber-300' : 'text-emerald-700'}`} />
              <span>وظائف مناسبة لي</span>
            </button>
            <button
              onClick={() => handleNavClick('latest')}
              className={`hover:text-slate-900 transition-colors py-1 cursor-pointer ${
                currentTab === 'latest' ? 'text-emerald-700 font-semibold border-b-2 border-emerald-700' : ''
              }`}
            >
              أحدث الوظائف
            </button>
            <button
              onClick={() => handleNavClick('today')}
              className={`hover:text-slate-900 transition-colors py-1 cursor-pointer ${
                currentTab === 'today' ? 'text-emerald-700 font-semibold border-b-2 border-emerald-700' : ''
              }`}
            >
              وظائف اليوم
            </button>
            <button
              onClick={() => handleNavClick('remote')}
              className={`hover:text-slate-900 transition-colors py-1 cursor-pointer ${
                currentTab === 'remote' ? 'text-emerald-700 font-semibold border-b-2 border-emerald-700' : ''
              }`}
            >
              وظائف عن بُعد
            </button>
            <button
              onClick={() => handleNavClick('entry_level')}
              className={`hover:text-slate-900 transition-colors py-1 cursor-pointer ${
                currentTab === 'entry_level' ? 'text-emerald-700 font-semibold border-b-2 border-emerald-700' : ''
              }`}
            >
              بدون خبرة
            </button>
            <button
              onClick={() => handleNavClick('countries')}
              className={`hover:text-slate-900 transition-colors py-1 cursor-pointer ${
                currentTab === 'countries' ? 'text-emerald-700 font-semibold border-b-2 border-emerald-700' : ''
              }`}
            >
              الدول
            </button>
          </nav>

          {/* Zone 3: Primary & Phase 3 Actions (Saved Jobs, Profile, Admin) */}
          <div className="flex items-center gap-2">
            {/* Saved Jobs Shortcut Button */}
            {onOpenSavedJobs && (
              <button
                onClick={handleSavedClick}
                className={`relative inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                  currentTab === 'saved_jobs'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
                title="الوظائف المحفوظة"
              >
                <Bookmark className={`w-3.5 h-3.5 ${savedCount > 0 ? 'fill-emerald-700 text-emerald-700' : 'text-slate-500'}`} />
                <span className="hidden sm:inline">المحفوظة</span>
                {savedCount > 0 && (
                  <span className="inline-flex items-center justify-center min-w-4.5 h-4.5 px-1 text-[11px] font-bold text-white bg-emerald-700 rounded-full">
                    {savedCount}
                  </span>
                )}
              </button>
            )}

            {/* My Applications Shortcut Button */}
            {onOpenApplications && currentUser && (
              <button
                onClick={handleApplicationsClick}
                className={`relative inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                  currentTab === 'my_applications'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
                title="طلبات التوظيف التي قدمتها"
              >
                <Send className="w-3.5 h-3.5 text-emerald-700" />
                <span className="hidden sm:inline">طلباتي</span>
                {applicationsCount > 0 && (
                  <span className="inline-flex items-center justify-center min-w-4.5 h-4.5 px-1 text-[11px] font-bold text-white bg-emerald-700 rounded-full">
                    {applicationsCount}
                  </span>
                )}
              </button>
            )}

            {/* Profile Shortcut Button */}
            {onOpenProfile && (
              <button
                onClick={handleProfileClick}
                className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                  currentTab === 'profile'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
                title="ملفي المهني وتفضيلات التوظيف"
              >
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">ملفي المهني</span>
                {profileCompletion !== undefined && profileCompletion > 0 && (
                  <span
                    className={`hidden md:inline-block px-1.5 py-0.2 rounded text-[10px] font-bold ${
                      profileCompletion >= 80
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {profileCompletion}%
                  </span>
                )}
              </button>
            )}

            {/* Account / Auth Button */}
            {onOpenAuthModal && (
              <button
                onClick={onOpenAuthModal}
                className="inline-flex items-center gap-1.5 px-2.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                title="إدارة الحساب والمصادقة"
              >
                <KeyRound className="w-3.5 h-3.5 text-emerald-700" />
                <span className="hidden xl:inline">
                  {currentUser ? currentUser.displayName.split(' ')[0] : 'تسجيل الدخول'}
                </span>
                {currentUser && (
                  <span className="text-[10px] px-1 rounded bg-emerald-100 text-emerald-800 font-bold hidden sm:inline">
                    {currentUser.role === 'admin' ? 'مشرف' : currentUser.role === 'employer' ? 'صاحب عمل' : 'باحث'}
                  </span>
                )}
              </button>
            )}

            {/* Internal Admin Shortcut */}
            {onOpenAdmin && (
              <button
                onClick={handleAdminClick}
                className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                title="لوحة الإدارة الداخلية"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                <span>الإدارة</span>
              </button>
            )}

            {/* Explore All CTA */}
            <button
              onClick={onExploreAll}
              className="hidden sm:inline-flex px-3.5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors whitespace-nowrap shadow-xs cursor-pointer"
            >
              تصفح كل الوظائف
            </button>

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
              aria-label="القائمة الرئيسية"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3 shadow-lg animate-fade-in">
          {/* Prominent Suitable Jobs banner in Mobile */}
          <button
            onClick={handleSuitableJobsClick}
            className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-xs font-bold cursor-pointer ${
              currentTab === 'suitable_jobs'
                ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                : 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <div className="flex items-center gap-2">
              <Sparkles className={`w-4 h-4 ${currentTab === 'suitable_jobs' ? 'text-amber-300' : 'text-emerald-700'}`} />
              <span>وظائف مناسبة لي (تحليل التوافق)</span>
            </div>
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="grid grid-cols-2 gap-2 text-xs font-medium pb-2 border-b border-slate-100">
            <button
              onClick={() => handleNavClick('home')}
              className={`p-2.5 rounded-lg text-right ${
                currentTab === 'home' ? 'bg-emerald-50 text-emerald-800 font-bold' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              الرئيسية
            </button>
            <button
              onClick={() => handleNavClick('latest')}
              className={`p-2.5 rounded-lg text-right ${
                currentTab === 'latest' ? 'bg-emerald-50 text-emerald-800 font-bold' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              أحدث الوظائف
            </button>
            <button
              onClick={() => handleNavClick('today')}
              className={`p-2.5 rounded-lg text-right ${
                currentTab === 'today' ? 'bg-emerald-50 text-emerald-800 font-bold' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              وظائف اليوم
            </button>
            <button
              onClick={() => handleNavClick('remote')}
              className={`p-2.5 rounded-lg text-right ${
                currentTab === 'remote' ? 'bg-emerald-50 text-emerald-800 font-bold' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              وظائف عن بُعد
            </button>
            <button
              onClick={() => handleNavClick('entry_level')}
              className={`p-2.5 rounded-lg text-right ${
                currentTab === 'entry_level' ? 'bg-emerald-50 text-emerald-800 font-bold' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              بدون خبرة
            </button>
            <button
              onClick={() => handleNavClick('countries')}
              className={`p-2.5 rounded-lg text-right ${
                currentTab === 'countries' ? 'bg-emerald-50 text-emerald-800 font-bold' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              الدول
            </button>
          </div>

          {/* Quick links to Profile & Saved in Mobile */}
          <div className="space-y-2 pt-1 text-sm font-semibold">
            {onOpenAuthModal && (
              <button
                onClick={() => {
                  onOpenAuthModal();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-emerald-700" />
                  <span>
                    {currentUser ? `الحساب: ${currentUser.displayName} (${currentUser.role})` : 'تسجيل الدخول / إدارة الحساب'}
                  </span>
                </div>
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            )}

            {onOpenProfile && (
              <button
                onClick={handleProfileClick}
                className="w-full flex items-center justify-between p-2.5 rounded-lg bg-emerald-50/50 hover:bg-emerald-50 text-emerald-900 border border-emerald-100 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-emerald-700" />
                  <span>ملفي المهني (إعدادات المطابقة)</span>
                </div>
                {profileCompletion !== undefined && (
                  <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                    {profileCompletion}%
                  </span>
                )}
              </button>
            )}

            {onOpenSavedJobs && (
              <button
                onClick={handleSavedClick}
                className="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Bookmark className="w-4 h-4 text-emerald-700" />
                  <span>الوظائف المحفوظة</span>
                </div>
                <span className="text-xs bg-emerald-700 text-white px-2 py-0.5 rounded-full font-bold">
                  {savedCount}
                </span>
              </button>
            )}

            {onOpenApplications && currentUser && (
              <button
                onClick={handleApplicationsClick}
                className="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4 text-emerald-700" />
                  <span>طلبات التوظيف الخاصة بي (طلباتي)</span>
                </div>
                {applicationsCount > 0 && (
                  <span className="text-xs bg-emerald-700 text-white px-2 py-0.5 rounded-full font-bold">
                    {applicationsCount}
                  </span>
                )}
              </button>
            )}

            {onOpenAdmin && (
              <button
                onClick={handleAdminClick}
                className="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>لوحة الإدارة الداخلية</span>
                </div>
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
