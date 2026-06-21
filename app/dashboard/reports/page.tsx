'use client';

import { useEffect, useState, useCallback } from 'react';
import { FiCalendar, FiDownload, FiTrendingUp, FiBook, FiUsers, FiDollarSign } from 'react-icons/fi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import api from '@/lib/api';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';

// ==================== Types ====================

interface ReportSummary {
  total_borrowings: number;
  total_returns: number;
  total_fines: number;
}

interface DailyStat {
  date: string;
  borrowings: number;
  returns: number;
}

interface DailyFine {
  date: string;
  fines: number;
}

interface TopBook {
  title: string;
  author: string;
  total_borrowed: number;
}

interface TopMember {
  name: string;
  email: string;
  total_borrowings: number;
}

interface ReportData {
  summary: ReportSummary;
  daily_stats: DailyStat[];
  daily_fines: DailyFine[];
  top_books: TopBook[];
  top_members: TopMember[];
}

interface ReportsPageState {
  loading: boolean;
  startDate: string;
  endDate: string;
  reportData: ReportData | null;
  periodType: 'weekly' | 'monthly' | 'yearly' | 'custom';
}

// ==================== Main Component ====================

export default function ReportsPage(): React.ReactElement {
  const [state, setState] = useState<ReportsPageState>({
    loading: false,
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    reportData: null,
    periodType: 'monthly',
  });

  // ========== GENERATE REPORT (dengan useCallback) ==========
  const generateReport = useCallback(async (): Promise<void> => {
    setState((prev) => ({ ...prev, loading: true }));
    try {
      const response = await api.get('/reports', {
        params: {
          start_date: state.startDate,
          end_date: state.endDate,
        },
      });
      setState((prev) => ({
        ...prev,
        reportData: response.data.data,
        loading: false,
      }));
    } catch (error) {
      console.error('Error generating report:', error);
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, [state.startDate, state.endDate]);

  // ========== USE EFFECT ==========
  useEffect(() => {
    generateReport();
  }, [generateReport]);

  // ========== HANDLE PERIOD CHANGE ==========
  const handlePeriodChange = (type: 'weekly' | 'monthly' | 'yearly' | 'custom'): void => {
    const today = new Date();
    let startDate: Date;
    const endDate = today;

    switch (type) {
      case 'weekly':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 7);
        break;
      case 'monthly':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'yearly':
        startDate = new Date(today.getFullYear(), 0, 1);
        break;
      default:
        return;
    }

    setState((prev) => ({
      ...prev,
      periodType: type,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    }));
  };

  // ========== HANDLE DATE CHANGE ==========
  const handleDateChange = (field: 'startDate' | 'endDate', value: string): void => {
    setState((prev) => ({
      ...prev,
      [field]: value,
      periodType: 'custom',
    }));
  };

  // ========== EXPORT TO EXCEL ==========
  const exportToExcel = (): void => {
    if (!state.reportData) return;

    const wb = XLSX.utils.book_new();

    // Sheet 1: Summary
    const summaryData = [
      ['LAPORAN PERPUSTAKAAN'],
      [`Periode: ${new Date(state.startDate).toLocaleDateString('id-ID')} - ${new Date(state.endDate).toLocaleDateString('id-ID')}`],
      [],
      ['RINGKASAN'],
      ['Total Peminjaman', state.reportData.summary.total_borrowings],
      ['Total Pengembalian', state.reportData.summary.total_returns],
      ['Total Denda', `Rp ${state.reportData.summary.total_fines.toLocaleString('id-ID')}`],
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan');

    // Sheet 2: Top Books
    const topBooksData = [
      ['TOP 5 BUKU TERPOPULER'],
      ['Judul', 'Penulis', 'Total Dipinjam'],
      ...state.reportData.top_books.map((b) => [b.title, b.author, b.total_borrowed]),
    ];
    const wsBooks = XLSX.utils.aoa_to_sheet(topBooksData);
    XLSX.utils.book_append_sheet(wb, wsBooks, 'Top Buku');

    // Sheet 3: Top Members
    const topMembersData = [
      ['TOP 5 MEMBER AKTIF'],
      ['Nama', 'Email', 'Total Peminjaman'],
      ...state.reportData.top_members.map((m) => [m.name, m.email, m.total_borrowings]),
    ];
    const wsMembers = XLSX.utils.aoa_to_sheet(topMembersData);
    XLSX.utils.book_append_sheet(wb, wsMembers, 'Top Member');

    const filename = `Laporan_${state.startDate}_to_${state.endDate}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  // ========== EXPORT TO PDF ==========
  const exportToPDF = (): void => {
    if (!state.reportData) return;

    const doc = new jsPDF();
    const today = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    // Header
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('LAPORAN PERPUSTAKAAN', 105, 15, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Tanggal Cetak: ${today}`, 14, 25);
    doc.text(
      `Periode: ${new Date(state.startDate).toLocaleDateString('id-ID')} - ${new Date(state.endDate).toLocaleDateString('id-ID')}`,
      14,
      32
    );

    // Summary Box
    let yPos = 42;
    doc.setFillColor(240, 240, 240);
    doc.rect(14, yPos, 182, 30, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('RINGKASAN', 14, yPos + 8);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Total Peminjaman: ${state.reportData.summary.total_borrowings}`, 20, yPos + 18);
    doc.text(`Total Pengembalian: ${state.reportData.summary.total_returns}`, 20, yPos + 25);
    doc.text(
      `Total Denda: Rp ${state.reportData.summary.total_fines.toLocaleString('id-ID')}`,
      100,
      yPos + 18
    );

    // Top Books
    yPos += 40;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('TOP 5 BUKU TERPOPULER', 14, yPos);
    yPos += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    state.reportData.top_books.forEach((book, idx) => {
      doc.text(`${idx + 1}. ${book.title} - ${book.total_borrowed}x dipinjam`, 20, yPos);
      yPos += 6;
    });

    // Top Members
    yPos += 10;
    doc.setFont('helvetica', 'bold');
    doc.text('TOP 5 MEMBER AKTIF', 14, yPos);
    yPos += 8;
    doc.setFont('helvetica', 'normal');
    state.reportData.top_members.forEach((member, idx) => {
      doc.text(`${idx + 1}. ${member.name} - ${member.total_borrowings}x peminjaman`, 20, yPos);
      yPos += 6;
    });

    const filename = `Laporan_${state.startDate}_to_${state.endDate}.pdf`;
    doc.save(filename);
  };

  // Prepare chart data
  const chartData = state.reportData?.daily_stats.map((stat) => {
    const fineData = state.reportData?.daily_fines.find((f) => f.date === stat.date);
    return {
      date: new Date(stat.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
      peminjaman: stat.borrowings,
      pengembalian: stat.returns,
      denda: fineData?.fines || 0,
    };
  }) || [];

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Laporan Perpustakaan</h1>
          <p className="text-sm text-gray-500 mt-1">Analisis statistik peminjaman, pengembalian, dan denda</p>
        </div>

        {/* Export Buttons */}
        <div className="flex gap-2">
          <button
            onClick={exportToExcel}
            disabled={!state.reportData || state.loading}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-700 bg-green-100 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50"
          >
            <FiDownload size={16} />
            Excel
          </button>
          <button
            onClick={exportToPDF}
            disabled={!state.reportData || state.loading}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
          >
            <FiDownload size={16} />
            PDF
          </button>
        </div>
      </div>

      {/* Period Filter */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Quick Filters */}
          <div className="flex gap-2">
            <button
              onClick={() => handlePeriodChange('weekly')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                state.periodType === 'weekly'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Mingguan
            </button>
            <button
              onClick={() => handlePeriodChange('monthly')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                state.periodType === 'monthly'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Bulanan
            </button>
            <button
              onClick={() => handlePeriodChange('yearly')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                state.periodType === 'yearly'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tahunan
            </button>
          </div>

          {/* Custom Date Range */}
          <div className="flex gap-2 items-center flex-1">
            <FiCalendar className="text-gray-400" />
            <input
              type="date"
              value={state.startDate}
              onChange={(e) => handleDateChange('startDate', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-gray-500">sampai</span>
            <input
              type="date"
              value={state.endDate}
              onChange={(e) => handleDateChange('endDate', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={generateReport}
              disabled={state.loading}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {state.loading ? 'Loading...' : 'Generate'}
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      {state.reportData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase">Total Peminjaman</p>
                  <p className="text-2xl font-bold text-gray-800">{state.reportData.summary.total_borrowings}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <FiBook className="text-blue-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase">Total Pengembalian</p>
                  <p className="text-2xl font-bold text-gray-800">{state.reportData.summary.total_returns}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <FiTrendingUp className="text-green-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase">Total Denda</p>
                  <p className="text-2xl font-bold text-gray-800">
                    Rp {state.reportData.summary.total_fines.toLocaleString('id-ID')}
                  </p>
                </div>
                <div className="bg-red-100 p-3 rounded-full">
                  <FiDollarSign className="text-red-600" size={24} />
                </div>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Line Chart: Peminjaman & Pengembalian */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Tren Peminjaman & Pengembalian</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="peminjaman" stroke="#3b82f6" strokeWidth={2} />
                  <Line type="monotone" dataKey="pengembalian" stroke="#10b981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Bar Chart: Denda */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Denda per Hari</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="denda" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Lists */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Top Books */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FiBook className="text-blue-600" />
                Top 5 Buku Terpopuler
              </h3>
              <div className="space-y-3">
                {state.reportData.top_books.map((book, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{book.title}</p>
                      <p className="text-xs text-gray-500">{book.author}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-blue-600">{book.total_borrowed}</p>
                      <p className="text-xs text-gray-500">dipinjam</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Members */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FiUsers className="text-green-600" />
                Top 5 Member Aktif
              </h3>
              <div className="space-y-3">
                {state.reportData.top_members.map((member, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{member.name}</p>
                      <p className="text-xs text-gray-500">{member.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">{member.total_borrowings}</p>
                      <p className="text-xs text-gray-500">peminjaman</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}