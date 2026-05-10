import { AdminProductsClient, type AdminProduct } from '@/components/admin-products-client';
import { AdminShell } from '@/components/admin-shell';
import { requireOwner } from '@/lib/auth';
import { getAdminProducts } from '@/lib/products';

export const dynamic = 'force-dynamic';

export default async function AdminProductsPage() {
  await requireOwner();
  const products = await getAdminProducts();
  const serialized: AdminProduct[] = products.map((product) => ({
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
    status: product.status,
    frameworks: product.frameworks,
    tags: product.tags,
    includes: product.includes,
    version: product.version,
    assets: product.assets.map((asset) => ({
      id: asset.id,
      fileName: asset.fileName,
      version: asset.version,
      isActive: asset.isActive,
      createdAt: asset.createdAt.toISOString(),
    })),
  }));

  return (
    <AdminShell title="Produits & prix">
      <AdminProductsClient initialProducts={serialized} />
    </AdminShell>
  );
}
