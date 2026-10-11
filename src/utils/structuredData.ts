/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Job } from '../types/job';
import { BreadcrumbItem } from '../types/seo';
import { countryNameToSlug } from './slugUtils';

/**
 * Standard Schema.org EmploymentType mapping
 */
function mapSchemaEmploymentType(type: Job['employmentType']): string {
  switch (type) {
    case 'full_time':
      return 'FULL_TIME';
    case 'part_time':
      return 'PART_TIME';
    case 'contract':
      return 'CONTRACTOR';
    case 'temporary':
      return 'TEMPORARY';
    case 'internship':
      return 'INTERN';
    default:
      return 'FULL_TIME';
  }
}

/**
 * Generates Schema.org JobPosting JSON-LD.
 * Strictly adheres to Google Search Central and Schema.org guidelines:
 * - Never fabricates non-existent data (e.g., logos, salaries).
 * - Omit unknown fields cleanly.
 * - Handles remote jobs with appropriate telecommute & applicantLocationRequirements.
 */
export function generateJobPostingSchema(job: Job, canonicalUrl: string): Record<string, unknown> {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    url: canonicalUrl,
    title: job.title,
    description: job.description,
    datePosted: job.datePosted,
    employmentType: mapSchemaEmploymentType(job.employmentType),
    hiringOrganization: {
      '@type': 'Organization',
      name: job.companyName,
      ...(job.companyLogo ? { logo: job.companyLogo } : {}),
      ...(job.sourceUrl ? { sameAs: job.sourceUrl } : {}),
    },
  };

  // validThrough (only when specified)
  if (job.validThrough) {
    schema.validThrough = job.validThrough;
  }

  // Address and Location Handling
  const countryCode = countryNameToSlug(job.country).toUpperCase();
  const addressObject: Record<string, unknown> = {
    '@type': 'PostalAddress',
    addressCountry: countryCode === 'SAUDI-ARABIA' ? 'SA' : countryCode === 'UAE' ? 'AE' : countryCode,
    addressLocality: job.city,
  };

  if (job.region) {
    addressObject.addressRegion = job.region;
  }
  if (job.address) {
    addressObject.streetAddress = job.address;
  }

  // Remote vs On-site Location Handling
  if (job.workMode === 'remote') {
    schema.jobLocationType = 'TELECOMMUTE';

    // When country is known and specified in the job, specify applicantLocationRequirements
    if (job.country) {
      schema.applicantLocationRequirements = {
        '@type': 'Country',
        name: job.country,
      };
    }

    // Physical hiring site if provided
    schema.jobLocation = {
      '@type': 'Place',
      address: addressObject,
    };
  } else {
    // on_site or hybrid
    schema.jobLocation = {
      '@type': 'Place',
      address: addressObject,
    };
  }

  // BaseSalary (Strict rule: NEVER invent salary if not disclosed)
  if (job.salaryMin !== null || job.salaryMax !== null) {
    const valueObject: Record<string, unknown> = {
      '@type': 'QuantitativeValue',
      unitText: 'MONTH', // Standard monthly compensation in the GCC region
    };

    if (job.salaryMin !== null) {
      valueObject.minValue = job.salaryMin;
    }
    if (job.salaryMax !== null) {
      valueObject.maxValue = job.salaryMax;
    }

    schema.baseSalary = {
      '@type': 'MonetaryAmount',
      currency: job.salaryCurrency || 'SAR',
      value: valueObject,
    };
  }

  // Direct apply indicator
  if (job.applicationMethod === 'external_url' || job.applicationMethod === 'direct') {
    schema.directApply = true;
  }

  // Skills / Qualifications (only if explicitly populated)
  if (job.skills && job.skills.length > 0) {
    schema.skills = job.skills.join(', ');
  }

  if (job.responsibilities && job.responsibilities.length > 0) {
    schema.responsibilities = job.responsibilities.join('. ');
  }

  if (job.education) {
    schema.educationRequirements = {
      '@type': 'EducationalOccupationalCredential',
      credentialCategory: job.education,
    };
  }

  return schema;
}

/**
 * Generates Schema.org BreadcrumbList JSON-LD
 */
export function generateBreadcrumbSchema(items: BreadcrumbItem[], baseUrl: string): Record<string, unknown> {
  const cleanBase = baseUrl.replace(/\/+$/, '');

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => {
      const fullUrl = item.url.startsWith('http') ? item.url : `${cleanBase}${item.url.startsWith('/') ? '' : '/'}${item.url}`;
      return {
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: fullUrl,
      };
    }),
  };
}

/**
 * Generates Schema.org ItemList JSON-LD for collection pages (e.g. /jobs/saudi-arabia/riyadh)
 */
export function generateJobListSchema(
  name: string,
  description: string,
  jobs: Job[],
  baseUrl: string,
  jobSlugGenerator: (j: Job) => string
): Record<string, unknown> {
  const cleanBase = baseUrl.replace(/\/+$/, '');

  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    description,
    numberOfItems: jobs.length,
    itemListElement: jobs.map((job, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: job.title,
      url: `${cleanBase}/job/${jobSlugGenerator(job)}`,
    })),
  };
}
