/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ============================================================================
 * BACKEND & DATA INTEGRATION TEST RUNNER MODAL (PHASE 6)
 * ============================================================================
 * Interactive automated runner verifying all 20 Phase 6 backend, database,
 * authentication, RBAC, and storage foundation requirements.
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Play,
  CheckCircle2,
  AlertTriangle,
  Database,
  Lock,
  Server,
  FileCheck,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  runBackendIntegrationTestSuite,
  BackendTestCase,
} from '../../services/backendTestScenarios';

interface BackendTestRunnerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BackendTestRunnerModal: React.FC<BackendTestRunnerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [tests, setTests] = useState<BackendTestCase[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [totalDuration, setTotalDuration] = useState<number>(0);
  const [expandedTestId, setExpandedTestId] = useState<number | null>(null);

  const executeTests = async () => {
    setIsRunning(true);
    try {
      const summary = await runBackendIntegrationTestSuite((_, currentTests) => {
        setTests([...currentTests]);
      });
      setTests(summary.tests);
      setTotalDuration(summary.totalDurationMs);
    } catch (e) {
      console.error('Test execution failed:', e);
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      executeTests();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const passedCount = tests.filter((t) => t.status === 'passed').length;
  const failedCount = tests.filter((t) => t.status === 'failed').length;
  const totalCount = tests.length || 20;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150"
        dir="rtl"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-xs">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <span>فحص البنية التحتية الخلفية وقواعد البيانات</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-semibold">
                  المرحلة 6 (20 فحصاً تكاملياً)
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                التحقق الآلي من الهوية، الجلسات، التخزين الخاص، الصلاحيات RBAC، والتوافق
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Metrics Banner */}
        <div className="px-6 py-3 bg-white border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-slate-500">الحالة العامة:</span>
              {isRunning ? (
                <span className="font-bold text-purple-600 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-600 animate-ping"></span>
                  جارٍ التنفيذ...
                </span>
              ) : failedCount === 0 && passedCount === totalCount ? (
                <span className="font-bold text-emerald-700 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  اجتياز كامل (100%)
                </span>
              ) : (
                <span className="font-bold text-amber-700">
                  {passedCount} من {totalCount} ناجح
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-500">وقت التنفيذ:</span>
              <span className="font-semibold text-slate-800">
                {isRunning ? '...' : `${totalDuration} مللي ثانية`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={executeTests}
              disabled={isRunning}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-purple-700 hover:bg-purple-800 disabled:opacity-50 rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
              <span>إعادة تشغيل الفحص</span>
            </button>
          </div>
        </div>

        {/* Test List Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-2.5">
          {tests.map((test) => {
            const isExpanded = expandedTestId === test.id;
            return (
              <div
                key={test.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  test.status === 'passed'
                    ? 'bg-emerald-50/40 border-emerald-200'
                    : test.status === 'failed'
                    ? 'bg-rose-50/60 border-rose-200'
                    : test.status === 'running'
                    ? 'bg-purple-50/50 border-purple-300'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div
                  className="flex items-center justify-between cursor-pointer select-none"
                  onClick={() => setExpandedTestId(isExpanded ? null : test.id)}
                >
                  <div className="flex items-center gap-3">
                    {test.status === 'passed' ? (
                      <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    ) : test.status === 'failed' ? (
                      <div className="w-6 h-6 rounded-full bg-rose-100 flex items-center justify-center text-rose-700 shrink-0">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                    ) : test.status === 'running' ? (
                      <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 shrink-0 animate-spin">
                        <RotateCcw className="w-3.5 h-3.5" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 shrink-0 text-xs font-bold">
                        {test.id}
                      </div>
                    )}

                    <div>
                      <div className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                        <span>{test.nameAr}</span>
                        <span className="text-[11px] font-normal text-slate-400">
                          ({test.nameEn})
                        </span>
                      </div>
                      {test.details && (
                        <div className="text-xs text-slate-600 mt-0.5">{test.details}</div>
                      )}
                      {test.error && (
                        <div className="text-xs text-rose-700 font-medium mt-1">
                          خطأ: {test.error}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    {test.durationMs !== undefined && (
                      <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
                        {test.durationMs}ms
                      </span>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-slate-200/60 text-xs text-slate-600 bg-white/70 p-3 rounded-lg font-mono">
                    <div>
                      <span className="font-bold text-slate-800">Test ID:</span> #{test.id}
                    </div>
                    <div>
                      <span className="font-bold text-slate-800">Status:</span> {test.status}
                    </div>
                    <div>
                      <span className="font-bold text-slate-800">Details:</span> {test.details || 'N/A'}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            البنية التحتية جاهزة تماماً للربط مع قواعد البيانات السحابية (PostgreSQL / Cloud SQL / Supabase)
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
