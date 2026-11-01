import React from 'react';
import { X, Navigation, Sparkles, MapPin, ChevronRight } from 'lucide-react';
import { LOCATIONS, LocationData } from '../types';

interface LocationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeLocationId: string | null;
  onSelectLocation: (location: LocationData) => void;
}

export const LocationDrawer: React.FC<LocationDrawerProps> = ({
  isOpen,
  onClose,
  activeLocationId,
  onSelectLocation,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex justify-end">
      {/* Backdrop (clickable to dismiss) */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/40 pointer-events-auto transition-opacity"
      />

      {/* Slide-out Panel */}
      <div className="relative pointer-events-auto w-full max-w-md h-full bg-[#090e1a]/95 border-l border-white/10 shadow-2xl flex flex-col p-6 overflow-y-auto">
        {/* Drawer Header */}
        <div className="flex items-center justify-between pb-5 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-lg text-white">Discover Locations</span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                5 Landmarks
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Select any point of interest to travel your camera directly there.
            </p>
          </div>

          <button
            onClick={onClose}
            aria-label="Close Locations Drawer"
            className="p-2 rounded-lg glass-panel hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Location Cards List */}
        <div className="flex-1 py-4 space-y-3.5">
          {LOCATIONS.map((loc) => {
            const isActive = activeLocationId === loc.id;
            return (
              <div
                key={loc.id}
                onClick={() => {
                  onSelectLocation(loc);
                  onClose();
                }}
                className={`group relative p-4 rounded-xl border transition-all cursor-pointer ${
                  isActive
                    ? 'bg-cyan-950/40 border-cyan-400 shadow-lg shadow-cyan-500/10'
                    : 'glass-panel border-white/10 hover:border-cyan-500/40 hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: loc.ambientColor }}
                    />
                    <h3 className="font-display font-semibold text-sm text-white group-hover:text-cyan-300 transition-colors">
                      {loc.name}
                    </h3>
                  </div>

                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-slate-300">
                    {loc.tag}
                  </span>
                </div>

                <div className="text-xs font-mono text-cyan-400 mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-3 h-3 shrink-0" />
                  <span>{loc.subtitle}</span>
                </div>

                <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed mb-3">
                  {loc.description}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <span className="text-[10px] font-mono text-slate-400">
                    {loc.altitude}
                  </span>

                  <div className="flex items-center gap-1 text-xs font-semibold text-cyan-400 group-hover:text-cyan-300 group-hover:translate-x-0.5 transition-all">
                    <span>Travel Here</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer tip */}
        <div className="pt-3 border-t border-white/10 text-[11px] text-slate-400 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>You can also click on the glowing 3D beacon diamonds directly in the world.</span>
        </div>
      </div>
    </div>
  );
};
