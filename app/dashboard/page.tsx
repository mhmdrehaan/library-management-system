'use client';

import { useCallback, useEffect, useState } from 'react';
import { FiBook, FiUsers, FiClipboard, FiAlertTriangle } from 'react-icons/fi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '@/lib/api';

// ==================== Types ====================

interface DashboardStats {
  totalBooks: number;
  totalMembers: number;
  activeBorrowings: number;
  overdueBooks: number;
}

interface ChartDataPoint {
  month: string;
  peminjaman: number;
}

interface ChartStructure {
  month: string;
  peminjaman: number;
  monthIndex: number;
  yearValue: number;
}

interface Activity {
  borrowing_id: number;
  member_name: string;
  borrow_date: string;
  due_date: string;
  status: 'borrowed' | 'returned';
}

interface Book {
  id: number;
  title: string;
  author: string;
  stock: number;
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ComponentType<{ size?: number }>;
  color: 'blue' | 'green' | 'yellow' | 'red';
}

// ==================== Helpers ====================

const cn = (...classes: (string | boolean | undefined)[]): string =>
  classes.filter(Boolean).join(' ');

// ==================== Components ====================

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color }) => {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600 border border-blue-100/50',
    green: 'bg-emerald-50 text-emerald-600 border border-emerald-100/50',
    yellow: 'bg-amber-50 text-amber-600 border border-amber-100/50',
    red: 'bg-red-50 text-red-600 border border-red-100/50',
  };

  return (
    <div className={cn('bg-white rounded-xl border border-gray-100 shadow-sm p-5 transition-all hover:shadow-md/50')}>
      <div className={cn('flex items-center justify-between')}>
        <div className={cn('space-y-1')}>
          <p className={cn('text-xs font-semibold text-gray-400 uppercase tracking-wider')}>{title}</p>
          <p className={cn('text-3xl font-extrabold text-gray-800')}>{value}</p>
        </div>
        <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center shrink-0', colorClasses[color])}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
};

// ==================== Main Component ====================

