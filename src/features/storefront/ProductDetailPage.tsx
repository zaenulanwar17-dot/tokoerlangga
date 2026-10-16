import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, Plus, Minus, Tag, ShieldCheck, Check } from 'lucide-react';
import { Product, PriceTier } from '../../domain/types';
import { productRepository } from '../../services';
import { formatIDR } from '../../domain/money';
import { calculateUnitPrice, validateQuantity } from '../../domain/pricing';
import { StockBadge } from '../../components/ui/StockBadge';
import { PriceTierBadge } from '../../components/ui/PriceTierBadge';
import { useStorefrontCart } from '../../context/StorefrontCartContext';
import { useDemoAuth } from '../../context/DemoAuthContext';
import { useToast } from '../../context/ToastContext';
import { EmptyState } from '../../components/feedback/EmptyState';

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState<number>(1);

  const { addItem } = useStorefrontCart();
  const { role, activeCustomer } = useDemoAuth();
  const { showToast } = useToast();

  const currentTier: PriceTier = role === 'CUSTOMER' && activeCustomer ? activeCustomer.tier : 'RETAIL';

  useEffect(() => {
    async function load() {
      if (!id) return;
      setLoading(true);
      const data = await productRepository.getById(id);
      setProduct(data);
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-4">
        <div className="h-6 w-32 bg-sage-100 animate-pulse rounded" />
        <div className="h-72 bg-surface animate-pulse rounded-xl border border-border" />
      </div>
    );
  }

  if (!product) {
    return (
      <EmptyState
        title="Produk tidak ditemukan"
        description="Produk sembako yang Anda cari mungkin telah dinonaktifkan atau tautan salah."
        action={{
          label: 'Kembali ke Katalog',
          onClick: () => navigate('/produk'),
        }}
      />
    );
  }

  // Calculate quoted price in real-time
  const quote = calculateUnitPrice(product.priceRules, currentTier, quantity);
  const quotedSubtotal = quote.unitPrice * quantity;
  const qtyValidation = validateQuantity(quantity, product.stock.available);

  const handleAddToCart = () => {
    if (!qtyValidation.isValid) {
      showToast(qtyValidation.error || 'Kuantitas tidak valid.', 'error');
      return;
    }
    addItem(product, quantity);
    showToast(`${quantity} ${product.unit} ${product.name} berhasil ditambahkan ke keranjang!`, 'success');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb navigation */}
      <div className="flex items-center gap-2 text-xs text-muted">
        <Link to="/produk" className="flex items-center gap-1 hover:text-ink">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Katalog</span>
        </Link>
        <span>/</span>
        <span className="text-sage-700 font-medium">{product.categoryName}</span>
        <span>/</span>
        <span className="text-ink font-semibold truncate">{product.name}</span>
      </div>

      {/* Main Product Card */}
      <div className="bg-surface rounded-2xl border border-border p-6 sm:p-8 shadow-xs grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Left Column: Icon/Placeholder & Identifiers (5 cols) */}
        <div className="md:col-span-5 space-y-4">
          <div className="aspect-square w-full rounded-xl bg-canvas border border-border flex flex-col items-center justify-center p-6 text-center">
            <div className="w-20 h-20 rounded-2xl bg-sage-100 text-sage-700 flex items-center justify-center font-bold text-2xl shadow-inner mb-3">
              {product.name.substring(0, 2).toUpperCase()}
            </div>
            <p className="font-mono text-xs text-muted">SKU: {product.sku}</p>
            <p className="font-mono text-xs text-muted">Barcode: {product.barcode}</p>
          </div>

          <div className="bg-sage-50/60 rounded-xl p-4 border border-sage-100 text-xs space-y-2">
            <div className="flex items-center gap-1.5 font-semibold text-sage-700">
              <ShieldCheck className="w-4 h-4 text-success" />
              <span>Jaminan Kualitas Toko</span>
            </div>
            <p className="text-muted leading-relaxed">
              Barang langsung dari distributor resmi. Selalu dicek tanggal kadaluarsa dan keutuhan kemasan sebelum dikirim.
            </p>
          </div>
        </div>

        {/* Right Column: Pricing & Purchase Interaction (7 cols) */}
        <div className="md:col-span-7 flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-sage-700 uppercase tracking-wider">
                {product.categoryName}
              </span>
              <StockBadge
                status={product.stock.status}
                availableCount={product.stock.available}
                unit={product.unit}
              />
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-ink leading-snug">{product.name}</h1>
            <p className="text-sm text-muted leading-relaxed">{product.description}</p>

            {/* Current Quoted Price Box */}
            <div className="p-4 rounded-xl bg-canvas border border-border space-y-2 mt-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted">Harga Satuan Berlaku:</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted">Tier:</span>
                  <PriceTierBadge tier={quote.appliedTier} size="sm" />
                  {quote.isFallback && (
                    <span className="text-[10px] text-muted italic">(Fallback Eceran)</span>
                  )}
                </div>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-ink tabular-nums">
                  {formatIDR(quote.unitPrice)}
                </span>
                <span className="text-xs text-muted">/{product.unit}</span>
              </div>

              <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
                <span className="text-muted">Total untuk {quantity} {product.unit}:</span>
                <span className="font-bold text-magenta-700 text-base tabular-nums">
                  {formatIDR(quotedSubtotal)}
                </span>
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="space-y-1.5 pt-2">
              <label htmlFor="quantity-input" className="block text-xs font-semibold text-ink">
                Pilih Kuantitas ({product.unit}):
              </label>
              <div className="flex items-center gap-3">
                <div className="inline-flex items-center rounded-lg border border-border bg-surface shadow-xs">
                  <button
                    type="button"
                    onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                    disabled={quantity <= 1}
                    className="p-2 text-ink hover:bg-canvas disabled:opacity-40 transition-colors"
                    aria-label="Kurangi kuantitas"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    id="quantity-input"
                    type="number"
                    min={1}
                    max={product.stock.available || 1}
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className="w-16 py-2 text-center text-sm font-bold text-ink bg-transparent focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setQuantity((prev) => prev + 1)}
                    disabled={quantity >= product.stock.available}
                    className="p-2 text-ink hover:bg-canvas disabled:opacity-40 transition-colors"
                    aria-label="Tambah kuantitas"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <span className="text-xs text-muted">
                  Maksimal tersedia: <strong>{product.stock.available} {product.unit}</strong>
                </span>
              </div>

              {!qtyValidation.isValid && (
                <p className="text-xs text-danger font-medium mt-1">{qtyValidation.error}</p>
              )}
            </div>
          </div>

          {/* Add to Cart CTA */}
          <div className="pt-4 border-t border-border flex items-center gap-3">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={product.stock.available <= 0 || !qtyValidation.isValid}
              className="flex-1 py-3 px-6 rounded-xl bg-magenta-500 hover:bg-magenta-700 disabled:opacity-40 text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-colors"
            >
              <ShoppingBag className="w-5 h-5" />
              <span>Tambah ke Keranjang</span>
            </button>

            <Link
              to="/keranjang"
              className="py-3 px-4 rounded-xl border border-border hover:bg-canvas text-xs font-semibold text-ink transition-colors"
            >
              Lihat Keranjang
            </Link>
          </div>
        </div>
      </div>

      {/* Tiered Price Table Breakdown */}
      <section className="bg-surface rounded-2xl border border-border p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-sage-500" />
          <h3 className="text-base font-bold text-ink">Daftar Aturan Harga Bertingkat</h3>
        </div>
        <p className="text-xs text-muted leading-relaxed">
          Semakin banyak jumlah yang Anda beli atau semakin tinggi tier akun pelanggan Anda, harga satuan akan otomatis turun sesuai tabel berikut:
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-border rounded-lg overflow-hidden">
            <thead className="bg-canvas border-b border-border text-muted uppercase font-semibold">
              <tr>
                <th className="py-2.5 px-3">Tier Pelanggan</th>
                <th className="py-2.5 px-3">Minimal Pembelian</th>
                <th className="py-2.5 px-3 text-right">Harga Satuan</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {product.priceRules.map((rule, idx) => {
                const isCurrentActive =
                  rule.tier === quote.appliedTier &&
                  rule.unitPrice === quote.unitPrice;

                return (
                  <tr
                    key={idx}
                    className={isCurrentActive ? 'bg-sage-50/80 font-semibold text-sage-700' : 'hover:bg-canvas/50'}
                  >
                    <td className="py-2.5 px-3">
                      <PriceTierBadge tier={rule.tier} size="sm" />
                    </td>
                    <td className="py-2.5 px-3">
                      {rule.minQuantity} {product.unit}
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums font-bold">
                      {formatIDR(rule.unitPrice)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {isCurrentActive ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-success">
                          <Check className="w-3.5 h-3.5" />
                          Aktif Dipilih
                        </span>
                      ) : (
                        <span className="text-muted text-[11px]">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
