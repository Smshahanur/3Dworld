import React, { useRef, useState, useEffect } from 'react';
import { ArrowUp, Zap, Target } from 'lucide-react';

interface VirtualJoystickProps {
  onMove: (forward: number, strafe: number) => void;
  onLook?: (dx: number, dy: number) => void;
  onJump?: () => void;
  onSprintToggle?: () => void;
  onCenterCamera?: () => void;
}

export const VirtualJoystick: React.FC<VirtualJoystickProps> = ({
  onMove,
  onLook,
  onJump,
  onSprintToggle,
  onCenterCamera,
}) => {
  const joystickContainerRef = useRef<HTMLDivElement>(null);
  const lookAreaRef = useRef<HTMLDivElement>(null);

  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [isJoystickDragging, setIsJoystickDragging] = useState(false);
  const [isSprinting, setIsSprinting] = useState(false);

  const joystickTouchIdRef = useRef<number | null>(null);
  const lookTouchIdRef = useRef<number | null>(null);
  const lastLookPosRef = useRef<{ x: number; y: number } | null>(null);

  const RADIUS = 42; // Max joystick displacement in pixels

  // ---------------------------------------------------------------------------
  // JOYSTICK TOUCH HANDLERS (Left Screen Area)
  // ---------------------------------------------------------------------------
  const handleJoystickTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (joystickTouchIdRef.current !== null) return;
    const touch = e.changedTouches[0];
    joystickTouchIdRef.current = touch.identifier;
    setIsJoystickDragging(true);
    updateKnob(touch.clientX, touch.clientY);
  };

  const handleJoystickTouchMove = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (joystickTouchIdRef.current === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === joystickTouchIdRef.current) {
        updateKnob(touch.clientX, touch.clientY);
        break;
      }
    }
  };

  const handleJoystickTouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (joystickTouchIdRef.current === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === joystickTouchIdRef.current) {
        joystickTouchIdRef.current = null;
        setIsJoystickDragging(false);
        setKnobPos({ x: 0, y: 0 });
        onMove(0, 0);
        break;
      }
    }
  };

  const updateKnob = (clientX: number, clientY: number) => {
    if (!joystickContainerRef.current) return;
    const rect = joystickContainerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const clampedDist = Math.min(dist, RADIUS);
    const angle = Math.atan2(dy, dx);

    const nx = Math.cos(angle) * clampedDist;
    const ny = Math.sin(angle) * clampedDist;

    setKnobPos({ x: nx, y: ny });

    // Output normalized movement vectors:
    // forward: -ny / RADIUS (since pulling up is negative y in screen coordinates)
    // strafe: nx / RADIUS
    const forward = -ny / RADIUS;
    const strafe = nx / RADIUS;
    onMove(forward, strafe);
  };

  // ---------------------------------------------------------------------------
  // TOUCH-LOOK SWIPE HANDLERS (Right Screen Area)
  // ---------------------------------------------------------------------------
  const handleLookTouchStart = (e: React.TouchEvent) => {
    if (!onLook) return;
    if (lookTouchIdRef.current !== null) return;
    const touch = e.changedTouches[0];
    lookTouchIdRef.current = touch.identifier;
    lastLookPosRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleLookTouchMove = (e: React.TouchEvent) => {
    if (!onLook || lookTouchIdRef.current === null || !lastLookPosRef.current) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === lookTouchIdRef.current) {
        const dx = touch.clientX - lastLookPosRef.current.x;
        const dy = touch.clientY - lastLookPosRef.current.y;
        lastLookPosRef.current = { x: touch.clientX, y: touch.clientY };
        onLook(dx, dy);
        break;
      }
    }
  };

  const handleLookTouchEnd = (e: React.TouchEvent) => {
    if (lookTouchIdRef.current === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === lookTouchIdRef.current) {
        lookTouchIdRef.current = null;
        lastLookPosRef.current = null;
        break;
      }
    }
  };

  return (
    <>
      {/* 1. Left Bottom Movement Joystick */}
      <div className="fixed bottom-6 left-6 z-30 select-none touch-none md:hidden pointer-events-auto">
        <div
          ref={joystickContainerRef}
          onTouchStart={handleJoystickTouchStart}
          onTouchMove={handleJoystickTouchMove}
          onTouchEnd={handleJoystickTouchEnd}
          onTouchCancel={handleJoystickTouchEnd}
          className="w-28 h-28 rounded-full bg-slate-950/75 border-2 border-cyan-500/35 backdrop-blur-md shadow-2xl flex items-center justify-center relative touch-none"
        >
          {/* Direction indicators */}
          <span className="absolute top-2 text-[10px] text-cyan-400/60 font-bold">W</span>
          <span className="absolute bottom-2 text-[10px] text-cyan-400/60 font-bold">S</span>
          <span className="absolute left-2 text-[10px] text-cyan-400/60 font-bold">A</span>
          <span className="absolute right-2 text-[10px] text-cyan-400/60 font-bold">D</span>

          {/* Outer ring */}
          <div className="w-16 h-16 rounded-full border border-cyan-500/20 pointer-events-none" />

          {/* Joystick Thumb Knob */}
          <div
            style={{
              transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
              transition: isJoystickDragging ? 'none' : 'transform 0.15s ease-out',
            }}
            className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 border border-white/60 shadow-lg shadow-cyan-500/40 pointer-events-none flex items-center justify-center"
          >
            <div className="w-4 h-4 rounded-full bg-white/40" />
          </div>
        </div>
        <div className="text-[10px] text-center text-slate-300 mt-1.5 font-semibold">
          Move
        </div>
      </div>

      {/* 2. Right Screen Touch-Look Swipe Area (Mobile Camera Orbit) */}
      {onLook && (
        <div
          ref={lookAreaRef}
          onTouchStart={handleLookTouchStart}
          onTouchMove={handleLookTouchMove}
          onTouchEnd={handleLookTouchEnd}
          onTouchCancel={handleLookTouchEnd}
          className="fixed bottom-24 right-4 w-44 h-44 z-20 touch-none md:hidden pointer-events-auto rounded-3xl bg-slate-950/30 border border-cyan-500/20 backdrop-blur-[2px] flex items-center justify-center select-none"
        >
          <span className="text-[10px] uppercase font-mono tracking-wider text-cyan-300/40 pointer-events-none">
            Swipe to Look
          </span>
        </div>
      )}

      {/* 3. Action Buttons: Jump, Run & Center Camera (Right Side) */}
      {(onJump || onSprintToggle || onCenterCamera) && (
        <div className="fixed bottom-6 right-6 z-30 flex items-center gap-2.5 md:hidden pointer-events-auto select-none">
          {onCenterCamera && (
            <button
              onClick={onCenterCamera}
              title="Center Camera behind Avatar"
              aria-label="Center Camera"
              className="w-11 h-11 rounded-full bg-slate-900/80 border border-cyan-400/30 text-cyan-300 flex items-center justify-center shadow-lg active:scale-95 transition-transform"
            >
              <Target className="w-4 h-4" />
            </button>
          )}

          {onSprintToggle && (
            <button
              onClick={() => {
                setIsSprinting((prev) => !prev);
                onSprintToggle();
              }}
              title="Toggle Sprint Mode"
              aria-label="Toggle Sprint"
              className={`w-12 h-12 rounded-full border flex items-center justify-center shadow-lg active:scale-95 transition-all ${
                isSprinting
                  ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-amber-500/30 font-bold'
                  : 'bg-slate-900/80 border-white/20 text-slate-200'
              }`}
            >
              <Zap className="w-4 h-4" />
            </button>
          )}

          {onJump && (
            <button
              onClick={onJump}
              title="Jump"
              aria-label="Jump"
              className="w-14 h-14 rounded-full bg-gradient-to-tr from-cyan-500 to-emerald-400 border border-white text-slate-950 font-extrabold flex items-center justify-center shadow-xl shadow-cyan-500/30 active:scale-90 transition-transform"
            >
              <ArrowUp className="w-6 h-6 stroke-[3]" />
            </button>
          )}
        </div>
      )}
    </>
  );
};
