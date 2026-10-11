/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState, useEffect } from 'react';
import { MapPin, Briefcase, ChevronRight, ChevronLeft, Building2, AlertTriangle, ArrowRight } from 'lucide-react';
import { Job } from '../../types/job';
import { BreadcrumbItem } from '../../types/seo';
import { JobCard } from './JobCard';
import { Breadcrumbs } from '../common/Breadcrumbs';
import {
  generateLocationLandingMetadata,
  getBaseUrl,
} from '../../utils/seoMetadataService';
import {
  generateJobSlug,
  countryNameToSlug,
  cityNameToSlug,
  specialtyToSlug,
  slugToCountryName,
  slugToCityName,
  slugToSpecialty,
  COMMON_CITY_SLUGS,
} from '../../utils/slugUtils';
import { generateJobListSchema } from '../../utils/structuredData';
import { applyPageMetadata, setStructuredData, setPaginationLinks } from '../../utils/seoHeadService';
import { paginateItems } from '../../utils/paginationUtils';

interface LocationLandingViewProps {
  countrySlug?: string;
  citySlug?: string;
  specialtySlug?: string;
  allPublishedJobs: Job[];
  onSelectJob: (job: Job) => void;
  onNavigateUrl: (url: string) => void;
  onBackToJobs: () => void;
  savedJobIds: string[];
  onToggleSaveJob?: (jobId: string) => void;
}

