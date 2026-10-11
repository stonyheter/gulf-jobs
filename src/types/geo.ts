/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface CityNode {
  id: string;
  nameAr: string;
  nameEn: string;
  districts?: string[];
}

export interface RegionNode {
  id: string;
  nameAr: string;
  nameEn: string;
  type: 'province' | 'emirate' | 'municipality' | 'governorate';
  typeAr: string; // 'منطقة', 'إمارة', 'بلدية', 'محافظة'
  cities: CityNode[];
}

export interface CountryNode {
  code: string; // ISO 3166-1 alpha-2 e.g. "SA", "AE", "QA", "KW", "BH", "OM"
  nameAr: string; // "المملكة العربية السعودية"
  commonNameAr: string; // "السعودية"
  nameEn: string;
  flagEmoji: string;
  currency: string;
  currencyAr: string; // "ر.س", "د.إ", "ر.ق", "د.ك", "د.ب", "ر.ع"
  regions: RegionNode[];
}
