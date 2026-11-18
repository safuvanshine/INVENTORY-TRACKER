'use client';

import React, { useState, useRef } from 'react';
import {
  X,
  PlayCircle,
  Download,
  Lock,
  ArrowRightLeft,
  CheckCircle2,
  ShieldCheck,
  Search,
  Layers,
  Sparkles
} from 'lucide-react';

interface VideoGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TUTORIAL_STEPS = [
  {
    step: 1,
    timeSec: 0,
    title: '1. Login (Admin & Branch User)',
    malayalam: 'നിങ്ങളുടെ യൂസർനെയിമും പാസ്‌വേഡും നൽകി ലോഗിൻ ചെയ്യുക. Admin-ന് എല്ലാ കൺട്രോളും ഉണ്ടാകും, Branch User-ക്ക് സ്റ്റോക്ക് കാണാനും Hold/Transfer/Verify ചെയ്യാനും സാധിക്കും.',
    icon: ShieldCheck
  },
  {
    step: 2,
    timeSec: 5,
    title: '2. Gold & Diamond Stock Search (Grams & Carats)',
    malayalam: 'Gold Inventory-ൽ തൂക്കം ഗ്രാമിലും (g), Diamond Inventory-ൽ കാരറ്റിലും (ct) കാണാം. മുകളിലെ Branch Dropdown വഴി HO, S1–S13 ബ്രാഞ്ചുകൾ ഫിൽട്ടർ ചെയ്യാം.',
    icon: Search
  },
  {
    step: 3,
    timeSec: 9,
    title: '3. Hold Item for Customer (Max 3 Days)',
    malayalam: 'കസ്റ്റമർക്ക് വേണ്ടി ഒരു ഐറ്റം മാറ്റി വെക്കാൻ ആ ഐറ്റത്തിന് നേരെയുള്ള "Hold" ബട്ടൺ ക്ലിക്ക് ചെയ്ത് ബ്രാഞ്ചും ദിവസവും (1, 2, അല്ലെങ്കിൽ 3 ദിവസം) തിരഞ്ഞെടുക്കുക. Admin ബ്രാഞ്ചിൽ വിളിച്ച് കൺഫേം ചെയ്ത ശേഷമേ ഇത് Release ചെയ്യുകയുള്ളൂ.',
    icon: Lock
  },
  {
    step: 4,
    timeSec: 14,
    title: '4. Branch-to-Branch Transfer & Accept',
    malayalam: 'ഒരു ബ്രാഞ്ചിൽ നിന്ന് മറ്റൊരു ബ്രാഞ്ചിലേക്ക് ഐറ്റം അയക്കാൻ "Transfer" ക്ലിക്ക് ചെയ്ത് ബ്രാഞ്ച് തിരഞ്ഞെടുക്കുക. ഓപ്പോസിറ്റ് ബ്രാഞ്ച് "Accept" ക്ലിക്ക് ചെയ്യുമ്പോൾ മാത്രമേ അത് അവരുടെ സ്റ്റോക്കിലേക്ക് കയറുകയുള്ളൂ.',
    icon: ArrowRightLeft
  },
  {
    step: 5,
    timeSec: 22,
    title: '5. Branch Stock Verification & Save to Admin',
    malayalam: 'Branch Status പേജിൽ നിങ്ങളുടെ ബ്രാഞ്ച് (ഉദാ: S1) തിരഞ്ഞെടുത്ത് ബാർകോഡ് സ്കാൻ ചെയ്തോ Verify ക്ലിക്ക് ചെയ്തോ സ്റ്റോക്ക് ഒത്തുനോക്കാം. ശേഷം "Save Verification to Admin" ക്ലിക്ക് ചെയ്താൽ അന്നത്തെ തീയതിയിൽ അത് Admin Section-ൽ സേവ് ആകും.',
    icon: CheckCircle2
  },
  {
    step: 6,
    timeSec: 26,
    title: '6. Admin Section (5 Organized Tabs)',
    malayalam: 'Admin ലോഗിൻ ചെയ്യുമ്പോൾ മാത്രം കാണുന്ന Admin Section-ൽ 5 ടാബുകൾ ഉണ്ട്: 1) Inventory & Excel Upload, 2) Held Items & Transfers, 3) Stock Verifications, 4) User Management, 5) Alerts & Logs.',
    icon: Layers
  },
  {
    step: 7,
    timeSec: 28,
    title: '7. Ask RUBY AI Copilot',
    malayalam: 'മുകളിലുള്ള "Ask RUBY" ബട്ടൺ ക്ലിക്ക് ചെയ്ത് മലയാളത്തിലോ ഇംഗ്ലീഷിലോ ടൈപ്പ് ചെയ്തും വോയിസ് വഴിയും സ്റ്റോക്ക് വിവരങ്ങൾ ചോദിച്ചറിയാം.',
    icon: Sparkles
  }
];

