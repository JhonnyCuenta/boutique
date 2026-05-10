import { Storefront } from '@/components/storefront';
import { getPublishedProducts } from '@/lib/products';
import { toStoreProducts } from '@/lib/serialize';

export const dynamic = 'force-dynamic';

export default async function MappingPage() {
  const products = toStoreProducts(await getPublishedProducts());
  return (
    <main className="page-main">
      <header className="page-hero">
        <h1>Mapping & MLO</h1>
        <p>Assets et mappings premium pour donner une vraie identite visuelle a votre serveur RP.</p>
      </header>
      <Storefront products={products} initialCategory="MAPPING_MLO" compact />
    </main>
  );
}
