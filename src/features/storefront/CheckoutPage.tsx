import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Truck,
  CreditCard,
  MapPin,
  CheckCircle2,
  ArrowLeft,
  AlertTriangle,
} from 'lucide-react';
import { useStorefrontCart } from '../../context/StorefrontCartContext';
import { useDemoAuth } from '../../context/DemoAuthContext';
import { orderRepository } from '../../services';
import { formatIDR } from '../../domain/money';
import { useToast } from '../../context/ToastContext';
import { useStoreSettings } from '../../context/StoreSettingsContext';
import { PaymentMethod } from '../../domain/types';

export const CheckoutPage: React.FC = () => {
  const { storeProfile } = useStoreSettings();
  const {
    items,
    subtotal,
    discount,
    shippingFee,
    setShippingFee,
    grandTotal,
    clearCart,
    itemCount,
  } = useStorefrontCart();
  const { activeCustomer } = useDemoAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Recipient form state
  const [recipientName, setRecipientName] = useState(activeCustomer?.name || 'Ibu Siti');
  const [phone, setPhone] = useState(activeCustomer?.phone || '0812-3456-7890');
  const [address, setAddress] = useState(
    activeCustomer?.address || 'Jl. Melati No. 12, RT 03/RW 04, Kel. Sukamaju'
  );
  const [notes, setNotes] = useState('');
  const [shippingMethod, setShippingMethod] = useState<'store_courier' | 'sicepat' | 'pickup'>('store_courier');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('BANK_TRANSFER_MANUAL');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (items.length === 0) {
    navigate('/keranjang');
    return null;
  }

  const handleShippingChange = (method: 'store_courier' | 'sicepat' | 'pickup') => {
    setShippingMethod(method);
    if (method === 'store_courier') setShippingFee(10000);
    else if (method === 'sicepat') setShippingFee(15000);
    else setShippingFee(0);
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientName.trim() || !phone.trim() || !address.trim()) {
      showToast('Harap lengkapi nama penerima, nomor telepon, dan alamat kirim.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const shippingProviderName =
        shippingMethod === 'store_courier'
          ? 'Kurir Toko (Express)'
          : shippingMethod === 'sicepat'
          ? 'SiCepat Reguler (Demo)'
          : 'Ambil di Toko (Pickup)';

      const createdOrder = await orderRepository.create({
        channel: 'ONLINE',
        customer: {
          id: activeCustomer?.id || 'cust_temp',
          name: recipientName,
          phone,
          tier: activeCustomer?.tier || 'RETAIL',
          address,
        },
        items: items.map((i) => ({
          productId: i.product.id,
          productName: i.product.name,
          sku: i.product.sku,
          unit: i.product.unit,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          subtotal: i.subtotal,
          tier: i.appliedTier,
        })),
        subtotal,
        discount,
        shippingFee,
        grandTotal,
        paymentMethod,
        paymentStatus: paymentMethod === 'PAYMENT_GATEWAY' ? 'PAID' : 'PENDING',
        orderStatus: paymentMethod === 'PAYMENT_GATEWAY' ? 'CONFIRMED' : 'PENDING_PAYMENT',
        paidAmount: paymentMethod === 'PAYMENT_GATEWAY' ? grandTotal : 0,
        changeAmount: 0,
        shippingProvider: shippingProviderName,
        trackingNumber: `RES-${Date.now().toString().slice(-6)}`,
        notes,
      });

      clearCart();
      showToast(`Pesanan ${createdOrder.orderNumber} berhasil dibuat dalam mode demo!`, 'success');
      navigate('/akun/pesanan');
    } catch {
      showToast('Gagal memproses pesanan demo. Silakan coba kembali.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top back navigation */}
      <div className="flex items-center gap-2">
        <Link
          to="/keranjang"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-ink"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Keranjang</span>
        </Link>
      </div>

      <div className="border-b border-border pb-3">
        <h1 className="text-xl sm:text-2xl font-bold text-ink">Checkout Pesanan Online</h1>
        <p className="text-xs text-muted">
          Lengkapi detail alamat pengiriman dan pilih metode pembayaran demo.
        </p>
      </div>

      <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Form (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Section 1: Alamat Penerima */}
          <section className="bg-surface rounded-xl border border-border p-5 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 font-bold text-sm text-ink border-b border-border pb-3">
              <MapPin className="w-4 h-4 text-sage-500" />
              <span>1. Alamat Pengiriman</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-ink">
                  Nama Penerima <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full px-3 py-2 bg-canvas border border-border rounded-lg text-ink focus:outline-none focus:ring-2 focus:ring-sage-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-ink">
                  Nomor HP / WhatsApp <span className="text-danger">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-canvas border border-border rounded-lg text-ink focus:outline-none focus:ring-2 focus:ring-sage-500"
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="font-semibold text-ink">
                  Alamat Lengkap (Jalan, No. Rumah, RT/RW, Patokan) <span className="text-danger">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-canvas border border-border rounded-lg text-ink focus:outline-none focus:ring-2 focus:ring-sage-500"
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="font-semibold text-ink">Catatan untuk Pengemudi (Opsional)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contoh: Titip ke satpam / Pagar warna cokelat"
                  className="w-full px-3 py-2 bg-canvas border border-border rounded-lg text-ink focus:outline-none focus:ring-2 focus:ring-sage-500"
                />
              </div>
            </div>
          </section>

          {/* Section 2: Opsi Pengiriman */}
          <section className="bg-surface rounded-xl border border-border p-5 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 font-bold text-sm text-ink border-b border-border pb-3">
              <Truck className="w-4 h-4 text-sage-500" />
              <span>2. Metode Pengiriman</span>
            </div>

            <div className="space-y-2.5 text-xs">
              <label
                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                  shippingMethod === 'store_courier'
                    ? 'border-sage-500 bg-sage-50/70 font-semibold'
                    : 'border-border bg-canvas hover:bg-surface'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="shipping"
                    checked={shippingMethod === 'store_courier'}
                    onChange={() => handleShippingChange('store_courier')}
                    className="text-sage-500 focus:ring-sage-500"
                  />
                  <div>
                    <p className="font-bold text-ink">Kurir Toko (Express Lokal)</p>
                    <p className="text-muted text-[11px]">Sampai dalam 1–2 jam di jam operasional toko</p>
                  </div>
                </div>
                <span className="font-bold text-ink">{formatIDR(10000)}</span>
              </label>

              <label
                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                  shippingMethod === 'sicepat'
                    ? 'border-sage-500 bg-sage-50/70 font-semibold'
                    : 'border-border bg-canvas hover:bg-surface'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="shipping"
                    checked={shippingMethod === 'sicepat'}
                    onChange={() => handleShippingChange('sicepat')}
                    className="text-sage-500 focus:ring-sage-500"
                  />
                  <div>
                    <p className="font-bold text-ink">SiCepat / J&T Ekspedisi (Demo)</p>
                    <p className="text-muted text-[11px]">Estimasi 1 hari kerja untuk pesanan luar radius</p>
                  </div>
                </div>
                <span className="font-bold text-ink">{formatIDR(15000)}</span>
              </label>

              <label
                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                  shippingMethod === 'pickup'
                    ? 'border-sage-500 bg-sage-50/70 font-semibold'
                    : 'border-border bg-canvas hover:bg-surface'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="shipping"
                    checked={shippingMethod === 'pickup'}
                    onChange={() => handleShippingChange('pickup')}
                    className="text-sage-500 focus:ring-sage-500"
                  />
                  <div>
                    <p className="font-bold text-ink">Ambil Sendiri ke Toko (Self Pick-up)</p>
                    <p className="text-muted text-[11px]">Siap diambil setelah staf selesai menyiapkan di kasir</p>
                  </div>
                </div>
                <span className="font-bold text-success">Gratis</span>
              </label>
            </div>
          </section>

          {/* Section 3: Pembayaran Demo */}
          <section className="bg-surface rounded-xl border border-border p-5 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 font-bold text-sm text-ink border-b border-border pb-3">
              <CreditCard className="w-4 h-4 text-sage-500" />
              <span>3. Metode Pembayaran (Mode Demo)</span>
            </div>

            <div className="space-y-2.5 text-xs">
              <label
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  paymentMethod === 'BANK_TRANSFER_MANUAL'
                    ? 'border-sage-500 bg-sage-50/70 font-semibold'
                    : 'border-border bg-canvas hover:bg-surface'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'BANK_TRANSFER_MANUAL'}
                  onChange={() => setPaymentMethod('BANK_TRANSFER_MANUAL')}
                  className="mt-0.5 text-sage-500 focus:ring-sage-500"
                />
                <div className="space-y-1">
                  <p className="font-bold text-ink">Transfer Bank Manual (BCA / Mandiri)</p>
                  <p className="text-muted text-[11px]">
                    Rekening Demo Toko: <strong>{storeProfile.bankAccount}</strong>
                  </p>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  paymentMethod === 'PAYMENT_GATEWAY'
                    ? 'border-sage-500 bg-sage-50/70 font-semibold'
                    : 'border-border bg-canvas hover:bg-surface'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'PAYMENT_GATEWAY'}
                  onChange={() => setPaymentMethod('PAYMENT_GATEWAY')}
                  className="mt-0.5 text-sage-500 focus:ring-sage-500"
                />
                <div className="space-y-1">
                  <p className="font-bold text-ink">QRIS / Instant Payment (Simulasi Otomatis)</p>
                  <p className="text-muted text-[11px]">
                    Status pesanan akan langsung otomatis berstatus Terkonfirmasi / Lunas.
                  </p>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  paymentMethod === 'COD'
                    ? 'border-sage-500 bg-sage-50/70 font-semibold'
                    : 'border-border bg-canvas hover:bg-surface'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'COD'}
                  onChange={() => setPaymentMethod('COD')}
                  className="mt-0.5 text-sage-500 focus:ring-sage-500"
                />
                <div className="space-y-1">
                  <p className="font-bold text-ink">Bayar Tunai di Tempat (COD)</p>
                  <p className="text-muted text-[11px]">
                    Uang diserahkan langsung ke kurir toko saat sembako tiba di rumah Anda.
                  </p>
                </div>
              </label>
            </div>
          </section>
        </div>

        {/* Right Summary Panel (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-surface rounded-2xl border border-border p-6 shadow-xs space-y-4 sticky top-24">
            <h3 className="text-base font-bold text-ink border-b border-border pb-3">
              Ringkasan Checkout
            </h3>

            {/* Short item preview */}
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1 text-xs divide-y divide-border/60">
              {items.map((item) => (
                <div key={item.product.id} className="pt-2 first:pt-0 flex justify-between">
                  <div className="pr-2">
                    <p className="font-semibold text-ink line-clamp-1">{item.product.name}</p>
                    <p className="text-[11px] text-muted">
                      {item.quantity} x {formatIDR(item.unitPrice)}
                    </p>
                  </div>
                  <span className="font-bold text-ink shrink-0 tabular-nums">
                    {formatIDR(item.subtotal)}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-border space-y-2 text-xs text-muted">
              <div className="flex justify-between">
                <span>Subtotal ({itemCount} item)</span>
                <span className="font-semibold text-ink tabular-nums">{formatIDR(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-success">
                  <span>Potongan Diskon</span>
                  <span className="font-semibold tabular-nums">-{formatIDR(discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Ongkos Kirim</span>
                <span className="font-semibold text-ink tabular-nums">{formatIDR(shippingFee)}</span>
              </div>
              <div className="pt-2 border-t border-border flex justify-between items-baseline text-ink">
                <span className="text-sm font-bold">Total Pembayaran:</span>
                <span className="text-xl font-extrabold text-magenta-700 tabular-nums">
                  {formatIDR(grandTotal)}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-magenta-500 hover:bg-magenta-700 disabled:opacity-50 text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-colors"
            >
              {isSubmitting ? (
                <span>Membuat Pesanan...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Konfirmasi Pesanan Demo</span>
                </>
              )}
            </button>

            <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-[11px] text-amber-800 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertTriangle className="w-3.5 h-3.5 text-warning" />
                <span>Simulasi Mode Demo</span>
              </div>
              <p>
                Pesanan ini akan otomatis masuk ke daftar pesanan internal Admin dan reservasi stok gudang.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
