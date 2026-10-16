import { describe, it, expect } from 'vitest';
import {
  calculateUnitPrice,
  calculateCartTotals,
  calculateAvailableStock,
  calculateStockStatus,
  validateQuantity,
  validatePriceRules,
  calculateCashChange,
  calculateReceivableStatus,
} from '../domain/pricing';
import { PriceRule } from '../domain/types';

describe('Pricing & Tier Rules', () => {
  const sampleRules: PriceRule[] = [
    { tier: 'RETAIL', minQuantity: 1, unitPrice: 15000 },
    { tier: 'RETAIL', minQuantity: 5, unitPrice: 14500 },
    { tier: 'WHOLESALE_1', minQuantity: 1, unitPrice: 14000 },
    { tier: 'WHOLESALE_1', minQuantity: 10, unitPrice: 13500 },
    { tier: 'WHOLESALE_2', minQuantity: 1, unitPrice: 13000 },
    { tier: 'WHOLESALE_2', minQuantity: 20, unitPrice: 12000 },
  ];

  it('mengambil harga eceran dasar jika kuantitas 1 dan tier RETAIL', () => {
    const result = calculateUnitPrice(sampleRules, 'RETAIL', 1);
    expect(result.unitPrice).toBe(15000);
    expect(result.appliedTier).toBe('RETAIL');
    expect(result.isFallback).toBe(false);
  });

  it('mengambil harga eceran diskon bertingkat jika kuantitas >= 5', () => {
    const result = calculateUnitPrice(sampleRules, 'RETAIL', 7);
    expect(result.unitPrice).toBe(14500);
    expect(result.appliedTier).toBe('RETAIL');
  });

  it('mengambil harga Grosir 1 bertingkat jika kuantitas >= 10', () => {
    const result = calculateUnitPrice(sampleRules, 'WHOLESALE_1', 12);
    expect(result.unitPrice).toBe(13500);
    expect(result.appliedTier).toBe('WHOLESALE_1');
  });

  it('fallback ke RETAIL jika tier tidak memiliki aturan khusus yang memenuhi kuantitas', () => {
    const retailOnlyRules: PriceRule[] = [
      { tier: 'RETAIL', minQuantity: 1, unitPrice: 18000 },
    ];
    // Pelanggan dengan tier WHOLESALE_2 belanja produk yang hanya punya harga RETAIL
    const result = calculateUnitPrice(retailOnlyRules, 'WHOLESALE_2', 3);
    expect(result.unitPrice).toBe(18000);
    expect(result.appliedTier).toBe('RETAIL');
    expect(result.isFallback).toBe(true);
  });

  it('tidak memberikan harga grosir murah secara sembarangan jika kuantitas tidak mencukupi', () => {
    const rules: PriceRule[] = [
      { tier: 'RETAIL', minQuantity: 1, unitPrice: 20000 },
      { tier: 'WHOLESALE_1', minQuantity: 12, unitPrice: 17000 },
    ];
    // Customer WHOLESALE_1 beli cuma 2 pcs -> harus dapat RETAIL fallback
    const result = calculateUnitPrice(rules, 'WHOLESALE_1', 2);
    expect(result.unitPrice).toBe(20000);
    expect(result.appliedTier).toBe('RETAIL');
    expect(result.isFallback).toBe(true);
  });
});

describe('Cart Totals & Calculations', () => {
  it('menghitung subtotal dengan benar untuk beberapa item', () => {
    const items = [
      { unitPrice: 15000, quantity: 2 }, // 30.000
      { unitPrice: 20000, quantity: 3 }, // 60.000
    ];
    const totals = calculateCartTotals(items, 5000, 10000);
    expect(totals.subtotal).toBe(90000);
    expect(totals.discount).toBe(5000);
    expect(totals.shippingFee).toBe(10000);
    expect(totals.grandTotal).toBe(95000);
  });

  it('tidak membiarkan diskon melebihi subtotal sehingga grandTotal tidak negatif', () => {
    const items = [{ unitPrice: 10000, quantity: 1 }];
    const totals = calculateCartTotals(items, 25000, 0);
    expect(totals.subtotal).toBe(10000);
    expect(totals.discount).toBe(10000);
    expect(totals.grandTotal).toBe(0);
  });
});

describe('Inventory & Available Stock', () => {
  it('menghitung available stock = onHand - reserved', () => {
    const available = calculateAvailableStock(50, 10);
    expect(available).toBe(40);
  });

  it('available stock tidak boleh negatif meskipun reserved lebih besar', () => {
    const available = calculateAvailableStock(5, 10);
    expect(available).toBe(0);
  });

  it('menentukan status stok IN_STOCK, LOW_STOCK, dan OUT_OF_STOCK', () => {
    expect(calculateStockStatus(20, 2, 5)).toBe('IN_STOCK');
    expect(calculateStockStatus(5, 0, 5)).toBe('LOW_STOCK');
    expect(calculateStockStatus(5, 5, 5)).toBe('OUT_OF_STOCK');
    expect(calculateStockStatus(0, 0, 5)).toBe('OUT_OF_STOCK');
  });
});

describe('Validation Helpers', () => {
  it('validasi kuantitas positif dan integer', () => {
    expect(validateQuantity(0).isValid).toBe(false);
    expect(validateQuantity(-3).isValid).toBe(false);
    expect(validateQuantity(1.5).isValid).toBe(false);
    expect(validateQuantity(5, 3).isValid).toBe(false); // melebihi stok 3
    expect(validateQuantity(5, 10).isValid).toBe(true);
  });

  it('validasi aturan harga mendeteksi duplikasi aturan tier dan minQuantity', () => {
    const validRules: PriceRule[] = [
      { tier: 'RETAIL', minQuantity: 1, unitPrice: 10000 },
      { tier: 'RETAIL', minQuantity: 5, unitPrice: 9000 },
      { tier: 'WHOLESALE_1', minQuantity: 1, unitPrice: 9500 },
    ];
    expect(validatePriceRules(validRules).isValid).toBe(true);

    const duplicateRules: PriceRule[] = [
      { tier: 'RETAIL', minQuantity: 1, unitPrice: 10000 },
      { tier: 'RETAIL', minQuantity: 1, unitPrice: 9500 },
    ];
    expect(validatePriceRules(duplicateRules).isValid).toBe(false);
  });
});

describe('Payment & Receivables', () => {
  it('menghitung uang kembalian tunai', () => {
    const result1 = calculateCashChange(45000, 50000);
    expect(result1.change).toBe(5000);
    expect(result1.isSufficient).toBe(true);

    const result2 = calculateCashChange(50000, 40000);
    expect(result2.change).toBe(0);
    expect(result2.isSufficient).toBe(false);
  });

  it('menentukan status piutang PAID, PARTIAL, UNPAID, atau OVERDUE', () => {
    expect(calculateReceivableStatus(0, 500000, '2026-12-31')).toBe('PAID');
    expect(calculateReceivableStatus(200000, 500000, '2099-12-31')).toBe('PARTIAL');
    expect(calculateReceivableStatus(500000, 500000, '2099-12-31')).toBe('UNPAID');
    expect(calculateReceivableStatus(200000, 500000, '2020-01-01')).toBe('OVERDUE');
  });
});
