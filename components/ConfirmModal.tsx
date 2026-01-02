'use client';

import { useEffect, useCallback } from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning';
  isLoading?: boolean;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Supprimer',
  cancelText = 'Annuler',
  onConfirm,
  onCancel,
  variant = 'danger',
  isLoading = false,
}: ConfirmModalProps) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && !isLoading) {
      onCancel();
    }
  }, [onCancel, isLoading]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const confirmButtonClass = variant === 'danger'
    ? 'bg-red-500 hover:bg-red-600 text-white'
    : 'bg-amber-500 hover:bg-amber-600 text-black';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
        onClick={!isLoading ? onCancel : undefined}
      />

      {/* Modal */}
      <div className="relative bg-[#141414] border border-[#27272a] rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl animate-scale-in">
        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
        <p className="text-[#a1a1aa] mb-6">{message}</p>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 bg-[#27272a] text-white rounded-lg hover:bg-[#3f3f46] transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2 ${confirmButtonClass}`}
          >
            {isLoading && (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            )}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
