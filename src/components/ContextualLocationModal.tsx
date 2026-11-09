import React, { useState } from 'react';
import { X, Sparkles, Coffee, Compass, ArrowRight, CheckCircle2 } from 'lucide-react';
import { WorldInteractionSpot } from '../world/npcBehaviorSystem';
import { playWaterSplash, playGestureSound } from '../utils/audio';

interface ContextualLocationModalProps {
  spot: WorldInteractionSpot | null;
  onClose: () => void;
  onPerformPlayerGesture?: (gesture: 'sit' | 'cheer' | 'wave') => void;
}

export const ContextualLocationModal: React.FC<ContextualLocationModalProps> = ({
  spot,
  onClose,
  onPerformPlayerGesture,
}) => {
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  if (!spot) return null;

  const districtColors = {
    rural: 'from-amber-500/20 to-emerald-500/20 border-amber-500/40 text-amber-300',
    modern: 'from-cyan-500/20 to-indigo-500/20 border-cyan-500/40 text-cyan-300',
    capital: 'from-purple-500/20 to-pink-500/20 border-purple-500/40 text-purple-300',
  }[spot.district];

  const handleActionOption = (option: { label: string; actionId: string; soundType?: string }) => {
    if (option.soundType === 'splash') {
      playWaterSplash();
    } else {
      playGestureSound();
    }

    if (option.actionId.includes('sit') || spot.category === 'bench') {
      if (onPerformPlayerGesture) onPerformPlayerGesture('sit');
    } else if (option.actionId.includes('wish') || option.actionId.includes('cheer')) {
      if (onPerformPlayerGesture) onPerformPlayerGesture('cheer');
    }

    setActionFeedback(`Completed: ${option.label}!`);
    setTimeout(() => {
      setActionFeedback(null);
    }, 3500);
  };

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/60 pointer-events-auto backdrop-blur-sm"
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="spot-title"
        className="relative pointer-events-auto w-full max-w-lg overflow-hidden rounded-3xl bg-slate-900/95 border border-white/10 shadow-2xl p-5 sm:p-6 text-left"
      >
        {/* Ambient Glow */}
        <div
          aria-hidden="true"
          className={`absolute -top-10 -right-10 w-48 h-48 rounded-full blur-3xl opacity-30 bg-gradient-to-tr ${districtColors}`}
        />

        {/* Header */}
        <div className="relative z-10 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500/30 to-cyan-500/30 border border-white/15 flex items-center justify-center text-emerald-300 text-lg font-bold shadow-md">
              {spot.category === 'cafe' ? (
                <Coffee className="w-6 h-6" />
              ) : spot.category === 'fountain' ? (
                <Sparkles className="w-6 h-6" />
              ) : (
                <Compass className="w-6 h-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="spot-title" className="font-display font-bold text-base sm:text-lg text-white">
                  {spot.title}
                </h3>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider border ${districtColors}`}>
                  {spot.district} District
                </span>
                <span className="text-xs text-slate-400 capitalize">{spot.category}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Description */}
        <div className="relative z-10 mt-4 space-y-3 text-sm text-slate-300">
          <p className="leading-relaxed text-slate-200">{spot.description}</p>

          {/* Details list */}
          {spot.details && spot.details.length > 0 && (
            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1.5 text-xs text-slate-300">
              {spot.details.map((detail, idx) => (
                <div key={idx} className="leading-relaxed">
                  {detail}
                </div>
              ))}
            </div>
          )}

          {/* Action options */}
          <div className="pt-2">
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold mb-2">
              Available Interactions
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {spot.options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => handleActionOption(option)}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/30 text-xs font-medium text-cyan-200 hover:text-white transition-all cursor-pointer text-left"
                >
                  <span>{option.label}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-cyan-400 shrink-0 ml-1.5" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Feedback notification */}
        {actionFeedback && (
          <div className="relative z-10 mt-3 px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in duration-150">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
            <span>{actionFeedback}</span>
          </div>
        )}

        {/* Footer */}
        <div className="relative z-10 mt-4 pt-3 border-t border-white/10 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