export function VideoGuideModal({ isOpen, onClose }: VideoGuideModalProps) {
  const [activeStep, setActiveStep] = useState<number>(1);
  const videoRef = useRef<HTMLVideoElement>(null);

  if (!isOpen) return null;

  const jumpToTime = (stepNum: number, seconds: number) => {
    setActiveStep(stepNum);
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
      videoRef.current.play().catch(() => {});
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[92vh] border border-slate-200 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-[#0f172a] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#fed65b] text-[#0f172a] flex items-center justify-center">
              <PlayCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white font-headline">
                How to Use Shine Inventory Tracker (Video Tutorial)
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                വെബ്സൈറ്റ് ഉപയോഗിക്കേണ്ട വിധം • Step-by-Step Video & Malayalam Guide
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <a
              href="/tutorial/SHINE_INVENTORY_TUTORIAL_GUIDE.webm"
              download="SHINE_INVENTORY_TUTORIAL_GUIDE.webm"
              className="px-3.5 py-1.5 rounded-lg bg-[#fed65b] hover:bg-[#e6be44] text-[#0f172a] text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download Video</span>
            </a>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body: Video Player + Interactive Chapters */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-[#f7f9fb]">
          {/* Left: Video Player (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-3">
            <div className="rounded-xl overflow-hidden bg-slate-950 border-2 border-slate-800 shadow-lg aspect-video relative">
              <video
                ref={videoRef}
                src="/tutorial/SHINE_INVENTORY_TUTORIAL_GUIDE.webm"
                controls
                autoPlay
                className="w-full h-full object-contain"
              >
                Your browser does not support HTML5 video.
              </video>
            </div>

            {/* Active Step Malayalam Explanation Box */}
            {(() => {
              const current = TUTORIAL_STEPS.find(s => s.step === activeStep) || TUTORIAL_STEPS[0];
              return (
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded bg-[#0f172a] text-[#fed65b] text-[10px] font-mono font-bold uppercase">
                      Step {current.step} of {TUTORIAL_STEPS.length}
                    </span>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 font-headline">
                      {current.title}
                    </h4>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed mt-1">
                    {current.malayalam}
                  </p>
                </div>
              );
            })()}
          </div>

          {/* Right: Step-by-Step Interactive Chapters (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-2.5">
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 px-1">
              Click any topic to jump in video (7 Steps):
            </div>

            <div className="space-y-2 overflow-y-auto max-h-[420px] pr-1 custom-scrollbar">
              {TUTORIAL_STEPS.map(item => {
                const Icon = item.icon;
                const isSelected = activeStep === item.step;
                return (
                  <button
                    key={item.step}
                    type="button"
                    onClick={() => jumpToTime(item.step, item.timeSec)}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-[#0f172a] text-white border-[#0f172a] shadow-md'
                        : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        isSelected ? 'bg-[#fed65b] text-[#0f172a]' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs font-bold ${isSelected ? 'text-[#fed65b]' : 'text-slate-900'}`}>
                        {item.title}
                      </p>
                      <p
                        className={`text-[11px] mt-1 leading-snug line-clamp-2 ${
                          isSelected ? 'text-slate-200' : 'text-slate-600'
                        }`}
                      >
                        {item.malayalam}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
