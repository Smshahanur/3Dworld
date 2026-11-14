import React from 'react';
import { Compass, Volume2, VolumeX, Sun, Moon, Sunrise, Sunset, Info, Eye, Hammer, Users, User } from 'lucide-react';
import { LightingMode } from '../types';

interface NavbarProps {
  onHomeClick: () => void;
  onExploreClick: () => void;
  onDiscoverClick: () => void;
  onAboutClick: () => void;
  onCreatorClick?: () => void;
  isBuildMode?: boolean;
  onToggleBuildMode?: () => void;
  isMultiplayerActive?: boolean;
  onToggleMultiplayer?: () => void;
  onOpenAvatarCustomizer?: () => void;
  multiplayerPlayerCount?: number;
  lightingMode: LightingMode;
  onCycleLighting: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  cinemaMode: boolean;
  onToggleCinema: () => void;
  hoveredLandmark: string | null;
  formattedTime?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  onHomeClick,
  onExploreClick,
  onDiscoverClick,
  onAboutClick,
  onCreatorClick,
  isBuildMode = false,
  onToggleBuildMode,
  isMultiplayerActive = false,
  onToggleMultiplayer,
  onOpenAvatarCustomizer,
  multiplayerPlayerCount = 1,
  lightingMode,
  onCycleLighting,
  soundEnabled,
  onToggleSound,
  cinemaMode,
  onToggleCinema,
  hoveredLandmark,
  formattedTime,
}) => {
  if (cinemaMode) {
    return (
      <div className="fixed top-4 right-4 z-40">
        <button
          onClick={onToggleCinema}
          aria-label="Exit Cinema Mode"
          className="flex items-center gap-2 px-3 py-1.5 rounded-full glass-panel text-xs text-cyan-300 hover:text-white border border-cyan-500/30 hover:border-cyan-400 transition-all cursor-pointer shadow-lg"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Exit Cinema</span>
        </button>
      </div>
    );
  }

  const getLightingIcon = () => {
    switch (lightingMode) {
      case 'dawn':
        return <Sunrise className="w-4 h-4 text-rose-300" />;
      case 'day':
        return <Sun className="w-4 h-4 text-amber-300" />;
      case 'twilight':
        return <Sunset className="w-4 h-4 text-orange-400" />;
      case 'cyber-night':
      default:
        return <Moon className="w-4 h-4 text-cyan-300" />;
    }
  };

  const handleCreatorAction = () => {
    if (onCreatorClick) {
      onCreatorClick();
    } else {
      onAboutClick();
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 px-4 sm:px-8 py-3.5 flex items-center justify-between pointer-events-none transition-all duration-300">
      {/* 3DWorld Logo */}
      <div className="pointer-events-auto flex items-center gap-3">
        <button
          onClick={onHomeClick}
          className="group flex items-center gap-2.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-lg p-1"
          aria-label="3DWorld Home"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-500 p-[1.5px] shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-400/30 transition-all duration-300">
            <div className="w-full h-full bg-[#060913] rounded-[10px] flex items-center justify-center">
              <span className="font-display font-bold text-sm bg-gradient-to-r from-cyan-300 to-indigo-300 bg-clip-text text-transparent">
                3D
              </span>
            </div>
          </div>
          <div>
            <div className="font-display font-extrabold text-lg sm:text-xl tracking-wider text-white group-hover:text-cyan-300 transition-colors">
              3DWorld
            </div>
            <div className="text-[10px] tracking-widest text-slate-400 uppercase -mt-1 font-mono">
              Virtual Universe
            </div>
          </div>
        </button>

        {hoveredLandmark && (
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full glass-panel border border-cyan-500/30 text-xs text-cyan-300 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span>Target: {hoveredLandmark}</span>
          </div>
        )}
      </div>

      {/* Main Navigation links */}
      <nav
        aria-label="Primary Navigation"
        className="pointer-events-auto hidden md:flex items-center gap-1 px-3 py-1.5 rounded-full glass-panel border border-white/10 shadow-xl"
      >
        <button
          onClick={onHomeClick}
          aria-label="Navigate to 3DWorld Home Overview"
          className="px-4 py-1.5 rounded-full text-xs font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          Home
        </button>
        <button
          onClick={onExploreClick}
          aria-label="Explore 3DWorld Modern Village (Cinematic Flyover)"
          className="px-4 py-1.5 rounded-full text-xs font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          Explore
        </button>
        {onToggleBuildMode && (
          <button
            onClick={onToggleBuildMode}
            aria-label="Toggle Interactive Village Construction Build Mode"
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              isBuildMode
                ? 'bg-cyan-400 text-slate-950 shadow-md shadow-cyan-400/30 font-bold'
                : 'text-amber-300 hover:text-amber-200 hover:bg-amber-950/40 border border-amber-400/30'
            }`}
          >
            <Hammer className="w-3.5 h-3.5" />
            <span>{isBuildMode ? 'Building' : 'Build Mode'}</span>
          </button>
        )}
        {onToggleMultiplayer && (
          <button
            onClick={onToggleMultiplayer}
            aria-label="Multiplayer Online Village World"
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              isMultiplayerActive
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-400/30 font-bold'
                : 'text-emerald-300 hover:text-emerald-200 hover:bg-emerald-950/40 border border-emerald-400/30'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>{isMultiplayerActive ? `Online (${multiplayerPlayerCount})` : 'Multiplayer'}</span>
          </button>
        )}
        {onOpenAvatarCustomizer && (
          <button
            onClick={onOpenAvatarCustomizer}
            aria-label="Customize Human Character Avatar"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold text-cyan-200 hover:text-white hover:bg-cyan-950/50 border border-cyan-400/30 transition-all cursor-pointer"
          >
            <User className="w-3.5 h-3.5 text-cyan-400" />
            <span>Avatar</span>
          </button>
        )}
        <button
          onClick={onDiscoverClick}
          aria-label="Discover 3DWorld Districts and Buildings"
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium text-cyan-300 hover:text-cyan-200 hover:bg-cyan-950/40 transition-colors cursor-pointer"
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Discover</span>
        </button>
        <button
          onClick={onAboutClick}
          aria-label="About 3DWorld Project and Architecture"
          className="flex items-center gap-1 px-4 py-1.5 rounded-full text-xs font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <Info className="w-3.5 h-3.5" />
          <span>About</span>
        </button>
      </nav>

      {/* Quick controls: Creator pill, Build mode, Lighting, Sound, About */}
      <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2">
        {onToggleMultiplayer && (
          <button
            onClick={onToggleMultiplayer}
            title={isMultiplayerActive ? 'Multiplayer Online' : 'Enter Multiplayer Village'}
            aria-label="Toggle Multiplayer"
            className={`md:hidden flex items-center gap-1 px-2.5 py-1.5 rounded-full glass-panel border transition-all cursor-pointer text-xs font-semibold ${
              isMultiplayerActive
                ? 'bg-emerald-400 text-slate-950 border-emerald-300 shadow-sm'
                : 'border-emerald-400/40 text-emerald-300 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>{isMultiplayerActive ? `${multiplayerPlayerCount}` : 'Online'}</span>
          </button>
        )}
        {onOpenAvatarCustomizer && (
          <button
            onClick={onOpenAvatarCustomizer}
            title="Customize Human Avatar"
            aria-label="Customize Human Avatar"
            className="md:hidden flex items-center gap-1 px-2.5 py-1.5 rounded-full glass-panel border border-cyan-400/40 text-cyan-200 hover:text-white transition-all cursor-pointer text-xs font-semibold"
          >
            <User className="w-3.5 h-3.5" />
            <span>Avatar</span>
          </button>
        )}
        {onToggleBuildMode && (
          <button
            onClick={onToggleBuildMode}
            title={isBuildMode ? 'Exit Build Mode' : 'Enter Village Construction Build Mode'}
            aria-label="Toggle Build Mode"
            className={`md:hidden flex items-center gap-1 px-2.5 py-1.5 rounded-full glass-panel border transition-all cursor-pointer text-xs font-semibold ${
              isBuildMode
                ? 'bg-cyan-400 text-slate-950 border-cyan-300 shadow-sm'
                : 'border-amber-400/40 text-amber-300 hover:text-white'
            }`}
          >
            <Hammer className="w-3.5 h-3.5" />
            <span>{isBuildMode ? 'Exit' : 'Build'}</span>
          </button>
        )}

        {/* Lighting preset cycle button */}
        <button
          onClick={onCycleLighting}
          title={`Atmosphere: ${lightingMode.toUpperCase()} (Click to cycle)`}
          aria-label={`Current atmosphere: ${lightingMode}. Click to cycle.`}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full glass-panel border border-white/10 text-xs text-slate-300 hover:text-white hover:border-cyan-400/40 transition-all cursor-pointer"
        >
          {getLightingIcon()}
          <span className="hidden sm:inline capitalize text-[11px] font-mono">
            {formattedTime || lightingMode}
          </span>
        </button>

        {/* Ambient Sound synth toggle */}
        <button
          onClick={onToggleSound}
          title={soundEnabled ? 'Mute Ambient Soundscape' : 'Enable Ambient Soundscape'}
          aria-label={soundEnabled ? 'Mute ambient soundscape' : 'Enable ambient soundscape'}
          className={`p-2 rounded-full glass-panel border transition-all cursor-pointer ${
            soundEnabled
              ? 'border-cyan-500/40 text-cyan-300 bg-cyan-950/30 shadow-sm shadow-cyan-500/20'
              : 'border-white/10 text-slate-400 hover:text-slate-200'
          }`}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* About button */}
        <button
          onClick={onAboutClick}
          aria-label="About 3DWorld"
          title="About 3DWorld"
          className="p-2 rounded-full glass-panel border border-white/10 text-slate-300 hover:text-white cursor-pointer"
        >
          <Info className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
