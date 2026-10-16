import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Search,
  X,
  Upload,
  Download,
  Users,
  History,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { Receivable, PaymentMethod, Customer } from '../../domain/types';
import { receivableRepository, customerRepository } from '../../services';
import { formatIDR, formatDateTime } from '../../domain/money';
import { useToast } from '../../context/ToastContext';
import { PriceTierBadge } from '../../components/ui/PriceTierBadge';
import {
  downloadCustomerExcelTemplate,
  parseCustomerExcelFile,
} from '../../utils/excelImport';

export const ReceivablesPage: React.FC = () => {
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'CUSTOMERS' | 'TRANSACTIONS'>('CUSTOMERS');
  const [searchQuery, setSearchQuery] = useState('');

  // Settle Customer Debt Modal
  const [selectedCustomerForPayment, setSelectedCustomerForPayment] = useState<Customer | null>(null);
  const [settleAmount, setSettleAmount] = useState<number>(0);
  const [settleMethod, setSettleMethod] = useState<PaymentMethod>('CASH');
  const [settleNote, setSettleNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Customer Mutation History Modal
  const [viewHistoryCustomer, setViewHistoryCustomer] = useState<Customer | null>(null);

  // Excel Import Modal
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importedRows, setImportedRows] = useState<Omit<Customer, 'id'>[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const { showToast } = useToast();

  const loadData = async () => {
    setLoading(true);
    const [rcvData, custList] = await Promise.all([
      receivableRepository.list(),
      customerRepository.list(),
    ]);
    setReceivables(rcvData);
    setCustomers(custList);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const openSettleModal = (cust: Customer) => {
    setSelectedCustomerForPayment(cust);
    setSettleAmount(cust.currentDebt); // default bayar lunas penuh
    setSettleMethod('CASH');
    setSettleNote('Pembayaran cicilan / pelunasan piutang');
  };

  const handleSettlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerForPayment) return;

    if (settleAmount <= 0) {
      showToast('Nominal pembayaran harus lebih dari 0.', 'error');
      return;
    }
    if (settleAmount > selectedCustomerForPayment.currentDebt) {
      showToast(
        `Nominal melebihi total saldo piutang (${formatIDR(selectedCustomerForPayment.currentDebt)}).`,
        'error'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await receivableRepository.settleCustomerDebt(
        selectedCustomerForPayment.id,
        settleAmount,
        settleMethod,
        settleNote
      );
      showToast(
        `Pembayaran ${formatIDR(settleAmount)} untuk ${selectedCustomerForPayment.name} berhasil dicatat!`,
        'success'
      );
      setSelectedCustomerForPayment(null);
      await loadData();
    } catch {
      showToast('Gagal memproses pembayaran piutang.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Excel File Selected
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    setIsParsing(true);
    setImportErrors([]);

    try {
      const result = await parseCustomerExcelFile(file);
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

  // Confirm Excel Import
  const handleConfirmImport = async () => {
    if (importedRows.length === 0) {
      showToast('Tidak ada data pelanggan yang valid untuk diimport.', 'error');
      return;
    }

    setIsImporting(true);
    try {
      await customerRepository.bulkCreate(importedRows);
      const totalInitialDebt = importedRows.reduce((sum, r) => sum + r.currentDebt, 0);

      showToast(
        `Berhasil mengimport ${importedRows.length} pelanggan baru! (Total piutang migrasi: ${formatIDR(
          totalInitialDebt
        )})`,
        'success'
      );
      setIsImportModalOpen(false);
      setImportFile(null);
      setImportedRows([]);
      setImportErrors([]);
      await loadData();
    } catch {
      showToast('Gagal memproses import data pelanggan.', 'error');
    } finally {
      setIsImporting(false);
    }
  };

  // Total outstanding debt across all customers
  const totalOutstanding = customers.reduce((sum, c) => sum + (c.currentDebt || 0), 0);
  const debtorCustomers = customers.filter((c) => (c.currentDebt || 0) > 0);

  // Filter customers with debt or matching search
  const filteredCustomers = customers
    .filter((c) => c.id !== 'cust_umum')
    .filter((c) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.address && c.address.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => (b.currentDebt || 0) - (a.currentDebt || 0));

  // Filter transactions
  const filteredReceivables = receivables.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      r.customerName.toLowerCase().includes(q) ||
      r.orderNumber.toLowerCase().includes(q) ||
      r.customerPhone.includes(q)
    );
  });

  // Receivables for selected history customer
  const customerHistoryReceivables = viewHistoryCustomer
    ? receivables.filter((r) => r.customerId === viewHistoryCustomer.id)
    : [];

  return (
    <div className="space-y-6">
      {/* Header & KPI Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-ink">Buku Piutang & Kredit Pelanggan</h1>
          <p className="text-xs sm:text-sm text-muted">
            Pencatatan saldo piutang akumulatif tanpa jatuh tempo & import migrasi dari Excel
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* KPI Summary Badge */}
          <div className="p-3 bg-surface rounded-xl border border-border shadow-xs flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-50 text-danger">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-muted block">Total Piutang Berjalan ({debtorCustomers.length} Pelanggan):</span>
              <span className="text-base font-extrabold text-danger tabular-nums">
                {formatIDR(totalOutstanding)}
              </span>
            </div>
          </div>

          {/* Import Button */}
          <button
            type="button"
            onClick={() => {
              setImportFile(null);
              setImportedRows([]);
              setImportErrors([]);
              setIsImportModalOpen(true);
            }}
            className="px-3.5 py-2.5 rounded-xl bg-sage-500 hover:bg-sage-600 text-white font-semibold text-xs shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span>Import Pelanggan & Piutang</span>
          </button>
        </div>
      </div>

      {/* Tabs & Search Toolbar */}
      <div className="bg-surface p-4 rounded-xl border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b sm:border-b-0 border-border pb-2 sm:pb-0">
          <button
            type="button"
            onClick={() => setActiveTab('CUSTOMERS')}
            className={`px-3 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors ${
              activeTab === 'CUSTOMERS'
                ? 'bg-magenta-50 text-magenta-700 border border-magenta-200'
                : 'text-muted hover:text-ink hover:bg-canvas'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Saldo Akumulatif Pelanggan ({debtorCustomers.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('TRANSACTIONS')}
            className={`px-3 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors ${
              activeTab === 'TRANSACTIONS'
                ? 'bg-magenta-50 text-magenta-700 border border-magenta-200'
                : 'text-muted hover:text-ink hover:bg-canvas'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Riwayat Transaksi Piutang ({receivables.length})</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:max-w-xs">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari pelanggan, no telp, nota..."
            className="w-full pl-8 pr-3 py-2 bg-canvas border border-border rounded-lg text-ink focus:ring-2 focus:ring-sage-500"
          />
          <Search className="w-4 h-4 text-muted absolute left-2.5 top-2.5 pointer-events-none" />
        </div>
      </div>

      {/* TAB 1: Saldo Akumulatif per Pelanggan */}
      {activeTab === 'CUSTOMERS' && (
        <div className="bg-surface rounded-xl border border-border shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-canvas border-b border-border text-muted uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Nama Pelanggan</th>
                  <th className="py-3 px-4">Kontak & Alamat</th>
                  <th className="py-3 px-4 text-center">Tier Harga</th>
                  <th className="py-3 px-4 text-right">Limit Kredit</th>
                  <th className="py-3 px-4 text-right">Saldo Piutang Berjalan</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-muted">
                      Memuat data pelanggan dan piutang...
                    </td>
                  </tr>
                ) : filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-muted">
                      Tidak ada data pelanggan yang sesuai pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((cust) => {
                    const hasDebt = cust.currentDebt > 0;
                    const exceedsLimit = cust.creditLimit > 0 && cust.currentDebt > cust.creditLimit;

                    return (
                      <tr key={cust.id} className="hover:bg-canvas/50">
                        <td className="py-3 px-4">
                          <p className="font-bold text-ink text-sm">{cust.name}</p>
                          {cust.notes && <p className="text-[11px] text-muted italic">{cust.notes}</p>}
                        </td>
                        <td className="py-3 px-4 text-muted">
                          <p className="font-medium text-ink">Telp: {cust.phone || '-'}</p>
                          <p className="text-[11px] truncate max-w-[200px]">{cust.address || '-'}</p>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <PriceTierBadge tier={cust.tier} size="sm" />
                        </td>
                        <td className="py-3 px-4 text-right font-medium tabular-nums text-muted">
                          {formatIDR(cust.creditLimit)}
                        </td>
                        <td className="py-3 px-4 text-right tabular-nums">
                          <span
                            className={`text-sm font-extrabold ${
                              hasDebt ? 'text-danger' : 'text-success'
                            }`}
                          >
                            {formatIDR(cust.currentDebt)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                              hasDebt
                                ? exceedsLimit
                                  ? 'bg-red-50 text-danger border border-red-200'
                                  : 'bg-amber-50 text-warning border border-amber-200'
                                : 'bg-emerald-50 text-success border border-emerald-200'
                            }`}
                          >
                            {hasDebt ? (exceedsLimit ? 'Over Limit' : 'Ada Hutang') : 'Lunas (Nol)'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                          {hasDebt && (
                            <button
                              type="button"
                              onClick={() => openSettleModal(cust)}
                              className="px-3 py-1.5 rounded-lg bg-magenta-500 hover:bg-magenta-700 text-white font-semibold text-xs shadow-xs transition-colors"
                            >
                              Catat Bayar
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setViewHistoryCustomer(cust)}
                            className="px-2.5 py-1.5 rounded-lg border border-border text-ink hover:bg-canvas font-medium text-xs transition-colors"
                          >
                            Mutasi
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Riwayat Transaksi Piutang */}
      {activeTab === 'TRANSACTIONS' && (
        <div className="bg-surface rounded-xl border border-border shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-canvas border-b border-border text-muted uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Tanggal & Nota</th>
                  <th className="py-3 px-4">Pelanggan</th>
                  <th className="py-3 px-4 text-right">Total Tagihan</th>
                  <th className="py-3 px-4 text-right">Sisa Piutang</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">Keterangan / Cicilan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-muted">
                      Memuat riwayat transaksi...
                    </td>
                  </tr>
                ) : filteredReceivables.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-muted">
                      Tidak ada catatan transaksi piutang.
                    </td>
                  </tr>
                ) : (
                  filteredReceivables.map((rcv) => {
                    return (
                      <tr key={rcv.id} className="hover:bg-canvas/50">
                        <td className="py-3 px-4">
                          <p className="font-mono font-bold text-ink">{rcv.orderNumber}</p>
                          <p className="text-[11px] text-muted">{formatDateTime(rcv.createdAt)}</p>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-bold text-ink">{rcv.customerName}</p>
                          <p className="text-[11px] text-muted">Telp: {rcv.customerPhone}</p>
                        </td>
                        <td className="py-3 px-4 text-right font-medium tabular-nums text-muted">
                          {formatIDR(rcv.totalAmount)}
                        </td>
                        <td className="py-3 px-4 text-right font-extrabold tabular-nums text-danger text-sm">
                          {formatIDR(rcv.remainingAmount)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                              rcv.status === 'PAID'
                                ? 'bg-emerald-50 text-success border border-emerald-200'
                                : rcv.status === 'PARTIAL'
                                ? 'bg-amber-50 text-warning border border-amber-200'
                                : 'bg-red-50 text-danger border border-red-200'
                            }`}
                          >
                            {rcv.status === 'PAID'
                              ? 'Lunas'
                              : rcv.status === 'PARTIAL'
                              ? 'Cicilan Sebagian'
                              : 'Belum Lunas'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[11px] text-muted">
                          {rcv.payments && rcv.payments.length > 0 ? (
                            <span>
                              {rcv.payments.length}x pembayaran cicilan (Total terbayar:{' '}
                              {formatIDR(rcv.totalAmount - rcv.remainingAmount)})
                            </span>
                          ) : (
                            <span>{rcv.notes || 'Belum ada pembayaran'}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Settle Customer Debt Modal */}
      {selectedCustomerForPayment && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-xs"
        >
          <div className="bg-surface rounded-2xl border border-border shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-base font-bold text-ink">Catat Pembayaran Piutang</h3>
                <p className="text-xs text-muted">
                  Pembayaran akan memotong saldo piutang berjalan pelanggan
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCustomerForPayment(null)}
                className="text-muted hover:text-ink p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSettlePayment} className="space-y-4 text-xs">
              {/* Customer summary */}
              <div className="p-3 bg-canvas rounded-xl border border-border space-y-1">
                <p className="font-bold text-ink text-sm">{selectedCustomerForPayment.name}</p>
                <p className="text-[11px] text-muted">Telp: {selectedCustomerForPayment.phone}</p>
                <div className="flex justify-between pt-1 border-t border-border mt-1">
                  <span className="text-muted">Total Saldo Piutang:</span>
                  <span className="font-extrabold text-danger text-sm tabular-nums">
                    {formatIDR(selectedCustomerForPayment.currentDebt)}
                  </span>
                </div>
              </div>

              {/* Amount input */}
              <div className="space-y-1">
                <label className="font-semibold text-ink block">
                  Nominal Pembayaran (Rp) <span className="text-danger">*</span>:
                </label>
                <input
                  type="number"
                  min={1}
                  max={selectedCustomerForPayment.currentDebt}
                  value={settleAmount || ''}
                  onChange={(e) => setSettleAmount(Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder="0"
                  className="w-full px-3 py-2 bg-canvas border border-border rounded-lg text-ink font-bold text-base focus:ring-2 focus:ring-magenta-500 tabular-nums"
                  required
                />
                <div className="flex items-center justify-between text-[11px] text-muted pt-1">
                  <span>Sisa setelah pembayaran:</span>
                  <span className="font-semibold text-ink tabular-nums">
                    {formatIDR(Math.max(0, selectedCustomerForPayment.currentDebt - settleAmount))}
                  </span>
                </div>
              </div>

              {/* Quick Pay Buttons */}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSettleAmount(selectedCustomerForPayment.currentDebt)}
                  className="px-2.5 py-1 rounded-md bg-canvas border border-border font-semibold hover:bg-surface text-ink text-[11px]"
                >
                  Bayar Lunas Penuh
                </button>
                {selectedCustomerForPayment.currentDebt > 100000 && (
                  <button
                    type="button"
                    onClick={() => setSettleAmount(Math.floor(selectedCustomerForPayment.currentDebt / 2))}
                    className="px-2.5 py-1 rounded-md bg-canvas border border-border font-semibold hover:bg-surface text-ink text-[11px]"
                  >
                    Bayar 50%
                  </button>
                )}
              </div>

              {/* Payment Method */}
              <div className="space-y-1">
                <label className="font-semibold text-ink block">Metode Pembayaran:</label>
                <select
                  value={settleMethod}
                  onChange={(e) => setSettleMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-2 bg-canvas border border-border rounded-lg text-ink focus:ring-2 focus:ring-magenta-500"
                >
                  <option value="CASH">Tunai (Cash)</option>
                  <option value="BANK_TRANSFER_MANUAL">Transfer Bank</option>
                  <option value="PAYMENT_GATEWAY">QRIS / Non-Tunai</option>
                </select>
              </div>

              {/* Note */}
              <div className="space-y-1">
                <label className="font-semibold text-ink block">Catatan Pembayaran (Opsional):</label>
                <input
                  type="text"
                  value={settleNote}
                  onChange={(e) => setSettleNote(e.target.value)}
                  placeholder="Contoh: Cicilan mingguan, transfer via BCA"
                  className="w-full px-3 py-2 bg-canvas border border-border rounded-lg text-ink focus:ring-2 focus:ring-magenta-500"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-border flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedCustomerForPayment(null)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg border border-border text-ink hover:bg-canvas"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || settleAmount <= 0}
                  className="px-4 py-2 text-xs font-bold rounded-lg bg-magenta-500 hover:bg-magenta-700 text-white shadow-xs disabled:opacity-40 transition-colors"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Pembayaran'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Mutation History Modal */}
      {viewHistoryCustomer && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-xs"
        >
          <div className="bg-surface rounded-2xl border border-border shadow-2xl max-w-xl w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-base font-bold text-ink">Riwayat Mutasi Piutang</h3>
                <p className="text-xs text-muted">
                  Pelanggan: <span className="font-semibold text-ink">{viewHistoryCustomer.name}</span> (Saldo Saat Ini:{' '}
                  <span className="font-extrabold text-danger">{formatIDR(viewHistoryCustomer.currentDebt)}</span>)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewHistoryCustomer(null)}
                className="text-muted hover:text-ink p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto space-y-3 text-xs pr-1">
              {customerHistoryReceivables.length === 0 ? (
                <p className="text-center py-6 text-muted">Belum ada riwayat nota transaksi berhutang.</p>
              ) : (
                customerHistoryReceivables.map((rcv) => (
                  <div key={rcv.id} className="p-3 bg-canvas rounded-xl border border-border space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-ink">{rcv.orderNumber}</span>
                      <span className="text-[11px] text-muted">{formatDateTime(rcv.createdAt)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span>Total Tagihan: {formatIDR(rcv.totalAmount)}</span>
                      <span className="font-bold text-danger">Sisa: {formatIDR(rcv.remainingAmount)}</span>
                    </div>

                    {/* Payments history */}
                    {rcv.payments && rcv.payments.length > 0 && (
                      <div className="pt-2 border-t border-border/80 space-y-1">
                        <span className="text-[11px] font-semibold text-muted block">Riwayat Cicilan Masuk:</span>
                        {rcv.payments.map((p) => (
                          <div key={p.id} className="flex justify-between text-[11px] text-emerald-700 bg-emerald-50/60 px-2 py-0.5 rounded">
                            <span>{formatDateTime(p.paymentDate)} ({p.paymentMethod})</span>
                            <span className="font-bold tabular-nums">+{formatIDR(p.amount)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-border flex justify-end">
              <button
                type="button"
                onClick={() => setViewHistoryCustomer(null)}
                className="px-4 py-2 text-xs font-semibold rounded-lg border border-border text-ink hover:bg-canvas"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Excel Import Pelanggan & Piutang Modal */}
      {isImportModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-xs"
        >
          <div className="bg-surface rounded-2xl border border-border shadow-2xl max-w-2xl w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-base font-bold text-ink">Import Pelanggan & Saldo Piutang Awal (Excel)</h3>
                <p className="text-xs text-muted">
                  Migrasikan data pelanggan lama beserta saldo hutangnya langsung ke sistem baru
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
                  Format Template Excel (.xlsx / .csv)
                </span>
                <p className="text-muted text-[11px]">
                  Gunakan format kolom baku: nama_pelanggan, no_telepon, alamat, tier_harga, limit_kredit, saldo_piutang_awal, catatan
                </p>
              </div>
              <button
                type="button"
                onClick={downloadCustomerExcelTemplate}
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
                id="excel-customer-upload"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="excel-customer-upload"
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
                    Klik di sini untuk mengunggah berkas data pelanggan
                  </span>
                </div>
              </label>
            </div>

            {/* Parsing Indicator / Error List */}
            {isParsing && (
              <p className="text-center text-xs text-muted">Sedang membaca dan menganalisis berkas Excel...</p>
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
                    {importedRows.length} Pelanggan siap diimport
                  </span>
                  <span className="text-danger">
                    Total Piutang Awal: {formatIDR(importedRows.reduce((sum, r) => sum + r.currentDebt, 0))}
                  </span>
                </div>

                <div className="max-h-48 overflow-y-auto rounded-lg border border-border text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-canvas border-b border-border text-[11px] text-muted uppercase font-semibold sticky top-0">
                      <tr>
                        <th className="py-2 px-3">Nama</th>
                        <th className="py-2 px-3">No. Telp</th>
                        <th className="py-2 px-3 text-center">Tier</th>
                        <th className="py-2 px-3 text-right">Saldo Piutang Awal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {importedRows.map((r, i) => (
                        <tr key={i} className="hover:bg-canvas/40">
                          <td className="py-2 px-3 font-semibold text-ink">{r.name}</td>
                          <td className="py-2 px-3 text-muted">{r.phone}</td>
                          <td className="py-2 px-3 text-center">
                            <PriceTierBadge tier={r.tier} size="sm" />
                          </td>
                          <td className="py-2 px-3 text-right font-bold text-danger tabular-nums">
                            {formatIDR(r.currentDebt)}
                          </td>
                        </tr>
                      ))}
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
                {isImporting ? 'Mengimport...' : `Konfirmasi & Import (${importedRows.length} Pelanggan)`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
