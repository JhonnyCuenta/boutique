import { AdminShell } from '@/components/admin-shell';
import { requireOwner } from '@/lib/auth';
import { getPrisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function AdminLicensesPage() {
  await requireOwner();
  const licenses = await getPrisma().license.findMany({
    orderBy: { createdAt: 'desc' },
    take: 150,
    include: {
      product: true,
      downloadTokens: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  });

  return (
    <AdminShell title="Licences clients">
      <section className="admin-panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Produit</th>
                <th>Client</th>
                <th>Cle</th>
                <th>Statut</th>
                <th>Dernier lien</th>
              </tr>
            </thead>
            <tbody>
              {licenses.map((license) => {
                const token = license.downloadTokens[0];
                return (
                  <tr key={license.id}>
                    <td>{license.createdAt.toLocaleString('fr-FR')}</td>
                    <td>{license.product.name}</td>
                    <td>{license.customerEmail}</td>
                    <td>
                      <code>{license.key}</code>
                    </td>
                    <td>{license.status}</td>
                    <td>{token ? `${token.uses}/${token.maxUses} - expire ${token.expiresAt.toLocaleDateString('fr-FR')}` : '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  );
}
