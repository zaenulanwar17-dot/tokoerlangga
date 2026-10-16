import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Barcode,
  Plus,
  Minus,
  Trash2,
  User,
  CreditCard,
  Printer,
  RotateCcw,
  CheckCircle2,
  ShoppingBag,
  X,
  AlertTriangle,
  BookOpen,
  Clock,
  Send,
} from 'lucide-react';
import { Product, Customer, CartItem, PaymentMethod, Receivable } from '../../domain/types';
import {
  productRepository,
  customerRepository,
  orderRepository,
  receivableRepository,
  cashierShiftRepository,
} from '../../services';
import { formatIDR, formatDateTime } from '../../domain/money';
import {
  calculateUnitPrice,
  calculateCartTotals,
  calculateCashChange,
} from '../../domain/pricing';
import { StockBadge } from '../../components/ui/StockBadge';
import { PriceTierBadge } from '../../components/ui/PriceTierBadge';
import { useToast } from '../../context/ToastContext';
import { useDemoAuth } from '../../context/DemoAuthContext';
import { useStoreSettings } from '../../context/StoreSettingsContext';
import { CashierShiftApprovalPage } from '../owner/CashierShiftApprovalPage';

export const PosPage: React.FC = () => {
  const { currentUser, role } = useDemoAuth();

  // Jika yang login adalah role OWNER, alihkan tampilan menu kasir menjadi Persetujuan Kasir Tutup Buku
  if (role === 'OWNER') {
    return <CashierShiftApprovalPage />;
  }

  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);

  // Payment & Receipt Dialogs
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<any | null>(null);
  const [completedReceivable, setCompletedReceivable] = useState<Receivable | null>(null);

  // Piutang & Kasbon Configuration
  const [includePreviousDebt, setIncludePreviousDebt] = useState<boolean>(true);
  const [debtCustomerName, setDebtCustomerName] = useState<string>('');
  const [debtCustomerPhone, setDebtCustomerPhone] = useState<string>('');
  const [debtCustomerAddress, setDebtCustomerAddress] = useState<string>('');
  const [debtNote, setDebtNote] = useState<string>('');

  const searchInputRef = useRef<HTMLInputElement>(null);
  const { storeProfile } = useStoreSettings();
  const { showToast } = useToast();

  // Cashier Shift Closure Modal State
  const [shiftModalOpen, setShiftModalOpen] = useState(false);
  const [shiftInitialCash, setShiftInitialCash] = useState<number>(200000);
  const [physicalCashInput, setPhysicalCashInput] = useState<number>(0);
  const [differenceReason, setDifferenceReason] = useState<string>(
    'Uang kembalian koin/receh tidak ada / selisih pembulatan nota'
  );
  const [differenceNotes, setDifferenceNotes] = useState<string>('');
  const [isSubmittingShift, setIsSubmittingShift] = useState(false);
  const [shiftSuccessSent, setShiftSuccessSent] = useState(false);
  const [sentShiftNumber, setSentShiftNumber] = useState('');
  const [posOrdersToday, setPosOrdersToday] = useState<any[]>([]);

  const handleOpenCloseShift = async () => {
    try {
      const allOrders = await orderRepository.list();
      const todayStr = new Date().toISOString().slice(0, 10);
      const todayPos = allOrders.filter(
        (o) => o.channel === 'POS' && (o.createdAt || '').startsWith(todayStr)
      );
      setPosOrdersToday(todayPos);
    } catch {
      // fallback
    }
    setPhysicalCashInput(0);
    setDifferenceReason('Uang kembalian koin/receh tidak ada / selisih pembulatan nota');
    setDifferenceNotes('');
    setShiftSuccessSent(false);
    setShiftModalOpen(true);
  };

  const shiftCashSales = posOrdersToday
    .filter((o) => o.paymentMethod === 'CASH')
    .reduce((sum, o) => sum + (o.grandTotal || 0), 0);

  const shiftNonCashSales = posOrdersToday
    .filter((o) => o.paymentMethod !== 'CASH')
    .reduce((sum, o) => sum + (o.grandTotal || 0), 0);

  const shiftSystemExpectedCash = shiftInitialCash + shiftCashSales;
  const shiftDifference = physicalCashInput - shiftSystemExpectedCash;

  const handleSubmitShiftClosure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (physicalCashInput < 0) {
      showToast('Nominal uang fisik tidak valid', 'error');
      return;
    }
    if (shiftDifference !== 0 && !differenceReason) {
      showToast('Pilih alasan selisih kas', 'error');
      return;
    }

    try {
      setIsSubmittingShift(true);
      const created = await cashierShiftRepository.create({
        cashierId: currentUser.id,
        cashierName: currentUser.name,
        startTime: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
        endTime: new Date().toISOString(),
        initialCash: shiftInitialCash,
        systemCashSales: shiftCashSales,
        systemNonCashSales: shiftNonCashSales,
        actualPhysicalCash: physicalCashInput,
        differenceReason: shiftDifference !== 0 ? differenceReason : undefined,
        differenceNotes: shiftDifference !== 0 ? differenceNotes.trim() || undefined : undefined,
      });

      setSentShiftNumber(created.shiftNumber);
      setShiftSuccessSent(true);
      showToast(
        `Tutup buku kasir ${created.shiftNumber} berhasil dikirim ke Owner untuk disetujui.`,
        'success'
      );
    } catch (err: any) {
      showToast(err?.message || 'Gagal mengirim penutupan kasir', 'error');
    } finally {
      setIsSubmittingShift(false);
    }
  };

  const loadData = async () => {
    const prods = await productRepository.list({ isActive: true });
    setProducts(prods);
    const custs = await customerRepository.list();
    setCustomers(custs);
    if (!selectedCustomer && custs.length > 0) {
      setSelectedCustomer(custs[0]); // Pelanggan Umum
    }
  };

  useEffect(() => {
    loadData();
    searchInputRef.current?.focus();
  }, []);

  // Current tier from selected customer
  const currentTier = selectedCustomer ? selectedCustomer.tier : 'RETAIL';

  // Recalculate cart items when customer or tier changes
  useEffect(() => {
    setCartItems((prev) =>
      prev.map((item) => {
        const { unitPrice, appliedTier } = calculateUnitPrice(
          item.product.priceRules,
          currentTier,
          item.quantity
        );
        return {
          ...item,
          appliedTier,
          unitPrice,
          subtotal: unitPrice * item.quantity,
        };
      })
    );
  }, [currentTier]);

  // Filter products by search query
  const filteredProducts = products.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.barcode.includes(q)
    );
  });

  const handleAddToCart = (product: Product) => {
    if (product.stock.available <= 0) {
      showToast(`Stok ${product.name} habis!`, 'error');
      return;
    }

    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      const newQty = existing ? existing.quantity + 1 : 1;

      if (newQty > product.stock.available) {
        showToast(`Kuantitas melebihi stok tersedia (${product.stock.available}).`, 'error');
        return prev;
      }

      const { unitPrice, appliedTier } = calculateUnitPrice(
        product.priceRules,
        currentTier,
        newQty
      );

      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: newQty,
                unitPrice,
                appliedTier,
                subtotal: unitPrice * newQty,
              }
            : item
        );
      } else {
        return [
          ...prev,
          {
            product,
            quantity: 1,
            appliedTier,
            unitPrice,
            subtotal: unitPrice,
          },
        ];
      }
    });

    // Auto-clear barcode scan field if exact match was typed
    if (product.barcode === searchQuery.trim()) {
      setSearchQuery('');
    }
  };

  const handleUpdateQuantity = (productId: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveItem(productId);
      return;
    }

    const prod = products.find((p) => p.id === productId);
    if (prod && newQty > prod.stock.available) {
      showToast(`Maksimal stok tersedia adalah ${prod.stock.available}.`, 'error');
      return;
    }

    setCartItems((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          const { unitPrice, appliedTier } = calculateUnitPrice(
            item.product.priceRules,
            currentTier,
            newQty
          );
          return {
            ...item,
            quantity: newQty,
            appliedTier,
            unitPrice,
            subtotal: unitPrice * newQty,
          };
        }
        return item;
      })
    );
  };

  const handleRemoveItem = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleResetCart = () => {
    if (cartItems.length > 0 && window.confirm('Kosongkan keranjang kasir?')) {
      setCartItems([]);
      setDiscount(0);
      searchInputRef.current?.focus();
    }
  };

  const totals = calculateCartTotals(cartItems, discount, 0);
  const previousDebt = selectedCustomer?.currentDebt || 0;
  const activeBill = includePreviousDebt && previousDebt > 0 ? totals.grandTotal + previousDebt : totals.grandTotal;

  // Debt & underpayment computations
  const effectiveCash = Math.max(0, cashReceived);
  const isDebtTransaction = paymentMethod === 'CASH' && effectiveCash < activeBill;
  const remainingDebt = isDebtTransaction ? activeBill - effectiveCash : 0;
  const changeCalc = calculateCashChange(activeBill, cashReceived);

  const openPaymentModal = () => {
    if (cartItems.length === 0) {
      showToast('Keranjang kasir masih kosong.', 'error');
      return;
    }
    const currentPrevDebt = selectedCustomer?.currentDebt || 0;
    const shouldInclude = currentPrevDebt > 0;
    setIncludePreviousDebt(shouldInclude);
    setPaymentMethod('CASH');
    const targetAmount = shouldInclude ? totals.grandTotal + currentPrevDebt : totals.grandTotal;
    setCashReceived(targetAmount);
    setDebtNote('Kasbon transaksi kasir POS');
    if (selectedCustomer && selectedCustomer.id !== 'cust_umum') {
      setDebtCustomerName(selectedCustomer.name);
      setDebtCustomerPhone(selectedCustomer.phone);
      setDebtCustomerAddress(selectedCustomer.address || '');
    } else {
      setDebtCustomerName('');
      setDebtCustomerPhone('');
      setDebtCustomerAddress('');
    }
    setPaymentDialogOpen(true);
  };

  const handleProcessPayment = async () => {
    setIsProcessing(true);
    try {
      let targetCustomer = selectedCustomer;

      if (remainingDebt > 0) {
        if (!targetCustomer || targetCustomer.id === 'cust_umum') {
          if (!debtCustomerName.trim()) {
            showToast('Mohon masukkan nama pelanggan untuk pencatatan piutang / kasbon!', 'error');
            setIsProcessing(false);
            return;
          }
          // Fast-register customer in repository
          const newCust = await customerRepository.create({
            name: debtCustomerName.trim(),
            phone: debtCustomerPhone.trim() || '-',
            tier: 'RETAIL',
            creditLimit: 1000000,
            currentDebt: 0,
            address: debtCustomerAddress.trim() || undefined,
            notes: 'Didaftarkan otomatis dari transaksi POS piutang',
          });
          targetCustomer = newCust;
          setSelectedCustomer(newCust);
        }
      }

      const paidAmount = paymentMethod === 'CASH' ? effectiveCash : activeBill;

      // Settle previous debt if included in payment
      if (includePreviousDebt && previousDebt > 0 && targetCustomer) {
        if (paidAmount >= previousDebt) {
          // Lunas piutang sebelumnya
          await receivableRepository.settleCustomerDebt(
            targetCustomer.id,
            previousDebt,
            paymentMethod,
            'Pelunasan piutang lama via transaksi kasir POS'
          );
        } else if (paidAmount > 0) {
          // Bayar sebagian piutang sebelumnya
          await receivableRepository.settleCustomerDebt(
            targetCustomer.id,
            paidAmount,
            paymentMethod,
            'Pembayaran sebagian piutang via transaksi kasir POS'
          );
        }
      }

      const created = await orderRepository.create({
        channel: 'POS',
        customer: targetCustomer
          ? {
              id: targetCustomer.id,
              name: targetCustomer.name,
              phone: targetCustomer.phone,
              tier: targetCustomer.tier,
            }
          : undefined,
        items: cartItems.map((i) => ({
          productId: i.product.id,
          productName: i.product.name,
          sku: i.product.sku,
          unit: i.product.unit,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          subtotal: i.subtotal,
          tier: i.appliedTier,
        })),
        subtotal: totals.subtotal,
        discount: totals.discount,
        shippingFee: 0,
        grandTotal: totals.grandTotal,
        paymentMethod,
        paymentStatus: remainingDebt > 0 ? (paidAmount > 0 ? 'PARTIAL' : 'PENDING') : 'PAID',
        orderStatus: 'COMPLETED',
        paidAmount,
        changeAmount: paymentMethod === 'CASH' && !isDebtTransaction ? changeCalc.change : 0,
        notes: remainingDebt > 0
          ? `Kasir: ${currentUser.name}. Piutang Kasbon Akumulatif: ${formatIDR(remainingDebt)}${debtNote ? ` - ${debtNote}` : ''}`
          : `Kasir: ${currentUser.name}`,
      });

      // Record Receivable if there is an underpayment or credit
      let createdRcv: Receivable | null = null;
      if (remainingDebt > 0 && targetCustomer) {
        createdRcv = await receivableRepository.addCustomerDebt(
          targetCustomer.id,
          targetCustomer.name,
          targetCustomer.phone || '-',
          totals.grandTotal > 0 ? Math.min(totals.grandTotal, remainingDebt) : remainingDebt,
          created.id,
          created.orderNumber,
          debtNote || 'Kasbon transaksi kasir POS'
        );
        // Ensure customer currentDebt is explicitly synchronized to total remainingDebt
        await customerRepository.update(targetCustomer.id, { currentDebt: remainingDebt });
        setCompletedReceivable(createdRcv);
        showToast(
          `Transaksi selesai! Piutang akumulatif ${formatIDR(remainingDebt)} tercatat atas nama ${targetCustomer.name}.`,
          'success'
        );
      } else {
        if (targetCustomer && includePreviousDebt) {
          await customerRepository.update(targetCustomer.id, { currentDebt: 0 });
        }
        setCompletedReceivable(null);
        showToast(`Transaksi ${created.orderNumber} berhasil dicatat & lunas!`, 'success');
      }

      setCompletedOrder(created);
      setPaymentDialogOpen(false);
      setCartItems([]);
      setDiscount(0);
      // Refresh products stock & customers debt
      await loadData();
    } catch {
      showToast('Gagal memproses transaksi kasir.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const startNewTransaction = () => {
    setCompletedOrder(null);
    setCompletedReceivable(null);
    setCartItems([]);
    setDiscount(0);
    searchInputRef.current?.focus();
  };

  return (
    <div className="space-y-4">
      {/* POS Topbar: Search & Customer Selector */}
      <div className="bg-surface p-4 rounded-xl border border-border shadow-xs flex flex-wrap items-center justify-between gap-4">
        {/* Barcode / Search Input */}
        <div className="relative flex-1 min-w-[280px]">
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Scan barcode atau cari nama sembako/SKU (Fokus keyboard)..."
            className="w-full pl-9 pr-8 py-2.5 text-sm bg-canvas border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-magenta-500 font-medium"
          />
          <Barcode className="w-4 h-4 text-muted absolute left-3 top-3 pointer-events-none" />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                searchInputRef.current?.focus();
              }}
              className="absolute right-2.5 top-3 text-muted hover:text-ink"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Customer Selector */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted font-medium flex items-center gap-1">
            <User className="w-3.5 h-3.5 text-sage-500" />
            Pelanggan:
          </span>
          <select
            value={selectedCustomer?.id || ''}
            onChange={(e) => {
              const cust = customers.find((c) => c.id === e.target.value);
              setSelectedCustomer(cust || null);
            }}
            className="bg-canvas border border-border rounded-lg px-3 py-2 text-xs font-semibold text-ink focus:ring-2 focus:ring-sage-500 max-w-[200px] truncate"
          >
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.tier})
              </option>
            ))}
          </select>
          {selectedCustomer && <PriceTierBadge tier={selectedCustomer.tier} size="sm" />}
        </div>

        {/* Action: Tutup Kasir Shift */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleOpenCloseShift}
            className="px-3 py-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
            title="Tutup Kasir & Rekonsiliasi Kas Laci untuk dikirim ke Owner"
          >
            <Clock className="w-3.5 h-3.5 text-amber-700" />
            <span>Tutup Kasir (Shift)</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column POS Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Product Selection Grid (~60%, 7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between text-xs text-muted px-1">
            <span>Daftar Sembako ({filteredProducts.length} produk)</span>
            <span>Klik kartu untuk tambah ke keranjang</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
            {filteredProducts.map((prod) => {
              const { unitPrice, appliedTier } = calculateUnitPrice(
                prod.priceRules,
                currentTier,
                1
              );

              return (
                <div
                  key={prod.id}
                  onClick={() => handleAddToCart(prod)}
                  className={`p-3 rounded-xl border cursor-pointer select-none transition-all flex flex-col justify-between ${
                    prod.stock.available <= 0
                      ? 'bg-canvas opacity-50 border-border cursor-not-allowed'
                      : 'bg-surface hover:border-magenta-500 hover:shadow-sm border-border'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between text-[10px] text-muted mb-1">
                      <span className="font-mono">{prod.sku}</span>
                      <StockBadge status={prod.stock.status} availableCount={prod.stock.available} unit={prod.unit} />
                    </div>
                    <h4 className="text-xs font-bold text-ink line-clamp-2 leading-tight">
                      {prod.name}
                    </h4>
                  </div>

                  <div className="pt-2 mt-2 border-t border-border flex items-baseline justify-between">
                    <span className="text-[10px] text-muted">Tier {appliedTier}:</span>
                    <span className="text-xs font-extrabold text-ink tabular-nums">
                      {formatIDR(unitPrice)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: POS Cart & Checkout Terminal (~40%, 5 cols) */}
        <div className="lg:col-span-5 flex flex-col bg-surface rounded-2xl border border-border shadow-xs overflow-hidden h-[calc(100vh-280px)]">
          {/* Cart Header */}
          <div className="p-3.5 border-b border-border bg-canvas/70 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-magenta-500" />
              <span className="font-bold text-ink">
                Keranjang Transaksi ({cartItems.length} item)
              </span>
            </div>
            {cartItems.length > 0 && (
              <button
                type="button"
                onClick={handleResetCart}
                className="text-muted hover:text-danger flex items-center gap-1 transition-colors"
                title="Batal transaksi"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Batal</span>
              </button>
            )}
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 divide-y divide-border/60">
            {cartItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted text-xs">
                <ShoppingBag className="w-8 h-8 text-muted/60 mb-2 stroke-[1.5]" />
                <p className="font-semibold text-ink">Keranjang Kasir Kosong</p>
                <p className="mt-1 max-w-[200px]">
                  Ketik nama/barcode barang atau klik produk di katalog sebelah kiri.
                </p>
              </div>
            ) : (
              cartItems.map((item) => (
                <div key={item.product.id} className="pt-2.5 first:pt-0 space-y-1.5 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-ink leading-tight">{item.product.name}</p>
                      <div className="flex items-center gap-1.5 text-[11px] text-muted mt-0.5">
                        <PriceTierBadge tier={item.appliedTier} size="sm" />
                        <span>•</span>
                        <span className="tabular-nums">{formatIDR(item.unitPrice)}/{item.product.unit}</span>
                      </div>
                    </div>
                    <span className="font-extrabold text-ink tabular-nums text-sm">
                      {formatIDR(item.subtotal)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-muted">
                      Stok: {item.product.stock.available} {item.product.unit}
                    </span>

                    <div className="flex items-center gap-1">
                      <div className="inline-flex items-center rounded border border-border bg-canvas">
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.product.id, item.quantity - 1)}
                          className="px-1.5 py-0.5 text-muted hover:text-ink"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center font-bold text-ink text-xs">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.product.id, item.quantity + 1)}
                          disabled={item.quantity >= item.product.stock.available}
                          className="px-1.5 py-0.5 text-muted hover:text-ink disabled:opacity-30"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.product.id)}
                        className="p-1 text-muted hover:text-danger rounded ml-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Cart Footer: Totals & Pay Button */}
          <div className="p-4 border-t border-border bg-canvas/80 space-y-3">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-muted">
                <span>Subtotal</span>
                <span className="font-semibold text-ink tabular-nums">{formatIDR(totals.subtotal)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted">Diskon Kasir</span>
                <div className="flex items-center gap-1">
                  <span className="text-muted text-[11px]">Rp</span>
                  <input
                    type="number"
                    min={0}
                    max={totals.subtotal}
                    value={discount || ''}
                    onChange={(e) => setDiscount(Math.max(0, parseInt(e.target.value) || 0))}
                    placeholder="0"
                    className="w-20 px-1.5 py-0.5 text-right text-xs bg-surface border border-border rounded tabular-nums font-semibold"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-border space-y-1.5">
                <div className="flex justify-between items-baseline text-xs">
                  <span className="text-muted">Belanja Baru:</span>
                  <span className="font-semibold text-ink tabular-nums">{formatIDR(totals.grandTotal)}</span>
                </div>
                {previousDebt > 0 && (
                  <div className="flex justify-between items-baseline text-xs text-danger font-medium bg-red-50/70 px-2 py-1 rounded">
                    <span>Piutang Sebelumnya:</span>
                    <span className="font-bold tabular-nums">+{formatIDR(previousDebt)}</span>
                  </div>
                )}
                <div className="flex justify-between items-baseline pt-1">
                  <span className="text-xs font-bold text-ink uppercase">Total Tagihan:</span>
                  <span className="text-xl font-extrabold text-magenta-700 tabular-nums">
                    {formatIDR(activeBill)}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              disabled={cartItems.length === 0}
              onClick={openPaymentModal}
              className="w-full py-3 rounded-xl bg-magenta-500 hover:bg-magenta-700 disabled:opacity-40 text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-colors"
            >
              <CreditCard className="w-4 h-4" />
              <span>Bayar Transaksi (F2)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Payment Modal Dialog */}
      {paymentDialogOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-xs"
        >
          <div className="bg-surface rounded-2xl border border-border shadow-2xl max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-ink">Pembayaran Transaksi POS</h3>
              <button
                type="button"
                onClick={() => setPaymentDialogOpen(false)}
                className="text-muted hover:text-ink p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Total due display */}
            <div className="bg-canvas p-4 rounded-xl border border-border text-center space-y-2.5">
              {previousDebt > 0 && (
                <div className="flex items-center justify-between p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 text-left">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="chk-include-debt"
                      checked={includePreviousDebt}
                      onChange={(e) => {
                        const inc = e.target.checked;
                        setIncludePreviousDebt(inc);
                        const newTarget = inc ? totals.grandTotal + previousDebt : totals.grandTotal;
                        setCashReceived(newTarget);
                      }}
                      className="w-4 h-4 text-magenta-600 rounded cursor-pointer shrink-0"
                    />
                    <label htmlFor="chk-include-debt" className="cursor-pointer font-medium leading-tight">
                      <span>Gabungkan dengan Piutang Sebelumnya ({formatIDR(previousDebt)})</span>
                      <span className="block text-[11px] text-muted">
                        Total tagihan berjalan akan otomatis menjumlah belanja baru + hutang lama.
                      </span>
                    </label>
                  </div>
                </div>
              )}

              <div>
                <span className="text-xs text-muted block">Total Tagihan Pembayaran:</span>
                <span className="text-3xl font-extrabold text-magenta-700 tabular-nums mt-0.5 block">
                  {formatIDR(activeBill)}
                </span>
                {includePreviousDebt && previousDebt > 0 && (
                  <span className="text-[11px] text-muted block mt-1">
                    Rincian: Belanja Baru {formatIDR(totals.grandTotal)} + Piutang Lama {formatIDR(previousDebt)}
                  </span>
                )}
              </div>
            </div>

            {/* Payment method selector */}
            <div className="space-y-2 text-xs">
              <label className="font-semibold text-ink block">Metode Pembayaran:</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('CASH');
                    if (cashReceived === 0) setCashReceived(activeBill);
                  }}
                  className={`p-2.5 rounded-lg border font-bold text-center transition-colors ${
                    paymentMethod === 'CASH' && cashReceived > 0
                      ? 'border-magenta-500 bg-magenta-50 text-magenta-700'
                      : 'border-border bg-canvas hover:bg-surface text-ink'
                  }`}
                >
                  Tunai (Cash)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('CASH');
                    setCashReceived(0);
                  }}
                  className={`p-2.5 rounded-lg border font-bold text-center transition-colors ${
                    paymentMethod === 'CASH' && cashReceived === 0
                      ? 'border-amber-500 bg-amber-50 text-amber-700'
                      : 'border-border bg-canvas hover:bg-surface text-ink'
                  }`}
                >
                  Kasbon / Bon
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('BANK_TRANSFER_MANUAL')}
                  className={`p-2.5 rounded-lg border font-bold text-center transition-colors ${
                    paymentMethod === 'BANK_TRANSFER_MANUAL'
                      ? 'border-magenta-500 bg-magenta-50 text-magenta-700'
                      : 'border-border bg-canvas hover:bg-surface text-ink'
                  }`}
                >
                  Transfer Bank
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('PAYMENT_GATEWAY')}
                  className={`p-2.5 rounded-lg border font-bold text-center transition-colors ${
                    paymentMethod === 'PAYMENT_GATEWAY'
                      ? 'border-magenta-500 bg-magenta-50 text-magenta-700'
                      : 'border-border bg-canvas hover:bg-surface text-ink'
                  }`}
                >
                  QRIS Demo
                </button>
              </div>
            </div>

            {/* Cash input and quick buttons */}
            {paymentMethod === 'CASH' && (
              <div className="space-y-3 pt-2 text-xs">
                <div>
                  <label className="font-semibold text-ink block mb-1">
                    Uang Tunai Diterima:
                  </label>
                  <input
                    type="number"
                    autoFocus
                    value={cashReceived === 0 ? '' : cashReceived}
                    placeholder="0 (Kasbon Penuh)"
                    onChange={(e) => setCashReceived(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-3 py-2 text-lg font-bold text-right bg-canvas border border-border rounded-lg tabular-nums focus:ring-2 focus:ring-magenta-500"
                  />
                </div>

                {/* Quick cash denomination buttons */}
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCashReceived(activeBill)}
                    className="px-2.5 py-1 rounded bg-canvas border border-border font-semibold hover:bg-surface text-ink"
                  >
                    Uang Pas ({formatIDR(activeBill)})
                  </button>
                  <button
                    type="button"
                    onClick={() => setCashReceived(0)}
                    className="px-2.5 py-1 rounded bg-amber-50 border border-amber-300 text-amber-800 font-semibold hover:bg-amber-100"
                  >
                    Kasbon (Rp 0)
                  </button>
                  {[50000, 100000, 200000, 500000, 1000000].map((nominal) => (
                    <button
                      key={nominal}
                      type="button"
                      onClick={() => setCashReceived(nominal)}
                      className="px-2.5 py-1 rounded bg-canvas border border-border font-semibold hover:bg-surface tabular-nums"
                    >
                      {formatIDR(nominal)}
                    </button>
                  ))}
                </div>

                {/* Change amount box when paid sufficient */}
                {!isDebtTransaction && (
                  <div className="p-3 rounded-lg bg-surface border border-border flex items-center justify-between text-xs">
                    <span className="text-muted">Kembalian:</span>
                    <span className="text-lg font-extrabold text-success tabular-nums">
                      {formatIDR(changeCalc.change)}
                    </span>
                  </div>
                )}

                {/* Underpayment / Piutang Configuration Card */}
                {isDebtTransaction && (
                  <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-xs space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-amber-200">
                      <div className="flex items-center gap-1.5 text-amber-900 font-bold">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Sisa Piutang Berjalan (Otomatis Terakumulasi):</span>
                      </div>
                      <span className="text-sm font-extrabold text-danger tabular-nums">
                        {formatIDR(remainingDebt)}
                      </span>
                    </div>

                    {/* Customer selector / new customer fields */}
                    <div className="space-y-1.5">
                      <label className="font-semibold text-ink flex items-center justify-between">
                        <span>Debitur / Penerima Kasbon:</span>
                        {selectedCustomer && selectedCustomer.id !== 'cust_umum' && (
                          <span className="text-[11px] text-muted font-normal">
                            Limit: {formatIDR(selectedCustomer.creditLimit)} | Piutang Berjalan: {formatIDR(remainingDebt)}
                          </span>
                        )}
                      </label>

                      <select
                        value={selectedCustomer?.id || 'cust_umum'}
                        onChange={(e) => {
                          const found = customers.find((c) => c.id === e.target.value);
                          setSelectedCustomer(found || null);
                          if (found && found.id !== 'cust_umum') {
                            setDebtCustomerName(found.name);
                            setDebtCustomerPhone(found.phone);
                            setDebtCustomerAddress(found.address || '');
                          } else {
                            setDebtCustomerName('');
                            setDebtCustomerPhone('');
                            setDebtCustomerAddress('');
                          }
                        }}
                        className="w-full px-2.5 py-1.5 bg-canvas border border-amber-300 rounded-lg text-xs font-semibold text-ink focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="cust_umum">+ Daftarkan Pelanggan Baru untuk Kasbon</option>
                        {customers
                          .filter((c) => c.id !== 'cust_umum')
                          .map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} ({c.phone}) - {c.tier} {c.currentDebt > 0 ? `[Hutang: ${formatIDR(c.currentDebt)}]` : ''}
                            </option>
                          ))}
                      </select>

                      {(!selectedCustomer || selectedCustomer.id === 'cust_umum') && (
                        <div className="space-y-2 pt-1 bg-white/60 p-2.5 rounded-lg border border-amber-200">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <span className="text-[11px] text-amber-900 font-semibold block mb-0.5">
                                Nama Pelanggan <span className="text-danger">*</span>
                              </span>
                              <input
                                type="text"
                                value={debtCustomerName}
                                onChange={(e) => setDebtCustomerName(e.target.value)}
                                placeholder="Contoh: Ibu Rahma"
                                className="w-full px-2.5 py-1.5 bg-canvas border border-border rounded-lg text-xs font-medium text-ink focus:ring-2 focus:ring-amber-500"
                              />
                            </div>
                            <div>
                              <span className="text-[11px] text-amber-900 font-semibold block mb-0.5">
                                No. HP / WhatsApp
                              </span>
                              <input
                                type="text"
                                value={debtCustomerPhone}
                                onChange={(e) => setDebtCustomerPhone(e.target.value)}
                                placeholder="0812xxxx"
                                className="w-full px-2.5 py-1.5 bg-canvas border border-border rounded-lg text-xs font-medium text-ink focus:ring-2 focus:ring-amber-500"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Credit limit warning if exceeding */}
                      {selectedCustomer &&
                        selectedCustomer.id !== 'cust_umum' &&
                        remainingDebt > selectedCustomer.creditLimit && (
                          <div className="p-2 rounded bg-rose-50 border border-rose-200 text-danger text-[11px] font-medium">
                            ⚠️ Total piutang ini ({formatIDR(remainingDebt)}) melampaui limit kredit ({formatIDR(selectedCustomer.creditLimit)}).
                          </div>
                        )}
                    </div>

                    {/* Optional note */}
                    <div>
                      <input
                        type="text"
                        value={debtNote}
                        onChange={(e) => setDebtNote(e.target.value)}
                        placeholder="Catatan kasbon (opsional)..."
                        className="w-full px-2.5 py-1.5 bg-canvas border border-amber-200 rounded-lg text-xs text-ink focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {paymentMethod !== 'CASH' && (
              <div className="p-4 rounded-xl bg-sage-50 border border-sage-200 text-xs text-sage-700">
                <p className="font-semibold">Simulasi Non-Tunai:</p>
                <p className="mt-1">
                  Pembayaran non-tunai langsung dianggap lunas otomatis dalam mode demo POS.
                </p>
              </div>
            )}

            {/* Modal Actions */}
            <div className="pt-3 border-t border-border flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setPaymentDialogOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-lg border border-border text-ink hover:bg-canvas"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={
                  isProcessing ||
                  (isDebtTransaction &&
                    (!selectedCustomer || selectedCustomer.id === 'cust_umum') &&
                    !debtCustomerName.trim())
                }
                onClick={handleProcessPayment}
                className={`px-5 py-2 text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors ${
                  isDebtTransaction
                    ? (!selectedCustomer || selectedCustomer.id === 'cust_umum') && !debtCustomerName.trim()
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                      : 'bg-amber-600 hover:bg-amber-700 text-white'
                    : 'bg-magenta-500 hover:bg-magenta-700 disabled:opacity-40 text-white'
                }`}
              >
                {isProcessing
                  ? 'Menyimpan...'
                  : isDebtTransaction
                  ? (!selectedCustomer || selectedCustomer.id === 'cust_umum') && !debtCustomerName.trim()
                    ? 'Isi Nama Pelanggan'
                    : effectiveCash === 0
                    ? 'Catat Bon Utang Penuh'
                    : `Selesaikan & Catat Piutang ${formatIDR(remainingDebt)}`
                  : 'Selesaikan Pembayaran'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Completed Order & Printable Receipt Preview Modal */}
      {completedOrder && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-xs"
        >
          <div className="bg-surface rounded-2xl border border-border shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="text-center space-y-1">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 ${
                completedReceivable ? 'bg-amber-100 text-amber-700' : 'bg-emerald-50 text-success'
              }`}>
                {completedReceivable ? (
                  <BookOpen className="w-7 h-7" />
                ) : (
                  <CheckCircle2 className="w-7 h-7" />
                )}
              </div>
              <h3 className="text-lg font-bold text-ink">
                {completedReceivable ? 'Transaksi Berhasil (Piutang Dicatat)' : 'Transaksi Berhasil!'}
              </h3>
              <p className="text-xs text-muted">
                Nomor: <strong className="font-mono text-ink">{completedOrder.orderNumber}</strong>
              </p>
              {completedReceivable && (
                <p className="text-[11px] text-amber-800 font-medium">
                  Sisa tagihan {formatIDR(completedReceivable.remainingAmount)} otomatis masuk ke modul Buku Piutang.
                </p>
              )}
            </div>

            {/* Printable Receipt Box */}
            <div
              id="printable-receipt"
              className="bg-canvas p-4 rounded-xl border border-border font-mono text-xs text-ink space-y-3"
            >
              <div className="text-center space-y-0.5 border-b border-dashed border-border pb-2">
                {storeProfile.logoUrl && (
                  <div className="flex justify-center mb-1">
                    <img
                      src={storeProfile.logoUrl}
                      alt="Logo Toko"
                      className="h-10 w-10 object-contain rounded"
                    />
                  </div>
                )}
                <p className="font-bold text-sm uppercase">{storeProfile.name}</p>
                <p className="text-[10px] text-muted">{storeProfile.address}</p>
                <p className="text-[10px] text-muted">Telp/WA: {storeProfile.phone}</p>
              </div>

              <div className="flex justify-between text-[11px] text-muted">
                <span>{formatDateTime(completedOrder.createdAt)}</span>
                <span>Kasir: {currentUser.name.split(' ')[0]}</span>
              </div>

              <div className="border-b border-dashed border-border pb-2 space-y-1.5">
                {completedOrder.items.map((it: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-start">
                    <div className="pr-2">
                      <p className="font-semibold text-ink">{it.productName}</p>
                      <p className="text-[10px] text-muted">
                        {it.quantity} {it.unit} x {formatIDR(it.unitPrice)} ({it.tier})
                      </p>
                    </div>
                    <span className="font-bold tabular-nums shrink-0">{formatIDR(it.subtotal)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="tabular-nums font-semibold">{formatIDR(completedOrder.subtotal)}</span>
                </div>
                {completedOrder.discount > 0 && (
                  <div className="flex justify-between text-success">
                    <span>Diskon:</span>
                    <span className="tabular-nums font-semibold">-{formatIDR(completedOrder.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm pt-1 border-t border-dashed border-border">
                  <span>TOTAL:</span>
                  <span className="tabular-nums">{formatIDR(completedOrder.grandTotal)}</span>
                </div>
                <div className="flex justify-between text-[11px] text-muted pt-1">
                  <span>Bayar ({completedOrder.paymentMethod}):</span>
                  <span className="tabular-nums font-semibold">{formatIDR(completedOrder.paidAmount)}</span>
                </div>
                {completedOrder.changeAmount > 0 && (
                  <div className="flex justify-between text-[11px] text-muted">
                    <span>Kembalian:</span>
                    <span className="tabular-nums font-bold text-ink">
                      {formatIDR(completedOrder.changeAmount)}
                    </span>
                  </div>
                )}

                {/* Piutang Details on Receipt */}
                {completedReceivable && (
                  <div className="pt-2 mt-1 border-t border-dashed border-border space-y-1 text-[11px]">
                    <div className="flex justify-between font-bold text-amber-800">
                      <span>SISA PIUTANG AKUMULATIF:</span>
                      <span className="tabular-nums">{formatIDR(completedReceivable.remainingAmount)}</span>
                    </div>
                    <div className="flex justify-between text-muted">
                      <span>Debitur:</span>
                      <span>{completedReceivable.customerName}</span>
                    </div>
                    <div className="text-center font-bold text-amber-800 uppercase pt-1 tracking-wider text-[10px]">
                      *** STATUS: {completedOrder.paidAmount > 0 ? 'KURANG BAYAR (DP)' : 'BON UTANG PENUH'} ***
                    </div>
                  </div>
                )}
              </div>

              <div className="text-center text-[10px] text-muted pt-2 border-t border-dashed border-border leading-relaxed">
                <p>{storeProfile.receiptFooter}</p>
              </div>
            </div>

            {/* Actions: Print, Book Piutang, New Transaction */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 min-w-[120px] py-2.5 px-3 rounded-xl border border-border bg-canvas hover:bg-surface font-semibold text-xs text-ink flex items-center justify-center gap-1.5 transition-colors"
              >
                <Printer className="w-4 h-4 text-sage-500" />
                <span>Cetak Struk</span>
              </button>

              {completedReceivable && (
                <Link
                  to="/app/piutang"
                  className="flex-1 min-w-[120px] py-2.5 px-3 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 font-bold text-xs text-amber-800 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Buku Piutang</span>
                </Link>
              )}

              <button
                type="button"
                onClick={startNewTransaction}
                className="flex-1 min-w-[120px] py-2.5 px-3 rounded-xl bg-magenta-500 hover:bg-magenta-700 font-bold text-xs text-white shadow-sm transition-colors text-center"
              >
                Transaksi Baru (F9)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Penutupan Kasir & Rekonsiliasi Tutup Buku */}
      {shiftModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-surface rounded-2xl border border-border shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden animate-scale-up">
            {/* Modal Header */}
            <div className="p-5 border-b border-border flex items-center justify-between bg-canvas/60">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-ink">Penutupan Kasir (Tutup Shift)</h3>
                  <p className="text-xs text-ink-muted">
                    Rekonsiliasi kas laci dan ajukan tutup buku ke Owner
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShiftModalOpen(false)}
                className="text-ink-muted hover:text-ink p-1.5 rounded-lg hover:bg-canvas transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {shiftSuccessSent ? (
              /* Success View After Sending to Owner */
              <div className="p-6 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-ink">Laporan Tutup Kasir Terkirim!</h4>
                  <p className="text-xs text-ink-muted mt-1 max-w-xs mx-auto">
                    Laporan rekonsiliasi kasir telah dikirimkan ke akun <strong>Owner</strong> untuk diverifikasi dan disetujui.
                  </p>
                </div>

                <div className="p-3 bg-canvas border border-border rounded-xl text-xs space-y-1.5 max-w-sm mx-auto text-left">
                  <div className="flex justify-between">
                    <span className="text-ink-muted">Nomor Shift:</span>
                    <span className="font-mono font-bold text-ink">{sentShiftNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-muted">Kasir:</span>
                    <span className="font-semibold text-ink">{currentUser.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-muted">Uang Fisik Disetor:</span>
                    <span className="font-bold text-emerald-700">{formatIDR(physicalCashInput)}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-border">
                    <span className="text-ink-muted">Status:</span>
                    <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      Menunggu Persetujuan Owner
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShiftModalOpen(false)}
                    className="w-full py-2.5 px-4 bg-sage hover:bg-sage-dark text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
                  >
                    Selesai & Tutup
                  </button>
                </div>
              </div>
            ) : (
              /* Shift Closing Form */
              <form onSubmit={handleSubmitShiftClosure} className="p-5 space-y-4 overflow-y-auto">
                {/* Cashier & Timing summary */}
                <div className="grid grid-cols-2 gap-3 p-3 bg-canvas rounded-xl text-xs">
                  <div>
                    <span className="text-ink-muted block text-[11px]">Kasir Bertugas:</span>
                    <span className="font-bold text-ink">{currentUser.name}</span>
                  </div>
                  <div>
                    <span className="text-ink-muted block text-[11px]">Waktu Penutupan:</span>
                    <span className="font-semibold text-ink">{formatDateTime(new Date().toISOString())}</span>
                  </div>
                </div>

                {/* System Sales Summary */}
                <div className="p-3.5 bg-canvas rounded-xl border border-border space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-ink-muted">Modal Kas Awal di Laci:</span>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-semibold text-ink">Rp</span>
                      <input
                        type="number"
                        min="0"
                        value={shiftInitialCash}
                        onChange={(e) => setShiftInitialCash(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-28 px-2 py-1 text-right bg-white border border-border rounded font-bold text-ink"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-ink-muted">Penjualan Tunai POS Hari Ini:</span>
                    <span className="font-semibold text-ink">{formatIDR(shiftCashSales)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-ink-muted">Penjualan Non-Tunai (QRIS / Transfer):</span>
                    <span className="font-semibold text-ink">{formatIDR(shiftNonCashSales)}</span>
                  </div>

                  <div className="flex justify-between pt-2 border-t border-dashed border-border font-bold">
                    <span className="text-ink">Total Kas Seharusnya di Laci:</span>
                    <span className="text-sm text-sage-dark tabular-nums">
                      {formatIDR(shiftSystemExpectedCash)}
                    </span>
                  </div>
                </div>

                {/* Physical Cash Input */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-ink">
                    Hitung Uang Fisik Aktual di Laci Kasir (Rp) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-ink-muted">
                      Rp
                    </span>
                    <input
                      type="number"
                      min="0"
                      required
                      placeholder="0"
                      value={physicalCashInput || ''}
                      onChange={(e) => setPhysicalCashInput(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-border focus:border-sage rounded-xl font-extrabold text-base text-ink tabular-nums focus:outline-none"
                    />
                  </div>
                  <p className="text-[11px] text-ink-muted">
                    Hitung seluruh uang kertas dan koin di laci kasir saat penutupan.
                  </p>
                </div>

                {/* Difference Indicator */}
                <div
                  className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold ${
                    shiftDifference === 0
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : shiftDifference < 0
                      ? 'bg-rose-50 border-rose-200 text-rose-800'
                      : 'bg-blue-50 border-blue-200 text-blue-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {shiftDifference === 0 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="w-4 h-4" />
                    )}
                    <span>Selisih Kas Laci:</span>
                  </div>
                  <span className="text-sm tabular-nums">
                    {shiftDifference === 0
                      ? 'Cocok Sempurna (Rp 0)'
                      : shiftDifference < 0
                      ? `Kurang ${formatIDR(Math.abs(shiftDifference))}`
                      : `Lebih +${formatIDR(shiftDifference)}`}
                  </span>
                </div>

                {/* If Discrepancy Exists: Show Reasons & Notes */}
                {shiftDifference !== 0 && (
                  <div className="p-3.5 bg-rose-50/60 border border-rose-200 rounded-xl space-y-3 animate-fade-in">
                    <div>
                      <label className="block text-xs font-bold text-rose-900 mb-1">
                        Pilih Alasan Terjadinya Selisih Kas <span className="text-rose-600">*</span>
                      </label>
                      <select
                        required
                        value={differenceReason}
                        onChange={(e) => setDifferenceReason(e.target.value)}
                        className="w-full px-3 py-2 border border-rose-300 rounded-lg text-xs bg-white text-ink font-semibold focus:outline-none focus:ring-2 focus:ring-rose-400"
                      >
                        <option value="Uang kembalian koin/receh tidak ada / selisih pembulatan nota">
                          1. Uang kembalian koin/receh tidak ada / selisih pembulatan nota
                        </option>
                        <option value="Kelebihan uang kembalian diberikan ke pelanggan">
                          2. Kelebihan uang kembalian diberikan ke pelanggan
                        </option>
                        <option value="Kekurangan uang kembalian dari pelanggan">
                          3. Kekurangan uang kembalian dari pelanggan
                        </option>
                        <option value="Pengeluaran kas operasional mendesak belum sempat dicatat">
                          4. Pengeluaran kas operasional mendesak belum sempat dicatat
                        </option>
                        <option value="Uang kasbon kasir / bon sementara tertinggal di laci">
                          5. Uang kasbon kasir / bon sementara tertinggal di laci
                        </option>
                        <option value="Kelebihan / kekurangan modal kas awal saat buka shift">
                          6. Kelebihan / kekurangan modal kas awal saat buka shift
                        </option>
                        <option value="Uang palsu / rusak / sobek ditemukan">
                          7. Uang palsu / rusak / sobek ditemukan
                        </option>
                        <option value="Lainnya (jelaskan pada catatan detail di bawah)">
                          8. Lainnya (jelaskan pada catatan detail di bawah)
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-rose-900 mb-1">
                        Penjelasan / Catatan Kasir ke Owner
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Contoh: Ada 4 transaksi receh yang dibulatkan karena stok koin 500 habis..."
                        value={differenceNotes}
                        onChange={(e) => setDifferenceNotes(e.target.value)}
                        className="w-full px-3 py-2 border border-rose-300 rounded-lg text-xs bg-white text-ink focus:outline-none focus:ring-2 focus:ring-rose-400"
                      />
                    </div>
                  </div>
                )}

                {/* Notice to Owner */}
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                  <Send className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <p>
                    Saat tombol di bawah diklik, laporan penutupan ini akan <strong>otomatis dikirimkan ke Owner</strong> untuk ditinjau dan disetujui.
                  </p>
                </div>

                {/* Footer Buttons */}
                <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setShiftModalOpen(false)}
                    className="px-4 py-2 border border-border hover:bg-canvas text-ink text-xs font-semibold rounded-lg transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingShift}
                    className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmittingShift ? 'Mengirim...' : 'Kirim Tutup Buku ke Owner'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

