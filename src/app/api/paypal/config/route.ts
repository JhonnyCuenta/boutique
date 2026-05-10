import { NextResponse } from 'next/server';
import { getPayPalClientId } from '@/lib/paypal';

export async function GET() {
  return NextResponse.json({
    clientId: getPayPalClientId(),
    currency: 'EUR',
    env: process.env.PAYPAL_ENV === 'live' ? 'live' : 'sandbox',
  });
}
