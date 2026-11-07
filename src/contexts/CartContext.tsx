import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { ShopProduct, CartItem } from '../data/shopProducts';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: ShopProduct, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItemsCount: number;
  subtotal: number;
  discount: number;
  promoCode: string | null;
  applyPromoCode: (code: string) => { success: boolean; message: string };
  removePromoCode: () => void;
  total: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  toggleCart: () => void;
}

const CartContext = createContext<CartContextType | null>(null);

const STORAGE_KEY = 'accounticca_shop_cart';
const PROMO_STORAGE_KEY = 'accounticca_shop_promo';

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return [];
      const parsed: CartItem[] = JSON.parse(saved);
      return Array.isArray(parsed)
        ? parsed.map((item) => ({
            ...item,
            product: { 
              ...item.product, 
              price: typeof item.product?.price === 'number' && !isNaN(item.product.price) 
                ? item.product.price 
                : 0 
            }
          }))
        : [];
    } catch {
      return [];
    }
  });

  const [promoCode, setPromoCode] = useState<string | null>(() => {
    try {
      return localStorage.getItem(PROMO_STORAGE_KEY) || null;
    } catch {
      return null;
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [items]);

  useEffect(() => {
    try {
      if (promoCode) {
        localStorage.setItem(PROMO_STORAGE_KEY, promoCode);
      } else {
        localStorage.removeItem(PROMO_STORAGE_KEY);
      }
    } catch {
      // ignore
    }
  }, [promoCode]);

  const addToCart = useCallback((product: ShopProduct, quantity = 1) => {
    const normalizedProduct: ShopProduct = { 
      ...product, 
      price: typeof product.price === 'number' && !isNaN(product.price) ? product.price : 0 
    };
    setItems((prev) => {
      const existing = prev.find((item) => item.product.id === normalizedProduct.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === normalizedProduct.id
            ? { ...item, product: normalizedProduct, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product: normalizedProduct, quantity }];
    });
    setIsCartOpen(true);
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setItems((prev) => prev.filter((item) => item.product.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setItems([]);
    setPromoCode(null);
  }, []);

  const toggleCart = useCallback(() => {
    setIsCartOpen((prev) => !prev);
  }, []);

  const totalItemsCount = useMemo(() => {
    return items.reduce((acc, item) => acc + item.quantity, 0);
  }, [items]);

  const subtotal = useMemo(() => {
    return items.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  }, [items]);

  const discount = useMemo(() => {
    if (!promoCode || subtotal === 0) return 0;
    const code = promoCode.trim().toUpperCase();
    if (code === 'ACCOUNTICCA10') {
      return Math.round(subtotal * 0.10); // 10% off
    }
    if (code === 'COMPLIANCE2026') {
      return Math.min(300, subtotal); // Tk. 300 flat discount
    }
    if (code === 'VIP15') {
      return Math.round(subtotal * 0.15); // 15% off
    }
    return 0;
  }, [subtotal, promoCode]);

  const total = useMemo(() => {
    return Math.max(0, subtotal - discount);
  }, [subtotal, discount]);

  const applyPromoCode = useCallback((code: string) => {
    const clean = code.trim().toUpperCase();
    if (clean === 'ACCOUNTICCA10') {
      setPromoCode('ACCOUNTICCA10');
      return { success: true, message: 'Promo code applied! 10% discount on order.' };
    }
    if (clean === 'COMPLIANCE2026') {
      setPromoCode('COMPLIANCE2026');
      return { success: true, message: 'Promo code applied! Tk. 300 discount on order.' };
    }
    if (clean === 'VIP15') {
      setPromoCode('VIP15');
      return { success: true, message: 'VIP Promo code applied! 15% discount on order.' };
    }
    return { success: false, message: 'Invalid or expired promo code. Try ACCOUNTICCA10' };
  }, []);

  const removePromoCode = useCallback(() => {
    setPromoCode(null);
  }, []);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItemsCount,
        subtotal,
        discount,
        promoCode,
        applyPromoCode,
        removePromoCode,
        total,
        isCartOpen,
        setIsCartOpen,
        toggleCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
