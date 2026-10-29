import React, { useState } from 'react';
import { 
  X, 
  ArrowLeft, 
  BatteryCharging, 
  ShieldCheck, 
  CheckCircle2, 
  Box, 
  PhoneCall, 
  MapPin, 
  Sparkles, 
  Flame, 
  Share2,
  QrCode,
  Activity
} from 'lucide-react';
import { PhoneItem } from '../../types';
import { SITE_CONFIG, formatINR } from '../../config/siteConfig';
import { WhatsAppButton } from '../common/WhatsAppButton';
import { useInventory } from '../../context/InventoryContext';

interface ProductDetailModalProps {
  phone: PhoneItem;
  onClose: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ phone, onClose }) => {
  const { setActiveView } = useInventory();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [reserveName, setReserveName] = useState('');

  const isSold = phone.status === 'Sold Out';
  const isBooked = phone.status === 'Booked';
  const statusLabel = isSold ? 'Sold Out' : isBooked ? 'Booked' : 'Available in Karol Bagh';
  const isAccessory = phone.category === 'Accessories';

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: `${phone.brand} ${phone.model} - Cortek Enterprises`,
        text: `Check out this pre-owned ${phone.brand} ${phone.model} ${phone.storage} for ${formatINR(phone.price)} at Cortek Enterprises, Karol Bagh.`,
        url: url,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getBatteryHealthVerdict = (health?: number) => {
    if (!health) return 'Standard OEM Tested Battery';
    if (health >= 90) return 'Peak Factory Capacity (Outstanding standby)';
    if (health >= 85) return 'Healthy Factory Battery (All-day heavy usage)';
    return 'Good Genuine Battery (Standard 1-day usage)';
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-8 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Navigation Breadcrumb & Back button */}
        <div className="space-y-3 pb-4 border-b border-slate-200">
          <nav aria-label="Breadcrumb" className="text-xs text-slate-500 flex items-center gap-1.5 flex-wrap">
            <a href="/" onClick={(e) => { e.preventDefault(); setActiveView('home'); }} className="hover:text-blue-600">Home</a>
            <span>/</span>
            <a href="/stock" onClick={(e) => { e.preventDefault(); onClose(); }} className="hover:text-blue-600">Live Stock</a>
            <span>/</span>
            <span className="text-slate-900 font-medium">{phone.brand} {phone.model}</span>
          </nav>

          <div className="flex items-center justify-between gap-4">
            <button
              onClick={onClose}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 text-sm font-semibold transition-colors cursor-pointer shadow-xs"
              id="back-to-stock-btn"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Available Stock</span>
            </button>

          <div className="flex items-center gap-3">
            <button
              onClick={handleShare}
              className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
              title="Share phone details"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">{copied ? 'Link Copied!' : 'Share'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-200 cursor-pointer shadow-xs"
              aria-label="Close details"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

        {/* Main 2-Column Product Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* Left Column: Image Gallery & Authenticity Proofs */}
          <div className="lg:col-span-6 space-y-4">
            
            {/* Primary Large Image */}
            <div className="relative aspect-4/3 sm:aspect-square w-full rounded-3xl overflow-hidden bg-slate-100 border border-slate-200 shadow-md">
              <img
                src={phone.images[selectedImageIndex] || phone.images[0]}
                alt={`Pre-owned ${phone.brand} ${phone.model} ${phone.storage !== 'N/A' ? phone.storage : ''} in ${phone.colour} - Cortek Enterprises Karol Bagh Delhi`}
                className={`w-full h-full object-cover object-center ${isSold ? 'grayscale' : ''}`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent pointer-events-none"></div>

              {/* Status Badges */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2 pointer-events-none">
                <div className="flex items-center gap-2">
                  {phone.priceDrop && (
                    <span className="px-3 py-1 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1 shadow-md">
                      <Flame className="w-3.5 h-3.5 fill-slate-950" />
                      Price Drop
                    </span>
                  )}
                  {phone.featured && (
                    <span className="px-3 py-1 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center gap-1 shadow-md">
                      <Sparkles className="w-3.5 h-3.5" />
                      Featured
                    </span>
                  )}
                </div>

                <span
                  className={`px-3 py-1 rounded-xl text-xs font-bold font-mono border shadow-sm backdrop-blur-md ${
                    isSold
                      ? 'bg-slate-900/85 text-slate-300 border-slate-700'
                      : isBooked
                        ? 'bg-amber-950/85 text-amber-300 border-amber-400/40'
                        : 'bg-emerald-950/85 text-emerald-300 border-emerald-400/40'
                  }`}
                >
                  {statusLabel}
                </span>
              </div>

              {/* Authenticity ribbon */}
              <div className="absolute bottom-4 left-4 right-4 flex justify-end">
                <div className="text-xs font-bold text-emerald-300 bg-slate-950/85 px-3 py-1.5 rounded-xl border border-emerald-500/40 backdrop-blur-md flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Genuine, tested unit</span>
                </div>
              </div>
            </div>

            {/* Thumbnails */}
            {phone.images.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                {phone.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`relative w-20 h-20 rounded-2xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer bg-white ${
                      selectedImageIndex === idx
                        ? 'border-emerald-600 shadow-md shadow-emerald-600/20 scale-105'
                        : 'border-slate-200 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* In-Store Testing Bay Privilege */}
            <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-2.5">
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs font-mono">
                <Activity className="w-4 h-4 text-emerald-600" />
                <span>IN-STORE 3UTOOLS / DIAGNOSTIC TESTING READY</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                You can plug this exact unit into our Karol Bagh computer rig to inspect all original component serial numbers, battery charge cycle counts, and factory manufacture records before purchase.
              </p>
            </div>

          </div>

          {/* Right Column: Details, Specs, Battery, Box, and CTAs */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* Title & Brand */}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-700 font-mono">
                  {phone.brand} PRE-OWNED
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-xs text-slate-500">Listed: {phone.dateAdded}</span>
                {isAccessory && (
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${
                    isSold
                      ? 'bg-slate-100 text-slate-500 border-slate-200'
                      : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}>
                    Accessory: {isSold || isBooked ? 'Not Available' : 'Available'}
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight mt-1">
                {phone.brand} {phone.model} {phone.storage !== 'N/A' && <span className="text-slate-600 font-mono text-xl sm:text-2xl font-bold">({phone.storage})</span>}
              </h1>

              {/* Price Block */}
              <div className="mt-4 p-5 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex items-center justify-between">
                <div>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {formatINR(phone.price)}
                  </div>
                  {phone.originalMsp && (
                    <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                      <span>Launch Price: <span className="line-through">{formatINR(phone.originalMsp)}</span></span>
                      <span className="text-emerald-700 font-bold font-mono">
                        Save {formatINR(phone.originalMsp - phone.price)} ({Math.round(((phone.originalMsp - phone.price)/phone.originalMsp)*100)}%)
                      </span>
                    </div>
                  )}
                </div>

                <div className="text-right">
                  <span className="text-xs text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 font-bold block font-mono">
                    100% Fixed Price
                  </span>
                </div>
              </div>
            </div>

            {/* Product Summary */}
            <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-700">Product summary</h2>
                {phone.inBox.warrantyApplicable && <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg">Warranty applicable</span>}
              </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs text-center">
                <span className="text-[11px] text-slate-500 block font-medium">Storage</span>
                <span className="text-sm sm:text-base font-bold text-slate-900 mt-0.5 block font-mono">{phone.storage}</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs text-center">
                <span className="text-[11px] text-slate-500 block font-medium">Colour</span>
                <span className="text-sm sm:text-base font-bold text-slate-900 mt-0.5 flex items-center justify-center gap-1.5">
                  {phone.colorHex && (
                    <span 
                      className="w-2.5 h-2.5 rounded-full border border-slate-300 inline-block" 
                      style={{ backgroundColor: phone.colorHex }}
                    />
                  )}
                  {phone.colour}
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs text-center">
                <span className="text-[11px] text-slate-500 block font-medium">Condition</span>
                <span className="text-xs sm:text-sm font-bold text-emerald-700 mt-0.5 block truncate">
                  {phone.condition.split(' ')[0]}
                </span>
              </div>
              {phone.ram && <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 shadow-xs text-center">
                <span className="text-[11px] text-slate-500 block font-medium">RAM</span>
                <span className="text-sm sm:text-base font-bold text-slate-900 mt-0.5 block font-mono">{phone.ram}</span>
              </div>}
              {phone.processor && <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 shadow-xs text-center">
                <span className="text-[11px] text-slate-500 block font-medium">Processor</span>
                <span className="text-xs font-bold text-slate-900 mt-0.5 block truncate">{phone.processor}</span>
              </div>}
            </div>
              <p className="text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">{phone.conditionDescription || "DON'T COMPARE WITH FAKE BOX OR KIT UNITS ! ASLI ASLI HI HOTA HAI"}</p>
            </div>

            {/* Battery Health Audit Card */}
            {phone.batteryHealth !== undefined && (
              <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
                      <BatteryCharging className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900">Authentic Factory Battery Health</span>
                      <p className="text-[11px] text-slate-500">
                        {getBatteryHealthVerdict(phone.batteryHealth)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-black text-emerald-700 font-mono">{phone.batteryHealth}%</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                  <div 
                    className="h-full bg-gradient-to-r from-teal-500 to-emerald-600 rounded-full"
                    style={{ width: `${phone.batteryHealth}%` }}
                  />
                </div>

                <p className="text-[11px] text-slate-600 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Original unboosted factory battery cell. Zero reprogrammed BMS flex chips.</span>
                </p>
              </div>
            )}

            {/* What's in the Box */}
            <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Box className="w-4 h-4 text-emerald-600" />
                What You Receive With This Phone
              </h4>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                  phone.inBox.originalBox 
                    ? 'bg-emerald-50/60 text-slate-800 border-emerald-200' 
                    : 'bg-slate-50 text-slate-400 border-slate-200'
                }`}>
                  {phone.inBox.originalBox ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <X className="w-4 h-4 text-slate-400 shrink-0" />}
                  <span>Original Box</span>
                </div>

                {phone.billAvailable && phone.billAmount && (
                  <div className="p-2.5 rounded-xl border bg-blue-50/60 text-slate-800 border-blue-200 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Original Bill (₹{phone.billAmount.toLocaleString('en-IN')})</span>
                  </div>
                )}

                <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                  phone.inBox.chargerIncluded 
                    ? 'bg-emerald-50/60 text-slate-800 border-emerald-200' 
                    : 'bg-slate-50 text-slate-400 border-slate-200'
                }`}>
                  {phone.inBox.chargerIncluded ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <X className="w-4 h-4 text-slate-400 shrink-0" />}
                  <span>Charging Adapter</span>
                </div>

                <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                  phone.inBox.cableIncluded 
                    ? 'bg-emerald-50/60 text-slate-800 border-emerald-200' 
                    : 'bg-slate-50 text-slate-400 border-slate-200'
                }`}>
                  {phone.inBox.cableIncluded ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <X className="w-4 h-4 text-slate-400 shrink-0" />}
                  <span>Charging Cable</span>
                </div>

                {phone.inBox.warrantyApplicable && (
                  <div className="p-2.5 rounded-xl border bg-emerald-50/60 text-slate-800 border-emerald-200 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Testing Warranty</span>
                  </div>
                )}
              </div>
            </div>

            {/* Store Hold Reservation Widget */}
            <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-50 via-white to-white border border-emerald-200 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                <QrCode className="w-4 h-4 text-emerald-600" />
                <span>Reserve for 2-Hour Karol Bagh Counter Hold</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Avoid traveling to Karol Bagh only to find the unit sold. Send an instant WhatsApp reservation hold.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="Your Name (e.g. Amit Kumar)"
                  value={reserveName}
                  onChange={e => setReserveName(e.target.value)}
                  className="px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 flex-1 shadow-xs"
                />
                <WhatsAppButton
                  productName={`[STORE HOLD RESERVATION] ${phone.brand} ${phone.model} (${phone.storage} - ${phone.colour}) - Tag: ${phone.stockTag || 'Store Unit'} for Buyer: ${reserveName || 'Walk-in Guest'}`}
                  price={phone.price}
                  size="sm"
                  label="Reserve on WhatsApp"
                  className="shrink-0"
                />
              </div>
            </div>

            {/* Quick Action Phone Calls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <a
                href={`tel:${SITE_CONFIG.callingNumber}`}
                className="py-3 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-xs"
              >
                <PhoneCall className="w-4 h-4 text-emerald-600" />
                <span>Call Store ({SITE_CONFIG.displayPhone})</span>
              </a>

              <a
                href={SITE_CONFIG.location.googleMapsSearchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-3 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-xs"
              >
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>Store Directions (Karol Bagh)</span>
              </a>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
