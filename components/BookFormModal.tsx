'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FiLoader } from 'react-icons/fi';
import Modal from '@/components/Modal';
import { useState } from 'react';

// ==================== Schema ====================

const bookSchema = z.object({
  title: z.string().min(1, 'Judul buku wajib diisi'),
  author: z.string().min(1, 'Nama penulis wajib diisi'),
  publisher: z.string().min(1, 'Nama penerbit wajib diisi'),
  category: z.string().optional().or(z.literal('')),
  publication_year: z.preprocess(
    (val) => (typeof val === 'string' ? parseInt(val, 10) : val),
    z.number().int().min(1000, 'Tahun tidak valid').max(new Date().getFullYear(), 'Tahun tidak boleh melebihi tahun aktif')
  ),
  stock: z.preprocess(
    (val) => (typeof val === 'string' ? parseInt(val, 10) : val),
    z.number().int().nonnegative('Stok tidak boleh bernilai negatif')
  ),
});

type BookFormData = z.infer<typeof bookSchema>;

// ==================== Types ====================

interface BookFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: BookFormData) => Promise<void>;
  initialData?: Partial<BookFormData> | null;
  loading: boolean;
}

// ==================== Component ====================

export default function BookFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  loading,
}: BookFormModalProps): React.ReactElement {
  const [errorServer, setErrorServer] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BookFormData>({
    resolver: zodResolver(bookSchema) as any,
    defaultValues: {
      title: initialData?.title || '',
      author: initialData?.author || '',
      publisher: initialData?.publisher || '',
      category: initialData?.category || '',
      publication_year: initialData?.publication_year,
      stock: initialData?.stock,
    },
  });

  const onSubmitForm = async (data: BookFormData): Promise<void> => {
    try {
      setErrorServer('');
      await onSubmit(data);
    } catch (error) {
      console.error('Submission error in BookFormModal:', error);
      const errorMsg =
        error instanceof Error && 'response' in error
          ? (error as any).response?.data?.message ||
            'Gagal menyimpan data ke server.'
          : 'Gagal menyimpan data ke server.';
      setErrorServer(errorMsg);
    }
  };

  const handleClose = (): void => {
    if (!loading) {
      setErrorServer('');
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={initialData ? 'Edit Buku' : 'Tambah Buku'}>
      {/* Tampilkan error server jika ada */}
      {errorServer && (
        <div className="mb-4 p-2.5 bg-red-50 border border-red-100 text-red-600 rounded-lg text-xs font-medium">
          {errorServer}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
        {/* JUDUL BUKU */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
            Judul Buku
          </label>
          <input
            {...register('title')}
            type="text"
            className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all ${
              errors.title
                ? 'border-red-300 focus:ring-red-100'
                : 'border-gray-300 focus:ring-blue-500/20'
            }`}
            disabled={loading}
          />
          {errors.title && (
            <p className="mt-1 text-xs text-red-500 font-medium">{errors.title.message}</p>
          )}
        </div>

        {/* PENULIS */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
            Penulis
          </label>
          <input
            {...register('author')}
            type="text"
            className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all ${
              errors.author
                ? 'border-red-300 focus:ring-red-100'
                : 'border-gray-300 focus:ring-blue-500/20'
            }`}
            disabled={loading}
          />
          {errors.author && (
            <p className="mt-1 text-xs text-red-500 font-medium">{errors.author.message}</p>
          )}
        </div>

        {/* PENERBIT & KATEGORI GRID */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
              Penerbit
            </label>
            <input
              {...register('publisher')}
              type="text"
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all ${
                errors.publisher
                  ? 'border-red-300 focus:ring-red-100'
                  : 'border-gray-300 focus:ring-blue-500/20'
              }`}
              disabled={loading}
            />
            {errors.publisher && (
              <p className="mt-1 text-xs text-red-500 font-medium">
                {errors.publisher.message}
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
              Kategori
            </label>
            <input
              {...register('category')}
              type="text"
              placeholder="Misal: Fiksi, Sains"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm disabled:opacity-50"
              disabled={loading}
            />
          </div>
        </div>

        {/* TAHUN TERBIT & JUMLAH STOK GRID */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
              Tahun Terbit
            </label>
            <input
              {...register('publication_year')}
              type="number"
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all ${
                errors.publication_year
                  ? 'border-red-300 focus:ring-red-100'
                  : 'border-gray-300 focus:ring-blue-500/20'
              }`}
              disabled={loading}
            />
            {errors.publication_year && (
              <p className="mt-1 text-xs text-red-500 font-medium">
                {errors.publication_year.message}
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
              Jumlah Stok
            </label>
            <input
              {...register('stock')}
              type="number"
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all ${
                errors.stock
                  ? 'border-red-300 focus:ring-red-100'
                  : 'border-gray-300 focus:ring-blue-500/20'
              }`}
              disabled={loading}
            />
            {errors.stock && (
              <p className="mt-1 text-xs text-red-500 font-medium">{errors.stock.message}</p>
            )}
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="flex-1 px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center justify-center gap-2 disabled:bg-blue-400"
          >
            {loading ? (
              <>
                <FiLoader className="animate-spin text-base" />
                Menyimpan...
              </>
            ) : (
              'Simpan'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
