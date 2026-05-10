import { Mail, MessageCircle, ShieldCheck } from 'lucide-react';
import { getDiscordUrl, getSupportEmail } from '@/lib/env';

export default function SupportPage() {
  return (
    <main className="page-main">
      <header className="page-hero">
        <h1>Support MW</h1>
        <p>Installation, licences, telechargements et questions avant achat.</p>
      </header>

      <section className="support-grid">
        <a className="support-card" href={getDiscordUrl()} target="_blank" rel="noreferrer">
          <MessageCircle size={28} />
          <h2>Discord</h2>
          <p>Le plus rapide pour les tickets, previews, updates et demandes custom.</p>
        </a>
        <a className="support-card" href={`mailto:${getSupportEmail()}`}>
          <Mail size={28} />
          <h2>Email</h2>
          <p>{getSupportEmail()}</p>
        </a>
        <div className="support-card" id="cgu">
          <ShieldCheck size={28} />
          <h2>CGU</h2>
          <p>Les scripts sont livres avec licence personnelle. Revente, leak et partage public interdits.</p>
        </div>
      </section>
    </main>
  );
}
