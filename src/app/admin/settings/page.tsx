import { AdminShell } from '@/components/admin-shell';
import { requireOwner } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const checks = [
  ['DATABASE_URL', 'Base PostgreSQL'],
  ['PAYPAL_CLIENT_ID', 'PayPal client id'],
  ['PAYPAL_CLIENT_SECRET', 'PayPal secret'],
  ['PAYPAL_WEBHOOK_ID', 'PayPal webhook'],
  ['RESEND_API_KEY', 'Email Resend'],
  ['BLOB_READ_WRITE_TOKEN', 'Vercel Blob prive'],
  ['JWT_SECRET', 'Session owner'],
];

export default async function AdminSettingsPage() {
  await requireOwner();

  return (
    <AdminShell title="Configuration">
      <section className="admin-panel settings-list">
        {checks.map(([key, label]) => (
          <div key={key}>
            <span>{label}</span>
            <strong className={process.env[key] ? 'status-ok' : 'status-missing'}>{process.env[key] ? 'Configure' : 'Manquant'}</strong>
          </div>
        ))}
      </section>
    </AdminShell>
  );
}
