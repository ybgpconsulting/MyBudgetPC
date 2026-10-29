import React from 'react';
import {
  Chrome,
  Facebook,
  Instagram,
  Youtube,
  MapPin,
  Phone,
  Clock,
  Train,
  ShieldCheck,
  BatteryCharging,
  Receipt,
  Sparkles
} from 'lucide-react';
import { SITE_CONFIG } from '../../config/siteConfig';
import { WhatsAppIcon } from './WhatsAppButton';
import { useInventory } from '../../context/InventoryContext';

export const Footer: React.FC = () => {
  const { setActiveView, setFilters } = useInventory();

  const handleNav = (viewId: string, category?: string) => {
    if (category) {
      setFilters(prev => ({ ...prev, category: category as any }));
    }
    setActiveView(viewId);
  };

  return (
    <footer className="bg-slate-950 text-slate-400 pt-12 pb-8 border-t border-slate-800/80" aria-label="Site Footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">

        {/* Main 4-Column SEO Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

          {/* Column 1: Brand & Local Karol Bagh Presence */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <span className="text-xs font-black tracking-widest text-emerald-400 font-mono uppercase">Karol Bagh • New Delhi</span>
              <h2 className="text-lg font-black text-white tracking-tight">CORTEK ENTERPRISES</h2>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Delhi NCR's trusted store for certified pre-owned iPhones, MacBooks, iPads and flagship Android phones. 100% original factory parts, zero counterfeit components, transparent battery health and store tax invoices.
            </p>
            <div className="flex items-center gap-2 pt-1 text-xs text-amber-400 font-bold">
              <span className="flex items-center gap-1 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                ★ 4.9 Google Rating (380+ Verified Reviews)
              </span>
            </div>
          </div>

          {/* Column 2: Crawlable Internal Navigation */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Explore Catalog</h3>
            <ul className="space-y-2 text-xs">
              <li>
                <a
                  href="/stock"
                  onClick={(e) => { e.preventDefault(); handleNav('stock', 'Phones'); }}
                  className="hover:text-white transition-colors flex items-center justify-between"
                >
                  <span>Pre-Owned iPhones &amp; Phones</span>
                  <span className="text-[10px] text-emerald-400 font-mono">Live Stock</span>
                </a>
              </li>
              <li>
                <a
                  href="/stock"
                  onClick={(e) => { e.preventDefault(); handleNav('stock', 'Laptops'); }}
                  className="hover:text-white transition-colors"
                >
                  Used MacBooks &amp; Laptops
                </a>
              </li>
              <li>
                <a
                  href="/stock"
                  onClick={(e) => { e.preventDefault(); handleNav('stock', 'Tablets'); }}
                  className="hover:text-white transition-colors"
                >
                  Apple iPads &amp; Tablets
                </a>
              </li>
              <li>
                <a
                  href="/stock"
                  onClick={(e) => { e.preventDefault(); handleNav('stock', 'Watches'); }}
                  className="hover:text-white transition-colors"
                >
                  Apple Watches &amp; Smartwatches
                </a>
              </li>
              <li>
                <a
                  href="/accessories"
                  onClick={(e) => { e.preventDefault(); handleNav('accessories'); }}
                  className="hover:text-white transition-colors"
                >
                  Genuine Adapters &amp; MagSafe
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Trust & Educational Guides */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Buyer Protection</h3>
            <ul className="space-y-2 text-xs">
              <li>
                <a
                  href="/education"
                  onClick={(e) => { e.preventDefault(); handleNav('education'); }}
                  className="hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>Why Avoid Refurbished Phones</span>
                </a>
              </li>
              <li>
                <a
                  href="/safety"
                  onClick={(e) => { e.preventDefault(); handleNav('safety'); }}
                  className="hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <BatteryCharging className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Battery Health Boost Trap Guide</span>
                </a>
              </li>
              <li>
                <a
                  href="/safety"
                  onClick={(e) => { e.preventDefault(); handleNav('safety'); }}
                  className="hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <Receipt className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>10-Point Live Counter Inspection</span>
                </a>
              </li>
              <li>
                <a
                  href="/contact"
                  onClick={(e) => { e.preventDefault(); handleNav('contact'); }}
                  className="hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <Train className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span>How to Reach from Metro Gate 4</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Local NAP & Store Hours */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Store Visit Details</h3>
            <div className="space-y-2.5 text-xs text-slate-400">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{SITE_CONFIG.location.addressLine1}, {SITE_CONFIG.location.area}, New Delhi - {SITE_CONFIG.location.pincode}</span>
              </div>
              <div className="flex items-center gap-2">
                <Train className="w-4 h-4 text-blue-400 shrink-0" />
                <span>{SITE_CONFIG.location.landmark}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <a href={`tel:${SITE_CONFIG.callingNumber}`} className="hover:text-white font-mono font-bold">
                  {SITE_CONFIG.displayPhone}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Tue - Sun: 11:30 AM - 8:30 PM (Mon Closed)</span>
              </div>
            </div>
          </div>

        </div>

        {/* Local Keywords & Coverage Cloud for Search Engines */}
        <div className="pt-6 border-t border-slate-900 text-[11px] text-slate-500 space-y-2">
          <p className="font-semibold text-slate-400">Popular Local Search Queries in Delhi NCR:</p>
          <p className="leading-relaxed">
            Second hand iPhone 15 Pro Max in Karol Bagh • Pre-owned Apple iPhone 14 Pro Delhi • Used MacBook Pro M2 M3 Gaffar Market • Certified used phones New Delhi • Genuine second hand mobile phone shop Karol Bagh • Buy used Samsung S24 Ultra Delhi NCR • Original pre owned Apple Watch Ultra • Used iPad Pro Gaffar Market Delhi.
          </p>
        </div>

        {/* Social Links & Copyright */}
        <div className="pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} CORTEK ENTERPRISES. All rights reserved. Karol Bagh, New Delhi.</p>

          <div className="flex flex-wrap items-center justify-center gap-2" aria-label="Social media channels">
            <a href={SITE_CONFIG.instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="px-2.5 py-1.5 rounded-lg text-pink-400 hover:text-white hover:bg-pink-950 transition-colors flex items-center gap-1.5 font-medium">
              <Instagram className="w-3.5 h-3.5" />
              <span>Instagram</span>
            </a>
            <a href={SITE_CONFIG.youtubeUrl} target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="px-2.5 py-1.5 rounded-lg text-red-400 hover:text-white hover:bg-red-950 transition-colors flex items-center gap-1.5 font-medium">
              <Youtube className="w-3.5 h-3.5" />
              <span>YouTube</span>
            </a>
            <a href={SITE_CONFIG.whatsappCommunityUrl} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="px-2.5 py-1.5 rounded-lg text-emerald-400 hover:text-white hover:bg-emerald-950 transition-colors flex items-center gap-1.5 font-medium">
              <WhatsAppIcon className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </a>
            <a href={SITE_CONFIG.facebookUrl} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="px-2.5 py-1.5 rounded-lg text-blue-400 hover:text-white hover:bg-blue-950 transition-colors flex items-center gap-1.5 font-medium">
              <Facebook className="w-3.5 h-3.5" />
              <span>Facebook</span>
            </a>
            <a href={SITE_CONFIG.googleReviewsUrl} target="_blank" rel="noopener noreferrer" aria-label="Google Ratings" className="px-2.5 py-1.5 rounded-lg text-amber-400 hover:text-white hover:bg-amber-950 transition-colors flex items-center gap-1.5 font-medium">
              <Chrome className="w-3.5 h-3.5" />
              <span>Google 4.9★</span>
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
};
