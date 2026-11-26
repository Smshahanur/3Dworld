import React, { useEffect, useState } from 'react';

interface LoadingScreenProps {
  progress: number;
  isLoaded: boolean;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ progress, isLoaded }) => {
  const [shouldRender, setShouldRender] = useState(!isLoaded);

  useEffect(() => {
    if (!isLoaded) {
      setShouldRender(true);
      return;
    }
    const timer = window.setTimeout(() => {
      setShouldRender(false);
    }, 480);
    return () => window.clearTimeout(timer);
  }, [isLoaded]);

  if (!shouldRender) return null;

  const clampedProgress = Math.min(100, Math.max(8, progress));

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading 3DWorld Virtual Universe"
      className={`fixed inset-0 z-50 bg-[#050a16] flex flex-col items-center justify-center p-6 text-center select-none transition-opacity duration-500 ease-out ${
        isLoaded ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Subtle Blue & Cyan Ambient Glow */}
      <div
        aria-hidden="true"
        className="animate-cyan-glow absolute w-80 h-80 sm:w-[420px] sm:h-[420px] rounded-full bg-radial from-cyan-400/20 via-blue-600/12 to-transparent blur-3xl pointer-events-none"
      />

      {/* Official 3DWorld Brand Logo */}
      <div className="relative mb-5 flex flex-col items-center">
        <div
          aria-hidden="true"
          className="animate-cyan-glow absolute inset-0 rounded-full bg-cyan-400/15 blur-2xl pointer-events-none"
        />
        <img
          src="/assets/branding/3dworld-logo-compact.png"
          alt="3DWorld – Explore • Play • Live"
          width={420}
          height={280}
          decoding="async"
          className="relative w-56 sm:w-72 md:w-80 h-auto object-contain drop-shadow-[0_12px_32px_rgba(6,182,212,0.28)]"
        />
      </div>

      {/* Brand Tagline & Accent Bar */}
      <p className="text-sm sm:text-base font-display font-semibold tracking-[0.22em] text-cyan-200 uppercase mb-2">
        Explore • Play • Live
      </p>
      <div
        aria-hidden="true"
        className="w-28 h-[2px] rounded-full bg-gradient-to-r from-cyan-400 via-amber-400 to-blue-500 mb-7 opacity-90"
      />

      {/* Lightweight Progress Bar */}
      <div className="w-64 sm:w-72 max-w-full bg-[#0a1428] rounded-full h-2.5 p-[2px] border border-cyan-400/25 mb-3 overflow-hidden shadow-inner">
        <div
          className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-amber-400 rounded-full transition-all duration-300 shadow-[0_0_12px_rgba(34,211,238,0.55)]"
          style={{ width: `${clampedProgress}%` }}
        />
      </div>

      <div className="flex items-center justify-between w-64 sm:w-72 max-w-full text-[11px] font-mono text-slate-400 tabular-nums">
        <span>Entering Virtual Universe</span>
        <span className="text-cyan-300 font-semibold">{Math.round(progress)}%</span>
      </div>

      <p className="mt-8 text-[11px] text-slate-500 tracking-wide">
        Created by <span className="text-slate-300 font-medium">Shahanur Mollah</span>
      </p>
    </div>
  );
};
