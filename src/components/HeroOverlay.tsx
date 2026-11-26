import React from 'react';
import { ArrowRight, Compass } from 'lucide-react';

interface HeroOverlayProps {
  onExploreWorld: () => void;
  onDiscoverLocations: () => void;
  isDismissed: boolean;
}

export const HeroOverlay: React.FC<HeroOverlayProps> = ({
  onExploreWorld,
  onDiscoverLocations,
  isDismissed,
}) => {
  if (isDismissed) {
    return null;
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-20 flex items-center px-4 sm:px-10 lg:px-16 pt-16 pb-12">
      <section
        aria-labelledby="hero-title"
        className="pointer-events-auto w-full max-w-lg max-h-[calc(100vh-7.5rem)] overflow-y-auto rounded-2xl bg-[#071022]/82 backdrop-blur-md border border-white/10 p-6 sm:p-8 shadow-xl"
      >
        <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300 mb-3">
          EXPLORE YOUR VIRTUAL UNIVERSE
        </p>

        <h1
          id="hero-title"
          className="font-display font-bold text-2xl sm:text-4xl text-white tracking-tight leading-[1.16] text-balance mb-3.5"
        >
          3DWorld — Interactive Virtual Universe
        </h1>

        <p className="text-slate-300 text-sm sm:text-[15px] leading-relaxed mb-6 max-w-md">
          Explore realistic villages, modern cities, discover new places and create your own experiences.
        </p>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button
            type="button"
            onClick={onExploreWorld}
            className="group inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs sm:text-sm tracking-wide transition-colors cursor-pointer min-h-[44px] whitespace-nowrap"
          >
            <span>EXPLORE WORLD</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>

          <button
            type="button"
            onClick={onDiscoverLocations}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/15 hover:border-amber-300/40 text-slate-100 font-semibold text-xs sm:text-sm tracking-wide transition-colors cursor-pointer min-h-[44px] whitespace-nowrap"
          >
            <Compass className="w-4 h-4 text-amber-300" />
            <span>DISCOVER LOCATIONS</span>
          </button>
        </div>
      </section>
    </div>
  );
};
