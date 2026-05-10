import { Storefront } from '@/components/storefront';
import { getPublishedProducts } from '@/lib/products';
import { toStoreProducts } from '@/lib/serialize';

export const dynamic = 'force-dynamic';

export default async function ScriptsPage() {
  const products = toStoreProducts(await getPublishedProducts());
  return (
    <main className="page-main">
      <header className="page-hero">
        <h1>Scripts FiveM premium</h1>
        <p>ESX, QBCore, HUD, jobs, police, EMS, anticheat et packs zombies prets a installer.</p>
      </header>
      <Storefront products={products} compact />
    </main>
  );
}
