'use client';

import { useEffect, useState } from 'react';
import { FiBook, FiUsers, FiClipboard, FiAlertTriangle } from 'react-icons/fi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '@/lib/api';

export default function DashboardPage() {
  const [stats, setStats] = useState({ totalBooks: 0, totalMembers: 0, activeBorrowings: 0, overdueBooks: 0 });
  const [recentActivity, setRecentActivity] = useState([]);
  const [topBooks, setTopBooks] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [booksRes, membersRes, borrowingsRes] = await Promise.all([
        api.get('/books'),
        api.get('/members'),
        api.get('/borrowings'),
      ]);

      const books = booksRes.data.data;
      const members = membersRes.data.data;
      const borrowings = borrowingsRes.data.data;

      const activeBorrowings = borrowings.filter(b => b.status === 'borrowed').length;
      const overdueBooks = borrowings.filter(b => b.status === 'borrowed' && new Date(b.due_date) < new Date()).length;

      setStats({ totalBooks: books.length, totalMembers: members.length, activeBorrowings, overdueBooks });
      setRecentActivity(borrowings.slice(0, 5));
      setTopBooks(books.slice(0, 5));
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const chartData = [
    { month: 'Jan', peminjaman: 65 },
    { month: 'Feb', peminjaman: 78 },
    { month: 'Mar', peminjaman: 90 },
    { month: 'Apr', peminjaman: 81 },
    { month: 'May', peminjaman: 95 },
    { month: 'Jun', peminjaman: 110 },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Buku" value={stats.totalBooks} icon={FiBook} color="blue" />
        <StatCard title="Total Member" value={stats.totalMembers} icon={FiUsers} color="green" />
        <StatCard title="Sedang Dipinjam" value={stats.activeBorrowings} icon={FiClipboard} color="yellow" />
        <StatCard title="Buku Terlambat" value={stats.overdueBooks} icon={FiAlertTriangle} color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Statistik Peminjaman</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="peminjaman" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Action</h3>
          <div className="space-y-3">
            <button onClick={() => window.location.href='/dashboard/books'} className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg">+ Tambah Buku</button>
            <button onClick={() => window.location.href='/dashboard/members'} className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg">+ Tambah Member</button>
            <button onClick={() => window.location.href='/dashboard/borrowings'} className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg">+ Buat Peminjaman</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <FiClipboard className="text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Peminjaman #{activity.borrowing_id}</p>
                  <p className="text-xs text-gray-500">{new Date(activity.borrow_date).toLocaleDateString('id-ID')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Top 5 Buku Terpopuler</h3>
          <div className="space-y-4">
            {topBooks.map((book, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center font-bold text-indigo-600">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{book.title}</p>
                  <p className="text-xs text-gray-500">{book.author}</p>
                </div>
                <span className="text-sm text-gray-600">{book.stock} stok</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    red: 'bg-red-100 text-red-600',
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
          <Icon className="text-2xl" />
        </div>
      </div>
    </div>
  );
}