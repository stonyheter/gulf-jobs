/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PageMetadata } from '../types/seo';

const STRUCTURED_DATA_ID = 'seo-structured-data';
const BREADCRUMB_DATA_ID = 'seo-breadcrumb-data';
const PAGINATION_PREV_ID = 'seo-link-prev';
const PAGINATION_NEXT_ID = 'seo-link-next';
const CANONICAL_LINK_ID = 'seo-canonical-link';

/**
 * Updates an existing meta tag or creates a new one in the document head.
 */
function setMetaTag(nameOrProperty: 'name' | 'property', key: string, content: string): void {
  if (typeof document === 'undefined') return;

  let el = document.querySelector(`meta[${nameOrProperty}="${key}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(nameOrProperty, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

/**
 * Updates or creates the canonical <link rel="canonical"> tag.
 */
export function setCanonicalUrl(canonicalUrl: string): void {
  if (typeof document === 'undefined') return;

  let el = document.getElementById(CANONICAL_LINK_ID) as HTMLLinkElement | null;
  if (!el) {
    el = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  }
  if (!el) {
    el = document.createElement('link');
    el.id = CANONICAL_LINK_ID;
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', canonicalUrl);
}

/**
 * Sets rel="prev" and rel="next" links for paginated views.
 */
export function setPaginationLinks(prevUrl: string | null, nextUrl: string | null): void {
  if (typeof document === 'undefined') return;

  // Manage rel=prev
  let prevEl = document.getElementById(PAGINATION_PREV_ID) as HTMLLinkElement | null;
  if (prevUrl) {
    if (!prevEl) {
      prevEl = document.createElement('link');
      prevEl.id = PAGINATION_PREV_ID;
      prevEl.setAttribute('rel', 'prev');
      document.head.appendChild(prevEl);
    }
    prevEl.setAttribute('href', prevUrl);
  } else if (prevEl) {
    prevEl.remove();
  }

  // Manage rel=next
  let nextEl = document.getElementById(PAGINATION_NEXT_ID) as HTMLLinkElement | null;
  if (nextUrl) {
    if (!nextEl) {
      nextEl = document.createElement('link');
      nextEl.id = PAGINATION_NEXT_ID;
      nextEl.setAttribute('rel', 'next');
      document.head.appendChild(nextEl);
    }
    nextEl.setAttribute('href', nextUrl);
  } else if (nextEl) {
    nextEl.remove();
  }
}

/**
 * Injects or updates Schema.org JSON-LD structured data in the document head.
 */
export function setStructuredData(data: Record<string, unknown> | null, scriptId: string = STRUCTURED_DATA_ID): void {
  if (typeof document === 'undefined') return;

  const existing = document.getElementById(scriptId);
  if (!data) {
    if (existing) existing.remove();
    return;
  }

  let script = existing as HTMLScriptElement | null;
  if (!script) {
    script = document.createElement('script');
    script.id = scriptId;
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(data, null, 2);
}

/**
 * Injects or updates Breadcrumbs JSON-LD structured data.
 */
export function setBreadcrumbStructuredData(data: Record<string, unknown> | null): void {
  setStructuredData(data, BREADCRUMB_DATA_ID);
}

/**
 * Cleans up all dynamic SEO tags and scripts (useful when leaving specific views).
 */
export function clearDynamicSeoElements(): void {
  if (typeof document === 'undefined') return;

  document.getElementById(STRUCTURED_DATA_ID)?.remove();
  document.getElementById(BREADCRUMB_DATA_ID)?.remove();
  document.getElementById(PAGINATION_PREV_ID)?.remove();
  document.getElementById(PAGINATION_NEXT_ID)?.remove();
}

/**
 * Applies full PageMetadata to the DOM (Title, Meta Description, Robots, OG tags, Canonical).
 */
export function applyPageMetadata(metadata: PageMetadata): void {
  if (typeof document === 'undefined') return;

  // Title
  document.title = metadata.title;

  // Meta Description
  setMetaTag('name', 'description', metadata.description);

  // Robots
  setMetaTag('name', 'robots', metadata.robots);

  // Canonical
  setCanonicalUrl(metadata.canonicalUrl);

  // OpenGraph
  setMetaTag('property', 'og:title', metadata.ogTitle || metadata.title);
  setMetaTag('property', 'og:description', metadata.ogDescription || metadata.description);
  setMetaTag('property', 'og:url', metadata.ogUrl || metadata.canonicalUrl);
  setMetaTag('property', 'og:type', metadata.ogType || 'website');
  setMetaTag('property', 'og:site_name', 'وظائف الخليج');
  setMetaTag('property', 'og:locale', 'ar_SA');

  // Twitter
  setMetaTag('name', 'twitter:card', metadata.twitterCard || 'summary_large_image');
  setMetaTag('name', 'twitter:title', metadata.ogTitle || metadata.title);
  setMetaTag('name', 'twitter:description', metadata.ogDescription || metadata.description);
}
