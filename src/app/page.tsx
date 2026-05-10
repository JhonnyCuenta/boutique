import Link from 'next/link';
import { ArrowRight, CreditCard, Download, ShieldCheck } from 'lucide-react';
import { MotionReveal } from '@/components/motion-reveal';
import { Storefront } from '@/components/storefront';
import { features, stats, testimonials, Star, stars } from '@/config/store';
import { getDiscordUrl } from '@/lib/env';
import { getPublishedProducts } from '@/lib/products';
import { toStoreProducts } from '@/lib/serialize';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const products = toStoreProducts(await getPublishedProducts());

  return (
    <main>
      <section className="hero-section">
        <div className="hero-bg" />
        <div className="hero-content">
          <MotionReveal className="hero-copy">
            <h1>MW Developpement</h1>
            <p className="hero-lead">Des scripts FiveM premium optimises pour votre serveur.</p>
            <p className="hero-text">
              Boutique haut de gamme pour ESX, QBCore, UI/HUD, mapping, jobs et packs zombies. Paiement PayPal simple,
              livraison automatique par email et cles licence generees instantanement.
            </p>
            <div className="hero-actions">
              <a className="button primary" href="#boutique">
                Decouvrir la boutique <ArrowRight size={18} />
              </a>
              <a className="button ghost" href={getDiscordUrl()} target="_blank" rel="noreferrer">
                Discord support
              </a>
            </div>
            <div className="hero-trust">
              <span>
                <ShieldCheck size={16} />
                Scripts securises
              </span>
              <span>
                <CreditCard size={16} />
                PayPal
              </span>
              <span>
                <Download size={16} />
                Livraison auto
              </span>
            </div>
          </MotionReveal>

          <MotionReveal className="hero-visual">
            <div className="visual-frame">
              <img src="/images/inventory-v1-preview.png" alt="" />
              <div className="visual-card top">
                <strong>License generated</strong>
                <span>MWD-9K4F-2A8Q-7N1P</span>
              </div>
              <div className="visual-card bottom">
                <strong>Delivery status</strong>
                <span>PayPal completed - email sent</span>
              </div>
            </div>
          </MotionReveal>
        </div>
      </section>

      <Storefront products={products} />

      <section className="section feature-section">
        <div className="section-heading">
          <span className="section-kicker">Qualite serveur RP</span>
          <h2>Tout ce qu un owner attend d une ressource premium</h2>
        </div>
        <div className="feature-grid">
          {features.map((feature) => (
            <MotionReveal className="feature-card" key={feature.title}>
              <feature.icon size={24} />
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
            </MotionReveal>
          ))}
        </div>
      </section>

      <section className="stats-band">
        {stats.map((stat) => (
          <div key={stat.label}>
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
          </div>
        ))}
      </section>

      <section className="section testimonials">
        <div className="section-heading">
          <span className="section-kicker">Avis clients</span>
          <h2>Des retours propres de vrais owners RP</h2>
        </div>
        <div className="testimonial-grid">
          {testimonials.map((item) => (
            <article className="testimonial-card" key={item.name}>
              <div className="stars">
                {stars.map((star) => (
                  <Star key={star} size={16} fill="currentColor" />
                ))}
              </div>
              <p>{item.text}</p>
              <strong>{item.name}</strong>
              <span>{item.server}</span>
            </article>
          ))}
        </div>
      </section>

      <footer className="footer">
        <div>
          <strong>MW Developpement</strong>
          <p>Scripts FiveM premium, licences automatiques et support Discord.</p>
        </div>
        <nav>
          <a href={getDiscordUrl()} target="_blank" rel="noreferrer">
            Discord
          </a>
          <Link href="/support">Contact</Link>
          <Link href="/login">Owner</Link>
          <a href="https://github.com/" target="_blank" rel="noreferrer">
            GitHub
          </a>
          <Link href="/support#cgu">CGU</Link>
        </nav>
      </footer>
    </main>
  );
}
