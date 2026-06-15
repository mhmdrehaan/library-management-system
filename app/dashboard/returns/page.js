'use client';

import { useEffect, useState } from 'react';
import { FiCheck } from 'react-icons/fi';
import api from '@/lib/api';

export default function ReturnsPage() {
  const [borrowings, setBorrowings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');

  const [selectedBorrowing, setSelectedBorrowing] = useState(null);
  const [returnedBooks, setReturnedBooks] = useState([]);

  // --- Modal Component (inline) ---
  const Modal = ({ isOpen, onClose, title, children }) => {
    useEffect(() => {
      if (!isOpen) return;

      const handleEscape = (e) => e.key === 'Escape' && onClose();
      const handleClickOutside = (e) => e.target === e.currentTarget && onClose();

      window.addEventListener('keydown', handleEscape);
      document.addEventListener('mousedown', handleClickOutside);

      return () => {
        window.removeEventListener('keydown', handleEscape);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
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
  // --- End Modal ---

  useEffect(() => {
    fetchBorrowings();
  }, []);

  const fetchBorrowings = async () => {
    try {
      const response = await api.get('/borrowings');
      const activeBorrowings = response.data.data.filter(b => b.status === 'borrowed');
      setBorrowings(activeBorrowings);
    } catch (error) {
      console.error(error);
      setModalTitle('Gagal Memuat Data');
      setModalMessage('Terjadi kesalahan saat memuat daftar peminjaman aktif.');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleReturn = async (borrowing) => {
    setSelectedBorrowing(borrowing);
    try {
      const response = await api.get(`/borrowings/${borrowing.borrowing_id}`);
      const details = response.data.data.details || [];
      setReturnedBooks(details.map(d => ({
        book_id: d.book_id,
        quantity: d.quantity,
        condition: 'good'
      })));
      setShowModal(true);
    } catch (error) {
      console.error(error);
      setModalTitle('Gagal Memuat Detail Peminjaman');
      setModalMessage(error.response?.data?.message || 'Tidak dapat mengambil detail peminjaman.');
      setShowErrorModal(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/borrowings/${selectedBorrowing.borrowing_id}/return`, {
        returned_books: returnedBooks
      });
      setShowModal(false);
      fetchBorrowings();
      setModalTitle('Berhasil!');
      setModalMessage('Pengembalian berhasil diproses.');
      setShowSuccessModal(true);
    } catch (error) {
      console.error(error);
      setModalTitle('Gagal Memproses Pengembalian');
      setModalMessage(error.response?.data?.message || 'Terjadi kesalahan saat memproses pengembalian.');
      setShowErrorModal(true);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Pengembalian Buku</h1>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">No</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal Pinjam</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jatuh Tempo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan="5" className="px-6 py-4 text-center">Loading...</td></tr>
            ) : borrowings.length === 0 ? (
              <tr><td colSpan="5" className="px-6 py-4 text-center">Tidak ada peminjaman aktif</td></tr>
            ) : (
              borrowings.map((borrowing, index) => (
                <tr key={borrowing.borrowing_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">{index + 1}</td>
                  <td className="px-6 py-4 font-medium">{borrowing.member_name}</td>
                  <td className="px-6 py-4">{new Date(borrowing.borrow_date).toLocaleDateString('id-ID')}</td>
                  <td className="px-6 py-4">{new Date(borrowing.due_date).toLocaleDateString('id-ID')}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleReturn(borrowing)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      <FiCheck /> Proses Pengembalian
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: Proses Pengembalian */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Proses Pengembalian</h2>
            <p className="text-sm text-gray-600 mb-4">Member: {selectedBorrowing?.member_name}</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kondisi Buku</label>
                {returnedBooks.map((book, index) => (
                  <div key={index} className="mb-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium mb-2">Buku #{index + 1}</p>
                    <select
                      value={book.condition}
                      onChange={(e) => {
                        const newBooks = [...returnedBooks];
                        newBooks[index].condition = e.target.value;
                        setReturnedBooks(newBooks);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="good">Baik</option>
                      <option value="damaged">Rusak</option>
                      <option value="lost">Hilang</option>
                    </select>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Konfirmasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modals harus berada dalam return block */}
      {/* Success Modal */}
      <Modal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title={modalTitle}
      >
        {modalMessage}
      </Modal>

      {/* Error Modal */}
      <Modal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title={modalTitle}
      >
        {modalMessage}
      </Modal>
    </div>
  );
}