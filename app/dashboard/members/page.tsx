'use client';

import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiX } from 'react-icons/fi';
import api from '@/lib/api';

// ==================== Schemas ====================

const memberSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, 'Nama anggota wajib diisi').min(3, 'Nama minimal 3 karakter'),
  email: z.string().email('Format email tidak valid'),
  phone: z.string().min(1, 'Nomor telepon wajib diisi').regex(/^(\+62|62|0)[0-9]{9,12}$/, 'Format nomor telepon tidak valid'),
  address: z.string().min(1, 'Alamat wajib diisi').min(5, 'Alamat minimal 5 karakter'),
});

type MemberFormData = z.infer<typeof memberSchema>;
type Member = MemberFormData & { id: number };

// ==================== Types ====================

interface MembersPageState {
  members: Member[];
  loading: boolean;
  searchTerm: string;
  showModal: boolean;
  editingMemberId: number | null;
  submitting: boolean;
}

interface MemberFormModalProps {
  isOpen: boolean;
  isEditing: boolean;
  initialData?: MemberFormData;
  onClose: () => void;
  onSubmit: (data: MemberFormData) => Promise<void>;
  submitting: boolean;
}

interface MemberRowProps {
  member: Member;
  index: number;
  onEdit: (member: Member) => void;
  onDelete: (id: number) => void;
}

// ==================== Components ====================

const cn = (...classes: (string | boolean | undefined)[]): string =>
  classes.filter(Boolean).join(' ');

