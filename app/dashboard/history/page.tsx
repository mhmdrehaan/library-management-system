'use client';

import { useEffect, useState } from 'react';
import { FiDollarSign, FiEye, FiAlertCircle, FiCheckCircle, FiFile, FiFileText } from 'react-icons/fi';
import api from '@/lib/api';
import Modal from '@/components/Modal';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// ==================== Types ====================

interface Borrowing {
  borrowing_id: number;
  member_name: string;
  borrow_date: string;
  due_date: string;
  return_date?: string;
  status: 'returned' | 'borrowed';
}

interface BorrowingDetail {
  book_id: number;
  book_title: string;
  quantity: number;
  book_condition?: 'good' | 'damaged' | 'lost';
  fine_amount: number;
}

interface HistoryPageState {
  borrowings: Borrowing[];
  loading: boolean;
  showDetailModal: boolean;
  selectedBorrowing: Borrowing | null;
  borrowingDetails: BorrowingDetail[];
  loadingDetails: boolean;
}

// ==================== Main Component ====================

export default function HistoryPage(): React.ReactElement {
  const [state, setState] = useState<HistoryPageState>({
    borrowings: [],
    loading: true,
    showDetailModal: false,
    selectedBorrowing: null,
    borrowingDetails: [],
    loadingDetails: false,
  });

  useEffect(() => {
    const loadData = async (): Promise<void> => {
      try {
        const response = await api.get('/borrowings');
        const returnedBorrowings = (response.data.data || []).filter(
          (b: Borrowing) => b.status === 'returned'
        );
        setState((prev) => ({
          ...prev,
          borrowings: returnedBorrowings,
        }));
      } catch (error) {
        console.error('Error fetching history:', error);
      } finally {
        setState((prev) => ({ ...prev, loading: false }));
      }
    };

    void loadData();
  }, []);

  const handleViewDetail = async (borrowing: Borrowing): Promise<void> => {
    setState((prev) => ({
      ...prev,
      selectedBorrowing: borrowing,
      showDetailModal: true,
      loadingDetails: true,
    }));

    try {
      const response = await api.get(`/borrowings/${borrowing.borrowing_id}`);
      const details = response.data.data.details || [];
      setState((prev) => ({
        ...prev,
        borrowingDetails: details,
        loadingDetails: false,
      }));
    } catch (error) {
      console.error('Error fetching details:', error);
      setState((prev) => ({ ...prev, loadingDetails: false }));
    }
  };

  const calculateTotalFine = (details: BorrowingDetail[]): number => {
    return details.reduce((sum, detail) => sum + (detail.fine_amount || 0), 0);
  };

  const calculateLateDays = (dueDate: string, returnDate?: string): number => {
    if (!returnDate) return 0;
    const due = new Date(dueDate);
    const returned = new Date(returnDate);
    const diffTime = returned.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  // ========== EXPORT TO EXCEL ==========
 // ========== EXPORT TO EXCEL (PROFESSIONAL TEMPLATE) ==========
const exportToExcel = (): void => {
  const today = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // ===== HITUNG REKAPITULASI =====
  const totalTransactions = state.borrowings.length;
  const totalOnTime = state.borrowings.filter(b => calculateLateDays(b.due_date, b.return_date) === 0).length;
  const totalLate = totalTransactions - totalOnTime;
  const totalFines = state.borrowings.reduce((sum, b) => {
    const lateDays = calculateLateDays(b.due_date, b.return_date);
    return sum + (lateDays * 1000);
  }, 0);
  const averageFine = totalTransactions > 0 ? Math.round(totalFines / totalTransactions) : 0;

  // ===== SHEET 1: REKAPITULASI =====
  const recapData = [
    ['LAPORAN DENDA KETERLAMBATAN PENGEMBALIAN BUKU'],
    ['PERPUSTAKAAN'],
    [],
    [`Tanggal Cetak: ${today}`],
    [],
    ['REKAPITULASI'],
    ['Total Transaksi Pengembalian', totalTransactions],
    ['Tepat Waktu', totalOnTime],
    ['Terlambat', totalLate],
    ['Total Denda Terkumpul', totalFines],
    ['Rata-rata Denda per Transaksi', averageFine],
    [],
    ['KETERANGAN'],
    ['Tarif Denda', 'Rp 1.000 per buku per hari terlambat'],
    ['Periode Laporan', 'Semua riwayat pengembalian'],
  ];

  // Styling untuk sheet rekapitulasi
  const recapWs = XLSX.utils.aoa_to_sheet(recapData);
  
  // Merge cells untuk judul
  recapWs['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }, // Merge A1:B1 (judul)
    { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } }, // Merge A2:B2 (subtitle)
    { s: { r: 5, c: 0 }, e: { r: 5, c: 1 } }, // Merge A6:B6 (header rekap)
    { s: { r: 12, c: 0 }, e: { r: 12, c: 1 } }, // Merge A13:B13 (header keterangan)
  ];

  // Lebar kolom
  recapWs['!cols'] = [
    { wch: 35 }, // Kolom A
    { wch: 25 }, // Kolom B
  ];

  // ===== SHEET 2: DETAIL TRANSAKSI =====
  const detailHeader = [
    'No',
    'Nama Member',
    'Tanggal Pinjam',
    'Jatuh Tempo',
    'Tanggal Kembali',
    'Keterlambatan (Hari)',
    'Denda (Rp)',
    'Status'
  ];

  const detailData = state.borrowings.map((borrowing, index) => {
    const lateDays = calculateLateDays(borrowing.due_date, borrowing.return_date);
    return [
      index + 1,
      borrowing.member_name,
      new Date(borrowing.borrow_date).toLocaleDateString('id-ID'),
      new Date(borrowing.due_date).toLocaleDateString('id-ID'),
      borrowing.return_date 
        ? new Date(borrowing.return_date).toLocaleDateString('id-ID') 
        : '-',
      lateDays > 0 ? lateDays : 0,
      lateDays > 0 ? lateDays * 1000 : 0,
      'Selesai'
    ];
  });

  // Tambahkan baris total di bawah
  detailData.push([]); // Baris kosong
  detailData.push(['', '', '', '', 'TOTAL', totalLate, totalFines, '']);

  const detailWs = XLSX.utils.aoa_to_sheet([detailHeader, ...detailData]);

  // Lebar kolom detail
  detailWs['!cols'] = [
    { wch: 5 },  // No
    { wch: 20 }, // Member
    { wch: 15 }, // Tgl Pinjam
    { wch: 15 }, // Jatuh Tempo
    { wch: 15 }, // Tgl Kembali
    { wch: 18 }, // Keterlambatan
    { wch: 18 }, // Denda
    { wch: 12 }, // Status
  ];

  // ===== GABUNGKAN KEDUA SHEET =====
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, recapWs, 'Rekapitulasi');
  XLSX.utils.book_append_sheet(wb, detailWs, 'Detail Transaksi');
  
  const filename = `Laporan_Denda_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, filename);
};


 
// ========== EXPORT TO PDF (MANUAL - NO AUTOTABLE) ==========
// ========== EXPORT TO PDF ==========
// ========== EXPORT TO PDF (MANUAL TABLE - NO AUTOTABLE) ==========
const exportToPDF = (): void => {
  const doc = new jsPDF();
  const today = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // ===== HITUNG REKAPITULASI =====
  const totalTransactions = state.borrowings.length;
  const totalOnTime = state.borrowings.filter(b => calculateLateDays(b.due_date, b.return_date) === 0).length;
  const totalLate = totalTransactions - totalOnTime;
  const totalFines = state.borrowings.reduce((sum, b) => {
    const lateDays = calculateLateDays(b.due_date, b.return_date);
    return sum + (lateDays * 1000);
  }, 0);
  const averageFine = totalTransactions > 0 ? Math.round(totalFines / totalTransactions) : 0;

  // ===== HEADER LAPORAN =====
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('LAPORAN DENDA KETERLAMBATAN', 105, 15, { align: 'center' });
  doc.setFontSize(12);
  doc.text('PERPUSTAKAAN', 105, 22, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Tanggal Cetak: ${today}`, 14, 32);

  // ===== BOX REKAPITULASI =====
  let yPos = 42;
  
  // Background box
  doc.setFillColor(240, 240, 240);
  doc.rect(14, yPos, 182, 45, 'F');
  
  // Title REKAPITULASI
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('REKAPITULASI', 14, yPos + 8);
  
  // Garis bawah title
  doc.setLineWidth(0.5);
  doc.setDrawColor(59, 130, 246);
  doc.line(14, yPos + 10, 196, yPos + 10);
  
  // Data Rekapitulasi
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  yPos += 18;
  
  doc.text('Total Transaksi Pengembalian', 20, yPos);
  doc.text(`: ${totalTransactions}`, 100, yPos);
  
  yPos += 7;
  doc.text('Tepat Waktu', 20, yPos);
  doc.text(`: ${totalOnTime}`, 100, yPos);
  
  yPos += 7;
  doc.text('Terlambat', 20, yPos);
  doc.text(`: ${totalLate}`, 100, yPos);
  
  yPos += 7;
  doc.text('Total Denda Terkumpul', 20, yPos);
  doc.text(`: Rp ${totalFines.toLocaleString('id-ID')}`, 100, yPos);
  
  yPos += 7;
  doc.text('Rata-rata Denda per Transaksi', 20, yPos);
  doc.text(`: Rp ${averageFine.toLocaleString('id-ID')}`, 100, yPos);
  
  // ===== KETERANGAN =====
  yPos += 12;
  doc.setFont('helvetica', 'bold');
  doc.text('KETERANGAN:', 14, yPos);
  
  doc.setFont('helvetica', 'normal');
  yPos += 6;
  doc.text('Tarif Denda: Rp 1.000 per buku per hari terlambat', 14, yPos);
  
  yPos += 6;
  doc.text('Periode Laporan: Semua riwayat pengembalian', 14, yPos);

  // ===== TABEL DETAIL TRANSAKSI (MANUAL) =====
  yPos += 15;
  
  // Header Tabel
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setFillColor(59, 130, 246);
  doc.rect(14, yPos - 5, 182, 6, 'F');
  doc.setTextColor(255, 255, 255);
  
  doc.text('No', 16, yPos);
  doc.text('Member', 24, yPos);
  doc.text('Tgl Pinjam', 56, yPos);
  doc.text('Jatuh Tempo', 78, yPos);
  doc.text('Tgl Kembali', 103, yPos);
  doc.text('Keterlambatan', 130, yPos);
  doc.text('Denda', 165, yPos);
  
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  
  // Rows
  let rowY = yPos + 8;
  state.borrowings.forEach((borrowing, index) => {
    const lateDays = calculateLateDays(borrowing.due_date, borrowing.return_date);
    const fine = lateDays > 0 ? lateDays * 1000 : 0;
    
    // Background selang-seling
    if (index % 2 === 1) {
      doc.setFillColor(245, 245, 245);
      doc.rect(14, rowY - 4, 182, 5, 'F');
    }
    
    doc.text(String(index + 1), 16, rowY);
    doc.text(borrowing.member_name.substring(0, 12), 24, rowY);
    doc.text(new Date(borrowing.borrow_date).toLocaleDateString('id-ID'), 56, rowY);
    doc.text(new Date(borrowing.due_date).toLocaleDateString('id-ID'), 78, rowY);
    doc.text(
      borrowing.return_date 
        ? new Date(borrowing.return_date).toLocaleDateString('id-ID') 
        : '-', 
      103, rowY
    );
    doc.text(lateDays > 0 ? `${lateDays} hari` : 'Tepat Waktu', 130, rowY);
    doc.text(fine > 0 ? `Rp ${fine.toLocaleString('id-ID')}` : '-', 165, rowY);
    
    rowY += 6;
    
    // New page if needed
    if (rowY > 270) {
      doc.addPage();
      rowY = 20;
    }
  });
  
  // Footer Total
  rowY += 3;
  doc.setFont('helvetica', 'bold');
  doc.setFillColor(220, 220, 220);
  doc.rect(14, rowY - 4, 182, 5, 'F');
  doc.text('TOTAL', 130, rowY);
  doc.text(`${totalLate} hari`, 165, rowY);
  doc.text(`Rp ${totalFines.toLocaleString('id-ID')}`, 185, rowY, { align: 'right' });

  // Save
  const filename = `Laporan_Denda_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
};

  const totalFinesCollected = state.borrowings.reduce((sum, b) => {
    const lateDays = calculateLateDays(b.due_date, b.return_date);
    return sum + (lateDays * 1000);
  }, 0);

  return (
    <div className="space-y-6 p-4">
      {/* Header dengan Tombol Export */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Riwayat Transaksi</h1>
          <p className="text-sm text-gray-500 mt-1">
            Daftar semua peminjaman yang telah dikembalikan beserta denda keterlambatan
          </p>
        </div>
        
        {/* Export Buttons */}
        <div className="flex gap-2">
          <button
            onClick={exportToExcel}
            disabled={state.borrowings.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-700 bg-green-100 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiFile size={16} />
            Export Excel
          </button>
          <button
            onClick={exportToPDF}
            disabled={state.borrowings.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiFileText size={16} />
            Export PDF
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase">Total Transaksi</p>
              <p className="text-2xl font-bold text-gray-800">{state.borrowings.length}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <FiCheckCircle className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase">Tepat Waktu</p>
              <p className="text-2xl font-bold text-gray-800">
                {state.borrowings.filter(b => calculateLateDays(b.due_date, b.return_date) === 0).length}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <FiCheckCircle className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase">Total Denda Terkumpul</p>
              <p className="text-2xl font-bold text-gray-800">
                Rp {totalFinesCollected.toLocaleString('id-ID')}
              </p>
            </div>
            <div className="bg-red-100 p-3 rounded-full">
              <FiDollarSign className="text-red-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">No</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal Pinjam</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jatuh Tempo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal Kembali</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Keterlambatan</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Denda</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {state.loading ? (
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : state.borrowings.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                  Belum ada riwayat pengembalian
                </td>
              </tr>
            ) : (
              state.borrowings.map((borrowing, index) => {
                const lateDays = calculateLateDays(borrowing.due_date, borrowing.return_date);
                const hasFine = lateDays > 0;

                return (
                  <tr key={borrowing.borrowing_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-600">{index + 1}</td>
                    <td className="px-6 py-4 font-medium text-gray-800">{borrowing.member_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(borrowing.borrow_date).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(borrowing.due_date).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {borrowing.return_date
                        ? new Date(borrowing.return_date).toLocaleDateString('id-ID')
                        : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {hasFine ? (
                        <span className="inline-flex items-center gap-1 text-red-600 font-medium">
                          <FiAlertCircle size={14} />
                          {lateDays} hari
                        </span>
                      ) : (
                        <span className="text-green-600 text-xs font-medium">Tepat Waktu</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {hasFine ? (
                        <span className="inline-flex items-center gap-1 text-red-600 font-semibold">
                          <FiDollarSign size={14} />
                          Rp {(lateDays * 1000).toLocaleString('id-ID')}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleViewDetail(borrowing)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      >
                        <FiEye size={14} />
                        Detail
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      <Modal
        isOpen={state.showDetailModal}
        onClose={() => setState((prev) => ({ ...prev, showDetailModal: false }))}
        title="Detail Peminjaman"
      >
        {state.selectedBorrowing && (
          <div className="space-y-4">
            {/* Borrowing Info */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Member:</span>
                <span className="text-sm font-medium">{state.selectedBorrowing.member_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Tanggal Pinjam:</span>
                <span className="text-sm font-medium">
                  {new Date(state.selectedBorrowing.borrow_date).toLocaleDateString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Jatuh Tempo:</span>
                <span className="text-sm font-medium">
                  {new Date(state.selectedBorrowing.due_date).toLocaleDateString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Tanggal Kembali:</span>
                <span className="text-sm font-medium">
                  {state.selectedBorrowing.return_date
                    ? new Date(state.selectedBorrowing.return_date).toLocaleDateString('id-ID')
                    : '-'}
                </span>
              </div>
              {calculateLateDays(state.selectedBorrowing.due_date, state.selectedBorrowing.return_date) > 0 && (
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-sm text-red-600 font-medium">Keterlambatan:</span>
                  <span className="text-sm text-red-600 font-semibold">
                    {calculateLateDays(state.selectedBorrowing.due_date, state.selectedBorrowing.return_date)} hari
                  </span>
                </div>
              )}
            </div>

            {/* Books Details */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Daftar Buku</h3>
              {state.loadingDetails ? (
                <div className="text-center py-4 text-gray-500">Loading details...</div>
              ) : state.borrowingDetails.length === 0 ? (
                <div className="text-center py-4 text-gray-500">Tidak ada detail buku</div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {state.borrowingDetails.map((detail, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-800">{detail.book_title}</p>
                          <p className="text-xs text-gray-500">Jumlah: {detail.quantity}</p>
                        </div>
                        {detail.book_condition && (
                          <span className={`text-xs px-2 py-1 rounded ${
                            detail.book_condition === 'good' ? 'bg-green-100 text-green-700' :
                            detail.book_condition === 'damaged' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {detail.book_condition === 'good' ? 'Baik' :
                             detail.book_condition === 'damaged' ? 'Rusak' : 'Hilang'}
                          </span>
                        )}
                      </div>
                      {detail.fine_amount > 0 && (
                        <div className="flex items-center gap-1 text-xs text-red-600 font-medium">
                          <FiDollarSign size={12} />
                          Denda: Rp {detail.fine_amount.toLocaleString('id-ID')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Total Fine Summary */}
            {!state.loadingDetails && state.borrowingDetails.length > 0 && (
              <div className={`rounded-lg p-4 border ${
                calculateTotalFine(state.borrowingDetails) > 0
                  ? 'bg-red-50 border-red-200'
                  : 'bg-green-50 border-green-200'
              }`}>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Denda:</span>
                  <span className={`text-lg font-bold ${
                    calculateTotalFine(state.borrowingDetails) > 0 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    Rp {calculateTotalFine(state.borrowingDetails).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}