import React from 'react';
import { Article } from '../types';
import { ArticleSEO, SEO, ServiceSEO, ToolSEO, CourseSEO, SEOMeta, PageSEO } from './SEO';

export interface BlogSEOProps {
  article: Article;
  canonicalUrl?: string;
  siteName?: string;
  customSchema?: Record<string, any> | Array<Record<string, any>>;
}

export function BlogSEO({ article, canonicalUrl, siteName, customSchema }: BlogSEOProps) {
  const legalServiceSchema = {
    '@context': 'https://schema.org',
    '@type': 'LegalService',
    name: 'E-Lawyers & Accounticca',
    url: typeof window !== 'undefined' ? window.location.origin : 'https://accounticca.com',
    telephone: '+8801335230170',
    email: 'info@accounticca.com',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'G-5, BTI Centara Grand, 144-144/1 Green Road',
      addressLocality: 'Dhaka',
      postalCode: '1205',
      addressCountry: 'BD'
    }
  };

  const schemasToInject = customSchema 
    ? (Array.isArray(customSchema) ? [legalServiceSchema, ...customSchema] : [legalServiceSchema, customSchema])
    : legalServiceSchema;

  return (
    <ArticleSEO
      article={article}
      canonicalUrl={canonicalUrl}
      siteName={siteName}
      customSchema={schemasToInject}
    />
  );
}

// Re-export core SEO utilities from this file as well for convenience
export { SEO, ArticleSEO, ServiceSEO, ToolSEO, CourseSEO, SEOMeta, PageSEO };
export default BlogSEO;
