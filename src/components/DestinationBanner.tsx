import React from 'react';
import { RotateCcw, MapPin, ArrowRight, X, Compass } from 'lucide-react';
import { LocationData, LOCATIONS } from '../types';

interface DestinationBannerProps {
  location: LocationData | null;
  onReturnToOverview: () => void;
  onSelectNext: (nextLoc: LocationData) => void;
  onClose: () => void;
  onOpenCreator?: () => void;
}

export const DestinationBanner: React.FC<DestinationBannerProps> = ({
  location,
  onReturnToOverview,
  onSelectNext,
  onClose,
  onOpenCreator,
}) => {
  if (!location) return null;

  const currentIndex = LOCATIONS.findIndex((l) => l.id === location.id);
  const nextLocation = LOCATIONS[(currentIndex + 1) % LOCATIONS.length];

  return (
    <div className="fixed top-16 sm:top-20 left-1/2 -translate-x-1/2 z-30 w-full max-w-xl px-3 pointer-events-auto animate-in fade-in slide-in-from-top-3 duration-200">
      <div className="bg-[#070b16]/92 border border-white/12 rounded-2xl p-3 sm:p-4 shadow-2xl backdrop-blur-md text-left relative overflow-hidden">
        {/* Ambient Top Glow */}
        <div
          className="absolute top-0 left-0 right-0 h-1"
          style={{ backgroundColor: location.ambientColor }}
        />

        <div className="flex items-start justify-between gap-3 mb-1.5">
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: location.ambientColor }}
            />
            <h2 className="font-display font-extrabold text-base sm:text-lg text-white">
              {location.name}
            </h2>
            <span className="text-slate-400 text-xs hidden sm:inline">•</span>
            <span className="text-xs font-mono text-cyan-300 hidden sm:inline">
              {location.subtitle}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {location.id === 'creator-pavilion' && onOpenCreator && (
              <button
                onClick={onOpenCreator}
                className="flex items-center gap-1 px-3 py-1 rounded-lg bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 text-slate-950 font-bold text-xs tracking-wide shadow-sm transition-all cursor-pointer"
              >
                <span>Creator Profile</span>
              </button>
            )}

            <button
              onClick={onReturnToOverview}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 active:bg-cyan-500/20 border border-white/10 text-cyan-300 hover:text-white text-xs font-mono transition-colors cursor-pointer"
              title="Return to Full Village Overview"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Overview</span>
            </button>

            <button
              onClick={onClose}
              aria-label="Dismiss Destination Banner"
              className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed line-clamp-2 mb-2 sm:mb-2.5">
          {location.description}
        </p>

        {/* Quick features & Next destination */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-white/10 text-[11px] font-mono text-slate-400">
          <div className="flex items-center gap-1.5">
            <Compass className="w-3 h-3 text-cyan-400" />
            <span className="text-slate-300 truncate max-w-[200px] sm:max-w-none">
              {location.features[0]}
            </span>
          </div>

          <button
            onClick={() => onSelectNext(nextLocation)}
            className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer group ml-auto"
          >
            <span>Next: {nextLocation.name}</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};
