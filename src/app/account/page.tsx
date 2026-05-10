import Link from 'next/link';
import { KeyRound, PackageCheck, ReceiptText, ShieldCheck } from 'lucide-react';
import type { License } from '@prisma/client';
import { LogoutButton } from '@/components/logout-button';
import { formatPrice } from '@/lib/format';
import { getPrisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function AccountPage() {
  const user = await requireUser();
  const prisma = getPrisma();
  const orders = await prisma.order.findMany({
    where: {
      OR: [{ customerId: user.id }, { customerEmail: user.email }],
    },
    orderBy: { createdAt: 'desc' },
    include: {
      items: {
        include: {
          license: true,
        },
      },
    },
  });

  const licenses = orders.flatMap((order) =>
    order.items.map((item) => item.license).filter((license): license is License => Boolean(license)),
  );

  return (
    <main className="account-page">
      <section className="account-hero">
        <div>
          <span className="section-kicker">
            <ShieldCheck size={15} />
            Espace client
          </span>
          <h1>Bienvenue, {user.name}</h1>
          <p>Retrouvez vos commandes, vos cles licence et le statut de livraison de vos scripts MW Developpement.</p>
        </div>
        <div className="account-actions">
          {user.role === 'OWNER' ? (
            <Link className="button primary" href="/admin">
              Panel owner
            </Link>
          ) : null}
          <LogoutButton />
        </div>
      </section>

      <section className="admin-stat-grid account-stats">
        <div>
          <span>Commandes</span>
          <strong>{orders.length}</strong>
        </div>
        <div>
          <span>Licences</span>
          <strong>{licenses.length}</strong>
        </div>
        <div>
          <span>Email</span>
          <strong>{user.email}</strong>
        </div>
      </section>

      <section className="admin-panel account-panel">
        <h2>
          <ReceiptText size={18} />
          Mes commandes
        </h2>
        {orders.length === 0 ? (
          <div className="empty-state">
            <PackageCheck size={24} />
            <p>Aucune commande pour le moment.</p>
            <Link className="button primary" href="/#boutique">
              Voir la boutique
            </Link>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Statut</th>
                  <th>Total</th>
                  <th>Produits</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>{order.createdAt.toLocaleDateString('fr-FR')}</td>
                    <td>{order.status}</td>
                    <td>{formatPrice(order.amountCents, order.currency)}</td>
                    <td>{order.items.map((item) => item.name).join(', ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="admin-panel account-panel">
        <h2>
          <KeyRound size={18} />
          Mes licences
        </h2>
        {licenses.length === 0 ? (
          <p className="muted">Les cles licence apparaitront ici apres un paiement valide.</p>
        ) : (
          <div className="license-list">
            {licenses.map((license) => (
              <div key={license.id} className="license-card">
                <span>{license.status}</span>
                <strong>{license.key}</strong>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
