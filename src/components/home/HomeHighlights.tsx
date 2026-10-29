import React, { useState } from 'react';
import {
  ShieldCheck,
  BatteryCharging,
  Receipt,
  MapPin,
  ArrowRight,
  Search,
  Star,
  CheckCircle2,
  Smartphone,
  Watch,
  Tablet,
  Laptop,
  Headphones,
  Sparkles,
  PhoneCall,
  MessageCircle,
  Eye,
  Wrench,
  QrCode,
  Flame,
  Check,
  Box,
  HelpCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { SITE_CONFIG, formatINR } from '../../config/siteConfig';
import { WhatsAppButton } from '../common/WhatsAppButton';
import { PhoneItem } from '../../types';

interface HomeHighlightsProps {
  onOpenSearch: () => void;
}

export const HomeHighlights: React.FC<HomeHighlightsProps> = ({ onOpenSearch }) => {
  const { availablePhones, setActiveView, setFilters, loading, apiError } = useInventory();
  const [selectedCat, setSelectedCat] = useState<string>('All');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const faqs = [
    {
      q: "What is the difference between pre-owned and refurbished phones at Cortek Enterprises?",
      a: "Cortek Enterprises strictly sells 100% genuine pre-owned devices in original factory condition. Refurbished devices in secondary markets often have cracked screens replaced with cheap replica LCDs and aftermarket housings. We never alter internal parts or install counterfeit components."
    },
    {
      q: "Are battery health percentages shown at Cortek genuine?",
      a: "Yes. We show the exact, unboosted factory battery health. We strictly reject and avoid devices with soldered battery boost tag-on flex chips that falsely show 100% in iOS settings while dying rapidly."
    },
    {
      q: "Where is Cortek Enterprises located in Karol Bagh?",
      a: "Cortek Enterprises is located in the Gaffar Market / Arya Samaj Road area, Karol Bagh, New Delhi 110005, approximately 250 meters from Karol Bagh Metro Station (Blue Line Gate 4)."
    },
    {
      q: "Can I test the phone before buying at the store?",
      a: "Yes, we encourage complete in-store verification. Customers can test OLED displays, TrueTone, Face ID, camera sensors, 5G networks, and battery diagnostics before making a purchase."
    },
    {
      q: "Do phones come with store bills and warranty?",
      a: "Yes, every device comes with a store invoice / tax invoice with verified IMEI details and store checking warranty support."
    }
  ];

  const categories = [
    { label: 'All Stock', icon: Sparkles, value: 'All' },
    { label: 'iPhones', icon: Smartphone, value: 'Phones' },
    { label: 'Watches', icon: Watch, value: 'Watches' },
    { label: 'iPads / Tablets', icon: Tablet, value: 'Tablets' },
    { label: 'MacBooks & Laptops', icon: Laptop, value: 'Laptops' },
    { label: 'Accessories', icon: Headphones, value: 'Accessories' }
  ];

  // Highlights stock items: up to 10 items in ultra-compact mini blocks
  const featuredStock = availablePhones
    .filter(p => selectedCat === 'All' || (p.category || 'Phones') === selectedCat)
    .slice(0, 10);

  const handleSelectCategory = (catValue: string) => {
    setSelectedCat(catValue);
  };

  const handleExploreFullCatalog = (catValue?: string) => {
    if (catValue && catValue !== 'All') {
      setFilters(prev => ({ ...prev, category: catValue as any }));
    } else {
      setFilters(prev => ({ ...prev, category: 'All' }));
    }
    setActiveView('stock');
  };

  const handleOpenDetail = (phone: PhoneItem) => {
    setActiveView('detail', phone.id);
  };

  return (
    <div className="space-y-10 sm:space-y-14 pb-12">

      {/* Primary SEO Heading & Hero Intro */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6">
        <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 text-white rounded-3xl p-6 sm:p-8 md:p-10 border border-slate-800 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Karol Bagh's Trusted Pre-Owned Electronics Store</span>
            </div>

            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
              Best Pre-Owned Mobile Phones &amp; Gadgets in Karol Bagh, Delhi
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Buy certified pre-owned iPhones, MacBooks, iPads &amp; flagship smartphones with 100% original factory parts, verified unboosted battery health, and transparent in-store testing near Karol Bagh Metro Gate 4.
            </p>

            {/* Quick Category Filtering */}
            <div className="flex flex-wrap items-center gap-2 pt-2" aria-label="Product categories">
              {categories.map((cat) => {
                const IconComponent = cat.icon;
                const isSelected = selectedCat === cat.value;
                return (
                  <button
                    key={cat.value}
                    onClick={() => handleSelectCategory(cat.value)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white/10 text-slate-200 hover:bg-white/20 border border-white/10'
                    }`}
                  >
                    <IconComponent className="w-3.5 h-3.5" />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 1. FEATURED LIVE STOCK SHOWCASE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-5">

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-extrabold uppercase tracking-wider font-mono">
                {apiError ? 'Sample Catalog' : 'Live Karol Bagh Counter'}
              </span>
              {selectedCat !== 'All' && (
                <span className="text-xs text-slate-500 font-bold">• {selectedCat}</span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
              Popular Gadgets In Stock Today
            </h2>
          </div>

          <a
            href="/stock"
            onClick={(e) => {
              e.preventDefault();
              handleExploreFullCatalog(selectedCat);
            }}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-900 cursor-pointer"
          >
            <span>View All ({availablePhones.length} Units)</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        {/* Loading */}
        {loading && !apiError && (
          <div className="py-12 text-center space-y-2">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500">Loading latest stock...</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && !apiError && featuredStock.length === 0 && (
          <div className="py-12 text-center space-y-2">
            <Smartphone className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-500">No stock available right now</p>
            <p className="text-xs text-slate-400">Check back soon or contact us on WhatsApp</p>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3">
            {featuredStock.map(phone => {
              const isSold = phone.status === 'Sold Out';
              return (
                <a
                  key={phone.id}
                  href={`/stock/${phone.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    handleOpenDetail(phone);
                  }}
                  className={`group bg-white rounded-xl border transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-2xs hover:shadow-sm hover:border-blue-400 hover:-translate-y-0.5 cursor-pointer text-inherit no-underline ${
                    isSold ? 'border-slate-200 opacity-75' : 'border-slate-200/90'
                  }`}
                  id={`home-stock-block-${phone.id}`}
                  title={`View pre-owned ${phone.brand} ${phone.model} details`}
                >
                <div>
                  <div className="relative h-24 sm:h-28 w-full overflow-hidden bg-slate-100">
                    <img
                      src={phone.images[0]}
                      alt={`Pre-owned ${phone.brand} ${phone.model} ${phone.storage !== 'N/A' ? phone.storage : ''} in ${phone.colour} - Cortek Karol Bagh`}
                      loading="lazy"
                      className={`w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105 ${
                        isSold ? 'grayscale' : ''
                      }`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent pointer-events-none" />

                    <div className="absolute top-1.5 left-1.5 right-1.5 flex items-center justify-between pointer-events-none">
                      {phone.category && phone.category !== 'Phones' ? (
                        <span className="px-1 py-0.2 text-[8px] font-extrabold rounded bg-blue-600 text-white font-mono uppercase shadow-2xs">
                          {phone.category}
                        </span>
                      ) : phone.priceDrop ? (
                        <span className="px-1 py-0.2 text-[8px] font-bold rounded bg-amber-500 text-slate-950 flex items-center gap-0.5 shadow-2xs">
                          <Flame className="w-2 h-2 fill-slate-950" />
                          Drop
                        </span>
                      ) : (
                        <span className="px-1 py-0.2 text-[8px] font-bold rounded bg-slate-950/70 text-slate-200 backdrop-blur-2xs font-mono">
                          {phone.brand}
                        </span>
                      )}

                      {phone.batteryHealth ? (
                        <span className="px-1 py-0.2 text-[8px] font-bold rounded bg-emerald-950/85 text-emerald-300 border border-emerald-500/30 backdrop-blur-2xs font-mono flex items-center gap-0.5">
                          <BatteryCharging className="w-2 h-2" />
                          {phone.batteryHealth}%
                        </span>
                      ) : (
                        <span className="px-1 py-0.2 text-[8px] font-bold rounded bg-slate-950/80 text-slate-300 backdrop-blur-2xs">
                          {phone.status}
                        </span>
                      )}
                    </div>

                    <div className="absolute bottom-1 left-1.5 right-1.5 flex items-center justify-between text-[8px] font-mono text-slate-200 pointer-events-none">
                      <span className="truncate max-w-[80px]">{phone.stockTag || `ID: ${phone.id.slice(0, 6)}`}</span>
                      <span className="text-emerald-300 font-bold">{phone.condition.split(' ')[0]}</span>
                    </div>
                  </div>

                  <div className="p-2 sm:p-2.5 space-y-1">
                    <div className="flex items-start justify-between gap-1">
                      <h3 className="font-bold text-xs text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1 leading-tight">
                        {phone.model}
                      </h3>
                      {phone.storage !== 'N/A' && (
                        <span className="text-[9px] font-bold text-slate-600 bg-slate-100 px-1 py-0.2 rounded font-mono shrink-0">
                          {phone.storage}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-[9px] text-slate-500 flex-wrap">
                      <span className="truncate max-w-[70px]">{phone.colour}</span>
                      {phone.billAvailable && (
                        <>
                          <span>•</span>
                          <span className="text-blue-700 font-semibold flex items-center gap-0.5">
                            <Check className="w-2 h-2" /> Bill
                          </span>
                        </>
                      )}
                      {phone.inBox.originalBox && (
                        <>
                          <span>•</span>
                          <span className="text-slate-500">Box</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-2 sm:p-2.5 pt-0 space-y-1.5">
                  <div className="flex items-baseline justify-between pt-1 border-t border-slate-100">
                    <div className="font-black text-xs sm:text-sm text-slate-900 tracking-tight">
                      {formatINR(phone.price)}
                    </div>
                    {phone.originalMsp && (
                      <span className="text-[9px] text-emerald-700 font-bold font-mono">
                        Save {Math.round(((phone.originalMsp - phone.price) / phone.originalMsp) * 100)}%
                      </span>
                    )}
                  </div>
                </div>
                </a>
              );
            })}
        </div>
      </section>

      {/* 2. FOUR MAIN TRUST HIGHLIGHTS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-blue-700 font-mono">The Cortek difference</span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">Why buyers choose Cortek</h2>
          </div>
          <p className="max-w-md text-xs sm:text-sm text-slate-500 leading-relaxed sm:text-right">Every listing starts with a hands-on check, clear evidence, and time for you to verify the device yourself.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* Highlight 1 */}
          <div className="relative overflow-hidden p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 cortek-premium-card space-y-3 hover:-translate-y-1 hover:border-blue-300 transition-all group">
            <div className="absolute inset-x-0 top-0 h-1 bg-blue-500" />
            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold ring-4 ring-blue-50/70 group-hover:ring-blue-100 transition-all">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">Genuine Display & Parts</h3>
              <p className="text-xs text-slate-500 leading-relaxed mt-1">Original components checked before listing.</p>
            </div>
          </div>

          {/* Highlight 2 */}
          <div className="relative overflow-hidden p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 cortek-premium-card space-y-3 hover:-translate-y-1 hover:border-emerald-300 transition-all group">
            <div className="absolute inset-x-0 top-0 h-1 bg-emerald-500" />
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold ring-4 ring-emerald-50/70 group-hover:ring-emerald-100 transition-all">
              <BatteryCharging className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">Authentic Battery Health</h3>
              <p className="text-xs text-slate-500 leading-relaxed mt-1">Real battery percentage, never boosted.</p>
            </div>
          </div>

          {/* Highlight 3 */}
          <div className="relative overflow-hidden p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 cortek-premium-card space-y-3 hover:-translate-y-1 hover:border-amber-300 transition-all group">
            <div className="absolute inset-x-0 top-0 h-1 bg-amber-500" />
            <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center font-bold ring-4 ring-amber-50/70 group-hover:ring-amber-100 transition-all">
              <Receipt className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">Bill & Testing Warranty</h3>
              <p className="text-xs text-slate-500 leading-relaxed mt-1">Clear pricing with store-backed support.</p>
            </div>
          </div>

          {/* Highlight 4 */}
          <div className="relative overflow-hidden p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 cortek-premium-card space-y-3 hover:-translate-y-1 hover:border-rose-300 transition-all group">
            <div className="absolute inset-x-0 top-0 h-1 bg-rose-500" />
            <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center font-bold ring-4 ring-rose-50/70 group-hover:ring-rose-100 transition-all">
              <Star className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">4.9★ Karol Bagh Store</h3>
              <p className="text-xs text-slate-500 leading-relaxed mt-1">Walk in, inspect, and verify before paying.</p>
            </div>
          </div>

        </div>
      </section>

      {/* 3. FREQUENTLY ASKED QUESTIONS (SEO & USER TRUST) */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6 pt-4" aria-labelledby="home-faq-title">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-mono font-bold">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Buyer Transparency &amp; Answers</span>
          </div>
          <h2 id="home-faq-title" className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
            Everything you need to know about buying certified pre-owned electronics from our Karol Bagh store.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div
                key={index}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs transition-all"
              >
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-bold text-xs sm:text-sm text-slate-900 hover:text-blue-600 transition-colors cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <span className="leading-snug">{faq.q}</span>
                  <div className="p-1 rounded-lg bg-slate-50 text-slate-500 shrink-0">
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-0 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100">
                    <p className="pt-3">{faq.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

    </div>
  );
};
