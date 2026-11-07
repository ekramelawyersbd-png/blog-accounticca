import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { 
  SavedItem, 
  getSavedItems, 
  saveItem as saveItemLocal, 
  removeItem as removeItemLocal, 
  clearSavedItems as clearLocal 
} from '../utils/readingList';
import { 
  saveBookmark as saveToCloud, 
  removeBookmark as removeFromCloud, 
  subscribeToUserSavedItems, 
  syncLocalBookmarksToCloud 
} from '../services/bookmarkService';
import { mockArticles } from '../data/mockData';

export interface BookmarkFeedback {
  type: 'success' | 'info' | 'removed';
  message: string;
  articleTitle?: string;
  articleId?: string;
}

interface BookmarkContextType {
  savedItems: SavedItem[];
  savedIds: Set<string>;
  isBookmarked: (id: string) => boolean;
  toggleBookmark: (item: Partial<SavedItem> & { id: string; title: string }) => Promise<boolean>;
  saveBookmark: (item: Partial<SavedItem> & { id: string; title: string }) => Promise<void>;
  removeBookmark: (id: string) => Promise<void>;
  clearAllBookmarks: () => Promise<void>;
  syncCloud: () => Promise<number>;
  count: number;
  loading: boolean;
  isSyncing: boolean;
  feedback: BookmarkFeedback | null;
  clearFeedback: () => void;
}

const BookmarkContext = createContext<BookmarkContextType | null>(null);

export const useBookmarks = () => {
  const context = useContext(BookmarkContext);
  if (!context) {
    throw new Error('useBookmarks must be used within a BookmarkProvider');
  }
  return context;
};

