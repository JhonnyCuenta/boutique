import { ProductBadge, ProductCategory, ProductStatus } from '@prisma/client';
import { z } from 'zod';
import { safeSlug } from '@/lib/format';

export const cartItemSchema = z.object({
  productId: z.string().min(8),
  quantity: z.number().int().min(1).max(5).default(1),
});

export const checkoutSchema = z.object({
  customerEmail: z.string().email().max(180),
  customerName: z.string().min(2).max(100),
  items: z.array(cartItemSchema).min(1).max(10),
});

export const loginSchema = z.object({
  email: z.string().email().max(180),
  password: z.string().min(1).max(160),
});

export const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().max(180),
  password: z.string().min(8).max(160),
});

export const productSchema = z.object({
  id: z.string().optional(),
  slug: z.string().min(2).max(90).optional(),
  name: z.string().min(2).max(120),
  category: z.nativeEnum(ProductCategory),
  shortDescription: z.string().min(8).max(180),
  description: z.string().min(12).max(1200),
  priceCents: z.number().int().min(100).max(999999),
  currency: z.string().length(3).default('EUR'),
  imageUrl: z.string().min(1).max(500),
  badge: z.nativeEnum(ProductBadge).nullable().optional(),
  status: z.nativeEnum(ProductStatus).default(ProductStatus.PUBLISHED),
  frameworks: z.array(z.string().min(1).max(40)).max(8).default([]),
  tags: z.array(z.string().min(1).max(40)).max(12).default([]),
  includes: z.array(z.string().min(1).max(100)).max(16).default([]),
  version: z.string().min(1).max(40).default('1.0.0'),
});

export function normalizeProductInput(input: unknown) {
  const parsed = productSchema.parse(input);
  return {
    ...parsed,
    slug: parsed.slug ? safeSlug(parsed.slug) : safeSlug(parsed.name),
    currency: parsed.currency.toUpperCase(),
    frameworks: parsed.frameworks.map((item) => item.trim()).filter(Boolean),
    tags: parsed.tags.map((item) => item.trim()).filter(Boolean),
    includes: parsed.includes.map((item) => item.trim()).filter(Boolean),
  };
}
