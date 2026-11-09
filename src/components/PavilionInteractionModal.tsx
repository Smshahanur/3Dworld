import React from 'react';
import { PavilionInteractionPoint } from '../world/creatorPavilionInterior';

interface PavilionInteractionModalProps {
  point: PavilionInteractionPoint | null;
  isOpen: boolean;
  onClose: () => void;
  onTeleportRooftop?: () => void;
  onTeleportGround?: () => void;
  onExitPavilion?: () => void;
  isRooftopActive?: boolean;
}

export const PavilionInteractionModal: React.FC<PavilionInteractionModalProps> = ({
  point,
  isOpen,
  onClose,
  onTeleportRooftop,
  onTeleportGround,
  onExitPavilion,
  isRooftopActive = false,
}) => {
  if (!isOpen || !point) return null;

  const handleAction = () => {
    if (point.id === 'rooftop') {
      if (isRooftopActive) {
        onTeleportGround?.();
      } else {
        onTeleportRooftop?.();
      }
      onClose();
    } else if (point.id === 'exit') {
      onExitPavilion?.();
      onClose();
    } else if (point.actionUrl) {
      window.open(point.actionUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const getCategoryTheme = (cat: PavilionInteractionPoint['category']) => {
    switch (cat) {
      case 'Workstation':
        return {
          bg: 'bg-cyan-500/10',
          text: 'text-cyan-400',
          border: 'border-cyan-500/30',
          gradient: 'from-cyan-500 to-teal-400',
          glow: 'shadow-cyan-500/20',
        };
      case 'Showcase':
        return {
          bg: 'bg-emerald-500/10',
          text: 'text-emerald-400',
          border: 'border-emerald-500/30',
          gradient: 'from-teal-400 to-emerald-400',
          glow: 'shadow-emerald-500/20',
        };
      case 'Creator':
        return {
          bg: 'bg-teal-500/10',
          text: 'text-teal-300',
          border: 'border-teal-500/30',
          gradient: 'from-teal-400 to-cyan-400',
          glow: 'shadow-teal-500/25',
        };
      case 'Rooftop':
        return {
          bg: 'bg-sky-500/10',
          text: 'text-sky-400',
          border: 'border-sky-500/30',
          gradient: 'from-sky-400 to-blue-500',
          glow: 'shadow-sky-500/20',
        };
      default:
        return {
          bg: 'bg-teal-500/10',
          text: 'text-teal-400',
          border: 'border-teal-500/30',
          gradient: 'from-teal-400 to-cyan-500',
          glow: 'shadow-teal-500/20',
        };
    }
  };

  const theme = getCategoryTheme(point.category);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pavilion-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-[#091720]/95 border border-teal-500/30 shadow-2xl shadow-teal-950/60 p-6 md:p-8 max-h-[90vh] flex flex-col justify-between"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle decorative background ambient glow */}
        <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="relative z-10 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wider uppercase border ${theme.bg} ${theme.text} ${theme.border}`}
              >
                {point.category}
              </span>
              <span className="text-xs text-teal-400/60 font-mono">
                Creator Studio Interior
              </span>
            </div>
            <h2
              id="pavilion-modal-title"
              className="text-xl md:text-2xl font-bold text-white tracking-tight leading-snug"
            >
              {point.title}
            </h2>
            <p className="text-xs md:text-sm text-teal-300/80 mt-0.5">
              {point.subtitle}
            </p>
          </div>

          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-2 -mr-2 -mt-2 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="relative z-10 my-5 space-y-4 overflow-y-auto pr-1 text-sm text-slate-300">
          {/* Creator Portrait Highlight if on portrait point */}
          {point.id === 'portrait' && (
            <div className="flex items-center gap-4 p-3 rounded-2xl bg-teal-950/40 border border-teal-500/20">
              <img
                src="/assets/aistudio/20261104_090030_5aeb97d7.jpg"
                alt="Shahanur Mollah"
                className="w-16 h-16 rounded-full object-cover border-2 border-teal-400 shadow-md shadow-teal-500/30"
              />
              <div>
                <div className="font-bold text-white text-base">Shahanur Mollah</div>
                <div className="text-xs text-teal-400 font-medium">Creator & Developer of 3DWorld</div>
                <div className="text-xs text-slate-400 mt-0.5">@shahanurmollah__</div>
              </div>
            </div>
          )}

          {/* Main Description */}
          <p className="leading-relaxed text-slate-200">
            {point.description}
          </p>

          {/* Details list */}
          {point.details && point.details.length > 0 && (
            <div className="space-y-2 pt-1">
              <div className="text-xs font-semibold tracking-wider uppercase text-teal-400">
                Exhibit Features & Architecture
              </div>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {point.details.map((detail, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-teal-400 mt-1 font-bold">▪</span>
                    <span className="leading-normal">{detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Metrics Grid */}
          {point.metrics && point.metrics.length > 0 && (
            <div className="grid grid-cols-2 gap-2 pt-2">
              {point.metrics.map((m, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-white/[0.04] border border-white/5 flex flex-col justify-between"
                >
                  <span className="text-[10px] uppercase tracking-wider text-slate-400">
                    {m.label}
                  </span>
                  <span className="text-xs font-semibold text-teal-300 mt-0.5">
                    {m.value}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="relative z-10 pt-3 border-t border-white/10 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            Continue Exploring
          </button>

          {(point.actionLabel || point.actionUrl || point.id === 'rooftop' || point.id === 'exit') && (
            <button
              onClick={handleAction}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r ${theme.gradient} hover:opacity-95 shadow-md ${theme.glow} transition-all cursor-pointer`}
            >
              {point.id === 'rooftop' ? (
                isRooftopActive ? (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                    <span>Descend to Ground Studio</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                    <span>Ascend to Rooftop Deck</span>
                  </>
                )
              ) : point.id === 'exit' ? (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Step Outside to Gardens</span>
                </>
              ) : (
                <>
                  {point.actionLabel || 'Learn More'}
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
