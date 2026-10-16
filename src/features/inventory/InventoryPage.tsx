import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Boxes,
  Search,
  History,
  X,
  FileText,
  Truck,
} from 'lucide-react';
import { Product, StockMovement } from '../../domain/types';
import { inventoryRepository } from '../../services';
import { formatDateTime } from '../../domain/money';
import { StockBadge } from '../../components/ui/StockBadge';
import { useToast } from '../../context/ToastContext';
import { useDemoAuth } from '../../context/DemoAuthContext';

export const InventoryPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'stock' | 'movements'>('stock');

  // Adjustment Modal State
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<number>(0);
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { currentUser } = useDemoAuth();
  const { showToast } = useToast();

  const loadData = async () => {
    setLoading(true);
    const prods = await inventoryRepository.list();
    const movs = await inventoryRepository.getMovements();
    setProducts(prods);
    setMovements(movs);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAdjustModal = (product: Product) => {
    setAdjustingProduct(product);
    setAdjustAmount(0);
    setReason('');
  };

  const handleConfirmAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingProduct) return;
    if (adjustAmount === 0) {
      showToast('Jumlah perubahan stok tidak boleh 0.', 'error');
      return;
    }
    if (!reason.trim()) {
      showToast('Alasan penyesuaian stok wajib diisi.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await inventoryRepository.adjust(
        adjustingProduct.id,
        adjustAmount,
        reason.trim(),
        currentUser.name
      );
      showToast(
        `Stok ${adjustingProduct.name} berhasil disesuaikan (${adjustAmount > 0 ? '+' : ''}${adjustAmount}).`,
        'success'
      );
      setAdjustingProduct(null);
      await loadData();
    } catch {
      showToast('Gagal menyesuaikan stok.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    if (filterStatus === 'low' && p.stock.status !== 'LOW_STOCK') return false;
    if (filterStatus === 'out' && p.stock.status !== 'OUT_OF_STOCK') return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.barcode.includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-ink">Persediaan & Stok Gudang</h1>
          <p className="text-xs sm:text-sm text-muted">
            Monitoring stok fisik (On Hand), reservasi online (Reserved), dan stok siap jual (Available)
          </p>
        </div>

        {/* Tab Switcher & Quick Purchase Action */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Link
            to="/app/pembelian?action=new"
            className="px-3.5 py-1.5 rounded-xl bg-sage-600 hover:bg-sage-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Truck className="w-3.5 h-3.5" />
            <span>+ Input Kulakan (Beli Barang)</span>
          </Link>

          <div className="flex items-center gap-1 bg-surface p-1 rounded-xl border border-border text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('stock')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'stock'
                  ? 'bg-sage-500 text-white shadow-xs'
                  : 'text-muted hover:text-ink'
              }`}
            >
              <Boxes className="w-3.5 h-3.5" />
              <span>Stok Produk</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('movements')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'movements'
                  ? 'bg-sage-500 text-white shadow-xs'
                  : 'text-muted hover:text-ink'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Riwayat Pergerakan</span>
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'stock' ? (
        <>
          {/* Filter Toolbar */}
          <div className="bg-surface p-4 rounded-xl border border-border flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="relative flex-1 min-w-[240px]">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama barang, SKU, barcode..."
                className="w-full pl-8 pr-3 py-2 bg-canvas border border-border rounded-lg text-ink focus:ring-2 focus:ring-sage-500"
              />
              <Search className="w-4 h-4 text-muted absolute left-2.5 top-2.5 pointer-events-none" />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-muted">Filter Status:</span>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-canvas border border-border rounded-lg px-3 py-2 text-ink focus:ring-2 focus:ring-sage-500"
              >
                <option value="all">Semua Status</option>
                <option value="low">Hanya Stok Menipis</option>
                <option value="out">Hanya Stok Habis</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-surface rounded-xl border border-border shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-canvas border-b border-border text-muted uppercase font-semibold">
                  <tr>
                    <th className="py-3 px-4">Barang Sembako</th>
                    <th className="py-3 px-4 text-center">Fisik (On Hand)</th>
                    <th className="py-3 px-4 text-center">Tertahan (Reserved)</th>
                    <th className="py-3 px-4 text-center">Tersedia (Available)</th>
                    <th className="py-3 px-4 text-center">Batas Minimum</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-muted">
                        Memuat data persediaan...
                      </td>
                    </tr>
                  ) : filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-muted">
                        Tidak ada barang yang cocok.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((prod) => (
                      <tr key={prod.id} className="hover:bg-canvas/50">
                        <td className="py-3 px-4">
                          <p className="font-bold text-ink">{prod.name}</p>
                          <p className="font-mono text-[11px] text-muted">
                            SKU: {prod.sku} • {prod.categoryName}
                          </p>
                        </td>
                        <td className="py-3 px-4 text-center font-bold tabular-nums text-sm text-ink">
                          {prod.stock.onHand} {prod.unit}
                        </td>
                        <td className="py-3 px-4 text-center font-medium tabular-nums text-muted">
                          {prod.stock.reserved} {prod.unit}
                        </td>
                        <td className="py-3 px-4 text-center font-extrabold tabular-nums text-sm text-sage-700">
                          {prod.stock.available} {prod.unit}
                        </td>
                        <td className="py-3 px-4 text-center text-muted">
                          {prod.minStockAlert} {prod.unit}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <StockBadge status={prod.stock.status} availableCount={prod.stock.available} unit={prod.unit} />
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => openAdjustModal(prod)}
                            className="px-3 py-1.5 rounded-lg border border-border bg-canvas hover:bg-surface font-semibold text-xs text-ink transition-colors"
                          >
                            Sesuaikan Stok
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Movements Audit History Tab */
        <div className="bg-surface rounded-xl border border-border shadow-xs overflow-hidden">
          <div className="p-4 border-b border-border bg-canvas/60">
            <h3 className="font-bold text-sm text-ink flex items-center gap-2">
              <FileText className="w-4 h-4 text-sage-500" />
              <span>Audit Trail Riwayat Penyesuaian & Penerimaan Stok</span>
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-canvas border-b border-border text-muted uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Waktu</th>
                  <th className="py-3 px-4">Barang Sembako</th>
                  <th className="py-3 px-4 text-center">Perubahan</th>
                  <th className="py-3 px-4 text-center">Sebelum → Sesudah</th>
                  <th className="py-3 px-4">Alasan Perubahan</th>
                  <th className="py-3 px-4">Petugas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {movements.map((mov) => (
                  <tr key={mov.id} className="hover:bg-canvas/50">
                    <td className="py-3 px-4 text-muted whitespace-nowrap">
                      {formatDateTime(mov.createdAt)}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-ink">{mov.productName}</p>
                      <p className="font-mono text-[11px] text-muted">SKU: {mov.sku}</p>
                    </td>
                    <td className="py-3 px-4 text-center font-bold tabular-nums">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-xs ${
                          mov.changeAmount > 0
                            ? 'bg-emerald-50 text-success'
                            : 'bg-red-50 text-danger'
                        }`}
                      >
                        {mov.changeAmount > 0 ? `+${mov.changeAmount}` : mov.changeAmount}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono tabular-nums text-muted">
                      {mov.previousOnHand} → <strong>{mov.newOnHand}</strong>
                    </td>
                    <td className="py-3 px-4 font-medium text-ink max-w-xs">{mov.reason}</td>
                    <td className="py-3 px-4 text-muted">{mov.createdBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Penyesuaian Stok */}
      {adjustingProduct && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-xs"
        >
          <div className="bg-surface rounded-2xl border border-border shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-ink">Sesuaikan Stok Fisik</h3>
              <button
                type="button"
                onClick={() => setAdjustingProduct(null)}
                className="text-muted hover:text-ink p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmAdjustment} className="space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-canvas border border-border space-y-1">
                <p className="font-bold text-sm text-ink">{adjustingProduct.name}</p>
                <p className="font-mono text-[11px] text-muted">SKU: {adjustingProduct.sku}</p>
                <p className="text-muted">
                  Stok Fisik Saat Ini: <strong>{adjustingProduct.stock.onHand} {adjustingProduct.unit}</strong>
                </p>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-ink block">
                  Jumlah Perubahan (+ untuk tambah, - untuk kurang):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    autoFocus
                    required
                    value={adjustAmount || ''}
                    onChange={(e) => setAdjustAmount(parseInt(e.target.value) || 0)}
                    placeholder="Contoh: 10 atau -2"
                    className="w-full px-3 py-2 bg-canvas border border-border rounded-lg font-bold text-ink focus:ring-2 focus:ring-magenta-500 tabular-nums"
                  />
                  <span className="text-muted font-medium">{adjustingProduct.unit}</span>
                </div>
              </div>

              {/* Final calculation preview */}
              <div className="p-3 rounded-lg bg-surface border border-border flex justify-between items-center text-xs">
                <span className="text-muted">Estimasi Stok Akhir:</span>
                <span className="font-extrabold text-sm tabular-nums text-ink">
                  {Math.max(0, adjustingProduct.stock.onHand + adjustAmount)} {adjustingProduct.unit}
                </span>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-ink block">
                  Alasan Penyesuaian <span className="text-danger">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Wajib diisi (Contoh: Penerimaan barang supplier / Penataan rak rusak / Selisih opname fisik)"
                  className="w-full px-3 py-2 bg-canvas border border-border rounded-lg text-ink focus:ring-2 focus:ring-magenta-500"
                />
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustingProduct(null)}
                  className="px-4 py-2 font-semibold text-muted hover:text-ink"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || adjustAmount === 0 || !reason.trim()}
                  className="px-5 py-2 font-bold rounded-lg bg-magenta-500 hover:bg-magenta-700 disabled:opacity-40 text-white shadow-sm"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Konfirmasi Penyesuaian'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
