import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where, 
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db, fallbackAuth } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors';
import { 
  getSavedItems, 
  saveItem, 
  removeItem, 
  isItemSaved, 
  SavedItem 
} from '../utils/readingList';
import { mockArticles } from '../data/mockData';

export interface CloudFavoriteRecord {
  id?: string;
  userId: string;
  articleId: string;
  title: string;
  url: string;
  type: string;
  category?: string;
  readTime?: number;
  offlineExcerpt?: string;
  offlineImageUrl?: string;
  authorName?: string;
  createdAt?: any;
}

/**
 * Save an article or guide to both localStorage and Firestore (if authenticated on Firestore project).
 */
export async function saveBookmark(
  item: SavedItem,
  user: User | null
): Promise<{ cloudSaved: boolean }> {
  // 1. Instant local persistence for offline & responsive UI
  saveItem(item);

  // 2. If authenticated on the Firestore project, persist to private Firestore collection
  let cloudSaved = false;
  const firestoreUser = fallbackAuth.currentUser;
  if (user && firestoreUser) {
    const effectiveUid = firestoreUser.uid;
    const favoritesPath = 'favorites';
    try {
      // Use deterministic doc ID: `${effectiveUid}_${item.id}` to avoid duplicates
      const favoriteDocId = `${effectiveUid}_${item.id}`;
      const docRef = doc(db, favoritesPath, favoriteDocId);

      // Enrich fields if missing
      const articleMeta = mockArticles.find(a => a.id === item.id);
      const payload: CloudFavoriteRecord = {
        userId: effectiveUid,
        articleId: item.id,
        title: item.title || articleMeta?.title || 'Saved Legal Guide',
        url: item.url || `/article/${item.id}`,
        type: item.type || 'article',
        category: item.category || articleMeta?.category || 'General Law',
        readTime: item.readTime || articleMeta?.readTime || 5,
        offlineExcerpt: item.offlineExcerpt || articleMeta?.excerpt || '',
        offlineImageUrl: item.offlineImageUrl || articleMeta?.imageUrl || '',
        authorName: item.authorName || articleMeta?.author?.name || 'Legal Analyst',
        createdAt: serverTimestamp()
      };

      await setDoc(docRef, payload, { merge: true });
      cloudSaved = true;
    } catch (error) {
      console.warn('Could not sync bookmark to Firestore:', error);
      try {
        handleFirestoreError(error, OperationType.WRITE, favoritesPath);
      } catch {
        // Suppress to keep client UI functional if offline
      }
    }
  }

  window.dispatchEvent(new CustomEvent('bookmarksUpdated', { detail: { articleId: item.id, saved: true } }));
  return { cloudSaved };
}

/**
 * Remove an article or guide from both localStorage and Firestore (if authenticated on Firestore project).
 */
export async function removeBookmark(
  articleId: string,
  user: User | null
): Promise<{ cloudRemoved: boolean }> {
  // 1. Remove from localStorage
  removeItem(articleId);

  // 2. If authenticated on the Firestore project, remove from Firestore
  let cloudRemoved = false;
  const firestoreUser = fallbackAuth.currentUser;
  if (user && firestoreUser) {
    const effectiveUid = firestoreUser.uid;
    const favoritesPath = 'favorites';
    try {
      // Remove the deterministic doc ID
      const favoriteDocId = `${effectiveUid}_${articleId}`;
      const docRef = doc(db, favoritesPath, favoriteDocId);
      await deleteDoc(docRef);

      // Also clean up any legacy documents created via addDoc
      const q = query(
        collection(db, favoritesPath),
        where('userId', '==', effectiveUid),
        where('articleId', '==', articleId)
      );
      const snapshot = await getDocs(q);
      const deletes = snapshot.docs.map(d => deleteDoc(d.ref));
      await Promise.all(deletes);

      cloudRemoved = true;
    } catch (error) {
      console.warn('Could not delete bookmark from Firestore:', error);
      try {
        handleFirestoreError(error, OperationType.DELETE, favoritesPath);
      } catch {
        // Non-blocking for UI
      }
    }
  }

  window.dispatchEvent(new CustomEvent('bookmarksUpdated', { detail: { articleId, saved: false } }));
  return { cloudRemoved };
}

/**
 * Check if an item is bookmarked locally.
 */
export function checkIsBookmarked(id: string): boolean {
  return isItemSaved(id);
}

/**
 * Fetch all private saved items for a user from Firestore.
 */
export async function fetchUserCloudSavedItems(userId: string): Promise<SavedItem[]> {
  const firestoreUser = fallbackAuth.currentUser;
  if (!firestoreUser) {
    return getSavedItems();
  }
  const effectiveUid = firestoreUser.uid || userId;
  const favoritesPath = 'favorites';
  try {
    const q = query(collection(db, favoritesPath), where('userId', '==', effectiveUid));
    const snapshot = await getDocs(q);

    const items: SavedItem[] = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data() as CloudFavoriteRecord;
      items.push({
        id: data.articleId,
        title: data.title,
        type: (data.type as any) || 'article',
        url: data.url || `/article/${data.articleId}`,
        dateSaved: data.createdAt?.toDate?.() ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
        category: data.category,
        readTime: data.readTime,
        offlineExcerpt: data.offlineExcerpt,
        offlineImageUrl: data.offlineImageUrl,
        authorName: data.authorName
      });
    });

    return items;
  } catch (error) {
    console.warn('Failed to fetch cloud saved items:', error);
    try {
      handleFirestoreError(error, OperationType.LIST, favoritesPath);
    } catch {
      // Fall back to empty array if offline
    }
    return [];
  }
}

/**
 * Subscribe in real time to the user's private saved items in Firestore.
 */
export function subscribeToUserSavedItems(
  userId: string,
  onUpdate: (items: SavedItem[]) => void,
  onError?: (error: Error) => void
): () => void {
  const firestoreUser = fallbackAuth.currentUser;
  if (!firestoreUser) {
    onUpdate(getSavedItems());
    return () => {};
  }

  const effectiveUid = firestoreUser.uid || userId;
  const favoritesPath = 'favorites';
  const q = query(collection(db, favoritesPath), where('userId', '==', effectiveUid));

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const items: SavedItem[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data() as CloudFavoriteRecord;
        items.push({
          id: data.articleId,
          title: data.title,
          type: (data.type as any) || 'article',
          url: data.url || `/article/${data.articleId}`,
          dateSaved: data.createdAt?.toDate?.() ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
          category: data.category,
          readTime: data.readTime,
          offlineExcerpt: data.offlineExcerpt,
          offlineImageUrl: data.offlineImageUrl,
          authorName: data.authorName
        });
      });
      onUpdate(items);
    },
    (error) => {
      console.warn('Real-time bookmark sync error:', error);
      try {
        handleFirestoreError(error, OperationType.GET, favoritesPath);
      } catch (e: any) {
        if (onError) onError(e);
      }
    }
  );

  return unsubscribe;
}

/**
 * Sync local device bookmarks to the logged-in user's private cloud account.
 */
export async function syncLocalBookmarksToCloud(user: User): Promise<number> {
  const localItems = getSavedItems();
  if (!localItems.length) return 0;

  let count = 0;
  for (const item of localItems) {
    try {
      await saveBookmark(item, user);
      count++;
    } catch {
      // Continue next
    }
  }
  return count;
}
