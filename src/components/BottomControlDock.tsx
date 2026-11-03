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
  Footprints,
  Eye,
  Play,
  Pause,
  Zap,
  ZapOff,
  Search,
  Clock,
  Car,
  Users,
  Sliders,
  RefreshCw,
  Sparkles,
  Hammer,
} from 'lucide-react';
import { LightingMode, LOCATIONS, LocationData, ViewMode, GraphicsQuality, SimulationSpeed } from '../types';

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
  viewMode?: ViewMode;
  onToggleViewMode?: () => void;
  isBuildMode?: boolean;
  onToggleBuildMode?: () => void;
  simulationActive?: boolean;
  onToggleSimulation?: () => void;
  trafficActive?: boolean;
  onToggleTraffic?: () => void;
  pedestriansActive?: boolean;
  onTogglePedestrians?: () => void;
  envAnimationActive?: boolean;
  onToggleEnvAnimation?: () => void;
  simulationSpeed?: SimulationSpeed;
  onSelectSimulationSpeed?: (speed: SimulationSpeed) => void;
  graphicsQuality?: GraphicsQuality;
  onSelectGraphicsQuality?: (q: GraphicsQuality) => void;
  onResetSimulation?: () => void;
  ecoMode?: boolean;
  onToggleEcoMode?: () => void;
  timeOfDay?: number;
  formattedTime?: string;
  autoDayNight?: boolean;
  onToggleAutoDayNight?: () => void;
  onSetTimeOfDay?: (hour: number) => void;
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
  viewMode = 'aerial',
  onToggleViewMode,
  isBuildMode = false,
  onToggleBuildMode,
  simulationActive = true,
  onToggleSimulation,
  trafficActive = true,
  onToggleTraffic,
  pedestriansActive = true,
  onTogglePedestrians,
  envAnimationActive = true,
  onToggleEnvAnimation,
  simulationSpeed = 1,
  onSelectSimulationSpeed,
  graphicsQuality = 'medium',
  onSelectGraphicsQuality,
  onResetSimulation,
  ecoMode = false,
  onToggleEcoMode,
  timeOfDay = 12.0,
  formattedTime = '12:00 PM',
  autoDayNight = true,
  onToggleAutoDayNight,
  onSetTimeOfDay,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isSimPanelOpen, setIsSimPanelOpen] = useState(false);

  const activeLoc = LOCATIONS.find((l) => l.id === activeLocationId);

  // When Build Mode is active, BuildToolbar handles the entire construction interface
  if (isBuildMode) return null;

  return (
    <nav
      aria-label="3DWorld Environment and Simulation Controls"
      className="fixed bottom-8 sm:bottom-10 left-1/2 -translate-x-1/2 z-30 w-full max-w-[95vw] sm:max-w-4xl pointer-events-none transition-transform duration-300"
    >
      {/* Collapse Toggle Tab */}
      <div className="flex justify-center mb-1 pointer-events-auto">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center gap-1.5 px-3 py-1 rounded-t-lg bg-[#090e1a]/95 hover:bg-[#0f172a] border-t border-x border-white/10 text-[11px] font-mono text-slate-400 hover:text-cyan-300 transition-colors shadow-lg cursor-pointer"
          aria-label={isCollapsed ? 'Show Controls Dock' : 'Hide Controls Dock'}
        >
          {isCollapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5 text-cyan-400" />
              <span>Show 3DWorld Controls</span>
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
        <div className="pointer-events-auto bg-[#070b16]/95 border border-white/12 rounded-2xl p-2 sm:p-3 shadow-2xl backdrop-blur-md transition-all">
          {/* Main Controls Row */}
          <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-1.5 sm:gap-2">
            {/* Primary Action Buttons */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Reset Camera View */}
              <button
                onClick={onResetView}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 active:bg-cyan-500/20 border border-white/10 hover:border-cyan-400/40 text-slate-200 text-xs transition-all cursor-pointer min-h-[34px]"
                title="Reset Camera to Home Overview"
              >
                <RotateCcw className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="font-medium text-[11px] sm:text-xs">Reset</span>
              </button>

              {/* View Mode Toggle (Aerial vs Street Level) */}
              {onToggleViewMode && (
                <button
                  onClick={onToggleViewMode}
                  className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs transition-all cursor-pointer min-h-[34px] ${
                    viewMode === 'street'
                      ? 'bg-amber-950/70 border-amber-400 text-amber-300 shadow-sm shadow-amber-500/20'
                      : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300'
                  }`}
                  title={viewMode === 'street' ? 'Switch to Aerial Overview' : 'Switch to Street Level Exploration (WASD)'}
                >
                  {viewMode === 'street' ? (
                    <>
                      <Eye className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                      <span className="font-medium text-[11px] sm:text-xs">Street</span>
                    </>
                  ) : (
                    <>
                      <Footprints className="w-3.5 h-3.5 shrink-0 text-cyan-400" />
                      <span className="font-medium text-[11px] sm:text-xs">Explore</span>
                    </>
                  )}
                </button>
              )}

              {/* Village Builder Mode Button */}
              {onToggleBuildMode && (
                <button
                  onClick={onToggleBuildMode}
                  className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs transition-all cursor-pointer min-h-[34px] bg-amber-950/40 hover:bg-amber-950/70 border-amber-400/40 text-amber-300 hover:text-amber-200"
                  title="Open Village Builder & Construction System"
                >
                  <Hammer className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                  <span className="font-medium text-[11px] sm:text-xs">Build</span>
                </button>
              )}

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

              {/* Simulation Quick Play/Pause & Options Opener */}
              <div className="flex items-center rounded-xl bg-white/5 border border-white/10 p-0.5">
                {onToggleSimulation && (
                  <button
                    onClick={onToggleSimulation}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors cursor-pointer ${
                      simulationActive
                        ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title={simulationActive ? 'Pause Living Village Simulation' : 'Resume Living Village Simulation'}
                    aria-label="Toggle Simulation"
                  >
                    {simulationActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    <span className="text-[11px] font-mono hidden xs:inline sm:inline">
                      {simulationActive ? `${simulationSpeed}x Sim` : 'Paused'}
                    </span>
                  </button>
                )}

                <button
                  onClick={() => setIsSimPanelOpen(!isSimPanelOpen)}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    isSimPanelOpen
                      ? 'bg-cyan-400 text-slate-950'
                      : 'text-slate-400 hover:text-cyan-300'
                  }`}
                  title={isSimPanelOpen ? 'Close Simulation Control Panel' : 'Open Simulation Control Panel (Traffic, People, Speed, Quality)'}
                  aria-label="Simulation Settings"
                >
                  <Sliders className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Soundscape Audio */}
              <button
                onClick={onToggleSound}
                className={`p-2 rounded-xl border transition-all cursor-pointer min-h-[34px] min-w-[34px] flex items-center justify-center ${
                  soundEnabled
                    ? 'bg-cyan-950/70 border-cyan-400 text-cyan-300 shadow-sm shadow-cyan-500/20'
                    : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-400 hover:text-slate-200'
                }`}
                title="Toggle Web Audio Procedural Soundscape"
                aria-label="Toggle Sound"
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>

              {/* Search & Discover Drawer Opener */}
              <button
                onClick={onOpenDiscover}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-cyan-600/30 hover:bg-cyan-600/50 active:bg-cyan-600/70 border border-cyan-500/40 text-cyan-200 text-xs transition-all cursor-pointer min-h-[34px]"
                title="Search and Discover all Districts, Landmarks, and Buildings"
              >
                <Search className="w-3.5 h-3.5 shrink-0" />
                <span className="text-[11px] font-medium hidden xs:inline sm:inline">Search</span>
              </button>
            </div>

            {/* Center: Desktop Quick Landmark Jumper Chips */}
            <div className="hidden lg:flex items-center gap-1.5 overflow-x-auto py-0.5 max-w-sm">
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

            {/* Right: Lighting Atmosphere Controls & Time Scrubber Badge */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Time of Day Indicator Badge with Auto-Cycle Toggle */}
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-white/5 border border-white/10 text-xs">
                <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="font-mono text-[11px] font-semibold text-cyan-200 min-w-[56px]">
                  {formattedTime}
                </span>

                {onToggleAutoDayNight && (
                  <button
                    onClick={onToggleAutoDayNight}
                    className={`p-1 rounded-md transition-colors cursor-pointer ${
                      autoDayNight
                        ? 'bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/10'
                    }`}
                    title={autoDayNight ? 'Pause Real-Time Sun Cycle' : 'Resume Real-Time Sun Cycle'}
                    aria-label="Toggle Auto Day-Night Cycle"
                  >
                    {autoDayNight ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                  </button>
                )}
              </div>

              {/* Preset Atmosphere Buttons */}
              <div className="flex items-center gap-0.5 p-0.5 rounded-xl bg-white/5 border border-white/10">
                <button
                  onClick={() => onSelectLighting('dawn')}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    lightingMode === 'dawn'
                      ? 'bg-rose-500/30 text-rose-300'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Dawn Atmosphere (Glide to 06:15 AM)"
                  aria-label="Dawn Lighting"
                >
                  <Sunrise className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => onSelectLighting('day')}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    lightingMode === 'day'
                      ? 'bg-amber-500/30 text-amber-300'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Bright Daylight (Glide to 12:00 PM)"
                  aria-label="Daylight"
                >
                  <Sun className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => onSelectLighting('twilight')}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    lightingMode === 'twilight'
                      ? 'bg-orange-500/30 text-orange-300'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Sunset / Twilight (Glide to 06:15 PM)"
                  aria-label="Twilight Lighting"
                >
                  <Sunset className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => onSelectLighting('cyber-night')}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    lightingMode === 'cyber-night'
                      ? 'bg-indigo-500/30 text-indigo-300'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Cyber-Night Atmosphere (Glide to 10:00 PM)"
                  aria-label="Cyber-Night Lighting"
                >
                  <Moon className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Expanded Simulation Controls Drawer */}
          {isSimPanelOpen && (
            <div className="mt-2 pt-2 border-t border-cyan-500/20 bg-cyan-950/20 -mx-1 px-2.5 py-2 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
              {/* Left: Simulation Speed */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-mono text-cyan-300 flex items-center gap-1 font-semibold">
                  <Sliders className="w-3 h-3 text-cyan-400" />
                  Speed:
                </span>
                {([0.5, 1, 2] as SimulationSpeed[]).map((spd) => (
                  <button
                    key={spd}
                    onClick={() => onSelectSimulationSpeed?.(spd)}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                      simulationSpeed === spd
                        ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/50 font-bold'
                        : 'bg-white/5 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {spd}x
                  </button>
                ))}

                {/* Vertical Divider */}
                <span className="text-white/20 hidden sm:inline">|</span>

                {/* Traffic Fleet Toggle */}
                {onToggleTraffic && (
                  <button
                    onClick={onToggleTraffic}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-mono transition-colors cursor-pointer ${
                      trafficActive
                        ? 'bg-cyan-950/70 border-cyan-400/60 text-cyan-300'
                        : 'bg-white/5 border-white/10 text-slate-500 line-through'
                    }`}
                    title="Toggle 7 Procedural Vehicles (Sedan, Bus, Hatchback, Van, SUV, Ambulance, Hybrid)"
                  >
                    <Car className="w-3 h-3 shrink-0" />
                    <span>Cars (7)</span>
                  </button>
                )}

                {/* Pedestrian Population Toggle */}
                {onTogglePedestrians && (
                  <button
                    onClick={onTogglePedestrians}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-mono transition-colors cursor-pointer ${
                      pedestriansActive
                        ? 'bg-cyan-950/70 border-cyan-400/60 text-cyan-300'
                        : 'bg-white/5 border-white/10 text-slate-500 line-through'
                    }`}
                    title="Toggle 10 Articulated Walking Pedestrians across all Districts"
                  >
                    <Users className="w-3 h-3 shrink-0" />
                    <span>People (10)</span>
                  </button>
                )}

                {/* Environmental Animation Toggle */}
                {onToggleEnvAnimation && (
                  <button
                    onClick={onToggleEnvAnimation}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-mono transition-colors cursor-pointer ${
                      envAnimationActive
                        ? 'bg-cyan-950/70 border-cyan-400/60 text-cyan-300'
                        : 'bg-white/5 border-white/10 text-slate-500 line-through'
                    }`}
                    title="Toggle Water Waves, Fountain Ripples & Tree Foliage Wind Sway"
                  >
                    <Sparkles className="w-3 h-3 shrink-0" />
                    <span>Nature FX</span>
                  </button>
                )}
              </div>

              {/* Right: Graphics Quality & Reset Simulation */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">Quality:</span>
                {(['low', 'medium', 'high'] as GraphicsQuality[]).map((q) => (
                  <button
                    key={q}
                    onClick={() => onSelectGraphicsQuality?.(q)}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono capitalize transition-colors cursor-pointer ${
                      graphicsQuality === q
                        ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/50 font-bold'
                        : 'bg-white/5 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {q}
                  </button>
                ))}

                {/* Reset Simulation Button */}
                {onResetSimulation && (
                  <button
                    onClick={onResetSimulation}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-[11px] font-mono transition-colors cursor-pointer ml-1"
                    title="Reset vehicle positions to path start and pedestrians to beginning nodes"
                  >
                    <RefreshCw className="w-3 h-3 text-cyan-400" />
                    <span>Reset Sim</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Time Scrubber Slider Row */}
          {onSetTimeOfDay && (
            <div className="mt-2 pt-2 border-t border-white/10 flex items-center gap-2 px-1">
              <span className="text-[10px] font-mono text-slate-400 shrink-0 flex items-center gap-1">
                <Sun className="w-3 h-3 text-amber-400" />
                <span className="hidden sm:inline">Passage of Time:</span>
              </span>
              <input
                type="range"
                min="0"
                max="24"
                step="0.05"
                value={timeOfDay}
                onChange={(e) => onSetTimeOfDay(parseFloat(e.target.value))}
                className="flex-1 h-1.5 bg-white/15 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none"
                title={`Drag to simulate real-time passage of time: ${formattedTime}`}
                aria-label="Time of Day Slider"
              />
              <span className="text-[10px] font-mono text-cyan-300 font-semibold shrink-0">
                {formattedTime}
              </span>
            </div>
          )}

          {/* Active Landmark Sub-bar when a location is active */}
          {activeLoc && (
            <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 truncate">
                <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
                <span className="font-semibold text-white truncate">{activeLoc.name}:</span>
                <span className="text-slate-300 truncate hidden sm:inline">{activeLoc.subtitle}</span>
              </div>
              <span className="text-[10px] font-mono text-cyan-300 shrink-0 ml-2">
                {activeLoc.altitude}
              </span>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};
