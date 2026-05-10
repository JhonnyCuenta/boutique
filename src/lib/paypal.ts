import type { Order, OrderItem, Product } from '@prisma/client';
import { requireEnv } from '@/lib/env';

type PayPalAccessTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
};

export type PayPalCaptureResponse = {
  id: string;
  status: string;
  purchase_units?: Array<{
    reference_id?: string;
    custom_id?: string;
    amount?: { currency_code?: string; value?: string };
    payments?: {
      captures?: Array<{
        id?: string;
        status?: string;
        amount?: { currency_code?: string; value?: string };
      }>;
    };
  }>;
};

let cachedToken: { value: string; expiresAt: number } | null = null;

export function getPayPalBaseUrl() {
  return process.env.PAYPAL_ENV === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
}

export async function getPayPalAccessToken() {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.value;
  }

  const clientId = requireEnv('PAYPAL_CLIENT_ID');
  const clientSecret = requireEnv('PAYPAL_CLIENT_SECRET');
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch(`${getPayPalBaseUrl()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      authorization: `Basic ${credentials}`,
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`PayPal OAuth refuse: ${response.status}`);
  }

  const data = (await response.json()) as PayPalAccessTokenResponse;
  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + Math.max(60, data.expires_in - 60) * 1000,
  };

  return cachedToken.value;
}

export function centsToPayPalValue(cents: number) {
  return (cents / 100).toFixed(2);
}

export function getPayPalClientId() {
  return process.env.PAYPAL_CLIENT_ID || '';
}

export async function createPayPalOrder(
  order: Order & { items: Array<OrderItem & { product: Product }> },
) {
  const accessToken = await getPayPalAccessToken();
  const currency = order.currency;

  const response = await fetch(`${getPayPalBaseUrl()}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json',
      prefer: 'return=representation',
      'paypal-request-id': `create-${order.id}`,
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: order.id,
          custom_id: order.id,
          invoice_id: `MW-${order.id}`,
          description: `Commande MW Developpement ${order.id}`,
          amount: {
            currency_code: currency,
            value: centsToPayPalValue(order.amountCents),
            breakdown: {
              item_total: {
                currency_code: currency,
                value: centsToPayPalValue(order.amountCents),
              },
            },
          },
          items: order.items.map((item) => ({
            name: item.name.slice(0, 127),
            sku: item.product.slug.slice(0, 127),
            quantity: String(item.quantity),
            category: 'DIGITAL_GOODS',
            unit_amount: {
              currency_code: currency,
              value: centsToPayPalValue(item.priceCents),
            },
          })),
        },
      ],
    }),
    cache: 'no-store',
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`PayPal create order refuse: ${response.status} ${text.slice(0, 300)}`);
  }

  return response.json() as Promise<{ id: string; status: string }>;
}

export async function capturePayPalOrder(paypalOrderId: string) {
  const accessToken = await getPayPalAccessToken();
  const response = await fetch(`${getPayPalBaseUrl()}/v2/checkout/orders/${paypalOrderId}/capture`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json',
      prefer: 'return=representation',
      'paypal-request-id': `capture-${paypalOrderId}`,
    },
    body: '{}',
    cache: 'no-store',
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`PayPal capture refuse: ${response.status} ${text.slice(0, 300)}`);
  }

  return response.json() as Promise<PayPalCaptureResponse>;
}

export async function verifyPayPalWebhookSignature(headers: Headers, event: unknown) {
  const webhookId = requireEnv('PAYPAL_WEBHOOK_ID');
  const accessToken = await getPayPalAccessToken();
  const body = {
    auth_algo: headers.get('paypal-auth-algo'),
    cert_url: headers.get('paypal-cert-url'),
    transmission_id: headers.get('paypal-transmission-id'),
    transmission_sig: headers.get('paypal-transmission-sig'),
    transmission_time: headers.get('paypal-transmission-time'),
    webhook_id: webhookId,
    webhook_event: event,
  };

  const response = await fetch(`${getPayPalBaseUrl()}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  if (!response.ok) {
    return false;
  }

  const data = (await response.json()) as { verification_status?: string };
  return data.verification_status === 'SUCCESS';
}

export function extractCapture(data: PayPalCaptureResponse) {
  const unit = data.purchase_units?.[0];
  const capture = unit?.payments?.captures?.[0];
  return {
    orderId: unit?.custom_id || unit?.reference_id,
    captureId: capture?.id,
    status: capture?.status || data.status,
    currency: capture?.amount?.currency_code || unit?.amount?.currency_code,
    value: capture?.amount?.value || unit?.amount?.value,
  };
}
