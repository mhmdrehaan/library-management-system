'use client';

import { useEffect } from 'react';
import { FiX } from 'react-icons/fi';

// ==================== Types ====================

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

// ==================== Helpers ====================

const cn = (...classes: (string | boolean | undefined)[]): string =>
  classes.filter(Boolean).join(' ');

// ==================== Component ====================

export default function Modal({ isOpen, onClose, title, children }: ModalProps): React.ReactElement | null {
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    const handleClickOutside = (e: MouseEvent): void => {
      if (e.target === e.currentTarget) onClose();
    };

    window.addEventListener('keydown', handleEscape);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50'
      )}
    >
      <div
        className={cn(
          'bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-gray-100 relative z-10'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4 border-b border-gray-200 pb-2">
          <h2 className={cn('text-xl font-bold text-gray-800')}>{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
            aria-label="Tutup"
          >
            <FiX size={18} />
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}
