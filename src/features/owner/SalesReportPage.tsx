import React, { useState, useEffect } from 'react';
import {
  Download,
  TrendingUp,
  DollarSign,
  ShoppingCart,
} from 'lucide-react';
import { Order, Product } from '../../domain/types';
import { orderRepository, productRepository } from '../../services';
import { formatIDR, formatDateTime } from '../../domain/money';
import { useToast } from '../../context/ToastContext';

export const SalesReportPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [filterChannel, setFilterChannel] = useState<string>('all');
  const { showToast } = useToast();

  useEffect(() => {
    async function load() {
      const [ordList, prodList] = await Promise.all([
        orderRepository.list(),
        productRepository.list(),
      ]);
      setOrders(ordList);
      setProducts(prodList);
    }
    load();
  }, []);

  const filteredOrders = orders.filter((o) => {
    if (filterChannel !== 'all' && o.channel !== filterChannel) return false;
    return true;
  });

  // Calculate detailed financials per order
  const reportRows = filteredOrders.map((ord) => {
    let orderHPP = 0;
    for (const item of ord.items) {
      const prod = products.find((p) => p.id === item.productId);
      const cost = prod ? prod.costPrice : item.unitPrice * 0.85;
      orderHPP += cost * item.quantity;
    }
    const grossProfit = ord.grandTotal - orderHPP;
    const profitMargin = ord.grandTotal > 0 ? (grossProfit / ord.grandTotal) * 100 : 0;

    return {
      order: ord,
      orderHPP,
      grossProfit,
      profitMargin,
    };
  });

  const grandOmzet = reportRows.reduce((sum, r) => sum + r.order.grandTotal, 0);
  const grandHPP = reportRows.reduce((sum, r) => sum + r.orderHPP, 0);
  const grandProfit = grandOmzet - grandHPP;

  const handleExportCSV = () => {
    const headers = ['No Pesanan', 'Tanggal', 'Saluran', 'Pelanggan', 'Metode Bayar', 'Omzet (IDR)', 'HPP Modal (IDR)', 'Laba Kotor (IDR)'];
    const rows = reportRows.map((r) => [
      r.order.orderNumber,
      r.order.createdAt,
      r.order.channel,
      `"${r.order.customer?.name || 'Walk-in'}"`,
      r.order.paymentMethod,
      r.order.grandTotal,
      r.orderHPP,
      r.grossProfit,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `laporan-penjualan-warung-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('File CSV laporan penjualan berhasil diunduh.', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-ink">Laporan Penjualan & Laba</h1>
          <p className="text-xs sm:text-sm text-muted">
            Analisis omzet kotor, modal HPP sembako, dan estimasi keuntungan bersih per transaksi
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCSV}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface hover:bg-canvas border border-border text-ink font-semibold text-xs sm:text-sm shadow-xs transition-colors shrink-0"
        >
          <Download className="w-4 h-4 text-sage-500" />
          <span>Ekspor CSV</span>
        </button>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-surface border border-border flex items-center justify-between">
          <div>
            <span className="text-xs text-muted block">Akumulasi Omzet</span>
            <span className="text-xl font-extrabold text-ink tabular-nums">
              {formatIDR(grandOmzet)}
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-50 text-success">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-border flex items-center justify-between">
          <div>
            <span className="text-xs text-muted block">Total Modal HPP</span>
            <span className="text-xl font-extrabold text-muted tabular-nums">
              {formatIDR(grandHPP)}
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-gray-100 text-gray-700">
            <ShoppingCart className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-border flex items-center justify-between">
          <div>
            <span className="text-xs text-muted block">Laba Kotor Bersih</span>
            <span className="text-xl font-extrabold text-sage-700 tabular-nums">
              {formatIDR(grandProfit)}
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-purple-50 text-purple-700">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Row */}
      <div className="bg-surface p-4 rounded-xl border border-border flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-muted">Saluran Penjualan:</span>
          <select
            value={filterChannel}
            onChange={(e) => setFilterChannel(e.target.value)}
            className="bg-canvas border border-border rounded-lg px-3 py-1.5 text-ink focus:ring-2 focus:ring-sage-500 font-semibold"
          >
            <option value="all">Semua Saluran (POS & Online)</option>
            <option value="POS">Hanya Kasir POS</option>
            <option value="ONLINE">Hanya Toko Online</option>
          </select>
        </div>

        <span className="text-muted text-[11px]">
          Menampilkan {reportRows.length} baris transaksi
        </span>
      </div>

      {/* Table */}
      <div className="bg-surface rounded-xl border border-border shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-canvas border-b border-border text-muted uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">No. Transaksi</th>
                <th className="py-3 px-4">Waktu</th>
                <th className="py-3 px-4">Saluran</th>
                <th className="py-3 px-4">Pelanggan</th>
                <th className="py-3 px-4 text-right">Omzet (IDR)</th>
                <th className="py-3 px-4 text-right">Estimasi HPP</th>
                <th className="py-3 px-4 text-right">Laba Kotor</th>
                <th className="py-3 px-4 text-center">Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {reportRows.map((row) => (
                <tr key={row.order.id} className="hover:bg-canvas/50">
                  <td className="py-3 px-4 font-mono font-bold text-ink">
                    {row.order.orderNumber}
                  </td>
                  <td className="py-3 px-4 text-muted whitespace-nowrap">
                    {formatDateTime(row.order.createdAt)}
                  </td>
                  <td className="py-3 px-4 font-semibold">{row.order.channel}</td>
                  <td className="py-3 px-4 font-medium text-ink">
                    {row.order.customer?.name || 'Walk-in'}
                  </td>
                  <td className="py-3 px-4 text-right font-extrabold tabular-nums text-ink">
                    {formatIDR(row.order.grandTotal)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-muted">
                    {formatIDR(row.orderHPP)}
                  </td>
                  <td className="py-3 px-4 text-right font-bold tabular-nums text-sage-700">
                    {formatIDR(row.grossProfit)}
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-ink-soft">
                    {row.profitMargin.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-canvas border-t-2 border-border font-bold text-xs text-ink">
              <tr>
                <td colSpan={4} className="py-3 px-4 text-right uppercase">
                  TOTAL KESELURUHAN:
                </td>
                <td className="py-3 px-4 text-right tabular-nums text-sm">
                  {formatIDR(grandOmzet)}
                </td>
                <td className="py-3 px-4 text-right tabular-nums text-muted">
                  {formatIDR(grandHPP)}
                </td>
                <td className="py-3 px-4 text-right tabular-nums text-sm text-sage-700">
                  {formatIDR(grandProfit)}
                </td>
                <td className="py-3 px-4 text-center">
                  {grandOmzet > 0 ? ((grandProfit / grandOmzet) * 100).toFixed(1) : 0}%
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