export const LocationLandingView: React.FC<LocationLandingViewProps> = ({
  countrySlug,
  citySlug,
  specialtySlug,
  allPublishedJobs,
  onSelectJob,
  onNavigateUrl,
  onBackToJobs,
  savedJobIds,
  onToggleSaveJob,
}) => {
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Resolve human-readable Arabic names from slugs
  const countryName = countrySlug ? slugToCountryName(countrySlug) || countrySlug : undefined;
  const cityName = citySlug ? slugToCityName(citySlug, countrySlug) || citySlug : undefined;
  const specialty = specialtySlug ? slugToSpecialty(specialtySlug) : null;
  const specialtyName = specialty ? specialty.nameAr : undefined;

  // Filter published jobs matching this criteria
  const matchingJobs = useMemo(() => {
    return allPublishedJobs.filter((job) => {
      // Country match
      if (countrySlug) {
        const jobCountrySlug = countryNameToSlug(job.country);
        if (jobCountrySlug !== countrySlug) return false;
      }

      // City match
      if (citySlug) {
        const jobCitySlug = cityNameToSlug(job.city);
        if (jobCitySlug !== citySlug) return false;
      }

      // Specialty match
      if (specialtySlug && specialty) {
        if (job.category !== specialty.id) {
          // Fallback title / skills keyword match
          const catMatch = job.category && specialtyToSlug(job.category) === specialtySlug;
          if (!catMatch) return false;
        }
      }

      return true;
    });
  }, [allPublishedJobs, countrySlug, citySlug, specialtySlug, specialty]);

  // Construct clean base canonical path
  const canonicalBasePath = useMemo(() => {
    let path = '/jobs';
    if (countrySlug) {
      path += `/${countrySlug}`;
      if (citySlug) {
        path += `/${citySlug}`;
        if (specialtySlug) {
          path += `/${specialtySlug}`;
        }
      }
    }
    return `${getBaseUrl()}${path}`;
  }, [countrySlug, citySlug, specialtySlug]);

  // Paginate jobs (12 per page)
  const pagination = useMemo(() => {
    return paginateItems(matchingJobs, currentPage, 12, canonicalBasePath);
  }, [matchingJobs, currentPage, canonicalBasePath]);

  // Sync Metadata and Structured Data
  useEffect(() => {
    const meta = generateLocationLandingMetadata({
      countryName,
      cityName,
      specialtyName,
      publishedJobCount: matchingJobs.length,
    });

    // Update canonical if on paginated page
    if (pagination.currentPage > 1) {
      meta.canonicalUrl = pagination.canonicalUrl;
    }

    applyPageMetadata(meta);
    setPaginationLinks(pagination.prevPageUrl, pagination.nextPageUrl);

    // Inject ItemList Schema for rich search listing if jobs exist
    if (matchingJobs.length > 0) {
      const pageTitle = meta.title;
      const schema = generateJobListSchema(
        pageTitle,
        meta.description,
        pagination.items,
        getBaseUrl(),
        (j) => generateJobSlug(j, allPublishedJobs)
      );
      setStructuredData(schema);
    } else {
      setStructuredData(null);
    }

    return () => {
      setPaginationLinks(null, null);
      setStructuredData(null);
    };
  }, [countryName, cityName, specialtyName, matchingJobs.length, pagination, allPublishedJobs]);

  // Build Breadcrumbs
  const breadcrumbItems: BreadcrumbItem[] = useMemo(() => {
    const items: BreadcrumbItem[] = [
      { name: 'الرئيسية', url: '/' },
      { name: 'الوظائف', url: '/jobs' },
    ];

    if (countryName && countrySlug) {
      const countryUrl = `/jobs/${countrySlug}`;
      items.push({
        name: countryName,
        url: countryUrl,
        isCurrent: !citySlug && !specialtySlug,
      });

      if (cityName && citySlug) {
        const cityUrl = `/jobs/${countrySlug}/${citySlug}`;
        items.push({
          name: cityName,
          url: cityUrl,
          isCurrent: !specialtySlug,
        });

        if (specialtyName && specialtySlug) {
          const specUrl = `/jobs/${countrySlug}/${citySlug}/${specialtySlug}`;
          items.push({
            name: specialtyName,
            url: specUrl,
            isCurrent: true,
          });
        }
      }
    }

    return items;
  }, [countryName, countrySlug, cityName, citySlug, specialtyName, specialtySlug]);

  // Find related sibling cities in the same country for internal linking
  const siblingCities = useMemo(() => {
    if (!countrySlug) return [];
    return Object.entries(COMMON_CITY_SLUGS)
      .filter(([slug, data]) => data.countrySlug === countrySlug && slug !== citySlug)
      .map(([slug, data]) => ({ slug, nameAr: data.ar }));
  }, [countrySlug, citySlug]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Breadcrumb Navigation */}
      <div className="mb-4">
        <Breadcrumbs items={breadcrumbItems} onNavigate={onNavigateUrl} />
      </div>

      {/* Back button */}
      <div className="mb-4">
        <button
          onClick={onBackToJobs}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-600 hover:text-emerald-700 transition-colors cursor-pointer"
        >
          <ArrowRight className="w-4 h-4 rtl:rotate-0" />
          <span>العودة إلى جميع الوظائف</span>
        </button>
      </div>

      {/* Header section with SEO heading & stats */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                <span>{countryName || 'دول الخليج العربي'}</span>
              </span>
              {cityName && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                  <Building2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>{cityName}</span>
                </span>
              )}
              {specialtyName && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-800 border border-purple-200">
                  <Briefcase className="w-3.5 h-3.5 text-purple-600" />
                  <span>{specialtyName}</span>
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">
              {specialtyName && cityName
                ? `وظائف ${specialtyName} في ${cityName}`
                : cityName && countryName
                ? `وظائف في ${cityName}، ${countryName}`
                : countryName
                ? `وظائف شاغرة في ${countryName}`
                : 'دليل الوظائف المعتمدة في دول الخليج'}
            </h1>

            <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-3xl leading-relaxed">
              {specialtyName && cityName
                ? `تصفح أحدث الوظائف وفرص العمل المتاحة في تخصص ${specialtyName} بمدينة ${cityName}. فرص عمل منشورة ومتحقق منها.`
                : cityName
                ? `استكشف كافة الشواغر والوظائف المتاحة حالياً في ${cityName}. ابحث وتقدم مباشرة لأبرز الشركات.`
                : countryName
                ? `دليل الفرص الوظيفية الشاغرة لدى أبرز القطاعات والشركات في ${countryName}.`
                : 'اكتشف فرص العمل الحديثة في كافة دول مجلس التعاون الخليجي.'}
            </p>
          </div>

          <div className="shrink-0 bg-slate-50 border border-slate-200 rounded-xl p-4 text-center min-w-[130px]">
            <span className="block text-2xl font-extrabold text-emerald-800">
              {matchingJobs.length}
            </span>
            <span className="text-xs text-slate-500 font-medium">وظيفة معلنة</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {matchingJobs.length === 0 ? (
        // Thin page guard & empty state
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 sm:p-12 text-center">
          <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-200">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">لا توجد وظائف معلنة حالياً في هذا التصنيف</h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto mb-6 leading-relaxed">
            يتم تحديث الوظائف بصورة دورية. لم يتم نشر شواغر جديدة متوافقة مع هذه المعايير اليوم،
            يمكنك الاطلاع على الوظائف في مدن مجاورة أو تخصصات أخرى.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={onBackToJobs}
              className="px-5 py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-sm transition-colors cursor-pointer"
            >
              استعراض كافة الوظائف المتاحة
            </button>
            {countrySlug && (
              <button
                onClick={() => onNavigateUrl(`/jobs/${countrySlug}`)}
                className="px-5 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm transition-colors cursor-pointer"
              >
                وظائف {countryName} عامة
              </button>
            )}
          </div>
        </div>
      ) : (
        <div>
          {/* Jobs List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {pagination.items.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onSelect={() => onSelectJob(job)}
                isSaved={savedJobIds.includes(job.id)}
                onToggleSave={onToggleSaveJob ? () => onToggleSaveJob(job.id) : undefined}
                slug={generateJobSlug(job, allPublishedJobs)}
              />
            ))}
          </div>

          {/* Pagination Controls (Readiness for SEO pagination) */}
          {pagination.totalPages > 1 && (
            <div className="mt-8 flex items-center justify-between border-t border-slate-200 pt-6">
              <button
                onClick={() => {
                  setCurrentPage((p) => Math.max(1, p - 1));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                disabled={!pagination.hasPrevPage}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4 rtl:rotate-0" />
                <span>الصفحة السابقة</span>
              </button>

              <div className="text-xs sm:text-sm text-slate-600">
                صفحة <span className="font-bold text-slate-900">{pagination.currentPage}</span> من{' '}
                <span className="font-bold text-slate-900">{pagination.totalPages}</span>
              </div>

              <button
                onClick={() => {
                  setCurrentPage((p) => Math.min(pagination.totalPages, p + 1));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                disabled={!pagination.hasNextPage}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <span>الصفحة التالية</span>
                <ChevronLeft className="w-4 h-4 rtl:rotate-0" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Internal Linking Section: Sibling Cities in Same Country */}
      {siblingCities.length > 0 && countrySlug && (
        <div className="mt-12 bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-600" />
            <span>مدن أخرى في {countryName}:</span>
          </h2>
          <div className="flex flex-wrap gap-2">
            {siblingCities.map((sibling) => (
              <a
                key={sibling.slug}
                href={`/jobs/${countrySlug}/${sibling.slug}`}
                onClick={(e) => {
                  e.preventDefault();
                  onNavigateUrl(`/jobs/${countrySlug}/${sibling.slug}`);
                }}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-slate-50 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 border border-slate-200 transition-colors"
              >
                وظائف {sibling.nameAr}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
