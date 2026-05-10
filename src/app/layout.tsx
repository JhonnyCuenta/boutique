import type { Metadata } from 'next';
import './globals.css';
import { SiteNav } from '@/components/site-nav';

export const metadata: Metadata = {
  title: 'MW Developpement - Scripts FiveM Premium',
  description: 'Boutique premium de scripts FiveM ESX/QBCore, mapping, HUD, jobs, anticheat et packs zombies.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <SiteNav />
        {children}
      </body>
    </html>
  );
}