export default function DashboardPage(): React.ReactElement {
  const [stats, setStats] = useState<DashboardStats>({
    totalBooks: 0,
    totalMembers: 0,
    activeBorrowings: 0,
    overdueBooks: 0,
  });
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [topBooks, setTopBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchData = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      const [booksRes, membersRes, borrowingsRes] = await Promise.all([
        api.get('/books'),
        api.get('/members'),
        api.get('/borrowings'),
      ]);

      const books: Book[] = booksRes.data.data || [];
      const members = membersRes.data.data || [];
      const borrowings: Activity[] = borrowingsRes.data.data || [];

      // 1. Kalkulasi Statistik Utama Card
      const activeBorrowings = borrowings.filter((b) => b.status === 'borrowed').length;
      const overdueBooks = borrowings.filter(
        (b) => b.status === 'borrowed' && new Date(b.due_date) < new Date()
      ).length;
      setStats({
        totalBooks: books.length,
        totalMembers: members.length,
        activeBorrowings,
        overdueBooks,
      });

      // 2. Agregasi Data Chart secara Dinamis (6 Bulan Terakhir)
      const monthsLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const dynamicChartStructure: ChartStructure[] = [];
      const currentMonth = new Date().getMonth();

      for (let i = 5; i >= 0; i--) {
        const targetDate = new Date();
        targetDate.setMonth(currentMonth - i);
        dynamicChartStructure.push({
          month: monthsLabels[targetDate.getMonth()],
          peminjaman: 0,
          monthIndex: targetDate.getMonth(),
          yearValue: targetDate.getFullYear(),
        });
      }

      // Hitung frekuensi peminjaman per bulan
      borrowings.forEach((borrow) => {
        const borrowDate = new Date(borrow.borrow_date);
        const bMonth = borrowDate.getMonth();
        const bYear = borrowDate.getFullYear();

        const matchedMonth = dynamicChartStructure.find(
          (item) => item.monthIndex === bMonth && item.yearValue === bYear
        );
        if (matchedMonth) {
          matchedMonth.peminjaman += 1;
        }
      });

      setChartData(
        dynamicChartStructure.map(({ month, peminjaman }) => ({
          month,
          peminjaman,
        }))
      );

      // 3. Aktivitas Terbaru & Buku Populer
      setRecentActivity(borrowings.slice(0, 5));
      setTopBooks(books.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className={cn('space-y-6 p-1')}>
      {/* STATS CARDS SECTION */}
      <div className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5')}>
        <StatCard title="Total Buku" value={stats.totalBooks} icon={FiBook} color="blue" />
        <StatCard title="Total Member" value={stats.totalMembers} icon={FiUsers} color="green" />
        <StatCard title="Sedang Dipinjam" value={stats.activeBorrowings} icon={FiClipboard} color="yellow" />
        <StatCard title="Buku Terlambat" value={stats.overdueBooks} icon={FiAlertTriangle} color="red" />
      </div>

      {/* CHART & QUICK ACTION SECTION */}
      <div className={cn('grid grid-cols-1 lg:grid-cols-3 gap-6')}>
        {/* STATISTIK PEMINJAMAN */}
        <div className={cn('lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex flex-col justify-between')}>
          <div>
            <h3 className={cn('text-base font-bold text-gray-800 mb-1')}>Statistik Peminjaman</h3>
            <p className={cn('text-xs text-gray-400 mb-4')}>
              Grafik fluktuasi total sirkulasi peminjaman buku per bulan.
            </p>
          </div>
          <div className={cn('w-full h-[280px]')}>
            {loading ? (
              <div
                className={cn(
                  'w-full h-full flex items-center justify-center text-sm text-gray-400 animate-pulse bg-gray-50/50 rounded-lg'
                )}
              >
                Menyinkronkan grafik koordinat...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="month" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #f3f4f6',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
                    }}
                    labelStyle={{ fontWeight: 'bold', color: '#1f2937' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="peminjaman"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* QUICK ACTIONS */}
        <div className={cn('bg-white rounded-xl border border-gray-100 shadow-sm p-6')}>
          <h3 className={cn('text-base font-bold text-gray-800 mb-1')}>Quick Action</h3>
          <p className={cn('text-xs text-gray-400 mb-4')}>Akses cepat manajemen sirkulasi ekosistem.</p>
          <div className={cn('space-y-2.5')}>
            {[
              { label: '+ Tambah Buku', path: '/dashboard/books' },
              { label: '+ Tambah Member', path: '/dashboard/members' },
              { label: '+ Buat Peminjaman', path: '/dashboard/borrowings' },
            ].map((action, idx) => (
              <button
                key={idx}
                onClick={() => {
                  window.location.href = action.path;
                }}
                className={cn(
                  'w-full text-left px-4 py-3 bg-gray-50/60 hover:bg-gray-100/80 rounded-xl',
                  'text-sm font-medium text-gray-700 active:scale-[0.98] transition-all border border-gray-100'
                )}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* RECENT ACTIVITY & POPULAR BOOKS */}
      <div className={cn('grid grid-cols-1 lg:grid-cols-2 gap-6')}>
        {/* Recent Activity Card */}
        <div className={cn('bg-white rounded-xl border border-gray-100 shadow-sm p-6')}>
          <h3 className={cn('text-base font-bold text-gray-800 mb-4')}>Recent Activity</h3>
          <div className={cn('space-y-4')}>
            {recentActivity.length === 0 ? (
              <p className={cn('text-sm text-gray-400 text-center py-6')}>Belum ada aktivitas sirkulasi.</p>
            ) : (
              recentActivity.map((activity, index) => (
                <div
                  key={index}
                  className={cn('flex items-center gap-3 border-b border-gray-50 pb-3 last:border-none last:pb-0')}
                >
                  <div
                    className={cn(
                      'w-9 h-9 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0'
                    )}
                  >
                    <FiClipboard size={16} />
                  </div>
                  <div className={cn('flex-1 min-w-0')}>
                    <p className={cn('text-sm font-semibold text-gray-800 truncate')}>
                      Peminjaman Anggota:{' '}
                      <span className="capitalize">{activity.member_name}</span>
                    </p>
                    <p className={cn('text-xs text-gray-400')}>
                      {new Date(activity.borrow_date).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'text-xs font-semibold px-2.5 py-1 rounded-full',
                      activity.status === 'borrowed'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-emerald-50 text-emerald-700'
                    )}
                  >
                    {activity.status === 'borrowed' ? 'Dipinjam' : 'Selesai'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Books Card */}
        <div className={cn('bg-white rounded-xl border border-gray-100 shadow-sm p-6')}>
          <h3 className={cn('text-base font-bold text-gray-800 mb-4')}>Top 5 Buku Terpopuler</h3>
          <div className={cn('space-y-4')}>
            {topBooks.length === 0 ? (
              <p className={cn('text-sm text-gray-400 text-center py-6')}>Belum ada pustaka buku terdaftar.</p>
            ) : (
              topBooks.map((book, index) => (
                <div key={index} className={cn('flex items-center gap-3')}>
                  <div
                    className={cn(
                      'w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center font-bold text-sm text-indigo-600 shrink-0'
                    )}
                  >
                    {index + 1}
                  </div>
                  <div className={cn('flex-1 min-w-0')}>
                    <p className={cn('text-sm font-semibold text-gray-800 truncate capitalize')}>
                      {book.title}
                    </p>
                    <p className={cn('text-xs text-gray-400 truncate')}>
                      {book.author || 'Penulis anonim'}
                    </p>
                  </div>
                  <span className={cn('text-xs text-gray-500 font-medium bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100')}>
                    {book.stock} stok
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
