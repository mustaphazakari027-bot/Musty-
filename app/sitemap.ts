import type { MetadataRoute } from 'next';
import { queryProducts, getCategories } from '@/lib/catalog';

const base = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');

export default function sitemap(): MetadataRoute.Sitemap {
  const products = queryProducts({});
  const categories = getCategories();

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: 'daily', priority: 1 },
    { url: `${base}/shop`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/about`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/contact`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/help`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/shop?sort=newest`, changeFrequency: 'daily', priority: 0.7 },
    { url: `${base}/shop?offers=1`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${base}/shop?gender=men`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/shop?gender=women`, changeFrequency: 'weekly', priority: 0.8 },
  ];

  return [
    ...staticPages,
    ...categories.map((c) => ({
      url: `${base}/shop?category=${c.slug}`,
      changeFrequency: 'weekly' as const,
      priority: 0.75,
    })),
    ...products.map((p) => ({
      url: `${base}/product/${p.slug}`,
      lastModified: new Date(p.createdAt),
      changeFrequency: 'weekly' as const,
      priority: 0.85,
    })),
  ];
}
