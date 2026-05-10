import { OrderStatus } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { fulfillPaidOrder } from '@/lib/delivery';
import { getPrisma } from '@/lib/prisma';
import { verifyPayPalWebhookSignature } from '@/lib/paypal';

type PayPalWebhookEvent = {
  id?: string;
  event_type?: string;
  resource?: {
    id?: string;
    status?: string;
    amount?: { currency_code?: string; value?: string };
    custom_id?: string;
    invoice_id?: string;
    supplementary_data?: {
      related_ids?: {
        order_id?: string;
      };
    };
  };
};

export async function POST(request: NextRequest) {
  const event = (await request.json()) as PayPalWebhookEvent;
  const verified = await verifyPayPalWebhookSignature(request.headers, event);
  if (!verified) {
    return NextResponse.json({ error: 'Signature PayPal invalide' }, { status: 401 });
  }

  const prisma = getPrisma();
  const eventId = event.id;
  const type = event.event_type || 'UNKNOWN';
  if (!eventId) {
    return NextResponse.json({ error: 'Event id manquant' }, { status: 400 });
  }

  const captureId = event.resource?.id;
  const paypalOrderId = event.resource?.supplementary_data?.related_ids?.order_id;
  const existing = await prisma.paymentEvent.findUnique({ where: { eventId } });
  if (existing?.processedAt) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  await prisma.paymentEvent.upsert({
    where: { eventId },
    update: {
      type,
      paypalOrderId,
      captureId,
      payload: event,
    },
    create: {
      eventId,
      type,
      paypalOrderId,
      captureId,
      payload: event,
    },
  });

  if (type === 'PAYMENT.CAPTURE.COMPLETED' && captureId) {
    const order = await prisma.order.findFirst({
      where: {
        OR: [
          paypalOrderId ? { paypalOrderId } : undefined,
          event.resource?.custom_id ? { id: event.resource.custom_id } : undefined,
          event.resource?.invoice_id ? { id: event.resource.invoice_id.replace(/^MW-/, '') } : undefined,
        ].filter(Boolean) as Array<{ paypalOrderId?: string; id?: string }>,
      },
    });

    if (order) {
      const expectedValue = (order.amountCents / 100).toFixed(2);
      if (event.resource?.amount?.currency_code === order.currency && event.resource.amount.value === expectedValue) {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: OrderStatus.PAID,
            paidAt: order.paidAt || new Date(),
            paypalCaptureId: captureId,
          },
        });
        await fulfillPaidOrder(order.id, captureId);
      }
    }
  }

  if (type === 'PAYMENT.CAPTURE.DENIED' && paypalOrderId) {
    await prisma.order.updateMany({
      where: { paypalOrderId, status: { in: [OrderStatus.PENDING, OrderStatus.APPROVED] } },
      data: { status: OrderStatus.FAILED },
    });
  }

  if ((type === 'PAYMENT.CAPTURE.REFUNDED' || type === 'PAYMENT.CAPTURE.REVERSED') && captureId) {
    await prisma.order.updateMany({
      where: { paypalCaptureId: captureId },
      data: { status: OrderStatus.REFUNDED },
    });
  }

  await prisma.paymentEvent.update({ where: { eventId }, data: { processedAt: new Date() } });
  return NextResponse.json({ ok: true });
}
