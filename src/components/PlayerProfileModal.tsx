import React from 'react';
import { X, User, MapPin, Compass, Shield, Activity } from 'lucide-react';
import { PlayerData, AVATAR_COLORS } from '../multiplayer/types';

interface PlayerProfileModalProps {
  player: PlayerData | null;
  onClose: () => void;
}

export const PlayerProfileModal: React.FC<PlayerProfileModalProps> = ({ player, onClose }) => {
  if (!player) return null;

  const colorHex = AVATAR_COLORS.find((c) => c.id === player.avatarColor)?.hex || '#06b6d4';

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150 select-none"
    >
      <div className="relative w-full max-w-sm rounded-2xl bg-[#080d1a] border border-cyan-500/30 shadow-2xl overflow-hidden">
        {/* Header banner */}
        <div
          className="h-20 w-full relative flex items-end p-4"
          style={{
            background: `linear-gradient(to right, ${colorHex}44, #080d1a)`,
          }}
        >
          <button
            onClick={onClose}
            aria-label="Close profile"
            className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
          <div
            className="w-12 h-12 rounded-2xl border-2 border-white shadow-lg flex items-center justify-center text-white font-bold text-lg -mb-6 shrink-0"
            style={{ backgroundColor: colorHex }}
          >
            {player.displayName.charAt(0).toUpperCase()}
          </div>
        </div>

        {/* Details */}
        <div className="pt-8 px-5 pb-5 space-y-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>{player.displayName}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </h3>
            <p className="text-xs text-slate-400 font-mono">UID: {player.uid.slice(0, 12)}…</p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/5 space-y-0.5">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Style</span>
              <span className="text-slate-200 capitalize font-medium">{player.avatarType}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/5 space-y-0.5">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Color</span>
              <span className="text-slate-200 capitalize font-medium">{player.avatarColor}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/5 space-y-0.5 col-span-2">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Coordinates</span>
              <span className="text-cyan-300 font-mono text-[11px]">
                X: {player.position[0].toFixed(1)}, Y: {player.position[1].toFixed(1)}, Z: {player.position[2].toFixed(1)}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-2 px-4 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            Close Profile
          </button>
        </div>
      </div>
    </div>
  );
};
