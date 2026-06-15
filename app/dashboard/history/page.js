'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function HistoryPage() {
  const [borrowings, setBorrowings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await api.get('/borrowings');
      const returnedBorrowings = response.data.data.filter(b => b.status === 'returned');
      setBorrowings(returnedBorrowings);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Riwayat Transaksi</h1>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">No</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal Pinjam</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal Kembali</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan="5" className="px-6 py-4 text-center">Loading...</td></tr>
            ) : borrowings.length === 0 ? (
              <tr><td colSpan="5" className="px-6 py-4 text-center">Belum ada riwayat pengembalian</td></tr>
            ) : (
              borrowings.map((borrowing, index) => (
                <tr key={borrowing.borrowing_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">{index + 1}</td>
                  <td className="px-6 py-4 font-medium">{borrowing.member_name}</td>
                  <td className="px-6 py-4">{new Date(borrowing.borrow_date).toLocaleDateString('id-ID')}</td>
                  <td className="px-6 py-4">{borrowing.return_date ? new Date(borrowing.return_date).toLocaleDateString('id-ID') : '-'}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                      Selesai
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}