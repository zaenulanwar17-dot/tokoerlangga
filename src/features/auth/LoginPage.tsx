import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Crown,
  Shield,
  ShoppingCart,
  User,
  ArrowRight,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { useDemoAuth } from '../../context/DemoAuthContext';
import { Role } from '../../domain/types';
import { useToast } from '../../context/ToastContext';

export const LoginPage: React.FC = () => {
  const { role, setRole, availableCustomers, setActiveCustomer, activeCustomer } = useDemoAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleSelectRole = (newRole: Role) => {
    setRole(newRole);
    showToast(`Beralih ke role demo: ${newRole}`, 'info');

    if (newRole === 'OWNER') {
      navigate('/app/owner');
    } else if (newRole === 'ADMIN') {
      navigate('/app/admin');
    } else if (newRole === 'STAFF') {
      navigate('/app/kasir');
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-sage-500 text-white font-bold text-2xl shadow-sm mb-2">
            WS
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink">
            Pemilih Role Simulasi Demo
          </h1>
          <p className="text-sm text-muted max-w-md mx-auto">
            Warung Sembako POS — Pilih profil pengguna untuk menguji alur kerja sesuai hak akses sebelum backend dibuat.
          </p>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-300 text-xs font-semibold text-amber-900 mt-2">
            <AlertTriangle className="w-3.5 h-3.5 text-warning" />
            MODE DEMO — Bukan autentikasi keamanan produksi
          </div>
        </div>

        {/* Role Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* OWNER CARD */}
          <div
            onClick={() => handleSelectRole('OWNER')}
            className={`p-5 rounded-2xl border-2 cursor-pointer transition-all bg-surface hover:shadow-md ${
              role === 'OWNER'
                ? 'border-magenta-500 ring-2 ring-magenta-100'
                : 'border-border hover:border-sage-300'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="p-3 rounded-xl bg-purple-50 text-purple-700">
                <Crown className="w-6 h-6" />
              </div>
              {role === 'OWNER' && (
                <span className="text-[11px] font-bold text-magenta-700 bg-magenta-50 px-2 py-0.5 rounded-full">
                  Role Aktif
                </span>
              )}
            </div>
            <h3 className="text-base font-bold text-ink mt-3">Owner (Pemilik Toko)</h3>
            <p className="text-xs text-muted mt-1 leading-relaxed">
              Pantau omzet penjualan, laba kotor, piutang jatuh tempo, stok menipis, dan ringkasan performa kasir.
            </p>
            <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs font-semibold text-magenta-700">
              <span>Masuk ke Ringkasan Bisnis</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* ADMIN CARD */}
          <div
            onClick={() => handleSelectRole('ADMIN')}
            className={`p-5 rounded-2xl border-2 cursor-pointer transition-all bg-surface hover:shadow-md ${
              role === 'ADMIN'
                ? 'border-magenta-500 ring-2 ring-magenta-100'
                : 'border-border hover:border-sage-300'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="p-3 rounded-xl bg-blue-50 text-blue-700">
                <Shield className="w-6 h-6" />
              </div>
              {role === 'ADMIN' && (
                <span className="text-[11px] font-bold text-magenta-700 bg-magenta-50 px-2 py-0.5 rounded-full">
                  Role Aktif
                </span>
              )}
            </div>
            <h3 className="text-base font-bold text-ink mt-3">Admin (Gudang & Toko)</h3>
            <p className="text-xs text-muted mt-1 leading-relaxed">
              Kelola katalog sembako, aturan harga bertingkat, penyesuaian stok dengan alasan, pesanan & nomor resi.
            </p>
            <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs font-semibold text-magenta-700">
              <span>Masuk ke Operasional Toko</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* STAFF / KASIR CARD */}
          <div
            onClick={() => handleSelectRole('STAFF')}
            className={`p-5 rounded-2xl border-2 cursor-pointer transition-all bg-surface hover:shadow-md ${
              role === 'STAFF'
                ? 'border-magenta-500 ring-2 ring-magenta-100'
                : 'border-border hover:border-sage-300'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700">
                <ShoppingCart className="w-6 h-6" />
              </div>
              {role === 'STAFF' && (
                <span className="text-[11px] font-bold text-magenta-700 bg-magenta-50 px-2 py-0.5 rounded-full">
                  Role Aktif
                </span>
              )}
            </div>
            <h3 className="text-base font-bold text-ink mt-3">Staff / Kasir POS</h3>
            <p className="text-xs text-muted mt-1 leading-relaxed">
              Alat kasir cepat: input barcode/SKU, pilih pelanggan grosir, hitung kembalian tunai, cetak struk demo.
            </p>
            <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs font-semibold text-magenta-700">
              <span>Buka Mesin Kasir POS</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* CUSTOMER CARD */}
          <div
            onClick={() => handleSelectRole('CUSTOMER')}
            className={`p-5 rounded-2xl border-2 cursor-pointer transition-all bg-surface hover:shadow-md ${
              role === 'CUSTOMER'
                ? 'border-magenta-500 ring-2 ring-magenta-100'
                : 'border-border hover:border-sage-300'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="p-3 rounded-xl bg-amber-50 text-amber-700">
                <User className="w-6 h-6" />
              </div>
              {role === 'CUSTOMER' && (
                <span className="text-[11px] font-bold text-magenta-700 bg-magenta-50 px-2 py-0.5 rounded-full">
                  Role Aktif
                </span>
              )}
            </div>
            <h3 className="text-base font-bold text-ink mt-3">Customer (Pelanggan)</h3>
            <p className="text-xs text-muted mt-1 leading-relaxed">
              Jelajahi toko online, uji tier harga grosir otomatis, checkout pengiriman kurir, dan lacak status pesanan.
            </p>
            <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs font-semibold text-magenta-700">
              <span>Buka Storefront Toko</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Customer simulation selector */}
        {role === 'CUSTOMER' && (
          <div className="bg-surface p-4 rounded-xl border border-border space-y-2">
            <p className="text-xs font-bold text-ink flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              Pilih Profil Pelanggan Demo:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              {availableCustomers.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setActiveCustomer(c);
                    showToast(`Profil aktif: ${c.name} (${c.tier})`, 'info');
                  }}
                  className={`p-2.5 rounded-lg border text-left transition-colors ${
                    activeCustomer?.id === c.id
                      ? 'border-sage-500 bg-sage-50 font-semibold text-sage-700'
                      : 'border-border bg-canvas hover:bg-surface text-ink'
                  }`}
                >
                  <p className="truncate font-semibold">{c.name.split(' ')[0]}</p>
                  <p className="text-[11px] text-muted">Tier: {c.tier}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="text-center">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-xs text-muted hover:text-ink font-medium underline"
          >
            ← Kembali ke Beranda Toko Online
          </button>
        </div>
      </div>
    </div>
  );
};
