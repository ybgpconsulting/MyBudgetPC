import React from 'react';
import { 
  CirclePlay, 
  AlertTriangle, 
  CheckCircle2, 
  BatteryCharging, 
  Smartphone, 
  Eye, 
  Cpu 
  , ChevronDown, ChevronUp
} from 'lucide-react';
import { SITE_CONFIG } from '../../config/siteConfig';
import { EDUCATIONAL_VIDEOS } from '../../data/staticContent';
import { WhatsAppButton } from '../common/WhatsAppButton';

export const EducationView: React.FC = () => {
  const [expandedIndex, setExpandedIndex] = React.useState<number | null>(null);
  const guidePoints = [
    {
      title: "1. The Fake 100% Battery Boost Chip Trap",
      icon: BatteryCharging,
      explanation:
        "Many second-hand sellers solder a tiny battery reprogramming tag-on flex onto worn-out batteries. This artificially resets the cycle count and forces the iOS settings menu to falsely display '100% Battery Health'. In reality, the physical chemistry has degraded to 75%, leading to sudden phone shutdowns at 20% charge.",
      cortekStandard:
        "Cortek shows the honest, unboosted battery health (e.g. 86% - 94%). We test real-world discharge curves with professional diagnostic tools before offering any device."
    },
    {
      title: "2. Cheap Aftermarket LCDs Replaced on OLED Phones",
      icon: Eye,
      explanation:
        "Refurbished phones often replace cracked original OLED panels with cheap duplicate LCD panels costing 1/5th the price. These replica screens have thick chin borders, washed-out grey blacks, zero True Tone support, and high battery consumption.",
      cortekStandard:
        "Every pre-owned phone sold at Cortek retains its 100% factory original OLED display with verified True Tone and accurate color calibration."
    },
    {
      title: "3. Replica Re-Shelled Outer Housings",
      icon: Smartphone,
      explanation:
        "Some shops transfer motherboard components into cheap third-party metallic replica shells that lack proper thermal heat-dissipation pads, antenna line integrity, and dust/water sealing gaskets.",
      cortekStandard:
        "Cortek never reshells devices. We sell original factory enclosures with honest disclosure of any minor cosmetic wear."
    },
    {
      title: "4. Motherboard Rework & Heat Gun Bypasses",
      icon: Cpu,
      explanation:
        "Salvaged water-damaged or IC-shorted boards are often temporarily revived using cheap heat rework stations, only to fail permanently after 2 to 3 weeks of everyday customer usage.",
      cortekStandard:
        "We reject any unit showing signs of motherboard soldering or heat-gun rework. All internal components must be in original factory condition."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-8 px-4 sm:px-6 space-y-12">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200 text-xs font-bold font-mono">
            <CirclePlay className="w-4 h-4 text-red-600" />
            <span>Cortek Educational Initiative</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Why Cortek Avoids Refurbished Phones
          </h1>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Learn the critical difference between genuine, unaltered <strong className="text-emerald-700">Pre-Owned phones</strong> and tampered <strong className="text-amber-700">Refurbished phones</strong> in the Karol Bagh second-hand market.
          </p>
        </div>

        {/* 4 Deep Dive Guides */}
        <div className="space-y-6">
          <div className="text-center sm:text-left">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              The 4 Most Common Alterations in the Second-Hand Market
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Read how buyers get misled and how Cortek protects your investment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {guidePoints.map((point, idx) => {
              const Icon = point.icon;
              const isExpanded = expandedIndex === idx;
              return (
                <div
                  key={idx}
                  className={`rounded-3xl bg-white border shadow-xs overflow-hidden transition-all ${isExpanded ? 'border-emerald-300 shadow-md' : 'border-slate-200'}`}
                >
                  <button
                    type="button"
                    onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                    className="w-full p-6 sm:p-7 text-left flex items-center justify-between gap-4 cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5" />
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-slate-900">
                        {point.title}
                      </h3>
                    </div>
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-emerald-600 shrink-0" /> : <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />}
                  </button>

                  {isExpanded && <div className="px-6 pb-6 sm:px-7 sm:pb-7 space-y-4">
                    <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-100 space-y-1.5 text-xs text-slate-700">
                      <span className="font-bold text-rose-800 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                        The Risk in Refurbished Phones:
                      </span>
                      <p className="leading-relaxed text-slate-600">
                        {point.explanation}
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1 text-xs text-emerald-900">
                    <span className="font-bold text-emerald-800 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      The Cortek Standard:
                    </span>
                    <p className="leading-relaxed">
                      {point.cortekStandard}
                    </p>
                    </div>
                  </div>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Video Cards Spotlight */}
        <div className="p-6 sm:p-10 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-red-600 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <CirclePlay className="w-4 h-4 text-red-600" />
                Featured YouTube Guides
              </span>
              <h2 className="text-2xl font-bold text-slate-900 mt-1">Watch Step-by-Step Breakdown Videos</h2>
            </div>

            <a
              href={SITE_CONFIG.youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold inline-flex items-center gap-2 shadow-xs"
            >
              <CirclePlay className="w-4 h-4" />
              <span>Subscribe on YouTube</span>
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {EDUCATIONAL_VIDEOS.map((v) => (
              <a
                key={v.id}
                href={v.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-2xl bg-slate-50 border border-slate-200 hover:border-red-500/50 p-4 transition-all space-y-3 hover:shadow-xs"
              >
                <div className={`h-36 rounded-xl bg-gradient-to-br ${v.thumbnailGradient} flex items-center justify-center relative border border-slate-200`}>
                  <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                    <CirclePlay className="w-6 h-6" />
                  </div>
                  <span className="absolute bottom-2 right-2 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-900/80 text-white">
                    {v.duration}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-red-600 transition-colors">
                  {v.title}
                </h4>
                <p className="text-xs text-slate-600 line-clamp-2">
                  {v.description}
                </p>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
