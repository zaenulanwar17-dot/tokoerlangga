import React, { useState, useEffect } from 'react';
import { Tags, Plus, Trash2, Save } from 'lucide-react';
import { Product, PriceRule, PriceTier } from '../../domain/types';
import { productRepository } from '../../services';
import { formatIDR } from '../../domain/money';
import { PriceTierBadge } from '../../components/ui/PriceTierBadge';
import { useToast } from '../../context/ToastContext';
import { validatePriceRules } from '../../domain/pricing';

export const PriceTierPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [activeRules, setActiveRules] = useState<PriceRule[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    async function load() {
      const list = await productRepository.list({ isActive: true });
      setProducts(list);
      if (list.length > 0) {
        setSelectedProductId(list[0].id);
        setActiveRules([...list[0].priceRules]);
      }
    }
    load();
  }, []);

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  const handleSelectProduct = (prodId: string) => {
    setSelectedProductId(prodId);
    const prod = products.find((p) => p.id === prodId);
    if (prod) {
      setActiveRules([...prod.priceRules]);
    }
  };

  const handleAddRule = (tier: PriceTier) => {
    const existingTierRules = activeRules.filter((r) => r.tier === tier);
    const maxQty = existingTierRules.reduce((max, r) => Math.max(max, r.minQuantity), 0);
    const newRule: PriceRule = {
      tier,
      minQuantity: maxQty > 0 ? maxQty + 6 : 1,
      unitPrice: existingTierRules.length > 0 ? existingTierRules[existingTierRules.length - 1].unitPrice - 500 : 10000,
    };
    setActiveRules([...activeRules, newRule]);
  };

  const handleUpdateRule = (index: number, field: 'minQuantity' | 'unitPrice', val: number) => {
    setActiveRules((prev) =>
      prev.map((r, i) => (i === index ? { ...r, [field]: val } : r))
    );
  };

  const handleRemoveRule = (index: number) => {
    if (activeRules.length <= 1) {
      showToast('Minimal harus ada 1 aturan harga.', 'error');
      return;
    }
    setActiveRules((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveRules = async () => {
    if (!selectedProduct) return;

    const validation = validatePriceRules(activeRules);
    if (!validation.isValid) {
      showToast(validation.error || 'Aturan harga tidak valid.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      await productRepository.updatePriceRules(selectedProduct.id, activeRules);
      showToast(`Aturan harga untuk ${selectedProduct.name} berhasil disimpan!`, 'success');
      // Refresh local product list
      const updatedList = await productRepository.list({ isActive: true });
      setProducts(updatedList);
    } catch {
      showToast('Gagal menyimpan aturan harga.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const tiers: PriceTier[] = ['RETAIL', 'WHOLESALE_1', 'WHOLESALE_2'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-ink">Editor Aturan Harga Bertingkat</h1>
          <p className="text-xs sm:text-sm text-muted">
            Atur batas kuantitas dan harga satuan per tier (Eceran, Grosir 1, Grosir 2)
          </p>
        </div>

        {selectedProduct && (
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSaveRules}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-magenta-500 hover:bg-magenta-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-sm transition-colors shrink-0"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Menyimpan...' : 'Simpan Perubahan Aturan'}</span>
          </button>
        )}
      </div>

      {/* Product Selector Bar */}
      <div className="bg-surface p-4 rounded-xl border border-border flex flex-wrap items-center gap-4 text-xs">
        <label htmlFor="product-select" className="font-bold text-ink flex items-center gap-1.5 shrink-0">
          <Tags className="w-4 h-4 text-sage-500" />
          Pilih Produk Sembako:
        </label>
        <select
          id="product-select"
          value={selectedProductId}
          onChange={(e) => handleSelectProduct(e.target.value)}
          className="flex-1 min-w-[280px] bg-canvas border border-border rounded-lg px-3 py-2 text-ink font-semibold focus:ring-2 focus:ring-sage-500"
        >
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.sku}) — Modal: {formatIDR(p.costPrice)}
            </option>
          ))}
        </select>
      </div>

      {/* 3 Tier Columns Editor */}
      {selectedProduct && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiers.map((tier) => {
            const tierRulesWithIndex = activeRules
              .map((r, originalIdx) => ({ ...r, originalIdx }))
              .filter((r) => r.tier === tier)
              .sort((a, b) => a.minQuantity - b.minQuantity);

            return (
              <div
                key={tier}
                className="bg-surface rounded-2xl border border-border shadow-xs p-5 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <PriceTierBadge tier={tier} size="md" />
                    <button
                      type="button"
                      onClick={() => handleAddRule(tier)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-magenta-700 hover:text-magenta-500"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah Aturan</span>
                    </button>
                  </div>

                  <p className="text-[11px] text-muted leading-relaxed">
                    {tier === 'RETAIL' && 'Harga standar eceran untuk belanja satuan harian.'}
                    {tier === 'WHOLESALE_1' && 'Harga grosir khusus warung kelontong & pedagang.'}
                    {tier === 'WHOLESALE_2' && 'Harga grosir volume super untuk mitra katering/hajatan.'}
                  </p>

                  {/* Rules list for this tier */}
                  <div className="space-y-2.5 pt-1">
                    {tierRulesWithIndex.length === 0 ? (
                      <div className="p-4 rounded-xl bg-canvas text-center text-xs text-muted border border-dashed border-border">
                        Belum ada aturan tier ini. Akan fallback ke tier Eceran otomatis.
                      </div>
                    ) : (
                      tierRulesWithIndex.map((rule) => (
                        <div
                          key={rule.originalIdx}
                          className="p-3 rounded-xl bg-canvas border border-border flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="space-y-1">
                            <label className="text-[10px] text-muted block">
                              Min Qty ({selectedProduct.unit}):
                            </label>
                            <input
                              type="number"
                              min={1}
                              value={rule.minQuantity}
                              onChange={(e) =>
                                handleUpdateRule(
                                  rule.originalIdx,
                                  'minQuantity',
                                  parseInt(e.target.value) || 1
                                )
                              }
                              className="w-16 px-2 py-1 bg-surface border border-border rounded font-bold text-center"
                            />
                          </div>

                          <div className="flex-1 space-y-1">
                            <label className="text-[10px] text-muted block">
                              Harga Satuan (Rp):
                            </label>
                            <input
                              type="number"
                              min={0}
                              value={rule.unitPrice}
                              onChange={(e) =>
                                handleUpdateRule(
                                  rule.originalIdx,
                                  'unitPrice',
                                  parseInt(e.target.value) || 0
                                )
                              }
                              className="w-full px-2 py-1 bg-surface border border-border rounded font-bold text-right tabular-nums"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveRule(rule.originalIdx)}
                            className="p-1.5 text-muted hover:text-danger rounded self-end mb-0.5"
                            title="Hapus aturan ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-border text-[11px] text-muted">
                  Modal HPP produk ini: <strong>{formatIDR(selectedProduct.costPrice)}</strong>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
