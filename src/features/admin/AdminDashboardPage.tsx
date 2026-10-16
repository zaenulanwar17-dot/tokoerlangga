import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Boxes,
  Package,
  ClipboardList,
  ShoppingCart,
  Tags,
  Plus,
  Truck,
  Building2,
} from 'lucide-react';
import { Product, Order } from '../../domain/types';
import { productRepository, orderRepository } from '../../services';
import { OrderStatusBadge } from '../../components/ui/OrderStatusBadge';

export const AdminDashboardPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    async function load() {
      const [p, o] = await Promise.all([
        productRepository.list(),
        orderRepository.list(),
      ]);
      setProducts(p);
      setOrders(o);
    }
    load();
  }, []);

  const pendingOnlineOrders = orders.filter(
    (o) => o.channel === 'ONLINE' && (o.orderStatus === 'PENDING_PAYMENT' || o.orderStatus === 'CONFIRMED' || o.orderStatus === 'PROCESSING')
  );

  const lowStockCount = products.filter(
    (p) => p.stock.status === 'LOW_STOCK' || p.stock.status === 'OUT_OF_STOCK'
  ).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="pb-4 border-b border-border">
        <h1 className="text-xl sm:text-2xl font-bold text-ink">Dashboard Operasional Toko & Gudang</h1>
        <p className="text-xs sm:text-sm text-muted">
          Pusat kendali inventaris, katalog produk sembako, dan antrean pengiriman online
        </p>
      </div>

      {/* 4 Operasional KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-surface border border-border shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted">Total Master Produk</span>
            <div className="p-2 rounded-lg bg-sage-50 text-sage-700">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-extrabold text-ink tabular-nums">
            {products.length} <span className="text-sm font-normal text-muted">SKU</span>
          </span>
          <p className="text-[11px] text-muted">Tersedia dalam katalog sembako</p>
        </div>

        <div className="p-5 rounded-2xl bg-surface border border-border shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted">Pesanan Online Diproses</span>
            <div className="p-2 rounded-lg bg-cyan-50 text-cyan-700">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-extrabold text-cyan-700 tabular-nums">
            {pendingOnlineOrders.length} <span className="text-sm font-normal text-muted">antrean</span>
          </span>
          <p className="text-[11px] text-muted">Perlu dipacking dan dibuat resi</p>
        </div>

        <div className="p-5 rounded-2xl bg-surface border border-border shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted">Stok Perlu Perhatian</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-700">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-extrabold text-warning tabular-nums">
            {lowStockCount} <span className="text-sm font-normal text-muted">barang</span>
          </span>
          <p className="text-[11px] text-muted">Menipis atau habis di gudang</p>
        </div>

        <div className="p-5 rounded-2xl bg-surface border border-border shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted">Total Seluruh Pesanan</span>
            <div className="p-2 rounded-lg bg-purple-50 text-purple-700">
              <ClipboardList className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-extrabold text-ink tabular-nums">
            {orders.length} <span className="text-sm font-normal text-muted">transaksi</span>
          </span>
          <p className="text-[11px] text-muted">Gabungan POS dan Online</p>
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Link
          to="/app/pembelian?action=new"
          className="p-4 rounded-xl bg-surface border border-border hover:border-sage-500 hover:shadow-xs transition-all flex flex-col justify-between space-y-2 group"
        >
          <div className="w-8 h-8 rounded-lg bg-sage-50 text-sage-700 flex items-center justify-center font-bold">
            <Truck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-xs sm:text-sm text-ink group-hover:text-sage-700">
              Input Kulakan
            </h4>
            <p className="text-[11px] text-muted mt-0.5">Beli barang & tambah stok</p>
          </div>
        </Link>

        <Link
          to="/app/supplier?tab=supplier"
          className="p-4 rounded-xl bg-surface border border-border hover:border-sage-500 hover:shadow-xs transition-all flex flex-col justify-between space-y-2 group"
        >
          <div className="w-8 h-8 rounded-lg bg-sage-50 text-sage-700 flex items-center justify-center font-bold">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-xs sm:text-sm text-ink group-hover:text-sage-700">
              Data Supplier
            </h4>
            <p className="text-[11px] text-muted mt-0.5">Kelola agen & distributor</p>
          </div>
        </Link>

        <Link
          to="/app/produk"
          className="p-4 rounded-xl bg-surface border border-border hover:border-magenta-500 hover:shadow-xs transition-all flex flex-col justify-between space-y-2 group"
        >
          <div className="w-8 h-8 rounded-lg bg-magenta-50 text-magenta-700 flex items-center justify-center font-bold">
            <Plus className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-xs sm:text-sm text-ink group-hover:text-magenta-700">
              Tambah Produk
            </h4>
            <p className="text-[11px] text-muted mt-0.5">Input SKU & barcode baru</p>
          </div>
        </Link>

        <Link
          to="/app/harga"
          className="p-4 rounded-xl bg-surface border border-border hover:border-sage-500 hover:shadow-xs transition-all flex flex-col justify-between space-y-2 group"
        >
          <div className="w-8 h-8 rounded-lg bg-sage-50 text-sage-700 flex items-center justify-center font-bold">
            <Tags className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-xs sm:text-sm text-ink group-hover:text-sage-700">
              Harga Bertingkat
            </h4>
            <p className="text-[11px] text-muted mt-0.5">Aturan Grosir 1 & 2</p>
          </div>
        </Link>

        <Link
          to="/app/persediaan"
          className="p-4 rounded-xl bg-surface border border-border hover:border-amber-500 hover:shadow-xs transition-all flex flex-col justify-between space-y-2 group"
        >
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
            <Boxes className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-xs sm:text-sm text-ink group-hover:text-amber-700">
              Penyesuaian Stok
            </h4>
            <p className="text-[11px] text-muted mt-0.5">Opname persediaan gudang</p>
          </div>
        </Link>

        <Link
          to="/app/kasir"
          className="p-4 rounded-xl bg-surface border border-border hover:border-magenta-500 hover:shadow-xs transition-all flex flex-col justify-between space-y-2 group"
        >
          <div className="w-8 h-8 rounded-lg bg-magenta-50 text-magenta-700 flex items-center justify-center font-bold">
            <ShoppingCart className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-xs sm:text-sm text-ink group-hover:text-magenta-700">
              Mesin Kasir POS
            </h4>
            <p className="text-[11px] text-muted mt-0.5">Buka kasir transaksi cepat</p>
          </div>
        </Link>
      </div>

      {/* Online Order Queues Needing Fulfillment */}
      <div className="bg-surface rounded-2xl border border-border p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h3 className="font-bold text-sm text-ink flex items-center gap-2">
            <Truck className="w-4 h-4 text-cyan-700" />
            <span>Antrean Pesanan Online Masuk</span>
          </h3>
          <Link
            to="/app/pesanan"
            className="text-xs font-semibold text-magenta-700 hover:underline"
          >
            Lihat Semua Pesanan →
          </Link>
        </div>

        {pendingOnlineOrders.length === 0 ? (
          <p className="text-xs text-muted text-center py-6">
            Semua pesanan online telah selesai diproses.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-canvas border-b border-border text-muted">
                <tr>
                  <th className="py-2.5 px-3">No. Pesanan</th>
                  <th className="py-2.5 px-3">Pelanggan</th>
                  <th className="py-2.5 px-3">Alamat Pengiriman</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pendingOnlineOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-canvas/50">
                    <td className="py-2.5 px-3 font-mono font-bold text-ink">
                      {ord.orderNumber}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-ink">
                      {ord.customer?.name}
                    </td>
                    <td className="py-2.5 px-3 text-muted max-w-xs truncate">
                      {ord.customer?.address || '-'}
                    </td>
                    <td className="py-2.5 px-3">
                      <OrderStatusBadge status={ord.orderStatus} />
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <Link
                        to="/app/pesanan"
                        className="px-2.5 py-1 text-xs font-semibold rounded bg-magenta-50 text-magenta-700 border border-magenta-200 hover:bg-magenta-100"
                      >
                        Proses Resi
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
