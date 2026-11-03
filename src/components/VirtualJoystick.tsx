import React, { useRef, useState, useEffect } from 'react';

interface VirtualJoystickProps {
  onMove: (forward: number, strafe: number) => void;
}

export const VirtualJoystick: React.FC<VirtualJoystickProps> = ({ onMove }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const touchIdRef = useRef<number | null>(null);

  const RADIUS = 40; // Max displacement in pixels

  const handleTouchStart = (e: React.TouchEvent) => {
    if (touchIdRef.current !== null) return;
    const touch = e.changedTouches[0];
    touchIdRef.current = touch.identifier;
    setIsDragging(true);
    updateKnob(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchIdRef.current === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === touchIdRef.current) {
        updateKnob(touch.clientX, touch.clientY);
        break;
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchIdRef.current === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === touchIdRef.current) {
        touchIdRef.current = null;
        setIsDragging(false);
        setKnobPos({ x: 0, y: 0 });
        onMove(0, 0);
        break;
      }
    }
  };

  const updateKnob = (clientX: number, clientY: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
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
    // forward: -ny / RADIUS (since pulling up is negative y in screen coords)
    // strafe: nx / RADIUS
    const forward = -ny / RADIUS;
    const strafe = nx / RADIUS;
    onMove(forward, strafe);
  };

  return (
    <div className="fixed bottom-6 left-6 z-30 select-none touch-none md:hidden pointer-events-auto">
      <div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        className="w-28 h-28 rounded-full bg-slate-950/70 border-2 border-cyan-500/30 backdrop-blur-md shadow-2xl flex items-center justify-center relative touch-none"
      >
        {/* Direction indicators */}
        <span className="absolute top-2 text-[10px] text-cyan-400/50 font-bold">W</span>
        <span className="absolute bottom-2 text-[10px] text-cyan-400/50 font-bold">S</span>
        <span className="absolute left-2 text-[10px] text-cyan-400/50 font-bold">A</span>
        <span className="absolute right-2 text-[10px] text-cyan-400/50 font-bold">D</span>

        {/* Outer subtle ring */}
        <div className="w-16 h-16 rounded-full border border-cyan-500/20 pointer-events-none" />

        {/* Joystick Thumb Knob */}
        <div
          style={{
            transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
            transition: isDragging ? 'none' : 'transform 0.15s ease-out',
          }}
          className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 border border-white/60 shadow-lg shadow-cyan-500/40 pointer-events-none flex items-center justify-center"
        >
          <div className="w-4 h-4 rounded-full bg-white/40" />
        </div>
      </div>
      <div className="text-[10px] text-center text-slate-400 mt-1.5 font-medium">
        Move Avatar
      </div>
    </div>
  );
};
