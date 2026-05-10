import { NextRequest, NextResponse } from 'next/server';
import { fulfillPaidOrder } from '@/lib/delivery';
import { capturePayPalOrder } from '@/lib/paypal';
import { markOrderPaidFromCapture } from '@/lib/payments';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { paypalOrderId?: string };
    if (!body.paypalOrderId) {
      return NextResponse.json({ error: 'paypalOrderId manquant' }, { status: 400 });
    }

    const capture = await capturePayPalOrder(body.paypalOrderId);
    const paid = await markOrderPaidFromCapture(capture);
    const delivery = await fulfillPaidOrder(paid.order.id, paid.captureId);

    return NextResponse.json({ success: true, orderId: paid.order.id, delivery });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Capture PayPal impossible';
    console.error('Capture PayPal error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
