/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Search, MapPin, ChevronDown, X, Sparkles } from 'lucide-react';
import { GCC_COUNTRIES } from '../../data/geoHierarchy';
import { CountryNode, RegionNode, CityNode } from '../../types/geo';

interface HeroSearchProps {
  initialKeyword?: string;
  initialCountry?: string;
  initialRegion?: string;
  initialCity?: string;
  onSearch: (params: { keyword: string; country: string; region: string; city: string }) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

export const HeroSearch: React.FC<HeroSearchProps> = ({
  initialKeyword = '',
  initialCountry = '',
  initialRegion = '',
  initialCity = '',
  onSearch,
  onClearFilters,
  hasActiveFilters,
}) => {
  const [keyword, setKeyword] = useState(initialKeyword);
  const [selectedCountry, setSelectedCountry] = useState(initialCountry);
  const [selectedRegion, setSelectedRegion] = useState(initialRegion);
  const [selectedCity, setSelectedCity] = useState(initialCity);

  // Sync state when props change
  useEffect(() => {
    setKeyword(initialKeyword);
  }, [initialKeyword]);

  useEffect(() => {
    setSelectedCountry(initialCountry);
  }, [initialCountry]);

  useEffect(() => {
    setSelectedRegion(initialRegion);
  }, [initialRegion]);

  useEffect(() => {
    setSelectedCity(initialCity);
  }, [initialCity]);

  // Derived region options based on selected country
  const currentCountryNode: CountryNode | undefined = GCC_COUNTRIES.find(
    (c) =>
      c.code === selectedCountry ||
      c.commonNameAr === selectedCountry ||
      c.nameAr === selectedCountry
  );

  const availableRegions: RegionNode[] = currentCountryNode ? currentCountryNode.regions : [];

  // Derived city options based on selected region
  const currentRegionNode: RegionNode | undefined = availableRegions.find(
    (r) => r.nameAr === selectedRegion || r.id === selectedRegion
  );

  const availableCities: CityNode[] = currentRegionNode ? currentRegionNode.cities : [];

  // Handle country change -> reset region & city
  const handleCountryChange = (countryVal: string) => {
    setSelectedCountry(countryVal);
    setSelectedRegion('');
    setSelectedCity('');
  };

  // Handle region change -> reset city
  const handleRegionChange = (regionVal: string) => {
    setSelectedRegion(regionVal);
    setSelectedCity('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({
      keyword,
      country: selectedCountry,
      region: selectedRegion,
      city: selectedCity,
    });
  };

  return (
    <section className="relative pt-12 pb-14 sm:pt-16 sm:pb-20 bg-linear-to-b from-slate-900 via-slate-900 to-slate-800 text-white overflow-hidden">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px]" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Main Heading */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-4 text-balance">
          ابحث عن وظيفتك القادمة
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg md:text-xl text-slate-300 max-w-3xl mx-auto mb-10 leading-relaxed font-light text-balance">
          وظائف حديثة في السعودية والإمارات وقطر والكويت والبحرين وعُمان.
        </p>

        {/* Prominent Search Section Container */}
        <div className="bg-white rounded-2xl p-3 sm:p-4 text-slate-900 shadow-xl border border-slate-200/20 text-right">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5">
              {/* Field 1: Job title or skill (col-span-5) */}
              <div className="md:col-span-4 relative flex items-center">
                <div className="absolute right-3.5 text-slate-400 pointer-events-none">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="المسمى الوظيفي أو المهارة..."
                  className="w-full pr-10 pl-3 py-3 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-emerald-600 rounded-xl text-sm font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 transition-all"
                />
              </div>

