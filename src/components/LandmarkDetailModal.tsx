import React from 'react';
import { X, MapPin, Compass, ArrowRight, Sparkles, Layers, ShieldCheck } from 'lucide-react';
import { LOCATIONS, LocationData } from '../types';

interface LandmarkDetailModalProps {
  landmark: LocationData | null;
  onClose: () => void;
  onSelectNext: (nextLoc: LocationData) => void;
  onFocusCamera: (landmark: LocationData) => void;
  onOpenCreator?: () => void;
}

export const LandmarkDetailModal: React.FC<LandmarkDetailModalProps> = ({
  landmark,
  onClose,
  onSelectNext,
  onFocusCamera,
  onOpenCreator,
}) => {
  if (!landmark) return null;

  const currentIndex = LOCATIONS.findIndex((l) => l.id === landmark.id);
  const nextLocation = LOCATIONS[(currentIndex + 1) % LOCATIONS.length];

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/50 pointer-events-auto backdrop-blur-[2px] transition-opacity"
      />

      {/* Modal Dialog */}
      <div className="relative pointer-events-auto w-full max-w-xl bg-[#090e1a]/95 border border-white/15 rounded-2xl shadow-2xl p-6 sm:p-7 overflow-hidden text-left">
        {/* Accent Glow Top Border */}
        <div
          className="absolute top-0 left-0 right-0 h-1"
          style={{ backgroundColor: landmark.ambientColor }}
        />

        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-cyan-300 mb-2">
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: landmark.ambientColor }}
              />
              <span>{landmark.tag}</span>
            </div>
            <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-white">
              {landmark.name}
            </h2>
            <div className="text-xs font-mono text-cyan-400 mt-0.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              <span>{landmark.subtitle}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close Landmark Details"
            className="p-2 rounded-xl glass-panel hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lore / Description */}
        <p className="text-sm text-slate-300 leading-relaxed mb-5">
          {landmark.lore}
        </p>

        {/* Key Biome & Altitude Metrics */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="p-3 rounded-xl glass-panel border border-white/10">
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 mb-1">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Biome Type</span>
            </div>
            <div className="text-xs sm:text-sm font-semibold text-slate-100">
              {landmark.biomeType}
            </div>
          </div>

          <div className="p-3 rounded-xl glass-panel border border-white/10">
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 mb-1">
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              <span>Coordinates</span>
            </div>
            <div className="text-xs sm:text-sm font-semibold text-slate-100">
              {landmark.altitude}
            </div>
          </div>
        </div>

        {/* Features Checklist */}
        <div className="mb-6">
          <div className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Notable Architectural Features</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {landmark.features.map((feat, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.03] border border-white/5 text-xs text-slate-300"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">{feat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-white/10">
          {landmark.id === 'creator-pavilion' && onOpenCreator && (
            <button
              onClick={() => {
                onClose();
                onOpenCreator();
              }}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold text-xs tracking-wide shadow-md shadow-teal-500/25 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>View Creator Profile</span>
            </button>
          )}

          <button
            onClick={() => onFocusCamera(landmark)}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs tracking-wide shadow-md shadow-cyan-600/30 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Compass className="w-4 h-4" />
            <span>Re-Focus Camera Angle</span>
          </button>

          <button
            onClick={() => onSelectNext(nextLocation)}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl glass-panel border border-white/10 hover:border-cyan-400/40 text-slate-300 hover:text-white font-medium text-xs transition-all cursor-pointer flex items-center justify-center gap-2 group"
          >
            <span>Next: {nextLocation.name}</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};
