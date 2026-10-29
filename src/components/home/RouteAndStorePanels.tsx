import React, { useState } from 'react';
import { Car, Check, Clock, Copy, MapPin, Phone, Store, Train } from 'lucide-react';
import { SITE_CONFIG } from '../../config/siteConfig';
import { WhatsAppButton } from '../common/WhatsAppButton';

const panelClass = 'h-full p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm';

export const StoreDetailsPanel: React.FC = () => (
  <div className={`${panelClass} space-y-6 flex flex-col justify-between`}>
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center justify-center"><Store className="w-6 h-6" /></div>
        <div><h3 className="text-lg font-bold text-slate-900">Cortek Enterprises</h3><p className="text-xs text-emerald-700 font-semibold">Karol Bagh, New Delhi</p></div>
      </div>
      <div className="space-y-4 text-xs">
        <div className="flex items-start gap-3"><MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /><div><b className="text-slate-900">Address</b><p className="text-slate-600 leading-relaxed">{SITE_CONFIG.location.addressLine1}, {SITE_CONFIG.location.area}, {SITE_CONFIG.location.city}, Delhi {SITE_CONFIG.location.pincode}</p></div></div>
        <div className="flex items-start gap-3"><Train className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /><div><b className="text-slate-900">Metro Connectivity</b><p className="text-slate-600">{SITE_CONFIG.location.metroDistance} (Blue Line)</p></div></div>
        <div className="flex items-start gap-3"><Clock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /><div><b className="text-slate-900">Store Hours</b><p className="text-slate-600">{SITE_CONFIG.location.timings}</p></div></div>
        <div className="flex items-start gap-3"><Phone className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /><div><b className="text-slate-900">Phone & WhatsApp</b><p className="text-slate-600">{SITE_CONFIG.displayPhone} / {SITE_CONFIG.alternatePhone}</p></div></div>
      </div>
    </div>
    <div className="pt-4 border-t border-slate-200 space-y-2.5"><WhatsAppButton size="md" label="Message on WhatsApp" className="w-full justify-center" /><div className="grid grid-cols-2 gap-2"><a href={`tel:${SITE_CONFIG.callingNumber}`} className="py-2.5 px-3 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5"><Phone className="w-3.5 h-3.5 text-emerald-600" />Call Counter</a><div className="py-2.5 px-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-center gap-1.5"><Clock className="w-3.5 h-3.5 text-emerald-600" />Monday Closed</div></div></div>
  </div>
);

export const RoutePlannerPanel: React.FC = () => {
  const [route, setRoute] = useState<'metro' | 'cab'>('metro');
  const [copied, setCopied] = useState(false);
  const address = `${SITE_CONFIG.location.addressLine1}, ${SITE_CONFIG.location.area}, ${SITE_CONFIG.location.city}, ${SITE_CONFIG.location.state} - ${SITE_CONFIG.location.pincode}`;
  const copyAddress = () => { navigator.clipboard.writeText(address); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return <div className={`${panelClass} space-y-6 flex flex-col justify-between`}><div className="space-y-4"><div className="flex items-center justify-between gap-3"><span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">How to reach Karol Bagh Store</span><div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200"><button onClick={() => setRoute('metro')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${route === 'metro' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-600'}`}><Train className="w-3.5 h-3.5" />Delhi Metro</button><button onClick={() => setRoute('cab')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${route === 'cab' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-600'}`}><Car className="w-3.5 h-3.5" />Cab / Driving</button></div></div>{route === 'metro' ? <div className="space-y-3 text-xs"><div className="p-4 rounded-2xl bg-slate-50 border border-slate-200"><b className="text-slate-900">Blue Line: Karol Bagh Metro Station (Gate No. 4)</b><p className="text-slate-600 mt-1.5">Just a 3-minute walking distance, approximately 250 meters from Gate 4.</p></div><div className="p-4 rounded-2xl bg-slate-50 border border-slate-200"><b className="text-slate-900">From Yellow Line</b><p className="text-slate-600 mt-1.5">Interchange at Rajiv Chowk. Karol Bagh is three stations away.</p></div></div> : <div className="space-y-3 text-xs"><div className="p-4 rounded-2xl bg-slate-50 border border-slate-200"><b className="text-slate-900">Uber / Ola / Driving Destination</b><p className="text-slate-600 mt-1.5">Search Cortek Enterprises Karol Bagh on Google Maps.</p></div><div className="p-4 rounded-2xl bg-slate-50 border border-slate-200"><b className="text-slate-900">Parking Availability</b><p className="text-slate-600 mt-1.5">Metro station parking is approximately two minutes away.</p></div></div>}</div><div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between gap-3 text-xs"><div><b className="text-slate-900">{SITE_CONFIG.location.name}</b><p className="text-slate-600">{address}</p></div><button onClick={copyAddress} className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 flex items-center gap-1.5 shrink-0">{copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}<span>{copied ? 'Copied' : 'Copy Address'}</span></button></div></div>;
};
