'use client';

import { useState, useEffect } from 'react';
import { FiBell, FiSearch } from 'react-icons/fi';

export default function Navbar() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const raw = localStorage.getItem('user');
      
      // Jika null, undefined, atau string "null", set ke null
      if (!raw || raw === 'null' || raw.trim() === '') {
        setUser(null);
        return;
      }

      // Coba parse JSON
      const parsed = JSON.parse(raw);
      
      // Pastikan hasilnya adalah object
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        setUser(parsed);
      } else {
        console.warn('Invalid user data in localStorage:', raw);
        setUser(null);
      }
    } catch (e) {
      console.error('Failed to parse user from localStorage:', e);
      setUser(null);
    }
  }, []);

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex-1 max-w-xl">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari buku, anggota, atau transaksi..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
            <FiBell className="text-xl" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
              {user?.full_name?.[0] || user?.username?.[0] || 'A'}
            </div>
            <div>
              <p className="font-semibold text-sm">
                {user?.full_name || user?.username || 'Admin'}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {user?.role || 'admin'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}