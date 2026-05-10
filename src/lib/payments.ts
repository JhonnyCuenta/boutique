import { OrderStatus } from '@prisma/client';
import { extractCapture, type PayPalCaptureResponse } from '@/lib/paypal';
import { getPrisma } from '@/lib/prisma';

export async function markOrderPaidFromCapture(data: PayPalCaptureResponse) {
  const prisma = getPrisma();
  const capture = extractCapture(data);

  if (!capture.orderId || !capture.captureId || capture.status !== 'COMPLETED') {
    throw new Error('Capture PayPal non complete');
  }

  const order = await prisma.order.findUnique({
    where: { id: capture.orderId },
    include: { items: true },
  });

  if (!order) {
    throw new Error('Commande locale introuvable');
  }

  const expectedValue = (order.amountCents / 100).toFixed(2);
  if (capture.currency !== order.currency || capture.value !== expectedValue) {
    throw new Error('Montant PayPal incoherent');
  }

  await prisma.paymentEvent.upsert({
    where: { eventId: `capture:${capture.captureId}` },
    update: {
      processedAt: new Date(),
      payload: data,
      paypalOrderId: data.id,
      captureId: capture.captureId,
    },
    create: {
      eventId: `capture:${capture.captureId}`,
      type: 'PAYMENT.CAPTURE.COMPLETED',
      paypalOrderId: data.id,
      captureId: capture.captureId,
      payload: data,
      processedAt: new Date(),
    },
  });

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: {
      status: OrderStatus.PAID,
      paidAt: new Date(),
      paypalCaptureId: capture.captureId,
    },
  });

  return { order: updated, captureId: capture.captureId };
}
