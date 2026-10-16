import React, { useState, useEffect } from 'react';
import {
  Search,
  Eye,
  Truck,
  CheckCircle2,
  X,
} from 'lucide-react';
import { Order, OrderStatus } from '../../domain/types';
import { orderRepository } from '../../services';
import { formatIDR, formatDateTime } from '../../domain/money';
import { OrderStatusBadge } from '../../components/ui/OrderStatusBadge';
import { useToast } from '../../context/ToastContext';

export const OrderListPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterChannel, setFilterChannel] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Order Modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [newTrackingNumber, setNewTrackingNumber] = useState('');
  const [shippingProvider, setShippingProvider] = useState('Kurir Toko (Express)');

  const { showToast } = useToast();

  const loadOrders = async () => {
    setLoading(true);
    const data = await orderRepository.list();
    setOrders(data);
    setLoading(false);
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const openOrderDetail = (order: Order) => {
    setSelectedOrder(order);
    setNewTrackingNumber(order.trackingNumber || `RESI-${Date.now().toString().slice(-6)}`);
    setShippingProvider(order.shippingProvider || 'Kurir Toko (Express)');
  };

  const handleUpdateStatus = async (newStatus: OrderStatus) => {
    if (!selectedOrder) return;
    setIsUpdatingStatus(true);
    try {
      const updated = await orderRepository.updateStatus(
        selectedOrder.id,
        newStatus,
        newStatus === 'SHIPPED' ? newTrackingNumber : selectedOrder.trackingNumber,
        newStatus === 'SHIPPED' ? shippingProvider : selectedOrder.shippingProvider
      );
      setSelectedOrder(updated);
      showToast(`Status pesanan ${updated.orderNumber} diubah ke ${newStatus}.`, 'success');
      await loadOrders();
    } catch {
      showToast('Gagal memperbarui status pesanan.', 'error');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (filterChannel !== 'all' && o.channel !== filterChannel) return false;
    if (filterStatus !== 'all' && o.orderStatus !== filterStatus) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      o.orderNumber.toLowerCase().includes(q) ||
      (o.customer?.name && o.customer.name.toLowerCase().includes(q)) ||
      (o.trackingNumber && o.trackingNumber.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-ink">Daftar Transaksi & Pesanan</h1>
          <p className="text-xs sm:text-sm text-muted">
            Kelola transaksi kasir POS langsung dan proses pesanan online toko sembako
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-surface p-4 rounded-xl border border-border flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 min-w-[240px]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nomor pesanan, nama pelanggan, resi..."
            className="w-full pl-8 pr-3 py-2 bg-canvas border border-border rounded-lg text-ink focus:ring-2 focus:ring-sage-500"
          />
          <Search className="w-4 h-4 text-muted absolute left-2.5 top-2.5 pointer-events-none" />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted">Saluran:</span>
          <select
            value={filterChannel}
            onChange={(e) => setFilterChannel(e.target.value)}
            className="bg-canvas border border-border rounded-lg px-2.5 py-1.5 text-ink focus:ring-2 focus:ring-sage-500"
          >
            <option value="all">Semua Saluran</option>
            <option value="POS">Kasir POS Saja</option>
            <option value="ONLINE">Online Store Saja</option>
          </select>

          <span className="text-muted ml-2">Status:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-canvas border border-border rounded-lg px-2.5 py-1.5 text-ink focus:ring-2 focus:ring-sage-500"
          >
            <option value="all">Semua Status</option>
            <option value="PENDING_PAYMENT">Menunggu Pembayaran</option>
            <option value="CONFIRMED">Terkonfirmasi</option>
            <option value="PROCESSING">Diproses Gudang</option>
            <option value="SHIPPED">Dalam Pengiriman</option>
            <option value="COMPLETED">Selesai</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-surface rounded-xl border border-border shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-canvas border-b border-border text-muted uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">No. Pesanan & Waktu</th>
                <th className="py-3 px-4">Saluran</th>
                <th className="py-3 px-4">Pelanggan</th>
                <th className="py-3 px-4 text-right">Total Transaksi</th>
                <th className="py-3 px-4">Metode Bayar</th>
                <th className="py-3 px-4 text-center">Status Pesanan</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-muted">
                    Memuat data pesanan...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-muted">
                    Tidak ada pesanan yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-canvas/50">
                    <td className="py-3 px-4">
                      <p className="font-bold font-mono text-ink">{ord.orderNumber}</p>
                      <p className="text-[11px] text-muted">{formatDateTime(ord.createdAt)}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded font-bold text-[11px] ${
                          ord.channel === 'POS'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                        }`}
                      >
                        {ord.channel}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-ink">{ord.customer?.name || 'Umum'}</p>
                      <p className="text-[11px] text-muted">{ord.customer?.phone || '-'}</p>
                    </td>
                    <td className="py-3 px-4 text-right font-extrabold tabular-nums text-ink text-sm">
                      {formatIDR(ord.grandTotal)}
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-muted uppercase text-[11px] font-medium">
                        {ord.paymentMethod.replace(/_/g, ' ')}
                      </p>
                      {ord.paymentStatus === 'PARTIAL' && (
                        <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          Kurang Bayar
                        </span>
                      )}
                      {ord.paymentStatus === 'PENDING' && ord.channel === 'POS' && (
                        <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          Bon Utang
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <OrderStatusBadge status={ord.orderStatus} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => openOrderDetail(ord)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border bg-canvas hover:bg-surface font-semibold text-xs text-ink transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Detail</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-xs overflow-y-auto"
        >
          <div className="bg-surface rounded-2xl border border-border shadow-2xl max-w-2xl w-full p-6 space-y-5 my-8 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-base font-bold text-ink">
                  Detail Pesanan {selectedOrder.orderNumber}
                </h3>
                <p className="text-xs text-muted">
                  Saluran {selectedOrder.channel} • {formatDateTime(selectedOrder.createdAt)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="text-muted hover:text-ink p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status & Transitions */}
            <div className="p-4 bg-canvas rounded-xl border border-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted font-medium">Status Pesanan Saat Ini:</span>
                <OrderStatusBadge status={selectedOrder.orderStatus} />
              </div>

              {/* Status Action Buttons for Admin */}
              <div className="pt-2 border-t border-border flex flex-wrap gap-2 text-xs">
                {selectedOrder.orderStatus === 'PENDING_PAYMENT' && (
                  <button
                    type="button"
                    disabled={isUpdatingStatus}
                    onClick={() => handleUpdateStatus('CONFIRMED')}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                  >
                    Konfirmasi Pembayaran
                  </button>
                )}

                {selectedOrder.orderStatus === 'CONFIRMED' && (
                  <button
                    type="button"
                    disabled={isUpdatingStatus}
                    onClick={() => handleUpdateStatus('PROCESSING')}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                  >
                    Mulai Diproses Gudang
                  </button>
                )}

                {selectedOrder.orderStatus === 'PROCESSING' && (
                  <button
                    type="button"
                    disabled={isUpdatingStatus}
                    onClick={() => handleUpdateStatus('READY_TO_SHIP')}
                    className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold"
                  >
                    Tandai Siap Kirim
                  </button>
                )}

                {(selectedOrder.orderStatus === 'READY_TO_SHIP' ||
                  selectedOrder.orderStatus === 'PROCESSING') && (
                  <div className="w-full space-y-2 pt-2 border-t border-border">
                    <p className="font-semibold text-ink">Pengiriman & Resi Demo:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={shippingProvider}
                        onChange={(e) => setShippingProvider(e.target.value)}
                        placeholder="Nama Kurir / Ekspedisi"
                        className="px-2.5 py-1.5 bg-surface border border-border rounded-lg text-xs"
                      />
                      <input
                        type="text"
                        value={newTrackingNumber}
                        onChange={(e) => setNewTrackingNumber(e.target.value)}
                        placeholder="Nomor Resi Demo"
                        className="px-2.5 py-1.5 bg-surface border border-border rounded-lg text-xs font-mono"
                      />
                    </div>
                    <button
                      type="button"
                      disabled={isUpdatingStatus}
                      onClick={() => handleUpdateStatus('SHIPPED')}
                      className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-semibold flex items-center gap-1.5"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>Catat Resi & Kirim Pesanan</span>
                    </button>
                  </div>
                )}

                {selectedOrder.orderStatus === 'SHIPPED' && (
                  <button
                    type="button"
                    disabled={isUpdatingStatus}
                    onClick={() => handleUpdateStatus('COMPLETED')}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Selesaikan Pesanan (Diterima)</span>
                  </button>
                )}
              </div>
            </div>

            {/* Customer & Address Details */}
            {selectedOrder.customer && (
              <div className="p-3 bg-surface rounded-xl border border-border text-xs space-y-1">
                <p className="font-bold text-ink">
                  Penerima: {selectedOrder.customer.name} ({selectedOrder.customer.tier})
                </p>
                <p className="text-muted">HP: {selectedOrder.customer.phone || '-'}</p>
                {selectedOrder.customer.address && (
                  <p className="text-muted">Alamat: {selectedOrder.customer.address}</p>
                )}
                {selectedOrder.notes && (
                  <p className="text-amber-800 font-medium">Catatan: {selectedOrder.notes}</p>
                )}
              </div>
            )}

            {/* Items Table */}
            <div className="space-y-2">
              <h4 className="font-bold text-xs text-ink uppercase tracking-wider">Item Dipesan:</h4>
              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-canvas border-b border-border text-muted">
                    <tr>
                      <th className="p-2.5">Barang</th>
                      <th className="p-2.5 text-center">Qty</th>
                      <th className="p-2.5 text-right">Harga</th>
                      <th className="p-2.5 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {selectedOrder.items.map((it, idx) => (
                      <tr key={idx}>
                        <td className="p-2.5 font-medium text-ink">{it.productName}</td>
                        <td className="p-2.5 text-center font-bold">
                          {it.quantity} {it.unit}
                        </td>
                        <td className="p-2.5 text-right tabular-nums text-muted">
                          {formatIDR(it.unitPrice)}
                        </td>
                        <td className="p-2.5 text-right tabular-nums font-bold text-ink">
                          {formatIDR(it.subtotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Totals */}
            <div className="pt-2 border-t border-border space-y-1.5 text-xs text-muted">
              <div className="flex justify-between">
                <span>Subtotal Barang:</span>
                <span className="font-semibold text-ink tabular-nums">{formatIDR(selectedOrder.subtotal)}</span>
              </div>
              {selectedOrder.discount > 0 && (
                <div className="flex justify-between text-success">
                  <span>Diskon:</span>
                  <span className="font-semibold tabular-nums">-{formatIDR(selectedOrder.discount)}</span>
                </div>
              )}
              {selectedOrder.shippingFee > 0 && (
                <div className="flex justify-between">
                  <span>Ongkos Kirim:</span>
                  <span className="font-semibold text-ink tabular-nums">{formatIDR(selectedOrder.shippingFee)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-ink pt-1 border-t border-border">
                <span>Total Tagihan:</span>
                <span className="text-magenta-700 tabular-nums">{formatIDR(selectedOrder.grandTotal)}</span>
              </div>
              <div className="flex justify-between text-xs text-muted">
                <span>Dibayar:</span>
                <span className="tabular-nums font-semibold">{formatIDR(selectedOrder.paidAmount)}</span>
              </div>
              {selectedOrder.paidAmount < selectedOrder.grandTotal && (
                <div className="flex justify-between text-xs font-bold text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
                  <span>Sisa Piutang:</span>
                  <span className="tabular-nums">{formatIDR(selectedOrder.grandTotal - selectedOrder.paidAmount)}</span>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-border flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 font-semibold text-xs rounded-lg border border-border text-ink hover:bg-canvas"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
