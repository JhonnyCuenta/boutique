import { OrderStatus } from '@prisma/client';
import { generateLicenseKey, hashToken, randomToken } from '@/lib/crypto';
import { getAppUrl } from '@/lib/env';
import { sendDeliveryEmail } from '@/lib/email';
import { getPrisma } from '@/lib/prisma';

const DOWNLOAD_TOKEN_DAYS = 7;

export async function fulfillPaidOrder(orderId: string, captureId?: string) {
  const prisma = getPrisma();

  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
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
            license: true,
          },
        },
      },
    });

    if (!order) {
      return { status: 'missing' as const };
    }

    if (order.status === OrderStatus.FULFILLED) {
      return { status: 'already-fulfilled' as const, orderId: order.id };
    }

    const emailItems: Array<{ productName: string; licenseKey: string; downloadUrl: string }> = [];
    const expiresAt = new Date(Date.now() + DOWNLOAD_TOKEN_DAYS * 24 * 60 * 60 * 1000);

    for (const item of order.items) {
      const license =
        item.license ||
        (await tx.license.create({
          data: {
            key: generateLicenseKey(),
            orderItemId: item.id,
            productId: item.productId,
            customerEmail: order.customerEmail,
          },
        }));

      const rawToken = randomToken(36);
      await tx.downloadToken.create({
        data: {
          tokenHash: hashToken(rawToken),
          licenseId: license.id,
          expiresAt,
          maxUses: 5,
        },
      });

      emailItems.push({
        productName: item.name,
        licenseKey: license.key,
        downloadUrl: `${getAppUrl()}/api/download/${rawToken}`,
      });
    }

    const updated = await tx.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.FULFILLED,
        paidAt: order.paidAt || new Date(),
        fulfilledAt: new Date(),
        paypalCaptureId: captureId || order.paypalCaptureId,
      },
    });

    return {
      status: 'fulfilled' as const,
      order: updated,
      emailItems,
    };
  });

  if (result.status === 'fulfilled') {
    await sendDeliveryEmail(result.order.id, result.order.customerEmail, result.order.customerName, result.emailItems);
  }

  return result;
}
