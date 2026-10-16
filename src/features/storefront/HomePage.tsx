import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag,
  TrendingUp,
  Truck,
  ArrowRight,
  PackageCheck,
  Sparkles,
  Tag,
} from 'lucide-react';
import { Product } from '../../domain/types';
import { productRepository } from '../../services';
import { formatIDR } from '../../domain/money';
import { StockBadge } from '../../components/ui/StockBadge';
import { useStorefrontCart } from '../../context/StorefrontCartContext';
import { useStoreSettings } from '../../context/StoreSettingsContext';
import { useToast } from '../../context/ToastContext';
import { DEMO_CATEGORIES } from '../../data/demo-data';

export const HomePage: React.FC = () => {
  const { storeProfile } = useStoreSettings();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { addItem } = useStorefrontCart();
  const { showToast } = useToast();

  useEffect(() => {
    async function load() {
      setLoading(true);
      const list = await productRepository.list({ isActive: true });
      setFeaturedProducts(list.slice(0, 8));
      setLoading(false);
    }
    load();
  }, []);

  const handleAddToCart = (product: Product, e: React.MouseEvent) => {
    e.preventDefault();
    if (product.stock.available <= 0) {
      showToast(`Maaf, stok ${product.name} sedang habis.`, 'error');
      return;
    }
    addItem(product, 1);
    showToast(`Berhasil menambahkan 1 ${product.unit} ${product.name} ke keranjang!`, 'success');
  };

  return (
    <div className="space-y-10">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-sage-700 via-sage-700 to-sage-500 text-white p-6 sm:p-10 lg:p-12 shadow-sm">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-xs font-semibold tracking-wide text-sage-100">
            <Sparkles className="w-3.5 h-3.5 text-magenta-300" />
            Distributor Sembako Terpercaya Sejak 2018
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Belanja Kebutuhan Pokok Sembako Murah, Lengkap, dan Cepat
          </h1>
          <p className="text-sm sm:text-base text-sage-100 leading-relaxed">
            Dapatkan harga bersahabat untuk belanja harian rumah tangga, serta potongan khusus grosir
            untuk warung kelontong dan mitra usaha kuliner.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link
              to="/produk"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-magenta-500 hover:bg-magenta-700 text-white text-sm font-semibold shadow-sm transition-colors"
            >
              <span>Belanja Sekarang</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-semibold backdrop-blur-sm border border-white/20 transition-colors"
            >
              <Tag className="w-4 h-4" />
              <span>Simulasi Role Demo</span>
            </Link>
          </div>
        </div>

        {/* Decorative background circle */}
        <div className="absolute -right-12 -bottom-12 w-80 h-80 rounded-full bg-white/5 pointer-events-none" />
      </section>

      {/* Feature highlights bar */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-surface border border-border flex items-start gap-3">
          <div className="p-2.5 rounded-lg bg-sage-50 text-sage-700 shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-ink">Harga Bertingkat Realistis</h4>
            <p className="text-xs text-muted mt-0.5">
              Tersedia harga Eceran, Grosir 1 (Warung), dan Grosir 2 (Volume Besar).
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-border flex items-start gap-3">
          <div className="p-2.5 rounded-lg bg-sage-50 text-sage-700 shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-ink">Pengiriman Cepat</h4>
            <p className="text-xs text-muted mt-0.5">
              Pilihan armada kurir toko express untuk area lokal atau ekspedisi demo.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-border flex items-start gap-3">
          <div className="p-2.5 rounded-lg bg-sage-50 text-sage-700 shrink-0">
            <PackageCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-ink">Stok Terpantau Akurat</h4>
            <p className="text-xs text-muted mt-0.5">
              Stok fisik di gudang terhubung langsung dengan sistem kasir POS toko.
            </p>
          </div>
        </div>
      </section>

      {/* Kategori Populer */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-ink">Kategori Sembako</h2>
            <p className="text-xs text-muted">Pilih kategori untuk memfilter produk yang dibutuhkan</p>
          </div>
          <Link to="/produk" className="text-xs font-semibold text-magenta-700 hover:underline">
            Lihat Semua →
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3">
          {DEMO_CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              to={`/produk?cat=${cat.id}`}
              className="p-3.5 rounded-xl bg-surface hover:bg-sage-50 border border-border hover:border-sage-300 transition-all group flex items-center justify-between"
            >
              <div className="font-medium text-xs sm:text-sm text-ink group-hover:text-sage-700 truncate">
                {cat.name}
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-muted group-hover:text-sage-700 shrink-0 transition-transform group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-ink">Produk Pilihan Hari Ini</h2>
            <p className="text-xs text-muted">Sembako pokok kualitas terbaik dengan harga termurah</p>
          </div>
          <Link to="/produk" className="text-xs font-semibold text-magenta-700 hover:underline">
            Lihat Katalog Lengkap ({featuredProducts.length} produk) →
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-64 rounded-xl bg-surface animate-pulse border border-border p-4" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {featuredProducts.map((prod) => {
              const retailRule = prod.priceRules.find((r) => r.tier === 'RETAIL' && r.minQuantity === 1);
              const wholesaleRule = prod.priceRules.find((r) => r.tier === 'WHOLESALE_1');
              const displayPrice = retailRule ? retailRule.unitPrice : 0;

              return (
                <div
                  key={prod.id}
                  className="bg-surface rounded-xl border border-border hover:border-sage-300 hover:shadow-sm transition-all flex flex-col overflow-hidden"
                >
                  {/* Product Header / Tag */}
                  <div className="p-3 bg-canvas/60 border-b border-border flex items-center justify-between">
                    <span className="text-[11px] font-mono text-muted uppercase">{prod.sku}</span>
                    <StockBadge status={prod.stock.status} availableCount={prod.stock.available} unit={prod.unit} />
                  </div>

                  {/* Body */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <p className="text-[11px] text-sage-700 font-semibold">{prod.categoryName}</p>
                      <Link
                        to={`/produk/${prod.id}`}
                        className="text-sm font-bold text-ink hover:text-magenta-700 line-clamp-2 mt-0.5 leading-snug"
                      >
                        {prod.name}
                      </Link>
                      <p className="text-xs text-muted line-clamp-2 mt-1">
                        {prod.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-border/80">
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs text-muted">Eceran:</span>
                        <span className="text-base font-bold text-ink tabular-nums">
                          {formatIDR(displayPrice)}
                          <span className="text-xs font-normal text-muted">/{prod.unit}</span>
                        </span>
                      </div>

                      {wholesaleRule && (
                        <div className="flex items-center justify-between text-[11px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded mt-1">
                          <span>Grosir min {wholesaleRule.minQuantity} {prod.unit}:</span>
                          <span className="font-semibold tabular-nums">
                            {formatIDR(wholesaleRule.unitPrice)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer actions */}
                  <div className="p-3 bg-canvas/40 border-t border-border flex items-center gap-2">
                    <Link
                      to={`/produk/${prod.id}`}
                      className="flex-1 py-1.5 text-center text-xs font-semibold rounded-lg border border-border hover:bg-canvas text-ink-soft transition-colors"
                    >
                      Detail
                    </Link>
                    <button
                      type="button"
                      disabled={prod.stock.available <= 0}
                      onClick={(e) => handleAddToCart(prod, e)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-magenta-500 hover:bg-magenta-700 disabled:opacity-40 text-white flex items-center gap-1.5 transition-colors"
                      title="Tambah ke keranjang"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Beli</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Guide Section: Cara Belanja Bertingkat */}
      <section className="bg-surface rounded-2xl border border-border p-6 sm:p-8">
        <div className="text-center max-w-xl mx-auto space-y-2 mb-8">
          <h3 className="text-xl font-bold text-ink">Cara Belanja Bertingkat di {storeProfile.name}</h3>
          <p className="text-xs sm:text-sm text-muted">
            Sistem otomatis menerapkan harga terbaik sesuai dengan kuantitas belanja dan tier pelanggan Anda.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2 text-center p-4 rounded-xl bg-canvas">
            <div className="w-8 h-8 rounded-full bg-sage-500 text-white font-bold flex items-center justify-center mx-auto text-sm">
              1
            </div>
            <h4 className="font-bold text-sm text-ink">Pilih Produk & Kuantitas</h4>
            <p className="text-xs text-muted leading-relaxed">
              Pilih kebutuhan sembako Anda. Tambah jumlah pesanan untuk memicu potongan harga grosir otomatis.
            </p>
          </div>

          <div className="space-y-2 text-center p-4 rounded-xl bg-canvas">
            <div className="w-8 h-8 rounded-full bg-sage-500 text-white font-bold flex items-center justify-center mx-auto text-sm">
              2
            </div>
            <h4 className="font-bold text-sm text-ink">Harga Grosir Otomatis</h4>
            <p className="text-xs text-muted leading-relaxed">
              Jika akun Anda terdaftar sebagai mitra Grosir 1 atau Grosir 2, tier harga langsung terpasang di keranjang.
            </p>
          </div>

          <div className="space-y-2 text-center p-4 rounded-xl bg-canvas">
            <div className="w-8 h-8 rounded-full bg-sage-500 text-white font-bold flex items-center justify-center mx-auto text-sm">
              3
            </div>
            <h4 className="font-bold text-sm text-ink">Pengiriman & Pembayaran Cepat</h4>
            <p className="text-xs text-muted leading-relaxed">
              Pilih kurir toko express atau kurir instan, selesaikan via Transfer Bank atau QRIS demo.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
