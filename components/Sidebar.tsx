'use client';

import { usePathname, useRouter } from 'next/navigation';
import { FiHome, FiBook, FiUsers, FiClipboard, FiArrowLeftCircle, FiClock, FiLogOut } from 'react-icons/fi';

// ==================== Types ====================

interface MenuItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

// ==================== Constants ====================

const menuItems: MenuItem[] = [
  { name: 'Dashboard', path: '/dashboard', icon: FiHome },
  { name: 'Buku', path: '/dashboard/books', icon: FiBook },
  { name: 'Anggota', path: '/dashboard/members', icon: FiUsers },
  { name: 'Peminjaman', path: '/dashboard/borrowings', icon: FiClipboard },
  { name: 'Pengembalian', path: '/dashboard/returns', icon: FiArrowLeftCircle },
  { name: 'Riwayat', path: '/dashboard/history', icon: FiClock },
];

// ==================== Component ====================

export default function Sidebar(): React.ReactElement {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = (): void => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  return (
    <aside className="w-64 bg-slate-900 text-white min-h-screen flex flex-col">
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FiBook className="text-blue-400" />
          Library
        </h1>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            return (
              <li key={item.path}>
                <button
                  onClick={() => router.push(item.path)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Icon className="text-xl" />
                  <span>{item.name}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-slate-700">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-red-600 hover:text-white transition-colors"
        >
          <FiLogOut className="text-xl" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
