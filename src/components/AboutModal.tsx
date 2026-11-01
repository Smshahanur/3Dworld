import React from 'react';
import { X, Sparkles, Box, Cpu, Eye, ShieldCheck, ArrowLeft, Globe } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/60 pointer-events-auto backdrop-blur-[3px] transition-opacity"
      />

      {/* Modal Dialog */}
      <section
        id="about"
        role="dialog"
        aria-labelledby="about-title"
        aria-modal="true"
        className="relative pointer-events-auto w-full max-w-2xl bg-[#090e1a]/95 border border-white/15 rounded-2xl shadow-2xl p-6 sm:p-8 overflow-y-auto max-h-[90vh] text-left"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-500 p-[1.5px] shadow-lg shadow-cyan-500/20">
              <div className="w-full h-full bg-[#060913] rounded-[10px] flex items-center justify-center">
                <Globe className="w-5 h-5 text-cyan-300" />
              </div>
            </div>
            <div>
              <h2 id="about-title" className="font-display font-extrabold text-2xl text-white">
                About 3DWorld
              </h2>
              <div className="text-xs font-mono text-cyan-400">
                Interactive Virtual-World Experience
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close About 3DWorld"
            className="p-2 rounded-xl glass-panel hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Introduction */}
        <div className="py-5 space-y-3.5 text-sm sm:text-base text-slate-300 leading-relaxed border-b border-white/10">
          <p>
            <strong className="text-white font-semibold">3DWorld</strong> is an interactive virtual-world experience created by <span className="text-cyan-400 font-semibold">Shahanur Mollah</span>. Explore imaginative landscapes, floating islands, crystal formations, futuristic architecture, and immersive 3D environments.
          </p>
          <p className="text-slate-400 text-xs sm:text-sm">
            Experience a spacious, modern village complete with connected neighborhoods, civic plazas, outdoor cafés, contemporary residential villas, lush public parks, botanical conservatories, and scenic lakeside promenades.
          </p>
          <p className="text-slate-400 text-xs sm:text-sm">
            Powered by modern WebGL, Three.js, and procedural rendering mathematics, 3DWorld delivers a living universe with real 3D geometry, responsive mouse and touch navigation, procedural sound synthesis, and zero external asset dependencies.
          </p>
        </div>

        {/* Feature Highlights Grid */}
        <div className="py-5">
          <div className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Core Experience Highlights</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="p-3.5 rounded-xl glass-panel border border-white/10">
              <div className="flex items-center gap-2 mb-1.5">
                <Box className="w-4 h-4 text-cyan-400" />
                <h3 className="font-semibold text-sm text-white">100% Real 3D Geometry</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Every cliff face, pagoda roof, crystal geode, and tower is assembled from hierarchical procedural meshes with physical PBR materials.
              </p>
            </div>

            <div className="p-3.5 rounded-xl glass-panel border border-white/10">
              <div className="flex items-center gap-2 mb-1.5">
                <Eye className="w-4 h-4 text-indigo-400" />
                <h3 className="font-semibold text-sm text-white">Five Connected Districts</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Journey between Town Center, Residential District, Central Park, Botanical Garden, and Lake District.
              </p>
            </div>

            <div className="p-3.5 rounded-xl glass-panel border border-white/10">
              <div className="flex items-center gap-2 mb-1.5">
                <Cpu className="w-4 h-4 text-purple-400" />
                <h3 className="font-semibold text-sm text-white">Adaptive Hardware Engine</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Automatic software WebGL detection, dynamic pixel ratio scaling, touch damping, and responsive controls for all mobile and desktop devices.
              </p>
            </div>

            <div className="p-3.5 rounded-xl glass-panel border border-white/10">
              <div className="flex items-center gap-2 mb-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <h3 className="font-semibold text-sm text-white">Zero-Asset Reliability</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                All textures, shaders, ambient audio chords, and environmental particles are synthesized locally in code with zero missing 404 risks.
              </p>
            </div>
          </div>
        </div>

        {/* Semantic Footer & Return Button */}
        <footer className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/10">
          <div className="text-xs font-mono text-slate-400">
            © 2026 3DWorld. Created by <span className="text-cyan-400 font-semibold">Shahanur Mollah</span>.
          </div>

          <button
            onClick={onClose}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-semibold text-xs sm:text-sm tracking-wide shadow-lg shadow-cyan-500/25 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to 3DWorld</span>
          </button>
        </footer>
      </section>
    </div>
  );
};
