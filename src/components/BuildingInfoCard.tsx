import React from 'react';
import { X, Building2, MapPin, Eye, RotateCcw } from 'lucide-react';
import { BuildingInfo } from '../types';

interface BuildingInfoCardProps {
  building: BuildingInfo | null;
  onClose: () => void;
  onFocusStreetLevel: (building: BuildingInfo) => void;
  onReturnToOverview: () => void;
  onOpenCreator?: () => void;
}

export const BuildingInfoCard: React.FC<BuildingInfoCardProps> = ({
  building,
  onClose,
  onFocusStreetLevel,
  onReturnToOverview,
  onOpenCreator,
}) => {
  if (!building) return null;

  return (
    <div className="fixed bottom-24 sm:bottom-28 right-4 sm:right-6 z-40 w-[calc(100vw-2rem)] sm:w-96 pointer-events-auto transition-all animate-in fade-in slide-in-from-bottom-4 duration-200">
      <div className="bg-[#090e1a]/95 border border-cyan-500/30 rounded-2xl p-4 sm:p-5 shadow-2xl backdrop-blur-md text-left relative overflow-hidden">
        {/* Top cyan accent bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-500" />

        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cyan-950/70 border border-cyan-500/30 text-[10px] font-mono text-cyan-300 mb-1.5">
              <Building2 className="w-3 h-3 text-cyan-400" />
              <span>{building.type}</span>
            </div>
            <h3 className="font-display font-bold text-lg sm:text-xl text-white leading-snug">
              {building.name}
            </h3>
            <div className="text-xs font-mono text-slate-400 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
              <span>{building.district}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close Building Information"
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Description */}
        <p className="text-xs sm:text-[13px] text-slate-300 leading-relaxed mb-3">
          {building.description}
        </p>

        {/* Available Facilities & Features */}
        {building.features && building.features.length > 0 && (
          <div className="mb-3.5 pt-2 border-t border-white/5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 block mb-1.5">
              Available Facilities & Features:
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {building.features.map((feat, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/[0.04] border border-white/5 text-[11px] text-slate-200"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                  <span className="truncate">{feat}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2.5 border-t border-white/10">
          {building.id === 'creator-pavilion' && onOpenCreator && (
            <button
              onClick={onOpenCreator}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold text-xs tracking-wide shadow-md shadow-teal-500/25 transition-all cursor-pointer"
            >
              <span>Meet Creator</span>
            </button>
          )}

          <button
            onClick={() => onFocusStreetLevel(building)}
            className={`${building.id === 'creator-pavilion' ? 'px-3 py-2 rounded-xl bg-white/10 text-white hover:bg-white/15' : 'flex-1 bg-cyan-600 hover:bg-cyan-500 text-white'} flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl font-semibold text-xs tracking-wide shadow-md transition-all cursor-pointer`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Street View</span>
          </button>

          <button
            onClick={onReturnToOverview}
            className="flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white font-medium text-xs transition-colors cursor-pointer"
            title="Return to Aerial Overview"
          >
            <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Overview</span>
          </button>
        </div>
      </div>
    </div>
  );
};
