/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Bookmark, Building2, ChevronLeft, Sparkles } from 'lucide-react';
import { Job } from '../../types/job';
import {
  formatLocation,
  getWorkModeLabel,
  getEmploymentTypeLabel,
  formatExperience,
  formatSalary,
} from '../../utils/formatters';
import { formatArabicRelativeDate } from '../../utils/date';

interface JobCardProps {
  job: Job;
  onSelect: (job: Job) => void;
  isSavedInitial?: boolean;
  isSaved?: boolean;
  onToggleSave?: (jobId: string, e: React.MouseEvent) => void;
  compatibilityScore?: number;
  compatibilityLevelLabel?: string;
  slug?: string;
}

export const JobCard: React.FC<JobCardProps> = ({
  job,
  onSelect,
  isSavedInitial = false,
  isSaved: isSavedProp,
  onToggleSave,
  compatibilityScore,
  compatibilityLevelLabel,
  slug,
}) => {
  const [internalSaved, setInternalSaved] = useState(isSavedProp ?? isSavedInitial);

  const isSaved = isSavedProp !== undefined ? isSavedProp : internalSaved;

  const locationText = formatLocation(job);
  const salaryInfo = formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency);
  const relativeDate = formatArabicRelativeDate(job.datePosted);
  const workModeText = getWorkModeLabel(job.workMode);
  const employmentTypeText = getEmploymentTypeLabel(job.employmentType);
  const experienceText = formatExperience(job.experienceMin, job.experienceMax);

  const toggleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleSave) {
      onToggleSave(job.id, e);
    } else {
      setInternalSaved(!internalSaved);
    }
  };

  return (
    <article
      onClick={() => onSelect(job)}
      className="group relative bg-white border border-slate-200/80 hover:border-emerald-600/60 rounded-xl p-5 transition-all duration-200 hover:shadow-sm cursor-pointer"
    >
      {/* Top Row: Company Info & Actions */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-slate-100 border border-slate-200/60 flex items-center justify-center text-slate-600 font-semibold text-base shrink-0 group-hover:border-emerald-200 group-hover:bg-emerald-50/50 transition-colors">
            {job.companyLogo ? (
              <img
                src={job.companyLogo}
                alt={job.companyName}
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain rounded-lg"
              />
            ) : (
              <Building2 className="w-5 h-5 text-slate-500 group-hover:text-emerald-700 transition-colors" />
            )}
          </div>
          <div>
            <h4 className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              {job.companyName}
            </h4>
            <div className="text-xs text-slate-500 mt-0.5 font-normal">
              {locationText}
            </div>
          </div>
        </div>

        {/* Top Actions: Compatibility badge if active & Save bookmark */}
        <div className="flex items-center gap-2">
          {compatibilityScore !== undefined && (
            <div
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold tabular-nums shadow-2xs ${
                compatibilityScore >= 80
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : compatibilityScore >= 60
                  ? 'bg-teal-50 border-teal-300 text-teal-900'
                  : compatibilityScore >= 40
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : 'bg-slate-100 border-slate-300 text-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
              <span>درجة التوافق: {compatibilityScore}%</span>
              {compatibilityLevelLabel && (
                <span className="text-[11px] font-normal text-slate-600 hidden sm:inline">
                  ({compatibilityLevelLabel})
                </span>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={toggleSave}
            title={isSaved ? 'إلغاء حفظ الوظيفة' : 'حفظ الوظيفة للمراجعة'}
            aria-label={isSaved ? 'إلغاء حفظ الوظيفة' : 'حفظ الوظيفة للمراجعة'}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              isSaved
                ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-emerald-700' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Job Title */}
      <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors mb-2.5 leading-snug">
        {slug ? (
          <a
            href={`/job/${slug}`}
            onClick={(e) => {
              e.preventDefault();
              onSelect(job);
            }}
            className="hover:underline focus:outline-hidden"
          >
            {job.title}
          </a>
        ) : (
          job.title
        )}
      </h3>

      {/* Structured Clean Metadata (Zero-Pill discipline: unboxed text with subtle separators) */}
      <div className="flex flex-wrap items-center gap-y-1.5 text-xs text-slate-600 mb-3.5">
        <span className="font-medium text-slate-800">{workModeText}</span>
        <span className="text-slate-300 mx-2" aria-hidden="true">·</span>
        <span>{employmentTypeText}</span>
        <span className="text-slate-300 mx-2" aria-hidden="true">·</span>
        <span>{experienceText}</span>
        {job.education && (
          <>
            <span className="text-slate-300 mx-2" aria-hidden="true">·</span>
            <span className="truncate max-w-[200px]" title={job.education}>{job.education}</span>
          </>
        )}
      </div>

      {/* Description Snippet */}
      <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed mb-4">
        {job.description}
      </p>

      {/* Bottom Row: Salary, Date Posted & CTA */}
      <div className="pt-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <span className={`font-semibold tabular-nums ${salaryInfo.isDisclosed ? 'text-emerald-800' : 'text-slate-500'}`}>
            {salaryInfo.text}
          </span>
          <span className="text-slate-300" aria-hidden="true">·</span>
          <time dateTime={job.datePosted} className="text-slate-500">
            {relativeDate}
          </time>
        </div>

        <div className="flex items-center gap-1.5 text-emerald-700 font-semibold group-hover:text-emerald-800 transition-colors">
          <span>عرض التفاصيل</span>
          <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
        </div>
      </div>
    </article>
  );
};
