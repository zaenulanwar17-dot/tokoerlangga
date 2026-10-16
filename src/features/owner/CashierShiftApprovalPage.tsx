import React, { useState, useEffect } from 'react';
import {
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  User,
  DollarSign,
  Calendar,
  Search,
  Eye,
  Info,
  Check,
  X,
  FileText,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { CashierShiftClosure } from '../../domain/types';
import { cashierShiftRepository } from '../../services';
import { formatIDR, formatDateTime } from '../../domain/money';
import { useDemoAuth } from '../../context/DemoAuthContext';

export const CashierShiftApprovalPage: React.FC = () => {
  const { currentUser } = useDemoAuth();
  const [shifts, setShifts] = useState<CashierShiftClosure[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'PENDING' | 'HISTORY'>('PENDING');
  const [searchQuery, setSearchQuery] = useState('');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Modal Approve / Reject States
  const [selectedShiftForApprove, setSelectedShiftForApprove] = useState<CashierShiftClosure | null>(null);
  const [approveNotes, setApproveNotes] = useState('');
  const [selectedShiftForReject, setSelectedShiftForReject] = useState<CashierShiftClosure | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedShiftDetail, setSelectedShiftDetail] = useState<CashierShiftClosure | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const loadShifts = async () => {
    try {
      setLoading(true);
      const data = await cashierShiftRepository.list();
      setShifts(data);
    } catch (err) {
      console.error('Gagal memuat antrean shift kasir:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShifts();
  }, []);

  const pendingShifts = shifts.filter((s) => s.status === 'PENDING_APPROVAL');
  const historyShifts = shifts.filter((s) => s.status !== 'PENDING_APPROVAL');

  const displayedShifts = (activeTab === 'PENDING' ? pendingShifts : historyShifts).filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      s.shiftNumber.toLowerCase().includes(q) ||
      s.cashierName.toLowerCase().includes(q) ||
      (s.differenceReason && s.differenceReason.toLowerCase().includes(q))
    );
  });

  // Summary Metrics
  const totalPendingCount = pendingShifts.length;
  const totalPhysicalCashToday = shifts.reduce((sum, s) => sum + s.actualPhysicalCash, 0);
  const totalDifferences = shifts.reduce((sum, s) => sum + s.difference, 0);
  const totalApprovedCount = shifts.filter((s) => s.status === 'APPROVED').length;

  const handleApprove = async () => {
    if (!selectedShiftForApprove) return;
    try {
      setIsProcessing(true);
      await cashierShiftRepository.approve(
        selectedShiftForApprove.id,
        currentUser.name,
        approveNotes.trim() || undefined
      );
      setSuccessToast(`Tutup buku shift ${selectedShiftForApprove.shiftNumber} berhasil disetujui.`);
      setTimeout(() => setSuccessToast(null), 5000);
      setSelectedShiftForApprove(null);
      setApproveNotes('');
      await loadShifts();
    } catch (err: any) {
      alert(err?.message || 'Gagal menyetujui shift');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedShiftForReject) return;
    if (!rejectReason.trim()) {
      alert('Alasan penolakan / instruksi hitung ulang wajib diisi');
      return;
    }
    try {
      setIsProcessing(true);
      await cashierShiftRepository.reject(
        selectedShiftForReject.id,
        currentUser.name,
        rejectReason.trim()
      );
      setSuccessToast(`Tutup buku shift ${selectedShiftForReject.shiftNumber} ditolak untuk hitung ulang.`);
      setTimeout(() => setSuccessToast(null), 5000);
      setSelectedShiftForReject(null);
      setRejectReason('');
      await loadShifts();
    } catch (err: any) {
      alert(err?.message || 'Gagal menolak shift');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2.5 text-sage-dark">
            <ClipboardCheck className="w-8 h-8" />
            <h1 className="text-2xl font-bold tracking-tight text-ink">
              Persetujuan Kasir Tutup Buku
            </h1>
          </div>
          <p className="text-sm text-ink-muted mt-1">
            Verifikasi dan otorisasi laporan penutupan kasir toko. Periksa uang fisik laci kasir, selisih kas, dan alasan selisih sebelum buku kasir ditutup resmi.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5" />
            {totalPendingCount} Menunggu Persetujuan Owner
          </span>
        </div>
      </div>

      {/* Success Notification */}
      {successToast && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm shadow-sm animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="font-semibold">{successToast}</p>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface p-4 rounded-xl border border-border shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-ink-muted font-medium">Antrean Menunggu</p>
            <p className="text-lg font-bold text-ink">{totalPendingCount} Laporan</p>
          </div>
        </div>

        <div className="bg-surface p-4 rounded-xl border border-border shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-ink-muted font-medium">Total Uang Fisik Disetor</p>
            <p className="text-lg font-bold text-ink">{formatIDR(totalPhysicalCashToday)}</p>
          </div>
        </div>

        <div className="bg-surface p-4 rounded-xl border border-border shadow-xs flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
              totalDifferences < 0
                ? 'bg-rose-50 text-rose-600'
                : totalDifferences > 0
                ? 'bg-blue-50 text-blue-600'
                : 'bg-emerald-50 text-emerald-600'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-ink-muted font-medium">Net Akumulasi Selisih</p>
            <p
              className={`text-lg font-bold ${
                totalDifferences < 0
                  ? 'text-rose-600'
                  : totalDifferences > 0
                  ? 'text-blue-600'
                  : 'text-emerald-600'
              }`}
            >
              {totalDifferences === 0
                ? 'Rp 0 (Cocok)'
                : totalDifferences > 0
                ? `+${formatIDR(totalDifferences)}`
                : formatIDR(totalDifferences)}
            </p>
          </div>
        </div>

        <div className="bg-surface p-4 rounded-xl border border-border shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-sage/15 text-sage-dark flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-ink-muted font-medium">Shift Telah Disetujui</p>
            <p className="text-lg font-bold text-ink">{totalApprovedCount} Shift</p>
          </div>
        </div>
      </div>

      {/* Tabs Switcher & Search Filter */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between border-b border-border pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('PENDING')}
            className={`pb-2.5 px-3.5 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'PENDING'
                ? 'border-sage text-sage-dark'
                : 'border-transparent text-ink-muted hover:text-ink hover:border-border'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Menunggu Persetujuan Owner</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                pendingShifts.length > 0
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-canvas text-ink-muted'
              }`}
            >
              {pendingShifts.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`pb-2.5 px-3.5 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'HISTORY'
                ? 'border-sage text-sage-dark'
                : 'border-transparent text-ink-muted hover:text-ink hover:border-border'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Riwayat Tutup Buku</span>
            <span className="px-2 py-0.5 rounded-full text-xs bg-canvas text-ink font-semibold border border-border">
              {historyShifts.length}
            </span>
          </button>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari No. Shift, nama kasir, alasan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-border rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-sage"
          />
        </div>
      </div>

      {/* Shifts List / Table */}
      <div className="bg-surface rounded-xl border border-border shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-ink-muted text-sm">Memuat daftar rekonsiliasi kasir...</div>
        ) : displayedShifts.length === 0 ? (
          <div className="p-12 text-center">
            <ClipboardCheck className="w-12 h-12 text-ink-muted mx-auto mb-3 opacity-40" />
            <h3 className="text-base font-semibold text-ink">
              {activeTab === 'PENDING'
                ? 'Tidak ada laporan shift kasir yang menunggu persetujuan'
                : 'Belum ada riwayat tutup buku kasir'}
            </h3>
            <p className="text-xs text-ink-muted mt-1 max-w-sm mx-auto">
              {activeTab === 'PENDING'
                ? 'Semua laporan penutupan kasir dari kasir toko telah disetujui atau belum ada kasir yang mengajukan tutup buku hari ini.'
                : 'Riwayat persetujuan atau penolakan shift kasir akan tampil di sini.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-canvas border-b border-border text-ink-muted font-medium text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">No. Shift & Kasir</th>
                  <th className="px-4 py-3">Waktu Shift</th>
                  <th className="px-4 py-3 text-right">Kas Sistem</th>
                  <th className="px-4 py-3 text-right">Uang Fisik Laci</th>
                  <th className="px-4 py-3 text-center">Selisih</th>
                  <th className="px-4 py-3">Alasan & Catatan Kasir</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center">Aksi Owner</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {displayedShifts.map((shift) => {
                  const hasDifference = shift.difference !== 0;

                  return (
                    <tr key={shift.id} className="hover:bg-canvas/50 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-ink">{shift.shiftNumber}</div>
                        <div className="text-xs text-ink-muted flex items-center gap-1 mt-0.5 font-medium">
                          <User className="w-3.5 h-3.5 text-sage-dark" />
                          <span>{shift.cashierName}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-xs text-ink-muted">
                        <div className="flex items-center gap-1 text-ink font-medium">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDateTime(shift.endTime)}
                        </div>
                        <div className="text-[11px] text-ink-muted mt-0.5">
                          Buka: {formatDateTime(shift.startTime)}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-right font-medium text-ink">
                        <div>{formatIDR(shift.totalSystemCash)}</div>
                        <div className="text-[11px] text-ink-muted">
                          Modal: {formatIDR(shift.initialCash)} + Tunai: {formatIDR(shift.systemCashSales)}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-right font-bold text-ink">
                        {formatIDR(shift.actualPhysicalCash)}
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        {!hasDifference ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Check className="w-3 h-3" />
                            Cocok (Rp 0)
                          </span>
                        ) : shift.difference < 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertTriangle className="w-3 h-3" />
                            Kurang {formatIDR(Math.abs(shift.difference))}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            <ArrowRight className="w-3 h-3" />
                            Lebih +{formatIDR(shift.difference)}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 max-w-xs">
                        {hasDifference && shift.differenceReason ? (
                          <div>
                            <span className="inline-block text-xs font-semibold text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 mb-0.5">
                              {shift.differenceReason}
                            </span>
                            {shift.differenceNotes && (
                              <p className="text-[11px] text-ink-muted italic line-clamp-2">
                                "{shift.differenceNotes}"
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-ink-muted italic">- Tidak ada selisih -</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        {shift.status === 'PENDING_APPROVAL' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3 h-3" />
                            Menunggu Persetujuan
                          </span>
                        )}
                        {shift.status === 'APPROVED' && (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              Disetujui
                            </span>
                            <div className="text-[10px] text-ink-muted mt-0.5">
                              Oleh {shift.reviewedBy}
                            </div>
                          </div>
                        )}
                        {shift.status === 'REJECTED' && (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                              <XCircle className="w-3 h-3" />
                              Ditolak (Hitung Ulang)
                            </span>
                            {shift.reviewNotes && (
                              <div className="text-[10px] text-rose-600 mt-0.5 truncate max-w-[120px]">
                                "{shift.reviewNotes}"
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {shift.status === 'PENDING_APPROVAL' ? (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedShiftForApprove(shift);
                                  setApproveNotes('');
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                                title="Setujui Tutup Buku"
                              >
                                <Check className="w-3.5 h-3.5" />
                                Setujui
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedShiftForReject(shift);
                                  setRejectReason('');
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition-colors"
                                title="Tolak / Hitung Ulang"
                              >
                                <X className="w-3.5 h-3.5" />
                                Tolak
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => setSelectedShiftDetail(shift)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 border border-border hover:bg-canvas text-ink text-xs font-medium rounded-lg transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5 text-ink-muted" />
                              Detail
                            </button>
                          )}
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

      {/* MODAL: Konfirmasi Persetujuan Owner */}
      {selectedShiftForApprove && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl border border-border shadow-xl max-w-md w-full p-6 space-y-4 animate-scale-up">
            <div className="flex items-center gap-3 text-emerald-600">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-ink">Setujui Tutup Buku Kasir</h3>
                <p className="text-xs text-ink-muted">{selectedShiftForApprove.shiftNumber}</p>
              </div>
            </div>

            <div className="p-3.5 bg-canvas rounded-xl text-xs space-y-2 border border-border">
              <div className="flex justify-between">
                <span className="text-ink-muted">Kasir Bertugas:</span>
                <span className="font-bold text-ink">{selectedShiftForApprove.cashierName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">Kas Seharusnya Sistem:</span>
                <span className="font-semibold text-ink">
                  {formatIDR(selectedShiftForApprove.totalSystemCash)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">Uang Fisik di Laci:</span>
                <span className="font-bold text-emerald-700">
                  {formatIDR(selectedShiftForApprove.actualPhysicalCash)}
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-border">
                <span className="text-ink-muted">Selisih Kas:</span>
                <span
                  className={`font-bold ${
                    selectedShiftForApprove.difference === 0
                      ? 'text-emerald-600'
                      : selectedShiftForApprove.difference < 0
                      ? 'text-rose-600'
                      : 'text-blue-600'
                  }`}
                >
                  {selectedShiftForApprove.difference === 0
                    ? 'Rp 0 (Cocok)'
                    : formatIDR(selectedShiftForApprove.difference)}
                </span>
              </div>
              {selectedShiftForApprove.differenceReason && (
                <div className="pt-1 text-[11px] text-ink-muted">
                  <span className="font-semibold block text-ink">Alasan Kasir:</span>
                  {selectedShiftForApprove.differenceReason}
                  {selectedShiftForApprove.differenceNotes && (
                    <span className="italic block mt-0.5">"{selectedShiftForApprove.differenceNotes}"</span>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                Catatan Persetujuan Owner (Opsional)
              </label>
              <textarea
                rows={2}
                placeholder="Misal: Sudah dicek laci fisik, selisih disetujui/diikhlaskan."
                value={approveNotes}
                onChange={(e) => setApproveNotes(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setSelectedShiftForApprove(null)}
                className="px-4 py-2 border border-border hover:bg-canvas text-ink text-xs font-semibold rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleApprove}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50"
              >
                {isProcessing ? 'Menyetujui...' : 'Ya, Setujui Tutup Buku'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Penolakan / Minta Hitung Ulang */}
      {selectedShiftForReject && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl border border-border shadow-xl max-w-md w-full p-6 space-y-4 animate-scale-up">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-ink">Tolak / Minta Hitung Ulang Laci</h3>
                <p className="text-xs text-ink-muted">{selectedShiftForReject.shiftNumber}</p>
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <p>
                Menolak laporan ini akan meminta kasir ({selectedShiftForReject.cashierName}) menghitung ulang uang fisik atau memeriksa kembali struk transaksi yang belum terinput.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                Instruksi / Alasan Penolakan Owner <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                placeholder="Misal: Selisih terlalu besar, tolong hitung ulang uang receh di bawah laci atau periksa nota kasbon."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setSelectedShiftForReject(null)}
                className="px-4 py-2 border border-border hover:bg-canvas text-ink text-xs font-semibold rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleReject}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50"
              >
                {isProcessing ? 'Memproses...' : 'Tolak & Kembalikan ke Kasir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Detail Riwayat Tutup Buku */}
      {selectedShiftDetail && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl border border-border shadow-xl max-w-lg w-full p-6 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-sage-dark" />
                <h3 className="text-base font-bold text-ink">
                  Detail Rekonsiliasi {selectedShiftDetail.shiftNumber}
                </h3>
              </div>
              <button
                onClick={() => setSelectedShiftDetail(null)}
                className="text-ink-muted hover:text-ink p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-canvas rounded-xl">
                <div>
                  <span className="text-ink-muted block">Kasir Bertugas:</span>
                  <span className="font-bold text-ink">{selectedShiftDetail.cashierName}</span>
                </div>
                <div>
                  <span className="text-ink-muted block">Status:</span>
                  <span
                    className={`font-bold inline-flex items-center gap-1 ${
                      selectedShiftDetail.status === 'APPROVED'
                        ? 'text-emerald-700'
                        : selectedShiftDetail.status === 'REJECTED'
                        ? 'text-rose-700'
                        : 'text-amber-700'
                    }`}
                  >
                    {selectedShiftDetail.status === 'APPROVED'
                      ? '✓ Disetujui'
                      : selectedShiftDetail.status === 'REJECTED'
                      ? '✕ Ditolak'
                      : '⏳ Menunggu'}
                  </span>
                </div>
                <div>
                  <span className="text-ink-muted block">Waktu Mulai:</span>
                  <span className="text-ink">{formatDateTime(selectedShiftDetail.startTime)}</span>
                </div>
                <div>
                  <span className="text-ink-muted block">Waktu Tutup:</span>
                  <span className="text-ink">{formatDateTime(selectedShiftDetail.endTime)}</span>
                </div>
              </div>

              <div className="p-3 bg-canvas rounded-xl space-y-2">
                <div className="flex justify-between">
                  <span className="text-ink-muted">Modal Kas Awal:</span>
                  <span className="font-semibold text-ink">{formatIDR(selectedShiftDetail.initialCash)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-muted">Penjualan Tunai Kasir:</span>
                  <span className="font-semibold text-ink">
                    {formatIDR(selectedShiftDetail.systemCashSales)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-muted">Penjualan Non-Tunai:</span>
                  <span className="font-semibold text-ink">
                    {formatIDR(selectedShiftDetail.systemNonCashSales)}
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-border">
                  <span className="font-semibold text-ink">Total Kas Sistem di Laci:</span>
                  <span className="font-bold text-ink">
                    {formatIDR(selectedShiftDetail.totalSystemCash)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-ink">Uang Fisik Dihitung:</span>
                  <span className="font-extrabold text-sage-dark text-sm">
                    {formatIDR(selectedShiftDetail.actualPhysicalCash)}
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-border">
                  <span className="font-semibold text-ink">Selisih Kas:</span>
                  <span
                    className={`font-bold ${
                      selectedShiftDetail.difference === 0
                        ? 'text-emerald-600'
                        : selectedShiftDetail.difference < 0
                        ? 'text-rose-600'
                        : 'text-blue-600'
                    }`}
                  >
                    {selectedShiftDetail.difference === 0
                      ? 'Cocok (Rp 0)'
                      : formatIDR(selectedShiftDetail.difference)}
                  </span>
                </div>
              </div>

              {selectedShiftDetail.differenceReason && (
                <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl space-y-1">
                  <span className="font-semibold text-rose-800 block">Alasan Selisih Kasir:</span>
                  <p className="text-ink font-medium">{selectedShiftDetail.differenceReason}</p>
                  {selectedShiftDetail.differenceNotes && (
                    <p className="text-ink-muted italic">"{selectedShiftDetail.differenceNotes}"</p>
                  )}
                </div>
              )}

              {selectedShiftDetail.reviewedBy && (
                <div className="p-3 bg-canvas border border-border rounded-xl space-y-1">
                  <span className="font-semibold text-ink block">
                    Review Oleh: {selectedShiftDetail.reviewedBy} (
                    {formatDateTime(selectedShiftDetail.reviewedAt || '')})
                  </span>
                  {selectedShiftDetail.reviewNotes && (
                    <p className="text-ink-muted italic">"{selectedShiftDetail.reviewNotes}"</p>
                  )}
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end border-t border-border">
              <button
                onClick={() => setSelectedShiftDetail(null)}
                className="px-4 py-2 bg-canvas border border-border hover:bg-border text-ink text-xs font-semibold rounded-lg"
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
