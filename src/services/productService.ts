import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { SHOP_PRODUCTS, ShopProduct, inferProductType } from '../data/shopProducts';
import { getStoredAdminToken } from '../contexts/ShopAuthContext';
import { appendShopProductToSheet } from './shopSheetsSync';

const STORAGE_KEY = 'accounticca_shop_products_catalog';
const PRODUCTS_UPDATE_EVENT = 'accounticca:products-updated';

/**
 * Returns products from local storage cache, falling back to default SHOP_PRODUCTS
 */
export function getLocalProducts(): ShopProduct[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    let parsed: any[] = [];
    if (raw) {
      try {
        parsed = JSON.parse(raw);
      } catch (e) {
        parsed = [];
      }
    }

    const existingMap = new Map<string, any>();
    if (Array.isArray(parsed)) {
      parsed.forEach(p => {
        if (p) {
          if (p.id) existingMap.set(p.id, p);
          if (p.slug) existingMap.set(p.slug, p);
        }
      });
    }

    let modified = false;
    SHOP_PRODUCTS.forEach(sp => {
      if (!existingMap.has(sp.id) && !existingMap.has(sp.slug)) {
        parsed.push(sp);
        existingMap.set(sp.id, sp);
        existingMap.set(sp.slug, sp);
        modified = true;
      } else {
        const found = existingMap.get(sp.id) || existingMap.get(sp.slug);
        if (found) {
          if (sp.brochureUrl && !found.brochureUrl) {
            found.brochureUrl = sp.brochureUrl;
            found.requiresPurchaseToAccess = sp.requiresPurchaseToAccess;
            modified = true;
          }
        }
      }
    });

    if (parsed.length > 0) {
      const normalized = parsed.map((p: any) => ({
        ...p,
        price: typeof p.price === 'number' && !isNaN(p.price) ? p.price : 0,
        originalPrice: typeof p.originalPrice === 'number' && !isNaN(p.originalPrice) ? p.originalPrice : (p.price || 0),
        productType: p.productType || inferProductType(p)
      }));
      if (modified) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
      }
      return normalized;
    }
  } catch (err) {
    console.warn('Could not read products from localStorage:', err);
  }
  return [...SHOP_PRODUCTS];
}

/**
 * Saves products array into localStorage cache and triggers update event
 */
export function setLocalProducts(products: ShopProduct[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    window.dispatchEvent(new CustomEvent(PRODUCTS_UPDATE_EVENT, { detail: products }));
  } catch (err) {
    console.warn('Could not write products to localStorage:', err);
  }
}

/**
 * Loads products from backend API or Firestore, syncing with localStorage.
 */
