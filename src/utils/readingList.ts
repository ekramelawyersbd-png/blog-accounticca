import { mockArticles } from '../data/mockData';

export interface SavedItem {
  id: string;
  title: string;
  type: 'article' | 'policy' | 'section';
  url: string;
  dateSaved: string;
  offlineContent?: string;
  offlineExcerpt?: string;
  offlineImageUrl?: string;
  category?: string;
  categoryId?: string;
  readTime?: number;
  authorName?: string;
  tags?: string[];
}

export function getSavedItems(): SavedItem[] {
  try {
    const items = localStorage.getItem('readingList');
    return items ? JSON.parse(items) : [];
  } catch (e) {
    console.error('Failed to read readingList from localStorage', e);
    return [];
  }
}

export function saveItem(item: SavedItem) {
  const items = getSavedItems();
  
  // Try to enrich article data if not already provided
  let enrichedItem: SavedItem = { ...item };
  if (item.type === 'article' || !item.type) {
    const found = mockArticles.find(a => a.id === item.id);
    if (found) {
      enrichedItem = {
        ...enrichedItem,
        title: enrichedItem.title || found.title,
        category: enrichedItem.category || found.category,
        categoryId: enrichedItem.categoryId || found.categoryId,
        offlineExcerpt: enrichedItem.offlineExcerpt || found.excerpt,
        offlineImageUrl: enrichedItem.offlineImageUrl || found.imageUrl,
        offlineContent: enrichedItem.offlineContent || found.content,
        readTime: enrichedItem.readTime || found.readTime,
        authorName: enrichedItem.authorName || found.author?.name,
        tags: enrichedItem.tags || found.tags,
      };
    }
  }

  const index = items.findIndex(i => i.id === item.id);
  if (index === -1) {
    items.unshift(enrichedItem); // Most recently bookmarked first
  } else {
    items[index] = { ...items[index], ...enrichedItem };
  }

  try {
    localStorage.setItem('readingList', JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save readingList to localStorage', e);
  }
  window.dispatchEvent(new Event('bookmarksUpdated'));
}

export function removeItem(id: string) {
  const items = getSavedItems();
  const newItems = items.filter(i => i.id !== id);
  try {
    localStorage.setItem('readingList', JSON.stringify(newItems));
  } catch (e) {
    console.error('Failed to update readingList in localStorage', e);
  }
  window.dispatchEvent(new Event('bookmarksUpdated'));
}

export function isItemSaved(id: string): boolean {
  const items = getSavedItems();
  return items.some(i => i.id === id);
}

export function clearSavedItems() {
  try {
    localStorage.removeItem('readingList');
  } catch (e) {
    console.error('Failed to clear readingList from localStorage', e);
  }
  window.dispatchEvent(new Event('bookmarksUpdated'));
}
