import React from 'react';
import { ArrowRight, Compass, MousePointerClick, Move3d } from 'lucide-react';
import { LOCATIONS, LocationData } from '../types';

interface HeroOverlayProps {
  onExploreWorld: () => void;
  onDiscoverLocations: () => void;
  onSelectLocation: (loc: LocationData) => void;
  isDismissed: boolean;
  onDismiss: () => void;
}

export const HeroOverlay: React.FC<HeroOverlayProps> = ({
  onExploreWorld,
  onDiscoverLocations,
  onSelectLocation,
  isDismissed,
  onDismiss,
}) => {
  if (isDismissed) {
    return null;
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-20 flex flex-col justify-between p-3 sm:p-6 pt-16 sm:pt-20 pb-20 sm:pb-24">
      {/* Hero Card Container with Dark Translucent Gradient Backdrop for Readability */}
      <div className="pointer-events-auto max-w-lg sm:max-w-xl bg-gradient-to-br from-[#060913]/92 via-[#09101f]/85 to-transparent p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-white/10 shadow-2xl backdrop-blur-[2px]">
        {/* Category Badge */}
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-[10px] sm:text-xs font-mono uppercase tracking-widest mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          <span>Interactive 3D Universe</span>
        </div>

        {/* Main Headline */}
        <h1 className="font-display font-extrabold text-2xl sm:text-4xl lg:text-5xl text-white tracking-tight leading-[1.1] mb-2.5 sm:mb-3 drop-shadow-md">
          YOUR WORLD.{' '}
          <span className="bg-gradient-to-r from-cyan-300 via-sky-200 to-indigo-300 bg-clip-text text-transparent">
            BEYOND REALITY.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-slate-300 text-xs sm:text-sm lg:text-base leading-relaxed max-w-md mb-4 sm:mb-5">
          Step into a living 3D universe. Explore extraordinary places and discover new dimensions suspended in an endless sky.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 mb-3.5 sm:mb-4">
          <button
            onClick={() => {
              onExploreWorld();
              onDismiss();
            }}
            className="group flex items-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-semibold text-xs sm:text-sm tracking-wide shadow-lg shadow-cyan-500/25 hover:shadow-cyan-400/40 transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0 shrink-0"
          >
            <span>EXPLORE WORLD</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={onDiscoverLocations}
            className="flex items-center gap-1.5 px-4 py-2.5 sm:px-5 sm:py-3 rounded-full glass-panel border border-white/15 hover:border-cyan-400/50 text-slate-200 hover:text-white font-medium text-xs sm:text-sm transition-all cursor-pointer shrink-0"
          >
            <Compass className="w-4 h-4 text-cyan-400" />
            <span>DISCOVER LOCATIONS</span>
          </button>
        </div>

        {/* Quick Location Pills */}
        <div className="pt-2.5 border-t border-white/10 flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mr-1">
            Jump to:
          </span>
          {LOCATIONS.slice(0, 4).map((loc) => (
            <button
              key={loc.id}
              onClick={() => {
                onSelectLocation(loc);
                onDismiss();
              }}
              className="px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/15 border border-white/10 hover:border-cyan-400/40 text-[11px] font-mono text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer"
            >
              {loc.name}
            </button>
          ))}
        </div>
      </div>

      {/* Camera Guidance & Dismiss Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-3 pointer-events-auto">
        <div className="px-3 py-2 rounded-xl bg-[#090e1a]/85 border border-white/10 text-xs text-slate-300 max-w-xs flex items-center gap-2.5 shadow-lg">
          <div className="p-1.5 rounded-lg bg-cyan-950/60 text-cyan-400 border border-cyan-500/20 shrink-0">
            <Move3d className="w-3.5 h-3.5" />
          </div>
          <div className="text-[11px] leading-tight">
            <span className="font-semibold text-white">3D Navigation: </span>
            <span className="text-slate-400">Drag to orbit • Scroll to zoom</span>
          </div>
        </div>

        <button
          onClick={onDismiss}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#090e1a]/80 hover:bg-[#0f172a] border border-white/10 hover:border-white/25 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer shadow-lg"
        >
          <MousePointerClick className="w-3.5 h-3.5" />
          <span>Dismiss Overlay</span>
        </button>
      </div>
    </div>
  );
};
