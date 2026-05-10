import { get } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';
import { hashToken } from '@/lib/crypto';
import { getPrisma } from '@/lib/prisma';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const prisma = getPrisma();
  const tokenHash = hashToken(token);
  const download = await prisma.downloadToken.findUnique({
    where: { tokenHash },
    include: {
      license: {
        include: {
          product: {
            include: {
              assets: {
                where: { isActive: true },
                orderBy: { createdAt: 'desc' },
                take: 1,
              },
            },
          },
        },
      },
    },
  });

  if (!download || download.expiresAt < new Date() || download.uses >= download.maxUses || download.license.status !== 'ACTIVE') {
    return NextResponse.json({ error: 'Lien de telechargement expire ou invalide' }, { status: 403 });
  }

  const asset = download.license.product.assets[0];
  if (!asset) {
    return NextResponse.json({ error: 'Fichier non disponible, contactez le support' }, { status: 404 });
  }

  const blob = await get(asset.blobPath, { access: 'private' });
  if (!blob?.stream) {
    return NextResponse.json({ error: 'Fichier introuvable dans le stockage prive' }, { status: 404 });
  }

  await prisma.downloadToken.update({
    where: { id: download.id },
    data: { uses: { increment: 1 } },
  });

  return new NextResponse(blob.stream as BodyInit, {
    headers: {
      'Content-Type': blob.headers.get('content-type') || 'application/zip',
      'Content-Disposition': `attachment; filename="${asset.fileName}"`,
      'Cache-Control': 'no-store',
    },
  });
}
