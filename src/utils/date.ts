/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Returns a natural Arabic relative time string
 * e.g., "اليوم", "منذ 3 ساعات", "منذ يومين", "منذ أسبوع"
 */
export function formatArabicRelativeDate(isoDateString: string): string {
  if (!isoDateString) return '';
  const date = new Date(isoDateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInHours < 1) {
    return 'نُشرت للتو';
  }
  if (diffInHours < 24) {
    if (diffInHours === 1) return 'منذ ساعة واحدة';
    if (diffInHours === 2) return 'منذ ساعتين';
    if (diffInHours <= 10) return `منذ ${diffInHours} ساعات`;
    return `منذ ${diffInHours} ساعة (اليوم)`;
  }
  if (diffInDays === 1) {
    return 'منذ يوم (أمس)';
  }
  if (diffInDays === 2) {
    return 'منذ يومين';
  }
  if (diffInDays <= 10) {
    return `منذ ${diffInDays} أيام`;
  }
  if (diffInDays <= 30) {
    const weeks = Math.floor(diffInDays / 7);
    if (weeks <= 1) return 'منذ أسبوع';
    if (weeks === 2) return 'منذ أسبوعين';
    return `منذ ${weeks} أسابيع`;
  }

  const months = Math.floor(diffInDays / 30);
  if (months <= 1) return 'منذ شهر';
  if (months === 2) return 'منذ شهرين';
  return `منذ ${months} أشهر`;
}

/**
 * Formats ISO date to standard Arabic date display
 */
export function formatArabicFullDate(isoDateString: string | null): string {
  if (!isoDateString) return 'غير محدد';
  try {
    const date = new Date(isoDateString);
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return isoDateString;
  }
}
