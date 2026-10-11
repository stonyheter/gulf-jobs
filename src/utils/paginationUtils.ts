/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PaginationConfig {
  currentPage: number;
  pageSize: number;
  totalItems: number;
}

export interface PaginationResult<T> {
  items: T[];
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  nextPageUrl: string | null;
  prevPageUrl: string | null;
  canonicalUrl: string;
}

/**
 * Calculates pagination details and generates SEO-compliant canonical, rel=prev, and rel=next links.
 * 
 * Google SEO Best Practices:
 * - Page 1 canonical URL should never contain redundant "?page=1"
 * - rel="prev" for page 2 points to clean base URL without query parameter
 * - rel="next" points to "?page=N+1"
 */
export function paginateItems<T>(
  allItems: T[],
  currentPage: number = 1,
  pageSize: number = 12,
  baseCanonicalUrl: string
): PaginationResult<T> {
  const totalItems = allItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validPage = Math.min(Math.max(1, currentPage), totalPages);

  const startIndex = (validPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const items = allItems.slice(startIndex, endIndex);

  const cleanBase = baseCanonicalUrl.replace(/[?&]page=\d+/, '').replace(/\?$/, '');

  // Canonical for page 1 is base URL. For page > 1, it's base + ?page=N
  const canonicalUrl = validPage === 1 ? cleanBase : `${cleanBase}?page=${validPage}`;

  // Next page URL
  const hasNextPage = validPage < totalPages;
  const nextPageUrl = hasNextPage ? `${cleanBase}?page=${validPage + 1}` : null;

  // Prev page URL (Page 2's prev is cleanBase without parameter)
  const hasPrevPage = validPage > 1;
  const prevPageUrl = hasPrevPage
    ? validPage - 1 === 1
      ? cleanBase
      : `${cleanBase}?page=${validPage - 1}`
    : null;

  return {
    items,
    currentPage: validPage,
    pageSize,
    totalItems,
    totalPages,
    hasNextPage,
    hasPrevPage,
    nextPageUrl,
    prevPageUrl,
    canonicalUrl,
  };
}
