import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Plus, Minus, ArrowRight, ShieldCheck } from 'lucide-react';
import { useStorefrontCart } from '../../context/StorefrontCartContext';
import { formatIDR } from '../../domain/money';
import { PriceTierBadge } from '../../components/ui/PriceTierBadge';
import { EmptyState } from '../../components/feedback/EmptyState';

export const CartPage: React.FC = () => {
  const {
    items,
    updateQuantity,
    removeItem,
    clearCart,
    subtotal,
    discount,
    shippingFee,
    grandTotal,
    itemCount,
  } = useStorefrontCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <EmptyState
          title="Keranjang Belanja Anda Kosong"
          description="Anda belum memilih produk sembako. Silakan jelajahi katalog kami untuk menemukan kebutuhan pokok dengan harga terbaik."
          action={{
            label: 'Mulai Belanja',
            onClick: () => navigate('/produk'),
          }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-ink">Keranjang Belanja</h1>
          <p className="text-xs sm:text-sm text-muted">
            {itemCount} barang dalam daftar pesanan Anda
          </p>
        </div>
        <button
          type="button"
          onClick={clearCart}
          className="text-xs text-danger hover:underline font-medium"
        >
          Kosongkan Keranjang
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Items List (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          {items.map((item) => (
            <div
              key={item.product.id}
              className="bg-surface rounded-xl border border-border p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-12 h-12 rounded-lg bg-canvas border border-border flex items-center justify-center font-bold text-sm text-sage-700 shrink-0">
                  {item.product.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-muted uppercase">{item.product.sku}</span>
                    <PriceTierBadge tier={item.appliedTier} size="sm" />
                  </div>
                  <Link
                    to={`/produk/${item.product.id}`}
                    className="text-sm font-bold text-ink hover:text-magenta-700 truncate block mt-0.5"
                  >
                    {item.product.name}
                  </Link>
                  <p className="text-xs text-muted tabular-nums">
                    {formatIDR(item.unitPrice)} / {item.product.unit}
                  </p>
                </div>
              </div>

              {/* Quantity Controls & Subtotal */}
              <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-border">
                <div className="inline-flex items-center rounded-lg border border-border bg-canvas">
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                    className="p-1.5 text-muted hover:text-ink transition-colors"
                    aria-label="Kurangi kuantitas"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-10 text-center text-xs font-bold text-ink">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                    disabled={item.quantity >= item.product.stock.available}
                    className="p-1.5 text-muted hover:text-ink disabled:opacity-30 transition-colors"
                    aria-label="Tambah kuantitas"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="text-right">
                  <p className="text-xs text-muted">Subtotal:</p>
                  <p className="text-sm font-bold text-ink tabular-nums">
                    {formatIDR(item.subtotal)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => removeItem(item.product.id)}
                  className="p-1.5 text-muted hover:text-danger rounded transition-colors"
                  aria-label="Hapus barang"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          <Link
            to="/produk"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-sage-700 hover:text-ink pt-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Tambah barang sembako lainnya</span>
          </Link>
        </div>

        {/* Order Summary Panel (5 cols) */}
        <div className="lg:col-span-5">
          <div className="bg-surface rounded-2xl border border-border p-6 shadow-xs space-y-4 sticky top-24">
            <h3 className="text-base font-bold text-ink border-b border-border pb-3">
              Ringkasan Belanja
            </h3>

            <div className="space-y-2.5 text-xs text-ink-soft">
              <div className="flex justify-between">
                <span className="text-muted">Total Harga ({itemCount} item)</span>
                <span className="font-semibold tabular-nums">{formatIDR(subtotal)}</span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-success">
                  <span>Potongan Diskon</span>
                  <span className="font-semibold tabular-nums">-{formatIDR(discount)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-muted">Estimasi Ongkos Kirim (Toko)</span>
                <span className="font-semibold tabular-nums">{formatIDR(shippingFee)}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-border flex items-baseline justify-between">
              <div>
                <span className="text-xs text-muted block">Total Tagihan:</span>
                <span className="text-xl font-extrabold text-ink tabular-nums">
                  {formatIDR(grandTotal)}
                </span>
              </div>
              <span className="text-[11px] text-muted">Termasuk PPN</span>
            </div>

            <button
              type="button"
              onClick={() => navigate('/checkout')}
              className="w-full py-3 px-4 rounded-xl bg-magenta-500 hover:bg-magenta-700 text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-colors"
            >
              <span>Lanjut ke Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="bg-sage-50/70 p-3 rounded-lg border border-sage-100 flex items-start gap-2 text-[11px] text-sage-700">
              <ShieldCheck className="w-4 h-4 shrink-0 text-success mt-0.5" />
              <span>
                Tahap demo: Pesanan online akan tercatat ke sistem operasional gudang dan kasir tanpa memotong uang sungguhan.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
