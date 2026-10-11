/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ============================================================================
 * AUTHENTICATION & IDENTITY MODAL (PHASE 6)
 * ============================================================================
 * Allows users and administrators to register, log in, view active session,
 * switch demo roles (Job Seeker / Employer / Admin), and log out cleanly.
 */

import React, { useState } from 'react';
import {
  X,
  User,
  ShieldCheck,
  Building2,
  Lock,
  Mail,
  ArrowRight,
  LogOut,
  CheckCircle2,
  AlertCircle,
  KeyRound,
} from 'lucide-react';
import { User as UserType, UserRole } from '../../types/auth';
import { authService } from '../../services/authService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserType | null;
  onUserChanged: (user: UserType | null) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserChanged,
}) => {
  const [mode, setMode] = useState<'status' | 'login' | 'register' | 'forgot'>('status');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<UserRole>('job_seeker');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const user = await authService.login({ email, password });
      onUserChanged(user);
      setSuccessMsg(`مرحباً بك مجدداً، ${user.displayName}!`);
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'فشل تسجيل الدخول.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const user = await authService.register({
        email,
        password,
        displayName,
        role,
      });
      onUserChanged(user);
      setSuccessMsg(`تم إنشاء الحساب بنجاح! أهلاً بك يا ${user.displayName}.`);
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'فشل إنشاء الحساب.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('يرجى إدخال البريد الإلكتروني أولاً.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await authService.requestPasswordReset(email);
      if (res.success) {
        setSuccessMsg('تم إرسال تعليمات استعادة كلمة المرور إلى بريدك الإلكتروني بنجاح.');
        setTimeout(() => {
          setMode('login');
        }, 2500);
      } else {
        setError('تعذر إرسال طلب استعادة كلمة المرور. تحقق من البريد المدخل.');
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء طلب استعادة كلمة المرور.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSwitchRole = async (targetRole: UserRole) => {
    setError(null);
    setIsSubmitting(true);
    try {
      const user = await authService.switchRoleForTesting(targetRole);
      onUserChanged(user);
      setSuccessMsg(`تم التبديل بنجاح إلى حساب: ${user.displayName}`);
      setTimeout(() => setSuccessMsg(null), 2000);
    } catch (err: any) {
      setError(err.message || 'فشل التبديل.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    onUserChanged(null);
    setMode('login');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150"
        dir="rtl"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center text-white">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">إدارة الهوية وتسجيل الدخول</h3>
              <p className="text-[11px] text-slate-500">نظام المصادقة والصلاحيات (Phase 6)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* MODE: STATUS / CURRENT USER */}
          {currentUser && mode === 'status' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-500">الحساب النشط حالياً:</span>
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                      currentUser.role === 'admin'
                        ? 'bg-purple-100 text-purple-800 border border-purple-200'
                        : currentUser.role === 'employer'
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    {currentUser.role === 'admin'
                      ? 'مشرف النظام (Admin)'
                      : currentUser.role === 'employer'
                      ? 'صاحب عمل (Employer)'
                      : 'باحث عن عمل (Job Seeker)'}
                  </span>
                </div>
                <div className="font-bold text-slate-900 text-base">{currentUser.displayName}</div>
                <div className="text-xs text-slate-600 font-mono mt-0.5">{currentUser.email}</div>
              </div>

              {/* Fast Role Switcher for Architecture Testing */}
              <div className="pt-2">
                <div className="text-xs font-semibold text-slate-700 mb-2">
                  تبديل سريع للهوية للاختبار (Role Switcher):
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleSwitchRole('job_seeker')}
                    disabled={isSubmitting || currentUser.role === 'job_seeker'}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                      currentUser.role === 'job_seeker'
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-800'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <User className="w-4 h-4 text-emerald-600" />
                    <span>باحث عن عمل</span>
                  </button>

                  <button
                    onClick={() => handleSwitchRole('employer')}
                    disabled={isSubmitting || currentUser.role === 'employer'}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                      currentUser.role === 'employer'
                        ? 'bg-blue-50 border-blue-400 text-blue-800'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Building2 className="w-4 h-4 text-blue-600" />
                    <span>صاحب عمل</span>
                  </button>

                  <button
                    onClick={() => handleSwitchRole('admin')}
                    disabled={isSubmitting || currentUser.role === 'admin'}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                      currentUser.role === 'admin'
                        ? 'bg-purple-50 border-purple-400 text-purple-800'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 text-purple-600" />
                    <span>مشرف نظام</span>
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={handleLogout}
                  className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>تسجيل الخروج</span>
                </button>

                <button
                  onClick={() => setMode('register')}
                  className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer"
                >
                  + إنشاء حساب جديد
                </button>
              </div>
            </div>
          )}

          {/* MODE: LOGIN */}
          {(!currentUser || mode === 'login') && (
            <form onSubmit={handleLogin} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  البريد الإلكتروني
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full px-3 py-2 pr-9 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 font-sans"
                    dir="ltr"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    كلمة المرور
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setMode('forgot');
                    }}
                    className="text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold"
                  >
                    نسيت كلمة المرور؟
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 pr-9 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 font-sans"
                    dir="ltr"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'جارٍ تسجيل الدخول...' : 'تسجيل الدخول'}
              </button>

              <div className="pt-2 text-center text-xs text-slate-500">
                ليس لديك حساب؟{' '}
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="text-emerald-700 font-semibold hover:underline"
                >
                  إنشاء حساب باحث عن عمل
                </button>
              </div>

              {currentUser && (
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setMode('status')}
                    className="text-xs text-slate-400 hover:text-slate-600"
                  >
                    العودة لبيانات الحساب الحالي
                  </button>
                </div>
              )}
            </form>
          )}

          {/* MODE: FORGOT PASSWORD */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  أدخل بريدك الإلكتروني لاستعادة كلمة المرور
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full px-3 py-2 pr-9 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 font-sans"
                    dir="ltr"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  سيتم إرسال رابط تأكيد وتعيين كلمة مرور جديدة عبر Supabase Auth.
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'جارٍ إرسال الرابط...' : 'إرسال رابط الاستعادة'}
              </button>

              <div className="pt-2 text-center text-xs text-slate-500">
                تذكرت كلمة المرور؟{' '}
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-emerald-700 font-semibold hover:underline"
                >
                  العودة لتسجيل الدخول
                </button>
              </div>
            </form>
          )}

          {/* MODE: REGISTER */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  الاسم الكامل
                </label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="محمد العتيبي"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  البريد الإلكتروني
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 font-sans"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  كلمة المرور (8 أحرف على الأقل)
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 font-sans"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  نوع الحساب
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
                >
                  <option value="job_seeker">باحث عن عمل (Job Seeker)</option>
                  <option value="employer">صاحب عمل (Employer)</option>
                  <option value="admin">مشرف نظام (Admin)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'جارٍ إنشاء الحساب...' : 'إنشاء الحساب الآن'}
              </button>

              <div className="pt-2 text-center text-xs text-slate-500">
                لديك حساب بالفعل؟{' '}
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-emerald-700 font-semibold hover:underline"
                >
                  تسجيل الدخول
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
