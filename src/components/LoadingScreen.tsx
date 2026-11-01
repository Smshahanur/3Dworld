import React from 'react';

interface LoadingScreenProps {
  progress: number;
  isLoaded: boolean;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ progress, isLoaded }) => {
  if (isLoaded) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#060913] flex flex-col items-center justify-center p-6 text-center select-none transition-opacity duration-700">
      {/* Background ambient glow */}
      <div className="absolute w-72 h-72 rounded-full bg-cyan-600/15 blur-3xl pointer-events-none" />
      <div className="absolute w-64 h-64 rounded-full bg-indigo-600/15 blur-3xl pointer-events-none translate-x-12 translate-y-12" />

      {/* 3DWorld Logo */}
      <div className="relative mb-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-500 p-[2px] shadow-2xl shadow-cyan-500/30">
          <div className="w-full h-full bg-[#060913] rounded-[14px] flex items-center justify-center">
            <span className="font-display font-extrabold text-2xl bg-gradient-to-r from-cyan-300 via-sky-200 to-indigo-300 bg-clip-text text-transparent">
              3D
            </span>
          </div>
        </div>
      </div>

      {/* Brand title */}
      <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-white tracking-wider mb-2">
        3DWorld
      </h1>
      <p className="text-xs sm:text-sm font-mono text-cyan-400 tracking-widest uppercase mb-8">
        Materializing Virtual Universe
      </p>

      {/* Progress Bar Container */}
      <div className="w-64 max-w-xs bg-slate-900 rounded-full h-2 p-[2px] border border-white/10 mb-4 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-cyan-400 to-indigo-500 rounded-full transition-all duration-300 shadow-sm shadow-cyan-400/50"
          style={{ width: `${Math.min(100, Math.max(8, progress))}%` }}
        />
      </div>

      <div className="flex items-center justify-between w-64 text-[11px] font-mono text-slate-500">
        <span>Generating Biomes</span>
        <span>{Math.round(progress)}%</span>
      </div>

      {/* Feature notice */}
      <div className="mt-12 text-[11px] font-mono text-slate-600 max-w-xs">
        100% Procedural Geometry & PBR Rendering
      </div>
    </div>
  );
};
