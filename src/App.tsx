/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Job, JobCategory, JobStatus } from './types/job';
import { JobFilterState, DEFAULT_FILTER_STATE } from './types/filters';
import { JobSeekerProfile, ProfileCompletionMetrics } from './types/profile';
import { jobService, CountryStat, AdminStats } from './services/jobService';
import { savedJobsService } from './services/savedJobsService';
import { profileService, calculateProfileCompletion } from './services/profileService';
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { HeroSearch } from './components/search/HeroSearch';
import { HomeFeaturedTabs } from './components/home/HomeFeaturedTabs';
import { SpecializationsSection } from './components/home/SpecializationsSection';
import { CountriesSection } from './components/home/CountriesSection';
import { SearchResultsView } from './components/search/SearchResultsView';
import { JobDetailsView } from './components/jobs/JobDetailsView';
import { ProfileView } from './components/profile/ProfileView';
import { SavedJobsView } from './components/saved/SavedJobsView';
import { SuitableJobsView } from './components/jobs/SuitableJobsView';
import { LocationLandingView } from './components/jobs/LocationLandingView';
import { isJobExpiredByDate } from './services/jobValidationService';
import { parseRoute, findJobBySlug } from './utils/routeUtils';
import { generateJobSlug, countryNameToSlug } from './utils/slugUtils';
import { generateDefaultMetadata, applyPageMetadata } from './utils/seoMetadataService';
import { AdminLayout, AdminTab } from './components/admin/AdminLayout';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminJobList } from './components/admin/AdminJobList';
import { JobFormModal } from './components/admin/JobFormModal';
import { AdminPlaceholderView } from './components/admin/AdminPlaceholderView';
import { CompatibilityTestRunnerModal } from './components/admin/CompatibilityTestRunnerModal';
import { SeoTestRunnerModal } from './components/admin/SeoTestRunnerModal';
import { BackendTestRunnerModal } from './components/admin/BackendTestRunnerModal';
import { AuthModal } from './components/common/AuthModal';
import { authService } from './services/authService';
import { migrationService } from './services/migrationService';
import { applicationService } from './services/applicationService';
import { MyApplicationsView } from './components/profile/MyApplicationsView';
import { AdminApplicationsView } from './components/admin/AdminApplicationsView';
import { User as UserType } from './types/auth';

