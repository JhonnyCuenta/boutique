import { put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';
import { AuthError, requireOwnerApi } from '@/lib/auth';
import { safeFileName } from '@/lib/format';
import { getPrisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    await requireOwnerApi();

    const formData = await request.formData();
    const productId = String(formData.get('productId') || '');
    const version = String(formData.get('version') || '1.0.0').slice(0, 40);
    const file = formData.get('file');

    if (!productId || !(file instanceof File)) {
      return NextResponse.json({ error: 'Produit et fichier requis' }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith('.zip')) {
      return NextResponse.json({ error: 'Seuls les fichiers .zip sont acceptes' }, { status: 400 });
    }

    const product = await getPrisma().product.findUnique({ where: { id: productId } });
    if (!product) {
      return NextResponse.json({ error: 'Produit introuvable' }, { status: 404 });
    }

    const path = `products/${product.slug}/${Date.now()}-${safeFileName(file.name)}`;
    const blob = await put(path, file, {
      access: 'private',
      addRandomSuffix: true,
    });

    await getPrisma().productAsset.updateMany({
      where: { productId, isActive: true },
      data: { isActive: false },
    });

    const asset = await getPrisma().productAsset.create({
      data: {
        productId,
        blobPath: blob.pathname || blob.url,
        fileName: safeFileName(file.name),
        fileSize: file.size,
        version,
        isActive: true,
      },
    });

    return NextResponse.json({ asset });
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status });
    const message = error instanceof Error ? error.message : 'Upload impossible';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
