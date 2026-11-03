import React, { useState } from 'react';
import {
  Users,
  X,
  Sparkles,
  LogIn,
  UserPlus,
  Compass,
  Hammer,
  User,
  Check,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import {
  AvatarColor,
  AvatarType,
  AVATAR_COLORS,
  AVATAR_STYLES,
  MultiplayerUser,
} from '../multiplayer/types';
import { multiplayerService } from '../multiplayer/multiplayerService';

interface MultiplayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoined: (user: MultiplayerUser) => void;
}

export const MultiplayerModal: React.FC<MultiplayerModalProps> = ({
  isOpen,
  onClose,
  onJoined,
}) => {
  const [authTab, setAuthTab] = useState<'guest' | 'signin' | 'signup'>('guest');
  const [displayName, setDisplayName] = useState(() => {
    try {
      return localStorage.getItem('3dworld_player_name') || 'Resident_' + Math.floor(100 + Math.random() * 900);
    } catch {
      return 'Resident_' + Math.floor(100 + Math.random() * 900);
    }
  });
  const [selectedColor, setSelectedColor] = useState<AvatarColor>('cyan');
  const [selectedStyle, setSelectedStyle] = useState<AvatarType>('casual');

  // Account inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleGuestJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const user = await multiplayerService.signInAsGuest(displayName, selectedColor, selectedStyle);
      onJoined(user);
      onClose();
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg((err as Error)?.message || 'Failed to enter multiplayer world.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const user = await multiplayerService.signInWithEmail(email, password);
      multiplayerService.updateProfileSettings(user.displayName, selectedColor, selectedStyle);
      onJoined(user);
      onClose();
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg((err as Error)?.message || 'Sign in failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const user = await multiplayerService.signUpWithEmail(
        email,
        password,
        displayName,
        selectedColor,
        selectedStyle
      );
      onJoined(user);
      onClose();
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg((err as Error)?.message || 'Sign up failed. Password must be at least 6 characters.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="mp-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg bg-[#0a0f1d] border border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-cyan-500/20 bg-gradient-to-r from-cyan-950/40 via-slate-900 to-indigo-950/40 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-inner">
              <Users className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 id="mp-modal-title" className="text-base font-bold text-white tracking-wide">
                Enter Multiplayer World
              </h2>
              <p className="text-xs text-cyan-300/80">3DWorld — Virtual Universe</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close multiplayer dialog"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-white/10 bg-slate-950/60 p-1.5 gap-1 shrink-0">
          <button
            type="button"
            onClick={() => {
              setAuthTab('guest');
              setErrorMsg('');
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              authTab === 'guest'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Guest Play
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthTab('signin');
              setErrorMsg('');
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              authTab === 'signin'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthTab('signup');
              setErrorMsg('');
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              authTab === 'signup'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            Register
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto p-5 space-y-4">
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-950/50 border border-red-500/40 text-red-200 text-xs animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Avatar Customization Preview */}
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5 space-y-3">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Avatar Customization
            </label>

            {/* Display Name Input */}
            <div>
              <span className="text-[11px] text-slate-400 block mb-1">Display Name</span>
              <input
                type="text"
                maxLength={24}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your village name"
                className="w-full px-3 py-2 rounded-lg bg-black/40 border border-slate-700 focus:border-cyan-400 focus:outline-none text-sm text-white placeholder-slate-500 transition-colors"
                required
              />
            </div>

            {/* Color Palette */}
            <div>
              <span className="text-[11px] text-slate-400 block mb-1.5">Avatar Color</span>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {AVATAR_COLORS.map((col) => {
                  const isSelected = selectedColor === col.id;
                  return (
                    <button
                      key={col.id}
                      type="button"
                      onClick={() => setSelectedColor(col.id)}
                      title={col.label}
                      className={`h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer relative border ${
                        isSelected
                          ? 'border-white scale-105 shadow-md shadow-cyan-500/20 ring-2 ring-cyan-400/50'
                          : 'border-white/10 hover:border-white/40'
                      }`}
                      style={{ backgroundColor: col.hex }}
                    >
                      {isSelected && <Check className="w-4 h-4 text-white drop-shadow" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Avatar Style Outfit */}
            <div>
              <span className="text-[11px] text-slate-400 block mb-1.5">Avatar Outfit Style</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {AVATAR_STYLES.map((sty) => {
                  const isSelected = selectedStyle === sty.id;
                  const Icon =
                    sty.id === 'explorer'
                      ? Compass
                      : sty.id === 'builder'
                      ? Hammer
                      : sty.id === 'cyber'
                      ? Sparkles
                      : User;
                  return (
                    <button
                      key={sty.id}
                      type="button"
                      onClick={() => setSelectedStyle(sty.id)}
                      className={`p-2 rounded-lg flex flex-col items-center gap-1 text-center transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-200'
                          : 'bg-black/30 border-white/5 text-slate-400 hover:border-white/20 hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-xs font-medium">{sty.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Form based on selected Auth Tab */}
          {authTab === 'guest' && (
            <form onSubmit={handleGuestJoin} className="space-y-3">
              <p className="text-xs text-slate-400 leading-relaxed">
                Play immediately without registering an account. You will spawn into the live 3D village and be able to see other online residents and walk together.
              </p>
              <button
                type="submit"
                disabled={isLoading || !displayName.trim()}
                className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Connecting to Village...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Enter Village as Guest
                  </>
                )}
              </button>
            </form>
          )}

          {authTab === 'signin' && (
            <form onSubmit={handleEmailSignIn} className="space-y-3">
              <div>
                <span className="text-[11px] text-slate-400 block mb-1">Email Address</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full px-3 py-2 rounded-lg bg-black/40 border border-slate-700 focus:border-cyan-400 focus:outline-none text-sm text-white placeholder-slate-500"
                  required
                />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block mb-1">Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-lg bg-black/40 border border-slate-700 focus:border-cyan-400 focus:outline-none text-sm text-white placeholder-slate-500"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isLoading || !email || !password}
                className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    Sign In & Enter
                  </>
                )}
              </button>
            </form>
          )}

          {authTab === 'signup' && (
            <form onSubmit={handleEmailSignUp} className="space-y-3">
              <div>
                <span className="text-[11px] text-slate-400 block mb-1">Email Address</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full px-3 py-2 rounded-lg bg-black/40 border border-slate-700 focus:border-cyan-400 focus:outline-none text-sm text-white placeholder-slate-500"
                  required
                />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block mb-1">Password (min 6 characters)</span>
                <input
                  type="password"
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-lg bg-black/40 border border-slate-700 focus:border-cyan-400 focus:outline-none text-sm text-white placeholder-slate-500"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isLoading || !email || password.length < 6}
                className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Create Account & Enter
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Footer info */}
        <div className="px-5 py-3 border-t border-white/10 bg-slate-950 text-center text-[11px] text-slate-400 shrink-0">
          Real-time synchronized virtual world • Powered by Firebase Firestore & Auth
        </div>
      </div>
    </div>
  );
};
