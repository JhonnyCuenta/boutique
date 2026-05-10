import { Resend } from 'resend';
import { getAppUrl, getSupportEmail } from '@/lib/env';
import { getPrisma } from '@/lib/prisma';

let resendClient: Resend | null = null;

function getResendClient() {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return null;
  if (!resendClient) resendClient = new Resend(key);
  return resendClient;
}

type DeliveryEmailItem = {
  productName: string;
  licenseKey: string;
  downloadUrl: string;
};

export async function sendDeliveryEmail(orderId: string, to: string, customerName: string, items: DeliveryEmailItem[]) {
  const prisma = getPrisma();
  const subject = `Votre achat MW Developpement - ${items.length} script${items.length > 1 ? 's' : ''}`;
  const from = process.env.FROM_EMAIL || 'MW Developpement <noreply@example.com>';
  const resend = getResendClient();

  if (!resend) {
    await prisma.emailDeliveryLog.create({
      data: {
        orderId,
        to,
        subject,
        status: 'SKIPPED',
        error: 'RESEND_API_KEY manquant',
      },
    });
    return { skipped: true };
  }

  const html = `
    <div style="font-family:Inter,Arial,sans-serif;background:#070707;color:#f7f3ea;padding:32px">
      <div style="max-width:640px;margin:auto;border:1px solid rgba(249,115,22,.35);border-radius:18px;padding:28px;background:#101115">
        <h1 style="margin:0 0 10px;color:#f6c453">MW Developpement</h1>
        <p>Bonjour ${escapeHtml(customerName)},</p>
        <p>Votre paiement est valide. Voici vos acces de telechargement et vos cles licence.</p>
        ${items
          .map(
            (item) => `
              <div style="border:1px solid rgba(255,255,255,.12);border-radius:14px;padding:18px;margin:18px 0;background:#0a0b0d">
                <h2 style="font-size:18px;margin:0 0 10px">${escapeHtml(item.productName)}</h2>
                <p style="margin:0 0 10px;color:#d6d3ca">Cle licence:</p>
                <code style="display:block;background:#050505;border:1px solid rgba(249,115,22,.35);padding:12px;border-radius:10px;color:#f6c453">${escapeHtml(item.licenseKey)}</code>
                <p><a href="${item.downloadUrl}" style="color:#fb923c;font-weight:700">Telecharger le script</a></p>
              </div>
            `,
          )
          .join('')}
        <p style="color:#b9b3a7">Les liens expirent automatiquement pour proteger vos fichiers. En cas de souci, contactez ${escapeHtml(getSupportEmail())}.</p>
        <p style="color:#777">Commande: ${escapeHtml(orderId)} - ${escapeHtml(getAppUrl())}</p>
      </div>
    </div>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      html,
      headers: {
        'Idempotency-Key': `delivery-${orderId}`,
      },
    });

    if (error) {
      await prisma.emailDeliveryLog.create({
        data: { orderId, to, subject, status: 'FAILED', error: JSON.stringify(error).slice(0, 1000) },
      });
      return { error };
    }

    await prisma.emailDeliveryLog.create({
      data: { orderId, to, subject, status: 'SENT', providerId: data?.id },
    });
    return { data };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur email inconnue';
    await prisma.emailDeliveryLog.create({
      data: { orderId, to, subject, status: 'FAILED', error: message.slice(0, 1000) },
    });
    return { error: message };
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
