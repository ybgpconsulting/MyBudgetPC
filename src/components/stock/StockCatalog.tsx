import React, { useState, useMemo } from 'react';
import { 
  Search, 
  SlidersHorizontal, 
  X, 
  Check, 
  Flame, 
  BatteryCharging, 
  RotateCcw, 
  Smartphone, 
  Watch, 
  Tablet, 
  Laptop, 
  Headphones, 
  Sparkles, 
  Tag, 
  ChevronDown,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { PhoneCard } from './PhoneCard';
import { WhatsAppButton } from '../common/WhatsAppButton';
import { ProductCategory } from '../../types';

export const StockCatalog: React.FC = () => {
  const { phones, filters, setFilters, resetFilters, setActiveView, loading, apiError } = useInventory();
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const categories = [
    { id: 'All', label: 'All Stock', icon: Tag },
    { id: 'Phones', label: 'Phones', icon: Smartphone },
    { id: 'Watches', label: 'Watches', icon: Watch },
    { id: 'Tablets', label: 'Tablets', icon: Tablet },
    { id: 'Laptops', label: 'Laptops', icon: Laptop },
    { id: 'Accessories', label: 'Accessories', icon: Headphones },
    { id: 'Other Gadgets', label: 'Other Gadgets', icon: Sparkles },
  ];

  // Extract unique brands from inventory
  const availableBrands = useMemo(() => {
    const brands = Array.from(new Set(phones.map(p => p.brand)));
    return ['All', ...brands];
  }, [phones]);

  const storageOptions = ['64GB', '128GB', '256GB', '512GB', '1TB', '2TB'];
  const conditionOptions = [
    'Like New (Flawless)',
    'Excellent (9.5/10)',
    'Very Good (8.5/10)',
    'Good (Minor Marks)'
  ];

  // Filter & Sort Logic
  const filteredPhones = useMemo(() => {
    return phones.filter(phone => {
      // Category filter
      if (filters.category && filters.category !== 'All') {
        const itemCat = phone.category || 'Phones';
        if (itemCat !== filters.category) return false;
      }

      // Search query
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const matchesBrand = phone.brand.toLowerCase().includes(query);
        const matchesModel = phone.model.toLowerCase().includes(query);
        const matchesStorage = phone.storage.toLowerCase().includes(query);
        const matchesColour = phone.colour.toLowerCase().includes(query);
        const matchesTag = phone.stockTag?.toLowerCase().includes(query);
        const matchesCategory = (phone.category || '').toLowerCase().includes(query);
        if (!matchesBrand && !matchesModel && !matchesStorage && !matchesColour && !matchesTag && !matchesCategory) {
          return false;
        }
      }

      // Brand filter
      if (filters.brand !== 'All' && phone.brand !== filters.brand) {
        return false;
      }

      // Storage filter
      if (filters.storage.length > 0 && !filters.storage.includes(phone.storage)) {
        return false;
      }

      // Condition filter
      if (filters.condition.length > 0 && !filters.condition.includes(phone.condition)) {
        return false;
      }

      // Minimum Battery Health
      if (filters.minBatteryHealth > 0) {
        if (!phone.batteryHealth || phone.batteryHealth < filters.minBatteryHealth) {
          return false;
        }
      }

      // Price Range
      if (phone.price < filters.minPrice || phone.price > filters.maxPrice) {
        return false;
      }

      // Only Available
      if (filters.onlyAvailable && phone.status !== 'Available') {
        return false;
      }

      // Only Price Drops
      if (filters.onlyPriceDrop && !phone.priceDrop) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (filters.sortBy === 'price-asc') return a.price - b.price;
      if (filters.sortBy === 'price-desc') return b.price - a.price;
      if (filters.sortBy === 'battery-desc') return (b.batteryHealth || 0) - (a.batteryHealth || 0);
      if (filters.sortBy === 'newest') return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
      // Default: featured first, then available first
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      if (a.status === 'Available' && b.status !== 'Available') return -1;
      if (a.status !== 'Available' && b.status === 'Available') return 1;
      return 0;
    });
  }, [phones, filters]);

  const activeFilterCount = 
    (filters.category !== 'All' ? 1 : 0) +
    (filters.brand !== 'All' ? 1 : 0) +
    filters.storage.length +
    filters.condition.length +
    (filters.minBatteryHealth > 0 ? 1 : 0) +
    (filters.onlyAvailable ? 1 : 0) +
    (filters.onlyPriceDrop ? 1 : 0);

  const toggleStorageFilter = (st: string) => {
    setFilters(prev => {
      const exists = prev.storage.includes(st);
      return {
        ...prev,
        storage: exists ? prev.storage.filter(s => s !== st) : [...prev.storage, st]
      };
    });
  };

  const toggleConditionFilter = (cond: string) => {
    setFilters(prev => {
      const exists = prev.condition.includes(cond);
      return {
        ...prev,
        condition: exists ? prev.condition.filter(c => c !== cond) : [...prev.condition, cond]
      };
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-8 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Loading State */}
        {loading && phones.length === 0 && !apiError && (
          <div className="py-20 text-center space-y-3">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-slate-500 font-medium">Loading inventory...</p>
          </div>
        )}

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-blue-700 font-mono">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
              {apiError ? 'Sample Inventory' : 'Karol Bagh Live Inventory'}
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight mt-1">
              Pre-Owned Mobile Phones &amp; Gadgets in Karol Bagh
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
              100% genuine second-hand iPhones, MacBooks, iPads, and Android smartphones. Live counter inventory with verified battery health and store bills in Karol Bagh, New Delhi.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-2xl bg-white border border-slate-200 text-xs shadow-2xs font-medium">
              <span className="text-slate-500">Showing: </span>
              <strong className="text-blue-700 font-bold">{filteredPhones.length}</strong>
              <span className="text-slate-500"> of {phones.length} items</span>
            </div>

            <WhatsAppButton
              size="sm"
              label="WhatsApp Enquire"
              className="shrink-0"
            />
          </div>
        </div>

        {/* Primary Category Switcher Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map(cat => {
            const Icon = cat.icon;
            const isSelected = filters.category === cat.id;
            const count = cat.id === 'All' 
              ? phones.filter(p => p.status === 'Available').length
              : phones.filter(p => (p.category || 'Phones') === cat.id && p.status === 'Available').length;

            return (
              <button
                key={cat.id}
                onClick={() => setFilters(prev => ({ ...prev, category: cat.id }))}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap flex items-center gap-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 shadow-2xs'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                  isSelected ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Sort Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          
          {/* Search Input */}
          <div className="relative w-full sm:flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filters.searchQuery}
              onChange={e => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
              placeholder="Search model, specs, brand (e.g. iPhone 14, MacBook Pro, Apple Watch)..."
              className="w-full pl-11 pr-10 py-3 rounded-2xl bg-white border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-2xs transition-colors"
              id="stock-search-input"
            />
            {filters.searchQuery && (
              <button
                onClick={() => setFilters(prev => ({ ...prev, searchQuery: '' }))}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sort Select */}
          <div className="relative w-full sm:w-56 shrink-0">
            <select
              value={filters.sortBy}
              onChange={e => setFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
              className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:border-blue-500 shadow-2xs cursor-pointer appearance-none"
              id="stock-sort-select"
            >
              <option value="featured">Sort: Featured First</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="battery-desc">Battery Health: High to Low</option>
              <option value="newest">Recently Added</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Mobile Filters Trigger Button */}
          <button
            onClick={() => setMobileFilterOpen(true)}
            className="w-full sm:w-auto px-4 py-3 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-xs sm:text-sm font-semibold text-slate-800 flex items-center justify-center gap-2 cursor-pointer lg:hidden shadow-2xs"
            id="mobile-filters-trigger"
          >
            <SlidersHorizontal className="w-4 h-4 text-blue-600" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>

        </div>

        {/* Quick Brand Filter Tabs & Toggles */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {availableBrands.map(brand => {
            const isSelected = filters.brand === brand;
            return (
              <button
                key={brand}
                onClick={() => setFilters(prev => ({ ...prev, brand }))}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 shadow-2xs'
                }`}
              >
                {brand === 'All' ? 'All Brands' : brand}
              </button>
            );
          })}

          <div className="h-6 w-px bg-slate-200 mx-1 shrink-0" />

          {/* Price drop quick toggle */}
          <button
            onClick={() => setFilters(prev => ({ ...prev, onlyPriceDrop: !prev.onlyPriceDrop }))}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer ${
              filters.onlyPriceDrop
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-white text-amber-700 hover:bg-amber-50 border border-amber-200 shadow-2xs'
            }`}
          >
            <Flame className="w-3.5 h-3.5 fill-current" />
            <span>Price Drops</span>
          </button>

          {/* Available only quick toggle */}
          <button
            onClick={() => setFilters(prev => ({ ...prev, onlyAvailable: !prev.onlyAvailable }))}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer ${
              filters.onlyAvailable
                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 shadow-2xs'
            }`}
          >
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            <span>Available In Store</span>
          </button>

          {activeFilterCount > 0 && (
            <button
              onClick={resetFilters}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-rose-600 flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset All</span>
            </button>
          )}
        </div>

        {/* 2-Column Layout: Desktop Sidebar Filters + Product Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          
          {/* Desktop Filter Sidebar */}
          <aside className="hidden lg:block space-y-6 p-5 rounded-3xl bg-white border border-slate-200 shadow-xs sticky top-24">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <SlidersHorizontal className="w-4 h-4 text-blue-600" />
                <span>Filters & Specs</span>
              </div>
              {activeFilterCount > 0 && (
                <button
                  onClick={resetFilters}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                >
                  Reset ({activeFilterCount})
                </button>
              )}
            </div>

            {/* Storage Filter */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Storage Capacity</label>
              <div className="grid grid-cols-3 gap-1.5">
                {storageOptions.map(st => {
                  const checked = filters.storage.includes(st);
                  return (
                    <button
                      key={st}
                      onClick={() => toggleStorageFilter(st)}
                      className={`py-1.5 px-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        checked
                          ? 'bg-blue-600 text-white font-bold'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {st}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Condition Filter */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Condition Grade</label>
              <div className="space-y-1.5">
                {conditionOptions.map(cond => {
                  const checked = filters.condition.includes(cond);
                  return (
                    <button
                      key={cond}
                      onClick={() => toggleConditionFilter(cond)}
                      className={`w-full text-left p-2 rounded-xl text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                        checked
                          ? 'bg-blue-50 text-blue-900 border border-blue-300 font-semibold'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      <span>{cond}</span>
                      {checked && <Check className="w-3.5 h-3.5 text-blue-600" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Battery Health Threshold */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <BatteryCharging className="w-3.5 h-3.5 text-emerald-600" />
                  Min. Battery Health
                </label>
                <span className="font-bold text-emerald-700">
                  {filters.minBatteryHealth > 0 ? `${filters.minBatteryHealth}%+` : 'Any'}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="95"
                step="5"
                value={filters.minBatteryHealth}
                onChange={e => setFilters(prev => ({ ...prev, minBatteryHealth: Number(e.target.value) }))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>All</span>
                <span>85%+</span>
                <span>90%+</span>
                <span>95%+</span>
              </div>
            </div>

            {/* In-Store Testing Assurance */}
            <div className="pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Karol Bagh Store Guarantee</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Test the device, original screen TrueTone, camera OIS, Face ID & battery health live in our shop before taking delivery.
              </p>
            </div>

          </aside>

          {/* Product Grid */}
          <main className="lg:col-span-3">
            {filteredPhones.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {filteredPhones.map(phone => (
                  <PhoneCard
                    key={phone.id}
                    phone={phone}
                    onSelect={(p) => setActiveView('detail', p.id)}
                  />
                ))}
              </div>
            ) : (
              /* Empty State */
              <div className="py-16 px-4 text-center rounded-3xl bg-white border border-slate-200 space-y-4 shadow-2xs">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                  <Smartphone className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-slate-900">No Items Found Matching Filters</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Try selecting "All Categories" or adjusting the condition and battery filters.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    onClick={resetFilters}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-800 border border-slate-200 cursor-pointer"
                  >
                    Clear Filters
                  </button>
                  <WhatsAppButton
                    size="sm"
                    label="Ask Counter on WhatsApp"
                  />
                </div>
              </div>
            )}
          </main>

        </div>

        {/* Mobile Filter Modal */}
        {mobileFilterOpen && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end bg-slate-950/40 backdrop-blur-xs lg:hidden animate-in fade-in duration-200">
            <div className="bg-white border-t border-slate-200 rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto space-y-5 shadow-xl">
              
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-blue-600" />
                  Filter Catalog
                </h3>
                <button
                  onClick={() => setMobileFilterOpen(false)}
                  className="p-1.5 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Category</label>
                <div className="flex flex-wrap gap-1.5">
                  {categories.map(c => (
                    <button
                      key={c.id}
                      onClick={() => setFilters(prev => ({ ...prev, category: c.id }))}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
                        filters.category === c.id
                          ? 'bg-blue-600 text-white font-bold'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Brand */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Brand</label>
                <div className="flex flex-wrap gap-1.5">
                  {availableBrands.map(b => (
                    <button
                      key={b}
                      onClick={() => setFilters(prev => ({ ...prev, brand: b }))}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
                        filters.brand === b
                          ? 'bg-slate-900 text-white font-bold'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              {/* Storage */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Storage</label>
                <div className="grid grid-cols-3 gap-2">
                  {storageOptions.map(st => (
                    <button
                      key={st}
                      onClick={() => toggleStorageFilter(st)}
                      className={`py-2 rounded-xl text-xs font-semibold ${
                        filters.storage.includes(st)
                          ? 'bg-blue-600 text-white font-bold'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                <button
                  onClick={resetFilters}
                  className="py-3 rounded-2xl bg-slate-100 text-slate-700 text-xs font-bold"
                >
                  Reset Filters
                </button>
                <button
                  onClick={() => setMobileFilterOpen(false)}
                  className="py-3 rounded-2xl bg-blue-600 text-white text-xs font-bold shadow-xs"
                >
                  Show {filteredPhones.length} Items
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};
