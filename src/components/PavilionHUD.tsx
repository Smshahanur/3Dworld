import React from 'react';
import { PavilionInteractionPoint } from '../world/creatorPavilionInterior';

interface PavilionHUDProps {
  isInside: boolean;
  nearPoint: PavilionInteractionPoint | null;
  onOpenPoint: (point: PavilionInteractionPoint) => void;
  onExitPavilion: () => void;
  onToggleRooftop: () => void;
  isRooftop: boolean;
}

export const PavilionHUD: React.FC<PavilionHUDProps> = ({
  isInside,
  nearPoint,
  onOpenPoint,
  onExitPavilion,
  onToggleRooftop,
  isRooftop,
}) => {
  if (!isInside && !nearPoint) return null;

  return (
    <div className="fixed inset-x-0 bottom-20 md:bottom-6 z-40 pointer-events-none flex flex-col items-center gap-3 px-4">
      {/* 1. Proximity Interaction Prompt Banner */}
      {nearPoint && (
        <button
          onClick={() => onOpenPoint(nearPoint)}
          aria-label={`Inspect ${nearPoint.title}`}
          className="pointer-events-auto group animate-bounce-subtle flex items-center gap-3 px-5 py-3 rounded-2xl bg-[#071922]/90 hover:bg-[#0c2633] border border-teal-400/50 hover:border-teal-300 text-white shadow-xl shadow-teal-950/70 backdrop-blur-md transition-all cursor-pointer hover:scale-[1.02]"
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-teal-500/20 text-teal-300 group-hover:bg-teal-500 group-hover:text-slate-950 transition-colors font-bold text-xs">
            <span className="hidden md:inline font-mono">E</span>
            <svg className="w-4 h-4 md:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
            </svg>
          </div>
          <div className="text-left">
            <div className="text-[10px] uppercase font-bold tracking-wider text-teal-400">
              {nearPoint.category} Exhibit
            </div>
            <div className="text-sm font-semibold text-white group-hover:text-teal-200 transition-colors">
              {nearPoint.title}
            </div>
          </div>
          <div className="ml-2 text-xs font-medium text-teal-400/80 group-hover:text-teal-300 flex items-center gap-1">
            <span className="hidden md:inline">Press [E] or</span> Tap to Inspect
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </button>
      )}

      {/* 2. Pavilion Navigation Toolbar when Inside */}
      {isInside && (
        <div className="pointer-events-auto flex items-center gap-2 p-1.5 rounded-2xl bg-[#091720]/85 border border-teal-500/30 shadow-lg shadow-black/40 backdrop-blur-md text-xs">
          <div className="flex items-center gap-2 px-3 py-1.5 text-teal-300 font-medium border-r border-white/10">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            <span className="font-semibold tracking-wide">Creator Studio</span>
          </div>

          <button
            onClick={onToggleRooftop}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 hover:text-white transition-colors cursor-pointer font-medium"
          >
            {isRooftop ? (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
                <span>Ground Studio</span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                <span>Rooftop Deck</span>
              </>
            )}
          </button>

          <button
            onClick={onExitPavilion}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 transition-colors cursor-pointer font-medium"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Exit Studio</span>
          </button>
        </div>
      )}
    </div>
  );
};
