import React from 'react';
import { MessageSquare, Sparkles, MapPin } from 'lucide-react';
import { ActiveNPCEntity, WorldInteractionSpot } from '../world/npcBehaviorSystem';

interface WorldInteractionPromptProps {
  nearbyNPC: ActiveNPCEntity | null;
  nearbySpot: WorldInteractionSpot | null;
  onInteractNPC: (npc: ActiveNPCEntity) => void;
  onInteractSpot: (spot: WorldInteractionSpot) => void;
}

export const WorldInteractionPrompt: React.FC<WorldInteractionPromptProps> = ({
  nearbyNPC,
  nearbySpot,
  onInteractNPC,
  onInteractSpot,
}) => {
  if (!nearbyNPC && !nearbySpot) return null;

  return (
    <div className="fixed bottom-28 sm:bottom-24 left-1/2 -translate-x-1/2 z-40 pointer-events-auto animate-in fade-in slide-in-from-bottom-3 duration-200">
      {nearbyNPC && (
        <button
          onClick={() => onInteractNPC(nearbyNPC)}
          aria-label={`Interact with ${nearbyNPC.profile.name}`}
          className="group flex items-center gap-2.5 px-4 py-2 rounded-full glass-panel border border-cyan-400/50 bg-slate-950/85 hover:bg-cyan-950/90 text-white shadow-xl shadow-cyan-950/40 hover:border-cyan-300 transition-all cursor-pointer select-none"
        >
          <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-300 border border-cyan-400/40 group-hover:scale-110 transition-transform">
            <MessageSquare className="w-3.5 h-3.5" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-100">
              <span className="px-1.5 py-0.5 rounded bg-cyan-500/30 text-[10px] font-mono text-cyan-200 uppercase font-bold">
                E / Tap
              </span>
              <span>Talk to {nearbyNPC.profile.name}</span>
            </div>
            <div className="text-[10px] text-cyan-300/80 font-normal">
              {nearbyNPC.currentActivity} · {nearbyNPC.currentLocationName}
            </div>
          </div>
        </button>
      )}

      {!nearbyNPC && nearbySpot && (
        <button
          onClick={() => onInteractSpot(nearbySpot)}
          aria-label={`Interact with ${nearbySpot.title}`}
          className="group flex items-center gap-2.5 px-4 py-2 rounded-full glass-panel border border-emerald-400/50 bg-slate-950/85 hover:bg-emerald-950/90 text-white shadow-xl shadow-emerald-950/40 hover:border-emerald-300 transition-all cursor-pointer select-none"
        >
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-300 border border-emerald-400/40 group-hover:scale-110 transition-transform">
            {nearbySpot.category === 'fountain' ? (
              <Sparkles className="w-3.5 h-3.5" />
            ) : (
              <MapPin className="w-3.5 h-3.5" />
            )}
          </div>
          <div className="text-left">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-100">
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/30 text-[10px] font-mono text-emerald-200 uppercase font-bold">
                E / Tap
              </span>
              <span>{nearbySpot.actionLabel}</span>
            </div>
            <div className="text-[10px] text-emerald-300/80 font-normal truncate max-w-[200px] sm:max-w-[260px]">
              {nearbySpot.title}
            </div>
          </div>
        </button>
      )}
    </div>
  );
};
