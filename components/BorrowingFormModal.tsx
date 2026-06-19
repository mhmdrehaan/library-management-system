'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FiTrash2, FiPlus, FiUser, FiBookOpen, FiCalendar, FiLoader } from 'react-icons/fi';
import Modal from '@/components/Modal';
import { useState } from 'react';

// ==================== Schema ====================

const bookItemSchema = z.object({
  book_id: z.string().min(1, 'Pilih buku terlebih dahulu'),
  quantity: z.number().int().positive('Jumlah harus lebih dari 0'),
});

const borrowingSchema = z.object({
  member_id: z.string().min(1, 'Pilih anggota terlebih dahulu'),
  books: z.array(bookItemSchema).min(1, 'Minimal satu buku harus dipilih'),
  due_date: z.string().min(1, 'Tanggal jatuh tempo harus diisi'),
});

type BorrowingFormData = z.infer<typeof borrowingSchema>;

// ==================== Types ====================

interface Member {
  id: number;
  name: string;
}

interface Book {
  id: number;
  title: string;
  stock: number;
}

interface BorrowingFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: BorrowingFormData) => Promise<void>;
  members: Member[];
  books: Book[];
  initialData?: Partial<BorrowingFormData> | null;
  loading: boolean;
}

// ==================== Component ====================

export default function BorrowingFormModal({
  isOpen,
  onClose,
  onSubmit,
  members,
  books,
  initialData = null,
  loading,
}: BorrowingFormModalProps): React.ReactElement {
  const [localError, setLocalError] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    control,
  } = useForm<BorrowingFormData>({
    resolver: zodResolver(borrowingSchema),
    defaultValues: {
      member_id: initialData?.member_id || '',
      books: initialData?.books || [{ book_id: '', quantity: 1 }],
      due_date:
        initialData?.due_date ||
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
  });

  const watchedBooks = watch('books');
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'books',
  });

  const handleAddBook = (): void => {
    append({ book_id: '', quantity: 1 });
  };

  const handleRemoveBook = (indexToRemove: number): void => {
    if (watchedBooks.length <= 1) return;
    remove(indexToRemove);
  };

  const onSubmitForm = async (data: BorrowingFormData): Promise<void> => {
    setLocalError('');

    // Validasi stok sebelum submit
    const booksData = data.books;
    const booksMap = new Map(books.map((b) => [b.id.toString(), b]));

    for (const bookItem of booksData) {
      const bookInfo = booksMap.get(bookItem.book_id);
      if (bookInfo && bookItem.quantity > bookInfo.stock) {
        setLocalError(
          `Stok buku "${bookInfo.title}" tidak mencukupi. Tersedia: ${bookInfo.stock}, Diminta: ${bookItem.quantity}.`
        );
        return;
      }
    }

    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Error submitting borrowing:', error);
      let errorMsg = 'Gagal menyimpan transaksi peminjaman.';
      if (error instanceof Error) {
        if ('response' in error) {
          const response = (error as Record<string, unknown>).response;
          if (response && typeof response === 'object' && 'data' in response) {
            const data = (response as Record<string, unknown>).data;
            if (data && typeof data === 'object' && 'message' in data) {
              errorMsg = String(data.message);
            }
          }
        }
      }
      setLocalError(errorMsg);
    }
  };

  const handleClose = (): void => {
    if (!loading) {
      setLocalError('');
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={initialData ? 'Edit Peminjaman' : 'Buat Peminjaman Baru'}
    >
      <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-5">
        {/* Dropdown Member */}
        <div>
          <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5">
            <FiUser className="text-gray-400" /> Anggota Peminjam
          </label>
          <select
            {...register('member_id')}
            className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-all ${
              errors.member_id
                ? 'border-red-300 focus:ring-red-100'
                : 'border-gray-300 focus:ring-blue-500/20'
            }`}
            disabled={loading}
          >
            <option value="">-- Pilih Anggota --</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
          {errors.member_id && (
            <p className="mt-1 text-xs text-red-500 font-medium">{errors.member_id.message}</p>
          )}
        </div>

        {/* Dynamic Multiple Items Fields Section */}
        <div className="bg-gray-50/50 border border-gray-100 p-4 rounded-xl space-y-3">
          <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1">
            <FiBookOpen className="text-gray-400" /> Daftar Buku Terpilih
          </label>

          {fields.map((field, index) => {
            const selectedBook = books.find((b) => b.id === parseInt(watchedBooks[index]?.book_id));
            const availableStock = selectedBook ? selectedBook.stock : 0;

            return (
              <div key={field.id} className="flex items-center gap-2">
                {/* Pilihan Buku */}
                <select
                  {...register(`books.${index}.book_id`)}
                  className={`flex-1 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                    errors.books?.[index]?.book_id
                      ? 'border-red-300 focus:ring-red-100'
                      : 'border-gray-300 focus:ring-blue-500/20'
                  }`}
                  disabled={loading}
                >
                  <option value="">-- Pilih Buku --</option>
                  {books
                    .filter((b) => b.stock > 0 || b.id === parseInt(watchedBooks[index]?.book_id))
                    .map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.title} (Sisa: {b.stock})
                      </option>
                    ))}
                </select>

                {/* Kuantitas Jumlah Pinjam */}
                <div className="w-24 relative">
                  <input
                    type="number"
                    min="1"
                    max={availableStock || undefined}
                    {...register(`books.${index}.quantity`, { valueAsNumber: true })}
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 text-center transition-all ${
                      errors.books?.[index]?.quantity
                        ? 'border-red-300 focus:ring-red-100'
                        : 'border-gray-300 focus:ring-blue-500/20'
                    }`}
                    placeholder="Jml"
                    disabled={loading}
                  />
                </div>

                {/* Tombol Hapus Baris */}
                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveBook(index)}
                    className="p-2 text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100 rounded-lg transition-colors disabled:opacity-50"
                    title="Hapus baris buku"
                    disabled={loading}
                  >
                    <FiTrash2 size={16} />
                  </button>
                )}
              </div>
            );
          })}

          <button
            type="button"
            onClick={handleAddBook}
            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold pt-1 transition-colors disabled:opacity-50"
            disabled={loading}
          >
            <FiPlus /> Tambah Alokasi Buku Lainnya
          </button>
        </div>

        {/* Tanggal Jatuh Tempo */}
        <div>
          <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5">
            <FiCalendar className="text-gray-400" /> Tanggal Batas Pengembalian
          </label>
          <input
            type="date"
            {...register('due_date')}
            className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-all ${
              errors.due_date
                ? 'border-red-300 focus:ring-red-100'
                : 'border-gray-300 focus:ring-blue-500/20'
            }`}
            disabled={loading}
          />
          {errors.due_date && (
            <p className="mt-1 text-xs text-red-500 font-medium">{errors.due_date.message}</p>
          )}
        </div>

        {/* Tampilkan error lokal di sini */}
        {localError && (
          <div className="p-2.5 bg-red-50 border border-red-100 text-red-600 rounded-lg text-xs font-medium">
            {localError}
          </div>
        )}

        {/* Aksi Form */}
        <div className="flex gap-3 pt-3 border-t border-gray-100">
          <button
            type="button"
            onClick={() => {
              setLocalError('');
              handleClose();
            }}
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
              'Simpan Transaksi'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
