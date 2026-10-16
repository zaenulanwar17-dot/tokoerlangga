import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Truck,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign,
  Package,
  Calendar,
  Trash2,
  X,
  Eye,
  Info,
  Building2,
  Phone,
  MapPin,
  Edit2,
  UserCheck,
  ShoppingBag,
} from 'lucide-react';
import { Purchase, Product, PaymentMethod, Supplier } from '../../domain/types';
import { purchaseRepository, productRepository, supplierRepository } from '../../services';
import { formatIDR, formatDate, formatNumber } from '../../domain/money';
import { useDemoAuth } from '../../context/DemoAuthContext';

interface NewPurchaseItemRow {
  productId: string;
  quantity: number;
  costPrice: number;
}

export const PurchasesPage: React.FC = () => {
  const { currentUser } = useDemoAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active Tab: 'PURCHASES' | 'SUPPLIERS'
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'PURCHASES' | 'SUPPLIERS'>(
    tabParam === 'supplier' || tabParam === 'suppliers' ? 'SUPPLIERS' : 'PURCHASES'
  );

  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters for Purchases
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'UNPAID'>('ALL');

  // Search for Suppliers
  const [supplierSearchQuery, setSupplierSearchQuery] = useState('');

  // Modal Create Purchase State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [supplierInvoiceNumber, setSupplierInvoiceNumber] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [paymentStatus, setPaymentStatus] = useState<'PAID' | 'UNPAID'>('PAID');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<NewPurchaseItemRow[]>([
    { productId: '', quantity: 1, costPrice: 0 },
  ]);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modal Detail State
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);

  // Modal Supplier (Tambah / Edit Supplier)
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    address: '',
    notes: '',
  });
  const [supplierFormError, setSupplierFormError] = useState<string | null>(null);
  const [isSavingSupplier, setIsSavingSupplier] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [purchasesData, productsData, suppliersData] = await Promise.all([
        purchaseRepository.list(),
        productRepository.list(),
        supplierRepository.list(),
      ]);
      setPurchases(purchasesData);
      setProducts(productsData);
      setSuppliers(suppliersData);
    } catch (err) {
      console.error('Gagal memuat data pembelian & supplier:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Sync tab with URL
  useEffect(() => {
    if (tabParam === 'supplier' || tabParam === 'suppliers') {
      setActiveTab('SUPPLIERS');
    } else if (tabParam === 'purchases') {
      setActiveTab('PURCHASES');
    }
  }, [tabParam]);

  // Check action parameter: ?action=new opens purchase modal
  useEffect(() => {
    if (searchParams.get('action') === 'new' && products.length > 0) {
      handleOpenCreateModal();
    }
  }, [searchParams, products.length]);

  const switchTab = (tab: 'PURCHASES' | 'SUPPLIERS') => {
    setActiveTab(tab);
    setSearchParams(tab === 'SUPPLIERS' ? { tab: 'supplier' } : { tab: 'purchases' });
  };

  // Filter purchases
  const filteredPurchases = purchases.filter((p) => {
    const matchesSearch =
      p.purchaseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.supplierInvoiceNumber &&
        p.supplierInvoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === 'ALL' ? true : p.paymentStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Filter suppliers
  const filteredSuppliers = suppliers.filter((s) => {
    const q = supplierSearchQuery.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      (s.contactPerson && s.contactPerson.toLowerCase().includes(q)) ||
      s.phone.toLowerCase().includes(q) ||
      (s.address && s.address.toLowerCase().includes(q))
    );
  });

  // Summary Metrics
  const totalPurchases = purchases.length;
  const totalSpend = purchases.reduce((sum, p) => sum + p.totalAmount, 0);
  const totalItemsCount = purchases.reduce(
    (sum, p) => sum + p.items.reduce((iSum, i) => iSum + i.quantity, 0),
    0
  );
  const unpaidPurchases = purchases.filter((p) => p.paymentStatus === 'UNPAID');
  const totalUnpaidAmount = unpaidPurchases.reduce((sum, p) => sum + p.totalAmount, 0);

  // Form Item Management
  const handleAddItemRow = () => {
    setItems([...items, { productId: '', quantity: 1, costPrice: 0 }]);
  };

  const handleRemoveItemRow = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, idx) => idx !== index));
  };

  const handleItemChange = (index: number, field: keyof NewPurchaseItemRow, value: any) => {
    const nextItems = [...items];
    const targetItem = { ...nextItems[index], [field]: value };

    // When selecting a product, automatically populate its default costPrice
    if (field === 'productId') {
      const selectedProd = products.find((p) => p.id === value);
      if (selectedProd) {
        targetItem.costPrice = selectedProd.costPrice;
      }
    }

    nextItems[index] = targetItem;
    setItems(nextItems);
  };

  const calculateFormTotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity || 0) * (item.costPrice || 0), 0);
  };

  const handleOpenCreateModal = (preselectedSupplier?: Supplier) => {
    if (preselectedSupplier) {
      setSelectedSupplierId(preselectedSupplier.id);
      setSupplierName(preselectedSupplier.name);
    } else {
      const defaultSup = suppliers[0];
      setSelectedSupplierId(defaultSup ? defaultSup.id : '');
      setSupplierName(defaultSup ? defaultSup.name : '');
    }
    setSupplierInvoiceNumber('');
    setPurchaseDate(new Date().toISOString().slice(0, 10));
    setPaymentStatus('PAID');
    setPaymentMethod('CASH');
    setNotes('');
    const firstProd = products[0];
    setItems([
      {
        productId: firstProd ? firstProd.id : '',
        quantity: 1,
        costPrice: firstProd ? firstProd.costPrice : 0,
      },
    ]);
    setFormError(null);
    setIsCreateModalOpen(true);
  };

  const handleSupplierSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedSupplierId(val);
    if (val === '__MANUAL__') {
      setSupplierName('');
    } else {
      const sup = suppliers.find((s) => s.id === val);
      if (sup) {
        setSupplierName(sup.name);
      }
    }
  };

  const handleSubmitPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const finalSupplierName = supplierName.trim();
    if (!finalSupplierName) {
      setFormError('Nama supplier wajib diisi atau dipilih dari daftar');
      return;
    }

    if (items.length === 0) {
      setFormError('Minimal harus ada 1 barang yang dibeli');
      return;
    }

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.productId) {
        setFormError(`Pilih barang pada baris ke-${i + 1}`);
        return;
      }
      if (it.quantity <= 0) {
        setFormError(`Jumlah masuk baris ke-${i + 1} harus lebih dari 0`);
        return;
      }
      if (it.costPrice < 0) {
        setFormError(`Harga beli baris ke-${i + 1} tidak boleh negatif`);
        return;
      }
    }

    try {
      setIsSubmitting(true);
      const created = await purchaseRepository.create({
        supplierId: selectedSupplierId !== '__MANUAL__' ? selectedSupplierId : undefined,
        supplierName: finalSupplierName,
        supplierInvoiceNumber: supplierInvoiceNumber.trim() || undefined,
        purchaseDate,
        paymentStatus,
        paymentMethod,
        notes: notes.trim() || undefined,
        createdBy: currentUser?.name || 'Admin',
        items: items.map((it) => ({
          productId: it.productId,
          quantity: Number(it.quantity),
          costPrice: Number(it.costPrice),
        })),
      });

      setIsCreateModalOpen(false);
      setSuccessMessage(
        `Pembelian ${created.purchaseNumber} berhasil disimpan! Stok barang otomatis bertambah di gudang.`
      );
      setTimeout(() => setSuccessMessage(null), 6000);
      await loadData();
    } catch (err: any) {
      setFormError(err?.message || 'Gagal menyimpan transaksi pembelian');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Supplier CRUD Handlers
  const handleOpenAddSupplier = () => {
    setEditingSupplier(null);
    setSupplierForm({
      name: '',
      contactPerson: '',
      phone: '',
      address: '',
      notes: '',
    });
    setSupplierFormError(null);
    setIsSupplierModalOpen(true);
  };

  const handleOpenEditSupplier = (sup: Supplier) => {
    setEditingSupplier(sup);
    setSupplierForm({
      name: sup.name,
      contactPerson: sup.contactPerson || '',
      phone: sup.phone,
      address: sup.address || '',
      notes: sup.notes || '',
    });
    setSupplierFormError(null);
    setIsSupplierModalOpen(true);
  };

  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    setSupplierFormError(null);

    if (!supplierForm.name.trim()) {
      setSupplierFormError('Nama supplier wajib diisi');
      return;
    }
    if (!supplierForm.phone.trim()) {
      setSupplierFormError('Nomor telepon / kontak wajib diisi');
      return;
    }

    try {
      setIsSavingSupplier(true);
      if (editingSupplier) {
        await supplierRepository.update(editingSupplier.id, {
          name: supplierForm.name.trim(),
          contactPerson: supplierForm.contactPerson.trim() || undefined,
          phone: supplierForm.phone.trim(),
          address: supplierForm.address.trim() || undefined,
          notes: supplierForm.notes.trim() || undefined,
        });
        setSuccessMessage(`Supplier "${supplierForm.name}" berhasil diperbarui.`);
      } else {
        const created = await supplierRepository.create({
          name: supplierForm.name.trim(),
          contactPerson: supplierForm.contactPerson.trim() || undefined,
          phone: supplierForm.phone.trim(),
          address: supplierForm.address.trim() || undefined,
          notes: supplierForm.notes.trim() || undefined,
        });
        setSuccessMessage(`Supplier baru "${created.name}" berhasil ditambahkan.`);

        // If the purchase modal is currently open, automatically select the new supplier
        if (isCreateModalOpen) {
          setSelectedSupplierId(created.id);
          setSupplierName(created.name);
        }
      }
      setTimeout(() => setSuccessMessage(null), 5000);
      setIsSupplierModalOpen(false);
      await loadData();
    } catch (err: any) {
      setSupplierFormError(err?.message || 'Gagal menyimpan data supplier');
    } finally {
      setIsSavingSupplier(false);
    }
  };

  const handleDeleteSupplier = async (sup: Supplier) => {
    if (
      window.confirm(
        `Yakin ingin menghapus supplier "${sup.name}"? Data riwayat pembelian yang sudah ada tetap aman.`
      )
    ) {
      try {
        await supplierRepository.delete(sup.id);
        setSuccessMessage(`Supplier "${sup.name}" telah dihapus.`);
        setTimeout(() => setSuccessMessage(null), 5000);
        await loadData();
      } catch (err: any) {
        alert(err?.message || 'Gagal menghapus supplier');
      }
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 text-sage-dark">
            <Truck className="w-8 h-8" />
            <h1 className="text-2xl font-bold tracking-tight text-ink">
              Pembelian & Data Supplier
            </h1>
          </div>
          <p className="text-sm text-ink-muted mt-1">
            Kelola master supplier sembako dan input transaksi kulakan barang masuk langsung ke stok gudang.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleOpenAddSupplier}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 bg-canvas hover:bg-border text-ink border border-border rounded-lg text-sm font-semibold transition-colors shadow-xs"
          >
            <Building2 className="w-4 h-4 text-sage-dark" />
            <span>+ Tambah Supplier</span>
          </button>
          <button
            onClick={() => handleOpenCreateModal()}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-sage hover:bg-sage-dark text-white rounded-lg text-sm font-semibold shadow-sm transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ Input Pembelian Baru (Kulakan)</span>
          </button>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="flex border-b border-border gap-2">
        <button
          onClick={() => switchTab('PURCHASES')}
          className={`pb-3 px-4 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'PURCHASES'
              ? 'border-sage text-sage-dark'
              : 'border-transparent text-ink-muted hover:text-ink hover:border-border'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Riwayat & Input Pembelian</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-canvas text-ink font-semibold border border-border">
            {purchases.length}
          </span>
        </button>

        <button
          onClick={() => switchTab('SUPPLIERS')}
          className={`pb-3 px-4 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'SUPPLIERS'
              ? 'border-sage text-sage-dark'
              : 'border-transparent text-ink-muted hover:text-ink hover:border-border'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Data Master Supplier</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-canvas text-ink font-semibold border border-border">
            {suppliers.length}
          </span>
        </button>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm shadow-sm animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="font-medium">{successMessage}</p>
        </div>
      )}

      {/* TAB 1: PURCHASES */}
      {activeTab === 'PURCHASES' && (
        <div className="space-y-6">
          {/* Summary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-surface p-4 rounded-xl border border-border shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-sage/10 text-sage-dark flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-ink-muted font-medium">Total Pembelian</p>
                <p className="text-lg font-bold text-ink">{totalPurchases} Transaksi</p>
              </div>
            </div>

            <div className="bg-surface p-4 rounded-xl border border-border shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-ink-muted font-medium">Total Nilai Kulakan</p>
                <p className="text-lg font-bold text-ink">{formatIDR(totalSpend)}</p>
              </div>
            </div>

            <div className="bg-surface p-4 rounded-xl border border-border shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-ink-muted font-medium">Barang Masuk Gudang</p>
                <p className="text-lg font-bold text-ink">{formatNumber(totalItemsCount)} Item</p>
              </div>
            </div>

            <div className="bg-surface p-4 rounded-xl border border-border shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-ink-muted font-medium">Hutang ke Supplier</p>
                <p className="text-lg font-bold text-amber-700">
                  {formatIDR(totalUnpaidAmount)}{' '}
                  <span className="text-xs font-normal text-ink-muted">
                    ({unpaidPurchases.length})
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Filter and Search Bar */}
          <div className="bg-surface p-4 rounded-xl border border-border shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari No. PO, Supplier, Faktur..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <span className="text-xs text-ink-muted font-medium shrink-0">Status Bayar:</span>
              <div className="inline-flex rounded-lg border border-border p-1 bg-canvas text-xs">
                <button
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-3 py-1 rounded-md font-medium transition-colors ${
                    statusFilter === 'ALL'
                      ? 'bg-surface text-ink font-semibold shadow-xs'
                      : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  Semua
                </button>
                <button
                  onClick={() => setStatusFilter('PAID')}
                  className={`px-3 py-1 rounded-md font-medium transition-colors ${
                    statusFilter === 'PAID'
                      ? 'bg-surface text-emerald-700 font-semibold shadow-xs'
                      : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  Lunas
                </button>
                <button
                  onClick={() => setStatusFilter('UNPAID')}
                  className={`px-3 py-1 rounded-md font-medium transition-colors ${
                    statusFilter === 'UNPAID'
                      ? 'bg-surface text-amber-700 font-semibold shadow-xs'
                      : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  Belum Lunas
                </button>
              </div>
            </div>
          </div>

          {/* Purchases Table */}
          <div className="bg-surface rounded-xl border border-border shadow-xs overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-ink-muted text-sm">Memuat data pembelian...</div>
            ) : filteredPurchases.length === 0 ? (
              <div className="p-12 text-center">
                <Truck className="w-12 h-12 text-ink-muted mx-auto mb-3 opacity-40" />
                <h3 className="text-base font-semibold text-ink">Belum ada riwayat pembelian</h3>
                <p className="text-sm text-ink-muted mt-1 max-w-sm mx-auto">
                  {searchQuery
                    ? 'Tidak ditemukan transaksi yang cocok dengan kata kunci pencarian.'
                    : 'Mulai catat transaksi kulakan pertama Anda untuk menambah stok gudang.'}
                </p>
                {!searchQuery && (
                  <button
                    onClick={() => handleOpenCreateModal()}
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-sage hover:bg-sage-dark text-white rounded-lg text-sm font-semibold transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Input Pembelian Sekarang
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-canvas border-b border-border text-ink-muted font-medium text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">No. PO & Tanggal</th>
                      <th className="px-4 py-3">Supplier</th>
                      <th className="px-4 py-3">Rincian Barang Masuk</th>
                      <th className="px-4 py-3 text-right">Total Tagihan</th>
                      <th className="px-4 py-3 text-center">Status Bayar</th>
                      <th className="px-4 py-3 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredPurchases.map((purchase) => {
                      const totalItems = purchase.items.reduce((s, it) => s + it.quantity, 0);
                      return (
                        <tr key={purchase.id} className="hover:bg-canvas/50 transition-colors">
                          <td className="px-4 py-3.5">
                            <div className="font-semibold text-ink">{purchase.purchaseNumber}</div>
                            <div className="text-xs text-ink-muted flex items-center gap-1 mt-0.5">
                              <Calendar className="w-3.5 h-3.5" />
                              {formatDate(purchase.purchaseDate)}
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="font-semibold text-ink flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-sage-dark shrink-0" />
                              <span>{purchase.supplierName}</span>
                            </div>
                            {purchase.supplierInvoiceNumber ? (
                              <div className="text-xs text-ink-muted mt-0.5">
                                Faktur: {purchase.supplierInvoiceNumber}
                              </div>
                            ) : (
                              <div className="text-xs text-ink-muted italic">- Tanpa No. Faktur -</div>
                            )}
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="text-ink font-medium">
                              {purchase.items.length} Macam Barang ({formatNumber(totalItems)} unit)
                            </div>
                            <div className="text-xs text-ink-muted truncate max-w-xs mt-0.5">
                              {purchase.items
                                .map((it) => `${it.productName} (${it.quantity} ${it.unit})`)
                                .join(', ')}
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-right font-bold text-ink">
                            {formatIDR(purchase.totalAmount)}
                            <div className="text-xs font-normal text-ink-muted">
                              Metode: {purchase.paymentMethod}
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            {purchase.paymentStatus === 'PAID' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" />
                                Lunas
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                <AlertCircle className="w-3 h-3" />
                                Hutang Supplier
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <button
                              onClick={() => setSelectedPurchase(purchase)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border hover:bg-canvas text-ink text-xs font-medium rounded-lg transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5 text-ink-muted" />
                              Detail
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: SUPPLIERS */}
      {activeTab === 'SUPPLIERS' && (
        <div className="space-y-6">
          {/* Supplier Header & Search */}
          <div className="bg-surface p-4 rounded-xl border border-border shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-96">
              <Search className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama supplier, kontak, telepon..."
                value={supplierSearchQuery}
                onChange={(e) => setSupplierSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sage"
              />
            </div>

            <button
              onClick={handleOpenAddSupplier}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-sage hover:bg-sage-dark text-white rounded-lg text-sm font-semibold transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              + Tambah Supplier Baru
            </button>
          </div>

          {/* Supplier Grid / Table */}
          <div className="bg-surface rounded-xl border border-border shadow-xs overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-ink-muted text-sm">Memuat data supplier...</div>
            ) : filteredSuppliers.length === 0 ? (
              <div className="p-12 text-center">
                <Building2 className="w-12 h-12 text-ink-muted mx-auto mb-3 opacity-40" />
                <h3 className="text-base font-semibold text-ink">Tidak ada supplier ditemukan</h3>
                <p className="text-sm text-ink-muted mt-1 max-w-sm mx-auto">
                  {supplierSearchQuery
                    ? 'Tidak ada supplier yang cocok dengan kata kunci pencarian.'
                    : 'Daftarkan supplier atau distributor langganan Anda untuk mempermudah pencatatan kulakan.'}
                </p>
                <button
                  onClick={handleOpenAddSupplier}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-sage hover:bg-sage-dark text-white rounded-lg text-sm font-semibold transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Tambah Supplier Sekarang
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-canvas border-b border-border text-ink-muted font-medium text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Nama Supplier / Perusahaan</th>
                      <th className="px-4 py-3">Kontak & Telepon</th>
                      <th className="px-4 py-3">Alamat Gudang / Kantor</th>
                      <th className="px-4 py-3">Catatan / Komoditas</th>
                      <th className="px-4 py-3 text-center">Total Kulakan</th>
                      <th className="px-4 py-3 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y border-border">
                    {filteredSuppliers.map((sup) => {
                      const supplierPurchases = purchases.filter(
                        (p) => p.supplierId === sup.id || p.supplierName.toLowerCase() === sup.name.toLowerCase()
                      );
                      const totalKulakanSup = supplierPurchases.reduce((s, p) => s + p.totalAmount, 0);

                      return (
                        <tr key={sup.id} className="hover:bg-canvas/50 transition-colors">
                          <td className="px-4 py-3.5">
                            <div className="font-bold text-ink text-sm flex items-center gap-1.5">
                              <Building2 className="w-4 h-4 text-sage-dark shrink-0" />
                              <span>{sup.name}</span>
                            </div>
                            <div className="text-[11px] text-ink-muted mt-0.5">
                              Terdaftar: {formatDate(sup.createdAt)}
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            {sup.contactPerson && (
                              <div className="font-medium text-ink flex items-center gap-1 text-xs">
                                <UserCheck className="w-3.5 h-3.5 text-ink-muted" />
                                {sup.contactPerson}
                              </div>
                            )}
                            <a
                              href={`tel:${sup.phone}`}
                              className="text-xs text-sage-dark hover:underline flex items-center gap-1 mt-0.5 font-medium"
                            >
                              <Phone className="w-3 h-3" />
                              {sup.phone}
                            </a>
                          </td>
                          <td className="px-4 py-3.5 max-w-xs">
                            {sup.address ? (
                              <div className="text-xs text-ink flex items-start gap-1">
                                <MapPin className="w-3.5 h-3.5 text-ink-muted shrink-0 mt-0.5" />
                                <span className="line-clamp-2">{sup.address}</span>
                              </div>
                            ) : (
                              <span className="text-xs text-ink-muted italic">- Tidak ada alamat -</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 max-w-xs">
                            {sup.notes ? (
                              <p className="text-xs text-ink-muted line-clamp-2">{sup.notes}</p>
                            ) : (
                              <span className="text-xs text-ink-muted italic">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <div className="font-bold text-xs text-ink">
                              {formatIDR(totalKulakanSup)}
                            </div>
                            <div className="text-[11px] text-ink-muted">
                              {supplierPurchases.length} Transaksi
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleOpenCreateModal(sup)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-sage/10 hover:bg-sage/20 text-sage-dark text-xs font-semibold rounded-lg transition-colors"
                                title="Input Kulakan dari Supplier ini"
                              >
                                <ShoppingBag className="w-3.5 h-3.5" />
                                Kulakan
                              </button>
                              <button
                                onClick={() => handleOpenEditSupplier(sup)}
                                className="p-1.5 border border-border hover:bg-canvas text-ink-muted hover:text-ink rounded-lg transition-colors"
                                title="Edit Supplier"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteSupplier(sup)}
                                className="p-1.5 border border-border hover:bg-rose-50 text-ink-muted hover:text-rose-600 rounded-lg transition-colors"
                                title="Hapus Supplier"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: Input Pembelian Baru (Kulakan) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-surface rounded-2xl border border-border shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-scale-up">
            {/* Modal Header */}
            <div className="p-5 border-b border-border flex items-center justify-between bg-canvas/60">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-sage/15 text-sage-dark flex items-center justify-center">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-ink">Input Pembelian Baru (Kulakan)</h3>
                  <p className="text-xs text-ink-muted">
                    Stok barang yang dimasukkan akan langsung bertambah ke persediaan gudang.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-ink-muted hover:text-ink p-1.5 rounded-lg hover:bg-canvas transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleSubmitPurchase} className="flex-1 overflow-y-auto p-5 space-y-5">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Supplier Selection Row */}
              <div className="p-4 bg-canvas/80 border border-border rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-ink">
                    Pilih Supplier / Distributor <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      handleOpenAddSupplier();
                    }}
                    className="inline-flex items-center gap-1 text-xs text-sage-dark hover:underline font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    + Tambah Supplier Baru
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <select
                      value={selectedSupplierId}
                      onChange={handleSupplierSelectChange}
                      className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sage font-medium"
                    >
                      <option value="">-- Pilih dari Data Master Supplier --</option>
                      {suppliers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.phone})
                        </option>
                      ))}
                      <option value="__MANUAL__">-- Ketik Nama Supplier Manual --</option>
                    </select>
                  </div>

                  <div>
                    <input
                      type="text"
                      required
                      placeholder="Nama Supplier / Toko Pemasok"
                      value={supplierName}
                      onChange={(e) => {
                        setSupplierName(e.target.value);
                        if (selectedSupplierId !== '__MANUAL__') {
                          setSelectedSupplierId('__MANUAL__');
                        }
                      }}
                      className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sage"
                    />
                  </div>
                </div>
              </div>

              {/* Invoice Number & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">
                    No. Faktur / Invoice Supplier (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: INV-SUP-2026/001"
                    value={supplierInvoiceNumber}
                    onChange={(e) => setSupplierInvoiceNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sage"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">
                    Tanggal Pembelian
                  </label>
                  <input
                    type="date"
                    required
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sage"
                  />
                </div>
              </div>

              {/* Status and Method */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">
                    Status Pembayaran
                  </label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value as 'PAID' | 'UNPAID')}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sage"
                  >
                    <option value="PAID">LUNAS (Sudah Dibayar)</option>
                    <option value="UNPAID">BELUM LUNAS (Hutang ke Supplier)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">
                    Metode Pembayaran
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sage"
                  >
                    <option value="CASH">Tunai (Cash)</option>
                    <option value="TRANSFER">Transfer Bank</option>
                    <option value="QRIS">QRIS</option>
                    <option value="DEBT">Tempo / Konsinyasi</option>
                  </select>
                </div>
              </div>

              {/* Items Section */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-ink">Daftar Barang Masuk (Kulakan)</h4>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-canvas hover:bg-border text-ink text-xs font-medium rounded-lg border border-border transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5 text-sage-dark" />
                    + Tambah Baris
                  </button>
                </div>

                <div className="space-y-2.5">
                  {items.map((row, idx) => {
                    const selectedProd = products.find((p) => p.id === row.productId);
                    const rowSubtotal = (row.quantity || 0) * (row.costPrice || 0);

                    return (
                      <div
                        key={idx}
                        className="p-3 bg-canvas/60 border border-border rounded-xl grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
                      >
                        {/* Product Selector (5 cols) */}
                        <div className="sm:col-span-5">
                          <label className="block text-[11px] font-medium text-ink-muted mb-0.5">
                            Pilih Produk
                          </label>
                          <select
                            required
                            value={row.productId}
                            onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                            className="w-full px-2.5 py-1.5 border border-border rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-sage font-medium"
                          >
                            <option value="">-- Pilih Barang dari Katalog --</option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} ({p.sku}) - Stok: {p.stock.onHand} {p.unit}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Quantity (2 cols) */}
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-medium text-ink-muted mb-0.5">
                            Qty Masuk {selectedProd ? `(${selectedProd.unit})` : ''}
                          </label>
                          <input
                            type="number"
                            min="1"
                            step="any"
                            required
                            value={row.quantity}
                            onChange={(e) =>
                              handleItemChange(idx, 'quantity', parseFloat(e.target.value) || 0)
                            }
                            className="w-full px-2.5 py-1.5 border border-border rounded-lg text-xs bg-white text-right font-medium focus:outline-none focus:ring-1 focus:ring-sage"
                          />
                        </div>

                        {/* Cost Price / HPP (3 cols) */}
                        <div className="sm:col-span-3">
                          <label className="block text-[11px] font-medium text-ink-muted mb-0.5">
                            Harga Beli Modal (HPP)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            required
                            value={row.costPrice}
                            onChange={(e) =>
                              handleItemChange(idx, 'costPrice', parseFloat(e.target.value) || 0)
                            }
                            className="w-full px-2.5 py-1.5 border border-border rounded-lg text-xs bg-white text-right font-medium focus:outline-none focus:ring-1 focus:ring-sage"
                          />
                        </div>

                        {/* Subtotal & Delete (2 cols) */}
                        <div className="sm:col-span-2 flex items-center justify-between sm:justify-end gap-2 pt-1 sm:pt-4">
                          <div className="text-right">
                            <span className="text-[10px] text-ink-muted sm:hidden block">Subtotal</span>
                            <span className="text-xs font-bold text-ink">
                              {formatIDR(rowSubtotal)}
                            </span>
                          </div>
                          <button
                            type="button"
                            disabled={items.length === 1}
                            onClick={() => handleRemoveItemRow(idx)}
                            className="p-1.5 text-ink-muted hover:text-rose-600 rounded-md transition-colors disabled:opacity-30 disabled:hover:text-ink-muted"
                            title="Hapus Baris"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Catatan Pembelian (Opsional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Keterangan tambahan (misal: kondisi barang, jadwal kirim, nama sopir)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-sage"
                />
              </div>

              {/* Informational Callout */}
              <div className="p-3 bg-sage/10 border border-sage/30 rounded-xl flex items-start gap-2.5 text-xs text-ink">
                <Info className="w-4 h-4 text-sage-dark shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-sage-dark">
                    Efek Otomatis ke Persediaan:
                  </span>{' '}
                  Menyimpan pembelian ini akan langsung menambah stok fisik (onHand) dan stok
                  tersedia (available) dari masing-masing barang yang dipilih, serta memperbarui HPP modalnya.
                </div>
              </div>

              {/* Grand Total Preview */}
              <div className="p-4 bg-canvas border border-border rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs text-ink-muted font-medium">Total Nilai Pembelian:</span>
                  <div className="text-xs text-ink-muted">
                    {items.length} jenis barang, {items.reduce((s, it) => s + (it.quantity || 0), 0)} unit
                  </div>
                </div>
                <div className="text-xl font-extrabold text-sage-dark">
                  {formatIDR(calculateFormTotal())}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-border hover:bg-canvas text-ink text-sm font-medium rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-sage hover:bg-sage-dark text-white text-sm font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Pembelian & Tambah Stok'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Tambah / Edit Supplier */}
      {isSupplierModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-surface rounded-2xl border border-border shadow-xl max-w-lg w-full flex flex-col overflow-hidden animate-scale-up">
            <div className="p-5 border-b border-border flex items-center justify-between bg-canvas/60">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-sage/15 text-sage-dark flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-ink">
                    {editingSupplier ? 'Edit Data Supplier' : 'Tambah Supplier Baru'}
                  </h3>
                  <p className="text-xs text-ink-muted">
                    Informasi distributor atau agen tempat kulakan sembako
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSupplierModalOpen(false)}
                className="text-ink-muted hover:text-ink p-1.5 rounded-lg hover:bg-canvas transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSupplier} className="p-5 space-y-4">
              {supplierFormError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{supplierFormError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Nama Supplier / Perusahaan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: PT Sumber Beras Nusantara"
                  value={supplierForm.name}
                  onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sage"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">
                    Kontak Person / Sales
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Pak Hendro"
                    value={supplierForm.contactPerson}
                    onChange={(e) =>
                      setSupplierForm({ ...supplierForm, contactPerson: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sage"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">
                    No. Telepon / WhatsApp <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="Contoh: 0812-3456-7890"
                    value={supplierForm.phone}
                    onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sage"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Alamat Kantor / Gudang Supplier
                </label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Kawasan Pergudangan Beras Daan Mogot Blok C No. 12"
                  value={supplierForm.address}
                  onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-sage"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Catatan / Produk Komoditas (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Distributor beras ramos & pandan wangi. Min. order 10 sak."
                  value={supplierForm.notes}
                  onChange={(e) => setSupplierForm({ ...supplierForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-sage"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsSupplierModalOpen(false)}
                  className="px-4 py-2 border border-border hover:bg-canvas text-ink text-sm font-medium rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingSupplier}
                  className="px-5 py-2 bg-sage hover:bg-sage-dark text-white text-sm font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50"
                >
                  {isSavingSupplier ? 'Menyimpan...' : 'Simpan Data Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Detail Pembelian */}
      {selectedPurchase && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-surface rounded-2xl border border-border shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-scale-up">
            <div className="p-5 border-b border-border flex items-center justify-between bg-canvas/60">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-sage/15 text-sage-dark flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-ink">
                    Detail Pembelian {selectedPurchase.purchaseNumber}
                  </h3>
                  <p className="text-xs text-ink-muted">
                    Dicatat pada {formatDate(selectedPurchase.purchaseDate)} oleh{' '}
                    <span className="font-semibold text-ink">{selectedPurchase.createdBy}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPurchase(null)}
                className="text-ink-muted hover:text-ink p-1.5 rounded-lg hover:bg-canvas transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-canvas rounded-xl text-xs">
                <div>
                  <span className="text-ink-muted block">Supplier / Pemasok:</span>
                  <span className="font-bold text-ink text-sm block">
                    {selectedPurchase.supplierName}
                  </span>
                  {selectedPurchase.supplierInvoiceNumber && (
                    <span className="text-ink-muted block mt-0.5">
                      No. Faktur: {selectedPurchase.supplierInvoiceNumber}
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-ink-muted block">Status & Metode Pembayaran:</span>
                  <div className="flex items-center gap-2 mt-1">
                    {selectedPurchase.paymentStatus === 'PAID' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        LUNAS
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        <AlertCircle className="w-3 h-3" />
                        HUTANG SUPPLIER
                      </span>
                    )}
                    <span className="font-medium text-ink">({selectedPurchase.paymentMethod})</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-ink uppercase tracking-wider mb-2">
                  Daftar Barang yang Diterima
                </h4>
                <div className="border border-border rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-canvas border-b border-border text-ink-muted font-semibold">
                      <tr>
                        <th className="px-3 py-2">Barang</th>
                        <th className="px-3 py-2 text-right">Jumlah</th>
                        <th className="px-3 py-2 text-right">Harga Satuan</th>
                        <th className="px-3 py-2 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y border-border">
                      {selectedPurchase.items.map((it, idx) => (
                        <tr key={idx} className="hover:bg-canvas/50">
                          <td className="px-3 py-2.5">
                            <div className="font-semibold text-ink">{it.productName}</div>
                            <div className="text-[11px] text-ink-muted">SKU: {it.sku}</div>
                          </td>
                          <td className="px-3 py-2.5 text-right font-medium text-ink">
                            {formatNumber(it.quantity)} {it.unit}
                          </td>
                          <td className="px-3 py-2.5 text-right text-ink">
                            {formatIDR(it.costPrice)}
                          </td>
                          <td className="px-3 py-2.5 text-right font-bold text-ink">
                            {formatIDR(it.subtotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-canvas border-t border-border font-bold text-xs">
                      <tr>
                        <td colSpan={3} className="px-3 py-2.5 text-right text-ink">
                          Total Pembelian:
                        </td>
                        <td className="px-3 py-2.5 text-right text-sage-dark text-sm">
                          {formatIDR(selectedPurchase.totalAmount)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {selectedPurchase.notes && (
                <div className="text-xs p-3 bg-canvas border border-border rounded-lg text-ink">
                  <span className="font-semibold text-ink-muted block mb-0.5">Catatan:</span>
                  {selectedPurchase.notes}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-border bg-canvas/60 flex justify-end">
              <button
                onClick={() => setSelectedPurchase(null)}
                className="px-4 py-2 bg-white border border-border hover:bg-canvas text-ink text-xs font-semibold rounded-lg shadow-xs transition-colors"
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
