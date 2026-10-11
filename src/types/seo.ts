/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PageMetadata {
  title: string;
  description: string;
  canonicalUrl: string;
  robots: string; // e.g. "index, follow" | "noindex, follow" | "noindex, nofollow"
  ogTitle?: string;
  ogDescription?: string;
  ogType?: 'website' | 'article';
  ogUrl?: string;
  ogImage?: string;
  twitterCard?: 'summary' | 'summary_large_image';
}

export interface BreadcrumbItem {
  name: string;
  url: string; // Clean relative or absolute path
  isCurrent?: boolean;
}

export interface RouteMatch {
  type:
    | 'home'
    | 'jobs_index'
    | 'jobs_country'
    | 'jobs_city'
    | 'jobs_specialty'
    | 'job_detail'
    | 'suitable_jobs'
    | 'saved_jobs'
    | 'profile'
    | 'my_applications'
    | 'admin'
    | 'unknown';
  countrySlug?: string;
  citySlug?: string;
  specialtySlug?: string;
  jobSlug?: string;
}
