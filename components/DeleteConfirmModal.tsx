interface DeleteConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  message?: string;
}

export function DeleteConfirmModal({
  isOpen,
  onConfirm,
  onCancel,
  message = 'Yakin ingin menghapus peminjaman ini?',
}: DeleteConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm mx-4">
        <div className="flex flex-col items-center text-center gap-4">
          {/* Icon */}
          <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-7 h-7 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-800">Konfirmasi Hapus</h3>
            <p className="text-sm text-gray-500 mt-1">{message}</p>
          </div>

          <div className="flex gap-3 w-full">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Batal
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
            >
              Hapus
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}