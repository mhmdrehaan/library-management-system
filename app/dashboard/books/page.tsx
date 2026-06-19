'use client';

import { useCallback, useEffect, useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiSearch } from 'react-icons/fi';
import api from '@/lib/api';
import BookFormModal from '@/components/BookFormModal';
import { z } from 'zod';

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

interface Book {
  id: number;
  title: string;
  author: string;
  publisher: string;
  category?: string;
  publication_year: number;
  stock: number;
}

interface BooksPageState {
  books: Book[];
  loading: boolean;
  searchTerm: string;
  showModal: boolean;
  editingBook: Book | null;
  modalLoading: boolean;
}

// ==================== Helpers ====================

const cn = (...classes: (string | boolean | undefined)[]): string =>
  classes.filter(Boolean).join(' ');

// ==================== Main Component ====================

export default function BooksPage(): React.ReactElement {
  const [state, setState] = useState<BooksPageState>({
    books: [],
    loading: true,
    searchTerm: '',
    showModal: false,
    editingBook: null,
    modalLoading: false,
  });

  const fetchBooks = useCallback(async (): Promise<void> => {
    try {
      setState((prev) => ({ ...prev, loading: true }));
      const response = await api.get('/books');
      setState((prev) => ({
        ...prev,
        books: response.data.data || [],
      }));
    } catch (error) {
      console.error('Error fetching books:', error);
    } finally {
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => {
    const loadData = async (): Promise<void> => {
      try {
        setState((prev) => ({ ...prev, loading: true }));
        const response = await api.get('/books');
        setState((prev) => ({
          ...prev,
          books: response.data.data || [],
        }));
      } catch (error) {
        console.error('Error fetching books:', error);
      } finally {
        setState((prev) => ({ ...prev, loading: false }));
      }
    };

    void loadData();
  }, []);

  const handleAdd = (): void => {
    setState((prev) => ({
      ...prev,
      editingBook: null,
      showModal: true,
    }));
  };

  const handleEdit = (book: Book): void => {
    setState((prev) => ({
      ...prev,
      editingBook: book,
      showModal: true,
    }));
  };

  const handleDelete = useCallback(
    async (id: number): Promise<void> => {
      if (!confirm('Yakin ingin menghapus buku ini?')) return;
      try {
        await api.delete(`/books/${id}`);
        await fetchBooks();
      } catch (error) {
        console.error('Error deleting book:', error);
      }
    },
    [fetchBooks]
  );

  const handleSubmitForm = useCallback(
    async (data: BookFormData): Promise<void> => {
      setState((prev) => ({ ...prev, modalLoading: true }));
      try {
        if (state.editingBook) {
          await api.put(`/books/${state.editingBook.id}`, data);
        } else {
          await api.post('/books', data);
        }
        setState((prev) => ({ ...prev, showModal: false }));
        await fetchBooks();
      } catch (error) {
        console.error('Error submitting form:', error);
        throw error;
      } finally {
        setState((prev) => ({ ...prev, modalLoading: false }));
      }
    },
    [state.editingBook, fetchBooks]
  );

  const filteredBooks = state.books.filter(
    (book) =>
      book.title.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
      book.author.toLowerCase().includes(state.searchTerm.toLowerCase())
  );

  return (
    <div className={cn('space-y-6 p-4')}>
      {/* HEADER SECTION */}
      <div className={cn('flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4')}>
        <h1 className={cn('text-2xl font-bold text-gray-800')}>Manajemen Buku</h1>

        <div className={cn('flex items-center gap-3 w-full sm:w-auto')}>
          <div className={cn('relative flex-1 sm:flex-initial sm:w-64')}>
            <FiSearch className={cn('absolute left-3 top-1/2 -translate-y-1/2 text-gray-400')} />
            <input
              type="text"
              placeholder="Cari buku..."
              value={state.searchTerm}
              onChange={(e) =>
                setState((prev) => ({ ...prev, searchTerm: e.target.value }))
              }
              className={cn(
                'w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all'
              )}
            />
          </div>

          <button
            onClick={handleAdd}
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg',
              'hover:bg-blue-700 active:scale-95 transition-all shadow-sm whitespace-nowrap'
            )}
          >
            <FiPlus /> Tambah Buku
          </button>
        </div>
      </div>

      {/* TABLE DATA */}
      <div className={cn('bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden')}>
        <table className={cn('w-full border-collapse text-sm')}>
          <thead className={cn('bg-gray-50 border-b border-gray-100')}>
            <tr>
              {['No', 'Judul', 'Penulis', 'Kategori', 'Tahun', 'Stok', 'Aksi'].map((heading) => (
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
                <td colSpan={7} className={cn('px-6 py-8 text-center text-gray-400 animate-pulse')}>
                  Memuat data buku...
                </td>
              </tr>
            ) : filteredBooks.length === 0 ? (
              <tr>
                <td colSpan={7} className={cn('px-6 py-8 text-center text-gray-400')}>
                  Tidak ada data buku ditemukan
                </td>
              </tr>
            ) : (
              filteredBooks.map((book, index) => (
                <tr key={book.id} className={cn('hover:bg-gray-50/70 transition-colors')}>
                  <td className={cn('px-6 py-4 text-gray-500')}>{index + 1}</td>
                  <td className={cn('px-6 py-4 font-semibold text-gray-800 capitalize')}>
                    {book.title}
                  </td>
                  <td className={cn('px-6 py-4 text-gray-600 capitalize')}>{book.author}</td>
                  <td className={cn('px-6 py-4 text-gray-600 capitalize')}>
                    {book.category || '-'}
                  </td>
                  <td className={cn('px-6 py-4 text-gray-600')}>{book.publication_year}</td>
                  <td className={cn('px-6 py-4 text-gray-600')}>{book.stock}</td>
                  <td className={cn('px-6 py-4')}>
                    <div className={cn('flex items-center gap-1')}>
                      <button
                        onClick={() => handleEdit(book)}
                        className={cn(
                          'p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-150'
                        )}
                        title="Edit Buku"
                      >
                        <FiEdit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(book.id)}
                        className={cn(
                          'p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-150'
                        )}
                        title="Hapus Buku"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL FORM */}
      <BookFormModal
        isOpen={state.showModal}
        onClose={() => setState((prev) => ({ ...prev, showModal: false }))}
        onSubmit={handleSubmitForm}
        initialData={state.editingBook}
        loading={state.modalLoading}
      />
    </div>
  );
}
