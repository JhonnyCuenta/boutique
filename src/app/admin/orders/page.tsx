import { AdminShell } from '@/components/admin-shell';
import { requireOwner } from '@/lib/auth';
import { formatPrice } from '@/lib/format';
import { getPrisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function AdminOrdersPage() {
  await requireOwner();
  const orders = await getPrisma().order.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: { items: true },
  });

  return (
    <AdminShell title="Commandes PayPal">
      <section className="admin-panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Client</th>
                <th>Statut</th>
                <th>PayPal</th>
                <th>Total</th>
                <th>Produits</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>{order.createdAt.toLocaleString('fr-FR')}</td>
                  <td>
                    {order.customerName}
                    <br />
                    <span className="muted">{order.customerEmail}</span>
                  </td>
                  <td>{order.status}</td>
                  <td>{order.paypalCaptureId || order.paypalOrderId || '-'}</td>
                  <td>{formatPrice(order.amountCents, order.currency)}</td>
                  <td>{order.items.map((item) => item.name).join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  );
}
