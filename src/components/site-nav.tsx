'use client';

import Link from 'next/link';
import { Menu, Shield, ShoppingBag, UserRound, X } from 'lucide-react';
import { useState } from 'react';
import { navItems } from '@/config/store';

export function SiteNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="site-nav">
      <Link className="brand" href="/">
        <span className="brand-mark">MW</span>
        <span>MW Developpement</span>
      </Link>

      <nav className="desktop-nav">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            {item.label}
          </Link>
        ))}
        <a href={process.env.NEXT_PUBLIC_DISCORD_URL || 'https://discord.gg/mwdev'} target="_blank" rel="noreferrer">
          Discord
        </a>
      </nav>

      <div className="nav-actions">
        <Link className="nav-login" href="/account">
          <UserRound size={16} />
          Compte
        </Link>
        <Link className="nav-login" href="/login">
          <Shield size={16} />
          Connexion
        </Link>
        <Link className="nav-cta" href="/#boutique">
          <ShoppingBag size={17} />
          Boutique
        </Link>
        <button className="mobile-menu-button" type="button" onClick={() => setOpen((value) => !value)} aria-label="Menu">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open ? (
        <div className="mobile-nav">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>
              {item.label}
            </Link>
          ))}
          <Link href="/login" onClick={() => setOpen(false)}>
            Connexion
          </Link>
          <Link href="/account" onClick={() => setOpen(false)}>
            Compte client
          </Link>
        </div>
      ) : null}
    </header>
  );
}
