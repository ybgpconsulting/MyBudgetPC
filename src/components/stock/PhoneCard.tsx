import React from 'react';
import { 
  BatteryCharging, 
  Check, 
  Sparkles, 
  Eye, 
  ShieldCheck, 
  Flame, 
  Box,
  MapPin,
  Cpu
} from 'lucide-react';
import { PhoneItem } from '../../types';
import { formatINR } from '../../config/siteConfig';
import { WhatsAppButton } from '../common/WhatsAppButton';
import { useInventory } from '../../context/InventoryContext';

interface PhoneCardProps {
  phone: PhoneItem;
  onSelect?: (phone: PhoneItem) => void;
}

export const PhoneCard: React.FC<PhoneCardProps> = ({ phone, onSelect }) => {
  const { setActiveView } = useInventory();

  const handleCardClick = () => {
    if (onSelect) {
      onSelect(phone);
    } else {
      setActiveView('detail', phone.id);
    }
  };

  const isSold = phone.status === 'Sold Out';
  const isBooked = phone.status === 'Booked';
  const statusLabel = isSold ? 'Sold Out' : isBooked ? 'Booked' : 'Available';

  // Battery health styling for light theme
  const getBatteryColor = (health?: number) => {
    if (!health) return 'text-slate-600 border-slate-200 bg-slate-100';
    if (health >= 90) return 'text-emerald-700 border-emerald-200 bg-emerald-50';
    if (health >= 85) return 'text-teal-700 border-teal-200 bg-teal-50';
    return 'text-amber-700 border-amber-200 bg-amber-50';
  };

  return (
    <div 
      className={`group relative bg-white rounded-3xl border transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-xl hover:shadow-slate-200/70 ${
        isSold 
          ? 'border-slate-200 opacity-75' 
          : 'border-slate-200/90 hover:border-blue-400 hover:-translate-y-1'
      }`}
      id={`phone-card-${phone.id}`}
    >
      {/* Top Image & Badges Container */}
      <div>
        <div 
          onClick={handleCardClick}
          className="relative h-60 w-full overflow-hidden bg-slate-100 cursor-pointer"
        >
          <img
            src={phone.images[0]}
            alt={`Certified pre-owned ${phone.brand} ${phone.model} ${phone.storage !== 'N/A' ? phone.storage : ''} in ${phone.colour} - Karol Bagh, Delhi`}
            loading="lazy"
            className={`w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105 ${
              isSold ? 'grayscale' : ''
            }`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent"></div>

          {/* Badges Top Row */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
            <div className="flex items-center gap-1.5 flex-wrap">
              {phone.category && phone.category !== 'Phones' && (
                <span className="px-2.5 py-1 text-[10px] font-extrabold rounded-xl bg-blue-600 text-white shadow-md uppercase font-mono">
                  {phone.category}
                </span>
              )}
              {phone.priceDrop && (
                <span className="px-2.5 py-1 text-[11px] font-bold rounded-xl bg-amber-500 text-slate-950 flex items-center gap-1 shadow-md">
                  <Flame className="w-3 h-3 fill-slate-950" />
                  Price Drop
                </span>
              )}
              {phone.featured && !phone.priceDrop && !phone.category && (
                <span className="px-2.5 py-1 text-[11px] font-bold rounded-xl bg-emerald-600 text-white flex items-center gap-1 shadow-md">
                  <Sparkles className="w-3 h-3" />
                  Featured
                </span>
              )}
            </div>

            {/* Availability Badge */}
            <span 
              className={`px-3 py-1 text-[11px] font-bold rounded-xl border shadow-xs font-mono backdrop-blur-md ${
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

          {/* Verified badge bottom of image */}
          <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-end pointer-events-none">
            <span className="text-[10px] font-bold text-emerald-300 bg-slate-950/85 px-2 py-0.5 rounded-md border border-emerald-500/40 backdrop-blur-sm flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              100% Genuine Used
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-3.5">
          
          {/* Brand & Storage header */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-blue-700 font-mono">
                {phone.brand} {phone.category && `• ${phone.category}`}
              </span>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                <a
                  href={`/stock/${phone.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    handleCardClick();
                  }}
                  className="hover:text-blue-600 transition-colors"
                >
                  {phone.model}
                </a>
              </h3>
            </div>

            {phone.storage !== 'N/A' && (
              <div className="text-right shrink-0">
                <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                  {phone.storage}
                </span>
              </div>
            )}
          </div>

          {/* Specs Chips: Colour & Battery Health & Condition */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            {/* Colour */}
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 font-medium">
              {phone.colorHex && (
                <span 
                  className="w-2.5 h-2.5 rounded-full border border-slate-300 shrink-0" 
                  style={{ backgroundColor: phone.colorHex }}
                />
              )}
              {phone.colour}
            </span>

            {/* Battery Health if available */}
            {phone.batteryHealth && (
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl border font-bold font-mono ${getBatteryColor(phone.batteryHealth)}`}>
                <BatteryCharging className="w-3.5 h-3.5 shrink-0" />
                {phone.batteryHealth}% Battery
              </span>
            )}

            {/* Processor info if present */}
            {phone.processor && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 font-medium truncate max-w-[130px]">
                <Cpu className="w-3 h-3 text-slate-500 shrink-0" />
                {phone.processor}
              </span>
            )}

            {/* Condition Grade */}
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
              <Check className="w-3 h-3 text-blue-600" />
              {phone.condition.split(' ')[0]}
            </span>
          </div>

          {/* Honest condition snippet */}
          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
            {phone.conditionDescription}
          </p>

          {/* In-box inclusions mini tags */}
          <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-1 border-t border-slate-100 flex-wrap">
            {phone.inBox.originalBox && (
              <span className="inline-flex items-center gap-1">
                <Box className="w-3 h-3 text-slate-400" /> Orig. Box
              </span>
            )}
            {phone.billAvailable && (
              <span className="inline-flex items-center gap-1 font-semibold text-blue-700">
                <Check className="w-3 h-3 text-blue-600" /> 
                {phone.billAmount ? `Orig. Bill (₹${phone.billAmount.toLocaleString('en-IN')})` : 'Orig. Bill'}
              </span>
            )}
            {phone.inBox.taxInvoiceProvided && (
              <span className="inline-flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-600" /> Store Bill
              </span>
            )}
            {phone.inBox.chargerIncluded && (
              <span className="inline-flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-600" /> Charger
              </span>
            )}
          </div>

        </div>
      </div>

      {/* Card Footer: Price & CTAs */}
      <div className="p-5 pt-0 mt-2 space-y-3 border-t border-slate-100">
        
        {/* Pricing & Store Availability */}
        <div className="flex items-baseline justify-between pt-3">
          <div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {formatINR(phone.price)}
            </div>
            {phone.originalMsp && (
              <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                <span className="line-through">{formatINR(phone.originalMsp)}</span>
                <span className="text-blue-700 font-bold">
                  Save {Math.round(((phone.originalMsp - phone.price) / phone.originalMsp) * 100)}%
                </span>
              </div>
            )}
          </div>

          <div className="text-right">
            <span className="text-xs font-semibold text-blue-700 flex items-center gap-1 justify-end">
              <MapPin className="w-3 h-3 text-blue-600" />
              Karol Bagh Store
            </span>
            <span className="text-[10px] text-slate-400">Live in-store stock</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <a
            href={`/stock/${phone.id}`}
            onClick={(e) => {
              e.preventDefault();
              handleCardClick();
            }}
            className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-200 text-center"
            id={`btn-view-${phone.id}`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>View Details</span>
          </a>

          <WhatsAppButton
            productName={`${phone.brand} ${phone.model} ${phone.storage !== 'N/A' ? phone.storage : ''} (${phone.colour})`}
            price={phone.price}
            size="sm"
            label={isSold ? "Enquire Similar" : "WhatsApp"}
            variant={isSold ? "outline" : "primary"}
            className="w-full justify-center"
          />
        </div>

      </div>
    </div>
  );
};
