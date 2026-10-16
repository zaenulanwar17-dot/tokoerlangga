import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Tag,
  X,
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { Product, PriceRule } from '../../domain/types';
import { productRepository } from '../../services';
import { CreateProductInput } from '../../services/contracts';
import { formatIDR } from '../../domain/money';
import { StockBadge } from '../../components/ui/StockBadge';
import { ConfirmDialog } from '../../components/feedback/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import { DEMO_CATEGORIES } from '../../data/demo-data';
import { validatePriceRules } from '../../domain/pricing';
import {
  downloadProductExcelTemplate,
  parseProductExcelFile,
} from '../../utils/excelImport';

export const ProductListPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null);

  // Excel Import state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importedRows, setImportedRows] = useState<CreateProductInput[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [unit, setUnit] = useState('pcs');
  const [categoryId, setCategoryId] = useState(DEMO_CATEGORIES[0].id);
  const [costPrice, setCostPrice] = useState<number>(0);
  const [minStockAlert, setMinStockAlert] = useState<number>(10);
  const [initialStock, setInitialStock] = useState<number>(20);
  const [description, setDescription] = useState('');
  const [retailPrice, setRetailPrice] = useState<number>(0);
  const [wholesale1Price, setWholesale1Price] = useState<number>(0);
  const [wholesale1MinQty, setWholesale1MinQty] = useState<number>(6);
  const [wholesale2Price, setWholesale2Price] = useState<number>(0);
  const [wholesale2MinQty, setWholesale2MinQty] = useState<number>(12);

  const { showToast } = useToast();

  const loadProducts = async () => {
    setLoading(true);
    const data = await productRepository.list();
    setProducts(data);
    setLoading(false);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const openCreateModal = () => {
    setEditingProduct(null);
    setName('');
    setSku(`PROD-${Math.floor(100 + Math.random() * 900)}`);
    setBarcode(`899${Math.floor(100000000 + Math.random() * 900000000)}`);
    setUnit('pcs');
    setCategoryId(DEMO_CATEGORIES[0].id);
    setCostPrice(10000);
    setMinStockAlert(10);
    setInitialStock(20);
    setDescription('');
    setRetailPrice(12500);
    setWholesale1Price(11800);
    setWholesale1MinQty(6);
    setWholesale2Price(11200);
    setWholesale2MinQty(12);
    setModalOpen(true);
  };

  const openEditModal = (prod: Product) => {
    setEditingProduct(prod);
    setName(prod.name);
    setSku(prod.sku);
    setBarcode(prod.barcode);
    setUnit(prod.unit);
    setCategoryId(prod.categoryId);
    setCostPrice(prod.costPrice);
    setMinStockAlert(prod.minStockAlert);
    setInitialStock(prod.stock.onHand);
    setDescription(prod.description || '');

    const ret = prod.priceRules.find((r) => r.tier === 'RETAIL' && r.minQuantity === 1);
    const w1 = prod.priceRules.find((r) => r.tier === 'WHOLESALE_1');
    const w2 = prod.priceRules.find((r) => r.tier === 'WHOLESALE_2');

    setRetailPrice(ret ? ret.unitPrice : 0);
    setWholesale1Price(w1 ? w1.unitPrice : 0);
    setWholesale1MinQty(w1 ? w1.minQuantity : 6);
    setWholesale2Price(w2 ? w2.unitPrice : 0);
    setWholesale2MinQty(w2 ? w2.minQuantity : 12);

    setModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !sku.trim()) {
      showToast('Nama produk dan SKU wajib diisi.', 'error');
      return;
    }

    const catObj = DEMO_CATEGORIES.find((c) => c.id === categoryId);
    const rules: PriceRule[] = [
      { tier: 'RETAIL', minQuantity: 1, unitPrice: retailPrice },
    ];
    if (wholesale1Price > 0) {
      rules.push({ tier: 'WHOLESALE_1', minQuantity: wholesale1MinQty, unitPrice: wholesale1Price });
    }
    if (wholesale2Price > 0) {
      rules.push({ tier: 'WHOLESALE_2', minQuantity: wholesale2MinQty, unitPrice: wholesale2Price });
    }

    const ruleValidation = validatePriceRules(rules);
    if (!ruleValidation.isValid) {
      showToast(ruleValidation.error || 'Aturan harga tidak valid.', 'error');
      return;
    }

    try {
      if (editingProduct) {
        await productRepository.update(editingProduct.id, {
          name,
          sku,
          barcode,
          unit,
          categoryId,
          categoryName: catObj ? catObj.name : 'Umum',
          costPrice,
          minStockAlert,
          description,
          priceRules: rules,
        });
        showToast(`Produk ${name} berhasil diperbarui!`, 'success');
      } else {
        await productRepository.create({
          sku,
          barcode,
          name,
          unit,
          categoryId,
          categoryName: catObj ? catObj.name : 'Umum',
          costPrice,
          minStockAlert,
          initialOnHand: initialStock,
          description,
          priceRules: rules,
        });
        showToast(`Produk baru ${name} berhasil ditambahkan!`, 'success');
      }

      setModalOpen(false);
      await loadProducts();
    } catch {
      showToast('Gagal menyimpan data produk.', 'error');
    }
  };

  const handleConfirmDeactivate = async () => {
    if (!deactivatingId) return;
    try {
      await productRepository.deactivate(deactivatingId);
      showToast('Produk telah dinonaktifkan.', 'info');
      setDeactivatingId(null);
      await loadProducts();
    } catch {
      showToast('Gagal menonaktifkan produk.', 'error');
    }
  };

  const handleImportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    setIsParsing(true);
    setImportErrors([]);

    try {
      const result = await parseProductExcelFile(file);
      setImportedRows(result.data);
      setImportErrors(result.errors);
    } catch (err: any) {
      showToast(err.message || 'Gagal membaca format file Excel.', 'error');
      setImportedRows([]);
      setImportErrors([err.message || 'Format file tidak didukung.']);
    } finally {
      setIsParsing(false);
    }
  };

  const handleConfirmImport = async () => {
    if (importedRows.length === 0) {
      showToast('Tidak ada data produk yang valid untuk diimport.', 'error');
      return;
    }

    setIsImporting(true);
    try {
      await productRepository.bulkCreate(importedRows);
      showToast(`Berhasil mengimport ${importedRows.length} produk baru ke katalog!`, 'success');
      setIsImportModalOpen(false);
      setImportFile(null);
      setImportedRows([]);
      setImportErrors([]);
      await loadProducts();
    } catch {
      showToast('Gagal memproses import produk.', 'error');
    } finally {
      setIsImporting(false);
    }
  };

  const filtered = products.filter((p) => {
    if (selectedCategory && p.categoryId !== selectedCategory) return false;
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
      {/* Page Title & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-ink">Manajemen Produk Sembako</h1>
          <p className="text-xs sm:text-sm text-muted">
            Kelola data master barang, barcode, HPP, import Excel, dan aturan harga bertingkat
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setImportFile(null);
              setImportedRows([]);
              setImportErrors([]);
              setIsImportModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-sage-500 hover:bg-sage-600 text-white font-semibold text-xs shadow-xs transition-colors shrink-0"
          >
            <Upload className="w-4 h-4" />
            <span>Import Excel / CSV</span>
          </button>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-magenta-500 hover:bg-magenta-700 text-white font-bold text-xs sm:text-sm shadow-sm transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Produk Baru</span>
          </button>
        </div>
      </div>

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
          <span className="text-muted">Kategori:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-canvas border border-border rounded-lg px-3 py-2 text-ink focus:ring-2 focus:ring-sage-500"
          >
            <option value="">Semua Kategori</option>
            {DEMO_CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Product Data Table */}
      <div className="bg-surface rounded-xl border border-border shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-canvas border-b border-border text-muted uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Nama Produk & SKU</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4 text-right">HPP (Modal)</th>
                <th className="py-3 px-4 text-right">Harga Eceran</th>
                <th className="py-3 px-4 text-center">Stok Fisik</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-muted">
                    Memuat data produk...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-muted">
                    Tidak ada produk yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filtered.map((prod) => {
                  const retail = prod.priceRules.find((r) => r.tier === 'RETAIL' && r.minQuantity === 1);
                  const price = retail ? retail.unitPrice : 0;

                  return (
                    <tr key={prod.id} className="hover:bg-canvas/50">
                      <td className="py-3 px-4">
                        <p className="font-bold text-ink">{prod.name}</p>
                        <p className="font-mono text-[11px] text-muted">
                          SKU: {prod.sku} • {prod.barcode}
                        </p>
                      </td>
                      <td className="py-3 px-4 text-muted">{prod.categoryName}</td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums">
                        {formatIDR(prod.costPrice)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold tabular-nums text-ink">
                        {formatIDR(price)}/{prod.unit}
                      </td>
                      <td className="py-3 px-4 text-center font-bold tabular-nums">
                        {prod.stock.onHand} {prod.unit}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <StockBadge status={prod.stock.status} availableCount={prod.stock.available} unit={prod.unit} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(prod)}
                            className="p-1.5 text-muted hover:text-ink rounded bg-canvas border border-border hover:bg-surface"
                            title="Edit data produk"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {prod.isActive && (
                            <button
                              type="button"
                              onClick={() => setDeactivatingId(prod.id)}
                              className="p-1.5 text-muted hover:text-danger rounded bg-canvas border border-border hover:bg-surface"
                              title="Nonaktifkan produk"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Tambah / Edit Produk */}
      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-xs overflow-y-auto"
        >
          <div className="bg-surface rounded-2xl border border-border shadow-2xl max-w-xl w-full p-6 space-y-4 my-8 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-ink">
                {editingProduct ? 'Ubah Data Produk' : 'Tambah Produk Sembako Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-muted hover:text-ink p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="font-semibold text-ink">
                    Nama Barang Sembako <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Beras Ramos Premium 5 kg"
                    className="w-full px-3 py-2 bg-canvas border border-border rounded-lg text-ink font-medium focus:ring-2 focus:ring-magenta-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-ink">
                    SKU Kode Barang <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full px-3 py-2 bg-canvas border border-border rounded-lg text-ink font-mono uppercase focus:ring-2 focus:ring-magenta-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-ink">Barcode (EAN-13)</label>
                  <input
                    type="text"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    className="w-full px-3 py-2 bg-canvas border border-border rounded-lg text-ink font-mono focus:ring-2 focus:ring-magenta-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-ink">Kategori</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2 bg-canvas border border-border rounded-lg text-ink focus:ring-2 focus:ring-magenta-500"
                  >
                    {DEMO_CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-ink">Satuan (Unit)</label>
                  <input
                    type="text"
                    required
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="pcs / kg / sak / karton / pouch"
                    className="w-full px-3 py-2 bg-canvas border border-border rounded-lg text-ink focus:ring-2 focus:ring-magenta-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-ink">HPP / Harga Modal (Rp)</label>
                  <input
                    type="number"
                    min={0}
                    value={costPrice}
                    onChange={(e) => setCostPrice(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-canvas border border-border rounded-lg text-ink font-semibold tabular-nums focus:ring-2 focus:ring-magenta-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-ink">Batas Peringatan Stok Menipis</label>
                  <input
                    type="number"
                    min={1}
                    value={minStockAlert}
                    onChange={(e) => setMinStockAlert(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 bg-canvas border border-border rounded-lg text-ink focus:ring-2 focus:ring-magenta-500"
                  />
                </div>

                {!editingProduct && (
                  <div className="space-y-1">
                    <label className="font-semibold text-ink">Stok Fisik Awal</label>
                    <input
                      type="number"
                      min={0}
                      value={initialStock}
                      onChange={(e) => setInitialStock(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-canvas border border-border rounded-lg text-ink font-semibold focus:ring-2 focus:ring-magenta-500"
                    />
                  </div>
                )}
              </div>

              {/* Aturan Harga Bertingkat Section */}
              <div className="p-3.5 bg-canvas rounded-xl border border-border space-y-3">
                <p className="font-bold text-ink flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-sage-500" />
                  Aturan Harga Bertingkat Awal:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="font-semibold text-ink">Harga Eceran (Min 1)</label>
                    <input
                      type="number"
                      min={1}
                      value={retailPrice}
                      onChange={(e) => setRetailPrice(parseInt(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 bg-surface border border-border rounded-lg font-semibold tabular-nums"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-amber-900">
                      Grosir 1 (Min {wholesale1MinQty} {unit})
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={wholesale1Price}
                      onChange={(e) => setWholesale1Price(parseInt(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 bg-surface border border-border rounded-lg font-semibold tabular-nums"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-magenta-900">
                      Grosir 2 (Min {wholesale2MinQty} {unit})
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={wholesale2Price}
                      onChange={(e) => setWholesale2Price(parseInt(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 bg-surface border border-border rounded-lg font-semibold tabular-nums"
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 font-semibold text-muted hover:text-ink"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold rounded-lg bg-magenta-500 hover:bg-magenta-700 text-white shadow-sm"
                >
                  Simpan Produk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Excel Import Produk Modal */}
      {isImportModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-xs"
        >
          <div className="bg-surface rounded-2xl border border-border shadow-2xl max-w-2xl w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-base font-bold text-ink">Import Data Produk dari Excel (.xlsx / .csv)</h3>
                <p className="text-xs text-muted">
                  Migrasikan data barang dari aplikasi lama lengkap dengan HPP, harga eceran/grosir, dan stok awal
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="text-muted hover:text-ink p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Template Download Guide */}
            <div className="p-3.5 bg-canvas rounded-xl border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <span className="font-bold text-ink flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  Format Template Excel Sembako
                </span>
                <p className="text-muted text-[11px]">
                  Kolom: nama_produk, sku, barcode, kategori, satuan, hpp, harga_eceran, harga_grosir_1, min_qty_grosir_1, stok_awal
                </p>
              </div>
              <button
                type="button"
                onClick={downloadProductExcelTemplate}
                className="px-3 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold flex items-center gap-1 text-xs shrink-0 self-start sm:self-auto"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Format Template</span>
              </button>
            </div>

            {/* File Upload Box */}
            <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-sage-500 transition-colors">
              <input
                type="file"
                id="excel-product-upload"
                accept=".xlsx,.xls,.csv"
                onChange={handleImportFileChange}
                className="hidden"
              />
              <label
                htmlFor="excel-product-upload"
                className="cursor-pointer flex flex-col items-center justify-center space-y-2"
              >
                <div className="p-3 bg-sage-50 text-sage-600 rounded-full">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold text-ink block">
                    {importFile ? importFile.name : 'Pilih atau Drag File Excel (.xlsx / .csv)'}
                  </span>
                  <span className="text-[11px] text-muted block mt-0.5">
                    Klik di sini untuk mengunggah berkas data produk
                  </span>
                </div>
              </label>
            </div>

            {/* Parsing Indicator / Error List */}
            {isParsing && (
              <p className="text-center text-xs text-muted">Sedang menganalisis berkas Excel...</p>
            )}

            {importErrors.length > 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-danger space-y-1 max-h-24 overflow-y-auto">
                <p className="font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Catatan Kesalahan:
                </p>
                <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                  {importErrors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Preview Table */}
            {importedRows.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-ink">
                  <span className="flex items-center gap-1 text-success">
                    <CheckCircle2 className="w-4 h-4" />
                    {importedRows.length} Produk siap diimport
                  </span>
                  <span className="text-muted">
                    Total Stok Awal: {importedRows.reduce((sum, r) => sum + (r.initialOnHand || 0), 0)} unit
                  </span>
                </div>

                <div className="max-h-48 overflow-y-auto rounded-lg border border-border text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-canvas border-b border-border text-[11px] text-muted uppercase font-semibold sticky top-0">
                      <tr>
                        <th className="py-2 px-3">Nama Produk</th>
                        <th className="py-2 px-3">SKU</th>
                        <th className="py-2 px-3">Satuan</th>
                        <th className="py-2 px-3 text-right">HPP</th>
                        <th className="py-2 px-3 text-right">Eceran</th>
                        <th className="py-2 px-3 text-right">Stok Awal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {importedRows.map((r, i) => {
                        const retail = r.priceRules.find((pr) => pr.tier === 'RETAIL')?.unitPrice || 0;
                        return (
                          <tr key={i} className="hover:bg-canvas/40">
                            <td className="py-2 px-3 font-semibold text-ink">{r.name}</td>
                            <td className="py-2 px-3 font-mono text-muted">{r.sku}</td>
                            <td className="py-2 px-3 text-muted">{r.unit}</td>
                            <td className="py-2 px-3 text-right tabular-nums">{formatIDR(r.costPrice)}</td>
                            <td className="py-2 px-3 text-right font-bold text-ink tabular-nums">{formatIDR(retail)}</td>
                            <td className="py-2 px-3 text-right font-bold text-sage-700 tabular-nums">{r.initialOnHand || 0}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="pt-3 border-t border-border flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-lg border border-border text-ink hover:bg-canvas"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isImporting || importedRows.length === 0}
                onClick={handleConfirmImport}
                className="px-5 py-2 text-xs font-bold rounded-lg bg-sage-500 hover:bg-sage-600 text-white shadow-xs disabled:opacity-40 transition-colors flex items-center gap-1.5"
              >
                {isImporting ? 'Mengimport...' : `Konfirmasi & Import (${importedRows.length} Produk)`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Deactivation Modal */}
      <ConfirmDialog
        isOpen={Boolean(deactivatingId)}
        title="Nonaktifkan Produk Ini?"
        message="Produk yang dinonaktifkan tidak akan muncul lagi di katalog penjualan kasir maupun toko online."
        confirmLabel="Ya, Nonaktifkan"
        isDestructive={true}
        onConfirm={handleConfirmDeactivate}
        onCancel={() => setDeactivatingId(null)}
      />
    </div>
  );
};
