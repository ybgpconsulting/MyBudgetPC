import React, { useState } from 'react';
import { 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  CirclePlay, 
  ShieldCheck, 
  ExternalLink,
  ScanLine,
  ClipboardCheck,
  UserRoundCheck
} from 'lucide-react';
import { BUYER_INSPECTION_CHECKLIST } from '../../data/staticContent';
import { SITE_CONFIG } from '../../config/siteConfig';

export const SafetyChecks: React.FC = () => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleExpand = (idx: number) => {
    setExpandedIndex(prev => (prev === idx ? null : idx));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-8 px-4 sm:px-6 space-y-12">
      <div className="max-w-7xl mx-auto space-y-12">
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-5xl mx-auto">
          {[
            { icon: ScanLine, label: 'Inspect live', detail: 'See the checks happen in front of you', color: 'text-blue-700 bg-blue-50 border-blue-100' },
            { icon: ClipboardCheck, label: 'Verify the evidence', detail: 'Match condition, parts, and battery claims', color: 'text-emerald-700 bg-emerald-50 border-emerald-100' },
            { icon: UserRoundCheck, label: 'Decide with confidence', detail: 'Ask questions before you pay', color: 'text-amber-700 bg-amber-50 border-amber-100' },
          ].map(({ icon: Icon, label, detail, color }) => (
            <div key={label} className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${color}`}><Icon className="w-5 h-5" /></div>
              <div><p className="text-xs font-extrabold text-slate-900">{label}</p><p className="text-[11px] text-slate-500 mt-0.5">{detail}</p></div>
            </div>
          ))}
        </div>

        {/* 7-Step Buyer Inspection Checklist */}
        <section className="space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-700 font-mono">
                Buyer Awareness & Self-Testing
              </span>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
                Buying a Used Phone in Karol Bagh? 7-Step Inspection Checklist
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Whether you buy from Cortek or anywhere else in Karol Bagh, use this practical 7-step inspection checklist to avoid paying for altered parts.
              </p>
            </div>

            <a
              href={SITE_CONFIG.youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-red-50 hover:bg-red-100 border border-red-200 text-xs font-bold text-red-700 transition-colors cursor-pointer self-start md:self-auto shadow-xs"
            >
              <CirclePlay className="w-4 h-4 text-red-600" />
              <span>Watch Cortek's Buying Guides</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Checklist Accordion / Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {BUYER_INSPECTION_CHECKLIST.map((item, idx) => {
              const isExpanded = expandedIndex === idx;
              return (
                <div
                  key={idx}
                  className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                    isExpanded
                      ? 'bg-slate-50 border-emerald-500 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <button
                    onClick={() => toggleExpand(idx)}
                    className="w-full p-4 sm:p-5 text-left flex items-start justify-between gap-3 cursor-pointer"
                  >
                    <div className="flex items-start gap-3.5">
                      <span className="w-8 h-8 rounded-xl bg-emerald-600 text-white border border-emerald-500 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                        {item.step}
                      </span>
                      <div>
                        <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                          {item.title}
                        </h4>
                        <p className="text-xs text-emerald-700 font-semibold mt-1">
                          Test: {item.keyCheck}
                        </p>
                      </div>
                    </div>

                    <div className="text-slate-400 p-1">
                      {isExpanded ? <ChevronUp className="w-5 h-5 text-emerald-600" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-5 pb-5 pt-1 text-xs text-slate-600 space-y-3 border-t border-slate-200 animate-in fade-in duration-150">
                      <p className="leading-relaxed">
                        {item.description}
                      </p>
                      <div className="p-3 rounded-xl bg-white border border-slate-200 text-[11px] text-slate-600 flex items-center gap-2 shadow-2xs">
                        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>At Cortek Karol Bagh, our technicians test this live in front of you.</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Cortek's Additional Safety Standards */}
        <section className="space-y-6">
          <div className="text-center sm:text-left">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              Cortek's Additional Safety Standards
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Beyond the basic checklist, these are the non-negotiable standards we enforce on every device.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Zero Altered Parts Guarantee
                </h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Every device is verified for original factory display, battery, motherboard, and enclosure. No aftermarket replacements, no reprogrammed components.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Transparent Condition Grading
                </h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Honest cosmetic grading with high-resolution photos showing every angle. What you see online matches what you inspect in-store.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Battery Health Verification
                </h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Real-world discharge testing with professional diagnostic tools. No boosted cycle counts or fake 100% readings.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Purchase Bill & Warranty
                </h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Official store purchase bill with serial number, testing warranty, and original brand box when available.
              </p>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};