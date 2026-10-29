import React from 'react';
import { 
  MapPin, 
  Phone, 
  Clock, 
  Navigation, 
  CirclePlay, 
  Camera, 
  ExternalLink,
  Store,
  Train,
  Star
} from 'lucide-react';
import { SITE_CONFIG } from '../../config/siteConfig';
import { WhatsAppButton } from '../common/WhatsAppButton';
import { MapDirectionsPanel } from './ContactPanels';
import { RoutePlannerPanel } from './RouteAndStorePanels';

export const LocationSection: React.FC = () => {
  return (
    <section className="py-3 sm:py-4 bg-white text-slate-900" id="store-location">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-3">
        
        {/* 2-Column Info & Directions Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          
          {/* Left Info Card (5 cols) */}
          <div className="hidden">
            <div className="space-y-6">
              
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center justify-center">
                  <Store className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Cortek Enterprises</h3>
                  <p className="text-xs text-emerald-700 font-semibold">Karol Bagh, New Delhi</p>
                </div>
              </div>

              <div className="space-y-4 text-xs">
                {/* Address */}
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-900 block">Address</span>
                    <p className="text-slate-600 leading-relaxed">
                      {SITE_CONFIG.location.addressLine1}, {SITE_CONFIG.location.area}, {SITE_CONFIG.location.city}, Delhi {SITE_CONFIG.location.pincode}
                    </p>
                  </div>
                </div>

                {/* Metro Proximity */}
                <div className="flex items-start gap-3">
                  <Train className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-900 block">Metro Connectivity</span>
                    <p className="text-slate-600">
                      {SITE_CONFIG.location.metroDistance} (Blue Line)
                    </p>
                  </div>
                </div>

                {/* Timings */}
                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-900 block">Store Hours</span>
                    <p className="text-slate-600">
                      {SITE_CONFIG.location.timings}
                    </p>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-900 block">Phone & WhatsApp</span>
                    <p className="text-slate-600">
                      {SITE_CONFIG.displayPhone} / {SITE_CONFIG.alternatePhone}
                    </p>
                  </div>
                </div>
              </div>

            </div>

            {/* Direct Action Buttons */}
            <div className="pt-4 border-t border-slate-200 space-y-2.5">
              <WhatsAppButton
                size="md"
                label="Message on WhatsApp"
                className="w-full justify-center"
              />

              <div className="grid grid-cols-2 gap-2">
                <a
                  href={`tel:${SITE_CONFIG.callingNumber}`}
                  className="py-2.5 px-3 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Call Counter</span>
                </a>

                <div className="py-2.5 px-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Monday Closed</span>
                </div>
              </div>
            </div>

          </div>

          <div className="order-2 lg:order-2 lg:col-span-6 h-full">
            <RoutePlannerPanel />
          </div>

          {/* Right Column: Map & Social Connect */}
          <div className="lg:col-span-6 h-full space-y-4 flex flex-col">
            <MapDirectionsPanel />

            {/* Social Channels Bar */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="text-slate-600 font-medium">Follow & Review Cortek:</span>
              <div className="flex items-center gap-2">
                <a
                  href={SITE_CONFIG.googleReviewsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
                >
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span>4.9★ Google</span>
                </a>
                <a
                  href={SITE_CONFIG.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-white hover:bg-red-50 border border-slate-200 text-red-600 font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
                >
                  <CirclePlay className="w-4 h-4 text-red-600" />
                  <span>YouTube</span>
                </a>
                <a
                  href={SITE_CONFIG.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-white hover:bg-pink-50 border border-slate-200 text-pink-600 font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
                >
                  <Camera className="w-4 h-4 text-pink-600" />
                  <span>Instagram</span>
                </a>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
