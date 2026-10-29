import React, { useState } from 'react';
import {
  Smartphone,
  Menu,
  X,
  MapPin,
  Search,
  Shield
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { SITE_CONFIG } from '../../config/siteConfig';
import { CortekLogo } from './CortekLogo';

interface NavbarProps {
  onOpenSearch?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenSearch }) => {
  const {
    activeView,
    setActiveView,
    availablePhones,
    setFilters
  } = useInventory();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (viewId: string) => {
    setActiveView(viewId);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-slate-200/90 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between gap-3 sm:gap-4">

        {/* Brand Identity: CORTEK ENTERPRISES */}
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            handleNavClick('home');
          }}
          className="cursor-pointer flex items-center group shrink-0"
          id="nav-brand-logo"
          aria-label="Cortek Enterprises Home"
        >
          <CortekLogo size="sm" showSubtitle={false} className="max-w-[220px]" />
        </a>

        {/* Clean Header Navigation Links - Crawlable Semantic Anchors */}
        <nav className="hidden lg:flex items-center gap-1.5" aria-label="Main Navigation">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              handleNavClick('home');
            }}
            aria-current={activeView === 'home' ? 'page' : undefined}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeView === 'home'
                ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Home
          </a>

          <a
            href="/stock"
            onClick={(e) => {
              e.preventDefault();
              setFilters(prev => ({ ...prev, category: 'All' }));
              handleNavClick('stock');
            }}
            aria-current={activeView === 'stock' ? 'page' : undefined}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeView === 'stock'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/80 bg-white'
            }`}
            id="nav-live-stock-btn"
          >
            <span>Live Stock</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
              activeView === 'stock' ? 'bg-white text-blue-700' : 'bg-blue-50 text-blue-700'
            }`}>
              {availablePhones.length} Ready
            </span>
          </a>

          <a
            href="/education"
            onClick={(e) => {
              e.preventDefault();
              handleNavClick('education');
            }}
            aria-current={activeView === 'education' ? 'page' : undefined}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeView === 'education'
                ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Why Cortek
          </a>

          <a
            href="/safety"
            onClick={(e) => {
              e.preventDefault();
              handleNavClick('safety');
            }}
            aria-current={activeView === 'safety' ? 'page' : undefined}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeView === 'safety'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            Safety Checks
          </a>

          <a
            href="/contact"
            onClick={(e) => {
              e.preventDefault();
              handleNavClick('contact');
            }}
            aria-current={activeView === 'contact' ? 'page' : undefined}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeView === 'contact'
                ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Contact Us
          </a>
        </nav>

        {/* Right Action Area: Search */}
        <div className="hidden sm:flex items-center gap-2.5">

          {/* Quick Search Button */}
          <button
            onClick={() => onOpenSearch ? onOpenSearch() : setActiveView('stock')}
            className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 transition-colors flex items-center gap-2 text-xs font-medium cursor-pointer shadow-2xs"
            title="Search inventory (Ctrl+K)"
          >
            <Search className="w-4 h-4 text-blue-600" />
            <span className="hidden xl:inline text-slate-600">Search</span>
          </button>

        </div>

        {/* Mobile Menu & Search Triggers */}
        <div className="flex items-center gap-2 lg:hidden">
          <button
            onClick={() => onOpenSearch ? onOpenSearch() : setActiveView('stock')}
            className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 cursor-pointer shadow-xs"
            aria-label="Search"
          >
            <Search className="w-4 h-4 text-blue-600" />
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 cursor-pointer shadow-xs"
            aria-label="Toggle navigation menu"
            id="mobile-nav-toggle"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-6 space-y-4 shadow-xl animate-in fade-in slide-in-from-top-4 duration-200">

          {/* Navigation Links */}
          <div className="space-y-1 pt-2 border-t border-slate-100">
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                handleNavClick('home');
              }}
              className={`w-full block px-3.5 py-2.5 rounded-xl text-xs font-bold cursor-pointer ${
                activeView === 'home' ? 'bg-blue-50 text-blue-700' : 'text-slate-700'
              }`}
            >
              Home
            </a>

            <a
              href="/stock"
              onClick={(e) => {
                e.preventDefault();
                setFilters(prev => ({ ...prev, category: 'All' }));
                handleNavClick('stock');
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold cursor-pointer ${
                activeView === 'stock' ? 'bg-blue-50 text-blue-700' : 'text-slate-700'
              }`}
            >
              <span>Live Stock Catalog</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-mono">
                {availablePhones.length} Ready
              </span>
            </a>

            <a
              href="/education"
              onClick={(e) => {
                e.preventDefault();
                handleNavClick('education');
              }}
              className={`w-full block px-3.5 py-2.5 rounded-xl text-xs font-bold cursor-pointer ${
                activeView === 'education' ? 'bg-blue-50 text-blue-700' : 'text-slate-700'
              }`}
            >
              Why Cortek (Anti-Scam Guide)
            </a>

            <a
              href="/safety"
              onClick={(e) => {
                e.preventDefault();
                handleNavClick('safety');
              }}
              className={`w-full block px-3.5 py-2.5 rounded-xl text-xs font-bold cursor-pointer ${
                activeView === 'safety' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700'
              }`}
            >
              Safety Checks &amp; Testing
            </a>

            <a
              href="/contact"
              onClick={(e) => {
                e.preventDefault();
                handleNavClick('contact');
              }}
              className={`w-full block px-3.5 py-2.5 rounded-xl text-xs font-bold cursor-pointer ${
                activeView === 'contact' ? 'bg-blue-50 text-blue-700' : 'text-slate-700'
              }`}
            >
              Contact Us &amp; Directions
            </a>
          </div>

        </div>
      )}
    </header>
  );
};
