import React from 'react';

interface FooterProps {
  cinemaMode?: boolean;
  onOpenCreator?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ cinemaMode, onOpenCreator }) => {
  if (cinemaMode) return null;

  return (
    <footer
      aria-label="3DWorld Creator Credit"
      className="fixed bottom-0 inset-x-0 z-20 pointer-events-none flex items-center justify-center px-4 py-1.5 sm:py-2 bg-[#060913]/90 backdrop-blur-md border-t border-white/10"
    >
      <p className="pointer-events-auto text-[11px] sm:text-xs font-mono text-slate-400 text-center tracking-wide">
        © 2026 3DWorld. Created by{' '}
        {onOpenCreator ? (
          <button
            onClick={onOpenCreator}
            title="View About the Creator - Shahanur Mollah"
            aria-label="View About the Creator - Shahanur Mollah"
            className="text-teal-400 font-semibold tracking-normal hover:text-teal-300 hover:underline underline-offset-2 transition-colors cursor-pointer inline-flex items-center gap-1"
          >
            <span>Shahanur Mollah</span>
          </button>
        ) : (
          <span className="text-teal-400 font-semibold tracking-normal">
            Shahanur Mollah
          </span>
        )}
        .
      </p>
    </footer>
  );
};