const MemberFormModal: React.FC<MemberFormModalProps> = ({
  isOpen,
  isEditing,
  initialData,
  onClose,
  onSubmit,
  submitting,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
    defaultValues: initialData || {
      name: '',
      email: '',
      phone: '',
      address: '',
    },
  });

  useEffect(() => {
    if (initialData) {
      reset(initialData);
    }
  }, [initialData, reset]);

  const handleFormSubmit = handleSubmit(async (data) => {
    await onSubmit(data);
    reset();
  });

  if (!isOpen) return null;

  return (
    <div className={cn('fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4')}>
      <div className={cn('bg-white rounded-xl shadow-lg w-full max-w-md')}>
        {/* Header */}
        <div className={cn('flex items-center justify-between p-6 border-b border-gray-200')}>
          <h2 className={cn('text-xl font-bold text-gray-800')}>
            {isEditing ? 'Edit Anggota' : 'Tambah Anggota Baru'}
          </h2>
          <button
            onClick={onClose}
            disabled={submitting}
            className={cn('p-1 text-gray-400 hover:text-gray-600 transition-colors')}
            title="Tutup"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleFormSubmit} className={cn('p-6 space-y-4')}>
          {/* Name Field */}
          <div>
            <label className={cn('block text-sm font-medium text-gray-700 mb-2')}>
              Nama Anggota <span className={cn('text-red-500')}>*</span>
            </label>
            <input
              type="text"
              placeholder="Masukkan nama anggota"
              {...register('name')}
              className={cn(
                'w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all',
                errors.name ? 'border-red-500 bg-red-50' : 'border-gray-300'
              )}
              disabled={submitting}
            />
            {errors.name && <p className={cn('mt-1 text-sm text-red-500')}>{errors.name.message}</p>}
          </div>

          {/* Email Field */}
          <div>
            <label className={cn('block text-sm font-medium text-gray-700 mb-2')}>
              Email <span className={cn('text-red-500')}>*</span>
            </label>
            <input
              type="email"
              placeholder="Masukkan email"
              {...register('email')}
              className={cn(
                'w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all',
                errors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'
              )}
              disabled={submitting}
            />
            {errors.email && <p className={cn('mt-1 text-sm text-red-500')}>{errors.email.message}</p>}
          </div>

          {/* Phone Field */}
          <div>
            <label className={cn('block text-sm font-medium text-gray-700 mb-2')}>
              Nomor Telepon <span className={cn('text-red-500')}>*</span>
            </label>
            <input
              type="tel"
              placeholder="Contoh: 08123456789"
              {...register('phone')}
              className={cn(
                'w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all',
                errors.phone ? 'border-red-500 bg-red-50' : 'border-gray-300'
              )}
              disabled={submitting}
            />
            {errors.phone && <p className={cn('mt-1 text-sm text-red-500')}>{errors.phone.message}</p>}
          </div>

          {/* Address Field */}
          <div>
            <label className={cn('block text-sm font-medium text-gray-700 mb-2')}>
              Alamat <span className={cn('text-red-500')}>*</span>
            </label>
            <textarea
              placeholder="Masukkan alamat lengkap"
              rows={3}
              {...register('address')}
              className={cn(
                'w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none',
                errors.address ? 'border-red-500 bg-red-50' : 'border-gray-300'
              )}
              disabled={submitting}
            />
            {errors.address && <p className={cn('mt-1 text-sm text-red-500')}>{errors.address.message}</p>}
          </div>

          {/* Action Buttons */}
          <div className={cn('flex gap-3 pt-4')}>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className={cn(
                'flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium',
                'hover:bg-gray-50 transition-colors disabled:opacity-50'
              )}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={cn(
                'flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium',
                'hover:bg-blue-700 transition-colors disabled:opacity-50'
              )}
            >
              {submitting ? 'Menyimpan...' : isEditing ? 'Perbarui' : 'Tambah'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const MemberRow: React.FC<MemberRowProps> = ({ member, index, onEdit, onDelete }) => {
  return (
    <tr className={cn('hover:bg-gray-50/70 transition-colors')}>
      <td className={cn('px-6 py-4 text-gray-500')}>{index + 1}</td>
      <td className={cn('px-6 py-4 font-semibold text-gray-800 capitalize')}>{member.name}</td>
      <td className={cn('px-6 py-4 text-gray-600 break-all')}>{member.email}</td>
      <td className={cn('px-6 py-4 text-gray-600')}>{member.phone}</td>
      <td className={cn('px-6 py-4 text-gray-600 line-clamp-2')}>{member.address}</td>
      <td className={cn('px-6 py-4')}>
        <div className={cn('flex items-center gap-1')}>
          <button
            onClick={() => onEdit(member)}
            className={cn(
              'p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-150'
            )}
            title="Edit Anggota"
          >
            <FiEdit2 size={16} />
          </button>
          <button
            onClick={() => onDelete(member.id)}
            className={cn(
              'p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-150'
            )}
            title="Hapus Anggota"
          >
            <FiTrash2 size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
};

// ==================== Main Page Component ====================

export default function MembersPage(): React.ReactElement {
  const [state, setState] = useState<MembersPageState>({
    members: [],
    loading: true,
    searchTerm: '',
    showModal: false,
    editingMemberId: null,
    submitting: false,
  });

  const editingMember = state.editingMemberId
    ? state.members.find((m) => m.id === state.editingMemberId)
    : undefined;

  // ==================== API Methods ====================

  const fetchMembers = useCallback(async (): Promise<void> => {
    try {
      setState((prev) => ({ ...prev, loading: true }));
      const response = await api.get('/members');
      setState((prev) => ({
        ...prev,
        members: response.data.data || [],
      }));
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  const handleAddMember = useCallback(
    async (data: MemberFormData): Promise<void> => {
      try {
        setState((prev) => ({ ...prev, submitting: true }));
        await api.post('/members', data);
        setState((prev) => ({
          ...prev,
          showModal: false,
        }));
        await fetchMembers();
      } catch (error) {
        console.error('Error adding member:', error);
        alert('Gagal menambah anggota. Silakan coba lagi.');
      } finally {
        setState((prev) => ({ ...prev, submitting: false }));
      }
    },
    [fetchMembers]
  );

  const handleUpdateMember = useCallback(
    async (data: MemberFormData): Promise<void> => {
      if (!state.editingMemberId) return;

      try {
        setState((prev) => ({ ...prev, submitting: true }));
        await api.patch(`/members/${state.editingMemberId}`, data);
        setState((prev) => ({
          ...prev,
          showModal: false,
          editingMemberId: null,
        }));
        await fetchMembers();
      } catch (error) {
        console.error('Error updating member:', error);
        alert('Gagal memperbarui anggota. Silakan coba lagi.');
      } finally {
        setState((prev) => ({ ...prev, submitting: false }));
      }
    },
    [state.editingMemberId, fetchMembers]
  );

  const handleDeleteMember = useCallback(
    async (id: number): Promise<void> => {
      if (!confirm('Yakin ingin menghapus anggota ini? Tindakan ini tidak dapat dibatalkan.')) return;

      try {
        await api.delete(`/members/${id}`);
        await fetchMembers();
      } catch (error) {
        console.error('Error deleting member:', error);
        alert('Gagal menghapus anggota. Silakan coba lagi.');
      }
    },
    [fetchMembers]
  );

  // ==================== Effects ====================

  useEffect(() => {
    const loadInitial = async (): Promise<void> => {
      try {
        setState((prev) => ({ ...prev, loading: true }));
        const response = await api.get('/members');
        setState((prev) => ({
          ...prev,
          members: response.data.data || [],
        }));
      } catch (error) {
        console.error('Error fetching members:', error);
      } finally {
        setState((prev) => ({ ...prev, loading: false }));
      }
    };

    void loadInitial();
  }, []);

  // ==================== Handlers ====================

  const handleOpenAddModal = (): void => {
    setState((prev) => ({
      ...prev,
      showModal: true,
      editingMemberId: null,
    }));
  };

  const handleOpenEditModal = (member: Member): void => {
    setState((prev) => ({
      ...prev,
      showModal: true,
      editingMemberId: member.id,
    }));
  };

  const handleCloseModal = (): void => {
    setState((prev) => ({
      ...prev,
      showModal: false,
      editingMemberId: null,
    }));
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setState((prev) => ({
      ...prev,
      searchTerm: e.target.value,
    }));
  };

  const handleFormSubmit = async (data: MemberFormData): Promise<void> => {
    if (state.editingMemberId) {
      await handleUpdateMember(data);
    } else {
      await handleAddMember(data);
    }
  };

  // ==================== Computed Values ====================

  const filteredMembers = state.members.filter(
    (member) =>
      member.name.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(state.searchTerm.toLowerCase())
  );

  // ==================== Render ====================

  return (
    <div className={cn('space-y-6 p-4')}>
      {/* Header Section */}
      <div className={cn('flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4')}>
        <h1 className={cn('text-2xl font-bold text-gray-800')}>Manajemen Anggota</h1>
        <div className={cn('flex items-center gap-3 w-full sm:w-auto')}>
          {/* Search Input */}
          <div className={cn('relative flex-1 sm:flex-initial sm:w-64')}>
            <FiSearch className={cn('absolute left-3 top-1/2 -translate-y-1/2 text-gray-400')} />
            <input
              type="text"
              placeholder="Cari anggota..."
              value={state.searchTerm}
              onChange={handleSearchChange}
              className={cn(
                'w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all'
              )}
            />
          </div>

          {/* Add Button */}
          <button
            onClick={handleOpenAddModal}
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg',
              'hover:bg-blue-700 active:scale-95 transition-all shadow-sm whitespace-nowrap'
            )}
          >
            <FiPlus size={18} /> Tambah Anggota
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className={cn('bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden')}>
        <table className={cn('w-full border-collapse text-sm')}>
          <thead className={cn('bg-gray-50 border-b border-gray-100')}>
            <tr>
              {['No', 'Nama', 'Email', 'Telepon', 'Alamat', 'Aksi'].map((heading) => (
                <th
                  key={heading}
                  className={cn(
                    'px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider'
                  )}
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={cn('divide-y divide-gray-100 bg-white')}>
            {state.loading ? (
              <tr>
                <td colSpan={6} className={cn('px-6 py-8 text-center text-gray-400 animate-pulse')}>
                  Memuat data anggota...
                </td>
              </tr>
            ) : filteredMembers.length === 0 ? (
              <tr>
                <td colSpan={6} className={cn('px-6 py-8 text-center text-gray-400')}>
                  {state.searchTerm ? 'Tidak ada anggota sesuai pencarian' : 'Tidak ada data anggota ditemukan'}
                </td>
              </tr>
            ) : (
              filteredMembers.map((member, index) => (
                <MemberRow
                  key={member.id}
                  member={member}
                  index={index}
                  onEdit={handleOpenEditModal}
                  onDelete={handleDeleteMember}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Form Modal */}
      <MemberFormModal
        isOpen={state.showModal}
        isEditing={state.editingMemberId !== null}
        initialData={
          editingMember
            ? {
                name: editingMember.name,
                email: editingMember.email,
                phone: editingMember.phone,
                address: editingMember.address,
              }
            : undefined
        }
        onClose={handleCloseModal}
        onSubmit={handleFormSubmit}
        submitting={state.submitting}
      />
    </div>
  );
}
