/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Featured job categories (migrated from mockJobs.ts during Phase 8).
 */

import { JobCategory } from '../types/job';

export const FEATURED_CATEGORIES: JobCategory[] = [
  { id: 'tech', nameAr: '\u062a\u0642\u0646\u064a\u0629 \u0627\u0644\u0645\u0639\u0644\u0648\u0645\u0627\u062a \u0648\u0627\u0644\u0628\u0631\u0645\u062c\u0629', nameEn: 'Technology & Software', iconName: 'Laptop', jobCount: 420 },
  { id: 'engineering', nameAr: '\u0627\u0644\u0647\u0646\u062f\u0633\u0629 \u0648\u0627\u0644\u0625\u0646\u0634\u0627\u0621\u0627\u062a', nameEn: 'Engineering & Construction', iconName: 'HardHat', jobCount: 380 },
  { id: 'oil_gas', nameAr: '\u0627\u0644\u0646\u0641\u0637\u060c \u0627\u0644\u063a\u0627\u0632 \u0648\u0627\u0644\u0637\u0627\u0642\u0629', nameEn: 'Oil, Gas & Energy', iconName: 'Flame', jobCount: 295 },
  { id: 'finance', nameAr: '\u0627\u0644\u0645\u0627\u0644\u064a\u0629 \u0648\u0627\u0644\u0645\u0635\u0627\u0631\u0641 \u0648\u0627\u0644\u0645\u062d\u0627\u0633\u0628\u0629', nameEn: 'Finance & Banking', iconName: 'Landmark', jobCount: 310 },
  { id: 'healthcare', nameAr: '\u0627\u0644\u0631\u0639\u0627\u064a\u0629 \u0627\u0644\u0635\u062d\u064a\u0629 \u0648\u0627\u0644\u0637\u0628', nameEn: 'Healthcare & Medicine', iconName: 'HeartPulse', jobCount: 240 },
  { id: 'logistics', nameAr: '\u0627\u0644\u0644\u0648\u062c\u0633\u062a\u064a\u0627\u062a \u0648\u0633\u0644\u0627\u0633\u0644 \u0627\u0644\u0625\u0645\u062f\u0627\u062f', nameEn: 'Logistics & Supply Chain', iconName: 'Truck', jobCount: 215 },
  { id: 'sales_marketing', nameAr: '\u0627\u0644\u062a\u0633\u0648\u064a\u0642 \u0648\u0627\u0644\u0645\u0628\u064a\u0639\u0627\u062a \u0627\u0644\u0631\u0642\u0645\u064a\u0629', nameEn: 'Sales & Marketing', iconName: 'Megaphone', jobCount: 340 },
  { id: 'admin', nameAr: '\u0627\u0644\u0625\u062f\u0627\u0631\u0629 \u0648\u0627\u0644\u0645\u0648\u0627\u0631\u062f \u0627\u0644\u0628\u0634\u0631\u064a\u0629', nameEn: 'Administration & HR', iconName: 'Users', jobCount: 190 },
];