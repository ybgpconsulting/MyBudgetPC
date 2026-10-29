import React from 'react';
import { Clock, ExternalLink, MapPin, Navigation, Phone, Users } from 'lucide-react';
import { SITE_CONFIG } from '../../config/siteConfig';
import { WhatsAppButton } from '../common/WhatsAppButton';

const panelClass = 'h-full p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm';

export const DirectContactPanel: React.FC = () => (
  <div className={`${panelClass} space-y-5 flex flex-col justify-between`}>
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-emerald-700 text-xs font-mono font-bold">
        <Users className="w-4 h-4 text-emerald-600" />
        <span>DIRECT STORE CONTACT</span>
      </div>
      <h3 className="text-xl font-bold text-slate-900">Have a specific model in mind?</h3>
      <p className="text-xs text-slate-600 leading-relaxed">
        Send a quick WhatsApp ping with your preferred phone model before heading over so we keep it charged and ready at the counter.
      </p>
      <div className="space-y-2 pt-2 text-xs">
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
          <span className="text-slate-500">Direct Phone:</span>
          <a href={`tel:${SITE_CONFIG.callingNumber}`} className="font-bold text-slate-900 hover:text-emerald-700">
            {SITE_CONFIG.displayPhone}
          </a>
        </div>
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
          <span className="text-slate-500">WhatsApp Hotline:</span>
          <span className="font-bold text-emerald-700">{SITE_CONFIG.displayPhone}</span>
        </div>
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
          <span className="text-slate-500">Operating Timings:</span>
          <span className="font-bold text-slate-900 text-right">{SITE_CONFIG.location.timings}</span>
        </div>
      </div>
    </div>
    <WhatsAppButton
      productName="Planning to visit Karol Bagh store counter today. Please let me know what iPhones/Samsung phones are ready for hands-on demo."
      size="lg"
      label="Notify Store of My Visit"
      className="w-full justify-center"
    />
  </div>
);

export const MapDirectionsPanel: React.FC = () => (
  <div className={`${panelClass} relative min-h-80 flex items-center justify-center p-6 text-center overflow-hidden`}>
    <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#059669_1px,transparent_1px)] [background-size:16px_16px]" />
    <div className="relative z-10 max-w-md space-y-4">
      <div className="w-16 h-16 rounded-3xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md shadow-emerald-600/20">
        <MapPin className="w-8 h-8" />
      </div>
      <div className="space-y-1">
        <h4 className="text-lg font-bold text-slate-900">Karol Bagh Hub, New Delhi</h4>
        <p className="text-xs text-slate-600">
          Located in central Karol Bagh near the metro station. Easy access from all parts of Delhi, Noida, Gurgaon, and NCR.
        </p>
      </div>
      <a
        href={SITE_CONFIG.location.googleMapsSearchUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
      >
        <Navigation className="w-4 h-4" />
        <span>Open Directions on Google Maps</span>
        <ExternalLink className="w-3.5 h-3.5" />
      </a>
    </div>
  </div>
);
