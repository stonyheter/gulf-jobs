/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Play,
  CheckCircle2,
  AlertTriangle,
  Globe,
  Search,
  Code2,
  FileCheck,
  ShieldCheck,
  Layers,
  Link as LinkIcon,
} from 'lucide-react';
import { runSeoTests, SeoTestResult } from '../../services/seoTestScenarios';
import { Job } from '../../types/job';

interface SeoTestRunnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobs: Job[];
}

export const SeoTestRunnerModal: React.FC<SeoTestRunnerModalProps> = ({
  isOpen,
  onClose,
  jobs,
}) => {
  const [testSummary, setTestSummary] = useState<{
    total: number;
    passed: number;
    failed: number;
    results: SeoTestResult[];
  } | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const executeTests = () => {
    setIsRunning(true);
    setTimeout(() => {
      const summary = runSeoTests(jobs);
      setTestSummary(summary);
      setIsRunning(false);
    }, 100);
  };

  useEffect(() => {
    if (isOpen) {
      executeTests();
    }
  }, [isOpen, jobs]);

  if (!isOpen) return null;

  const categories = [
    { id: 'all', label: 'كافة الاختبارات' },
    { id: 'slug', label: 'الـ Slugs والروابط النظيفة' },
    { id: 'indexability', label: 'قواعد الأرشفة (Indexability)' },
    { id: 'structured_data', label: 'بيانات Schema.org المنظمة' },
    { id: 'metadata', label: 'البيانات الوصفية والرابط الأساسي' },
    { id: 'routing', label: 'توجيه المسارات (Routing)' },
    { id: 'pagination', label: 'جاهزية الترقيم (Pagination)' },
  ];

  const filteredResults =
    testSummary?.results.filter(
      (r) => selectedCategory === 'all' || r.category === selectedCategory
    ) || [];

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
    >
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>فاحص ومعاير بنية الـ SEO التقنية (Phase 5.1)</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 font-mono">
                  16 فحص معياري
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                فحص آلي لقواعد الأرشفة، بنية الـ Slugs، الروابط الأساسية، وبيانات Schema.org JobPosting.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar & KPI bar */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {testSummary && (
              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold text-slate-700">النتيجة الإجمالية:</span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{testSummary.passed} ناجح</span>
                </span>
                {testSummary.failed > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 font-bold">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    <span>{testSummary.failed} غير مطابق</span>
                  </span>
                )}
                <span className="text-slate-400">· نسبة النجاح {Math.round((testSummary.passed / testSummary.total) * 100)}%</span>
              </div>
            )}
          </div>

          <button
            onClick={executeTests}
            disabled={isRunning}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            <Play className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
            <span>إعادة تشغيل الفحوصات</span>
          </button>
        </div>

        {/* Category Tabs */}
        <div className="px-6 pt-3 border-b border-slate-200 bg-white flex items-center gap-1 overflow-x-auto whitespace-nowrap scrollbar-none text-xs">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`pb-3 px-3 border-b-2 font-medium transition-colors cursor-pointer ${
                selectedCategory === c.id
                  ? 'border-emerald-700 text-emerald-800 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Test Cases List */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1 bg-slate-50/50">
          {filteredResults.map((result) => (
            <div
              key={result.id}
              className={`p-4 rounded-xl border bg-white transition-all ${
                result.passed
                  ? 'border-slate-200 hover:border-emerald-300'
                  : 'border-rose-300 bg-rose-50/30'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  {result.passed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-slate-400">{result.id}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                        {result.category}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 mt-1">{result.name}</h3>

                    <div className="mt-2 text-xs space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100 font-mono">
                      <div className="text-slate-600">
                        <span className="font-bold text-slate-500">المتوقع: </span>
                        <span>{result.expected}</span>
                      </div>
                      <div className="text-emerald-700">
                        <span className="font-bold text-emerald-800">الفعلي: </span>
                        <span>{result.actual}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-md shrink-0 ${
                    result.passed
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {result.passed ? 'مطابق ومعتمد' : 'غير مطابق'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>تم التحقق من معايير Google Search Central و Schema.org JobPosting.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
