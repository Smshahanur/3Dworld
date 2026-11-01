import React, { useState } from 'react';
import {
  RotateCcw,
  Orbit,
  Sun,
  Moon,
  Sunrise,
  Sunset,
  ChevronDown,
  ChevronUp,
  MapPin,
  Volume2,
  VolumeX,
  Compass,
} from 'lucide-react';
import { LightingMode, LOCATIONS, LocationData } from '../types';

interface BottomControlDockProps {
  onResetView: () => void;
  autoRotate: boolean;
  onToggleAutoRotate: () => void;
  lightingMode: LightingMode;
  onSelectLighting: (mode: LightingMode) => void;
  activeLocationId: string | null;
  onSelectLocation: (loc: LocationData) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenDiscover: () => void;
}

export const BottomControlDock: React.FC<BottomControlDockProps> = ({
  onResetView,
  autoRotate,
  onToggleAutoRotate,
  lightingMode,
  onSelectLighting,
  activeLocationId,
  onSelectLocation,
  soundEnabled,
  onToggleSound,
  onOpenDiscover,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const activeLoc = LOCATIONS.find((l) => l.id === activeLocationId);

  return (
    <div className="fixed bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 z-30 w-full max-w-[94vw] sm:max-w-3xl pointer-events-none transition-transform duration-300">
      {/* Collapse Toggle Tab */}
      <div className="flex justify-center mb-1 pointer-events-auto">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center gap-1.5 px-3 py-1 rounded-t-lg bg-[#090e1a]/90 hover:bg-[#0f172a] border-t border-x border-white/10 text-[11px] font-mono text-slate-400 hover:text-cyan-300 transition-colors shadow-lg cursor-pointer"
          aria-label={isCollapsed ? 'Show Controls Dock' : 'Hide Controls Dock'}
        >
          {isCollapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5 text-cyan-400" />
              <span>Show 3DWorld Dock</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" />
              <span>Hide Dock (Cinema Mode)</span>
            </>
          )}
        </button>
      </div>

      {/* Main Dock Container */}
      {!isCollapsed && (
        <div className="pointer-events-auto bg-[#070b16]/92 border border-white/12 rounded-2xl p-2 sm:p-3.5 shadow-2xl backdrop-blur-md transition-all">
          {/* Main Controls Row */}
          <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2">
            {/* Primary Action Buttons */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              {/* Reset View */}
              <button
                onClick={onResetView}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 active:bg-cyan-500/20 border border-white/10 hover:border-cyan-400/40 text-slate-200 text-xs transition-all cursor-pointer min-h-[34px]"
                title="Reset Camera to Home Overview"
              >
                <RotateCcw className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="font-medium text-[11px] sm:text-xs">Reset</span>
              </button>

              {/* Auto Orbit */}
              <button
                onClick={onToggleAutoRotate}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs transition-all cursor-pointer min-h-[34px] ${
                  autoRotate
                    ? 'bg-cyan-950/70 border-cyan-400 text-cyan-300 shadow-sm shadow-cyan-500/20'
                    : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300'
                }`}
                title="Toggle Automatic Orbit Rotation"
              >
                <Orbit className={`w-3.5 h-3.5 shrink-0 ${autoRotate ? 'animate-spin' : ''}`} />
                <span className="font-medium text-[11px] sm:text-xs">Orbit</span>
              </button>

              {/* Soundscape */}
              <button
                onClick={onToggleSound}
                className={`p-2 rounded-xl border transition-all cursor-pointer min-h-[34px] min-w-[34px] flex items-center justify-center ${
                  soundEnabled
                    ? 'bg-cyan-950/70 border-cyan-400 text-cyan-300 shadow-sm shadow-cyan-500/20'
                    : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-400 hover:text-slate-200'
                }`}
                title="Toggle Web Audio Soundscape"
                aria-label="Toggle Sound"
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>

              {/* Mobile Locations Opener */}
              <button
                onClick={onOpenDiscover}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-cyan-600/30 hover:bg-cyan-600/50 active:bg-cyan-600/70 border border-cyan-500/40 text-cyan-200 text-xs transition-all cursor-pointer md:hidden min-h-[34px]"
              >
                <Compass className="w-3.5 h-3.5 shrink-0" />
                <span className="text-[11px] font-medium">Locations</span>
              </button>
            </div>

            {/* Center: Desktop Quick Landmark Jumper Chips */}
            <div className="hidden md:flex items-center gap-1.5 overflow-x-auto py-0.5 max-w-sm">
              {LOCATIONS.map((loc) => {
                const isSelected = activeLocationId === loc.id;
                return (
                  <button
                    key={loc.id}
                    onClick={() => onSelectLocation(loc)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all cursor-pointer whitespace-nowrap ${
                      isSelected
                        ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-400/60 shadow-sm'
                        : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 hover:border-white/15'
                    }`}
                  >
                    {loc.name}
                  </button>
                );
              })}
            </div>

            {/* Right: Lighting Atmosphere Selector */}
            <div className="flex items-center gap-1 bg-black/50 p-1 rounded-xl border border-white/10 shrink-0">
              <button
                onClick={() => onSelectLighting('dawn')}
                className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                  lightingMode === 'dawn'
                    ? 'bg-rose-500/30 text-rose-300 border border-rose-500/50'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Dawn Atmosphere"
                aria-label="Dawn Atmosphere"
              >
                <Sunrise className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onSelectLighting('day')}
                className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                  lightingMode === 'day'
                    ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Day Atmosphere"
                aria-label="Day Atmosphere"
              >
                <Sun className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onSelectLighting('twilight')}
                className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                  lightingMode === 'twilight'
                    ? 'bg-orange-500/30 text-orange-300 border border-orange-500/50'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Twilight Atmosphere"
                aria-label="Twilight Atmosphere"
              >
                <Sunset className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onSelectLighting('cyber-night')}
                className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                  lightingMode === 'cyber-night'
                    ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/50'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Cyber Night Atmosphere"
                aria-label="Cyber Night Atmosphere"
              >
                <Moon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Sub-bar: Active Location & 3DWorld branding footer */}
          <div className="mt-2 pt-1.5 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-slate-400">
            <div className="flex items-center gap-1.5 truncate mr-2">
              <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
              <span className="truncate">
                {activeLoc ? `${activeLoc.name} (${activeLoc.altitude})` : 'World View • Panoramic Angle'}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-slate-500 hidden sm:inline">Brand:</span>
              <span className="text-cyan-400 font-bold tracking-wider">3DWorld</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
