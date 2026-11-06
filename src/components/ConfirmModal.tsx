import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = true,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150 select-none"
    >
      <div className="relative w-full max-w-sm rounded-2xl bg-[#080d1a] border border-red-500/30 shadow-2xl p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-950/60 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
            <AlertTriangle className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">{title}</h3>
            <p className="text-xs text-slate-400 mt-0.5">{message}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2 px-3 rounded-xl border border-white/10 hover:bg-white/5 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md ${
              isDestructive
                ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-950/50'
                : 'bg-cyan-500 hover:bg-cyan-400 text-black'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
