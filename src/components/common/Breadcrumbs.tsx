/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { ChevronLeft, Home } from 'lucide-react';
import { BreadcrumbItem } from '../../types/seo';
import { generateBreadcrumbSchema } from '../../utils/structuredData';
import { setBreadcrumbStructuredData } from '../../utils/seoHeadService';
import { getBaseUrl } from '../../utils/seoMetadataService';

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  onNavigate?: (url: string) => void;
  className?: string;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  items,
  onNavigate,
  className = '',
}) => {
  // Sync Schema.org BreadcrumbList to document head
  useEffect(() => {
    if (items && items.length > 0) {
      const schema = generateBreadcrumbSchema(items, getBaseUrl());
      setBreadcrumbStructuredData(schema);
    }
    return () => {
      setBreadcrumbStructuredData(null);
    };
  }, [items]);

  if (!items || items.length === 0) return null;

  const handleClick = (e: React.MouseEvent, url: string, isCurrent?: boolean) => {
    if (isCurrent) {
      e.preventDefault();
      return;
    }
    if (onNavigate) {
      e.preventDefault();
      onNavigate(url);
    }
  };

  return (
    <nav
      aria-label="مسار التنقل"
      className={`py-2 px-1 text-xs text-slate-500 overflow-x-auto whitespace-nowrap scrollbar-none ${className}`}
    >
      <ol className="flex items-center gap-1.5 flex-wrap">
        {items.map((item, index) => {
          const isFirst = index === 0;
          const isLast = index === items.length - 1;

          return (
            <li key={index} className="flex items-center gap-1.5">
              {!isFirst && (
                <ChevronLeft className="w-3.5 h-3.5 text-slate-400 shrink-0 rtl:rotate-0" aria-hidden="true" />
              )}

              {isLast ? (
                <span
                  className="font-medium text-slate-800 max-w-[200px] sm:max-w-xs truncate"
                  aria-current="page"
                  title={item.name}
                >
                  {item.name}
                </span>
              ) : (
                <a
                  href={item.url}
                  onClick={(e) => handleClick(e, item.url, isLast)}
                  className="hover:text-emerald-700 transition-colors flex items-center gap-1 text-slate-600 hover:underline"
                >
                  {isFirst && <Home className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />}
                  <span>{item.name}</span>
                </a>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
