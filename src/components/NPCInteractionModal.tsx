import React, { useState } from 'react';
import { X, MessageSquare, Calendar, Sparkles, MapPin, Hand, ArrowRight } from 'lucide-react';
import { ActiveNPCEntity } from '../world/npcBehaviorSystem';
import { playNPCGreeting, playGestureSound } from '../utils/audio';

interface NPCInteractionModalProps {
  npc: ActiveNPCEntity | null;
  onClose: () => void;
  onPerformPlayerGesture?: (gesture: 'wave' | 'cheer') => void;
}

export const NPCInteractionModal: React.FC<NPCInteractionModalProps> = ({
  npc,
  onClose,
  onPerformPlayerGesture,
}) => {
  const [activeTab, setActiveTab] = useState<'dialogue' | 'schedule' | 'advice'>('dialogue');
  const [waveFeedback, setWaveFeedback] = useState<string | null>(null);

  if (!npc) return null;

  const { profile } = npc;

  const districtColors = {
    rural: 'from-amber-500/20 to-emerald-500/20 border-amber-500/40 text-amber-300',
    modern: 'from-cyan-500/20 to-indigo-500/20 border-cyan-500/40 text-cyan-300',
    capital: 'from-purple-500/20 to-pink-500/20 border-purple-500/40 text-purple-300',
  }[profile.district];

  const handleWave = () => {
    playNPCGreeting();
    playGestureSound();
    if (onPerformPlayerGesture) {
      onPerformPlayerGesture('wave');
    }
    setWaveFeedback(`${profile.name} smiled and waved back!`);
    setTimeout(() => setWaveFeedback(null), 3000);
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
        aria-labelledby="npc-name-title"
        className="relative pointer-events-auto w-full max-w-lg overflow-hidden rounded-3xl bg-slate-900/95 border border-white/10 shadow-2xl p-5 sm:p-6 text-left"
      >
        {/* Soft District Glow */}
        <div
          aria-hidden="true"
          className={`absolute -top-10 -right-10 w-48 h-48 rounded-full blur-3xl opacity-30 bg-gradient-to-tr ${districtColors}`}
        />

        {/* Header */}
        <div className="relative z-10 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500/30 to-purple-500/30 border border-white/15 flex items-center justify-center text-cyan-300 text-lg font-bold shadow-md">
              {profile.name[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="npc-name-title" className="font-display font-bold text-lg text-white">
                  {profile.name}
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider border ${districtColors}`}>
                  {profile.district} District
                </span>
              </div>
              <div className="text-xs text-slate-400 font-medium">{profile.role}</div>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close conversation"
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current status bar */}
        <div className="relative z-10 mt-3.5 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/5 flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-1.5 truncate">
            <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="text-slate-400">At:</span>
            <span className="font-medium text-white truncate">{npc.currentLocationName}</span>
          </div>
          <div className="text-[11px] text-cyan-300 font-mono shrink-0 pl-2">
            {npc.currentActivity}
          </div>
        </div>

        {/* Tab navigation */}
        <div className="relative z-10 flex gap-2 mt-4 border-b border-white/10 pb-2">
          <button
            onClick={() => setActiveTab('dialogue')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'dialogue'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Conversation</span>
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'schedule'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Daily Routine</span>
          </button>
          <button
            onClick={() => setActiveTab('advice')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'advice'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Local Advice</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="relative z-10 my-4 min-h-[140px] text-sm text-slate-300">
          {activeTab === 'dialogue' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="p-3.5 rounded-2xl bg-cyan-950/30 border border-cyan-500/20 text-cyan-100 font-medium leading-relaxed italic">
                &ldquo;{profile.dialogue.greeting}&rdquo;
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {profile.dialogue.lore}
              </p>
              <div className="text-xs text-slate-400">
                <span className="font-semibold text-slate-300">Background: </span>
                {profile.bio}
              </div>
            </div>
          )}

          {activeTab === 'schedule' && (
            <div className="space-y-2 animate-in fade-in duration-150">
              <p className="text-xs text-slate-300 mb-2 leading-relaxed">
                {profile.dialogue.scheduleDescription}
              </p>
              <div className="max-h-48 overflow-y-auto pr-1 space-y-1.5">
                {profile.schedule.map((slot, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-cyan-400 font-bold text-[11px] w-20">
                        {slot.startHour.toString().padStart(2, '0')}:00 – {slot.endHour.toString().padStart(2, '0')}:00
                      </span>
                      <span className="text-slate-200">{slot.activity}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono truncate max-w-[120px]">
                      {slot.locationName}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'advice' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/20 text-emerald-100 text-xs sm:text-sm leading-relaxed">
                <span className="font-semibold text-emerald-300 block mb-1">Local Tips for Travelers:</span>
                &ldquo;{profile.dialogue.advice}&rdquo;
              </div>
            </div>
          )}
        </div>

        {/* Wave Feedback notification */}
        {waveFeedback && (
          <div className="relative z-10 mb-3 px-3 py-1.5 rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-200 text-xs flex items-center gap-2 animate-in fade-in duration-150">
            <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
            <span>{waveFeedback}</span>
          </div>
        )}

        {/* Footer actions */}
        <div className="relative z-10 pt-3 border-t border-white/10 flex items-center justify-between gap-2">
          <button
            onClick={handleWave}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 hover:text-white text-xs font-semibold border border-white/10 transition-colors cursor-pointer"
          >
            <Hand className="w-3.5 h-3.5 text-cyan-400" />
            <span>Wave & Greet</span>
          </button>

          <button
            onClick={onClose}
            className="flex items-center gap-1 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-colors cursor-pointer"
          >
            <span>Continue Journey</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
