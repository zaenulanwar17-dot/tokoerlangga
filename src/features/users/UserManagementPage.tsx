import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Shield,
  KeyRound,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  LogIn,
  X,
  Save,
  Sparkles,
  Phone,
  Mail,
  UserCheck,
} from 'lucide-react';
import { AppUser, Role } from '../../domain/types';
import { userRepository } from '../../services';
import { useDemoAuth } from '../../context/DemoAuthContext';
import { useToast } from '../../context/ToastContext';

export const UserManagementPage: React.FC = () => {
  const { currentUser, switchToUser } = useDemoAuth();
  const { showToast } = useToast();

  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<Role | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [resetPinUser, setResetPinUser] = useState<AppUser | null>(null);
  const [newPinInput, setNewPinInput] = useState('');

  // Form state for Add/Edit
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'STAFF' as Role,
    pin: '',
    isActive: true,
  });

  const loadUsers = async () => {
    setLoading(true);
    try {
      const list = await userRepository.list();
      setUsers(list);
    } catch (err: any) {
      showToast(err.message || 'Gagal memuat daftar pengguna', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: 'STAFF',
      pin: '123456',
      isActive: true,
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (user: AppUser) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      pin: user.pin || '',
      isActive: user.isActive,
    });
  };

  const handleSaveAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) {
      showToast('Semua kolom bertanda bintang wajib diisi', 'error');
      return;
    }

    try {
      await userRepository.create({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        role: formData.role,
        pin: formData.pin.trim() || '123456',
        isActive: formData.isActive,
      });
      showToast(`Pengguna "${formData.name}" berhasil ditambahkan!`, 'success');
      setIsAddModalOpen(false);
      loadUsers();
    } catch (err: any) {
      showToast(err.message || 'Gagal menambahkan pengguna', 'error');
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) {
      showToast('Semua kolom bertanda bintang wajib diisi', 'error');
      return;
    }

    try {
      await userRepository.update(editingUser.id, {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        role: formData.role,
        pin: formData.pin.trim(),
        isActive: formData.isActive,
      });
      showToast(`Data pengguna "${formData.name}" berhasil diperbarui!`, 'success');
      setEditingUser(null);
      loadUsers();
    } catch (err: any) {
      showToast(err.message || 'Gagal memperbarui pengguna', 'error');
    }
  };

  const handleToggleStatus = async (user: AppUser) => {
    try {
      const updated = await userRepository.toggleStatus(user.id);
      showToast(
        `Status ${updated.name} diubah menjadi ${updated.isActive ? 'Aktif' : 'Nonaktif'}.`,
        'info'
      );
      loadUsers();
    } catch (err: any) {
      showToast(err.message || 'Gagal mengubah status', 'error');
    }
  };

  const handleDeleteUser = async (user: AppUser) => {
    if (window.confirm(`Yakin ingin menghapus pengguna "${user.name}"?`)) {
      try {
        await userRepository.delete(user.id);
        showToast(`Pengguna "${user.name}" berhasil dihapus`, 'success');
        loadUsers();
      } catch (err: any) {
        showToast(err.message || 'Gagal menghapus pengguna', 'error');
      }
    }
  };

  const handleSavePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPinUser) return;
    if (!newPinInput.trim() || newPinInput.length < 4) {
      showToast('PIN minimal 4 karakter / angka', 'error');
      return;
    }

    try {
      await userRepository.resetPin(resetPinUser.id, newPinInput.trim());
      showToast(`PIN kasir untuk ${resetPinUser.name} berhasil direset!`, 'success');
      setResetPinUser(null);
      setNewPinInput('');
      loadUsers();
    } catch (err: any) {
      showToast(err.message || 'Gagal mereset PIN', 'error');
    }
  };

  const handleSwitchAccount = (u: AppUser) => {
    switchToUser({
      id: u.id,
      name: u.name,
      role: u.role,
      email: u.email,
    });
    showToast(`Beralih simulasi ke akun: ${u.name} (${u.role})`, 'success');
  };

  // Filtered list
  const filteredUsers = users.filter((u) => {
    if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
    if (statusFilter === 'ACTIVE' && !u.isActive) return false;
    if (statusFilter === 'INACTIVE' && u.isActive) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.phone.includes(q)
      );
    }
    return true;
  });

  const countByRole = {
    owner: users.filter((u) => u.role === 'OWNER').length,
    admin: users.filter((u) => u.role === 'ADMIN').length,
    staff: users.filter((u) => u.role === 'STAFF').length,
    customer: users.filter((u) => u.role === 'CUSTOMER').length,
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-ink">Kelola Pengguna & Hak Akses</h1>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-sage-700 bg-sage-50 px-2 py-0.5 rounded border border-sage-200">
              <Shield className="w-3 h-3 text-sage-500" />
              Multi-Role SOT
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted mt-0.5">
            Manajemen akun staf kasir, admin toko & gudang, pemilik (owner), dan simulasi pelanggan.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-magenta-500 hover:bg-magenta-700 text-white font-bold text-xs shadow-sm transition-colors shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah Pengguna</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-surface p-4 rounded-xl border border-border shadow-xs">
          <div className="flex items-center justify-between text-muted mb-1 text-xs">
            <span>Total Pengguna</span>
            <Users className="w-4 h-4 text-sage-500" />
          </div>
          <p className="text-2xl font-extrabold text-ink tabular-nums">{users.length}</p>
          <p className="text-[11px] text-muted mt-1">Terdaftar di sistem warung</p>
        </div>

        <div className="bg-surface p-4 rounded-xl border border-border shadow-xs">
          <div className="flex items-center justify-between text-muted mb-1 text-xs">
            <span>Owner & Admin</span>
            <Shield className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-ink tabular-nums">
            {countByRole.owner + countByRole.admin}
          </p>
          <p className="text-[11px] text-muted mt-1">
            {countByRole.owner} Owner • {countByRole.admin} Admin
          </p>
        </div>

        <div className="bg-surface p-4 rounded-xl border border-border shadow-xs">
          <div className="flex items-center justify-between text-muted mb-1 text-xs">
            <span>Kasir / Staf Toko</span>
            <UserCheck className="w-4 h-4 text-magenta-600" />
          </div>
          <p className="text-2xl font-extrabold text-ink tabular-nums">{countByRole.staff}</p>
          <p className="text-[11px] text-muted mt-1">Akses POS kasir & stok</p>
        </div>

        <div className="bg-surface p-4 rounded-xl border border-border shadow-xs">
          <div className="flex items-center justify-between text-muted mb-1 text-xs">
            <span>Pelanggan Demo</span>
            <Users className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-extrabold text-ink tabular-nums">{countByRole.customer}</p>
          <p className="text-[11px] text-muted mt-1">Akun toko kelontong mitra</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-surface p-4 rounded-2xl border border-border shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-muted absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama, email, atau no. telepon pengguna..."
              className="w-full pl-9 pr-4 py-2 bg-canvas border border-border rounded-lg text-xs text-ink focus:ring-2 focus:ring-sage-500 placeholder:text-muted"
            />
          </div>

          {/* Role pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 text-xs">
            <span className="text-muted text-[11px] font-semibold mr-1 shrink-0">Role:</span>
            {(['ALL', 'OWNER', 'ADMIN', 'STAFF', 'CUSTOMER'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRoleFilter(r)}
                className={`px-2.5 py-1.5 rounded-lg font-semibold shrink-0 transition-colors ${
                  roleFilter === r
                    ? 'bg-sage-500 text-white shadow-xs'
                    : 'bg-canvas text-ink hover:bg-surface border border-border'
                }`}
              >
                {r === 'ALL'
                  ? 'Semua'
                  : r === 'OWNER'
                  ? 'Owner'
                  : r === 'ADMIN'
                  ? 'Admin'
                  : r === 'STAFF'
                  ? 'Kasir / Staf'
                  : 'Pelanggan'}
              </button>
            ))}
          </div>

          {/* Status selector */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 bg-canvas border border-border rounded-lg text-xs font-semibold text-ink focus:ring-2 focus:ring-sage-500"
          >
            <option value="ALL">Semua Status</option>
            <option value="ACTIVE">Status Aktif</option>
            <option value="INACTIVE">Status Nonaktif</option>
          </select>
        </div>
      </div>

      {/* Users Table / Grid */}
      <div className="bg-surface rounded-2xl border border-border shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted text-xs">Memuat data pengguna...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Users className="w-8 h-8 text-muted mx-auto" />
            <p className="text-sm font-semibold text-ink">Tidak ada pengguna ditemukan</p>
            <p className="text-xs text-muted">
              Coba ganti kata kunci pencarian atau filter role di atas.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-canvas border-b border-border text-[11px] text-muted uppercase font-bold tracking-wider">
                <tr>
                  <th className="py-3 px-4">Pengguna</th>
                  <th className="py-3 px-4">Role Akses</th>
                  <th className="py-3 px-4">Kontak</th>
                  <th className="py-3 px-4">PIN Kasir</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Aksi & Simulasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredUsers.map((u) => {
                  const isCurrent = currentUser.id === u.id;
                  const isPrimaryOwner = u.id === 'usr_owner';

                  return (
                    <tr
                      key={u.id}
                      className={`hover:bg-canvas/50 transition-colors ${
                        isCurrent ? 'bg-sage-50/40' : ''
                      }`}
                    >
                      {/* Name & Avatar */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-xs ${
                              u.role === 'OWNER'
                                ? 'bg-emerald-600 text-white'
                                : u.role === 'ADMIN'
                                ? 'bg-indigo-600 text-white'
                                : u.role === 'STAFF'
                                ? 'bg-magenta-600 text-white'
                                : 'bg-amber-600 text-white'
                            }`}
                          >
                            {u.name
                              .split(' ')
                              .map((w) => w[0])
                              .slice(0, 2)
                              .join('')}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="font-bold text-ink truncate">{u.name}</p>
                              {isCurrent && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-extrabold bg-sage-500 text-white">
                                  Aktif Saat Ini
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-muted flex items-center gap-1 mt-0.5">
                              <Mail className="w-3 h-3 text-muted shrink-0" />
                              <span className="truncate">{u.email}</span>
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            u.role === 'OWNER'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : u.role === 'ADMIN'
                              ? 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                              : u.role === 'STAFF'
                              ? 'bg-magenta-50 text-magenta-800 border border-magenta-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          <Shield className="w-3 h-3" />
                          {u.role}
                        </span>
                      </td>

                      {/* Phone Contact */}
                      <td className="py-3 px-4 text-muted">
                        <span className="flex items-center gap-1 font-mono text-[11px] text-ink">
                          <Phone className="w-3 h-3 text-muted" />
                          {u.phone}
                        </span>
                      </td>

                      {/* Cashier PIN */}
                      <td className="py-3 px-4">
                        {u.pin ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono bg-canvas px-2 py-0.5 rounded border border-border text-[11px] text-ink font-semibold">
                              {u.pin}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setResetPinUser(u);
                                setNewPinInput(u.pin || '');
                              }}
                              title="Ganti PIN Kasir"
                              className="p-1 rounded text-muted hover:text-ink hover:bg-canvas"
                            >
                              <KeyRound className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-muted text-[11px] italic">-</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          disabled={isPrimaryOwner}
                          onClick={() => handleToggleStatus(u)}
                          title={isPrimaryOwner ? 'Owner utama tidak dapat dinonaktifkan' : 'Klik untuk ubah status'}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold transition-opacity ${
                            u.isActive
                              ? 'bg-emerald-50 text-success border border-emerald-200'
                              : 'bg-gray-100 text-gray-500 border border-gray-200'
                          } ${isPrimaryOwner ? 'opacity-70 cursor-not-allowed' : 'hover:opacity-80'}`}
                        >
                          {u.isActive ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Aktif</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3" />
                              <span>Nonaktif</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Switch demo account button */}
                          <button
                            type="button"
                            onClick={() => handleSwitchAccount(u)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border bg-canvas hover:bg-surface text-ink text-[11px] font-semibold transition-colors"
                            title="Simulasi login sebagai pengguna ini"
                          >
                            <LogIn className="w-3 h-3 text-sage-500" />
                            <span className="hidden sm:inline">Beralih Akun</span>
                          </button>

                          {/* Edit button */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(u)}
                            className="p-1.5 rounded-lg border border-border text-ink hover:bg-canvas"
                            title="Edit Data Pengguna"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete button (protected for primary owner) */}
                          {!isPrimaryOwner && (
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(u)}
                              className="p-1.5 rounded-lg border border-border text-danger hover:bg-rose-50"
                              title="Hapus Pengguna"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info Card on Role Permissions */}
      <div className="bg-sage-50/70 border border-sage-100 rounded-2xl p-4 text-xs text-sage-800 space-y-2">
        <p className="font-bold flex items-center gap-1.5 text-ink">
          <Sparkles className="w-4 h-4 text-magenta-500" />
          Panduan Hak Akses Role Warung Sembako:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] text-ink-soft">
          <div className="p-2.5 rounded-lg bg-surface border border-sage-200 space-y-1">
            <span className="font-bold text-emerald-800 block">OWNER (Pemilik Warung):</span>
            <p className="text-muted leading-relaxed">
              Memiliki wewenang tertinggi: menyetujui pengajuan logo toko dari Admin, melihat laporan profit bersih & omzet, mengedit profil rekening pribadi, dan mengelola pengguna.
            </p>
          </div>
          <div className="p-2.5 rounded-lg bg-surface border border-sage-200 space-y-1">
            <span className="font-bold text-indigo-800 block">ADMIN (Toko & Gudang):</span>
            <p className="text-muted leading-relaxed">
              Mengelola katalog sembako, stok gudang, tier harga grosir, pesanan & resi online, serta mengajukan usulan logo toko baru ke Owner.
            </p>
          </div>
          <div className="p-2.5 rounded-lg bg-surface border border-sage-200 space-y-1">
            <span className="font-bold text-magenta-800 block">STAFF (Kasir Utama):</span>
            <p className="text-muted leading-relaxed">
              Fokus pada operasional cepat POS kasir di toko, input transaksi tunai/transfer/QRIS, cetak struk belanja, dan rekonsiliasi kas shift kasir.
            </p>
          </div>
        </div>
      </div>

      {/* MODAL: Tambah Pengguna Baru */}
      {isAddModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-xs"
        >
          <div className="bg-surface rounded-2xl border border-border shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-ink flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-magenta-500" />
                <span>Tambah Pengguna Baru</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-muted hover:text-ink p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdd} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-ink block">
                  Nama Lengkap <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Rina Melati"
                  className="w-full px-3 py-2 bg-canvas border border-border rounded-lg text-ink font-semibold focus:ring-2 focus:ring-magenta-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-ink block">
                  Email Akun <span className="text-danger">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Contoh: rina.kasir@warungsembako.demo"
                  className="w-full px-3 py-2 bg-canvas border border-border rounded-lg text-ink focus:ring-2 focus:ring-magenta-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-ink block">
                  No. Telepon / WhatsApp <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Contoh: 0812-3456-7890"
                  className="w-full px-3 py-2 bg-canvas border border-border rounded-lg text-ink focus:ring-2 focus:ring-magenta-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-ink block">Role Akses</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
                    className="w-full px-3 py-2 bg-canvas border border-border rounded-lg text-ink font-semibold focus:ring-2 focus:ring-magenta-500"
                  >
                    <option value="STAFF">STAFF (Kasir)</option>
                    <option value="ADMIN">ADMIN (Toko & Gudang)</option>
                    <option value="OWNER">OWNER (Pemilik)</option>
                    <option value="CUSTOMER">CUSTOMER (Pelanggan)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-ink block">PIN Kasir / Otorisasi</label>
                  <input
                    type="text"
                    value={formData.pin}
                    onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                    placeholder="Contoh: 123456"
                    className="w-full px-3 py-2 bg-canvas border border-border rounded-lg text-ink font-mono focus:ring-2 focus:ring-magenta-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-border mt-4">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-border text-muted hover:text-ink font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-magenta-500 hover:bg-magenta-700 text-white font-bold shadow-sm"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Pengguna</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Edit Pengguna */}
      {editingUser && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-xs"
        >
          <div className="bg-surface rounded-2xl border border-border shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-ink flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-sage-500" />
                <span>Edit Pengguna: {editingUser.name}</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="text-muted hover:text-ink p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-ink block">
                  Nama Lengkap <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-canvas border border-border rounded-lg text-ink font-semibold focus:ring-2 focus:ring-sage-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-ink block">
                  Email Akun <span className="text-danger">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-canvas border border-border rounded-lg text-ink focus:ring-2 focus:ring-sage-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-ink block">
                  No. Telepon / WhatsApp <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-canvas border border-border rounded-lg text-ink focus:ring-2 focus:ring-sage-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-ink block">Role Akses</label>
                  <select
                    disabled={editingUser.id === 'usr_owner'}
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
                    className="w-full px-3 py-2 bg-canvas border border-border rounded-lg text-ink font-semibold focus:ring-2 focus:ring-sage-500 disabled:opacity-60"
                  >
                    <option value="STAFF">STAFF (Kasir)</option>
                    <option value="ADMIN">ADMIN (Toko & Gudang)</option>
                    <option value="OWNER">OWNER (Pemilik)</option>
                    <option value="CUSTOMER">CUSTOMER (Pelanggan)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-ink block">PIN Kasir</label>
                  <input
                    type="text"
                    value={formData.pin}
                    onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                    className="w-full px-3 py-2 bg-canvas border border-border rounded-lg text-ink font-mono focus:ring-2 focus:ring-sage-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-border mt-4">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-lg border border-border text-muted hover:text-ink font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-sage-500 hover:bg-sage-700 text-white font-bold shadow-sm"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Reset PIN Kasir */}
      {resetPinUser && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-xs"
        >
          <div className="bg-surface rounded-2xl border border-border shadow-2xl max-w-sm w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-ink flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-magenta-500" />
                <span>Reset PIN: {resetPinUser.name.split(' ')[0]}</span>
              </h3>
              <button
                type="button"
                onClick={() => setResetPinUser(null)}
                className="text-muted hover:text-ink p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePin} className="space-y-3 text-xs">
              <p className="text-muted">
                Masukkan PIN baru (minimal 4 angka) untuk otorisasi login dan transaksi kasir POS.
              </p>

              <div className="space-y-1">
                <label className="font-semibold text-ink block">PIN Baru</label>
                <input
                  type="password"
                  required
                  autoFocus
                  maxLength={8}
                  value={newPinInput}
                  onChange={(e) => setNewPinInput(e.target.value)}
                  placeholder="Contoh: 123456"
                  className="w-full px-3 py-2 bg-canvas border border-border rounded-lg text-ink font-mono text-center tracking-widest text-base font-bold focus:ring-2 focus:ring-magenta-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-border mt-4">
                <button
                  type="button"
                  onClick={() => setResetPinUser(null)}
                  className="px-4 py-2 rounded-lg border border-border text-muted hover:text-ink font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-magenta-500 hover:bg-magenta-700 text-white font-bold shadow-sm"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan PIN Baru</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
