import React, { useState } from 'react';
import {
  Hand,
  Smile,
  Sparkles,
  Music,
  ChevronUp,
  ChevronDown,
  UserCheck,
  MessageCircle,
  Briefcase,
  Hammer,
} from 'lucide-react';
import { HumanoidGesture } from '../world/humanoidCharacterSystem';
import { playGestureSound, playNPCGreeting } from '../utils/audio';

interface GestureToolbarProps {
  currentGesture: HumanoidGesture;
  onSelectGesture: (gesture: HumanoidGesture) => void;
  isDriving?: boolean;
}

export const GestureToolbar: React.FC<GestureToolbarProps> = ({
  currentGesture,
  onSelectGesture,
  isDriving = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // If driving EV, hide pedestrian gesture bar
  if (isDriving) return null;

  const gestures: { id: HumanoidGesture; label: string; icon: React.ReactNode; sound: () => void }[] = [
    {
      id: 'wave',
      label: 'Wave',
      icon: <Hand className="w-3.5 h-3.5" />,
      sound: () => {
        playNPCGreeting();
        playGestureSound();
      },
    },
    {
      id: 'talk',
      label: 'Talk',
      icon: <MessageCircle className="w-3.5 h-3.5" />,
      sound: () => {
        playNPCGreeting();
        playGestureSound();
      },
    },
    {
      id: 'work',
      label: 'Work',
      icon: <Hammer className="w-3.5 h-3.5" />,
      sound: () => playGestureSound(),
    },
    {
      id: 'carry',
      label: 'Carry',
      icon: <Briefcase className="w-3.5 h-3.5" />,
      sound: () => playGestureSound(),
    },
    {
      id: 'sit',
      label: 'Sit',
      icon: <Smile className="w-3.5 h-3.5" />,
      sound: () => playGestureSound(),
    },
    {
      id: 'cheer',
      label: 'Cheer',
      icon: <Sparkles className="w-3.5 h-3.5" />,
      sound: () => playGestureSound(),
    },
    {
      id: 'dance',
      label: 'Dance',
      icon: <Music className="w-3.5 h-3.5" />,
      sound: () => playGestureSound(),
    },
  ];

  const handleTrigger = (g: HumanoidGesture, sound?: () => void) => {
    if (sound) sound();
    if (currentGesture === g) {
      onSelectGesture('none');
    } else {
      onSelectGesture(g);
    }
  };

  return (
    <div className="fixed bottom-20 left-4 z-30 pointer-events-auto">
      <div className="glass-panel rounded-2xl border border-white/10 p-1.5 shadow-xl bg-slate-950/80 backdrop-blur-md">
        {/* Header Toggle */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          aria-label="Toggle Gestures Menu"
          aria-expanded={isExpanded}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          <Smile className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-[11px] font-mono">Gestures</span>
          {isExpanded ? (
            <ChevronDown className="w-3 h-3 text-slate-400" />
          ) : (
            <ChevronUp className="w-3 h-3 text-slate-400" />
          )}
        </button>

        {/* Gesture Buttons List */}
        {isExpanded && (
          <div className="pt-1.5 mt-1 border-t border-white/10 flex flex-col gap-1 animate-in fade-in duration-150">
            {gestures.map((item) => {
              const isActive = currentGesture === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTrigger(item.id, item.sound)}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer text-left ${
                    isActive
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}

            {currentGesture !== 'none' && (
              <button
                onClick={() => handleTrigger('none')}
                className="flex items-center gap-2 px-2.5 py-1 rounded-lg text-[10px] text-amber-300 hover:text-amber-200 hover:bg-amber-950/40 transition-colors cursor-pointer mt-0.5 border border-amber-400/20"
              >
                <UserCheck className="w-3 h-3" />
                <span>Stand / Reset</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
