import { ProductBadge, ProductCategory, ProductStatus } from '@prisma/client';
import { getPrisma } from '@/lib/prisma';

export type PublicProduct = {
  id: string;
  slug: string;
  name: string;
  category: ProductCategory;
  shortDescription: string;
  description: string;
  priceCents: number;
  currency: string;
  imageUrl: string;
  badge: ProductBadge | null;
  frameworks: string[];
  tags: string[];
  includes: string[];
  version: string;
  createdAt: Date;
};

const fallbackProducts: PublicProduct[] = [
  {
    id: 'demo-hud',
    slug: 'mw-hud-neon',
    name: 'MW HUD Neon',
    category: ProductCategory.UI_HUD,
    shortDescription: 'HUD FiveM moderne, responsive et optimise RP.',
    description: 'Interface HUD premium avec statut, argent, job, carburant et notifications.',
    priceCents: 2499,
    currency: 'EUR',
    imageUrl: '/images/inventory-preview.png',
    badge: ProductBadge.BEST_SELLER,
    frameworks: ['ESX', 'QBCore'],
    tags: ['HUD', 'NUI', 'Optimise'],
    includes: ['client.lua', 'server.lua', 'config.lua'],
    version: '1.2.0',
    createdAt: new Date(0),
  },
  {
    id: 'demo-zombies',
    slug: 'mw-zombie-pack',
    name: 'MW Pack Zombies',
    category: ProductCategory.ZOMBIES,
    shortDescription: 'Systeme apocalypse avec hordes, loot et zones contaminees.',
    description: 'Pack zombie RP configurable avec spawn securise et events optimises.',
    priceCents: 3999,
    currency: 'EUR',
    imageUrl: '/images/inventory-v1-preview.png',
    badge: ProductBadge.NEW,
    frameworks: ['ESX'],
    tags: ['Zombie', 'Survival'],
    includes: ['config.lua', 'client.lua', 'server.lua'],
    version: '1.0.0',
    createdAt: new Date(0),
  },
  {
    id: 'demo-anticheat',
    slug: 'mw-anticheat-lite',
    name: 'MW Anticheat Lite',
    category: ProductCategory.ANTICHEAT,
    shortDescription: 'Protection simple contre spam events, injections et abus communs.',
    description: 'Anticheat leger avec logs Discord et protections cote serveur.',
    priceCents: 2999,
    currency: 'EUR',
    imageUrl: '/images/esx-logo.png',
    badge: ProductBadge.PREMIUM,
    frameworks: ['ESX', 'QBCore'],
    tags: ['Security', 'Logs'],
    includes: ['server.lua', 'config.lua'],
    version: '1.1.0',
    createdAt: new Date(0),
  },
];

export async function getPublishedProducts() {
  if (!process.env.DATABASE_URL) {
    return fallbackProducts;
  }

  const prisma = getPrisma();
  try {
    return prisma.product.findMany({
      where: { status: ProductStatus.PUBLISHED },
      orderBy: [{ badge: 'asc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        slug: true,
        name: true,
        category: true,
        shortDescription: true,
        description: true,
        priceCents: true,
        currency: true,
        imageUrl: true,
        badge: true,
        frameworks: true,
        tags: true,
        includes: true,
        version: true,
        createdAt: true,
      },
    });
  } catch (error) {
    console.warn('Produits DB indisponibles, fallback demo utilise:', error);
    return fallbackProducts;
  }
}

export async function getAdminProducts() {
  const prisma = getPrisma();
  return prisma.product.findMany({
    orderBy: { updatedAt: 'desc' },
    include: {
      assets: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });
}
