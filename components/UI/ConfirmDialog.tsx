"use client";
import React, { useEffect } from 'react';
import Button from './Button';

interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  message?: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  loading = false,
}) => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onCancel();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] animate-fade-in">
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-sm rounded-xl bg-white shadow-xl border border-gray-200 overflow-hidden animate-scale-in"
      >
        <div className="p-5 space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            {title}
          </h2>
          <div className="text-sm text-gray-600">{message}</div>
          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              size="small"
              className="flex-1"
              onClick={onCancel}
              disabled={loading}
            >
              {cancelText}
            </Button>
            <Button
              variant="danger"
              size="small"
              className={`flex-1 ${loading ? 'animate-pulse' : ''}`}
              onClick={onConfirm}
              disabled={loading}
            >
              {loading ? 'Deleting...' : confirmText}
            </Button>
          </div>
        </div>
      </div>
      <style jsx global>{`
        .animate-fade-in { animation: fadeIn .25s ease-in; }
        .animate-scale-in { animation: scaleIn .25s ease-out; }
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes scaleIn { from { transform: scale(.92); opacity:0 } to { transform: scale(1); opacity:1 } }
      `}</style>
    </div>
  );
};

export default ConfirmDialog;