export default function App() {
  // Authentication & Identity State (Phase 6)
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isBackendRunnerOpen, setIsBackendRunnerOpen] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Navigation & View state
  const [currentView, setCurrentView] = useState<
    'home' | 'search' | 'job_detail' | 'admin' | 'profile' | 'saved_jobs' | 'suitable_jobs' | 'location_landing' | 'my_applications'
  >('home');
  const [activeHeaderTab, setActiveHeaderTab] = useState<string>('home');
  const [myApplicationsCount, setMyApplicationsCount] = useState<number>(0);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isFromAdminPreview, setIsFromAdminPreview] = useState(false);
  const [isTestRunnerOpen, setIsTestRunnerOpen] = useState(false);
  const [isSeoRunnerOpen, setIsSeoRunnerOpen] = useState(false);
  const [locationRouteParams, setLocationRouteParams] = useState<{
    countrySlug?: string;
    citySlug?: string;
    specialtySlug?: string;
  }>({});

  // Saved Jobs & Profile State (Phase 3)
  const [savedJobIds, setSavedJobIds] = useState<string[]>([]);
  const [savedJobs, setSavedJobs] = useState<Job[]>([]);
  const [userProfile, setUserProfile] = useState<JobSeekerProfile | null>(null);
  const [profileMetrics, setProfileMetrics] = useState<ProfileCompletionMetrics | null>(null);

  // Admin View State
  const [adminTab, setAdminTab] = useState<AdminTab>('dashboard');
  const [adminStatusFilter, setAdminStatusFilter] = useState<JobStatus | 'all'>('all');
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);

  // Filter state for public search
  const [filters, setFilters] = useState<JobFilterState>(DEFAULT_FILTER_STATE);

  // Data collections from jobService repository
  const [allFilteredJobs, setAllFilteredJobs] = useState<Job[]>([]);
  const [totalResults, setTotalResults] = useState<number>(0);
  const [latestJobs, setLatestJobs] = useState<Job[]>([]);
  const [todayJobs, setTodayJobs] = useState<Job[]>([]);
  const [remoteJobs, setRemoteJobs] = useState<Job[]>([]);
  const [entryLevelJobs, setEntryLevelJobs] = useState<Job[]>([]);
  const [categories, setCategories] = useState<JobCategory[]>([]);
  const [countryStats, setCountryStats] = useState<CountryStat[]>([]);

  // Admin collections
  const [adminAllJobs, setAdminAllJobs] = useState<Job[]>([]);
  const [adminStats, setAdminStats] = useState<AdminStats>({
    total: 0,
    published: 0,
    pendingReview: 0,
    drafts: 0,
    expired: 0,
    rejected: 0,
    duplicate: 0,
    paused: 0,
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Active published public jobs for personalized matching (Phase 4.1)
  const publicJobs = useMemo(() => {
    return adminAllJobs.filter(
      (j) => j.status === 'published' && (!j.validThrough || !isJobExpiredByDate(j.validThrough))
    );
  }, [adminAllJobs]);

  // Reload saved jobs
  const refreshSavedJobs = useCallback(async () => {
    try {
      const ids = await savedJobsService.getSavedJobIds();
      setSavedJobIds(ids);
      const jobs = await savedJobsService.getSavedJobs();
      setSavedJobs(jobs);
    } catch (err) {
      console.error('Error fetching saved jobs:', err);
    }
  }, []);

  // Reload user profile & completion metrics
  const refreshProfile = useCallback(async () => {
    try {
      const p = await profileService.getProfile();
      setUserProfile(p);
      setProfileMetrics(calculateProfileCompletion(p));
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  }, []);

  // Reload all datasets (public and admin)
  const refreshAllData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [
        latest,
        today,
        remote,
        entry,
        cats,
        stats,
        publicQuery,
        adminQuery,
        aStats,
      ] = await Promise.all([
        jobService.getLatestJobs(8),
        jobService.getTodayJobs(),
        jobService.getRemoteJobs(),
        jobService.getEntryLevelJobs(),
        jobService.getCategories(),
        jobService.getCountryStats(),
        jobService.getJobs(filters, { includeAllStatuses: false }),
        jobService.getJobs(undefined, { includeAllStatuses: true }),
        jobService.getAdminStats(),
      ]);

      setLatestJobs(latest);
      setTodayJobs(today);
      setRemoteJobs(remote);
      setEntryLevelJobs(entry);
      setCategories(cats);
      setCountryStats(stats);
      setAllFilteredJobs(publicQuery.jobs);
      setTotalResults(publicQuery.total);
      setAdminAllJobs(adminQuery.jobs);
      setAdminStats(aStats);
    } catch (err) {
      console.error('Error fetching jobs:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    // 1. Subscribe to Authentication State
    const unsubscribeAuth = authService.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });

    // 2. Run localStorage migration to production repository if needed
    migrationService.runMigrationIfNeeded().catch((err) => {
      console.warn('Migration non-fatal warning:', err);
    });

    refreshAllData();
    refreshSavedJobs();
    refreshProfile();

    return () => {
      unsubscribeAuth();
    };
  }, [refreshAllData, refreshSavedJobs, refreshProfile]);

  // Applications count refresher (Phase 7)
  const refreshApplicationsCount = useCallback(async () => {
    if (currentUser) {
      try {
        const apps = await applicationService.getMyApplications(currentUser);
        setMyApplicationsCount(apps.length);
      } catch (e) {
        setMyApplicationsCount(0);
      }
    } else {
      setMyApplicationsCount(0);
    }
  }, [currentUser]);

  useEffect(() => {
    refreshApplicationsCount();
  }, [currentUser, refreshApplicationsCount]);

  // HTML5 History navigation helper
  const navigateTo = useCallback((path: string, replace = false) => {
    if (typeof window !== 'undefined') {
      if (replace) {
        window.history.replaceState({}, '', path);
      } else {
        window.history.pushState({}, '', path);
      }
    }
  }, []);

  // Synchronize route from browser location
  const syncRouteWithState = useCallback(() => {
    if (typeof window === 'undefined') return;
    const match = parseRoute(window.location.pathname);

    switch (match.type) {
      case 'home':
        setCurrentView('home');
        setActiveHeaderTab('home');
        setSelectedJob(null);
        applyPageMetadata(generateDefaultMetadata('home'));
        break;
      case 'jobs_index':
        setCurrentView('search');
        setActiveHeaderTab('directory');
        setSelectedJob(null);
        applyPageMetadata(generateDefaultMetadata('search'));
        break;
      case 'jobs_country':
      case 'jobs_city':
      case 'jobs_specialty':
        setLocationRouteParams({
          countrySlug: match.countrySlug,
          citySlug: match.citySlug,
          specialtySlug: match.specialtySlug,
        });
        setCurrentView('location_landing');
        setActiveHeaderTab('directory');
        setSelectedJob(null);
        break;
      case 'job_detail':
        if (match.jobSlug && adminAllJobs.length > 0) {
          const found = findJobBySlug(match.jobSlug, adminAllJobs);
          if (found) {
            setSelectedJob(found);
            setIsFromAdminPreview(false);
            setCurrentView('job_detail');
            setActiveHeaderTab('directory');
          }
        }
        break;
      case 'suitable_jobs':
        setCurrentView('suitable_jobs');
        setActiveHeaderTab('suitable_jobs');
        setSelectedJob(null);
        applyPageMetadata(generateDefaultMetadata('suitable_jobs'));
        break;
      case 'saved_jobs':
        setCurrentView('saved_jobs');
        setActiveHeaderTab('saved_jobs');
        setSelectedJob(null);
        applyPageMetadata(generateDefaultMetadata('saved_jobs'));
        break;
      case 'profile':
        setCurrentView('profile');
        setActiveHeaderTab('profile');
        setSelectedJob(null);
        applyPageMetadata(generateDefaultMetadata('profile'));
        break;
      case 'my_applications':
        setCurrentView('my_applications');
        setActiveHeaderTab('my_applications');
        setSelectedJob(null);
        applyPageMetadata(generateDefaultMetadata('profile'));
        break;
      case 'admin':
        setCurrentView('admin');
        setActiveHeaderTab('admin');
        setSelectedJob(null);
        applyPageMetadata(generateDefaultMetadata('admin'));
        break;
      default:
        break;
    }
  }, [adminAllJobs]);

  useEffect(() => {
    syncRouteWithState();
    window.addEventListener('popstate', syncRouteWithState);
    return () => window.removeEventListener('popstate', syncRouteWithState);
  }, [syncRouteWithState]);

  // Navigate directly via clean URL
  const handleNavigateUrl = useCallback(
    (url: string) => {
      navigateTo(url);
      syncRouteWithState();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [navigateTo, syncRouteWithState]
  );

  // Execute search/filter query in public view
  const executeQuery = useCallback(async (currentFilters: JobFilterState) => {
    setIsLoading(true);
    try {
      const result = await jobService.getJobs(currentFilters, { includeAllStatuses: false });
      setAllFilteredJobs(result.jobs);
      setTotalResults(result.total);
    } catch (err) {
      console.error('Error querying filtered jobs:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Search parameters submit from HeroSearch
  const handleHeroSearch = (params: {
    keyword: string;
    country: string;
    region: string;
    city: string;
  }) => {
    const updated: JobFilterState = {
      ...filters,
      keyword: params.keyword,
      country: params.country,
      region: params.region,
      city: params.city,
    };
    setFilters(updated);
    setCurrentView('search');
    navigateTo('/jobs');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    executeQuery(updated);
  };

  // Filter updates from FilterSidebar
  const handleFilterUpdate = (updates: Partial<JobFilterState>) => {
    const updated = { ...filters, ...updates };
    setFilters(updated);
    executeQuery(updated);
  };

  // Reset filters
  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTER_STATE);
    executeQuery(DEFAULT_FILTER_STATE);
  };

  // Navigate to job detail view
  const handleSelectJob = (job: Job) => {
    setSelectedJob(job);
    setIsFromAdminPreview(false);
    setCurrentView('job_detail');
    const slug = generateJobSlug(job, publicJobs);
    navigateTo(`/job/${slug}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Preview job from Admin
  const handlePreviewFromAdmin = (job: Job) => {
    setSelectedJob(job);
    setIsFromAdminPreview(true);
    setCurrentView('job_detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Back from job detail view
  const handleBackToDirectory = () => {
    if (isFromAdminPreview) {
      setCurrentView('admin');
      navigateTo('/admin');
    } else {
      setSelectedJob(null);
      setCurrentView('search');
      navigateTo('/jobs');
    }
  };

  // Open Job Seeker Profile (Phase 3)
  const handleOpenProfile = () => {
    setActiveHeaderTab('profile');
    setCurrentView('profile');
    navigateTo('/profile');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Open Saved Jobs (Phase 3)
  const handleOpenSavedJobs = () => {
    setActiveHeaderTab('saved_jobs');
    setCurrentView('saved_jobs');
    navigateTo('/saved');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Open Personalized Suitable Jobs (Phase 4.1)
  const handleOpenSuitableJobs = () => {
    setActiveHeaderTab('suitable_jobs');
    setCurrentView('suitable_jobs');
    navigateTo('/suitable');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Open Candidate Applications Tracking (Phase 7)
  const handleOpenMyApplications = () => {
    setActiveHeaderTab('my_applications');
    setCurrentView('my_applications');
    navigateTo('/my-applications');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Toggle saving / bookmarking a job
  const handleToggleSaveJob = async (jobId: string) => {
    if (savedJobIds.includes(jobId)) {
      await savedJobsService.unsaveJob(jobId);
    } else {
      await savedJobsService.saveJob(jobId);
    }
    await refreshSavedJobs();
  };

  // Clear all saved jobs
  const handleClearAllSaved = async () => {
    await savedJobsService.clearSavedJobs();
    await refreshSavedJobs();
  };

  // Header navigation handling
  const handleHeaderTab = (tab: string) => {
    setActiveHeaderTab(tab);

    if (tab === 'home') {
      setCurrentView('home');
      navigateTo('/');
      applyPageMetadata(generateDefaultMetadata('home'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (tab === 'directory') {
      setCurrentView('search');
      navigateTo('/jobs');
      applyPageMetadata(generateDefaultMetadata('search'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (tab === 'suitable_jobs') {
      handleOpenSuitableJobs();
      return;
    }

    if (tab === 'my_applications') {
      handleOpenMyApplications();
      return;
    }

    if (tab === 'latest') {
      const updated = { ...DEFAULT_FILTER_STATE, sortBy: 'newest' as const };
      setFilters(updated);
      setCurrentView('search');
      navigateTo('/jobs');
      executeQuery(updated);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (tab === 'today') {
      const updated = { ...DEFAULT_FILTER_STATE, postedDate: 'today' };
      setFilters(updated);
      setCurrentView('search');
      navigateTo('/jobs');
      executeQuery(updated);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (tab === 'remote') {
      const updated = { ...DEFAULT_FILTER_STATE, workMode: 'remote' };
      setFilters(updated);
      setCurrentView('search');
      navigateTo('/jobs');
      executeQuery(updated);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (tab === 'entry_level') {
      const updated = { ...DEFAULT_FILTER_STATE, experience: 'no_exp' };
      setFilters(updated);
      setCurrentView('search');
      navigateTo('/jobs');
      executeQuery(updated);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (tab === 'countries') {
      setCurrentView('home');
      navigateTo('/');
      setTimeout(() => {
        const el = document.getElementById('countries-section');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  };

  // Select Country from Directory or Footer
  const handleSelectCountry = (countryCommonName: string) => {
    const slug = countryNameToSlug(countryCommonName);
    setLocationRouteParams({ countrySlug: slug });
    setCurrentView('location_landing');
    navigateTo(`/jobs/${slug}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Select Specialty from Specializations Section or Footer
  const handleSelectSpecialty = (keyword: string) => {
    const updated = {
      ...DEFAULT_FILTER_STATE,
      keyword: keyword,
    };
    setFilters(updated);
    setCurrentView('search');
    navigateTo('/jobs');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    executeQuery(updated);
  };

  // =========================================================================
  // ADMIN ACTIONS & HANDLERS
  // =========================================================================

  const handleOpenAdmin = (tab: AdminTab = 'dashboard') => {
    setAdminTab(tab);
    setCurrentView('admin');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExitAdmin = () => {
    setCurrentView('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenAddNewJob = () => {
    setEditingJob(null);
    setIsJobModalOpen(true);
  };

  const handleOpenEditJob = (job: Job) => {
    setEditingJob(job);
    setIsJobModalOpen(true);
  };

  const handleSaveJobFromModal = async (
    jobData: Omit<Job, 'id' | 'createdAt' | 'updatedAt'>,
    id?: string
  ) => {
    try {
      if (id) {
        await (jobService as any).updateJob(id, jobData, currentUser);
      } else {
        await (jobService as any).createJob(jobData, currentUser);
      }
      await refreshAllData();
      await refreshSavedJobs();
      setIsJobModalOpen(false);
    } catch (err: any) {
      setGlobalError(err.message || 'فشل في حفظ بيانات الوظيفة.');
    }
  };

  const handlePublishJob = async (id: string) => {
    try {
      const res = await (jobService as any).publishJob(id, currentUser);
      if (!res.success) {
        setGlobalError(`تعذر نشر الوظيفة لوجود أخطاء في معايير الجودة:\n- ${res.errors?.join('\n- ')}`);
        return;
      }
      await refreshAllData();
      await refreshSavedJobs();
    } catch (err: any) {
      setGlobalError(err.message || 'فشل في نشر الوظيفة.');
    }
  };

  const handlePauseJob = async (id: string) => {
    try {
      await (jobService as any).pauseJob(id, currentUser);
      await refreshAllData();
      await refreshSavedJobs();
    } catch (err: any) {
      setGlobalError(err.message || 'فشل في إيقاف الوظيفة مؤقتاً.');
    }
  };

  const handleExpireJob = async (id: string) => {
    try {
      await (jobService as any).expireJob(id, currentUser);
      await refreshAllData();
      await refreshSavedJobs();
    } catch (err: any) {
      setGlobalError(err.message || 'فشل في إنهاء صلاحية الوظيفة.');
    }
  };

  const handleDuplicateJob = async (id: string) => {
    try {
      await (jobService as any).duplicateJob(id, currentUser);
      await refreshAllData();
    } catch (err: any) {
      setGlobalError(err.message || 'فشل في نسخ الوظيفة.');
    }
  };

  const handleDeleteJob = async (id: string) => {
    try {
      await (jobService as any).deleteJob(id, currentUser);
      await refreshAllData();
      await refreshSavedJobs();
    } catch (err: any) {
      setGlobalError(err.message || 'فشل في حذف الوظيفة.');
    }
  };

  const handleResetDevData = async () => {
    await jobService.resetToMockData();
    await refreshAllData();
    await refreshSavedJobs();
    alert('تمت استعادة البيانات التجريبية الافتراضية بنجاح.');
  };

  const hasActiveFilters =
    Boolean(filters.keyword) ||
    Boolean(filters.country) ||
    Boolean(filters.region) ||
    Boolean(filters.city) ||
    filters.workMode !== 'all' ||
    filters.employmentType !== 'all' ||
    filters.experience !== 'all' ||
    filters.education !== 'all' ||
    Boolean(filters.hasSalaryOnly) ||
    filters.postedDate !== 'all' ||
    filters.sortBy !== 'newest';

  // =========================================================================
  // RENDER ADMIN VIEW (IF CURRENT VIEW IS ADMIN)
  // =========================================================================
  if (currentView === 'admin') {
    return (
      <>
        <AdminLayout
          currentTab={adminTab}
          onSelectTab={setAdminTab}
          onExitAdmin={handleExitAdmin}
          onResetData={handleResetDevData}
        >
          {adminTab === 'dashboard' && (
            <AdminDashboard
              stats={adminStats}
              recentJobs={adminAllJobs.slice(0, 7)}
              onAddNewJob={handleOpenAddNewJob}
              onPreviewJob={handlePreviewFromAdmin}
              onEditJob={handleOpenEditJob}
              onPublishJob={handlePublishJob}
              onPauseJob={handlePauseJob}
              onExpireJob={handleExpireJob}
              onDuplicateJob={handleDuplicateJob}
              onDeleteJob={handleDeleteJob}
              onViewAllJobs={() => setAdminTab('jobs')}
              onFilterByStatus={(status: JobStatus) => {
                setAdminStatusFilter(status);
                setAdminTab('jobs');
              }}
              onOpenTestRunner={() => setIsTestRunnerOpen(true)}
              onOpenSeoRunner={() => setIsSeoRunnerOpen(true)}
            />
          )}

          {adminTab === 'jobs' && (
            <AdminJobList
              jobs={adminAllJobs}
              initialStatusFilter={adminStatusFilter}
              onAddNewJob={handleOpenAddNewJob}
              onEditJob={handleOpenEditJob}
              onPreviewJob={handlePreviewFromAdmin}
              onPublishJob={handlePublishJob}
              onPauseJob={handlePauseJob}
              onExpireJob={handleExpireJob}
              onDuplicateJob={handleDuplicateJob}
              onDeleteJob={handleDeleteJob}
            />
          )}

          {adminTab === 'duplicates' && (
            <AdminJobList
              jobs={adminAllJobs}
              initialStatusFilter="duplicate"
              onAddNewJob={handleOpenAddNewJob}
              onEditJob={handleOpenEditJob}
              onPreviewJob={handlePreviewFromAdmin}
              onPublishJob={handlePublishJob}
              onPauseJob={handlePauseJob}
              onExpireJob={handleExpireJob}
              onDuplicateJob={handleDuplicateJob}
              onDeleteJob={handleDeleteJob}
            />
          )}

          {adminTab === 'expired' && (
            <AdminJobList
              jobs={adminAllJobs}
              initialStatusFilter="expired"
              onAddNewJob={handleOpenAddNewJob}
              onEditJob={handleOpenEditJob}
              onPreviewJob={handlePreviewFromAdmin}
              onPublishJob={handlePublishJob}
              onPauseJob={handlePauseJob}
              onExpireJob={handleExpireJob}
              onDuplicateJob={handleDuplicateJob}
              onDeleteJob={handleDeleteJob}
            />
          )}

          {adminTab === 'applications' && (
            <AdminApplicationsView
              currentUser={currentUser}
              jobs={adminAllJobs}
              onSelectJob={handlePreviewFromAdmin}
            />
          )}

          {/* Placeholders for upcoming sections */}
          {[
            'companies',
            'sources',
            'categories',
            'countries',
            'regions',
            'cities',
            'settings',
          ].includes(adminTab) && (
            <AdminPlaceholderView
              titleAr="قسم قيد التطوير المعماري"
              descriptionAr="هذا القسم مخصص لإدارة الكيانات المرجعية والمصادر والإعدادات وفق خارطة طريق المنصة."
              plannedPhase="المراحل القادمة"
              onBackToDashboard={() => setAdminTab('dashboard')}
              onGoToJobs={() => setAdminTab('jobs')}
            />
          )}
        </AdminLayout>

        {/* Global Job Form Modal */}
        <JobFormModal
          isOpen={isJobModalOpen}
          onClose={() => setIsJobModalOpen(false)}
          onSave={handleSaveJobFromModal}
          initialJob={editingJob}
        />

        {/* Phase 5.1 SEO Foundation Test Runner Modal */}
        <SeoTestRunnerModal
          isOpen={isSeoRunnerOpen}
          onClose={() => setIsSeoRunnerOpen(false)}
          jobs={publicJobs}
        />

        {/* Phase 6 Backend & Data Integration Test Runner Modal */}
        <BackendTestRunnerModal
          isOpen={isBackendRunnerOpen}
          onClose={() => setIsBackendRunnerOpen(false)}
        />

        {/* Identity & Authentication Modal */}
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          currentUser={currentUser}
          onUserChanged={(u) => {
            setCurrentUser(u);
            refreshAllData();
            refreshSavedJobs();
            refreshProfile();
          }}
        />
      </>
    );
  }

  // =========================================================================
  // RENDER PUBLIC SITE VIEWS (PRESERVING VISUAL DESIGN & BEHAVIOR)
  // =========================================================================
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      {/* Global Error Banner (Section 12 Error State) */}
      {globalError && (
        <div className="bg-rose-50 border-b border-rose-200 text-rose-800 px-4 py-2.5 text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2 max-w-4xl mx-auto w-full">
            <span className="w-2 h-2 rounded-full bg-rose-600 shrink-0"></span>
            <span className="font-semibold">{globalError}</span>
            <button
              onClick={() => setGlobalError(null)}
              className="mr-auto text-xs text-rose-600 hover:text-rose-800 font-bold px-2 py-0.5 rounded hover:bg-rose-100 cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}

      {/* Informative Architectural Status Bar with Admin & Profile Toggles */}
      {/* Primary 3-Zone Header with Saved Jobs & Profile Integration */}
      <Header
        currentTab={activeHeaderTab}
        onSelectTab={handleHeaderTab}
        onExploreAll={() => {
          setCurrentView('search');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenAdmin={() => handleOpenAdmin('dashboard')}
        savedCount={savedJobIds.length}
        onOpenSavedJobs={handleOpenSavedJobs}
        onOpenProfile={handleOpenProfile}
        profileCompletion={profileMetrics?.percentage}
        onOpenSuitableJobs={handleOpenSuitableJobs}
        currentUser={currentUser}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenApplications={handleOpenMyApplications}
        applicationsCount={myApplicationsCount}
      />

      {/* Main Content Area based on currentView */}
      <main className="flex-1">
        {currentView === 'home' && (
          <>
            {/* Prominent Hero Search with Country -> Region -> City cascades */}
            <HeroSearch
              initialKeyword={filters.keyword}
              initialCountry={filters.country}
              initialRegion={filters.region}
              initialCity={filters.city}
              onSearch={handleHeroSearch}
              onClearFilters={handleResetFilters}
              hasActiveFilters={hasActiveFilters}
            />

            {/* Featured Discovery Tabs (أحدث الوظائف، وظائف اليوم، وظائف عن بُعد، وظائف بدون خبرة) */}
            <HomeFeaturedTabs
              latestJobs={latestJobs}
              todayJobs={todayJobs}
              remoteJobs={remoteJobs}
              entryLevelJobs={entryLevelJobs}
              onSelectJob={handleSelectJob}
              savedJobIds={savedJobIds}
              onToggleSave={handleToggleSaveJob}
              onOpenSuitableJobs={handleOpenSuitableJobs}
              onViewMore={(categoryKey) => {
                if (categoryKey === 'today') {
                  handleHeaderTab('today');
                } else if (categoryKey === 'remote') {
                  handleHeaderTab('remote');
                } else if (categoryKey === 'entry') {
                  handleHeaderTab('entry_level');
                } else {
                  handleHeaderTab('latest');
                }
              }}
            />

            {/* Specializations / Categories Section (التخصصات) */}
            <SpecializationsSection
              categories={categories}
              onSelectCategory={handleSelectSpecialty}
            />

            {/* GCC Countries Section (الدول) */}
            <div id="countries-section">
              <CountriesSection
                stats={countryStats}
                onSelectCountry={handleSelectCountry}
              />
            </div>
          </>
        )}

        {currentView === 'search' && (
          <SearchResultsView
            jobs={allFilteredJobs}
            totalResults={totalResults}
            filters={filters}
            onFilterChange={handleFilterUpdate}
            onResetFilters={handleResetFilters}
            onSelectJob={handleSelectJob}
            savedJobIds={savedJobIds}
            onToggleSave={handleToggleSaveJob}
            userProfile={userProfile}
            onOpenProfile={handleOpenProfile}
          />
        )}

        {currentView === 'suitable_jobs' && (
          <SuitableJobsView
            profile={userProfile}
            jobs={publicJobs.length > 0 ? publicJobs : allFilteredJobs}
            savedJobIds={savedJobIds}
            onSelectJob={handleSelectJob}
            onToggleSaveJob={handleToggleSaveJob}
            onOpenProfile={handleOpenProfile}
            onExploreAll={() => {
              setCurrentView('search');
              navigateTo('/jobs');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {currentView === 'location_landing' && (
          <LocationLandingView
            countrySlug={locationRouteParams.countrySlug}
            citySlug={locationRouteParams.citySlug}
            specialtySlug={locationRouteParams.specialtySlug}
            allPublishedJobs={publicJobs}
            onSelectJob={handleSelectJob}
            onNavigateUrl={handleNavigateUrl}
            onBackToJobs={() => {
              setCurrentView('search');
              navigateTo('/jobs');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            savedJobIds={savedJobIds}
            onToggleSaveJob={handleToggleSaveJob}
          />
        )}

        {currentView === 'job_detail' && selectedJob && (
          <JobDetailsView
            job={selectedJob}
            onBack={handleBackToDirectory}
            isAdminPreview={isFromAdminPreview}
            onEditFromPreview={(job) => {
              handleOpenEditJob(job);
              setCurrentView('admin');
            }}
            isSaved={savedJobIds.includes(selectedJob.id)}
            onToggleSave={handleToggleSaveJob}
            onOpenProfile={handleOpenProfile}
            allJobs={publicJobs}
            onSelectJob={handleSelectJob}
            onNavigateUrl={handleNavigateUrl}
            currentUser={currentUser}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
            onViewMyApplications={handleOpenMyApplications}
          />
        )}

        {currentView === 'profile' && (
          <ProfileView
            onProfileUpdated={(updated) => {
              setUserProfile(updated);
              setProfileMetrics(calculateProfileCompletion(updated));
            }}
            onExploreJobs={() => {
              setCurrentView('search');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {currentView === 'my_applications' && (
          <MyApplicationsView
            currentUser={currentUser}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
            onExploreJobs={() => {
              setCurrentView('search');
              navigateTo('/jobs');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onSelectJob={handleSelectJob}
          />
        )}

        {currentView === 'saved_jobs' && (
          <SavedJobsView
            savedJobs={savedJobs}
            onSelectJob={handleSelectJob}
            onUnsaveJob={async (jobId) => {
              await savedJobsService.unsaveJob(jobId);
              await refreshSavedJobs();
            }}
            onClearAllSaved={handleClearAllSaved}
            onExploreJobs={() => {
              setCurrentView('search');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}
      </main>

      {/* Comprehensive Footer with Profile & Saved Links */}
      <Footer
        onSelectCountry={handleSelectCountry}
        onSelectSpecialty={handleSelectSpecialty}
      />

      {/* Global Job Form Modal (accessible if triggered) */}
      <JobFormModal
        isOpen={isJobModalOpen}
        onClose={() => setIsJobModalOpen(false)}
        onSave={handleSaveJobFromModal}
        initialJob={editingJob}
      />

      {/* Phase 4 Compatibility Test Runner Modal */}
      <CompatibilityTestRunnerModal
        isOpen={isTestRunnerOpen}
        onClose={() => setIsTestRunnerOpen(false)}
      />

      {/* Phase 5.1 SEO Foundation Test Runner Modal */}
      <SeoTestRunnerModal
        isOpen={isSeoRunnerOpen}
        onClose={() => setIsSeoRunnerOpen(false)}
        jobs={publicJobs}
      />

      {/* Phase 6 Backend & Data Integration Test Runner Modal */}
      <BackendTestRunnerModal
        isOpen={isBackendRunnerOpen}
        onClose={() => setIsBackendRunnerOpen(false)}
      />

      {/* Identity & Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onUserChanged={(u) => {
          setCurrentUser(u);
          refreshAllData();
          refreshSavedJobs();
          refreshProfile();
          refreshApplicationsCount();
        }}
      />
    </div>
  );
}
