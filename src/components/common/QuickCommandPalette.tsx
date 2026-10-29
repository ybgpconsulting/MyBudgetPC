import React, { useState, useEffect } from 'react';
import { Search, X, Smartphone, ArrowRight, ShieldCheck, BatteryCharging } from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { formatINR } from '../../config/siteConfig';

interface QuickCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickCommandPalette: React.FC<QuickCommandPaletteProps> = ({ isOpen, onClose }) => {
  const { availablePhones, setActiveView, setFilters } = useInventory();
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filtered = availablePhones.filter(phone => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      phone.brand.toLowerCase().includes(q) ||
      phone.model.toLowerCase().includes(q) ||
      phone.storage.toLowerCase().includes(q) ||
      phone.colour.toLowerCase().includes(q) ||
      phone.price.toString().includes(q)
    );
  }).slice(0, 5);

  const handleSelect = (phoneId: string) => {
    setActiveView('detail', phoneId);
    onClose();
  };

  const handleBrandFilter = (brand: string) => {
    setFilters(prev => ({ ...prev, brand, searchQuery: '' }));
    setActiveView('stock');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-950/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden text-slate-900">
        
        {/* Search Header */}
        <div className="p-4 sm:p-5 flex items-center gap-3 border-b border-slate-100 bg-white">
          <Search className="w-5 h-5 text-emerald-600 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search iPhone 14 Pro, Samsung S23, 256GB, ₹30,000..."
            className="w-full bg-transparent text-sm sm:text-base text-slate-900 placeholder-slate-400 focus:outline-none font-medium"
          />
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Brands Bar */}
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] shrink-0">Quick Filter:</span>
          {['Apple', 'Samsung', 'OnePlus', 'Google'].map(b => (
            <button
              key={b}
              onClick={() => handleBrandFilter(b)}
              className="px-2.5 py-1 rounded-lg bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 font-medium transition-colors cursor-pointer shadow-2xs"
            >
              {b}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto p-3 space-y-2">
          {filtered.length === 0 ? (
            <div className="p-8 text-center space-y-2 text-slate-500">
              <Smartphone className="w-8 h-8 mx-auto text-slate-400" />
              <p className="text-sm font-medium text-slate-700">No matching phones found for "{query}"</p>
              <p className="text-xs text-slate-400">Try searching "iPhone 13", "Samsung", or "128GB"</p>
            </div>
          ) : (
            filtered.map(phone => (
              <div
                key={phone.id}
                onClick={() => handleSelect(phone.id)}
                className="p-3.5 rounded-2xl bg-slate-50 hover:bg-emerald-50/50 border border-slate-200 hover:border-emerald-300 flex items-center justify-between gap-4 cursor-pointer transition-all group shadow-2xs"
              >
                <div className="flex items-center gap-3.5">
                  <img
                    src={phone.images[0]}
                    alt={phone.model}
                    className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 font-mono">
                        {phone.brand}
                      </span>
                      <span className="text-xs text-slate-500">• {phone.storage}</span>
                      <span className="text-xs text-slate-500">• {phone.colour}</span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
                      {phone.model}
                    </h4>
                    {phone.batteryHealth && (
                      <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-semibold mt-0.5">
                        <BatteryCharging className="w-3 h-3" />
                        <span>{phone.batteryHealth}% Authenticated Battery</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0 flex items-center gap-3">
                  <div>
                    <div className="text-base font-black text-slate-900">{formatINR(phone.price)}</div>
                    <span className="text-[10px] text-emerald-700 font-semibold block">In Karol Bagh</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-700 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 px-4">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            100% Genuine Pre-Owned Devices Only
          </span>
          <span className="font-mono text-[10px]">ESC to close</span>
        </div>

      </div>
    </div>
  );
};
