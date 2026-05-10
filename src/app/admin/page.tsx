import { AdminShell } from '@/components/admin-shell';
import { requireOwner } from '@/lib/auth';
import { formatPrice } from '@/lib/format';
import { getPrisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  await requireOwner();
  const prisma = getPrisma();
  const [products, orders, licenses, revenue, recentOrders] = await Promise.all([
    prisma.product.count(),
    prisma.order.count(),
    prisma.license.count(),
    prisma.order.aggregate({
      where: { status: { in: ['PAID', 'FULFILLED'] } },
      _sum: { amountCents: true },
    }),
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { items: true },
    }),
  ]);

  return (
    <AdminShell title="Dashboard owner">
      <div className="admin-stat-grid">
        <div>
          <span>Produits</span>
          <strong>{products}</strong>
        </div>
        <div>
          <span>Commandes</span>
          <strong>{orders}</strong>
        </div>
        <div>
          <span>Licences</span>
          <strong>{licenses}</strong>
        </div>
        <div>
          <span>CA valide</span>
          <strong>{formatPrice(revenue._sum.amountCents || 0)}</strong>
        </div>
      </div>

      <section className="admin-panel">
        <h2>Dernieres commandes</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Client</th>
                <th>Statut</th>
                <th>Total</th>
                <th>Items</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id}>
                  <td>{order.customerEmail}</td>
                  <td>{order.status}</td>
                  <td>{formatPrice(order.amountCents, order.currency)}</td>
                  <td>{order.items.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  );
}
