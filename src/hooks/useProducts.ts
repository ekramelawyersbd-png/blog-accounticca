import { useState, useEffect, useCallback } from 'react';
import { ShopProduct } from '../data/shopProducts';
import { 
  getLocalProducts, 
  fetchProducts, 
  saveProduct as apiSaveProduct, 
  deleteProduct as apiDeleteProduct, 
  resetProductsToDefault as apiResetDefault,
  updateProductPrice as apiUpdatePrice,
  PRODUCTS_UPDATE_EVENT 
} from '../services/productService';

export function useProducts() {
  const [products, setProducts] = useState<ShopProduct[]>(getLocalProducts);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    // Listen to custom update events across windows/components
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<ShopProduct[]>;
      if (customEvent.detail && Array.isArray(customEvent.detail)) {
        setProducts(customEvent.detail);
      } else {
        setProducts(getLocalProducts());
      }
    };

    window.addEventListener(PRODUCTS_UPDATE_EVENT, handleUpdate);

    // Initial fetch from Firestore / sync
    fetchProducts()
      .then((items) => {
        if (isMounted) {
          setProducts(items);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err?.message || 'Error loading products');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
      window.removeEventListener(PRODUCTS_UPDATE_EVENT, handleUpdate);
    };
  }, []);

  const addOrUpdateProduct = useCallback(async (product: ShopProduct) => {
    try {
      const saved = await apiSaveProduct(product);
      setProducts(getLocalProducts());
      return saved;
    } catch (err: any) {
      setError(err?.message || 'Failed to save product');
      throw err;
    }
  }, []);

  const updatePrice = useCallback(async (id: string, price: number, originalPrice?: number) => {
    try {
      const saved = await apiUpdatePrice(id, price, originalPrice);
      setProducts(getLocalProducts());
      return saved;
    } catch (err: any) {
      setError(err?.message || 'Failed to update price');
      throw err;
    }
  }, []);

  const removeProduct = useCallback(async (id: string) => {
    try {
      await apiDeleteProduct(id);
      setProducts(getLocalProducts());
    } catch (err: any) {
      setError(err?.message || 'Failed to delete product');
      throw err;
    }
  }, []);

  const resetDefaults = useCallback(async () => {
    try {
      const reset = await apiResetDefault();
      setProducts(reset);
      return reset;
    } catch (err: any) {
      setError(err?.message || 'Failed to reset products');
      throw err;
    }
  }, []);

  const getProductBySlug = useCallback((slug: string): ShopProduct | undefined => {
    return products.find(p => p.slug === slug || p.id === slug);
  }, [products]);

  const togglePublishStatus = useCallback(async (id: string) => {
    const current = products.find(p => p.id === id);
    if (!current) return;
    const newStatus: 'published' | 'draft' = current.status === 'draft' ? 'published' : 'draft';
    const updated: ShopProduct = { ...current, status: newStatus };
    return await addOrUpdateProduct(updated);
  }, [products, addOrUpdateProduct]);

  return {
    products,
    loading,
    error,
    addOrUpdateProduct,
    updatePrice,
    removeProduct,
    resetDefaults,
    getProductBySlug,
    togglePublishStatus
  };
}
