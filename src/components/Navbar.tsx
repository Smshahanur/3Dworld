import React from 'react';
import { Eye, Hammer, Users, User, Settings } from 'lucide-react';

interface NavbarProps {
  onHomeClick: () => void;
  isBuildMode?: boolean;
  onToggleBuildMode?: () => void;
  isMultiplayerActive?: boolean;
  onToggleMultiplayer?: () => void;
  onOpenAvatarCustomizer?: () => void;
  multiplayerPlayerCount?: number;
  cinemaMode: boolean;
  onToggleCinema: () => void;
  isSettingsOpen?: boolean;
  onToggleSettings: () => void;
  hoveredLandmark?: string | null;
  isInWorld?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onHomeClick,
  isBuildMode = false,
  onToggleBuildMode,
  isMultiplayerActive = false,
  onToggleMultiplayer,
  onOpenAvatarCustomizer,
  multiplayerPlayerCount = 1,
  cinemaMode,
  onToggleCinema,
  isSettingsOpen = false,
  onToggleSettings,
  hoveredLandmark,
  isInWorld = false,
}) => {
  if (cinemaMode) {
    return (
      <div className="fixed top-4 right-4 z-40">
        <button
          type="button"
          onClick={onToggleCinema}
          aria-label="Exit Cinema Mode"
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#071022]/85 backdrop-blur-md text-xs font-medium text-cyan-200 hover:text-white border border-white/15 hover:border-cyan-400/40 transition-colors cursor-pointer shadow-lg"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Exit Cinema</span>
        </button>
      </div>
    );
  }

  return (
    <header className="fixed top-0 inset-x-0 z-40 px-2.5 sm:px-6 py-2 flex items-center justify-between gap-2 sm:gap-3 bg-[#060c1a]/75 backdrop-blur-md border-b border-white/[0.07]">
      {/* Left: Compact Official 3DWorld Brand Logo */}
      <div className="flex items-center gap-3 min-w-0 shrink-0">
        <button
          type="button"
          onClick={onHomeClick}
          className="group flex items-center gap-2.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-xl px-1 py-0.5 transition-opacity hover:opacity-90 cursor-pointer shrink-0 min-h-[40px]"
          aria-label="3DWorld Home"
          title="3DWorld"
        >
          <img
            src="/assets/branding/3dworld-logo-nav.png"
            alt="3DWorld"
            width={240}
            height={160}
            decoding="async"
            className="h-8 sm:h-9 w-auto object-contain shrink-0"
          />
          <span className="hidden sm:inline font-display font-bold text-base tracking-tight text-white whitespace-nowrap">
            3DWorld
          </span>
        </button>

        {isInWorld && hoveredLandmark && (
          <span className="hidden lg:inline-block text-xs text-cyan-300/90 font-medium truncate max-w-[200px]">
            {hoveredLandmark}
          </span>
        )}
      </div>

      {/* Right: Slim Essential Controls (Online, Avatar, Build, Settings) */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {onToggleMultiplayer && (
          <button
            type="button"
            onClick={onToggleMultiplayer}
            aria-label={isMultiplayerActive ? `Multiplayer Online (${multiplayerPlayerCount})` : 'Open Online Multiplayer'}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-xl border text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 min-h-[40px] ${
              isMultiplayerActive
                ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-200'
                : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-slate-200 hover:text-white'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                isMultiplayerActive ? 'bg-emerald-400' : 'bg-cyan-400/80'
              }`}
              aria-hidden="true"
            />
            <Users className="w-3.5 h-3.5 hidden sm:inline shrink-0 text-cyan-300" />
            <span>{isMultiplayerActive ? `Online (${multiplayerPlayerCount})` : 'Online'}</span>
          </button>
        )}

        {onOpenAvatarCustomizer && (
          <button
            type="button"
            onClick={onOpenAvatarCustomizer}
            aria-label="Open Avatar Studio"
            className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-medium text-slate-200 hover:text-white transition-colors cursor-pointer whitespace-nowrap shrink-0 min-h-[40px]"
          >
            <User className="w-3.5 h-3.5 hidden min-[400px]:inline text-cyan-300 shrink-0" />
            <span>Avatar</span>
          </button>
        )}

        {onToggleBuildMode && (
          <button
            type="button"
            onClick={onToggleBuildMode}
            aria-label={isBuildMode ? 'Exit Build Mode' : 'Open Build Mode'}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-xl border text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 min-h-[40px] ${
              isBuildMode
                ? 'bg-amber-400/20 border-amber-300/60 text-amber-200'
                : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-amber-200/90 hover:text-amber-100'
            }`}
          >
            <Hammer className="w-3.5 h-3.5 hidden min-[400px]:inline text-amber-300 shrink-0" />
            <span>{isBuildMode ? 'Exit Build' : 'Build'}</span>
          </button>
        )}

        <button
          type="button"
          onClick={onToggleSettings}
          aria-label="Open World Settings"
          aria-expanded={isSettingsOpen}
          title="Settings"
          className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
            isSettingsOpen
              ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-200'
              : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-slate-300 hover:text-white'
          }`}
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
