'use client';

import { useCallback, useEffect, useState } from 'react';
import { FiCheck, FiUser, FiAlertCircle } from 'react-icons/fi';
import api from '@/lib/api';
import Modal from '@/components/Modal';

// ==================== Types ====================

interface Borrowing {
  borrowing_id: number;
  member_name: string;
  borrow_date: string;
  due_date: string;
  status: 'borrowed' | 'returned';
}

interface ReturnedBook {
  book_id: number;
  title?: string;
  quantity: number;
  condition: 'good' | 'damaged' | 'lost';
}

interface BookDetail {
  book_id: number;
  book_title?: string;
  title?: string;
  quantity: number;
}

interface ReturnsPageState {
  borrowings: Borrowing[];
  loading: boolean;
  showModal: boolean;
  showSuccessModal: boolean;
  showErrorModal: boolean;
  modalTitle: string;
  modalMessage: string;
  selectedBorrowing: Borrowing | null;
  returnedBooks: ReturnedBook[];
}

// ==================== Helpers ====================

const cn = (...classes: (string | boolean | undefined)[]): string =>
  classes.filter(Boolean).join(' ');

// ==================== Main Component ====================

export default function ReturnsPage(): React.ReactElement {
  const [state, setState] = useState<ReturnsPageState>({
    borrowings: [],
    loading: true,
    showModal: false,
    showSuccessModal: false,
    showErrorModal: false,
    modalTitle: '',
    modalMessage: '',
    selectedBorrowing: null,
    returnedBooks: [],
  });

  const fetchBorrowings = useCallback(async (): Promise<void> => {
    try {
      const response = await api.get('/borrowings');
      const activeBorrowings = (response.data.data || []).filter(
        (b: Borrowing) => b.status === 'borrowed'
      );
      setState((prev) => ({
        ...prev,
        borrowings: activeBorrowings,
      }));
    } catch (error) {
      console.error('Error fetching borrowings:', error);
      setState((prev) => ({
        ...prev,
        modalTitle: 'Gagal Memuat Data',
        modalMessage: 'Terjadi kesalahan saat memuat daftar alokasi peminjaman aktif.',
        showErrorModal: true,
      }));
    } finally {
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => {
    fetchBorrowings();
  }, [fetchBorrowings]);

  const handleReturn = useCallback(
    async (borrowing: Borrowing): Promise<void> => {
      setState((prev) => ({ ...prev, selectedBorrowing: borrowing }));
      try {
        const response = await api.get(`/borrowings/${borrowing.borrowing_id}`);
        const details: BookDetail[] = response.data.data.details || [];

        setState((prev) => ({
          ...prev,
          returnedBooks: details.map((d) => ({
            book_id: d.book_id,
            title: d.book_title || d.title || undefined,
            quantity: d.quantity,
            condition: 'good' as const,
          })),
          showModal: true,
        }));
      } catch (error) {
        console.error('Error fetching details:', error);
        setState((prev) => ({
          ...prev,
          modalTitle: 'Gagal Memuat Detail',
          modalMessage:
            error instanceof Error && 'response' in error
              ? (error as any).response?.data?.message ||
                'Tidak dapat mengambil rincian item buku dari transaksi ini.'
              : 'Tidak dapat mengambil rincian item buku dari transaksi ini.',
          showErrorModal: true,
        }));
      }
    },
    []
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
      e.preventDefault();
      try {
        if (!state.selectedBorrowing) return;

        await api.put(`/borrowings/${state.selectedBorrowing.borrowing_id}/return`, {
          returned_books: state.returnedBooks.map(({ book_id, quantity, condition }) => ({
            book_id,
            quantity,
            condition,
          })),
        });
        setState((prev) => ({
          ...prev,
          showModal: false,
        }));
        await fetchBorrowings();
        setState((prev) => ({
          ...prev,
          modalTitle: 'Sukses Memproses',
          modalMessage:
            'Sirkulasi pengembalian buku terdaftar dengan aman ke dalam inventaris.',
          showSuccessModal: true,
        }));
      } catch (error) {
        console.error('Error processing return:', error);
        setState((prev) => ({
          ...prev,
          modalTitle: 'Gagal Memproses',
          modalMessage:
            error instanceof Error && 'response' in error
              ? (error as any).response?.data?.message ||
                'Terjadi gangguan sistem saat memperbarui status pengembalian.'
              : 'Terjadi gangguan sistem saat memperbarui status pengembalian.',
          showErrorModal: true,
        }));
      }
    },
    [state.selectedBorrowing, state.returnedBooks, fetchBorrowings]
  );

  return (
    <div className={cn('space-y-6 p-4')}>
      {/* HEADER SECTION */}
      <div>
        <h1 className={cn('text-2xl font-bold text-gray-800')}>Pengembalian Buku</h1>
        <p className={cn('text-xs text-gray-500 mt-1')}>
          Kelola sirkulasi pengembalian berkas buku dan penilaian kondisi fisik inventaris.
        </p>
      </div>

      {/* DATA TABLE CONTAINER */}
      <div className={cn('bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden')}>
        <table className={cn('w-full border-collapse text-sm')}>
          <thead className={cn('bg-gray-50 border-b border-gray-100')}>
            <tr>
              {['No', 'Nama Member', 'Tanggal Pinjam', 'Jatuh Tempo', 'Aksi'].map((heading) => (
                <th
                  key={heading}
                  className={cn(
                    'px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider'
                  )}
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={cn('divide-y divide-gray-100 bg-white')}>
            {state.loading ? (
              <tr>
                <td colSpan={5} className={cn('px-6 py-8 text-center text-gray-400 animate-pulse')}>
                  Memverifikasi sirkulasi buku aktif...
                </td>
              </tr>
            ) : state.borrowings.length === 0 ? (
              <tr>
                <td colSpan={5} className={cn('px-6 py-8 text-center text-gray-400')}>
                  Tidak ada rekam peminjaman aktif yang perlu dikembalikan
                </td>
              </tr>
            ) : (
              state.borrowings.map((borrowing, index) => (
                <tr key={borrowing.borrowing_id} className={cn('hover:bg-gray-50/70 transition-colors')}>
                  <td className={cn('px-6 py-4 text-gray-500')}>{index + 1}</td>
                  <td className={cn('px-6 py-4 font-semibold text-gray-800 capitalize')}>
                    {borrowing.member_name}
                  </td>
                  <td className={cn('px-6 py-4 text-gray-600')}>
                    {new Date(borrowing.borrow_date).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td className={cn('px-6 py-4 text-gray-600')}>
                    {new Date(borrowing.due_date).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td className={cn('px-6 py-4')}>
                    <button
                      onClick={() => handleReturn(borrowing)}
                      className={cn(
                        'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-lg',
                        'hover:bg-emerald-700 active:scale-95 transition-all shadow-sm'
                      )}
                    >
                      <FiCheck size={14} /> Proses Kembali
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* DIALOG FORM MODAL */}
      {state.showModal && state.selectedBorrowing && (
        <div
          className={cn(
            'fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto'
          )}
        >
          <div
            className={cn(
              'bg-white rounded-xl shadow-xl max-w-md w-full p-6 my-8 border border-gray-100'
            )}
          >
            <h2 className={cn('text-xl font-bold text-gray-800 mb-2')}>Proses Pengembalian</h2>

            <div className={cn('flex items-center gap-2 text-sm text-gray-600 border-b border-gray-100 pb-4 mb-4')}>
              <FiUser className="text-gray-400" />
              <span>
                Peminjam:{' '}
                <strong className="text-gray-800 capitalize">{state.selectedBorrowing.member_name}</strong>
              </span>
            </div>

            <form onSubmit={handleSubmit} className={cn('space-y-4')}>
              <div>
                <label className={cn('block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2')}>
                  Evaluasi Kondisi Buku
                </label>

                <div className={cn('space-y-2.5 max-h-[280px] overflow-y-auto pr-1')}>
                  {state.returnedBooks.map((book, index) => (
                    <div
                      key={index}
                      className={cn('p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-2')}
                    >
                      <p className={cn('text-xs font-semibold text-gray-700 truncate')}>
                        {book.title ? book.title : `Item Buku #${index + 1}`}
                        <span className="text-gray-400 font-normal ml-1">
                          ({book.quantity} pcs)
                        </span>
                      </p>

                      <select
                        value={book.condition}
                        onChange={(e) => {
                          const newBooks = [...state.returnedBooks];
                          newBooks[index].condition = e.target.value as 'good' | 'damaged' | 'lost';
                          setState((prev) => ({
                            ...prev,
                            returnedBooks: newBooks,
                          }));
                        }}
                        className={cn(
                          'w-full px-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 bg-white',
                          book.condition === 'good' &&
                            'border-gray-300 focus:ring-emerald-500 text-gray-700',
                          book.condition === 'damaged' &&
                            'border-amber-300 focus:ring-amber-500 text-amber-700 bg-amber-50/20',
                          book.condition === 'lost' &&
                            'border-red-300 focus:ring-red-500 text-red-700 bg-red-50/20'
                        )}
                      >
                        <option value="good">🟢 Kondisi Baik / Utuh</option>
                        <option value="damaged">🟡 Kondisi Rusak</option>
                        <option value="lost">🔴 Buku Hilang</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Form Action Controls */}
              <div className={cn('flex gap-3 pt-3 border-t border-gray-100')}>
                <button
                  type="button"
                  onClick={() => setState((prev) => ({ ...prev, showModal: false }))}
                  className={cn(
                    'flex-1 px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors'
                  )}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className={cn(
                    'flex-1 px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm'
                  )}
                >
                  Konfirmasi Kembali
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GLOBAL FEEDBACK MODALS */}
      <Modal
        isOpen={state.showSuccessModal}
        onClose={() => setState((prev) => ({ ...prev, showSuccessModal: false }))}
        title={state.modalTitle}
      >
        {state.modalMessage}
      </Modal>

      <Modal
        isOpen={state.showErrorModal}
        onClose={() => setState((prev) => ({ ...prev, showErrorModal: false }))}
        title={state.modalTitle}
      >
        <div className="flex items-start gap-2.5">
          <FiAlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
          <span>{state.modalMessage}</span>
        </div>
      </Modal>
    </div>
  );
}
