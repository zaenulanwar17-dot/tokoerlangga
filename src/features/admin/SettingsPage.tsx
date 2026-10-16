import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Store,
  Clock,
  RotateCcw,
  AlertTriangle,
  Save,
  Printer,
  Sparkles,
  ExternalLink,
  ShoppingBag,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  XCircle,
  Shield,
  User,
  Lock,
  X,
  FileCheck,
} from 'lucide-react';
import { useDemoAuth } from '../../context/DemoAuthContext';
import { useStoreSettings } from '../../context/StoreSettingsContext';
import { resetDemoData } from '../../services';
import { useToast } from '../../context/ToastContext';
import { formatIDR, formatDateTime } from '../../domain/money';
import { INITIAL_STORE_PROFILE, PRESET_STORE_LOGOS, INITIAL_OWNER_PROFILE } from '../../data/demo-data';

export const SettingsPage: React.FC = () => {
  const { role, currentUser, updateCurrentUser, setRole } = useDemoAuth();
  const {
    storeProfile,
    updateStoreProfile,
    resetStoreProfile,
    submitLogoProposal,
    approveLogoProposal,
    rejectLogoProposal,
    uploadLogoDirect,
    updateOwnerProfile,
  } = useStoreSettings();
  const { showToast } = useToast();

  // Store profile form state initialized from storeProfile context
  const [storeName, setStoreName] = useState(storeProfile.name);
  const [storeTagline, setStoreTagline] = useState(storeProfile.tagline);
  const [storeAddress, setStoreAddress] = useState(storeProfile.address);
  const [storePhone, setStorePhone] = useState(storeProfile.phone);
  const [receiptFooter, setReceiptFooter] = useState(storeProfile.receiptFooter);
  const [bankAccount, setBankAccount] = useState(storeProfile.bankAccount);
  const [previewTab, setPreviewTab] = useState<'receipt' | 'storefront'>('receipt');

  // Logo upload state
  const [selectedLogo, setSelectedLogo] = useState<string>(storeProfile.logoUrl || '');
  const [logoNote, setLogoNote] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Owner profile form state
  const currentOwner = storeProfile.ownerProfile || INITIAL_OWNER_PROFILE;
  const [ownerName, setOwnerName] = useState(currentOwner.name);
  const [ownerPhone, setOwnerPhone] = useState(currentOwner.phone);
  const [ownerEmail, setOwnerEmail] = useState(currentOwner.email);
  const [ownerBankName, setOwnerBankName] = useState(currentOwner.bankName);
  const [ownerBankAccountNumber, setOwnerBankAccountNumber] = useState(currentOwner.bankAccountNumber);
  const [ownerBankAccountHolder, setOwnerBankAccountHolder] = useState(currentOwner.bankAccountHolder);
  const [ownerSecurityPin, setOwnerSecurityPin] = useState(currentOwner.securityPin);
  const [ownerNotes, setOwnerNotes] = useState(currentOwner.notesForStaff || '');

  // Cashier shift mock state
  const [shiftStatus, setShiftStatus] = useState<'OPEN' | 'CLOSED'>('OPEN');
  const [initialCash] = useState<number>(300000);
  const [physicalCashInput, setPhysicalCashInput] = useState<number>(1250000);
  const [systemExpectedCash] = useState<number>(1250000);

  // Sync state if storeProfile changes
  useEffect(() => {
    setStoreName(storeProfile.name);
    setStoreTagline(storeProfile.tagline);
    setStoreAddress(storeProfile.address);
    setStorePhone(storeProfile.phone);
    setReceiptFooter(storeProfile.receiptFooter);
    setBankAccount(storeProfile.bankAccount);
    if (storeProfile.logoUrl && !selectedLogo) {
      setSelectedLogo(storeProfile.logoUrl);
    }
  }, [storeProfile]);

  useEffect(() => {
    if (storeProfile.ownerProfile) {
      setOwnerName(storeProfile.ownerProfile.name);
      setOwnerPhone(storeProfile.ownerProfile.phone);
      setOwnerEmail(storeProfile.ownerProfile.email);
      setOwnerBankName(storeProfile.ownerProfile.bankName);
      setOwnerBankAccountNumber(storeProfile.ownerProfile.bankAccountNumber);
      setOwnerBankAccountHolder(storeProfile.ownerProfile.bankAccountHolder);
      setOwnerSecurityPin(storeProfile.ownerProfile.securityPin);
      setOwnerNotes(storeProfile.ownerProfile.notesForStaff || '');
    }
  }, [storeProfile.ownerProfile]);

  // Handlers for store profile
  const handleNameChange = (val: string) => {
    setStoreName(val);
    updateStoreProfile({ name: val });
  };
  const handleTaglineChange = (val: string) => {
    setStoreTagline(val);
    updateStoreProfile({ tagline: val });
  };
  const handleAddressChange = (val: string) => {
    setStoreAddress(val);
    updateStoreProfile({ address: val });
  };
  const handlePhoneChange = (val: string) => {
    setStorePhone(val);
    updateStoreProfile({ phone: val });
  };
  const handleReceiptFooterChange = (val: string) => {
    setReceiptFooter(val);
    updateStoreProfile({ receiptFooter: val });
  };
  const handleBankAccountChange = (val: string) => {
    setBankAccount(val);
    updateStoreProfile({ bankAccount: val });
  };

  const handleSaveStoreProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName.trim() || !storeAddress.trim()) {
      showToast('Nama warung dan alamat tidak boleh kosong.', 'error');
      return;
    }
    updateStoreProfile({
      name: storeName.trim(),
      tagline: storeTagline.trim(),
      address: storeAddress.trim(),
      phone: storePhone.trim(),
      receiptFooter: receiptFooter.trim(),
      bankAccount: bankAccount.trim(),
    });
    showToast('Profil warung berhasil disimpan dan diperbarui di seluruh sistem!', 'success');
  };

  // Logo file upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast('Ukuran file logo maksimal 2 MB', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setSelectedLogo(reader.result);
          showToast('Gambar logo berhasil dipilih!', 'info');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Admin submits logo to owner
  const handleAdminSubmitLogo = () => {
    if (!selectedLogo) {
      showToast('Pilih logo terlebih dahulu', 'error');
      return;
    }
    submitLogoProposal(
      selectedLogo,
      `${currentUser.name} (${role})`,
      logoNote.trim() || 'Usulan desain logo baru toko sembako'
    );
    setLogoNote('');
    showToast('Usulan logo berhasil diajukan ke Pemilik (Owner) untuk ditinjau!', 'success');
  };

  // Owner directly uploads/applies logo
  const handleOwnerApplyLogo = () => {
    if (!selectedLogo) {
      showToast('Pilih logo terlebih dahulu', 'error');
      return;
    }
    uploadLogoDirect(selectedLogo);
    showToast('Logo resmi toko berhasil diterapkan secara langsung oleh Owner!', 'success');
  };

  // Owner approves logo proposal
  const handleApproveProposal = () => {
    approveLogoProposal(currentUser.name);
    showToast('Usulan logo dari Admin disetujui dan kini resmi aktif!', 'success');
  };

  // Owner rejects logo proposal
  const handleConfirmReject = () => {
    if (!rejectionReason.trim()) {
      showToast('Berikan alasan penolakan untuk Admin', 'error');
      return;
    }
    rejectLogoProposal(currentUser.name, rejectionReason.trim());
    setIsRejectDialogOpen(false);
    setRejectionReason('');
    showToast('Usulan logo telah ditolak dengan catatan untuk Admin.', 'info');
  };

  // Owner removes logo
  const handleRemoveLogo = () => {
    if (window.confirm('Hapus logo khusus dan kembali menggunakan logo inisial standar WS?')) {
      updateStoreProfile({ logoUrl: '' });
      setSelectedLogo('');
      showToast('Logo khusus dihapus. Tampilan kembali ke badge standar.', 'info');
    }
  };

  // Owner profile submit handler
  const handleSaveOwnerProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerName.trim() || !ownerPhone.trim()) {
      showToast('Nama Pemilik dan No. WhatsApp wajib diisi.', 'error');
      return;
    }

    updateOwnerProfile({
      name: ownerName.trim(),
      phone: ownerPhone.trim(),
      email: ownerEmail.trim(),
      bankName: ownerBankName.trim(),
      bankAccountNumber: ownerBankAccountNumber.trim(),
      bankAccountHolder: ownerBankAccountHolder.trim(),
      securityPin: ownerSecurityPin.trim() || '123456',
      notesForStaff: ownerNotes.trim(),
    });

    // Also update currentUser demo user
    updateCurrentUser({
      name: ownerName.trim(),
      email: ownerEmail.trim(),
    });

    showToast('Profil Pemilik (Owner) & rekening pencairan berhasil disimpan!', 'success');
  };

  const handleToggleShift = () => {
    if (shiftStatus === 'OPEN') {
      const diff = physicalCashInput - systemExpectedCash;
      setShiftStatus('CLOSED');
      showToast(
        `Shift kasir ditutup. Uang laci: ${formatIDR(physicalCashInput)}, Selisih: ${formatIDR(diff)}.`,
        'info'
      );
    } else {
      setShiftStatus('OPEN');
      showToast(`Shift kasir dibuka dengan modal awal ${formatIDR(initialCash)}.`, 'success');
    }
  };

  const handleResetData = () => {
    if (window.confirm('Reset semua data demo produk, pesanan, stok, piutang, dan profil toko ke kondisi awal?')) {
      resetDemoData();
      resetStoreProfile();
      setStoreName(INITIAL_STORE_PROFILE.name);
      setStoreTagline(INITIAL_STORE_PROFILE.tagline);
      setStoreAddress(INITIAL_STORE_PROFILE.address);
      setStorePhone(INITIAL_STORE_PROFILE.phone);
      setReceiptFooter(INITIAL_STORE_PROFILE.receiptFooter);
      setBankAccount(INITIAL_STORE_PROFILE.bankAccount);
      setSelectedLogo('');
      showToast('Data demo berhasil direset ke kondisi awal.', 'success');
      setTimeout(() => window.location.reload(), 500);
    }
  };

  const cashDifference = physicalCashInput - systemExpectedCash;
  const isOwner = role === 'OWNER';
  const isAdmin = role === 'ADMIN';
  const pendingSubmission = storeProfile.logoSubmission?.status === 'PENDING';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-ink">Pengaturan & Identitas Warung</h1>
          <p className="text-xs sm:text-sm text-muted">
            Konfigurasi profil toko, upload & persetujuan logo, edit data pemilik (Owner), dan shift kasir.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted">Role aktif saat ini:</span>
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
              isOwner
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : isAdmin
                ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                : 'bg-magenta-50 text-magenta-800 border-magenta-200'
            }`}
          >
            {role}
          </span>
        </div>
      </div>

      {/* SECTION 1: PROFIL & LIVE PREVIEW GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Store Profile Form (7 cols) */}
        <section className="lg:col-span-7 bg-surface rounded-2xl border border-border p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4 text-sage-500" />
              <h3 className="font-bold text-sm text-ink">Profil & Identitas Warung</h3>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              <Sparkles className="w-3 h-3" />
              Auto-sync Aktif
            </span>
          </div>

          <form onSubmit={handleSaveStoreProfile} className="space-y-3.5 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-ink block">
                Nama Warung / Toko Sembako <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                required
                value={storeName}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Contoh: Warung Sembako Sumber Rejeki"
                className="w-full px-3 py-2 bg-canvas border border-border rounded-lg text-ink font-semibold focus:ring-2 focus:ring-magenta-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-ink block">
                Slogan / Tagline Toko
              </label>
              <input
                type="text"
                value={storeTagline}
                onChange={(e) => handleTaglineChange(e.target.value)}
                placeholder="Contoh: Barokah Jaya • Sembako Murah"
                className="w-full px-3 py-2 bg-canvas border border-border rounded-lg text-ink focus:ring-2 focus:ring-magenta-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-ink block">
                Alamat Toko Lengkap <span className="text-danger">*</span>
              </label>
              <textarea
                rows={2}
                required
                value={storeAddress}
                onChange={(e) => handleAddressChange(e.target.value)}
                placeholder="Contoh: Pasar Induk Baru Blok A-15, Jakarta"
                className="w-full px-3 py-2 bg-canvas border border-border rounded-lg text-ink focus:ring-2 focus:ring-magenta-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-ink block">
                  No. Telepon / WhatsApp Struk
                </label>
                <input
                  type="text"
                  value={storePhone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="Contoh: 0812-9988-7766"
                  className="w-full px-3 py-2 bg-canvas border border-border rounded-lg text-ink focus:ring-2 focus:ring-magenta-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-ink block">
                  Rekening Bank Pembayaran
                </label>
                <input
                  type="text"
                  value={bankAccount}
                  onChange={(e) => handleBankAccountChange(e.target.value)}
                  placeholder="Contoh: BCA 8800-1234-5678 a/n Warung Sembako"
                  className="w-full px-3 py-2 bg-canvas border border-border rounded-lg text-ink focus:ring-2 focus:ring-magenta-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-ink block">
                Pesan Kaki Struk Kasir (Receipt Footer)
              </label>
              <textarea
                rows={2}
                value={receiptFooter}
                onChange={(e) => handleReceiptFooterChange(e.target.value)}
                placeholder="Pesan terima kasih atau syarat penukaran barang"
                className="w-full px-3 py-2 bg-canvas border border-border rounded-lg text-ink focus:ring-2 focus:ring-magenta-500"
              />
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <span className="text-[11px] text-muted italic">
                Setiap ketikan langsung tersimpan dan terupdate di panel preview.
              </span>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-magenta-500 hover:bg-magenta-700 text-white font-bold text-xs shadow-sm transition-colors shrink-0"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan Perubahan</span>
              </button>
            </div>
          </form>
        </section>

        {/* Live Preview Panel (5 cols) */}
        <section className="lg:col-span-5 bg-surface rounded-2xl border border-border p-5 shadow-xs space-y-4 flex flex-col">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-ink">Preview Langsung</span>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-magenta-700 bg-magenta-50 px-1.5 py-0.5 rounded border border-magenta-200">
                <Sparkles className="w-3 h-3 text-magenta-500" />
                Live
              </span>
            </div>

            {/* Preview switcher tabs */}
            <div className="flex rounded-lg border border-border p-0.5 bg-canvas">
              <button
                type="button"
                onClick={() => setPreviewTab('receipt')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                  previewTab === 'receipt'
                    ? 'bg-surface text-ink shadow-xs'
                    : 'text-muted hover:text-ink'
                }`}
              >
                <Printer className="w-3 h-3" />
                Struk POS
              </button>
              <button
                type="button"
                onClick={() => setPreviewTab('storefront')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                  previewTab === 'storefront'
                    ? 'bg-surface text-ink shadow-xs'
                    : 'text-muted hover:text-ink'
                }`}
              >
                <ShoppingBag className="w-3 h-3" />
                Toko Online
              </button>
            </div>
          </div>

          {previewTab === 'receipt' ? (
            /* Thermal Receipt Mock Preview */
            <div className="bg-canvas p-4 rounded-xl border border-border font-mono text-xs text-ink space-y-3 shadow-inner flex-1">
              <div className="text-center space-y-1 border-b border-dashed border-border pb-2.5">
                {/* Active logo on receipt */}
                {storeProfile.logoUrl ? (
                  <div className="flex justify-center mb-1">
                    <img
                      src={storeProfile.logoUrl}
                      alt="Logo Toko"
                      className="h-10 w-10 object-contain rounded"
                    />
                  </div>
                ) : null}
                <p className="font-bold text-sm text-ink break-words uppercase">
                  {storeName || 'NAMA WARUNG SEMBAKO'}
                </p>
                <p className="text-[10px] text-muted break-words">
                  {storeAddress || 'Alamat Toko Sembako'}
                </p>
                <p className="text-[10px] text-muted">
                  Telp/WA: {storePhone || '-'}
                </p>
              </div>

              <div className="flex justify-between text-[11px] text-muted">
                <span>14 Okt 2026 08:30</span>
                <span>Kasir: Dewi</span>
              </div>

              <div className="border-b border-dashed border-border pb-2 space-y-1">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-ink">Beras Ramos Premium 5 kg</p>
                    <p className="text-[10px] text-muted">1 sak x Rp 72.000</p>
                  </div>
                  <span className="font-bold tabular-nums">Rp 72.000</span>
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-ink">Minyak Goreng 2L Pouch</p>
                    <p className="text-[10px] text-muted">2 pouch x Rp 36.000</p>
                  </div>
                  <span className="font-bold tabular-nums">Rp 72.000</span>
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <div className="flex justify-between font-bold text-sm pt-1 border-t border-dashed border-border">
                  <span>TOTAL:</span>
                  <span className="tabular-nums">Rp 144.000</span>
                </div>
                <div className="flex justify-between text-[11px] text-muted pt-0.5">
                  <span>Bayar Tunai:</span>
                  <span className="tabular-nums">Rp 150.000</span>
                </div>
                <div className="flex justify-between text-[11px] text-muted">
                  <span>Kembalian:</span>
                  <span className="tabular-nums font-bold text-ink">Rp 6.000</span>
                </div>
              </div>

              <div className="text-center text-[10px] text-muted pt-2 border-t border-dashed border-border leading-relaxed break-words">
                {receiptFooter || 'Terima kasih atas kunjungan Anda.'}
              </div>
            </div>
          ) : (
            /* Storefront Live Card Preview */
            <div className="space-y-3 flex-1">
              <div className="bg-canvas p-3.5 rounded-xl border border-border space-y-2">
                <span className="text-[10px] uppercase font-bold text-muted block tracking-wider">
                  Tampilan Header Toko
                </span>
                <div className="flex items-center gap-2.5 bg-surface p-2.5 rounded-lg border border-border">
                  {storeProfile.logoUrl ? (
                    <img
                      src={storeProfile.logoUrl}
                      alt="Logo Toko"
                      className="w-9 h-9 rounded-lg object-contain border border-border shadow-xs"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-sage-500 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                      WS
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-ink leading-tight truncate">
                      {storeName || 'Nama Toko'}
                    </p>
                    <p className="text-xs text-muted truncate">
                      {storeTagline || 'Tagline Toko'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-canvas p-3.5 rounded-xl border border-border space-y-2 text-xs">
                <span className="text-[10px] uppercase font-bold text-muted block tracking-wider">
                  Tampilan Informasi Kontak & Rekening
                </span>
                <div className="space-y-1.5 bg-surface p-2.5 rounded-lg border border-border text-[11px]">
                  <p className="text-muted">
                    <strong className="text-ink">Alamat:</strong> {storeAddress || '-'}
                  </p>
                  <p className="text-muted">
                    <strong className="text-ink">WhatsApp:</strong> {storePhone || '-'}
                  </p>
                  <p className="text-muted">
                    <strong className="text-ink">Rekening:</strong> {bankAccount || '-'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Quick links */}
          <div className="p-3 rounded-lg bg-sage-50/70 border border-sage-100 text-xs text-sage-800 space-y-1.5">
            <p className="font-semibold text-ink text-[11px]">Buka halaman untuk uji coba langsung:</p>
            <div className="flex flex-wrap gap-2 text-[11px]">
              <Link
                to="/app/kasir"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white border border-sage-300 font-semibold text-magenta-700 hover:bg-magenta-50 transition-colors"
              >
                <Printer className="w-3 h-3" />
                Cek POS Kasir & Struk
                <ExternalLink className="w-2.5 h-2.5 opacity-60" />
              </Link>
              <Link
                to="/"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white border border-sage-300 font-semibold text-sage-700 hover:bg-sage-100 transition-colors"
              >
                <ShoppingBag className="w-3 h-3" />
                Cek Toko Online
                <ExternalLink className="w-2.5 h-2.5 opacity-60" />
              </Link>
            </div>
          </div>
        </section>
      </div>

      {/* SECTION 2: LOGO TOKO — UPLOAD ADMIN & PERSETUJUAN OWNER */}
      <section className="bg-surface rounded-2xl border border-border p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-magenta-500" />
            <div>
              <h3 className="font-bold text-base text-ink">Upload Logo Toko & Persetujuan Pemilik</h3>
              <p className="text-xs text-muted">
                Admin mengajukan usulan logo baru; Pemilik (Owner) berwenang menyetujui atau menolak.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted">Status Logo:</span>
            {pendingSubmission ? (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1 animate-pulse">
                <Clock className="w-3 h-3" />
                Menunggu Persetujuan Owner
              </span>
            ) : storeProfile.logoUrl ? (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-success border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Logo Resmi Aktif
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                Menggunakan Inisial WS Standar
              </span>
            )}
          </div>
        </div>

        {/* OWNER APPROVAL BANNER (Visible if there is pending submission) */}
        {pendingSubmission && storeProfile.logoSubmission && (
          <div className="bg-amber-50/70 border-2 border-amber-300 rounded-xl p-4 sm:p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-ink">
                    Pengajuan Usulan Logo Baru Menunggu Persetujuan Pemilik (Owner)
                  </h4>
                  <p className="text-xs text-muted">
                    Diajukan oleh: <strong className="text-ink">{storeProfile.logoSubmission.submittedBy}</strong> pada{' '}
                    {formatDateTime(storeProfile.logoSubmission.submittedAt)}
                  </p>
                </div>
              </div>
            </div>

            {storeProfile.logoSubmission.note && (
              <div className="p-3 bg-white rounded-lg border border-amber-200 text-xs text-ink-soft">
                <strong className="text-ink block mb-0.5">Catatan Pengajuan dari Admin:</strong>
                "{storeProfile.logoSubmission.note}"
              </div>
            )}

            {/* Comparison view */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="bg-white p-3 rounded-xl border border-amber-200 text-center space-y-2">
                <span className="text-[11px] font-bold text-muted uppercase block">Logo Aktif Saat Ini</span>
                <div className="h-20 flex items-center justify-center">
                  {storeProfile.logoUrl ? (
                    <img src={storeProfile.logoUrl} alt="Logo Sekarang" className="h-16 w-16 object-contain" />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-sage-500 text-white flex items-center justify-center font-bold text-lg">
                      WS
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-muted">
                  {storeProfile.logoUrl ? 'Logo Kustom Aktif' : 'Badge Inisial Default'}
                </p>
              </div>

              <div className="bg-white p-3 rounded-xl border-2 border-amber-400 text-center space-y-2 shadow-xs">
                <span className="text-[11px] font-bold text-amber-700 uppercase block flex items-center justify-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Usulan Logo Baru dari Admin
                </span>
                <div className="h-20 flex items-center justify-center">
                  <img
                    src={storeProfile.logoSubmission.proposedLogoUrl}
                    alt="Usulan Logo Baru"
                    className="h-16 w-16 object-contain drop-shadow"
                  />
                </div>
                <p className="text-[10px] text-amber-700 font-semibold">Siap Diterapkan ke Seluruh Toko</p>
              </div>
            </div>

            {/* Approval Action Buttons (Only actionable for Owner) */}
            {isOwner ? (
              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-3 border-t border-amber-200">
                <span className="text-xs text-muted mr-auto font-medium">
                  Sebagai Owner, Anda berhak memutuskan penggunaan logo toko ini:
                </span>
                <button
                  type="button"
                  onClick={() => setIsRejectDialogOpen(true)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl border border-red-300 bg-white hover:bg-red-50 text-danger font-bold text-xs transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Tolak Usulan</span>
                </button>
                <button
                  type="button"
                  onClick={handleApproveProposal}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Setujui & Terapkan Logo Resmi</span>
                </button>
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-white border border-amber-200 flex items-center justify-between text-xs">
                <span className="text-amber-800 font-medium">
                  Saat ini Anda login sebagai <strong>{role}</strong>. Hanya akun <strong>OWNER</strong> yang dapat menyetujui logo ini.
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setRole('OWNER');
                    showToast('Beralih ke akun Owner untuk meninjau usulan logo.', 'info');
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-[11px] shadow-xs shrink-0"
                >
                  Beralih ke Akun Owner (Demo) →
                </button>
              </div>
            )}
          </div>
        )}

        {/* LOGO SELECTION & UPLOAD INTERFACE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-2">
          {/* Current Logo preview card (4 cols) */}
          <div className="lg:col-span-4 bg-canvas p-4 rounded-xl border border-border flex flex-col items-center justify-center text-center space-y-3">
            <span className="text-[11px] font-bold text-muted uppercase tracking-wider">
              Logo Toko Saat Ini
            </span>
            <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-border bg-surface flex items-center justify-center overflow-hidden p-2 shadow-xs">
              {storeProfile.logoUrl ? (
                <img
                  src={storeProfile.logoUrl}
                  alt="Logo Toko"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-sage-500 text-white flex items-center justify-center font-bold text-xl shadow-xs">
                  WS
                </div>
              )}
            </div>
            <div>
              <p className="font-bold text-xs text-ink">
                {storeProfile.logoUrl ? 'Logo Kustom Aktif' : 'Default: Badge WS'}
              </p>
              <p className="text-[10px] text-muted">
                Tampil di header online, sidebar admin, struk POS
              </p>
            </div>
            {storeProfile.logoUrl && isOwner && (
              <button
                type="button"
                onClick={handleRemoveLogo}
                className="text-[11px] text-danger hover:underline font-semibold"
              >
                Hapus Logo Kustom
              </button>
            )}
          </div>

          {/* Upload and Preset Selection (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            <div>
              <label className="font-bold text-xs text-ink block mb-1">
                Pilih atau Upload Logo Toko Baru:
              </label>
              <p className="text-muted text-[11px]">
                Gunakan preset desain logo sembako atau unggah file logo gambar (PNG, JPG, SVG, WebP maks 2MB).
              </p>
            </div>

            {/* Presets */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-ink block">Pilihan Preset Cepat:</span>
              <div className="grid grid-cols-3 gap-2.5">
                {PRESET_STORE_LOGOS.map((p) => {
                  const isSelected = selectedLogo === p.url;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedLogo(p.url)}
                      className={`p-2 rounded-xl border text-left flex flex-col items-center gap-1.5 transition-all ${
                        isSelected
                          ? 'border-magenta-500 bg-magenta-50/60 shadow-xs ring-2 ring-magenta-400'
                          : 'border-border bg-canvas hover:bg-surface'
                      }`}
                    >
                      <img src={p.url} alt={p.name} className="w-12 h-12 object-contain" />
                      <span className="text-[10px] font-bold text-ink text-center leading-tight">
                        {p.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* File Upload Button */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-canvas hover:bg-surface text-ink text-xs font-semibold transition-colors"
                >
                  <Upload className="w-3.5 h-3.5 text-sage-500" />
                  <span>Upload File Gambar Logo</span>
                </button>
                {selectedLogo && (
                  <span className="text-[11px] text-success font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Logo terpilih
                  </span>
                )}
              </div>
            </div>

            {/* Note input for Admin submission */}
            {isAdmin && (
              <div className="space-y-1">
                <label className="font-semibold text-ink text-xs block">
                  Catatan untuk Pemilik (Owner):
                </label>
                <input
                  type="text"
                  value={logoNote}
                  onChange={(e) => setLogoNote(e.target.value)}
                  placeholder="Misal: Desain logo baru dengan warna hijau ramah untuk menyegarkan tampilan toko"
                  className="w-full px-3 py-2 bg-canvas border border-border rounded-lg text-xs text-ink focus:ring-2 focus:ring-magenta-500"
                />
              </div>
            )}

            {/* Submit Action */}
            <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-border">
              <div className="text-[11px] text-muted">
                {isAdmin ? (
                  <span>Role Admin akan mengirimkan permohonan persetujuan ke Pemilik.</span>
                ) : isOwner ? (
                  <span>Role Owner dapat langsung menerapkan logo tanpa approval.</span>
                ) : (
                  <span>Hanya Admin dan Owner yang dapat mengelola logo.</span>
                )}
              </div>

              {isAdmin && (
                <button
                  type="button"
                  onClick={handleAdminSubmitLogo}
                  disabled={!selectedLogo}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs shadow-sm transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Ajukan Logo ke Pemilik (Owner)</span>
                </button>
              )}

              {isOwner && (
                <button
                  type="button"
                  onClick={handleOwnerApplyLogo}
                  disabled={!selectedLogo}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs shadow-sm transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Terapkan Logo Resmi Sekarang</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: FITUR EDIT OWNER (KHUSUS ROLE OWNER) */}
      <section className="bg-surface rounded-2xl border border-border p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="font-bold text-base text-ink">Profil & Rekening Pemilik (Khusus Role OWNER)</h3>
              <p className="text-xs text-muted">
                Data pribadi pemilik warung, rekening pencairan keuntungan toko, dan PIN otorisasi keamanan.
              </p>
            </div>
          </div>

          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
              isOwner
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-gray-100 text-gray-600 border-gray-300'
            }`}
          >
            {isOwner ? <Shield className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
            {isOwner ? 'Akses Terbuka (Owner)' : 'Terkunci (Bukan Owner)'}
          </span>
        </div>

        {isOwner ? (
          <form onSubmit={handleSaveOwnerProfile} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-semibold text-ink block">
                  Nama Lengkap Pemilik (Owner) <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="Contoh: Haji Ahmad"
                  className="w-full px-3 py-2 bg-canvas border border-border rounded-lg text-ink font-semibold focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-ink block">
                  Nomor HP / WhatsApp Pribadi <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={ownerPhone}
                  onChange={(e) => setOwnerPhone(e.target.value)}
                  placeholder="Contoh: 0811-2233-4455"
                  className="w-full px-3 py-2 bg-canvas border border-border rounded-lg text-ink focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-ink block">Email Pribadi Pemilik</label>
                <input
                  type="email"
                  value={ownerEmail}
                  onChange={(e) => setOwnerEmail(e.target.value)}
                  placeholder="Contoh: owner@warungsembako.demo"
                  className="w-full px-3 py-2 bg-canvas border border-border rounded-lg text-ink focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-ink block">
                  PIN Otorisasi Keamanan Owner
                </label>
                <input
                  type="password"
                  maxLength={6}
                  value={ownerSecurityPin}
                  onChange={(e) => setOwnerSecurityPin(e.target.value)}
                  placeholder="6 digit angka otorisasi"
                  className="w-full px-3 py-2 bg-canvas border border-border rounded-lg text-ink font-mono tracking-widest focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-[10px] text-muted">
                  Digunakan untuk otorisasi pembatalan transaksi kasir, diskon khusus, dan approval logo.
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-canvas border border-border space-y-3">
              <span className="text-xs font-bold text-ink uppercase tracking-wider block">
                Rekening Bank Pribadi (Pencairan Omzet & Profit Warung)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-ink block">Nama Bank</label>
                  <input
                    type="text"
                    value={ownerBankName}
                    onChange={(e) => setOwnerBankName(e.target.value)}
                    placeholder="Contoh: BCA / Mandiri / BRI"
                    className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-ink focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-ink block">Nomor Rekening</label>
                  <input
                    type="text"
                    value={ownerBankAccountNumber}
                    onChange={(e) => setOwnerBankAccountNumber(e.target.value)}
                    placeholder="Contoh: 527-019-8899"
                    className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-ink font-mono focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-ink block">Atas Nama Rekening</label>
                  <input
                    type="text"
                    value={ownerBankAccountHolder}
                    onChange={(e) => setOwnerBankAccountHolder(e.target.value)}
                    placeholder="Contoh: Haji Ahmad"
                    className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-ink focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-ink block">
                Pesan / Instruksi Pemilik untuk Kasir & Admin:
              </label>
              <textarea
                rows={2}
                value={ownerNotes}
                onChange={(e) => setOwnerNotes(e.target.value)}
                placeholder="Misal: Cek kondisi karung beras sebelum diserahkan ke pelanggan eceran..."
                className="w-full px-3 py-2 bg-canvas border border-border rounded-lg text-ink focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-[11px] text-muted italic">
                Perubahan nama pemilik otomatis menyinkronkan profil demo pengguna saat ini.
              </span>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan Profil Owner</span>
              </button>
            </div>
          </form>
        ) : (
          /* Locked State for Non-Owner */
          <div className="p-6 rounded-xl bg-canvas border border-border text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h4 className="font-bold text-sm text-ink">Fitur Dikhususkan untuk Pemilik Warung (OWNER)</h4>
              <p className="text-xs text-muted">
                Data pribadi pemilik warung, rekening pencairan dividen/kas, dan PIN keamanan dilindungi dan hanya dapat diakses oleh akun role OWNER.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setRole('OWNER');
                showToast('Beralih ke role OWNER untuk mengakses fitur Edit Owner.', 'success');
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors"
            >
              <Shield className="w-4 h-4" />
              <span>Beralih ke Akun Owner (Demo) untuk Coba Fitur Ini</span>
            </button>
          </div>
        )}
      </section>

      {/* SECTION 4: SHIFT KASIR & REKONSILIASI KAS LACI */}
      <section className="bg-surface rounded-2xl border border-border p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h3 className="font-bold text-sm text-ink flex items-center gap-2">
            <Clock className="w-4 h-4 text-sage-500" />
            <span>Shift Kasir & Rekonsiliasi Kas Laci</span>
          </h3>
          <span
            className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${
              shiftStatus === 'OPEN'
                ? 'bg-emerald-50 text-success border border-emerald-200'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            {shiftStatus === 'OPEN' ? 'Shift Sedang Buka' : 'Shift Ditutup'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-canvas border border-border space-y-2">
            <div className="flex justify-between text-muted">
              <span>Kasir Aktif:</span>
              <span className="font-bold text-ink">{currentUser.name}</span>
            </div>
            <div className="flex justify-between text-muted">
              <span>Modal Kasir Awal:</span>
              <span className="font-bold tabular-nums text-ink">{formatIDR(initialCash)}</span>
            </div>
            <div className="flex justify-between text-muted">
              <span>Estimasi Kas Sistem:</span>
              <span className="font-bold tabular-nums text-ink">
                {formatIDR(systemExpectedCash)}
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-canvas border border-border space-y-2">
            <label className="font-semibold text-ink block">
              Hitung Uang Fisik di Laci Kasir (Rp):
            </label>
            <input
              type="number"
              value={physicalCashInput || ''}
              onChange={(e) => setPhysicalCashInput(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-surface border border-border rounded-lg font-bold text-ink tabular-nums focus:ring-2 focus:ring-sage-500"
            />
            <div className="flex justify-between items-center pt-1 text-xs">
              <span className="text-muted">Selisih Kas Laci:</span>
              <span
                className={`font-bold tabular-nums ${
                  cashDifference === 0
                    ? 'text-success'
                    : cashDifference > 0
                    ? 'text-info'
                    : 'text-danger'
                }`}
              >
                {cashDifference === 0
                  ? 'Cocok (Rp 0)'
                  : cashDifference > 0
                  ? `Lebih ${formatIDR(cashDifference)}`
                  : `Kurang ${formatIDR(Math.abs(cashDifference))}`}
              </span>
            </div>
          </div>

          <div className="flex flex-col justify-between p-3.5 rounded-xl bg-canvas border border-border">
            <p className="text-muted leading-relaxed">
              Tutup shift di akhir jam kerja untuk mencocokkan total penerimaan tunai fisik dengan laporan sistem kasir POS.
            </p>
            <button
              type="button"
              onClick={handleToggleShift}
              className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs shadow-sm transition-colors mt-2 ${
                shiftStatus === 'OPEN'
                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {shiftStatus === 'OPEN' ? 'Tutup & Rekonsiliasi Shift' : 'Buka Shift Baru'}
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 5: DEMO DATA RESET */}
      <section className="bg-red-50/50 rounded-2xl border border-red-200 p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h4 className="font-bold text-sm text-danger flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-danger" />
            <span>Reset Data Demo Prototipe</span>
          </h4>
          <p className="text-xs text-muted max-w-xl">
            Mengembalikan seluruh data produk, pengguna, stok awal, transaksi kasir POS, pesanan online, catatan piutang, dan profil warung ke kondisi awal SOT.
          </p>
        </div>

        <button
          type="button"
          onClick={handleResetData}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-danger hover:bg-red-700 text-white font-bold text-xs shadow-sm transition-colors shrink-0"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset ke Data Awal</span>
        </button>
      </section>

      {/* REJECTION REASON MODAL DIALOG */}
      {isRejectDialogOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-xs"
        >
          <div className="bg-surface rounded-2xl border border-border shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-ink flex items-center gap-2">
                <XCircle className="w-5 h-5 text-danger" />
                <span>Tolak Usulan Logo dari Admin</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsRejectDialogOpen(false)}
                className="text-muted hover:text-ink p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-muted">
                Tuliskan alasan penolakan agar Admin dapat memperbaiki desain atau konsep logo warung:
              </p>
              <textarea
                rows={3}
                required
                autoFocus
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Contoh: Warna kurang kontras, mohon gunakan nuansa hijau daun yang lebih segar..."
                className="w-full px-3 py-2 bg-canvas border border-border rounded-lg text-ink focus:ring-2 focus:ring-danger"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-border">
              <button
                type="button"
                onClick={() => setIsRejectDialogOpen(false)}
                className="px-4 py-2 rounded-lg border border-border text-muted hover:text-ink font-semibold text-xs"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-4 py-2 rounded-lg bg-danger hover:bg-red-700 text-white font-bold text-xs shadow-sm"
              >
                Konfirmasi Tolak Usulan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
