import React, { useEffect, useRef } from 'react';
import { AlertCircle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Ya, Lanjutkan',
  cancelLabel = 'Batal',
  isDestructive = true,
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      confirmBtnRef.current?.focus();
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && !isLoading) {
          onCancel();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, isLoading, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-sm"
    >
      <div className="bg-surface rounded-xl border border-border shadow-xl max-w-md w-full overflow-hidden p-6 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start gap-4">
          <div
            className={`p-2.5 rounded-full flex-shrink-0 ${
              isDestructive ? 'bg-red-50 text-danger' : 'bg-sage-100 text-sage-700'
            }`}
          >
            <AlertCircle className="w-6 h-6" />
          </div>

          <div className="flex-1">
            <h3 id="confirm-dialog-title" className="text-lg font-bold text-ink">
              {title}
            </h3>
            <p className="mt-2 text-sm text-muted leading-relaxed">{message}</p>
          </div>

          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="text-muted hover:text-ink p-1 rounded focus:outline-none focus:ring-2 focus:ring-sage-500"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-border">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-ink-soft hover:bg-canvas rounded-lg border border-border transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>

          <button
            ref={confirmBtnRef}
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-sm font-semibold rounded-lg text-white shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2 ${
              isDestructive
                ? 'bg-danger hover:bg-red-700 focus:ring-2 focus:ring-danger'
                : 'bg-magenta-500 hover:bg-magenta-700 focus:ring-2 focus:ring-magenta-500'
            }`}
          >
            {isLoading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
