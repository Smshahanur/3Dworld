import React, { useState } from 'react';
import {
  Users,
  MessageSquare,
  Video,
  Eye,
  LogOut,
  ChevronDown,
  ChevronUp,
  Settings2,
  Gauge,
  RotateCcw,
  UserCog,
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
  currentSpeed?: number;
  speedMultiplier?: number;
  sensitivityMultiplier?: number;
  onUpdateMovementSettings?: (speedMult: number, sensMult: number) => void;
  onOpenAvatarCustomizer?: () => void;
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
  currentSpeed = 0,
  speedMultiplier = 1.0,
  sensitivityMultiplier = 1.0,
  onUpdateMovementSettings,
  onOpenAvatarCustomizer,
}) => {
  const [showPlayerList, setShowPlayerList] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [localSpeedMult, setLocalSpeedMult] = useState(speedMultiplier);
  const [localSensMult, setLocalSensMult] = useState(sensitivityMultiplier);

  const totalPlayersCount = remotePlayers.length + 1; // local + remotes
  const userColorHex = AVATAR_COLORS.find((c) => c.id === user.avatarColor)?.hex || '#06b6d4';

  const handleSpeedChange = (val: number) => {
    setLocalSpeedMult(val);
    onUpdateMovementSettings?.(val, localSensMult);
  };

  const handleSensChange = (val: number) => {
    setLocalSensMult(val);
    onUpdateMovementSettings?.(localSpeedMult, val);
  };

  const handleResetSettings = () => {
    setLocalSpeedMult(1.0);
    setLocalSensMult(1.0);
    onUpdateMovementSettings?.(1.0, 1.0);
  };

  // Speed label classification aligned with human locomotion
  const getSpeedLabel = (spd: number) => {
    if (spd < 0.15) return { text: 'Idle', color: 'text-slate-400' };
    if (spd < 2.2) return { text: 'Walk', color: 'text-cyan-300' };
    if (spd < 4.2) return { text: 'Run', color: 'text-emerald-400' };
    return { text: 'Sprint', color: 'text-amber-400' };
  };

  const speedInfo = getSpeedLabel(currentSpeed);

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

        {/* Local Player Badge (Click to customize Avatar) */}
        <button
          type="button"
          onClick={onOpenAvatarCustomizer}
          title="Customize human avatar, hairstyle, clothing & GLB model"
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-black/40 hover:bg-cyan-950/50 border border-white/5 hover:border-cyan-400/40 text-xs text-slate-200 transition-colors cursor-pointer"
        >
          <span
            className="w-3 h-3 rounded-full shrink-0 shadow-sm"
            style={{ backgroundColor: userColorHex }}
          />
          <span className="font-medium max-w-[110px] truncate">{user.displayName}</span>
          {onOpenAvatarCustomizer && <UserCog className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
        </button>

        {/* Real-time Movement Speedometer Badge */}
        <div
          title={`Locomotion: ${speedInfo.text} at ${currentSpeed.toFixed(2)} m/s (${(currentSpeed * 3.6).toFixed(1)} km/h)`}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-black/40 border border-white/5 text-xs font-mono text-slate-200"
        >
          <Gauge className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span className="font-semibold text-white">{currentSpeed.toFixed(1)}</span>
          <span className="text-[10px] text-slate-400">m/s</span>
          <span className={`text-[10px] font-bold uppercase tracking-wider px-1 py-0.2 rounded bg-white/5 ${speedInfo.color}`}>
            {speedInfo.text}
          </span>
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

        {/* Locomotion & Physics Settings Toggle */}
        <button
          onClick={() => {
            setShowSettings(!showSettings);
            if (!showSettings) setShowPlayerList(false);
          }}
          title="Adjust movement speed & camera sensitivity"
          className={`p-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer border ${
            showSettings
              ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-200'
              : 'bg-black/40 border-white/10 text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Settings2 className="w-4 h-4 text-cyan-400" />
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

      {/* Movement & Sensitivity Settings Flyout */}
      {showSettings && (
        <div className="pointer-events-auto w-72 sm:w-80 rounded-2xl bg-[#080d1a]/95 backdrop-blur-md border border-cyan-500/30 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 p-4 space-y-3.5">
          <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
            <span className="text-xs font-bold text-white flex items-center gap-2">
              <Settings2 className="w-3.5 h-3.5 text-cyan-400" />
              Movement & Physics Controls
            </span>
            <button
              onClick={handleResetSettings}
              title="Reset physics to baseline standard"
              className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-200 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          </div>

          {/* Speed Multiplier Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">Walk & Run Speed</span>
              <span className="text-cyan-300 font-mono font-bold">
                {Math.round(localSpeedMult * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0.7}
              max={1.3}
              step={0.05}
              value={localSpeedMult}
              onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>0.7x (1.0 m/s)</span>
              <span className="text-slate-400">Baseline (1.4 m/s)</span>
              <span>1.3x (1.8 m/s)</span>
            </div>
          </div>

          {/* Look Sensitivity Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">Camera Look Sensitivity</span>
              <span className="text-cyan-300 font-mono font-bold">
                {localSensMult.toFixed(2)}x
              </span>
            </div>
            <input
              type="range"
              min={0.5}
              max={2.0}
              step={0.1}
              value={localSensMult}
              onChange={(e) => handleSensChange(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>0.5x Smooth</span>
              <span className="text-slate-400">1.0x Normal</span>
              <span>2.0x Fast</span>
            </div>
          </div>

          {/* Real-time Telemetry summary */}
          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
            <span>Physical Cadence:</span>
            <span className="text-emerald-400 font-mono">Stride Synchronized</span>
          </div>
        </div>
      )}

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
