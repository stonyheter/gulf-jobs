/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CountryNode } from '../types/geo';

export const GCC_COUNTRIES: CountryNode[] = [
  {
    code: 'SA',
    nameAr: 'المملكة العربية السعودية',
    commonNameAr: 'السعودية',
    nameEn: 'Saudi Arabia',
    flagEmoji: '🇸🇦',
    currency: 'SAR',
    currencyAr: 'ر.س',
    regions: [
      {
        id: 'eastern-province',
        nameAr: 'المنطقة الشرقية',
        nameEn: 'Eastern Province',
        type: 'province',
        typeAr: 'المنطقة',
        cities: [
          {
            id: 'dammam',
            nameAr: 'الدمام',
            nameEn: 'Dammam',
            districts: ['حي الشاطئ', 'حي المزروعية', 'حي الفردوس', 'حي الفيصلية'],
          },
          {
            id: 'khobar',
            nameAr: 'الخبر',
            nameEn: 'Khobar',
            districts: ['حي العليا', 'حي الحزام الذهبي', 'حي العقربية'],
          },
          {
            id: 'dhahran',
            nameAr: 'الظهران',
            nameEn: 'Dhahran',
            districts: ['حي الدوحة', 'حي الجامعة', 'مجمع أرامكو'],
          },
          {
            id: 'jubail',
            nameAr: 'الجبيل',
            nameEn: 'Jubail',
            districts: ['الجبيل الصناعية', 'البلد'],
          },
        ],
      },
      {
        id: 'riyadh-region',
        nameAr: 'منطقة الرياض',
        nameEn: 'Riyadh Region',
        type: 'province',
        typeAr: 'منطقة',
        cities: [
          {
            id: 'riyadh',
            nameAr: 'الرياض',
            nameEn: 'Riyadh',
            districts: ['حي العليا', 'حي الملقا', 'حي النرجس', 'مركز الملك عبدالله المالي', 'حي السليمانية'],
          },
          {
            id: 'kharj',
            nameAr: 'الخرج',
            nameEn: 'Al Kharj',
            districts: ['حي الخالدية'],
          },
        ],
      },
      {
        id: 'makkah-region',
        nameAr: 'منطقة مكة المكرمة',
        nameEn: 'Makkah Region',
        type: 'province',
        typeAr: 'منطقة',
        cities: [
          {
            id: 'jeddah',
            nameAr: 'جدة',
            nameEn: 'Jeddah',
            districts: ['حي الروضة', 'حي الشاطئ', 'حي الحمراء', 'حي السلامة', 'حي النزهة'],
          },
          {
            id: 'makkah',
            nameAr: 'مكة المكرمة',
            nameEn: 'Makkah',
            districts: ['حي العزيزية', 'حي العوالي'],
          },
        ],
      },
    ],
  },
  {
    code: 'AE',
    nameAr: 'الإمارات العربية المتحدة',
    commonNameAr: 'الإمارات',
    nameEn: 'United Arab Emirates',
    flagEmoji: '🇦🇪',
    currency: 'AED',
    currencyAr: 'د.إ',
    regions: [
      {
        id: 'dubai-emirate',
        nameAr: 'إمارة دبي',
        nameEn: 'Dubai Emirate',
        type: 'emirate',
        typeAr: 'إمارة',
        cities: [
          {
            id: 'dubai',
            nameAr: 'دبي',
            nameEn: 'Dubai',
            districts: ['مركز دبي المالي العالمي (DIFC)', 'الخليج التجاري', 'مرسى دبي (المارينا)', 'مدينة دبي للإنترنت'],
          },
        ],
      },
      {
        id: 'abu-dhabi-emirate',
        nameAr: 'إمارة أبوظبي',
        nameEn: 'Abu Dhabi Emirate',
        type: 'emirate',
        typeAr: 'إمارة',
        cities: [
          {
            id: 'abu-dhabi',
            nameAr: 'أبوظبي',
            nameEn: 'Abu Dhabi',
            districts: ['جزيرة المارية', 'جزيرة الريم', 'الكورنيش', 'مدينة خليفة'],
          },
          {
            id: 'al-ain',
            nameAr: 'العين',
            nameEn: 'Al Ain',
            districts: ['وسط المدينة'],
          },
        ],
      },
    ],
  },
  {
    code: 'QA',
    nameAr: 'دولة قطر',
    commonNameAr: 'قطر',
    nameEn: 'Qatar',
    flagEmoji: '🇶🇦',
    currency: 'QAR',
    currencyAr: 'ر.ق',
    regions: [
      {
        id: 'doha-municipality',
        nameAr: 'بلدية الدوحة',
        nameEn: 'Doha Municipality',
        type: 'municipality',
        typeAr: 'بلدية',
        cities: [
          {
            id: 'doha',
            nameAr: 'الدوحة',
            nameEn: 'Doha',
            districts: ['الخليج الغربي (West Bay)', 'اللؤلؤة', 'مشيرب قلب الدوحة', 'السد'],
          },
        ],
      },
      {
        id: 'al-rayyan-municipality',
        nameAr: 'بلدية الريان',
        nameEn: 'Al Rayyan Municipality',
        type: 'municipality',
        typeAr: 'بلدية',
        cities: [
          {
            id: 'al-rayyan',
            nameAr: 'الريان',
            nameEn: 'Al Rayyan',
            districts: ['المدينة التعليمية'],
          },
        ],
      },
    ],
  },
  {
    code: 'KW',
    nameAr: 'دولة الكويت',
    commonNameAr: 'الكويت',
    nameEn: 'Kuwait',
    flagEmoji: '🇰🇼',
    currency: 'KWD',
    currencyAr: 'د.ك',
    regions: [
      {
        id: 'kuwait-capital-governorate',
        nameAr: 'محافظة العاصمة',
        nameEn: 'Capital Governorate',
        type: 'governorate',
        typeAr: 'محافظة',
        cities: [
          {
            id: 'kuwait-city',
            nameAr: 'مدينة الكويت',
            nameEn: 'Kuwait City',
            districts: ['الشرق', 'القبلة', 'المرقاب', 'الصالحية', 'الشويخ الصناعية'],
          },
        ],
      },
      {
        id: 'hawalli-governorate',
        nameAr: 'محافظة حولي',
        nameEn: 'Hawalli Governorate',
        type: 'governorate',
        typeAr: 'محافظة',
        cities: [
          {
            id: 'hawalli',
            nameAr: 'حولي',
            nameEn: 'Hawalli',
            districts: ['السالمية', 'حولي'],
          },
        ],
      },
    ],
  },
  {
    code: 'BH',
    nameAr: 'مملكة البحرين',
    commonNameAr: 'البحرين',
    nameEn: 'Bahrain',
    flagEmoji: '🇧🇭',
    currency: 'BHD',
    currencyAr: 'د.ب',
    regions: [
      {
        id: 'bahrain-capital-governorate',
        nameAr: 'محافظة العاصمة',
        nameEn: 'Capital Governorate',
        type: 'governorate',
        typeAr: 'محافظة',
        cities: [
          {
            id: 'manama',
            nameAr: 'المنامة',
            nameEn: 'Manama',
            districts: ['مرفأ البحرين المالي', 'السيف', 'خليج البحرين', 'الجفير'],
          },
        ],
      },
    ],
  },
  {
    code: 'OM',
    nameAr: 'سلطنة عُمان',
    commonNameAr: 'عُمان',
    nameEn: 'Oman',
    flagEmoji: '🇴🇲',
    currency: 'OMR',
    currencyAr: 'ر.ع',
    regions: [
      {
        id: 'muscat-governorate',
        nameAr: 'محافظة مسقط',
        nameEn: 'Muscat Governorate',
        type: 'governorate',
        typeAr: 'محافظة',
        cities: [
          {
            id: 'muscat',
            nameAr: 'مسقط',
            nameEn: 'Muscat',
            districts: ['الخوير', 'شاطئ القرم', 'مدينة العرفان', 'غلا الصناعية', 'روي'],
          },
          {
            id: 'seeb',
            nameAr: 'السيب',
            nameEn: 'Seeb',
            districts: ['الموالح', 'الحيل'],
          },
        ],
      },
    ],
  },
];
