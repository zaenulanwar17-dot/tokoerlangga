import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Truck, ArrowLeft } from 'lucide-react';
import { Order } from '../../domain/types';
import { orderRepository } from '../../services';
import { formatIDR, formatDateTime } from '../../domain/money';
import { OrderStatusBadge } from '../../components/ui/OrderStatusBadge';
import { EmptyState } from '../../components/feedback/EmptyState';

export const CustomerOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const list = await orderRepository.list({ channel: 'ONLINE' });
      setOrders(list);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-ink">Riwayat Pesanan Online</h1>
          <p className="text-xs sm:text-sm text-muted">
            Status pesanan dan pelacakan pengiriman kurir demo
          </p>
        </div>
        <Link
          to="/produk"
          className="text-xs font-semibold text-magenta-700 hover:underline flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Belanja Lagi</span>
        </Link>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-40 rounded-xl bg-surface animate-pulse border border-border" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          title="Belum Ada Pesanan"
          description="Anda belum pernah membuat pesanan online. Pesanan sembako Anda akan muncul di sini."
          action={{
            label: 'Mulai Belanja',
            onClick: () => window.location.assign('/produk'),
          }}
        />
      ) : (
        <div className="space-y-4">
          {orders.map((ord) => (
            <div
              key={ord.id}
              className="bg-surface rounded-xl border border-border p-5 shadow-xs space-y-4"
            >
              {/* Order Card Topbar */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-ink text-sm font-mono">{ord.orderNumber}</span>
                  <span className="text-muted">• {formatDateTime(ord.createdAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <OrderStatusBadge status={ord.orderStatus} />
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2 text-xs">
                {ord.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-ink-soft">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-sage-500" />
                      <span className="font-medium text-ink">{item.productName}</span>
                      <span className="text-muted">
                        ({item.quantity} {item.unit})
                      </span>
                    </div>
                    <span className="font-semibold tabular-nums">{formatIDR(item.subtotal)}</span>
                  </div>
                ))}
              </div>

              {/* Shipping info demo if exists */}
              {ord.trackingNumber && (
                <div className="bg-canvas p-3 rounded-lg border border-border flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-sage-500" />
                    <div>
                      <p className="font-semibold text-ink">
                        {ord.shippingProvider || 'Kurir Toko'}
                      </p>
                      <p className="text-[11px] font-mono text-muted">
                        No. Resi Demo: <strong>{ord.trackingNumber}</strong>
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-medium text-sage-700 bg-sage-50 px-2 py-0.5 rounded border border-sage-200">
                    Pelacakan Simulasi
                  </span>
                </div>
              )}

              {/* Card Footer: Total & Customer Info */}
              <div className="pt-3 border-t border-border flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="text-muted">
                  Penerima: <strong className="text-ink">{ord.customer?.name}</strong> • Metode:{' '}
                  <span className="uppercase font-medium">{ord.paymentMethod.replace(/_/g, ' ')}</span>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-muted">Total Tagihan:</span>
                  <span className="text-base font-extrabold text-ink tabular-nums">
                    {formatIDR(ord.grandTotal)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
