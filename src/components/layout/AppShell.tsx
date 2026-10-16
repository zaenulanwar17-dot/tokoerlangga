import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Tags,
  Boxes,
  ClipboardList,
  CreditCard,
  BarChart3,
  Settings,
  Menu,
  X,
  Store,
  ChevronRight,
  Users,
  Truck,
  Building2,
  ClipboardCheck,
} from 'lucide-react';
import { useDemoAuth } from '../../context/DemoAuthContext';
import { useStoreSettings } from '../../context/StoreSettingsContext';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  badge?: string;
}

export const AppShell: React.FC = () => {
  const { role, currentUser } = useDemoAuth();
  const { storeProfile } = useStoreSettings();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Navigation items filtered strictly by role as required by UI-GUIDELINE
  const getNavItems = (): NavItem[] => {
    if (role === 'STAFF') {
      return [
        { label: 'Kasir POS', path: '/app/kasir', icon: <ShoppingCart className="w-5 h-5" /> },
        { label: 'Riwayat Struk & Order', path: '/app/pesanan', icon: <ClipboardList className="w-5 h-5" /> },
        { label: 'Persediaan Ringkas', path: '/app/persediaan', icon: <Boxes className="w-5 h-5" /> },
        { label: 'Shift Kasir', path: '/app/pengaturan', icon: <Settings className="w-5 h-5" /> },
      ];
    }

    if (role === 'ADMIN') {
      return [
        { label: 'Dashboard Admin', path: '/app/admin', icon: <LayoutDashboard className="w-5 h-5" /> },
        { label: 'Kelola Pengguna', path: '/app/pengguna', icon: <Users className="w-5 h-5" /> },
        { label: 'Katalog Produk', path: '/app/produk', icon: <Package className="w-5 h-5" /> },
        { label: 'Harga Bertingkat', path: '/app/harga', icon: <Tags className="w-5 h-5" /> },
        { label: 'Persediaan & Stok', path: '/app/persediaan', icon: <Boxes className="w-5 h-5" /> },
        { label: 'Input Pembelian (Kulakan)', path: '/app/pembelian', icon: <Truck className="w-5 h-5" /> },
        { label: 'Data Supplier', path: '/app/supplier?tab=supplier', icon: <Building2 className="w-5 h-5" /> },
        { label: 'Pesanan & Resi', path: '/app/pesanan', icon: <ClipboardList className="w-5 h-5" /> },
        { label: 'Buku Piutang', path: '/app/piutang', icon: <CreditCard className="w-5 h-5" /> },
        { label: 'Kasir POS', path: '/app/kasir', icon: <ShoppingCart className="w-5 h-5" /> },
        { label: 'Pengaturan Toko', path: '/app/pengaturan', icon: <Settings className="w-5 h-5" /> },
      ];
    }

    // Default: OWNER
    const hasPendingLogo = storeProfile.logoSubmission?.status === 'PENDING';
    return [
      { label: 'Ringkasan Bisnis', path: '/app/owner', icon: <LayoutDashboard className="w-5 h-5" /> },
      { label: 'Kelola Pengguna', path: '/app/pengguna', icon: <Users className="w-5 h-5" /> },
      { label: 'Laporan Penjualan', path: '/app/laporan', icon: <BarChart3 className="w-5 h-5" /> },
      { label: 'Monitoring Stok', path: '/app/persediaan', icon: <Boxes className="w-5 h-5" /> },
      { label: 'Input Pembelian (Kulakan)', path: '/app/pembelian', icon: <Truck className="w-5 h-5" /> },
      { label: 'Data Supplier', path: '/app/supplier?tab=supplier', icon: <Building2 className="w-5 h-5" /> },
      { label: 'Piutang & Kredit', path: '/app/piutang', icon: <CreditCard className="w-5 h-5" /> },
      { label: 'Daftar Transaksi', path: '/app/pesanan', icon: <ClipboardList className="w-5 h-5" /> },
      { label: 'Persetujuan Kasir Tutup Buku', path: '/app/kasir', icon: <ClipboardCheck className="w-5 h-5" /> },
      { label: 'Katalog & Harga', path: '/app/harga', icon: <Tags className="w-5 h-5" /> },
      {
        label: 'Pengaturan Toko',
        path: '/app/pengaturan',
        icon: <Settings className="w-5 h-5" />,
        badge: hasPendingLogo ? 'Logo Baru' : undefined,
      },
    ];
  };

  const navItems = getNavItems();

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-ink">
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar (256px) */}
        <aside
          aria-label="Navigasi Utama"
          className="hidden lg:flex lg:flex-col w-64 bg-surface border-r border-border shrink-0 select-none"
        >
          {/* Brand header */}
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              {storeProfile.logoUrl ? (
                <img
                  src={storeProfile.logoUrl}
                  alt={storeProfile.name}
                  className="w-9 h-9 rounded-lg object-contain border border-border shadow-sm shrink-0"
                />
              ) : (
                <div className="w-9 h-9 rounded-lg bg-sage-500 text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
                  WS
                </div>
              )}
              <div className="min-w-0">
                <h1 className="text-sm font-bold text-ink leading-tight truncate max-w-[140px]" title={storeProfile.name}>
                  {storeProfile.name}
                </h1>
                <p className="text-xs text-muted truncate max-w-[140px]" title={storeProfile.tagline}>
                  {storeProfile.tagline}
                </p>
              </div>
            </div>
          </div>

          {/* User profile card */}
          <div className="px-4 py-3 bg-sage-50/50 border-b border-border/80 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-sage-300 text-sage-700 flex items-center justify-center font-bold text-xs shrink-0">
                {currentUser.role.substring(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-ink truncate">{currentUser.name}</p>
                <p className="text-[11px] text-muted capitalize">Role: {role.toLowerCase()}</p>
              </div>
            </div>
            <Link
              to="/login"
              title="Ganti Role"
              className="text-xs font-semibold text-magenta-700 hover:text-magenta-800 hover:underline shrink-0"
            >
              Ganti Role
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-sage-100 text-sage-700 font-semibold shadow-xs'
                      : 'text-ink-soft hover:bg-canvas hover:text-ink'
                  }`
                }
              >
                {item.icon}
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <span className="px-1.5 py-0.5 text-xs font-semibold rounded bg-magenta-50 text-magenta-700">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Sidebar Footer Link to Storefront */}
          <div className="p-3 border-t border-border">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-ink-soft bg-canvas hover:bg-sage-100 border border-border transition-colors"
            >
              <span className="flex items-center gap-2">
                <Store className="w-4 h-4 text-sage-500" />
                Buka Toko Online
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-muted" />
            </button>
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-40 flex">
            <div
              className="fixed inset-0 bg-ink/40 backdrop-blur-xs"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-surface border-r border-border p-4 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-sage-500 text-white flex items-center justify-center font-bold text-sm">
                    WS
                  </div>
                  <span className="font-bold text-sm text-ink">Warung Sembako</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-md text-muted hover:text-ink"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="py-3 border-b border-border text-xs flex items-center justify-between">
                <div>
                  <p className="font-semibold text-ink">{currentUser.name}</p>
                  <p className="text-muted">Role: {role}</p>
                </div>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-xs font-semibold text-magenta-700 hover:underline"
                >
                  Ganti Role
                </Link>
              </div>

              <nav className="flex-1 py-3 space-y-1 overflow-y-auto">
                {navItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-sage-100 text-sage-700 font-semibold'
                          : 'text-ink-soft hover:bg-canvas hover:text-ink'
                      }`
                    }
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </nav>

              <div className="pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/');
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-sage-100 text-sage-700"
                >
                  <Store className="w-4 h-4" />
                  Buka Toko Online
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Mobile Topbar */}
          <header className="lg:hidden bg-surface border-b border-border px-4 py-2.5 flex items-center justify-between sticky top-0 z-30">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 rounded-lg border border-border text-ink hover:bg-canvas"
              aria-label="Buka menu navigasi"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 min-w-0">
              {storeProfile.logoUrl ? (
                <img
                  src={storeProfile.logoUrl}
                  alt={storeProfile.name}
                  className="w-6 h-6 rounded object-contain border border-border shrink-0"
                />
              ) : null}
              <span className="font-bold text-sm text-ink truncate max-w-[170px]" title={storeProfile.name}>
                {storeProfile.name}
              </span>
            </div>
            <button
              type="button"
              onClick={() => navigate('/app/kasir')}
              className="px-2.5 py-1 text-xs font-semibold rounded-md bg-magenta-500 text-white flex items-center gap-1 shadow-sm"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              POS
            </button>
          </header>

          {/* Page Outlet */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};
