/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ============================================================================
 * CANDIDATE JOB APPLICATION MODAL (PHASE 7)
 * ============================================================================
 * Interactive dialog allowing candidates to upload or select a private CV,
 * write a cover letter, review their compatibility, and submit their application.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Building2,
  MapPin,
  Trash2,
  ExternalLink,
  Loader2,
  Send,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { Job } from '../../types/job';
import { User } from '../../types/auth';
import { CVFile } from '../../types/storage';
import { applicationService } from '../../services/applicationService';
import { cvStorageRepository } from '../../repositories/CVStorageRepository';
import { profileService } from '../../services/profileService';
import { JobSeekerProfile } from '../../types/profile';
import { formatSalary, formatLocation } from '../../utils/formatters';

interface ApplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job;
  currentUser: User | null;
  onOpenAuthModal: () => void;
  onSuccessApplication?: () => void;
  onViewMyApplications?: () => void;
  compatibilityScore?: number;
}

export const ApplyModal: React.FC<ApplyModalProps> = ({
  isOpen,
  onClose,
  job,
  currentUser,
  onOpenAuthModal,
  onSuccessApplication,
  onViewMyApplications,
  compatibilityScore,
}) => {
  const [profile, setProfile] = useState<JobSeekerProfile | null>(null);
  const [existingCvs, setExistingCvs] = useState<CVFile[]>([]);
  const [selectedCvMode, setSelectedCvMode] = useState<'upload' | 'existing'>('upload');
  const [selectedExistingCvId, setSelectedExistingCvId] = useState<string>('');

  // Uploaded file state
  const [uploadedFile, setUploadedFile] = useState<{
    file: File;
    base64: string;
    sizeFormatted: string;
  } | null>(null);

  // Form inputs
  const [coverLetter, setCoverLetter] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedAppId, setSubmittedAppId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load user profile and existing CVs on open
  useEffect(() => {
    if (!isOpen) return;

    setErrorMsg(null);
    setIsSuccess(false);
    setSubmittedAppId(null);
    setUploadedFile(null);
    setCoverLetter('');

    async function loadUserData() {
      if (currentUser) {
        try {
          const [p, cvs] = await Promise.all([
            profileService.getProfile(),
            cvStorageRepository.getUserCVs(currentUser),
          ]);
          setProfile(p);
          setExistingCvs(cvs);
          if (cvs.length > 0) {
            setSelectedCvMode('existing');
            setSelectedExistingCvId(cvs[0].id);
          } else {
            setSelectedCvMode('upload');
          }
        } catch (err) {
          console.warn('Failed loading user CVs or profile', err);
        }
      }
    }

    loadUserData();
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  // Format file size
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 بايت';
    const k = 1024;
    const sizes = ['بايت', 'كيلوبايت', 'ميجابايت'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size (5MB max)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setErrorMsg('حجم الملف يتجاوز الحد المسموح به (5 ميجابايت).');
      return;
    }

    // Check mime type (PDF or Word)
    const validExtensions = ['.pdf', '.doc', '.docx'];
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!validExtensions.includes(ext)) {
      setErrorMsg('الصيغ المقبولة فقط هي: PDF, DOC, DOCX.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setUploadedFile({
        file,
        base64,
        sizeFormatted: formatBytes(file.size),
      });
    };
    reader.onerror = () => {
      setErrorMsg('حدث خطأ أثناء قراءة ملف السيرة الذاتية.');
    };
    reader.readAsDataURL(file);
  };

  // Generate quick template cover letter
  const handleGenerateTemplate = () => {
    const candidateName = profile?.fullName || currentUser?.displayName || 'المتقدم';
    const candidateSpecialty = profile?.targetJobTitle || 'في هذا المجال';
    const text = `السلام عليكم ورحمة الله وبركاته،\n\nأود التقدم لشغل وظيفة "${job.title}" المعلنة لدى ${job.companyName}. أمتلك خبرة مهنية واهتماماً عميقاً بتقديم قيمة مضافة لفريق العمل بما يتوافق مع متطلبات المنصب والخبرات المطلوبة.\n\nيسعدني الاطلاع على سيرتي الذاتية المرفقة، والتواصل لإجراء مقابلة لمناقشة كيفية المساهمة في نجاح وتطوير أعمال المنشأة.\n\nوتفضلوا بقبول فائق الاحترام والتقدير،\n${candidateName}`;
    setCoverLetter(text);
  };

  // Submit application
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenAuthModal();
      return;
    }

    setErrorMsg(null);

    // Validation
    let chosenCvFileId: string | undefined = undefined;
    let newCvPayload: { name: string; mimeType: string; size: number; base64Data?: string } | undefined = undefined;

    if (selectedCvMode === 'existing') {
      if (!selectedExistingCvId) {
        setErrorMsg('يرجى تحديد السيرة الذاتية المرفوعة مسبقاً.');
        return;
      }
      chosenCvFileId = selectedExistingCvId;
    } else {
      if (!uploadedFile) {
        setErrorMsg('يرجى رفع ملف السيرة الذاتية بصيغة PDF أو Word للمتابعة.');
        return;
      }
      newCvPayload = {
        name: uploadedFile.file.name,
        mimeType: uploadedFile.file.type || 'application/pdf',
        size: uploadedFile.file.size,
        base64Data: uploadedFile.base64,
      };
    }

    setIsSubmitting(true);

    try {
      const result = await applicationService.submitApplication(currentUser, {
        jobId: job.id,
        coverLetter: coverLetter.trim() || undefined,
        cvFile: newCvPayload,
        existingCvFileId: chosenCvFileId,
      });

      setSubmittedAppId(result.id);
      setIsSuccess(true);
      if (onSuccessApplication) {
        onSuccessApplication();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'فشل في إرسال طلب التوظيف. يرجى المحاولة لاحقاً.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
      <div
        className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col my-8 max-h-[90vh]"
        dir="rtl"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white p-5 sm:p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 left-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-700/60 text-emerald-100 border border-emerald-500/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>تقديم مباشر معتمد بالسيرة الذاتية</span>
            </span>

            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white pt-1">
              التقديم على وظيفة: {job.title}
            </h2>

            <div className="flex flex-wrap items-center gap-3 text-xs text-emerald-100/90 pt-1">
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" />
                <span>{job.companyName}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                <span>{formatLocation(job)}</span>
              </span>
              {compatibilityScore !== undefined && (
                <>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-600/60 text-emerald-100 font-bold">
                    <span>توافق: {compatibilityScore}%</span>
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Not Logged In Notice */}
        {!currentUser && !isSuccess && (
          <div className="p-6 bg-amber-50 border-b border-amber-200 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-800 space-y-2">
              <p className="font-semibold text-sm">يجب تسجيل الدخول لتقديم طلبك وحفظ سيرتك الذاتية بأمان</p>
              <p>
                يتطلب تقديم الطلب المباشر ربط السيرة الذاتية بحسابك الموثق لحماية خصوصيتك وتمكينك من متابعة حالة الطلب.
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAuthModal();
                }}
                className="mt-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-xs cursor-pointer shadow-xs transition-colors inline-flex items-center gap-1.5"
              >
                <span>تسجيل الدخول أو إنشاء حساب الآن</span>
              </button>
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5 text-slate-800">
          {/* Success View */}
          {isSuccess ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-inner animate-in zoom-in-75">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-bold text-slate-900">تم إرسال طلبك بنجاح!</h3>
                <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
                  تم استلام طلبك لوظيفة <span className="font-semibold text-slate-700">{job.title}</span> لدى{' '}
                  <span className="font-semibold text-slate-700">{job.companyName}</span> بنجاح.
                </p>
              </div>

              {submittedAppId && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 max-w-xs mx-auto text-xs text-slate-600">
                  <span className="block text-slate-400 text-[10px]">رقم الطلب المرجعي:</span>
                  <span className="font-mono font-bold text-slate-800">{submittedAppId}</span>
                </div>
              )}

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                {onViewMyApplications && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onViewMyApplications();
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    عرض ومتابعة طلباتي
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  إغلاق ومتابعة تصفح الوظائف
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Error Alert */}
              {errorMsg && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-800">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Applicant Identity Card */}
              {currentUser && (
                <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">بيانات مقدم الطلب:</span>
                    <span className="font-bold text-slate-900">
                      {profile?.fullName || currentUser.displayName}
                    </span>
                    <span className="text-slate-500 mr-2 font-mono">({currentUser.email})</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 font-medium text-[10px]">
                    حساب موثق
                  </span>
                </div>
              )}

              {/* CV Selection / Upload Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-emerald-700" />
                    <span>السيرة الذاتية (CV)</span>
                    <span className="text-rose-500">*</span>
                  </label>

                  {existingCvs.length > 0 && (
                    <div className="flex items-center gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setSelectedCvMode('existing')}
                        className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                          selectedCvMode === 'existing'
                            ? 'bg-emerald-700 text-white font-semibold'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        ملفاتي السابقة ({existingCvs.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedCvMode('upload')}
                        className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                          selectedCvMode === 'upload'
                            ? 'bg-emerald-700 text-white font-semibold'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        رفع سيرة جديدة
                      </button>
                    </div>
                  )}
                </div>

                {/* Mode 1: Select existing CV */}
                {selectedCvMode === 'existing' && existingCvs.length > 0 ? (
                  <div className="space-y-2">
                    {existingCvs.map((cv) => (
                      <label
                        key={cv.id}
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                          selectedExistingCvId === cv.id
                            ? 'border-emerald-600 bg-emerald-50/50 shadow-2xs'
                            : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="radio"
                            name="selectedCv"
                            value={cv.id}
                            checked={selectedExistingCvId === cv.id}
                            onChange={(e) => setSelectedExistingCvId(e.target.value)}
                            className="text-emerald-700 focus:ring-emerald-600 cursor-pointer"
                          />
                          <div>
                            <span className="font-semibold text-xs text-slate-800 block">
                              {cv.fileName}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {formatBytes(cv.fileSize)} • تم الرفع في{' '}
                              {new Date(cv.createdAt).toLocaleDateString('ar-SA')}
                            </span>
                          </div>
                        </div>
                        <FileText className="w-4 h-4 text-emerald-700" />
                      </label>
                    ))}
                  </div>
                ) : (
                  /* Mode 2: Upload new CV */
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    {uploadedFile ? (
                      <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50/60 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="space-y-0.5">
                            <span className="font-bold text-xs text-emerald-950 block truncate max-w-xs">
                              {uploadedFile.file.name}
                            </span>
                            <span className="text-[11px] text-emerald-700">
                              {uploadedFile.sizeFormatted} • جاهز للتقديم
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setUploadedFile(null);
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }}
                          className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                          title="حذف واختيار ملف آخر"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-slate-300 hover:border-emerald-600 hover:bg-emerald-50/30 rounded-xl p-6 text-center cursor-pointer transition-all space-y-2 group"
                      >
                        <div className="w-12 h-12 rounded-full bg-slate-100 group-hover:bg-emerald-100 text-slate-500 group-hover:text-emerald-700 flex items-center justify-center mx-auto transition-colors">
                          <UploadCloud className="w-6 h-6" />
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-xs sm:text-sm font-bold text-slate-800 block">
                            انقر لاختيار ملف السيرة الذاتية أو اسحبه إلى هنا
                          </span>
                          <span className="text-[11px] text-slate-400 block">
                            ندعم ملفات PDF و DOC و DOCX (الحد الأقصى 5 ميجابايت)
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Cover Letter Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <span>خطاب التقديم / نبذة تعريفية</span>
                    <span className="text-slate-400 font-normal text-xs">(اختياري)</span>
                  </label>

                  <button
                    type="button"
                    onClick={handleGenerateTemplate}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>توليد صيغة مقترحة تلقائياً</span>
                  </button>
                </div>

                <textarea
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  rows={4}
                  maxLength={1500}
                  placeholder="اكتب رسالة موجزة لصاحب العمل توضح أسباب اهتمامك بالوظيفة ومطابقة خبراتك لمتطلباتها..."
                  className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-xs sm:text-sm text-slate-800 leading-relaxed placeholder:text-slate-400 resize-y"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>يوصى بتقديم نبذة مختصرة تعزز فرص مراجعة سيرتك الذاتية</span>
                  <span>{coverLetter.length} / 1500 حرف</span>
                </div>
              </div>

              {/* Privacy & RLS Protection Note */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex items-start gap-2.5 text-[11px] text-slate-500">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <span>
                  تخضع سيرتك الذاتية لسياسات حماية الخصوصية المعمارية (RLS) وحاوية التخزين المشفرة الخاصة؛ ولا يمكن الاطلاع عليها إلا من قبلك ومن قِبل إدارة التوظيف المعتمدة لهذه الوظيفة.
                </span>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs transition-colors cursor-pointer"
                >
                  إلغاء
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting || !currentUser}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>جاري إرسال الطلب ورفع الملف...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 rtl:rotate-180" />
                      <span>تأكيد وإرسال طلب التوظيف</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
