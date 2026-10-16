import { PriceRule, PriceTier, StockStatus } from './types';

/**
 * Menentukan harga satuan berdasarkan tier pelanggan dan kuantitas pembelian.
 * Aturan bisnis:
 * 1. Filter aturan sesuai tier yang diminta.
 * 2. Pilih aturan dengan minQuantity tertinggi yang <= kuantitas pembelian.
 * 3. Jika tidak ada aturan untuk tier tersebut yang memenuhi kuantitas,
 *    lakukan fallback ke tier RETAIL (Eceran) dengan minQuantity <= kuantitas.
 * 4. Jika masih tidak ada, fallback ke aturan tier RETAIL dengan minQuantity terkecil.
 * 5. Kuantitas harus >= 1.
 */
export function calculateUnitPrice(
  priceRules: PriceRule[],
  tier: PriceTier,
  quantity: number
): { unitPrice: number; appliedTier: PriceTier; isFallback: boolean } {
  const safeQty = Math.max(1, Math.floor(quantity));

  if (!priceRules || priceRules.length === 0) {
    return { unitPrice: 0, appliedTier: 'RETAIL', isFallback: true };
  }

  // 1. Coba cari aturan yang cocok dengan tier yang diminta dan minQuantity <= safeQty
  const tierRules = priceRules
    .filter((r) => r.tier === tier && r.minQuantity <= safeQty)
    .sort((a, b) => b.minQuantity - a.minQuantity);

  if (tierRules.length > 0) {
    return {
      unitPrice: tierRules[0].unitPrice,
      appliedTier: tier,
      isFallback: false,
    };
  }

  // 2. Fallback: jika tier bukan RETAIL, coba fallback ke RETAIL
  if (tier !== 'RETAIL') {
    const retailRules = priceRules
      .filter((r) => r.tier === 'RETAIL' && r.minQuantity <= safeQty)
      .sort((a, b) => b.minQuantity - a.minQuantity);

    if (retailRules.length > 0) {
      return {
        unitPrice: retailRules[0].unitPrice,
        appliedTier: 'RETAIL',
        isFallback: true,
      };
    }
  }

  // 3. Fallback terakhir: ambil aturan RETAIL dengan minQuantity terkecil, atau aturan apapun yang ada
  const fallbackRetail = priceRules
    .filter((r) => r.tier === 'RETAIL')
    .sort((a, b) => a.minQuantity - b.minQuantity);

  if (fallbackRetail.length > 0) {
    return {
      unitPrice: fallbackRetail[0].unitPrice,
      appliedTier: 'RETAIL',
      isFallback: true,
    };
  }

  // 4. Default aman
  return {
    unitPrice: priceRules[0].unitPrice,
    appliedTier: priceRules[0].tier,
    isFallback: true,
  };
}

/**
 * Menghitung subtotal, diskon, ongkos kirim, dan grand total.
 */
export function calculateCartTotals(
  items: Array<{ unitPrice: number; quantity: number }>,
  discount: number = 0,
  shippingFee: number = 0
): {
  subtotal: number;
  discount: number;
  shippingFee: number;
  grandTotal: number;
} {
  const subtotal = items.reduce((acc, item) => {
    const qty = Math.max(0, item.quantity);
    const price = Math.max(0, item.unitPrice);
    return acc + qty * price;
  }, 0);

  const safeDiscount = Math.min(Math.max(0, discount), subtotal);
  const safeShipping = Math.max(0, shippingFee);
  const grandTotal = Math.max(0, subtotal - safeDiscount + safeShipping);

  return {
    subtotal,
    discount: safeDiscount,
    shippingFee: safeShipping,
    grandTotal,
  };
}

/**
 * Menghitung stok yang tersedia: available = onHand - reserved.
 */
export function calculateAvailableStock(onHand: number, reserved: number): number {
  const safeOnHand = Math.max(0, onHand || 0);
  const safeReserved = Math.max(0, reserved || 0);
  return Math.max(0, safeOnHand - safeReserved);
}

/**
 * Menentukan status stok: IN_STOCK, LOW_STOCK, atau OUT_OF_STOCK.
 */
export function calculateStockStatus(
  onHand: number,
  reserved: number,
  minStockAlert: number
): StockStatus {
  const available = calculateAvailableStock(onHand, reserved);
  if (available <= 0) {
    return 'OUT_OF_STOCK';
  }
  if (available <= minStockAlert) {
    return 'LOW_STOCK';
  }
  return 'IN_STOCK';
}

/**
 * Validasi kuantitas untuk transaksi / keranjang.
 */
export function validateQuantity(
  qty: number,
  availableStock?: number
): { isValid: boolean; error?: string } {
  if (typeof qty !== 'number' || isNaN(qty)) {
    return { isValid: false, error: 'Kuantitas harus berupa angka valid.' };
  }
  if (qty <= 0) {
    return { isValid: false, error: 'Kuantitas harus lebih dari 0.' };
  }
  if (!Number.isInteger(qty)) {
    return { isValid: false, error: 'Kuantitas harus bilangan bulat.' };
  }
  if (availableStock !== undefined && qty > availableStock) {
    return {
      isValid: false,
      error: `Kuantitas melebihi stok tersedia (${availableStock}).`,
    };
  }
  return { isValid: true };
}

/**
 * Validasi aturan harga tidak tumpang tindih untuk tier dan kuantitas yang sama.
 */
export function validatePriceRules(rules: PriceRule[]): {
  isValid: boolean;
  error?: string;
} {
  if (!rules || rules.length === 0) {
    return { isValid: false, error: 'Minimal harus ada 1 aturan harga.' };
  }

  const seen = new Set<string>();
  for (const r of rules) {
    if (r.minQuantity < 1) {
      return {
        isValid: false,
        error: `Aturan tier ${r.tier}: batas kuantitas minimal 1.`,
      };
    }
    if (r.unitPrice < 0) {
      return {
        isValid: false,
        error: `Aturan tier ${r.tier}: harga tidak boleh negatif.`,
      };
    }
    const key = `${r.tier}_${r.minQuantity}`;
    if (seen.has(key)) {
      return {
        isValid: false,
        error: `Terdapat duplikasi aturan tier ${r.tier} untuk batas kuantitas ${r.minQuantity}.`,
      };
    }
    seen.add(key);
  }

  return { isValid: true };
}

/**
 * Menghitung kembalian uang tunai.
 */
export function calculateCashChange(
  grandTotal: number,
  cashReceived: number
): { change: number; isSufficient: boolean } {
  const safeTotal = Math.max(0, grandTotal);
  const safeReceived = Math.max(0, cashReceived);
  const change = safeReceived - safeTotal;
  return {
    change: Math.max(0, change),
    isSufficient: change >= 0,
  };
}

/**
 * Menentukan status piutang berdasarkan sisa tagihan dan tanggal jatuh tempo (opsional).
 */
export function calculateReceivableStatus(
  remainingAmount: number,
  totalAmount: number,
  dueDate?: string
): 'UNPAID' | 'PARTIAL' | 'PAID' | 'OVERDUE' {
  if (remainingAmount <= 0) {
    return 'PAID';
  }
  if (dueDate) {
    const isOverdue = new Date(dueDate).getTime() < new Date().setHours(0, 0, 0, 0);
    if (isOverdue) {
      return 'OVERDUE';
    }
  }
  if (remainingAmount < totalAmount) {
    return 'PARTIAL';
  }
  return 'UNPAID';
}
