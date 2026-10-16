import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, ShoppingBag, X } from 'lucide-react';
import { Product } from '../../domain/types';
import { productRepository } from '../../services';
import { formatIDR } from '../../domain/money';
import { StockBadge } from '../../components/ui/StockBadge';
import { DEMO_CATEGORIES } from '../../data/demo-data';
import { useStorefrontCart } from '../../context/StorefrontCartContext';
import { useToast } from '../../context/ToastContext';
import { EmptyState } from '../../components/feedback/EmptyState';

export const CatalogPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const selectedCategory = searchParams.get('cat') || '';
  const searchQuery = searchParams.get('q') || '';
  const [filterStock, setFilterStock] = useState<string>('all');

  const { addItem } = useStorefrontCart();
  const { showToast } = useToast();

  useEffect(() => {
    async function load() {
      setLoading(true);
      const list = await productRepository.list({
        isActive: true,
        categoryId: selectedCategory || undefined,
        query: searchQuery || undefined,
      });
      setProducts(list);
      setLoading(false);
    }
    load();
  }, [selectedCategory, searchQuery]);

  const handleCategoryChange = (catId: string) => {
    const params = new URLSearchParams(searchParams);
    if (catId) {
      params.set('cat', catId);
    } else {
      params.delete('cat');
    }
    setSearchParams(params);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const params = new URLSearchParams(searchParams);
    if (val) {
      params.set('q', val);
    } else {
      params.delete('q');
    }
    setSearchParams(params);
  };

  const clearFilters = () => {
    setSearchParams({});
    setFilterStock('all');
  };

  const filteredProducts = products.filter((p) => {
    if (filterStock === 'in_stock') return p.stock.status === 'IN_STOCK';
    if (filterStock === 'low_stock') return p.stock.status === 'LOW_STOCK';
    return true;
  });

  const handleAddToCart = (product: Product, e: React.MouseEvent) => {
    e.preventDefault();
    if (product.stock.available <= 0) {
      showToast(`Stok ${product.name} sedang habis.`, 'error');
      return;
    }
    addItem(product, 1);
    showToast(`1 ${product.unit} ${product.name} ditambahkan ke keranjang!`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-ink">Katalog Sembako</h1>
          <p className="text-xs sm:text-sm text-muted">
            Menampilkan {filteredProducts.length} produk sembako siap pesan
          </p>
        </div>

        {/* Search bar */}
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Cari nama, SKU, barcode..."
            className="w-full pl-9 pr-8 py-2 text-sm bg-surface border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500"
          />
          <Search className="w-4 h-4 text-muted absolute left-3 top-2.5 pointer-events-none" />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                const params = new URLSearchParams(searchParams);
                params.delete('q');
                setSearchParams(params);
              }}
              className="absolute right-2.5 top-2.5 text-muted hover:text-ink"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filter and Categories Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-surface p-3 rounded-xl border border-border">
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto text-xs">
          <button
            type="button"
            onClick={() => handleCategoryChange('')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              !selectedCategory
                ? 'bg-sage-500 text-white font-semibold shadow-xs'
                : 'text-ink-soft hover:bg-canvas'
            }`}
          >
            Semua Kategori
          </button>
          {DEMO_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleCategoryChange(cat.id)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-sage-500 text-white font-semibold shadow-xs'
                  : 'text-ink-soft hover:bg-canvas'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted hidden sm:inline">Status Stok:</span>
          <select
            value={filterStock}
            onChange={(e) => setFilterStock(e.target.value)}
            className="bg-canvas border border-border rounded-lg px-2.5 py-1.5 text-xs text-ink focus:ring-2 focus:ring-sage-500"
          >
            <option value="all">Semua Status</option>
            <option value="in_stock">Tersedia Saja</option>
            <option value="low_stock">Menipis Saja</option>
          </select>

          {(selectedCategory || searchQuery || filterStock !== 'all') && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs text-magenta-700 hover:text-magenta-500 underline font-medium"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Product List Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 rounded-xl bg-surface animate-pulse border border-border p-4" />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <EmptyState
          title="Produk tidak ditemukan"
          description="Tidak ada produk sembako yang cocok dengan filter atau kata kunci pencarian Anda."
          action={{
            label: 'Bersihkan Filter',
            onClick: clearFilters,
          }}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProducts.map((prod) => {
            const retailRule = prod.priceRules.find((r) => r.tier === 'RETAIL' && r.minQuantity === 1);
            const wholesaleRule = prod.priceRules.find((r) => r.tier === 'WHOLESALE_1');
            const displayPrice = retailRule ? retailRule.unitPrice : 0;

            return (
              <div
                key={prod.id}
                className="bg-surface rounded-xl border border-border hover:border-sage-300 hover:shadow-sm transition-all flex flex-col overflow-hidden"
              >
                <div className="p-3 bg-canvas/60 border-b border-border flex items-center justify-between">
                  <span className="text-[11px] font-mono text-muted uppercase">{prod.sku}</span>
                  <StockBadge status={prod.stock.status} availableCount={prod.stock.available} unit={prod.unit} />
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <span className="text-[11px] text-sage-700 font-semibold">{prod.categoryName}</span>
                    <Link
                      to={`/produk/${prod.id}`}
                      className="text-sm font-bold text-ink hover:text-magenta-700 line-clamp-2 mt-0.5 leading-snug"
                    >
                      {prod.name}
                    </Link>
                    <p className="text-xs text-muted line-clamp-2 mt-1">{prod.description}</p>
                  </div>

                  <div className="pt-2 border-t border-border/80">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-muted">Eceran:</span>
                      <span className="text-base font-bold text-ink tabular-nums">
                        {formatIDR(displayPrice)}
                        <span className="text-xs font-normal text-muted">/{prod.unit}</span>
                      </span>
                    </div>

                    {wholesaleRule && (
                      <div className="flex items-center justify-between text-[11px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded mt-1">
                        <span>Grosir min {wholesaleRule.minQuantity}:</span>
                        <span className="font-semibold tabular-nums">
                          {formatIDR(wholesaleRule.unitPrice)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-3 bg-canvas/40 border-t border-border flex items-center gap-2">
                  <Link
                    to={`/produk/${prod.id}`}
                    className="flex-1 py-1.5 text-center text-xs font-semibold rounded-lg border border-border hover:bg-canvas text-ink-soft transition-colors"
                  >
                    Detail
                  </Link>
                  <button
                    type="button"
                    disabled={prod.stock.available <= 0}
                    onClick={(e) => handleAddToCart(prod, e)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-magenta-500 hover:bg-magenta-700 disabled:opacity-40 text-white flex items-center gap-1.5 transition-colors"
                    title="Tambah ke keranjang"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Beli</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
