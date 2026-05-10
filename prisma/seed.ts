import bcrypt from 'bcryptjs';
import { PrismaClient, ProductBadge, ProductCategory, ProductStatus, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

const products = [
  {
    slug: 'mw-hud-neon',
    name: 'MW HUD Neon',
    category: ProductCategory.UI_HUD,
    shortDescription: 'HUD FiveM moderne, responsive et optimise RP.',
    description: 'Interface HUD premium avec statut, argent, job, carburant, notifications et design dark orange.',
    priceCents: 2499,
    imageUrl: '/images/inventory-preview.png',
    badge: ProductBadge.BEST_SELLER,
    frameworks: ['ESX', 'QBCore'],
    tags: ['HUD', 'NUI', 'Optimise'],
    includes: ['client.lua', 'server.lua', 'config.lua', 'web build'],
    version: '1.2.0',
  },
  {
    slug: 'mw-zombie-pack',
    name: 'MW Pack Zombies',
    category: ProductCategory.ZOMBIES,
    shortDescription: 'Systeme apocalypse avec hordes, loot et zones contaminees.',
    description: 'Pack zombie RP configurable avec spawn securise, cooldowns serveur et events optimises.',
    priceCents: 3999,
    imageUrl: '/images/inventory-v1-preview.png',
    badge: ProductBadge.NEW,
    frameworks: ['ESX'],
    tags: ['Zombie', 'Survival', 'Events'],
    includes: ['config.lua', 'client.lua', 'server.lua', 'sql optionnel'],
    version: '1.0.0',
  },
  {
    slug: 'mw-anticheat-lite',
    name: 'MW Anticheat Lite',
    category: ProductCategory.ANTICHEAT,
    shortDescription: 'Protection simple contre spam events, injections et abus communs.',
    description: 'Anticheat leger avec logs Discord, limitations events sensibles et protections cote serveur.',
    priceCents: 2999,
    imageUrl: '/images/esx-logo.png',
    badge: ProductBadge.PREMIUM,
    frameworks: ['ESX', 'QBCore'],
    tags: ['Security', 'Logs', 'Cooldown'],
    includes: ['server.lua', 'config.lua', 'webhook logs'],
    version: '1.1.0',
  },
  {
    slug: 'mw-police-suite',
    name: 'MW Police Suite',
    category: ProductCategory.POLICE,
    shortDescription: 'Pack police RP avec actions propres et validations serveur.',
    description: 'Suite police complete: fouille, menottes, amendes, appels, garage et logs staff.',
    priceCents: 3499,
    imageUrl: '/images/inventory-preview.png',
    badge: ProductBadge.BEST_SELLER,
    frameworks: ['ESX'],
    tags: ['Police', 'Job', 'RP'],
    includes: ['job config', 'client.lua', 'server.lua', 'locales/fr.lua'],
    version: '1.3.0',
  },
  {
    slug: 'mw-ems-care',
    name: 'MW EMS Care',
    category: ProductCategory.EMS,
    shortDescription: 'Job EMS immersif avec soins, brancard et facturation.',
    description: 'Script EMS configurable, compatible ox_inventory et pense pour serveurs RP FR/Maroc.',
    priceCents: 2899,
    imageUrl: '/images/inventory-v1-preview.png',
    badge: ProductBadge.NEW,
    frameworks: ['ESX'],
    tags: ['EMS', 'Medical', 'RP'],
    includes: ['client.lua', 'server.lua', 'config.lua'],
    version: '1.0.0',
  },
  {
    slug: 'mw-mapping-hub',
    name: 'MW Mapping Hub',
    category: ProductCategory.MAPPING_MLO,
    shortDescription: 'Pack mapping premium pour zones RP et points de vente.',
    description: 'Selection MLO/mapping avec previews et guide installation FiveM.',
    priceCents: 4599,
    imageUrl: '/images/esx-logo.png',
    badge: ProductBadge.PREMIUM,
    frameworks: ['Standalone'],
    tags: ['MLO', 'Mapping', 'Assets'],
    includes: ['stream', 'fxmanifest.lua', 'readme installation'],
    version: '1.0.0',
  },
];

async function upsertOwner(index: 1 | 2) {
  const email = process.env[`OWNER${index}_EMAIL`]?.trim().toLowerCase();
  const password = process.env[`OWNER${index}_PASSWORD`]?.trim();
  const name = process.env[`OWNER${index}_NAME`]?.trim() || `Owner MW ${index}`;

  if (!email || !password) {
    console.warn(`OWNER${index}_EMAIL ou OWNER${index}_PASSWORD manquant: compte ignore.`);
    return;
  }

  if (password.length < 8) {
    throw new Error(`OWNER${index}_PASSWORD doit faire au moins 8 caracteres.`);
  }

  const hash = await bcrypt.hash(password, 12);
  await prisma.user.upsert({
    where: { email },
    update: { password: hash, name, role: UserRole.OWNER },
    create: { email, password: hash, name, role: UserRole.OWNER },
  });
}

async function main() {
  await upsertOwner(1);
  await upsertOwner(2);

  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: { ...product, status: ProductStatus.PUBLISHED },
      create: { ...product, status: ProductStatus.PUBLISHED },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
