import React from 'react';
import {
  X,
  Sun,
  Moon,
  Sunrise,
  Sunset,
  CloudRain,
  Snowflake,
  CloudFog,
  Volume2,
  VolumeX,
  Map,
  Compass,
  Eye,
  Sparkles,
  Home,
  Zap,
} from 'lucide-react';
import { GraphicsQuality, LightingMode, WeatherMode } from '../types';

interface WorldSettingsMenuProps {
  isOpen: boolean;
  onClose: () => void;
  lightingMode: LightingMode;
  onSelectLighting: (mode: LightingMode) => void;
  weatherMode: WeatherMode;
  onSelectWeather: (mode: WeatherMode) => void;
  formattedTime: string;
  soundEnabled: boolean;
  onToggleSound: () => void;
  graphicsQuality: GraphicsQuality;
  onSelectGraphicsQuality: (quality: GraphicsQuality) => void;
  ecoMode: boolean;
  onToggleEcoMode: () => void;
  isInWorld: boolean;
  isMinimapOpen: boolean;
  onToggleMinimap: () => void;
  onOpenDiscover: () => void;
  onOpenCreator: () => void;
  onToggleCinema: () => void;
  onReturnHome: () => void;
}

export const WorldSettingsMenu: React.FC<WorldSettingsMenuProps> = ({
  isOpen,
  onClose,
  lightingMode,
  onSelectLighting,
  weatherMode,
  onSelectWeather,
  formattedTime,
  soundEnabled,
  onToggleSound,
  graphicsQuality,
  onSelectGraphicsQuality,
  ecoMode,
  onToggleEcoMode,
  isInWorld,
  isMinimapOpen,
  onToggleMinimap,
  onOpenDiscover,
  onOpenCreator,
  onToggleCinema,
  onReturnHome,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-auto">
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
      />

      {/* Responsive Settings Panel */}
      <section
        role="dialog"
        aria-modal="true"
        aria-label="3DWorld Settings"
        className="fixed top-16 right-3 sm:right-6 left-3 sm:left-auto sm:w-84 max-h-[calc(100vh-5.5rem)] overflow-y-auto rounded-2xl bg-[#071022]/96 border border-white/10 shadow-2xl p-4 sm:p-5 text-slate-100 animate-in fade-in slide-in-from-top-2 duration-150"
      >
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div>
            <h2 className="font-display font-bold text-sm text-white tracking-wide">
              World Settings
            </h2>
            <p className="text-[11px] text-slate-400 tabular-nums">
              Local Time · {formattedTime}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Settings"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-4 space-y-4 text-xs">
          {/* Atmosphere Presets */}
          <div>
            <div className="text-[11px] font-medium text-slate-400 mb-2">
              Atmosphere
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {(
                [
                  { id: 'dawn', label: 'Dawn', icon: Sunrise },
                  { id: 'day', label: 'Day', icon: Sun },
                  { id: 'twilight', label: 'Dusk', icon: Sunset },
                  { id: 'cyber-night', label: 'Night', icon: Moon },
                ] as const
              ).map(({ id, label, icon: Icon }) => {
                const active = lightingMode === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => onSelectLighting(id)}
                    className={`flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl border transition-colors cursor-pointer ${
                      active
                        ? 'bg-cyan-500/15 border-cyan-400/50 text-cyan-200 font-semibold'
                        : 'bg-white/[0.03] border-white/10 text-slate-300 hover:bg-white/[0.07]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="text-[11px]">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Weather Presets */}
          <div>
            <div className="text-[11px] font-medium text-slate-400 mb-2">
              Weather
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {(
                [
                  { id: 'clear', label: 'Clear', icon: Sun },
                  { id: 'rain', label: 'Rain', icon: CloudRain },
                  { id: 'snow', label: 'Snow', icon: Snowflake },
                  { id: 'fog', label: 'Fog', icon: CloudFog },
                ] as const
              ).map(({ id, label, icon: Icon }) => {
                const active = weatherMode === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => onSelectWeather(id)}
                    className={`flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl border transition-colors cursor-pointer ${
                      active
                        ? 'bg-cyan-500/15 border-cyan-400/50 text-cyan-200 font-semibold'
                        : 'bg-white/[0.03] border-white/10 text-slate-300 hover:bg-white/[0.07]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="text-[11px]">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Graphics Quality */}
          <div>
            <div className="text-[11px] font-medium text-slate-400 mb-2">
              Graphics Quality
            </div>
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-white/[0.03] border border-white/10">
              {(['low', 'medium', 'high'] as GraphicsQuality[]).map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => onSelectGraphicsQuality(q)}
                  className={`py-1.5 rounded-lg text-[11px] capitalize font-medium transition-colors cursor-pointer ${
                    graphicsQuality === q
                      ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-1.5 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={onToggleSound}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2.5 text-slate-200 font-medium">
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-cyan-400" />
                ) : (
                  <VolumeX className="w-4 h-4 text-slate-400" />
                )}
                <span>Ambient Sound</span>
              </span>
              <span className={`text-[11px] font-medium ${soundEnabled ? 'text-cyan-300' : 'text-slate-400'}`}>
                {soundEnabled ? 'On' : 'Off'}
              </span>
            </button>

            <button
              type="button"
              onClick={onToggleEcoMode}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2.5 text-slate-200 font-medium">
                <Zap className={`w-4 h-4 ${ecoMode ? 'text-amber-300' : 'text-slate-400'}`} />
                <span>Battery Saver Mode</span>
              </span>
              <span className={`text-[11px] font-medium ${ecoMode ? 'text-amber-300' : 'text-slate-400'}`}>
                {ecoMode ? 'On' : 'Off'}
              </span>
            </button>

            {isInWorld && (
              <button
                type="button"
                onClick={onToggleMinimap}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2.5 text-slate-200 font-medium">
                  <Map className={`w-4 h-4 ${isMinimapOpen ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>World Minimap</span>
                </span>
                <span className={`text-[11px] font-medium ${isMinimapOpen ? 'text-cyan-300' : 'text-slate-400'}`}>
                  {isMinimapOpen ? 'Shown' : 'Hidden'}
                </span>
              </button>
            )}
          </div>

          {/* Quick Navigation */}
          <div className="space-y-1.5 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenDiscover();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 text-slate-200 font-medium transition-colors cursor-pointer"
            >
              <Compass className="w-4 h-4 text-cyan-400" />
              <span>Discover Locations</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenCreator();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 text-slate-200 font-medium transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Creator Pavilion · Shahanur Mollah</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onToggleCinema();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 text-slate-200 font-medium transition-colors cursor-pointer"
            >
              <Eye className="w-4 h-4 text-slate-300" />
              <span>Hide Interface (Cinema Mode)</span>
            </button>

            {isInWorld && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onReturnHome();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-400/30 text-cyan-200 font-medium transition-colors cursor-pointer"
              >
                <Home className="w-4 h-4 text-cyan-300" />
                <span>Return to Homepage</span>
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
