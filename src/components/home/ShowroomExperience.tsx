import React, { useState } from 'react';
import { 
  MapPin, 
  Navigation, 
  Users, 
  Train, 
  Car, 
  Copy, 
  Check, 
  Store
} from 'lucide-react';
import { SITE_CONFIG } from '../../config/siteConfig';
import { DirectContactPanel } from './ContactPanels';
import { StoreDetailsPanel } from './RouteAndStorePanels';

export const ShowroomExperience: React.FC = () => {
  const [selectedRoute, setSelectedRoute] = useState<'metro' | 'cab' | 'walking'>('metro');
  const [copied, setCopied] = useState(false);

  const fullAddress = `${SITE_CONFIG.location.addressLine1}, ${SITE_CONFIG.location.area}, ${SITE_CONFIG.location.city}, ${SITE_CONFIG.location.state} - ${SITE_CONFIG.location.pincode}`;

  const copyAddress = () => {
    navigator.clipboard.writeText(fullAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="py-2 sm:py-3 bg-slate-50 relative overflow-hidden" id="store-showroom">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 space-y-3">
        
        {/* Header */}
        <div className="-mx-4 px-4 py-1 sm:-mx-6 sm:px-6 flex flex-col lg:flex-row lg:items-start justify-between gap-2">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold font-mono">
              <Store className="w-3.5 h-3.5 text-emerald-600" />
              <span>KAROL BAGH FLAGSHIP STORE & TESTING COUNTER</span>
            </div>

              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                Visit Our Karol Bagh Store &amp; Testing Counter, New Delhi
              </h1>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
              Unlike online blind sellers, Cortek welcomes you to sit, test, verify 3uTools diagnostics, and inspect the screen under daylight before spending a single rupee.
            </p>
          </div>

        </div>

        {/* Route Planner & Location Details */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          
          {/* Left: How to Reach Us Selector (7 Cols) */}
          <div className="hidden">
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">
                  How to reach Karol Bagh Store
                </span>
                
                {/* Route Mode Switcher */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button
                    onClick={() => setSelectedRoute('metro')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                      selectedRoute === 'metro' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-600'
                    }`}
                  >
                    <Train className="w-3.5 h-3.5" />
                    <span>Delhi Metro</span>
                  </button>
                  <button
                    onClick={() => setSelectedRoute('cab')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                      selectedRoute === 'cab' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-600'
                    }`}
                  >
                    <Car className="w-3.5 h-3.5" />
                    <span>Cab / Driving</span>
                  </button>
                </div>
              </div>

              {/* Route Details */}
              {selectedRoute === 'metro' ? (
                <div className="space-y-3 text-xs">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <div className="flex items-center gap-2 text-slate-900 font-bold">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                      <span>Blue Line: Karol Bagh Metro Station (Gate No. 4)</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      Just a 3-minute walking distance (approx. 250 meters) from Gate 4 towards the main mobile market hub.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <div className="flex items-center gap-2 text-slate-900 font-bold">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      <span>From Yellow Line (Rajiv Chowk / New Delhi Railway):</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      Interchange to Blue Line at Rajiv Chowk (Karol Bagh is just 3 stations away - 7 mins ride).
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-xs">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <div className="flex items-center gap-2 text-slate-900 font-bold">
                      <Car className="w-4 h-4 text-emerald-600" />
                      <span>Uber / Ola / Driving Destination</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      Search "Cortek Enterprises Karol Bagh" on Google Maps or select "Gaffar Market / Karol Bagh Metro Gate 4" as drop-off.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <div className="flex items-center gap-2 text-slate-900 font-bold">
                      <MapPin className="w-4 h-4 text-emerald-600" />
                      <span>Parking Availability</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      Multi-level car parking available at Karol Bagh Metro Station parking bay (2 mins walk).
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Address Banner with Copy Button */}
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div>
                <p className="font-bold text-slate-900">{SITE_CONFIG.location.name}</p>
                <p className="text-slate-600">{fullAddress}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={copyAddress}
                  className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy Address'}</span>
                </button>

                    <span className="text-[10px] text-emerald-700 font-bold">Address verified at Karol Bagh</span>
              </div>
            </div>

          </div>

          <div className="order-2 lg:order-2 lg:col-span-6 h-full">
            <StoreDetailsPanel />
          </div>

          {/* Right: Direct Store Contact */}
          <div className="order-1 lg:order-1 lg:col-span-6 h-full">
            <DirectContactPanel />
          </div>

        </div>

      </div>
    </section>
  );
};
