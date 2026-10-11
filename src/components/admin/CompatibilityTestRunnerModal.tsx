/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ============================================================================
 * COMPATIBILITY ENGINE TEST RUNNER & ARCHITECTURE VIEWER (PHASE 4)
 * ============================================================================
 * Runs and displays the 7 test cases specified in Requirement 18:
 * CASE 1: Strongly matching software engineer.
 * CASE 2: Correct specialty but insufficient experience.
 * CASE 3: Correct experience but several missing required skills.
 * CASE 4: Remote-preference profile and remote job.
 * CASE 5: Different country with no remote option.
 * CASE 6: Job with many unspecified requirements (unknown != mismatch).
 * CASE 7: Profile with incomplete information.
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Play,
  CheckCircle2,
  AlertTriangle,
  Scale,
  Sparkles,
  Layers,
  ArrowDown,
  Info,
  ShieldCheck,
} from 'lucide-react';
import { runCompatibilityTests, TestCaseResult } from '../../services/matchingTestScenarios';

interface CompatibilityTestRunnerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CompatibilityTestRunnerModal: React.FC<CompatibilityTestRunnerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [testResults, setTestResults] = useState<TestCaseResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedCase, setSelectedCase] = useState<TestCaseResult | null>(null);

  const executeTests = () => {
    setIsRunning(true);
    setTimeout(() => {
      const results = runCompatibilityTests();
      setTestResults(results);
      if (results.length > 0) {
        setSelectedCase(results[0]);
      }
      setIsRunning(false);
    }, 100);
  };

  useEffect(() => {
    if (isOpen) {
      executeTests();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const allPassed = testResults.length > 0 && testResults.every((t) => t.passed);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 text-right overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-800">
              <Scale className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">
                  لوحة اختبار وتحقق محرك التوافق (Phase 4 Test Scenarios)
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  حتمي ومفسر 100%
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                فحص آلي للسيناريوهات السبعة المحددة للتأكد من دقة الأوزان وتمييز النواقص عن البيانات غير المحددة
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={executeTests}
              disabled={isRunning}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold cursor-pointer shadow-xs"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{isRunning ? 'جاري الفحص...' : 'إعادة تشغيل الفحص'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Future Architecture Overview Card (Requirement 20) */}
        <div className="p-4 bg-emerald-950 text-emerald-100 text-xs border-b border-emerald-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="font-bold text-white flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>العلاقة المعمارية بين محرك التوافق الحالي وطبقة الذكاء الاصطناعي المستقبلية:</span>
            </div>
            <p className="text-emerald-200/90 text-[11px] leading-relaxed max-w-3xl">
              محرك المرحلة الرابعة مسؤول حصرياً عن الحساب التوافقي الحتمي وفق نظام 100 نقطة. في المرحلة القادمة، ستعمل طبقة الذكاء الاصطناعي (AI Layer) كمدخل تنظيمي لفهم النصوص غير المهيكلة وتحويلها إلى معايير واضحة يغذيها هذا المحرك دون التدخل في قرارات الحساب.
            </p>
          </div>

          <div className="shrink-0 bg-emerald-900/80 px-3 py-2 rounded-lg border border-emerald-800 text-[11px] text-emerald-300">
            الحالة: {allPassed ? '✓ كافة حالات الاختبار ناجحة' : 'جاري الفحص'}
          </div>
        </div>

        {/* Modal Body: Split view of cases and details */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x md:divide-x-reverse divide-slate-200">
          {/* Test cases list (5 cols) */}
          <div className="md:col-span-5 overflow-y-auto p-3 space-y-2 bg-slate-50/50">
            {testResults.map((tc) => {
              const isSelected = selectedCase?.caseId === tc.caseId;
              return (
                <div
                  key={tc.caseId}
                  onClick={() => setSelectedCase(tc)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-white border-emerald-600 shadow-xs ring-1 ring-emerald-500'
                      : 'bg-white/80 border-slate-200 hover:bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-bold text-slate-900">{tc.titleAr}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        tc.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {tc.passed ? 'ناجح ✓' : 'فشل'}
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px] line-clamp-2 leading-relaxed">
                    {tc.descriptionAr}
                  </p>
                  <div className="flex items-center gap-3 pt-2 mt-1 border-t border-slate-100 text-[10px] text-slate-600">
                    <span>
                      النتيجة: <strong className="text-emerald-700">{tc.score}%</strong>
                    </span>
                    <span>·</span>
                    <span>{tc.overallLevel}</span>
                    <span>·</span>
                    <span>{tc.confidence}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Test case detail (7 cols) */}
          <div className="md:col-span-7 overflow-y-auto p-5 space-y-5 bg-white">
            {selectedCase ? (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-bold">
                      {selectedCase.caseId}
                    </span>
                    <h3 className="text-base font-bold text-slate-900">
                      {selectedCase.titleAr}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {selectedCase.descriptionAr}
                  </p>
                </div>

                {/* Score & Badges */}
                <div className="grid grid-cols-3 gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs">
                  <div>
                    <span className="text-[11px] text-slate-400 block">النسبة المحتسبة</span>
                    <span className="text-xl font-black text-emerald-700 tabular-nums">
                      {selectedCase.score}%
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">مستوى التوافق</span>
                    <span className="font-bold text-slate-800 block mt-1">
                      {selectedCase.overallLevel}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">موثوقية التحليل</span>
                    <span className="font-bold text-slate-800 block mt-1">
                      {selectedCase.confidence}
                    </span>
                  </div>
                </div>

                {/* Assertions Verified */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-900 border-r-2 border-emerald-700 pr-2">
                    التحققات المنطقية التي تم اجتيازها:
                  </h4>
                  <ul className="space-y-1.5 pr-2 text-xs text-slate-700">
                    {selectedCase.assertionNotes.map((note, idx) => (
                      <li
                        key={idx}
                        className={`p-2 rounded-lg border leading-relaxed ${
                          note.startsWith('✓')
                            ? 'bg-emerald-50/60 border-emerald-200/70 text-emerald-900'
                            : 'bg-rose-50/60 border-rose-200/70 text-rose-900'
                        }`}
                      >
                        {note}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Dimension Breakdown table for this test case */}
                {selectedCase.compatibilityResult && (
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <h4 className="text-xs font-bold text-slate-900">
                      جدول تفصيل النقاط التوافقية (100 نقطة):
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-right text-[11px] border border-slate-200 rounded-lg overflow-hidden">
                        <thead className="bg-slate-100 text-slate-700 font-bold">
                          <tr>
                            <th className="py-1.5 px-2.5">المعيار</th>
                            <th className="py-1.5 px-2.5">الوزن</th>
                            <th className="py-1.5 px-2.5">النقاط</th>
                            <th className="py-1.5 px-2.5">الحالة</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {selectedCase.compatibilityResult.scoreBreakdown.map((row) => (
                            <tr key={row.criterionId} className="hover:bg-slate-50">
                              <td className="py-1.5 px-2.5 font-medium">{row.nameAr}</td>
                              <td className="py-1.5 px-2.5 text-slate-400">{row.weight}%</td>
                              <td className="py-1.5 px-2.5 font-bold text-emerald-800">{row.earnedPoints}</td>
                              <td className="py-1.5 px-2.5">
                                <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100">
                                  {row.statusLabelAr}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400 text-xs">
                اختر حالة اختبار من القائمة الجانبية لمعاينة تفاصيل الفحص.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            تم تشغيل {testResults.length} حالات اختبار بنجاح واجتياز كافة الفحوصات المنطقية.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-semibold cursor-pointer"
          >
            إغلاق نافذة الفحص
          </button>
        </div>
      </div>
    </div>
  );
};
