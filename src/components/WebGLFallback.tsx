import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export const WebGLFallback: React.FC = () => {
  return (
    <div className="fixed inset-0 z-50 bg-[#060913] flex flex-col items-center justify-center p-6 text-center text-white">
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-6">
        <AlertTriangle className="w-10 h-10" />
      </div>

      <h1 className="font-display font-bold text-2xl sm:text-3xl mb-3">
        WebGL Acceleration Required
      </h1>

      <p className="text-slate-300 text-sm max-w-md leading-relaxed mb-6">
        3DWorld relies on hardware-accelerated 3D WebGL graphics to render real-time floating islands, dynamic lighting, and procedural landmarks.
      </p>

      <div className="p-4 rounded-xl glass-panel border border-white/10 text-xs text-slate-400 max-w-md text-left mb-6 space-y-2">
        <p className="font-semibold text-slate-200">To enable WebGL in your browser:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Check that hardware acceleration is enabled in browser settings</li>
          <li>Ensure your graphic drivers are up to date</li>
          <li>Try restarting your browser or opening in Chrome / Edge / Firefox</li>
        </ul>
      </div>

      <button
        onClick={() => window.location.reload()}
        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs tracking-wider transition-colors cursor-pointer"
      >
        <RefreshCw className="w-4 h-4" />
        <span>Reload 3DWorld</span>
      </button>
    </div>
  );
};
