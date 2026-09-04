import { useEffect, type ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export default function Modal({ open, onClose, title, children }: ModalProps) {
  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={onClose} />
      {/* Panel — full screen on mobile, centered card on desktop */}
      <div className="relative bg-white shadow-2xl w-full max-w-2xl overflow-y-auto z-10
                      rounded-t-2xl sm:rounded-xl
                      max-h-[92vh] sm:max-h-[85vh]
                      p-4 sm:p-6">
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between mb-4 pb-2 border-b border-gray-100 -mx-4 sm:-mx-6 px-4 sm:px-6 pt-1">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 pr-4 truncate">{title}</h2>
          <button
            onClick={onClose}
            className="shrink-0 p-2 -mr-2 rounded-lg hover:bg-gray-100 text-gray-500 min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
