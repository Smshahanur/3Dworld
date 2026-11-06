import React from 'react';
import { X, ArrowLeft, Instagram, Sparkles } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'creator' | 'project';
}

export const AboutModal: React.FC<AboutModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/70 pointer-events-auto backdrop-blur-sm transition-opacity"
        aria-hidden="true"
      />

      {/* Modal Dialog Container */}
      <section
        id="about-creator"
        role="dialog"
        aria-labelledby="creator-title"
        aria-modal="true"
        className="relative pointer-events-auto w-full max-w-lg overflow-hidden rounded-3xl bg-gradient-to-b from-[#f0fdf9] via-[#ecfdf5] to-[#f4fdf8] border border-[#2dd4bf]/40 shadow-2xl shadow-teal-950/20 p-6 sm:p-8 text-center animate-in zoom-in-95 duration-200"
      >
        {/* Soft Ambient Mint Glow in Background */}
        <div
          aria-hidden="true"
          className="absolute -top-12 left-1/2 -translate-x-1/2 w-56 h-56 bg-teal-300/25 rounded-full blur-3xl pointer-events-none"
        />

        {/* Top Close Button */}
        <button
          onClick={onClose}
          aria-label="Close Creator Dialog"
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-teal-100/60 transition-colors cursor-pointer z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 1. Circular Creator Portrait with Turquoise Gradient Border */}
        <div className="relative mx-auto mb-4 w-28 h-28 sm:w-32 sm:h-32 rounded-full p-[3px] bg-gradient-to-tr from-[#14b8a6] via-[#2dd4bf] to-[#10b981] shadow-lg shadow-teal-600/20">
          <div className="w-full h-full rounded-full overflow-hidden bg-slate-900 ring-2 ring-white">
            <img
              src="/assets/aistudio/20261104_090030_5aeb97d7.jpg"
              alt="Shahanur Mollah - Creator & Developer of 3DWorld"
              className="w-full h-full object-cover object-[center_20%] select-none transition-transform duration-500 hover:scale-105"
              loading="eager"
            />
          </div>
          {/* Verified Creator Badge */}
          <div
            title="Verified Creator"
            className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-gradient-to-tr from-teal-500 to-emerald-400 p-[1.5px] shadow-md flex items-center justify-center ring-2 ring-white"
          >
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
        </div>

        {/* 2. Heading: "ABOUT THE CREATOR" */}
        <div className="text-xs font-mono uppercase tracking-[0.24em] text-[#0d9488] font-bold mb-1">
          ABOUT THE CREATOR
        </div>

        {/* 3. Name: "Shahanur Mollah" */}
        <h2
          id="creator-title"
          className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight"
        >
          Shahanur Mollah
        </h2>

        {/* 4. Position: "Creator & Developer of 3DWorld" */}
        <div className="text-sm sm:text-base font-semibold text-[#0f766e] tracking-wide mt-1">
          Creator & Developer of 3DWorld
        </div>

        {/* 5. Authoritative Description */}
        <p className="mt-4 text-sm sm:text-[15px] text-slate-700 leading-relaxed font-normal max-w-md mx-auto">
          &ldquo;3DWorld is created to bring an interactive virtual universe to life, where people can explore, build and experience a connected digital world.&rdquo;
        </p>

        {/* 6. Action Buttons: Instagram Handle & Return to Universe */}
        <div className="mt-6 pt-5 border-t border-teal-200/60 flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href="https://www.instagram.com/shahanurmollah__?mdxt=MTl6cTdzMmwyYWx3dA=="
            target="_blank"
            rel="noopener noreferrer"
            title="Follow Shahanur Mollah on Instagram (@shahanurmollah__)"
            aria-label="Instagram handle @shahanurmollah__"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-pink-50/60 text-slate-900 hover:text-pink-700 border border-teal-300 hover:border-pink-300 font-semibold text-xs sm:text-sm shadow-sm transition-all cursor-pointer min-h-[44px]"
          >
            <Instagram className="w-4 h-4 text-pink-600" />
            <span>@shahanurmollah__</span>
          </a>

          <button
            onClick={onClose}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs sm:text-sm tracking-wide shadow-md shadow-teal-600/20 transition-all cursor-pointer min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Universe</span>
          </button>
        </div>
      </section>
    </div>
  );
};
