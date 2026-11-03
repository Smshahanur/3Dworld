import React, { useState } from 'react';
import {
  Users,
  MessageSquare,
  Video,
  Eye,
  LogOut,
  ChevronDown,
  ChevronUp,
  MapPin,
  Circle,
  Radio,
} from 'lucide-react';
import {
  PlayerData,
  MultiplayerUser,
  AVATAR_COLORS,
} from '../multiplayer/types';

interface MultiplayerHUDProps {
  user: MultiplayerUser;
  remotePlayers: PlayerData[];
  followCamera: boolean;
  onToggleFollowCamera: () => void;
  isChatOpen: boolean;
  onToggleChat: () => void;
  unreadChatCount: number;
  onLeaveMultiplayer: () => void;
  onSelectPlayer?: (player: PlayerData) => void;
}

export const MultiplayerHUD: React.FC<MultiplayerHUDProps> = ({
  user,
  remotePlayers,
  followCamera,
  onToggleFollowCamera,
  isChatOpen,
  onToggleChat,
  unreadChatCount,
  onLeaveMultiplayer,
  onSelectPlayer,
}) => {
  const [showPlayerList, setShowPlayerList] = useState(false);

  const totalPlayersCount = remotePlayers.length + 1; // local + remotes
  const userColorHex = AVATAR_COLORS.find((c) => c.id === user.avatarColor)?.hex || '#06b6d4';

  return (
    <div className="fixed top-16 right-3 sm:right-6 z-30 flex flex-col items-end gap-2 pointer-events-none select-none">
      {/* Primary Status & Quick Actions Bar */}
      <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2 p-1.5 rounded-2xl bg-[#080d1a]/90 backdrop-blur-md border border-cyan-500/30 shadow-2xl">
        {/* Online Status & Count Pill */}
        <button
          onClick={() => setShowPlayerList(!showPlayerList)}
          title="Click to view online players list"
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-500/20 text-xs font-semibold text-cyan-200 transition-all cursor-pointer shadow-inner"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="font-bold">{totalPlayersCount}</span>
          <span className="hidden sm:inline text-cyan-300/80">Online</span>
          {showPlayerList ? (
            <ChevronUp className="w-3.5 h-3.5 text-cyan-400" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-cyan-400" />
          )}
        </button>

        {/* Local Player Badge */}
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-black/40 border border-white/5 text-xs text-slate-200">
          <span
            className="w-3 h-3 rounded-full shrink-0 shadow-sm"
            style={{ backgroundColor: userColorHex }}
          />
          <span className="font-medium max-w-[110px] truncate">{user.displayName}</span>
        </div>

        {/* Camera Tracking Mode Toggle */}
        <button
          onClick={onToggleFollowCamera}
          title={followCamera ? 'Switch to Free Orbit Camera' : 'Switch to Avatar Follow Camera'}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer border ${
            followCamera
              ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-200'
              : 'bg-black/40 border-white/10 text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          {followCamera ? <Video className="w-3.5 h-3.5 text-cyan-400" /> : <Eye className="w-3.5 h-3.5" />}
          <span className="hidden md:inline">{followCamera ? 'Follow Cam' : 'Free Cam'}</span>
        </button>

        {/* Chat Drawer Toggle */}
        <button
          onClick={onToggleChat}
          title="Toggle Global Chat"
          className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer border ${
            isChatOpen
              ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-200'
              : 'bg-black/40 border-white/10 text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Chat</span>
          {unreadChatCount > 0 && !isChatOpen && (
            <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-cyan-500 text-black font-extrabold text-[10px] shadow-sm animate-bounce">
              {unreadChatCount}
            </span>
          )}
        </button>

        {/* Leave Multiplayer */}
        <button
          onClick={onLeaveMultiplayer}
          title="Leave multiplayer world & return to solo village"
          className="p-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-red-300 hover:text-white transition-all cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {/* Online Players Flyout List */}
      {showPlayerList && (
        <div className="pointer-events-auto w-72 sm:w-80 rounded-2xl bg-[#080d1a]/95 backdrop-blur-md border border-cyan-500/30 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-4 py-2.5 border-b border-white/10 bg-slate-900/60 flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-cyan-400" />
              Village Residents ({totalPlayersCount})
            </span>
            <span className="text-[11px] text-emerald-400 font-medium">Real-time</span>
          </div>

          <div className="max-h-60 overflow-y-auto p-2 space-y-1.5">
            {/* Local Player */}
            <div className="flex items-center justify-between p-2 rounded-xl bg-cyan-950/30 border border-cyan-500/20 text-xs">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: userColorHex }}
                />
                <span className="font-semibold text-white truncate max-w-[140px]">
                  {user.displayName}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono">
                  You
                </span>
              </div>
              <span className="text-[10px] text-emerald-400">Host / Local</span>
            </div>

            {/* Remote Players */}
            {remotePlayers.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-400">
                No other residents in village right now.
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Invite a friend with another browser tab to explore together!
                </div>
              </div>
            ) : (
              remotePlayers.map((player) => {
                const color = AVATAR_COLORS.find((c) => c.id === player.avatarColor)?.hex || '#06b6d4';
                return (
                  <div
                    key={player.uid}
                    onClick={() => onSelectPlayer?.(player)}
                    className="flex items-center justify-between p-2 rounded-xl bg-black/30 hover:bg-white/5 border border-white/5 hover:border-white/15 text-xs transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      <span className="font-medium text-slate-200 truncate max-w-[130px]">
                        {player.displayName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <span className="capitalize">{player.avatarType}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
