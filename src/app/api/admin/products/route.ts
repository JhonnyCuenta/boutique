import { NextRequest, NextResponse } from 'next/server';
import { AuthError, requireOwnerApi } from '@/lib/auth';
import { getPrisma } from '@/lib/prisma';
import { normalizeProductInput } from '@/lib/validators';

export async function GET() {
  try {
    await requireOwnerApi();
    const products = await getPrisma().product.findMany({
      orderBy: { updatedAt: 'desc' },
      include: { assets: { orderBy: { createdAt: 'desc' } } },
    });
    return NextResponse.json({ products });
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status });
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireOwnerApi();
    const data = normalizeProductInput(await request.json());
    const product = await getPrisma().product.create({ data });
    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status });
    const message = error instanceof Error ? error.message : 'Creation produit impossible';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
