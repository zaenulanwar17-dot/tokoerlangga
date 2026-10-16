import React, { useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Search,
  User,
  Store,
  ChevronDown,
  Phone,
  MapPin,
  Clock,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useStorefrontCart } from '../../context/StorefrontCartContext';
import { useDemoAuth } from '../../context/DemoAuthContext';
import { useStoreSettings } from '../../context/StoreSettingsContext';
import { PriceTierBadge } from '../ui/PriceTierBadge';

export const StorefrontLayout: React.FC = () => {
  const { itemCount } = useStorefrontCart();
  const { storeProfile } = useStoreSettings();
  const { role, activeCustomer, availableCustomers, setActiveCustomer, setRole } = useDemoAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/produk?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/produk');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-ink">
      {/* Main Storefront Header */}
      <header className="bg-surface border-b border-border sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 shrink-0">
              {storeProfile.logoUrl ? (
                <img
                  src={storeProfile.logoUrl}
                  alt={storeProfile.name}
                  className="w-10 h-10 rounded-xl object-contain border border-border shadow-sm shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-sage-500 text-white flex items-center justify-center font-bold text-xl shadow-sm shrink-0">
                  WS
                </div>
              )}
              <div className="hidden sm:block">
                <span className="text-base font-bold text-ink block leading-tight">
                  {storeProfile.name}
                </span>
                <span className="text-xs text-muted block">{storeProfile.tagline}</span>
              </div>
            </Link>

            {/* Search Input Bar */}
            <form
              onSubmit={handleSearchSubmit}
              className="flex-1 max-w-lg relative hidden md:block"
            >
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari beras, minyak, telur, tepung, gula..."
                  className="w-full pl-9 pr-4 py-2 text-sm bg-canvas border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500 focus:bg-surface transition-all placeholder:text-muted"
                />
                <Search className="w-4 h-4 text-muted absolute left-3 top-2.5 pointer-events-none" />
              </div>
            </form>

            {/* Right Action Icons: Customer Tier & Cart & Role Switcher */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Customer tier selector / login simulation */}
              <div className="relative">
                {role === 'CUSTOMER' && activeCustomer ? (
                  <button
                    type="button"
                    onClick={() => setCustomerDropdownOpen(!customerDropdownOpen)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border hover:bg-canvas text-xs font-medium transition-colors"
                  >
                    <User className="w-3.5 h-3.5 text-sage-500" />
                    <span className="hidden sm:inline max-w-[120px] truncate">
                      {activeCustomer.name.split(' ')[0]}
                    </span>
                    <PriceTierBadge tier={activeCustomer.tier} size="sm" />
                    <ChevronDown className="w-3.5 h-3.5 text-muted" />
                  </button>
                ) : (
                  <Link
                    to="/login"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border hover:bg-canvas text-xs font-semibold text-ink-soft transition-colors"
                  >
                    <User className="w-4 h-4 text-muted" />
                    <span>Masuk Demo</span>
                  </Link>
                )}

                {/* Dropdown to switch active customer account */}
                {customerDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-surface border border-border rounded-xl shadow-lg p-2 z-50 text-xs">
                    <p className="px-2 py-1 text-muted font-medium border-b border-border mb-1">
                      Simulasi Akun Pelanggan:
                    </p>
                    {availableCustomers.map((cust) => (
                      <button
                        key={cust.id}
                        type="button"
                        onClick={() => {
                          setActiveCustomer(cust);
                          setRole('CUSTOMER');
                          setCustomerDropdownOpen(false);
                        }}
                        className={`w-full text-left px-2 py-2 rounded-lg flex items-center justify-between hover:bg-sage-50 transition-colors ${
                          activeCustomer?.id === cust.id ? 'bg-sage-100 font-semibold text-sage-700' : 'text-ink'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <p className="truncate font-medium">{cust.name}</p>
                          <p className="text-[10px] text-muted">{cust.phone}</p>
                        </div>
                        <PriceTierBadge tier={cust.tier} size="sm" />
                      </button>
                    ))}
                    <div className="mt-2 pt-2 border-t border-border">
                      <Link
                        to="/akun/pesanan"
                        onClick={() => setCustomerDropdownOpen(false)}
                        className="block px-2 py-1 text-magenta-700 font-medium hover:underline"
                      >
                        Lihat Pesanan Saya →
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Internal App shortcut */}
              <Link
                to="/app"
                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sage-50 text-sage-700 hover:bg-sage-100 border border-sage-300 text-xs font-semibold transition-colors"
                title="Buka panel Admin / POS Kasir"
              >
                <Store className="w-3.5 h-3.5" />
                <span>Panel Kasir/Admin</span>
              </Link>

              {/* Shopping Cart button */}
              <Link
                to="/keranjang"
                className="relative flex items-center gap-2 px-3 py-1.5 rounded-lg bg-magenta-500 hover:bg-magenta-700 text-white text-xs sm:text-sm font-semibold shadow-sm transition-colors"
                aria-label={`Keranjang belanja, ${itemCount} barang`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span className="hidden sm:inline">Keranjang</span>
                {itemCount > 0 && (
                  <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-white text-magenta-700 text-xs font-bold leading-none">
                    {itemCount}
                  </span>
                )}
              </Link>
            </div>
          </div>

          {/* Mobile search bar */}
          <div className="pb-3 md:hidden">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari beras, minyak, tepung..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-canvas border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500"
              />
              <Search className="w-4 h-4 text-muted absolute left-3 top-2.5 pointer-events-none" />
            </form>
          </div>
        </div>

        {/* Quick category navigation bar */}
        <div className="bg-canvas/80 border-t border-border overflow-x-auto text-xs py-2 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex items-center gap-4 whitespace-nowrap">
            <Link to="/produk" className="font-semibold text-sage-700 hover:text-ink">
              Semua Produk
            </Link>
            <Link to="/produk?cat=cat_beras" className="text-muted hover:text-ink">
              Beras & Biji-bijian
            </Link>
            <Link to="/produk?cat=cat_minyak" className="text-muted hover:text-ink">
              Minyak & Mentega
            </Link>
            <Link to="/produk?cat=cat_gula" className="text-muted hover:text-ink">
              Gula & Garam
            </Link>
            <Link to="/produk?cat=cat_telur" className="text-muted hover:text-ink">
              Telur & Susu
            </Link>
            <Link to="/produk?cat=cat_tepung" className="text-muted hover:text-ink">
              Tepung Terigu
            </Link>
            <Link to="/produk?cat=cat_mie" className="text-muted hover:text-ink">
              Makanan Instan
            </Link>
            <Link to="/akun/pesanan" className="ml-auto font-medium text-magenta-700 hover:text-magenta-500">
              Cek Status Pesanan →
            </Link>
          </div>
        </div>
      </header>

      {/* Customer Wholesale Welcome Notification Banner */}
      {role === 'CUSTOMER' && activeCustomer && activeCustomer.tier !== 'RETAIL' && (
        <div className="bg-amber-50/80 border-b border-amber-200/80 px-4 py-2 text-xs text-amber-900">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              Halo <strong>{activeCustomer.name}</strong>! Anda belanja dengan harga{' '}
              <PriceTierBadge tier={activeCustomer.tier} size="sm" />. Potongan harga otomatis terpasang.
            </span>
            <Link to="/keranjang" className="font-semibold underline shrink-0">
              Buka Keranjang
            </Link>
          </div>
        </div>
      )}

      {/* Main Outlet */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>

      {/* Storefront Footer */}
      <footer className="bg-surface border-t border-border mt-12 text-sm text-ink-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {storeProfile.logoUrl ? (
                  <img
                    src={storeProfile.logoUrl}
                    alt={storeProfile.name}
                    className="w-8 h-8 rounded-lg object-contain border border-border shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-sage-500 text-white flex items-center justify-center font-bold text-sm shrink-0">
                    WS
                  </div>
                )}
                <span className="font-bold text-ink">{storeProfile.name}</span>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                Penyedia kebutuhan pokok sembako berkualitas dengan harga eceran dan grosir langsung dari distributor terpercaya.
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <h4 className="font-semibold text-ink uppercase tracking-wider text-[11px]">Layanan Pelanggan</h4>
              <p className="flex items-center gap-2 text-muted">
                <Clock className="w-4 h-4 text-sage-500 shrink-0" />
                Buka Setiap Hari: 06.30 - 21.00 WIB
              </p>
              <p className="flex items-center gap-2 text-muted">
                <Phone className="w-4 h-4 text-sage-500 shrink-0" />
                WhatsApp: {storeProfile.phone} (Demo)
              </p>
              <p className="flex items-center gap-2 text-muted">
                <MapPin className="w-4 h-4 text-sage-500 shrink-0" />
                {storeProfile.address}
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <h4 className="font-semibold text-ink uppercase tracking-wider text-[11px]">Tier Harga Grosir</h4>
              <p className="text-muted">
                • <strong>Eceran:</strong> Pembelian harian satuan rumah tangga.
              </p>
              <p className="text-muted">
                • <strong>Grosir 1:</strong> Khusus warung kelontong & pedagang makanan.
              </p>
              <p className="text-muted">
                • <strong>Grosir 2:</strong> Mitra katering & pesanan volume besar.
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <h4 className="font-semibold text-ink uppercase tracking-wider text-[11px]">Sistem POS & Validasi</h4>
              <p className="text-muted">
                Aplikasi ini berjalan dalam mode demo validasi SOT frontend-first.
              </p>
              <Link
                to="/login"
                className="inline-block mt-2 px-3 py-1.5 rounded-lg bg-sage-100 hover:bg-sage-300 text-sage-700 font-semibold transition-colors"
              >
                Beralih ke Panel Kasir / Admin →
              </Link>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between text-xs text-muted gap-2">
            <p>© 2026 Warung Sembako POS — Mode Demo Prototype Frontend</p>
            <p className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-success" />
              Toko tunggal & Gudang tunggal • SOT v1.0
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
