import type { PublicProduct } from '@/lib/products';
import type { StoreProduct } from '@/components/storefront';

export function toStoreProducts(products: PublicProduct[]): StoreProduct[] {
  return products.map((product) => ({
    id: product.id,
    slug: product.slug,
    name: product.name,
    category: product.category,
    shortDescription: product.shortDescription,
    description: product.description,
    priceCents: product.priceCents,
    currency: product.currency,
    imageUrl: product.imageUrl,
    badge: product.badge,
    frameworks: product.frameworks,
    tags: product.tags,
    includes: product.includes,
    version: product.version,
  }));
}
