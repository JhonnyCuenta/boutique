import { NextRequest, NextResponse } from 'next/server';
import { AuthError, requireOwnerApi } from '@/lib/auth';
import { getPrisma } from '@/lib/prisma';
import { normalizeProductInput } from '@/lib/validators';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireOwnerApi();
    const { id } = await params;
    const data = normalizeProductInput(await request.json());
    const product = await getPrisma().product.update({ where: { id }, data });
    return NextResponse.json({ product });
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status });
    const message = error instanceof Error ? error.message : 'Modification produit impossible';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireOwnerApi();
    const { id } = await params;
    await getPrisma().product.update({ where: { id }, data: { status: 'ARCHIVED' } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status });
    throw error;
  }
}
