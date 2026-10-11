/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface JobFilterState {
  keyword: string;
  country: string; // Country code or name
  region: string;
  city: string;
  workMode: string; // 'all' | 'on_site' | 'remote' | 'hybrid'
  employmentType: string; // 'all' | 'full_time' | 'part_time' | 'contract' | 'internship'
  experience: string; // 'all' | 'no_exp' | '1-3' | '3-5' | '5+'
  education: string; // 'all' | 'high_school' | 'diploma' | 'bachelor' | 'master'
  hasSalaryOnly: boolean;
  minSalary?: number | null;
  onlySuitable?: boolean;
  postedDate: string; // 'all' | 'today' | '3days' | '7days' | '30days'
  sortBy: 'newest' | 'oldest';
}

export const DEFAULT_FILTER_STATE: JobFilterState = {
  keyword: '',
  country: '',
  region: '',
  city: '',
  workMode: 'all',
  employmentType: 'all',
  experience: 'all',
  education: 'all',
  hasSalaryOnly: false,
  minSalary: null,
  onlySuitable: false,
  postedDate: 'all',
  sortBy: 'newest',
};