export const BookmarkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [savedItems, setSavedItems] = useState<SavedItem[]>(() => getSavedItems());
  const [loading, setLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<BookmarkFeedback | null>(null);

  const showToast = useCallback((toast: BookmarkFeedback) => {
    setFeedback(toast);
    setTimeout(() => {
      setFeedback(prev => (prev === toast ? null : prev));
    }, 4500);
  }, []);

  const clearFeedback = useCallback(() => {
    setFeedback(null);
  }, []);

  // Compute fast lookup set for O(1) checks
  const savedIds = useMemo(() => new Set(savedItems.map(item => item.id)), [savedItems]);

  const isBookmarked = useCallback((id: string) => {
    return savedIds.has(id);
  }, [savedIds]);

  // Sync with Firestore when user changes or on mount
  useEffect(() => {
    let unsubscribeFirestore: (() => void) | null = null;
    setLoading(true);

    if (user) {
      // 1. Initial merge: sync any pre-existing local bookmarks to Firestore
      syncLocalBookmarksToCloud(user).catch(err => {
        console.warn('Initial cloud sync error:', err);
      });

      // 2. Attach real-time Firestore listener for logged-in user
      unsubscribeFirestore = subscribeToUserSavedItems(
        user.uid,
        (cloudItems) => {
          // Merge cloud items with local items
          const localItems = getSavedItems();
          const itemMap = new Map<string, SavedItem>();

          localItems.forEach(item => itemMap.set(item.id, item));
          cloudItems.forEach(item => itemMap.set(item.id, item));

          const merged = Array.from(itemMap.values()).sort(
            (a, b) => new Date(b.dateSaved).getTime() - new Date(a.dateSaved).getTime()
          );

          setSavedItems(merged);
          setLoading(false);
        },
        (error) => {
          console.warn('Real-time bookmark sync fallback:', error);
          setSavedItems(getSavedItems());
          setLoading(false);
        }
      );
    } else {
      // Guest: read purely from localStorage
      setSavedItems(getSavedItems());
      setLoading(false);
    }

    const handleStorageChange = () => {
      if (!user) {
        setSavedItems(getSavedItems());
      }
    };

    window.addEventListener('bookmarksUpdated', handleStorageChange);

    return () => {
      window.removeEventListener('bookmarksUpdated', handleStorageChange);
      if (unsubscribeFirestore) {
        unsubscribeFirestore();
      }
    };
  }, [user]);

  // Save an item
  const saveBookmarkItem = useCallback(async (partialItem: Partial<SavedItem> & { id: string; title: string }) => {
    const articleMeta = mockArticles.find(a => a.id === partialItem.id);
    const fullItem: SavedItem = {
      id: partialItem.id,
      title: partialItem.title || articleMeta?.title || 'Saved Legal Article',
      url: partialItem.url || `/article/${partialItem.id}`,
      type: partialItem.type || 'article',
      category: partialItem.category || articleMeta?.category || 'Regulatory Guidance',
      categoryId: partialItem.categoryId || articleMeta?.categoryId || 'general',
      readTime: partialItem.readTime || articleMeta?.readTime || 5,
      offlineExcerpt: partialItem.offlineExcerpt || articleMeta?.excerpt || '',
      offlineImageUrl: partialItem.offlineImageUrl || articleMeta?.imageUrl || '',
      authorName: partialItem.authorName || articleMeta?.author?.name || 'Legal Analyst',
      dateSaved: new Date().toISOString(),
    };

    // Optimistically update local state immediately
    setSavedItems(prev => {
      const exists = prev.some(i => i.id === fullItem.id);
      if (exists) {
        return prev.map(i => i.id === fullItem.id ? { ...i, ...fullItem } : i);
      }
      return [fullItem, ...prev];
    });

    saveItemLocal(fullItem);

    if (user) {
      await saveToCloud(fullItem, user);
      showToast({
        type: 'success',
        message: 'Saved to your personal dashboard',
        articleTitle: fullItem.title,
        articleId: fullItem.id
      });
    } else {
      showToast({
        type: 'info',
        message: 'Bookmarked locally. Sign in with Google to sync across all devices.',
        articleTitle: fullItem.title,
        articleId: fullItem.id
      });
    }
  }, [user, showToast]);

  // Remove an item
  const removeBookmarkItem = useCallback(async (id: string) => {
    const removedItem = savedItems.find(i => i.id === id);

    // Optimistically update local state
    setSavedItems(prev => prev.filter(i => i.id !== id));
    removeItemLocal(id);

    if (user) {
      await removeFromCloud(id, user);
    }

    showToast({
      type: 'removed',
      message: 'Removed from your personal dashboard',
      articleTitle: removedItem?.title,
      articleId: id
    });
  }, [savedItems, user, showToast]);

  // Toggle bookmark helper
  const toggleBookmark = useCallback(async (partialItem: Partial<SavedItem> & { id: string; title: string }): Promise<boolean> => {
    const currentlySaved = isBookmarked(partialItem.id);
    if (currentlySaved) {
      await removeBookmarkItem(partialItem.id);
      return false;
    } else {
      await saveBookmarkItem(partialItem);
      return true;
    }
  }, [isBookmarked, removeBookmarkItem, saveBookmarkItem]);

  // Clear all bookmarks
  const clearAllBookmarks = useCallback(async () => {
    const itemsToDelete = [...savedItems];
    setSavedItems([]);
    clearLocal();

    if (user) {
      for (const item of itemsToDelete) {
        await removeFromCloud(item.id, user);
      }
    }

    showToast({
      type: 'info',
      message: 'All saved articles cleared from your dashboard.'
    });
  }, [savedItems, user, showToast]);

  // Manually trigger cloud sync
  const syncCloud = useCallback(async (): Promise<number> => {
    if (!user) return 0;
    setIsSyncing(true);
    try {
      const count = await syncLocalBookmarksToCloud(user);
      showToast({
        type: 'success',
        message: `Synced ${count} bookmark${count === 1 ? '' : 's'} to your cloud dashboard.`
      });
      return count;
    } finally {
      setIsSyncing(false);
    }
  }, [user, showToast]);

  const value = {
    savedItems,
    savedIds,
    isBookmarked,
    toggleBookmark,
    saveBookmark: saveBookmarkItem,
    removeBookmark: removeBookmarkItem,
    clearAllBookmarks,
    syncCloud,
    count: savedItems.length,
    loading,
    isSyncing,
    feedback,
    clearFeedback,
  };

  return (
    <BookmarkContext.Provider value={value}>
      {children}
    </BookmarkContext.Provider>
  );
};