              {/* Field 2: Country (col-span-3) */}
              <div className="md:col-span-3 relative flex items-center">
                <div className="absolute right-3.5 text-slate-400 pointer-events-none">
                  <MapPin className="w-4 h-4" />
                </div>
                <select
                  value={selectedCountry}
                  onChange={(e) => handleCountryChange(e.target.value)}
                  className="w-full appearance-none pr-10 pl-8 py-3 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-emerald-600 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 transition-all cursor-pointer"
                >
                  <option value="">جميع الدول (الخليج العربي)</option>
                  {GCC_COUNTRIES.map((c) => (
                    <option key={c.code} value={c.commonNameAr}>
                      {c.flagEmoji} {c.commonNameAr}
                    </option>
                  ))}
                </select>
                <div className="absolute left-3 text-slate-400 pointer-events-none">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>

              {/* Field 3: Region (col-span-3, dynamic cascade) */}
              <div className="md:col-span-3 relative flex items-center">
                <select
                  value={selectedRegion}
                  onChange={(e) => handleRegionChange(e.target.value)}
                  disabled={availableRegions.length === 0}
                  className={`w-full appearance-none pr-4 pl-8 py-3 bg-slate-50 border border-slate-200 focus:border-emerald-600 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 transition-all ${
                    availableRegions.length === 0
                      ? 'opacity-60 cursor-not-allowed bg-slate-100 text-slate-400'
                      : 'hover:bg-slate-100/70 focus:bg-white cursor-pointer'
                  }`}
                >
                  <option value="">
                    {selectedCountry ? 'جميع المناطق / المحافظات' : 'اختر الدولة أولاً'}
                  </option>
                  {availableRegions.map((r) => (
                    <option key={r.id} value={r.nameAr}>
                      {r.nameAr}
                    </option>
                  ))}
                </select>
                <div className="absolute left-3 text-slate-400 pointer-events-none">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>

              {/* Field 4: City (col-span-2 or integrated, dynamic cascade) */}
              <div className="md:col-span-2 relative flex items-center">
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  disabled={availableCities.length === 0}
                  className={`w-full appearance-none pr-4 pl-8 py-3 bg-slate-50 border border-slate-200 focus:border-emerald-600 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 transition-all ${
                    availableCities.length === 0
                      ? 'opacity-60 cursor-not-allowed bg-slate-100 text-slate-400'
                      : 'hover:bg-slate-100/70 focus:bg-white cursor-pointer'
                  }`}
                >
                  <option value="">
                    {selectedRegion ? 'جميع المدن' : 'اختر المنطقة'}
                  </option>
                  {availableCities.map((c) => (
                    <option key={c.id} value={c.nameAr}>
                      {c.nameAr}
                    </option>
                  ))}
                </select>
                <div className="absolute left-3 text-slate-400 pointer-events-none">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Bottom Row of Search Box: Search button and active filters status */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="text-xs text-slate-500 flex items-center gap-2">
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={onClearFilters}
                    className="inline-flex items-center gap-1 text-slate-600 hover:text-red-600 font-medium transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>إعادة ضبط البحث والتصفيات</span>
                  </button>
                )}
                {!hasActiveFilters && (
                  <span className="text-slate-400">
                    💡 يمكنك البحث بالمسمى الوظيفي أو التصفية بالدولة والمنطقة والمدينة مباشرة
                  </span>
                )}
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-8 py-3 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 flex items-center justify-center gap-2"
              >
                <Search className="w-4 h-4" />
                <span>بحث عن وظائف</span>
              </button>
            </div>
          </form>
        </div>

        {/* Quick geographic pills for 1-click discovery */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-300">
          <span className="text-slate-400 font-medium">مدن سريعة:</span>
          {['الرياض', 'جدة', 'الدمام', 'الخبر', 'دبي', 'أبوظبي', 'الدوحة', 'مدينة الكويت', 'مسقط', 'المنامة'].map((city) => (
            <button
              key={city}
              type="button"
              onClick={() => {
                setSelectedCity(city);
                onSearch({
                  keyword,
                  country: selectedCountry,
                  region: selectedRegion,
                  city: city,
                });
              }}
              className="px-2.5 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/60 transition-colors"
            >
              {city}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
