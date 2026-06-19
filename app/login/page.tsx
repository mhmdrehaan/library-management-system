'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiBook, FiUser, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import api from '@/lib/api';

// ==================== Types ====================

interface LoginFormData {
  username: string;
  password: string;
}

interface AuthResponse {
  success: boolean;
  data: {
    token: string;
    user: {
      full_name?: string;
      username: string;
      role: string;
    };
  };
}

interface LoginPageState {
  formData: LoginFormData;
  showPassword: boolean;
  loading: boolean;
  error: string;
}

// ==================== Main Component ====================

export default function LoginPage(): React.ReactElement {
  const router = useRouter();
  const [state, setState] = useState<LoginPageState>({
    formData: { username: '', password: '' },
    showPassword: false,
    loading: false,
    error: '',
  });

  const handleInputChange = (field: keyof LoginFormData, value: string): void => {
    setState((prev) => ({
      ...prev,
      formData: { ...prev.formData, [field]: value },
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setState((prev) => ({ ...prev, loading: true, error: '' }));

    try {
      console.log('📤 Sending login request...', state.formData);
      const response = await api.post<AuthResponse>('/auth/login', state.formData);
      console.log('📥 Login response:', response.data);

      if (response.data.success) {
        console.log('✅ Login successful!');
        console.log('💾 Token:', response.data.data.token);
        console.log('👤 User:', response.data.data.user);

        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));

        console.log('🔄 Redirecting to dashboard...');
        router.push('/dashboard');
      }
    } catch (err) {
      console.error('❌ Login error:', err);
      const errorMessage =
        err instanceof Error && 'response' in err
          ? (err as any).response?.data?.message || 'Login gagal'
          : 'Login gagal';
      setState((prev) => ({ ...prev, error: errorMessage }));
    } finally {
      setState((prev) => ({ ...prev, loading: false }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden flex">
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-indigo-700 p-12 items-center justify-center">
          <div className="text-center text-white">
            <FiBook className="text-8xl mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-4">Sistem Operasional Perpustakaan</h2>
            <p className="text-blue-100">Kelola buku, anggota, dan peminjaman dengan mudah</p>
          </div>
        </div>

        <div className="w-full lg:w-1/2 p-12">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Selamat Datang</h1>
            <p className="text-gray-600">Silakan login untuk mengakses dashboard</p>
          </div>

          {state.error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
              {state.error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <div className="relative">
                <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={state.formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Masukkan username"
                  required
                  disabled={state.loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={state.showPassword ? 'text' : 'password'}
                  value={state.formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Masukkan password"
                  required
                  disabled={state.loading}
                />
                <button
                  type="button"
                  onClick={() =>
                    setState((prev) => ({
                      ...prev,
                      showPassword: !prev.showPassword,
                    }))
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  disabled={state.loading}
                >
                  {state.showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={state.loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {state.loading ? 'Memproses...' : 'Masuk Ke Dashboard'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
