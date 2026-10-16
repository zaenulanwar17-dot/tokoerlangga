import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  CreditCard,
  AlertTriangle,
  Boxes,
  ArrowRight,
  Calendar,
  DollarSign,
  ShoppingCart,
  PieChart,
  Sparkles,
  ClipboardCheck,
} from 'lucide-react';
import { Order, Product, Receivable, CashierShiftClosure } from '../../domain/types';
import {
  orderRepository,
  productRepository,
  receivableRepository,
  cashierShiftRepository,
} from '../../services';
import { formatIDR, formatDateTime } from '../../domain/money';
import { OrderStatusBadge } from '../../components/ui/OrderStatusBadge';
import { StockBadge } from '../../components/ui/StockBadge';
import { useStoreSettings } from '../../context/StoreSettingsContext';

export const OwnerDashboardPage: React.FC = () => {
  const { storeProfile } = useStoreSettings();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [pendingShifts, setPendingShifts] = useState<CashierShiftClosure[]>([]);
  const [dateRange, setDateRange] = useState<'today' | '7days' | 'month' | 'all'>('all');

  useEffect(() => {
    async function load() {
      const [ordList, prodList, rcvList, shiftList] = await Promise.all([
        orderRepository.list(),
        productRepository.list(),
        receivableRepository.list(),
        cashierShiftRepository.list(),
      ]);
      setOrders(ordList);
      setProducts(prodList);
      setReceivables(rcvList);
      setPendingShifts(shiftList.filter((s) => s.status === 'PENDING_APPROVAL'));
    }
    load();
  }, []);

  // Filter orders by date range
  const filteredOrders = orders.filter((o) => {
    if (dateRange === 'all') return true;
    const ordDate = new Date(o.createdAt);
    const now = new Date();
    if (dateRange === 'today') {
      return ordDate.toDateString() === now.toDateString();
    }
    if (dateRange === '7days') {
      const diff = (now.getTime() - ordDate.getTime()) / (1000 * 3600 * 24);
      return diff <= 7;
    }
    if (dateRange === 'month') {
      return (
        ordDate.getMonth() === now.getMonth() &&
        ordDate.getFullYear() === now.getFullYear()
      );
    }
    return true;
  });

  // KPI Calculations
  const completedOrPaidOrders = filteredOrders.filter(
    (o) => o.orderStatus === 'COMPLETED' || o.paymentStatus === 'PAID'
  );

  const totalOmzet = completedOrPaidOrders.reduce((sum, o) => sum + o.grandTotal, 0);
  const totalTransactions = completedOrPaidOrders.length;

  // Calculate estimated HPP (cost price)
  let totalHPP = 0;
  for (const ord of completedOrPaidOrders) {
    for (const item of ord.items) {
      const prod = products.find((p) => p.id === item.productId);
      const cost = prod ? prod.costPrice : item.unitPrice * 0.85;
      totalHPP += cost * item.quantity;
    }
  }
  const estimatedGrossProfit = Math.max(0, totalOmzet - totalHPP);

  const totalReceivables = receivables.reduce((sum, r) => sum + r.remainingAmount, 0);

  // Channel breakdown
  const posSales = completedOrPaidOrders
    .filter((o) => o.channel === 'POS')
    .reduce((sum, o) => sum + o.grandTotal, 0);
  const onlineSales = completedOrPaidOrders
    .filter((o) => o.channel === 'ONLINE')
    .reduce((sum, o) => sum + o.grandTotal, 0);

  // Critical items
  const lowStockProducts = products.filter(
    (p) => p.stock.status === 'LOW_STOCK' || p.stock.status === 'OUT_OF_STOCK'
  );
  const pendingReceivables = receivables.filter((r) => r.remainingAmount > 0);

  return (
    <div className="space-y-6">
      {/* Header and Date Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-ink">Ringkasan Bisnis Warung</h1>
          <p className="text-xs sm:text-sm text-muted">
            Monitoring omzet, laba kotor estimasi, persediaan menipis, dan piutang toko
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-sage-500" />
            Periode:
          </span>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="bg-surface border border-border rounded-lg px-3 py-1.5 text-ink font-semibold focus:ring-2 focus:ring-sage-500"
          >
            <option value="all">Semua Waktu</option>
            <option value="today">Hari Ini</option>
            <option value="7days">7 Hari Terakhir</option>
            <option value="month">Bulan Ini</option>
          </select>
        </div>
      </div>

      {/* Pending Logo Proposal Alert Banner for Owner */}
      {storeProfile.logoSubmission?.status === 'PENDING' && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm text-ink">
                Usulan Logo Toko Baru dari Admin Menunggu Persetujuan Anda
              </p>
              <p className="text-xs text-muted">
                Diajukan oleh {storeProfile.logoSubmission.submittedBy}. Tinjau dan putuskan persetujuan logo resmi.
              </p>
            </div>
          </div>
          <Link
            to="/app/pengaturan"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs shrink-0 transition-colors"
          >
            <span>Tinjau Usulan Logo Sekarang</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Pending Cashier Shift Approval Alert Banner for Owner */}
      {pendingShifts.length > 0 && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm text-ink">
                Ada {pendingShifts.length} Laporan Kasir Tutup Buku Menunggu Persetujuan Anda
              </p>
              <p className="text-xs text-muted">
                Kasir telah mengajukan rekonsiliasi kas laci kasir. Periksa kesesuaian uang fisik dan alasan selisih kas.
              </p>
            </div>
          </div>
          <Link
            to="/app/kasir"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs shrink-0 transition-colors"
          >
            <span>Buka Persetujuan Tutup Buku</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* 4 KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Omzet Penjualan */}
        <div className="p-5 rounded-2xl bg-surface border border-border shadow-xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted">Omzet Penjualan</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-success">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-extrabold text-ink tabular-nums">
            {formatIDR(totalOmzet)}
          </span>
          <p className="text-[11px] text-muted">
            Total penerimaan dari transaksi POS & Online
          </p>
        </div>

        {/* Jumlah Transaksi */}
        <div className="p-5 rounded-2xl bg-surface border border-border shadow-xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted">Total Transaksi</span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-700">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-extrabold text-ink tabular-nums">
            {totalTransactions} <span className="text-sm font-normal text-muted">transaksi</span>
          </span>
          <p className="text-[11px] text-muted">Nota belanja berstatus selesai/lunas</p>
        </div>

        {/* Estimasi Laba Kotor */}
        <div className="p-5 rounded-2xl bg-surface border border-border shadow-xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted">Laba Kotor (Estimasi)</span>
            <div className="p-2 rounded-lg bg-purple-50 text-purple-700">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-extrabold text-sage-700 tabular-nums">
            {formatIDR(estimatedGrossProfit)}
          </span>
          <p className="text-[11px] text-muted">Omzet dikurangi HPP modal sembako</p>
        </div>

        {/* Total Piutang Outstanding */}
        <div className="p-5 rounded-2xl bg-surface border border-border shadow-xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted">Piutang Belum Lunas</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-700">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-extrabold text-danger tabular-nums">
            {formatIDR(totalReceivables)}
          </span>
          <p className="text-[11px] text-muted">Tagihan kredit pelanggan grosir</p>
        </div>
      </div>

      {/* Channel Breakdown & Critical Action Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sales by Channel Card (4 cols) */}
        <div className="lg:col-span-4 bg-surface rounded-2xl border border-border p-5 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-ink flex items-center gap-2 border-b border-border pb-3">
            <PieChart className="w-4 h-4 text-sage-500" />
            <span>Penjualan per Saluran</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-canvas border border-border space-y-1">
              <div className="flex justify-between font-bold text-ink">
                <span>Kasir POS (Toko Langsung)</span>
                <span className="tabular-nums">{formatIDR(posSales)}</span>
              </div>
              <div className="w-full bg-border rounded-full h-2 overflow-hidden">
                <div
                  className="bg-purple-600 h-2 rounded-full"
                  style={{
                    width: `${totalOmzet > 0 ? (posSales / totalOmzet) * 100 : 50}%`,
                  }}
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-canvas border border-border space-y-1">
              <div className="flex justify-between font-bold text-ink">
                <span>Toko Online (Pesanan Web)</span>
                <span className="tabular-nums">{formatIDR(onlineSales)}</span>
              </div>
              <div className="w-full bg-border rounded-full h-2 overflow-hidden">
                <div
                  className="bg-cyan-600 h-2 rounded-full"
                  style={{
                    width: `${totalOmzet > 0 ? (onlineSales / totalOmzet) * 100 : 50}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="pt-2 text-[11px] text-muted leading-relaxed">
            Kasir POS berkontribusi paling dominan untuk penjualan harian sembako eceran.
          </div>
        </div>

        {/* Low Stock Alert Panel (4 cols) */}
        <div className="lg:col-span-4 bg-surface rounded-2xl border border-border p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="font-bold text-sm text-ink flex items-center gap-2">
              <Boxes className="w-4 h-4 text-warning" />
              <span>Perlu Restock Segera</span>
            </h3>
            <Link
              to="/app/persediaan"
              className="text-xs font-semibold text-magenta-700 hover:underline"
            >
              Lihat Semua →
            </Link>
          </div>

          {lowStockProducts.length === 0 ? (
            <p className="text-xs text-muted text-center py-6">
              Semua stok sembako dalam kondisi aman di atas batas minimum.
            </p>
          ) : (
            <div className="space-y-2.5 text-xs">
              {lowStockProducts.map((p) => (
                <div
                  key={p.id}
                  className="p-3 rounded-xl bg-canvas border border-border flex items-center justify-between"
                >
                  <div>
                    <p className="font-bold text-ink">{p.name}</p>
                    <p className="text-[11px] text-muted">
                      Sisa fisik: <strong>{p.stock.onHand} {p.unit}</strong> (Min: {p.minStockAlert})
                    </p>
                  </div>
                  <StockBadge status={p.stock.status} availableCount={p.stock.available} unit={p.unit} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Overdue Receivables Alert Panel (4 cols) */}
        <div className="lg:col-span-4 bg-surface rounded-2xl border border-border p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="font-bold text-sm text-ink flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-warning" />
              <span>Piutang Belum Lunas ({pendingReceivables.length})</span>
            </h3>
            <Link
              to="/app/piutang"
              className="text-xs font-semibold text-magenta-700 hover:underline"
            >
              Lihat Piutang →
            </Link>
          </div>

          {pendingReceivables.length === 0 ? (
            <p className="text-xs text-muted text-center py-6">
              Tidak ada catatan piutang aktif saat ini.
            </p>
          ) : (
            <div className="space-y-2.5 text-xs">
              {pendingReceivables.slice(0, 5).map((r) => (
                <div
                  key={r.id}
                  className="p-3 rounded-xl bg-amber-50/50 border border-amber-200 flex items-center justify-between"
                >
                  <div>
                    <p className="font-bold text-ink">{r.customerName}</p>
                    <p className="text-[11px] text-muted">
                      Nota: {r.orderNumber}
                    </p>
                  </div>
                  <span className="font-bold text-danger tabular-nums">
                    {formatIDR(r.remainingAmount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="bg-surface rounded-2xl border border-border p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h3 className="font-bold text-sm text-ink">Aktivitas Transaksi Terbaru</h3>
          <Link
            to="/app/pesanan"
            className="text-xs font-semibold text-magenta-700 hover:underline flex items-center gap-1"
          >
            <span>Buka Riwayat Lengkap</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-canvas border-b border-border text-muted uppercase font-semibold">
              <tr>
                <th className="py-2.5 px-3">No. Nota</th>
                <th className="py-2.5 px-3">Waktu</th>
                <th className="py-2.5 px-3">Saluran</th>
                <th className="py-2.5 px-3">Pelanggan</th>
                <th className="py-2.5 px-3 text-right">Total Transaksi</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orders.slice(0, 5).map((ord) => (
                <tr key={ord.id} className="hover:bg-canvas/50">
                  <td className="py-2.5 px-3 font-mono font-bold text-ink">{ord.orderNumber}</td>
                  <td className="py-2.5 px-3 text-muted">{formatDateTime(ord.createdAt)}</td>
                  <td className="py-2.5 px-3 font-semibold">{ord.channel}</td>
                  <td className="py-2.5 px-3 font-medium text-ink">
                    {ord.customer?.name || 'Walk-in'}
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold tabular-nums text-ink">
                    {formatIDR(ord.grandTotal)}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <OrderStatusBadge status={ord.orderStatus} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