export async function fetchProducts(): Promise<ShopProduct[]> {
  const token = getStoredAdminToken();

  // 1. Try server-side API (with or without admin auth header)
  try {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch('/api/shop/products', { headers });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.products) && data.products.length > 0) {
        const normalized = data.products.map((p: any) => ({
          ...p,
          price: typeof p.price === 'number' && !isNaN(p.price) ? p.price : (Number(p.price) || 0),
          originalPrice: typeof p.originalPrice === 'number' && !isNaN(p.originalPrice) ? p.originalPrice : (p.price || 0),
          productType: p.productType || inferProductType(p)
        }));
        setLocalProducts(normalized);
        return normalized;
      }
    }
  } catch (apiErr) {
    console.warn('[ProductService] Backend API fetch warning:', apiErr);
  }

  // 2. Fall back to Firestore if configured
  try {
    const snapshot = await getDocs(collection(db, 'products'));
    if (!snapshot.empty) {
      const firestoreProducts: ShopProduct[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const resolvedPrice = typeof data.price === 'number' && !isNaN(data.price) 
          ? data.price 
          : (Number(data.price) || 0);
        firestoreProducts.push({
          id: docSnap.id,
          title: data.title || '',
          slug: data.slug || docSnap.id,
          category: data.category || 'Legal Contracts',
          productType: data.productType || inferProductType({
            title: data.title,
            category: data.category,
            format: data.format
          }),
          price: resolvedPrice,
          originalPrice: Number(data.originalPrice) || resolvedPrice,
          rating: Number(data.rating) || 4.9,
          reviewsCount: Number(data.reviewsCount) || 10,
          format: data.format || 'Digital DOCX / PDF',
          badge: data.badge || undefined,
          shortDescription: data.shortDescription || '',
          fullDescription: data.fullDescription || '',
          governingLaw: data.governingLaw || undefined,
          pagesOrFiles: data.pagesOrFiles || 'Standard Package',
          features: Array.isArray(data.features) ? data.features : [],
          samplePreviewSnippet: data.samplePreviewSnippet || '',
          imageUrl: data.imageUrl || 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&q=80&w=800',
          authorOrVettedBy: data.authorOrVettedBy || 'Accounticca Legal & Tax Practice Group',
          status: (data.status === 'draft' ? 'draft' : 'published')
        } as ShopProduct);
      });

      setLocalProducts(firestoreProducts);
      return firestoreProducts;
    } else {
      const defaults = getLocalProducts();
      seedDefaultProductsToFirestore(defaults).catch((e) => console.warn('Could not seed defaults to firestore:', e));
      return defaults;
    }
  } catch (error) {
    console.warn('Falling back to local products:', error);
    return getLocalProducts();
  }
}

async function seedDefaultProductsToFirestore(products: ShopProduct[]): Promise<void> {
  try {
    for (const prod of products) {
      const docRef = doc(db, 'products', prod.id);
      await setDoc(docRef, {
        ...prod,
        updatedAt: serverTimestamp()
      }, { merge: true });
    }
  } catch (e) {
    console.warn('Error during seeding:', e);
  }
}

/**
 * Saves a new or edited product to backend server, Firestore, and local storage
 */
