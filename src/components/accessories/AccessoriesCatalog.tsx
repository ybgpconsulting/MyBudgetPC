import React, { useState } from 'react';
import { 
  Search 
} from 'lucide-react';
import { STATIC_ACCESSORIES } from '../../data/staticAccessories';
import { formatINR } from '../../config/siteConfig';
import { WhatsAppButton } from '../common/WhatsAppButton';

export const AccessoriesCatalog: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories = [
    'All',
    'Chargers & Adapters',
    'Cables',
    'Cases & Covers',
    'Screen Protectors',
    'Audio & Earphones',
    'Power Banks & Mounts'
  ];

  const filteredAccessories = STATIC_ACCESSORIES.filter(item => {
    if (selectedCategory !== 'All' && item.category !== selectedCategory) {
      return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchBrand = item.brand.toLowerCase().includes(q);
      const matchComp = item.compatibleWith.toLowerCase().includes(q);
      if (!matchName && !matchBrand && !matchComp) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-8 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-slate-200">
          <div className="space-y-1">
            <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-700 font-mono">
              New & Pre-Owned Accessories
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Genuine Mobile Accessories &amp; Chargers in Karol Bagh
            </h1>
            <p className="text-sm text-slate-600 max-w-xl">
              Original fast adapters, high-grade braided cables, MagSafe cases, and tempered glass available at our Karol Bagh store.
            </p>
          </div>

          <WhatsAppButton
            size="sm"
            label="Enquire Any Accessory"
            className="self-start md:self-auto"
          />
        </div>

        {/* Search & Category Filter Tabs */}
        <div className="space-y-4">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search chargers, cables, cases..."
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 shadow-2xs transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {categories.map(cat => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 shadow-2xs'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Accessories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAccessories.map((item) => (
            <div
              key={item.id}
              className="group rounded-3xl bg-white border border-slate-200 hover:border-emerald-500/50 hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col justify-between"
            >
              <div>
                {/* Image */}
                <div className="relative h-48 w-full bg-slate-100 overflow-hidden border-b border-slate-100">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-white/95 text-emerald-800 border border-emerald-200 shadow-2xs">
                      {item.type}
                    </span>
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-white/95 text-slate-700 border border-slate-200 shadow-2xs">
                      {item.brand}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 space-y-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      {item.category}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors leading-snug mt-0.5">
                      {item.name}
                    </h3>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                    {item.description}
                  </p>

                  <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                    <strong className="text-slate-800">Compatibility: </strong>
                    <span>{item.compatibleWith}</span>
                  </div>
                </div>
              </div>

              {/* Card Footer: Price & WhatsApp Action */}
              <div className="p-5 pt-0 border-t border-slate-100 mt-2 space-y-3">
                <div className="flex items-baseline justify-between pt-3">
                  <div>
                    <span className="text-xl font-extrabold text-slate-900">{formatINR(item.price)}</span>
                    {item.originalPrice && (
                      <span className="text-xs text-slate-400 line-through ml-2">
                        {formatINR(item.originalPrice)}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-emerald-700 font-semibold">In Stock</span>
                </div>

                <WhatsAppButton
                  productName={`${item.name} (${item.brand})`}
                  price={item.price}
                  size="sm"
                  label="Enquire / Order on WhatsApp"
                  className="w-full justify-center"
                />
              </div>

            </div>
          ))}
        </div>

      </div>
    </div>
  );
};
