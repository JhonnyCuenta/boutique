import Link from 'next/link';
import { Package, Receipt, Settings, ShieldCheck, Ticket } from 'lucide-react';
import { LogoutButton } from '@/components/logout-button';

const adminLinks = [
  { href: '/admin', label: 'Dashboard', icon: ShieldCheck },
  { href: '/admin/products', label: 'Produits', icon: Package },
  { href: '/admin/orders', label: 'Commandes', icon: Receipt },
  { href: '/admin/licenses', label: 'Licences', icon: Ticket },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export function AdminShell({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <main className="admin-layout">
      <aside className="admin-sidebar">
        <Link className="brand admin-brand" href="/admin">
          <span className="brand-mark">MW</span>
          <span>Owner Panel</span>
        </Link>
        <nav>
          {adminLinks.map((item) => (
            <Link href={item.href} key={item.href}>
              <item.icon size={17} />
              {item.label}
            </Link>
          ))}
        </nav>
        <LogoutButton />
      </aside>
      <section className="admin-content">
        <header className="admin-header">
          <span className="section-kicker">MW Developpement</span>
          <h1>{title}</h1>
        </header>
        {children}
      </section>
    </main>
  );
}
