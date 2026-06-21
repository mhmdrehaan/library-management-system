'use client';

import { useCallback, useEffect, useState } from 'react';
import { FiPlus, FiTrash2, FiCheckCircle } from 'react-icons/fi';
import api from '@/lib/api';
import BorrowingFormModal from '@/components/BorrowingFormModal';
import Modal from '@/components/Modal';


// ==================== Types ====================

interface Borrowing {
  borrowing_id: number;
  member_name: string;
  borrow_date: string;
  due_date: string;
  status: 'borrowed' | 'returned';
}

interface Member {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
}

interface Book {
  id: number;
  title: string;
  author: string;
  stock: number;
}

interface BorrowingFormData {
  member_id: string;
  books: Array<{
    book_id: string;
    quantity: number;
  }>;
  due_date: string;
}

interface BorrowingDetailBook {
  book_id: number;
  book_title: string;
  quantity: number;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface BorrowingDetailResponse {
  id: number;
  member_name: string;
  due_date: string;
  details: BorrowingDetailBook[];
}

type BookCondition = 'good' | 'damaged' | 'lost';

interface BorrowingsPageState {
  borrowings: Borrowing[];
  members: Member[];
  books: Book[];
  loading: boolean;
  showModal: boolean;
  showErrorModal: boolean;
  errorTitle: string;
  errorMessage: string;
  modalLoading: boolean;
  showReturnModal: boolean;
  selectedBorrowing: BorrowingDetailResponse | null;
  returnConditions: Record<number, BookCondition>;
  showDeleteModal: boolean;
  deleteTargetId: number | null;
}

// ==================== Helpers ====================

const cn = (...classes: (string | boolean | undefined)[]): string =>
  classes.filter(Boolean).join(' ');

const calculateEstimatedFine = (dueDateStr: string, totalQuantity: number) => {
  const dueDate = new Date(dueDateStr);
  const today = new Date();
  dueDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  if (today > dueDate) {
    const diffTime = today.getTime() - dueDate.getTime();
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return { days, fine: days * 1000 * totalQuantity };
  }
  return { days: 0, fine: 0 };
};

// ==================== Main Component ====================

export default function BorrowingsPage(): React.ReactElement {
  const [state, setState] = useState<BorrowingsPageState>({
    borrowings: [],
    members: [],
    books: [],
    loading: true,
    showModal: false,
    showErrorModal: false,
    errorTitle: '',
    errorMessage: '',
    modalLoading: false,
    showReturnModal: false,
    selectedBorrowing: null,
    returnConditions: {},
    showDeleteModal: false,
    deleteTargetId: null,
  });

  const fetchData = useCallback(async (): Promise<void> => {
    try {
      const [borrowingsRes, membersRes, booksRes] = await Promise.all([
        api.get<ApiResponse<Borrowing[]>>('/borrowings'),
        api.get<ApiResponse<Member[]>>('/members'),
        api.get<ApiResponse<Book[]>>('/books'),
      ]);
      setState((prev) => ({
        ...prev,
        borrowings: borrowingsRes.data.data,
        members: membersRes.data.data,
        books: booksRes.data.data,
      }));
    } catch (error) {
      console.error('Error fetching data:', error);
      setState((prev) => ({
        ...prev,
        errorTitle: 'Gagal Memuat Data',
        errorMessage: 'Terjadi kesalahan saat mengambil repositori data peminjaman.',
        showErrorModal: true,
      }));
    } finally {
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => {
    const loadInitialData = async (): Promise<void> => {
      try {
        const [borrowingsRes, membersRes, booksRes] = await Promise.all([
          api.get<ApiResponse<Borrowing[]>>('/borrowings'),
          api.get<ApiResponse<Member[]>>('/members'),
          api.get<ApiResponse<Book[]>>('/books'),
        ]);
        setState((prev) => ({
          ...prev,
          borrowings: borrowingsRes.data.data,
          members: membersRes.data.data,
          books: booksRes.data.data,
        }));
      } catch (error) {
        console.error('Error fetching data:', error);
        setState((prev) => ({
          ...prev,
          errorTitle: 'Gagal Memuat Data',
          errorMessage: 'Terjadi kesalahan saat mengambil repositori data peminjaman.',
          showErrorModal: true,
        }));
      } finally {
        setState((prev) => ({ ...prev, loading: false }));
      }
    };

    void loadInitialData();
  }, []);

  const handleAdd = (): void => {
    setState((prev) => ({ ...prev, showModal: true }));
  };

  // Hanya buka modal, simpan id target
  const handleDelete = useCallback((id: number): void => {
    setState((prev) => ({ ...prev, showDeleteModal: true, deleteTargetId: id }));
  }, []);

  // Eksekusi delete setelah konfirmasi
  const handleConfirmDelete = useCallback(async (): Promise<void> => {
    if (state.deleteTargetId === null) return;
    setState((prev) => ({ ...prev, showDeleteModal: false }));
    try {
      await api.delete(`/borrowings/${state.deleteTargetId}`);
      await fetchData();
    } catch (error) {
      console.error('Error deleting borrowing:', error);
      setState((prev) => ({
        ...prev,
        errorTitle: 'Gagal Menghapus',
        errorMessage: 'Terjadi kesalahan saat menghapus peminjaman.',
        showErrorModal: true,
      }));
    } finally {
      setState((prev) => ({ ...prev, deleteTargetId: null }));
    }
  }, [state.deleteTargetId, fetchData]);

  const handleModalSubmit = useCallback(
    async (formData: BorrowingFormData): Promise<void> => {
      const todayStr = new Date().toISOString().split('T')[0];

      if (formData.due_date && formData.due_date < todayStr) {
        setState((prev) => ({
          ...prev,
          errorTitle: 'Tanggal Tidak Valid',
          errorMessage: 'Tanggal jatuh tempo yang Anda pilih sudah lewat! Silakan pilih tanggal hari ini atau masa depan.',
          showErrorModal: true,
        }));
        return;
      }

      setState((prev) => ({ ...prev, modalLoading: true }));
      try {
        const payload = {
          member_id: parseInt(formData.member_id),
          books: formData.books.map((b) => ({
            book_id: parseInt(b.book_id),
            quantity: parseInt(b.quantity.toString()),
          })),
          due_date: formData.due_date,
        };

        await api.post('/borrowings', payload);
        setState((prev) => ({ ...prev, showModal: false }));
        await fetchData();
      } catch (error) {
        console.error('Error submitting borrowing:', error);
        const axiosError = error as { response?: { data?: { message?: string } } };
        const backendMessage = axiosError.response?.data?.message || 'Terjadi gangguan internal sistem saat mendaftarkan peminjaman.';

        setState((prev) => ({
          ...prev,
          errorTitle: 'Gagal Menyimpan Transaksi',
          errorMessage: backendMessage,
          showErrorModal: true,
        }));
      } finally {
        setState((prev) => ({ ...prev, modalLoading: false }));
      }
    },
    [fetchData]
  );

  const handleOpenReturnModal = async (id: number) => {
    setState((prev) => ({ ...prev, modalLoading: true }));
    try {
      const response = await api.get<ApiResponse<BorrowingDetailResponse>>(`/borrowings/${id}`);
      const borrowingData = response.data.data;

      const initialConditions: Record<number, BookCondition> = {};
      borrowingData.details.forEach((b: BorrowingDetailBook) => {
        initialConditions[b.book_id] = 'good';
      });

      setState((prev) => ({
        ...prev,
        selectedBorrowing: borrowingData,
        returnConditions: initialConditions,
        showReturnModal: true,
      }));
    } catch (error) {
      console.error('Error fetching details:', error);
    } finally {
      setState((prev) => ({ ...prev, modalLoading: false }));
    }
  };

  const handleReturnSubmit = async () => {
    if (!state.selectedBorrowing) return;
    setState((prev) => ({ ...prev, modalLoading: true }));

    try {
      const payload = {
        returned_books: state.selectedBorrowing.details.map((book) => ({
          book_id: book.book_id,
          quantity: book.quantity,
          condition: state.returnConditions[book.book_id] || 'good',
        })),
      };

      const res = await api.put<{ data: { total_fine: number; late_days: number } }>(
        `/borrowings/${state.selectedBorrowing.id}/return`,
        payload
      );

      setState((prev) => ({ ...prev, showReturnModal: false }));
      await fetchData();

      const info = res.data.data;
      if (info.total_fine > 0) {
        alert(`Pengembalian berhasil! Member terlambat ${info.late_days} hari. Total denda wajib bayar: Rp ${info.total_fine.toLocaleString('id-ID')}`);
      } else {
        alert('Pengembalian berhasil diproses! Buku dikembalikan tepat waktu.');
      }
    } catch (error) {
      console.error('Error processing return:', error);
    } finally {
      setState((prev) => ({ ...prev, modalLoading: false }));
    }
  };

  const handleConditionChange = (bookId: number, value: BookCondition) => {
    setState((prev) => ({
      ...prev,
      returnConditions: {
        ...prev.returnConditions,
        [bookId]: value,
      },
    }));
  };

  const totalBooksCount = state.selectedBorrowing?.details.reduce((acc, curr) => acc + curr.quantity, 0) || 0;
  const visualFine = state.selectedBorrowing
    ? calculateEstimatedFine(state.selectedBorrowing.due_date, totalBooksCount)
    : { days: 0, fine: 0 };

  return (
    <div className={cn('space-y-6 p-4')}>
      {/* HEADER SECTION */}
      <div className={cn('flex items-center justify-between')}>
        <h1 className={cn('text-2xl font-bold text-gray-800')}>Peminjaman Buku</h1>
        <button
          onClick={handleAdd}
          className={cn(
            'flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg',
            'hover:bg-blue-700 active:scale-95 transition-all shadow-sm'
          )}
        >
          <FiPlus /> Buat Peminjaman
        </button>
      </div>

      {/* DATA TABLE CONTAINER */}
      <div className={cn('bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden')}>
        <table className={cn('w-full border-collapse text-sm')}>
          <thead className={cn('bg-gray-50 border-b border-gray-100')}>
            <tr>
              {['No', 'Nama Member', 'Tanggal Pinjam', 'Jatuh Tempo', 'Status', 'Aksi'].map((heading) => (
                <th
                  key={heading}
                  className={cn('px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider')}
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={cn('divide-y divide-gray-100 bg-white')}>
            {state.loading ? (
              <tr>
                <td colSpan={6} className={cn('px-6 py-8 text-center text-gray-400 animate-pulse')}>
                  Memuat riwayat transaksi...
                </td>
              </tr>
            ) : state.borrowings.length === 0 ? (
              <tr>
                <td colSpan={6} className={cn('px-6 py-8 text-center text-gray-400')}>
                  Belum ada sirkulasi peminjaman tercatat
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
                      day: 'numeric', month: 'short', year: 'numeric'
                    })}
                  </td>
                  <td className={cn('px-6 py-4 text-gray-600')}>
                    {new Date(borrowing.due_date).toLocaleDateString('id-ID', {
                      day: 'numeric', month: 'short', year: 'numeric'
                    })}
                  </td>
                  <td className={cn('px-6 py-4')}>
                    <span
                      className={cn(
                        'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium tracking-wide',
                        borrowing.status === 'borrowed'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      )}
                    >
                      {borrowing.status === 'borrowed' ? 'Dipinjam' : 'Dikembalikan'}
                    </span>
                  </td>
                  <td className={cn('px-6 py-4 flex items-center gap-2')}>
                    {borrowing.status === 'borrowed' && (
                      <button
                        onClick={() => void handleOpenReturnModal(borrowing.borrowing_id)}
                        className={cn('p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors')}
                        title="Proses Pengembalian"
                        disabled={state.modalLoading}
                      >
                        <FiCheckCircle size={16} />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(borrowing.borrowing_id)}
                      className={cn('p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors')}
                      title="Hapus Peminjaman"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL FORM TAMBAH PEMINJAMAN */}
      <BorrowingFormModal
        isOpen={state.showModal}
        onClose={() => setState((prev) => ({ ...prev, showModal: false }))}
        onSubmit={handleModalSubmit}
        members={state.members}
        books={state.books}
        loading={state.modalLoading}
      />

      {/* MODAL KONFIRMASI HAPUS */}
      <Modal
        isOpen={state.showDeleteModal}
        onClose={() => setState((prev) => ({ ...prev, showDeleteModal: false, deleteTargetId: null }))}
        title="Konfirmasi Hapus"
      >
        <div className="space-y-5">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
              <FiTrash2 size={28} className="text-red-600" />
            </div>
          </div>

          {/* Pesan */}
          <div className="text-center space-y-1">
            <p className="text-sm text-gray-600">
              Tindakan ini <span className="font-semibold text-gray-800">tidak dapat dibatalkan</span>.
              Yakin ingin menghapus data peminjaman ini?
            </p>
          </div>

          {/* Tombol */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={() => setState((prev) => ({ ...prev, showDeleteModal: false, deleteTargetId: null }))}
              className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Batal
            </button>
            <button
              onClick={() => void handleConfirmDelete()}
              className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 active:scale-[0.98] transition-all"
            >
              Ya, Hapus
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL KONFIRMASI PENGEMBALIAN & DENDA */}
      <Modal
        isOpen={state.showReturnModal}
        onClose={() => setState((prev) => ({ ...prev, showReturnModal: false }))}
        title="Form Pengembalian & Penilaian Buku"
      >
        <div className="space-y-4 text-sm text-gray-600">
          <div className="bg-gray-50 p-4 rounded-xl space-y-1.5 border border-gray-100">
            <p><strong>Member:</strong> <span className="capitalize">{state.selectedBorrowing?.member_name}</span></p>
            <p><strong>Jatuh Tempo:</strong> {state.selectedBorrowing && new Date(state.selectedBorrowing.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>

            <div className="pt-2 border-t mt-2 flex justify-between items-center">
              <span className="font-semibold text-gray-700">Estimasi Denda:</span>
              <span className={cn(
                'font-bold text-base',
                visualFine.fine > 0 ? 'text-red-600' : 'text-green-600'
              )}>
                {visualFine.fine > 0
                  ? `Rp ${visualFine.fine.toLocaleString('id-ID')} (${visualFine.days} Hari Terlambat)`
                  : 'Bebas Denda / Tepat Waktu'
                }
              </span>
            </div>
          </div>

          {/* List Buku */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Kondisi Buku Saat Kembali</label>
            {state.selectedBorrowing?.details.map((book) => (
              <div key={book.book_id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border border-gray-100 rounded-lg gap-2">
                <div className="max-w-[60%]">
                  <p className="font-medium text-gray-800 line-clamp-1">{book.book_title}</p>
                  <p className="text-xs text-gray-400">Jumlah pinjam: {book.quantity} eks</p>
                </div>
                <select
                  value={state.returnConditions[book.book_id] || 'good'}
                  onChange={(e) => handleConditionChange(book.book_id, e.target.value as BookCondition)}
                  className="px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                >
                  <option value="good">Good (Bagus)</option>
                  <option value="damaged">Damaged (Rusak)</option>
                  <option value="lost">Lost (Hilang)</option>
                </select>
              </div>
            ))}
          </div>

          <button
            onClick={() => void handleReturnSubmit()}
            disabled={state.modalLoading}
            className="w-full mt-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-all active:scale-[0.98] flex justify-center items-center gap-2 shadow-sm disabled:opacity-50"
          >
            {state.modalLoading ? 'Memproses...' : 'Selesaikan Pengembalian'}
          </button>
        </div>
      </Modal>

      {/* MODAL ERROR */}
      <Modal
        isOpen={state.showErrorModal}
        onClose={() => setState((prev) => ({ ...prev, showErrorModal: false }))}
        title={state.errorTitle}
      >
        {state.errorMessage}
      </Modal>
    </div>
  );
}