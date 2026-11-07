export type Category = 
  | 'Corporate Law'
  | 'Income Tax'
  | 'VAT & Customs'
  | 'Business & Startup'
  | 'Legal Documentation'
  | 'Civil & Criminal Law'
  | 'Latest Legal Updates'
  | 'Compliance'
  | 'Legal Updates'
  | 'Tax Updates'
  | 'Corporate Tax'
  | 'Accounting & Finance'
  | 'Accounting Software'
  | 'Accounticca Updates';

export interface Author {
  id: string;
  name: string;
  role: string;
  avatarUrl: string;
  bio?: string;
}

export interface Article {
  id: string;
  title: string;
  metaTitle?: string;
  metaDescription?: string;
  excerpt: string;
  content: string;
  categoryId: string;
  category: Category;
  author: Author;
  publishedAt: string;
  readTime: number;
  imageUrl: string;
  galleryImages?: { url: string; caption?: string }[];
  tags: string[];
  likes?: number;
  comments?: number;
  isExpertOpinion?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'author' | 'admin';
  avatarUrl: string;
}
