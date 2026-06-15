'use client';

import { useEffect, useState } from 'react';
import { FiPlus, FiCheck } from 'react-icons/fi';
import api from '@/lib/api';

// --- Modal Component ---
// components/Modal.js
const Modal = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    const handleClickOutside = (e) => {
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 focus:outline-none"
              aria-label="Tutup"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="text-gray-700">{children}</div>
        </div>
        <div className="px-6 py-4 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};
// --- End Modal Component ---

export default function BorrowingsPage() {
  const [borrowings, setBorrowings] = useState([]);
  const [members, setMembers] = useState([]);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorTitle, setErrorTitle] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [formData, setFormData] = useState({
    member_id: '',
    books: [{ book_id: '', quantity: 1 }],
    due_date: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [borrowingsRes, membersRes, booksRes] = await Promise.all([
        api.get('/borrowings'),
        api.get('/members'),
        api.get('/books'),
      ]);
      setBorrowings(borrowingsRes.data.data);
      setMembers(membersRes.data.data);
      setBooks(booksRes.data.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      setErrorTitle('Gagal Memuat Data');
      setErrorMessage('Terjadi kesalahan saat memuat data peminjaman, anggota, atau buku.');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setFormData({
      member_id: '',
      books: [{ book_id: '', quantity: 1 }],
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });
    setShowModal(true);
  };

  const handleAddBookField = () => {
    setFormData({
      ...formData,
      books: [...formData.books, { book_id: '', quantity: 1 }]
    });
  };

  const handleRemoveBookField = (index) => {
    if (formData.books.length <= 1) return; // Prevent removing the last field
    const newBooks = formData.books.filter((_, i) => i !== index);
    setFormData({ ...formData, books: newBooks });
  };

  const handleBookChange = (index, field, value) => {
    const newBooks = [...formData.books];
    newBooks[index][field] = value;
    setFormData({ ...formData, books: newBooks });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Validation before submitting
      for (const bookData of formData.books) {
        const selectedBook = books.find(b => b.id === parseInt(bookData.book_id));
        const requestedQuantity = parseInt(bookData.quantity);

        if (!selectedBook) {
          setErrorTitle('Buku Tidak Valid');
          setErrorMessage(`Silakan pilih buku yang valid.`);
          setShowErrorModal(true);
          return;
        }

        if (requestedQuantity <= 0) {
          setErrorTitle('Jumlah Tidak Valid');
          setErrorMessage(`Jumlah buku untuk "${selectedBook.title}" harus lebih dari 0.`);
          setShowErrorModal(true);
          return;
        }

        if (requestedQuantity > selectedBook.stock) {
          setErrorTitle('Stok Tidak Cukup');
          setErrorMessage(`Stok buku "${selectedBook.title}" tidak mencukupi. Tersedia: ${selectedBook.stock}, diminta: ${requestedQuantity}.`);
          setShowErrorModal(true);
          return;
        }
      }

      const payload = {
        member_id: parseInt(formData.member_id),
        books: formData.books.map(b => ({
          book_id: parseInt(b.book_id),
          quantity: parseInt(b.quantity)
        })),
        due_date: formData.due_date
      };
      await api.post('/borrowings', payload);
      setShowModal(false);
      fetchData(); // Refresh data after successful submission
    } catch (error) {
      console.error('Error submitting borrowing:', error);
      setErrorTitle('Gagal Membuat Peminjaman');
      setErrorMessage(error.response?.data?.message || 'Terjadi kesalahan saat membuat peminjaman.');
      setShowErrorModal(true);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Peminjaman Buku</h1>
        <button onClick={handleAdd} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          <FiPlus /> Buat Peminjaman
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">No</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal Pinjam</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jatuh Tempo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan="5" className="px-6 py-4 text-center">Loading...</td></tr>
            ) : borrowings.length === 0 ? (
              <tr><td colSpan="5" className="px-6 py-4 text-center">Tidak ada data</td></tr>
            ) : (
              borrowings.map((borrowing, index) => (
                <tr key={borrowing.borrowing_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">{index + 1}</td>
                  <td className="px-6 py-4 font-medium">{borrowing.member_name}</td>
                  <td className="px-6 py-4">{new Date(borrowing.borrow_date).toLocaleDateString('id-ID')}</td>
                  <td className="px-6 py-4">{new Date(borrowing.due_date).toLocaleDateString('id-ID')}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      borrowing.status === 'borrowed' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {borrowing.status === 'borrowed' ? 'Dipinjam' : 'Dikembalikan'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 my-8">
            <h2 className="text-xl font-bold mb-4">Buat Peminjaman Baru</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Anggota</label>
                <select
                  value={formData.member_id}
                  onChange={(e) => setFormData({ ...formData, member_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">-- Pilih Anggota --</option>
                  {members.map(member => (
                    <option key={member.id} value={member.id}>{member.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Buku yang Dipinjam</label>
                {formData.books.map((book, index) => {
                  const selectedBook = books.find(b => b.id === parseInt(book.book_id));
                  const availableStock = selectedBook ? selectedBook.stock : 0;
                  const requestedQty = parseInt(book.quantity);

                  return (
                    <div key={index} className="flex gap-2 mb-2">
                      <select
                        value={book.book_id}
                        onChange={(e) => handleBookChange(index, 'book_id', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">-- Pilih Buku --</option>
                        {books.filter(b => b.stock > 0).map(b => (
                          <option key={b.id} value={b.id}>{b.title} (Stok: {b.stock})</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min="1"
                        max={availableStock} // Set max attribute
                        value={book.quantity}
                        onChange={(e) => {
                          // Optional: Clamp value if user types beyond max
                          let val = parseInt(e.target.value);
                          if (val > availableStock) val = availableStock;
                          if (val < 1) val = 1;
                          handleBookChange(index, 'quantity', val);
                        }}
                        className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Jml"
                        required
                      />
                      {formData.books.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveBookField(index)}
                          className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                        >
                          Hapus
                        </button>
                      )}
                    </div>
                  );
                })}
                <button
                  type="button"
                  onClick={handleAddBookField}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  + Tambah Buku Lain
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Kembali</label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Batal</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Error Modal */}
      <Modal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title={errorTitle}
      >
        {errorMessage}
      </Modal>
    </div>
  );
}