import React from 'react';
import { Gauge, LogOut, Zap, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Disc, RotateCcw } from 'lucide-react';

interface VehicleDashboardProps {
  speedKmh: number;
  gear: 'D' | 'R' | 'P';
  onExit: () => void;
  onToggleDiagnostics?: () => void;
  isDiagnosticsOpen?: boolean;
  onReset?: () => void;
  onThrottle?: (val: number) => void;
  onSteer?: (val: number) => void;
  onBrake?: (val: boolean) => void;
}

export const VehicleDashboard: React.FC<VehicleDashboardProps> = ({
  speedKmh,
  gear,
  onExit,
  onToggleDiagnostics,
  isDiagnosticsOpen,
  onReset,
  onThrottle,
  onSteer,
  onBrake,
}) => {
  const maxKmh = 80;
  const progress = Math.min(100, (speedKmh / maxKmh) * 100);

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-2 select-none pointer-events-none max-w-[95vw]">
      {/* Driving Dashboard Container */}
      <div className="pointer-events-auto flex items-center gap-2 sm:gap-4 px-3 sm:px-5 py-2 sm:py-3 rounded-2xl bg-[#080d1a]/95 backdrop-blur-md border border-cyan-500/40 shadow-2xl shadow-cyan-950/60">
        {/* Electric Vehicle Icon Badge */}
        <div className="flex items-center gap-2 text-cyan-400">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center">
            <Zap className="w-4 h-4 text-cyan-300" />
          </div>
          <div className="hidden sm:block">
            <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">EV Drive</div>
            <div className="text-xs font-bold text-white">Roadster</div>
          </div>
        </div>

        {/* Digital Speedometer & Speed Bar */}
        <div className="flex flex-col items-center">
          <div className="flex items-baseline gap-1">
            <span className="font-mono text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {speedKmh}
            </span>
            <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold">KM/H</span>
          </div>

          {/* Progress bar */}
          <div className="w-20 sm:w-36 h-1.5 rounded-full bg-slate-800 overflow-hidden mt-0.5">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-75"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Gear Selector Indicator */}
        <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-black/40 border border-white/5 font-mono text-xs font-bold">
          <span className={`px-1.5 py-0.5 rounded ${gear === 'P' ? 'bg-amber-500 text-black' : 'text-slate-500'}`}>
            P
          </span>
          <span className={`px-1.5 py-0.5 rounded ${gear === 'R' ? 'bg-red-500 text-white' : 'text-slate-500'}`}>
            R
          </span>
          <span className={`px-1.5 py-0.5 rounded ${gear === 'D' ? 'bg-emerald-500 text-black' : 'text-slate-500'}`}>
            D
          </span>
        </div>

        {/* On-screen quick pedal controls for touch & mouse */}
        {onThrottle && onSteer && (
          <div className="flex items-center gap-1.5 pl-1 border-l border-white/10">
            {/* Steer Left */}
            <button
              onPointerDown={() => onSteer(-1)}
              onPointerUp={() => onSteer(0)}
              onPointerLeave={() => onSteer(0)}
              className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 active:bg-cyan-600 text-white flex items-center justify-center transition-all cursor-pointer border border-white/10"
              title="Steer Left (A)"
              aria-label="Steer Left"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            {/* Accelerate Forward */}
            <button
              onPointerDown={() => onThrottle(1)}
              onPointerUp={() => onThrottle(0)}
              onPointerLeave={() => onThrottle(0)}
              className="w-8 h-8 rounded-lg bg-emerald-800/80 hover:bg-emerald-700 active:bg-emerald-500 text-white flex items-center justify-center transition-all cursor-pointer border border-emerald-500/40"
              title="Accelerate (W)"
              aria-label="Accelerate"
            >
              <ArrowUp className="w-4 h-4" />
            </button>

            {/* Reverse / Brake */}
            <button
              onPointerDown={() => onThrottle(-1)}
              onPointerUp={() => onThrottle(0)}
              onPointerLeave={() => onThrottle(0)}
              className="w-8 h-8 rounded-lg bg-amber-800/80 hover:bg-amber-700 active:bg-amber-500 text-white flex items-center justify-center transition-all cursor-pointer border border-amber-500/40"
              title="Reverse (S)"
              aria-label="Reverse"
            >
              <ArrowDown className="w-4 h-4" />
            </button>

            {/* Steer Right */}
            <button
              onPointerDown={() => onSteer(1)}
              onPointerUp={() => onSteer(0)}
              onPointerLeave={() => onSteer(0)}
              className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 active:bg-cyan-600 text-white flex items-center justify-center transition-all cursor-pointer border border-white/10"
              title="Steer Right (D)"
              aria-label="Steer Right"
            >
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Handbrake */}
            {onBrake && (
              <button
                onPointerDown={() => onBrake(true)}
                onPointerUp={() => onBrake(false)}
                onPointerLeave={() => onBrake(false)}
                className="w-8 h-8 rounded-lg bg-rose-900/60 hover:bg-rose-800 active:bg-rose-600 text-rose-200 flex items-center justify-center transition-all cursor-pointer border border-rose-500/40"
                title="Handbrake (Space)"
                aria-label="Handbrake"
              >
                <Disc className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Reset to Bay Button */}
        {onReset && (
          <button
            onClick={onReset}
            className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-slate-800/60 hover:bg-slate-700/80 border border-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
            title="Reset EV to Bay"
          >
            <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        )}

        {/* Diagnostics Toggle */}
        {onToggleDiagnostics && (
          <button
            onClick={onToggleDiagnostics}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              isDiagnosticsOpen
                ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200'
                : 'bg-slate-800/60 hover:bg-slate-700/80 border-slate-700 text-slate-300'
            }`}
            title="Toggle Live EV Telemetry & Collision Diagnostics (T)"
          >
            <Gauge className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Telemetry</span>
          </button>
        )}

        {/* Exit Vehicle Button */}
        <button
          onClick={onExit}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 active:bg-red-800/80 border border-red-500/40 text-red-300 hover:text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
          title="Exit Vehicle & return to foot exploration (E or Esc)"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden xs:inline sm:inline">Exit</span>
        </button>
      </div>

      {/* Quick Desktop Controls Hint */}
      <div className="hidden md:flex items-center gap-2 px-3 py-0.5 rounded-full bg-black/60 border border-white/10 text-[10px] text-slate-300 font-mono">
        <span>W/S: Throttle & Reverse</span>
        <span>•</span>
        <span>A/D: Steer</span>
        <span>•</span>
        <span>Space: Handbrake</span>
        <span>•</span>
        <span>T: Telemetry</span>
        <span>•</span>
        <span>E or Esc: Exit</span>
      </div>
    </div>
  );
};