export async function saveProduct(product: ShopProduct): Promise<ShopProduct> {
  const normalizedProduct: ShopProduct = {
    ...product,
    productType: product.productType || inferProductType(product),
    status: product.status === 'draft' ? 'draft' : 'published'
  };

  // 1. Update local storage first for instant optimistic response
  const current = getLocalProducts();
  const existingIndex = current.findIndex(p => p.id === normalizedProduct.id || p.slug === normalizedProduct.slug);
  
  let updatedList: ShopProduct[];
  if (existingIndex >= 0) {
    updatedList = [...current];
    updatedList[existingIndex] = { ...normalizedProduct };
  } else {
    updatedList = [normalizedProduct, ...current];
  }

  setLocalProducts(updatedList);

  // 2. Sync to Backend Server API
  const token = getStoredAdminToken();
  if (token) {
    try {
      await fetch('/api/shop/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(normalizedProduct)
      });
    } catch (serverErr) {
      console.warn('[ProductService] Backend save warning:', serverErr);
    }
  }

  // 3. Sync to Firestore
  try {
    const docRef = doc(db, 'products', normalizedProduct.id);
    await setDoc(docRef, {
      ...normalizedProduct,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (err) {
    console.warn('Could not save product to Firestore, cached locally:', err);
  }

  // 4. Auto-append to connected Workspace Shop Google Sheet (non-blocking)
  appendShopProductToSheet(normalizedProduct).catch(() => {});

  return normalizedProduct;
}

/**
 * Toggles a product's publication status between 'published' and 'draft'
 */
export async function toggleProductPublishStatus(productId: string): Promise<ShopProduct | null> {
  const current = getLocalProducts();
  const prod = current.find(p => p.id === productId || p.slug === productId);
  if (!prod) return null;

  const newStatus: 'published' | 'draft' = prod.status === 'draft' ? 'published' : 'draft';
  const updated: ShopProduct = { ...prod, status: newStatus };

  // Instant update in local store
  const updatedList = current.map(p => (p.id === prod.id || p.slug === prod.slug ? updated : p));
  setLocalProducts(updatedList);

  // Sync to backend server API
  const token = getStoredAdminToken();
  if (token) {
    try {
      await fetch(`/api/shop/products/${encodeURIComponent(prod.id)}/toggle-publish`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (serverErr) {
      console.warn('[ProductService] Backend toggle warning:', serverErr);
    }
  }

  // Sync to Firestore
  try {
    const docRef = doc(db, 'products', prod.id);
    await setDoc(docRef, {
      ...updated,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (err) {
    console.warn('Could not sync status toggle to Firestore:', err);
  }

  // Auto-append updated status to connected Workspace Shop Google Sheet (non-blocking)
  appendShopProductToSheet(updated).catch(() => {});

  return updated;
}

/**
 * Updates a product's price, immediately updating localStorage, dispatching
 * PRODUCTS_UPDATE_EVENT for real-time Shop page updates, and syncing to backend & Firestore.
 */
export async function updateProductPrice(
  productId: string,
  newPrice: number,
  newOriginalPrice?: number
): Promise<ShopProduct | null> {
  const current = getLocalProducts();
  const prod = current.find(p => p.id === productId || p.slug === productId);
  if (!prod) return null;

  const validPrice = Math.max(0, Number(newPrice) || 0);
  const validOrigPrice = newOriginalPrice !== undefined ? Math.max(0, Number(newOriginalPrice) || 0) : prod.originalPrice;

  const updated: ShopProduct = {
    ...prod,
    price: validPrice,
    originalPrice: validOrigPrice
  };

  // 1. Instant local update & window event dispatch (Shop page updates immediately!)
  const updatedList = current.map(p => (p.id === prod.id || p.slug === prod.slug ? updated : p));
  setLocalProducts(updatedList);

  // 2. Sync to Backend Server API
  const token = getStoredAdminToken();
  if (token) {
    try {
      await fetch(`/api/shop/products/${encodeURIComponent(prod.id)}/price`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ price: validPrice, originalPrice: validOrigPrice })
      });
    } catch (serverErr) {
      console.warn('[ProductService] Backend price update warning:', serverErr);
    }
  }

  // 3. Sync to Firestore
  try {
    const docRef = doc(db, 'products', prod.id);
    await setDoc(docRef, {
      ...updated,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (err) {
    console.warn('Could not sync price update to Firestore:', err);
  }

  // 4. Auto-append updated price to connected Workspace Shop Google Sheet (non-blocking)
  appendShopProductToSheet(updated).catch(() => {});

  return updated;
}

/**
 * Deletes a product from backend server, Firestore, and local storage
 */
export async function deleteProduct(productId: string): Promise<void> {
  const current = getLocalProducts();
  const updatedList = current.filter(p => p.id !== productId && p.slug !== productId);
  setLocalProducts(updatedList);

  const token = getStoredAdminToken();
  if (token) {
    try {
      await fetch(`/api/shop/products/${encodeURIComponent(productId)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (serverErr) {
      console.warn('[ProductService] Backend delete warning:', serverErr);
    }
  }

  try {
    const docRef = doc(db, 'products', productId);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('Could not delete product from Firestore, removed locally:', err);
  }
}

/**
 * Resets product catalog to factory defaults
 */
export async function resetProductsToDefault(): Promise<ShopProduct[]> {
  const defaults = [...SHOP_PRODUCTS];
  setLocalProducts(defaults);

  const token = getStoredAdminToken();
  if (token) {
    try {
      await fetch('/api/shop/products/reset', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (serverErr) {
      console.warn('[ProductService] Backend reset warning:', serverErr);
    }
  }

  try {
    for (const p of defaults) {
      await setDoc(doc(db, 'products', p.id), {
        ...p,
        updatedAt: serverTimestamp()
      }, { merge: true });
    }
  } catch (err) {
    console.warn('Could not reset Firestore, reset locally:', err);
  }

  return defaults;
}

/**
 * Helper to generate a clean URL slug from a product title
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'product-' + Date.now();
}

export { PRODUCTS_UPDATE_EVENT };
