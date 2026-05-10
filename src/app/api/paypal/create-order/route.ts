import { OrderStatus } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { getUserFromCookies } from '@/lib/auth';
import { createPayPalOrder } from '@/lib/paypal';
import { getPrisma } from '@/lib/prisma';
import { checkoutSchema } from '@/lib/validators';

export async function POST(request: NextRequest) {
  try {
    const parsed = checkoutSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Panier ou informations client invalides' }, { status: 400 });
    }

    const currentUser = await getUserFromCookies();
    const { customerEmail, customerName, items } = parsed.data;
    const prisma = getPrisma();
    const productIds = [...new Set(items.map((item) => item.productId))];
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, status: 'PUBLISHED' },
    });
    const productMap = new Map(products.map((product) => [product.id, product]));

    const orderLines = items.map((item) => {
      const product = productMap.get(item.productId);
      if (!product) throw new Error('Produit indisponible');
      return {
        product,
        quantity: item.quantity,
        lineTotal: product.priceCents * item.quantity,
      };
    });

    const amountCents = orderLines.reduce((total, line) => total + line.lineTotal, 0);
    const currency = orderLines[0]?.product.currency || 'EUR';
    if (!orderLines.every((line) => line.product.currency === currency)) {
      return NextResponse.json({ error: 'Le panier contient plusieurs devises' }, { status: 400 });
    }

    const order = await prisma.order.create({
      data: {
        customerId: currentUser?.id,
        customerEmail: customerEmail.trim().toLowerCase(),
        customerName: customerName.trim(),
        amountCents,
        currency,
        status: OrderStatus.PENDING,
        items: {
          create: orderLines.map((line) => ({
            productId: line.product.id,
            name: line.product.name,
            priceCents: line.product.priceCents,
            quantity: line.quantity,
          })),
        },
      },
      include: {
        items: { include: { product: true } },
      },
    });

    const paypalOrder = await createPayPalOrder(order);
    await prisma.order.update({
      where: { id: order.id },
      data: { paypalOrderId: paypalOrder.id },
    });

    return NextResponse.json({ orderId: order.id, paypalOrderId: paypalOrder.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur PayPal inconnue';
    console.error('Create PayPal order error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
