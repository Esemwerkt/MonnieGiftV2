'use client';

import { ReactNode } from 'react';

interface CancelConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: ReactNode;
  message?: string;
  confirmText?: string;
  cancelText?: string;
}

export function CancelConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message = "Al je gegevens gaan verloren",
  confirmText = "Annuleren",
  cancelText = "Doorgaan",
}: CancelConfirmationModalProps) {
  if (!isOpen) return null;

  // Default title with bold "annuleren"
  const defaultTitle = (
    <>
      Weet je zeker dat je wilt <strong>annuleren</strong>?
    </>
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white border border-input rounded-2xl p-6 space-y-6 shadow-lg">
        <div className="space-y-4">
          <h2 className="text-2xl text-center md:text-2xl text-[#0a3530] leading-tight">
            {title || defaultTitle}
          </h2>
          <p className="text-lg text-center md:text-base text-[#0a3530]/70 leading-relaxed">
            {message}
          </p>

          <div className="flex flex-col gap-3 pt-2">
            <button
              onClick={onClose}
              className="w-full h-14 rounded-full bg-[#c8f196] text-[#0a3530] text-base md:text-lg font-normal hover:bg-[#c8f196]/90 transition-all duration-200"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="w-full h-14 rounded-full border-2 border-[#0a3530] bg-transparent text-[#0a3530] text-base md:text-lg font-normal hover:bg-[#0a3530]/10 transition-all duration-200"
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

