import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product, CartItem, PriceTier } from '../domain/types';
import { calculateUnitPrice, calculateCartTotals } from '../domain/pricing';
import { useDemoAuth } from './DemoAuthContext';

interface StorefrontCartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
  discount: number;
  shippingFee: number;
  setShippingFee: (fee: number) => void;
  grandTotal: number;
}

const StorefrontCartContext = createContext<StorefrontCartContextType | undefined>(undefined);

export const StorefrontCartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { role, activeCustomer } = useDemoAuth();
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('warung_storefront_cart');
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return [];
  });

  const [shippingFee, setShippingFee] = useState<number>(10000); // Default estimasi kurir toko

  const currentTier: PriceTier = role === 'CUSTOMER' && activeCustomer ? activeCustomer.tier : 'RETAIL';

  // Recalculate prices whenever customer tier changes
  useEffect(() => {
    setItems((prev) =>
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

  // Persist cart to local storage
  useEffect(() => {
    try {
      localStorage.setItem('warung_storefront_cart', JSON.stringify(items));
    } catch {
      // Ignore
    }
  }, [items]);

  const addItem = (product: Product, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      const newQty = existing ? existing.quantity + quantity : quantity;

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
            quantity: newQty,
            appliedTier,
            unitPrice,
            subtotal: unitPrice * newQty,
          },
        ];
      }
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }

    setItems((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          const { unitPrice, appliedTier } = calculateUnitPrice(
            item.product.priceRules,
            currentTier,
            quantity
          );
          return {
            ...item,
            quantity,
            appliedTier,
            unitPrice,
            subtotal: unitPrice * quantity,
          };
        }
        return item;
      })
    );
  };

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setItems([]);
  };

  const totals = calculateCartTotals(items, 0, shippingFee);
  const itemCount = items.reduce((acc, curr) => acc + curr.quantity, 0);

  return (
    <StorefrontCartContext.Provider
      value={{
        items,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        itemCount,
        subtotal: totals.subtotal,
        discount: totals.discount,
        shippingFee: totals.shippingFee,
        setShippingFee,
        grandTotal: totals.grandTotal,
      }}
    >
      {children}
    </StorefrontCartContext.Provider>
  );
};

export function useStorefrontCart(): StorefrontCartContextType {
  const context = useContext(StorefrontCartContext);
  if (!context) {
    throw new Error('useStorefrontCart must be used within a StorefrontCartProvider');
  }
  return context;
};
